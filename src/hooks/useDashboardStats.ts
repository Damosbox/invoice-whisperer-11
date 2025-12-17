import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { InvoiceStatus } from '@/types';

export interface DashboardStats {
  totalInvoicesThisMonth: number;
  pendingCount: number;
  validatedCount: number;
  exceptionCount: number;
  totalAmountToPay: number;
  totalAmountPaid: number;
  averageProcessingDays: number;
  overdueInvoices: OverdueInvoice[];
  criticalAlerts: CriticalAlert[];
  invoicesByStatus: StatusCount[];
  invoicesByDay: DailyCount[];
  topSuppliers: SupplierStat[];
}

export interface OverdueInvoice {
  id: string;
  invoice_number: string | null;
  supplier_name: string | null;
  amount_ttc: number | null;
  due_date: string;
  days_overdue: number;
}

export interface CriticalAlert {
  type: 'overdue' | 'exception' | 'anomaly' | 'high_value';
  severity: 'critical' | 'warning' | 'info';
  message: string;
  count: number;
  link?: string;
}

export interface StatusCount {
  status: InvoiceStatus;
  count: number;
  amount: number;
}

export interface DailyCount {
  date: string;
  count: number;
  amount: number;
}

export interface SupplierStat {
  name: string;
  count: number;
  amount: number;
}

export function useDashboardStats() {
  return useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async (): Promise<DashboardStats> => {
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      const today = now.toISOString().split('T')[0];

      // Fetch all invoices with related data
      const { data: invoices, error } = await supabase
        .from('invoices')
        .select(`
          id,
          invoice_number,
          status,
          amount_ttc,
          amount_ht,
          due_date,
          issue_date,
          created_at,
          received_date,
          approved_at,
          has_anomalies,
          supplier_name_extracted,
          supplier:suppliers(name, is_critical)
        `)
        .order('created_at', { ascending: false });

      if (error) throw new Error(error.message);

      const allInvoices = invoices || [];
      
      // This month's invoices
      const thisMonthInvoices = allInvoices.filter(
        inv => new Date(inv.created_at) >= new Date(startOfMonth)
      );

      // Count by status
      const pendingStatuses: InvoiceStatus[] = ['nouvelle', 'a_valider_extraction', 'a_rapprocher', 'a_approuver'];
      const validatedStatuses: InvoiceStatus[] = ['prete_comptabilisation', 'comptabilisee'];
      const exceptionStatuses: InvoiceStatus[] = ['exception', 'litige'];

      const pendingCount = allInvoices.filter(inv => pendingStatuses.includes(inv.status as InvoiceStatus)).length;
      const validatedCount = allInvoices.filter(inv => validatedStatuses.includes(inv.status as InvoiceStatus)).length;
      const exceptionCount = allInvoices.filter(inv => exceptionStatuses.includes(inv.status as InvoiceStatus)).length;

      // Amounts
      const totalAmountToPay = allInvoices
        .filter(inv => !validatedStatuses.includes(inv.status as InvoiceStatus))
        .reduce((sum, inv) => sum + (inv.amount_ttc || 0), 0);

      const totalAmountPaid = allInvoices
        .filter(inv => inv.status === 'comptabilisee')
        .reduce((sum, inv) => sum + (inv.amount_ttc || 0), 0);

      // Average processing time (from received to approved)
      const processedInvoices = allInvoices.filter(inv => inv.approved_at && inv.received_date);
      const avgDays = processedInvoices.length > 0
        ? processedInvoices.reduce((sum, inv) => {
            const received = new Date(inv.received_date!);
            const approved = new Date(inv.approved_at!);
            return sum + Math.ceil((approved.getTime() - received.getTime()) / (1000 * 60 * 60 * 24));
          }, 0) / processedInvoices.length
        : 0;

      // Overdue invoices
      const overdueInvoices: OverdueInvoice[] = allInvoices
        .filter(inv => {
          if (!inv.due_date) return false;
          if (validatedStatuses.includes(inv.status as InvoiceStatus)) return false;
          return new Date(inv.due_date) < new Date(today);
        })
        .map(inv => ({
          id: inv.id,
          invoice_number: inv.invoice_number,
          supplier_name: inv.supplier?.name || inv.supplier_name_extracted,
          amount_ttc: inv.amount_ttc,
          due_date: inv.due_date!,
          days_overdue: Math.ceil((new Date().getTime() - new Date(inv.due_date!).getTime()) / (1000 * 60 * 60 * 24))
        }))
        .sort((a, b) => b.days_overdue - a.days_overdue)
        .slice(0, 5);

      // Critical alerts
      const criticalAlerts: CriticalAlert[] = [];

      if (overdueInvoices.length > 0) {
        criticalAlerts.push({
          type: 'overdue',
          severity: 'critical',
          message: `${overdueInvoices.length} facture(s) en retard de paiement`,
          count: overdueInvoices.length,
          link: '/invoices'
        });
      }

      if (exceptionCount > 0) {
        criticalAlerts.push({
          type: 'exception',
          severity: 'warning',
          message: `${exceptionCount} facture(s) en exception à traiter`,
          count: exceptionCount,
          link: '/exceptions'
        });
      }

      const anomalyCount = allInvoices.filter(inv => inv.has_anomalies).length;
      if (anomalyCount > 0) {
        criticalAlerts.push({
          type: 'anomaly',
          severity: 'warning',
          message: `${anomalyCount} facture(s) avec anomalies détectées`,
          count: anomalyCount,
          link: '/invoices'
        });
      }

      const highValueThreshold = 10000;
      const highValuePending = allInvoices.filter(
        inv => (inv.amount_ttc || 0) > highValueThreshold && pendingStatuses.includes(inv.status as InvoiceStatus)
      ).length;
      if (highValuePending > 0) {
        criticalAlerts.push({
          type: 'high_value',
          severity: 'info',
          message: `${highValuePending} facture(s) >10k€ en attente d'approbation`,
          count: highValuePending,
          link: '/invoices'
        });
      }

      // Invoices by status
      const statusMap = new Map<InvoiceStatus, { count: number; amount: number }>();
      allInvoices.forEach(inv => {
        const status = inv.status as InvoiceStatus;
        const current = statusMap.get(status) || { count: 0, amount: 0 };
        statusMap.set(status, {
          count: current.count + 1,
          amount: current.amount + (inv.amount_ttc || 0)
        });
      });
      const invoicesByStatus: StatusCount[] = Array.from(statusMap.entries()).map(([status, data]) => ({
        status,
        count: data.count,
        amount: data.amount
      }));

      // Invoices by day (last 30 days)
      const last30Days = new Date();
      last30Days.setDate(last30Days.getDate() - 30);
      const dailyMap = new Map<string, { count: number; amount: number }>();
      
      for (let i = 0; i < 30; i++) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        dailyMap.set(date.toISOString().split('T')[0], { count: 0, amount: 0 });
      }

      allInvoices
        .filter(inv => new Date(inv.created_at) >= last30Days)
        .forEach(inv => {
          const date = inv.created_at.split('T')[0];
          const current = dailyMap.get(date) || { count: 0, amount: 0 };
          dailyMap.set(date, {
            count: current.count + 1,
            amount: current.amount + (inv.amount_ttc || 0)
          });
        });

      const invoicesByDay: DailyCount[] = Array.from(dailyMap.entries())
        .map(([date, data]) => ({ date, count: data.count, amount: data.amount }))
        .sort((a, b) => a.date.localeCompare(b.date));

      // Top suppliers
      const supplierMap = new Map<string, { count: number; amount: number }>();
      allInvoices.forEach(inv => {
        const name = inv.supplier?.name || inv.supplier_name_extracted || 'Inconnu';
        const current = supplierMap.get(name) || { count: 0, amount: 0 };
        supplierMap.set(name, {
          count: current.count + 1,
          amount: current.amount + (inv.amount_ttc || 0)
        });
      });
      const topSuppliers: SupplierStat[] = Array.from(supplierMap.entries())
        .map(([name, data]) => ({ name, count: data.count, amount: data.amount }))
        .sort((a, b) => b.amount - a.amount)
        .slice(0, 5);

      return {
        totalInvoicesThisMonth: thisMonthInvoices.length,
        pendingCount,
        validatedCount,
        exceptionCount,
        totalAmountToPay,
        totalAmountPaid,
        averageProcessingDays: Math.round(avgDays * 10) / 10,
        overdueInvoices,
        criticalAlerts,
        invoicesByStatus,
        invoicesByDay,
        topSuppliers
      };
    },
    refetchInterval: 30000, // Refresh every 30 seconds for real-time feel
  });
}
