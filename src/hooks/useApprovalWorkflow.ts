import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { TablesInsert, TablesUpdate } from '@/integrations/supabase/types';
export interface ApprovalRule {
  id: string;
  name: string;
  description: string | null;
  min_amount: number;
  max_amount: number | null;
  is_critical_supplier: boolean;
  required_levels: number;
  level_1_role: string;
  level_2_role: string | null;
  level_3_role: string | null;
  priority: number;
  is_active: boolean;
}

export interface ApprovalHistoryItem {
  id: string;
  invoice_id: string;
  level: number;
  required_role: string;
  approved_by: string | null;
  approved_at: string | null;
  status: 'pending' | 'approved' | 'rejected';
  comment: string | null;
  created_at: string;
  approver_profile?: { full_name: string | null; email: string } | null;
}

const ROLE_LABELS: Record<string, string> = {
  comptable: 'Comptable',
  daf: 'DAF',
  dg: 'DG',
  admin: 'Admin',
  auditeur: 'Auditeur',
};

export const getRoleLabel = (role: string) => ROLE_LABELS[role] || role;

export function useApprovalRules(includeInactive = false) {
  return useQuery({
    queryKey: ['approval-rules', includeInactive],
    queryFn: async (): Promise<ApprovalRule[]> => {
      let query = supabase
        .from('approval_rules')
        .select('*')
        .order('priority', { ascending: false });

      if (!includeInactive) {
        query = query.eq('is_active', true);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
  });
}

export type ApprovalRuleInsert = TablesInsert<'approval_rules'>;
export type ApprovalRuleUpdate = TablesUpdate<'approval_rules'>;

export function useCreateApprovalRule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: ApprovalRuleInsert) => {
      const { error } = await supabase
        .from('approval_rules')
        .insert(data);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['approval-rules'] });
      toast.success('Règle créée avec succès');
    },
    onError: (error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });
}

export function useUpdateApprovalRule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...data }: ApprovalRuleUpdate & { id: string }) => {
      const { error } = await supabase
        .from('approval_rules')
        .update(data)
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['approval-rules'] });
      toast.success('Règle mise à jour');
    },
    onError: (error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });
}

export function useDeleteApprovalRule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('approval_rules')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['approval-rules'] });
      toast.success('Règle supprimée');
    },
    onError: (error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });
}

export function useApprovalHistory(invoiceId: string) {
  return useQuery({
    queryKey: ['approval-history', invoiceId],
    queryFn: async (): Promise<ApprovalHistoryItem[]> => {
      const { data, error } = await supabase
        .from('approval_history')
        .select('*')
        .eq('invoice_id', invoiceId)
        .order('level', { ascending: true });

      if (error) throw error;

      // Fetch approver profiles for approved items
      const approverIds = data?.filter(h => h.approved_by).map(h => h.approved_by) || [];
      let profiles: Record<string, { full_name: string | null; email: string }> = {};
      
      if (approverIds.length > 0) {
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('user_id, full_name, email')
          .in('user_id', approverIds);
        
        profiles = (profilesData || []).reduce((acc, p) => {
          acc[p.user_id] = { full_name: p.full_name, email: p.email };
          return acc;
        }, {} as Record<string, { full_name: string | null; email: string }>);
      }

      return (data || []).map(h => ({
        ...h,
        status: h.status as 'pending' | 'approved' | 'rejected',
        approver_profile: h.approved_by ? profiles[h.approved_by] : null,
      }));
    },
    enabled: !!invoiceId,
  });
}

export function useInitializeApproval() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      invoiceId, 
      amount, 
      isCriticalSupplier 
    }: { 
      invoiceId: string; 
      amount: number; 
      isCriticalSupplier: boolean;
    }) => {
      // Get matching approval rule
      const { data: rules, error: rulesError } = await supabase
        .from('approval_rules')
        .select('*')
        .eq('is_active', true)
        .order('priority', { ascending: false });

      if (rulesError) throw rulesError;

      // Find matching rule
      const matchingRule = rules?.find(rule => {
        const amountMatch = amount >= (rule.min_amount || 0) && 
          (rule.max_amount === null || amount < rule.max_amount);
        const criticalMatch = !rule.is_critical_supplier || isCriticalSupplier;
        return amountMatch && criticalMatch;
      });

      if (!matchingRule) {
        throw new Error('Aucune règle d\'approbation trouvée');
      }

      // Create approval history entries
      const historyEntries = [];
      for (let level = 1; level <= matchingRule.required_levels; level++) {
        const roleKey = `level_${level}_role` as keyof typeof matchingRule;
        const role = matchingRule[roleKey];
        if (role) {
          historyEntries.push({
            invoice_id: invoiceId,
            level,
            required_role: role,
            status: 'pending',
          });
        }
      }

      // Insert history entries
      const { error: historyError } = await supabase
        .from('approval_history')
        .insert(historyEntries);

      if (historyError) throw historyError;

      // Update invoice with approval info
      const { error: updateError } = await supabase
        .from('invoices')
        .update({
          approval_rule_id: matchingRule.id,
          current_approval_level: 1,
          required_approval_levels: matchingRule.required_levels,
          status: 'a_approuver',
        })
        .eq('id', invoiceId);

      if (updateError) throw updateError;

      return { rule: matchingRule, levels: matchingRule.required_levels };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['approval-history'] });
      toast.success(`Workflow d'approbation initialisé (${data.levels} niveau(x))`);
    },
    onError: (error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });
}

export function useApproveInvoice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      invoiceId, 
      level, 
      comment 
    }: { 
      invoiceId: string; 
      level: number; 
      comment?: string;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Non authentifié');

      // Update approval history
      const { error: historyError } = await supabase
        .from('approval_history')
        .update({
          approved_by: user.id,
          approved_at: new Date().toISOString(),
          status: 'approved',
          comment,
        })
        .eq('invoice_id', invoiceId)
        .eq('level', level);

      if (historyError) throw historyError;

      // Get invoice to check levels
      const { data: invoice, error: invoiceError } = await supabase
        .from('invoices')
        .select('required_approval_levels')
        .eq('id', invoiceId)
        .single();

      if (invoiceError) throw invoiceError;

      // Check if all levels are approved
      const isLastLevel = level >= (invoice?.required_approval_levels || 1);

      // Update invoice
      const { error: updateError } = await supabase
        .from('invoices')
        .update({
          current_approval_level: isLastLevel ? level : level + 1,
          status: isLastLevel ? 'prete_comptabilisation' : 'a_approuver',
          approved_by: isLastLevel ? user.id : null,
          approved_at: isLastLevel ? new Date().toISOString() : null,
        })
        .eq('id', invoiceId);

      if (updateError) throw updateError;

      return { isComplete: isLastLevel };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['approval-history'] });
      toast.success(data.isComplete 
        ? 'Facture approuvée - Prête pour comptabilisation' 
        : 'Niveau approuvé - En attente du niveau suivant'
      );
    },
    onError: (error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });
}

export function useRejectInvoice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      invoiceId, 
      level, 
      reason 
    }: { 
      invoiceId: string; 
      level: number; 
      reason: string;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Non authentifié');

      // Update approval history
      const { error: historyError } = await supabase
        .from('approval_history')
        .update({
          approved_by: user.id,
          approved_at: new Date().toISOString(),
          status: 'rejected',
          comment: reason,
        })
        .eq('invoice_id', invoiceId)
        .eq('level', level);

      if (historyError) throw historyError;

      // Update invoice
      const { error: updateError } = await supabase
        .from('invoices')
        .update({
          status: 'exception',
          rejection_reason: reason,
        })
        .eq('id', invoiceId);

      if (updateError) throw updateError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['approval-history'] });
      toast.success('Facture rejetée');
    },
    onError: (error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });
}
