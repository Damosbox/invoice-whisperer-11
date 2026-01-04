import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';

export type DisputeStatus = 'open' | 'in_progress' | 'resolved' | 'closed';
export type DisputeCategory = 'amount_mismatch' | 'quality_issue' | 'delivery_issue' | 'duplicate' | 'missing_po' | 'other';
export type DisputePriority = 'low' | 'medium' | 'high' | 'critical';
export type CommunicationType = 'internal_note' | 'email_sent' | 'email_received' | 'call' | 'meeting';

export interface Dispute {
  id: string;
  invoice_id: string;
  status: DisputeStatus;
  category: DisputeCategory;
  priority: DisputePriority;
  description: string;
  resolution_notes: string | null;
  assigned_to: string | null;
  resolved_by: string | null;
  resolved_at: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  invoice?: {
    invoice_number: string | null;
    amount_ttc: number | null;
    supplier_id: string | null;
    suppliers?: { name: string } | null;
  };
}

export interface DisputeCommunication {
  id: string;
  dispute_id: string;
  type: CommunicationType;
  content: string;
  email_template: string | null;
  recipients: string[] | null;
  created_by: string | null;
  created_at: string;
}

export interface CreateDisputeData {
  invoice_id: string;
  category: DisputeCategory;
  priority?: DisputePriority;
  description: string;
}

export interface CreateCommunicationData {
  dispute_id: string;
  type: CommunicationType;
  content: string;
  email_template?: string;
  recipients?: string[];
}

export function useDisputes(status?: DisputeStatus) {
  return useQuery({
    queryKey: ['disputes', status],
    queryFn: async () => {
      let query = supabase
        .from('disputes')
        .select(`
          *,
          invoice:invoices(
            invoice_number,
            amount_ttc,
            supplier_id,
            suppliers(name)
          )
        `)
        .order('created_at', { ascending: false });

      if (status) {
        query = query.eq('status', status);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Dispute[];
    },
  });
}

export function useDispute(id: string | null) {
  return useQuery({
    queryKey: ['dispute', id],
    queryFn: async () => {
      if (!id) return null;

      const { data, error } = await supabase
        .from('disputes')
        .select(`
          *,
          invoice:invoices(
            invoice_number,
            amount_ttc,
            amount_ht,
            supplier_id,
            issue_date,
            due_date,
            po_number_extracted,
            suppliers(name, email, phone)
          )
        `)
        .eq('id', id)
        .maybeSingle();

      if (error) throw error;
      return data as Dispute & { invoice: any };
    },
    enabled: !!id,
  });
}

export function useDisputeCommunications(disputeId: string | null) {
  return useQuery({
    queryKey: ['dispute-communications', disputeId],
    queryFn: async () => {
      if (!disputeId) return [];

      const { data, error } = await supabase
        .from('dispute_communications')
        .select('*')
        .eq('dispute_id', disputeId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as DisputeCommunication[];
    },
    enabled: !!disputeId,
  });
}

export function useCreateDispute() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (data: CreateDisputeData) => {
      const { data: result, error } = await supabase
        .from('disputes')
        .insert({
          ...data,
          created_by: user?.id,
        })
        .select()
        .single();

      if (error) throw error;

      // Update invoice status to 'litige'
      await supabase
        .from('invoices')
        .update({ status: 'litige' })
        .eq('id', data.invoice_id);

      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['disputes'] });
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      toast.success('Litige créé avec succès');
    },
    onError: (error: Error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });
}

export function useUpdateDispute() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Dispute> }) => {
      const updateData: any = { ...data };

      if (data.status === 'resolved') {
        updateData.resolved_by = user?.id;
        updateData.resolved_at = new Date().toISOString();
      }

      const { data: result, error } = await supabase
        .from('disputes')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['disputes'] });
      queryClient.invalidateQueries({ queryKey: ['dispute'] });
      toast.success('Litige mis à jour');
    },
    onError: (error: Error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });
}

export function useAddCommunication() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (data: CreateCommunicationData) => {
      const { data: result, error } = await supabase
        .from('dispute_communications')
        .insert({
          ...data,
          created_by: user?.id,
        })
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['dispute-communications', variables.dispute_id] });
      toast.success('Communication ajoutée');
    },
    onError: (error: Error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });
}

// Email templates for disputes
export const disputeEmailTemplates = {
  amount_mismatch: {
    subject: 'Écart de montant sur facture #{invoiceNumber}',
    body: `Bonjour,

Nous avons constaté un écart de montant sur la facture #{invoiceNumber}.

Montant facturé : {amount}
Montant attendu : {expectedAmount}
Écart : {discrepancy}

Merci de nous faire parvenir une facture rectificative ou de nous confirmer le montant correct.

Cordialement,
L'équipe Comptabilité`,
  },
  quality_issue: {
    subject: 'Problème qualité - Facture #{invoiceNumber}',
    body: `Bonjour,

Nous avons identifié un problème de qualité concernant la commande liée à la facture #{invoiceNumber}.

Description du problème :
{description}

Nous vous prions de bien vouloir nous contacter pour convenir d'une solution.

Cordialement,
L'équipe Comptabilité`,
  },
  delivery_issue: {
    subject: 'Problème de livraison - Facture #{invoiceNumber}',
    body: `Bonjour,

Nous n'avons pas reçu la livraison complète correspondant à la facture #{invoiceNumber}.

Détails :
{description}

Merci de nous confirmer le statut de la livraison.

Cordialement,
L'équipe Comptabilité`,
  },
  duplicate: {
    subject: 'Doublon potentiel - Facture #{invoiceNumber}',
    body: `Bonjour,

La facture #{invoiceNumber} semble être un doublon d'une facture déjà traitée.

Merci de confirmer si cette facture doit être annulée.

Cordialement,
L'équipe Comptabilité`,
  },
  missing_po: {
    subject: 'Bon de commande manquant - Facture #{invoiceNumber}',
    body: `Bonjour,

Nous avons reçu la facture #{invoiceNumber} mais ne trouvons pas de bon de commande correspondant.

Merci de nous communiquer la référence du BC associé.

Cordialement,
L'équipe Comptabilité`,
  },
  other: {
    subject: 'Demande d\'information - Facture #{invoiceNumber}',
    body: `Bonjour,

Concernant la facture #{invoiceNumber}, nous souhaiterions obtenir des informations complémentaires.

{description}

Cordialement,
L'équipe Comptabilité`,
  },
};
