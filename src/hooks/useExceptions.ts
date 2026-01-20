import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Tables } from '@/integrations/supabase/types';
import { toast } from 'sonner';

type Invoice = Tables<'invoices'>;

export interface ExceptionInvoice extends Invoice {
  suppliers: { name: string } | null;
}

export function useExceptions() {
  return useQuery({
    queryKey: ['exceptions'],
    queryFn: async (): Promise<ExceptionInvoice[]> => {
      const { data, error } = await supabase
        .from('invoices')
        .select('*, suppliers(name)')
        .or('status.eq.exception,status.eq.litige,has_anomalies.eq.true')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
  });
}

export function useResolveException() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      id, 
      action, 
      newStatus 
    }: { 
      id: string; 
      action: 'validate' | 'reject' | 'reprocess';
      newStatus?: string;
    }) => {
      let updates: Partial<Invoice> = {};

      switch (action) {
        case 'validate':
          updates = {
            status: 'a_approuver',
            has_anomalies: false,
            anomaly_types: null,
            anomaly_details: null,
          };
          break;
        case 'reject':
          // Create a dispute entry first
          const { error: disputeError } = await supabase
            .from('disputes')
            .insert({
              invoice_id: id,
              category: 'other',
              description: 'Litige créé depuis la gestion des exceptions',
              status: 'open',
              priority: 'medium',
            });
          
          if (disputeError) throw disputeError;
          
          updates = {
            status: 'litige',
          };
          break;
        case 'reprocess':
          updates = {
            status: 'nouvelle',
            has_anomalies: false,
            anomaly_types: null,
            anomaly_details: null,
            match_status: 'aucun_match',
            match_score: null,
            match_details: null,
          };
          break;
      }

      const { data, error } = await supabase
        .from('invoices')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['exceptions'] });
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['disputes'] });
      
      const messages = {
        validate: 'Exception validée, facture envoyée en approbation',
        reject: 'Litige créé avec succès',
        reprocess: 'Facture renvoyée au traitement',
      };
      toast.success(messages[variables.action]);
    },
    onError: (error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });
}
