import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface SupplierFormData {
  name: string;
  identifier?: string;
  email?: string;
  phone?: string;
  address?: string;
  iban?: string;
  bic?: string;
  is_critical?: boolean;
  payment_terms_days?: number;
  notes?: string;
}

export function useSuppliers(searchQuery?: string) {
  return useQuery({
    queryKey: ['suppliers', searchQuery],
    queryFn: async () => {
      let query = supabase
        .from('suppliers')
        .select('*')
        .order('name', { ascending: true });

      if (searchQuery && searchQuery.trim()) {
        query = query.or(`name.ilike.%${searchQuery}%,identifier.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });
}

export function useSupplier(id: string | null) {
  return useQuery({
    queryKey: ['supplier', id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase
        .from('suppliers')
        .select('*')
        .eq('id', id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });
}

export function useCreateSupplier() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: SupplierFormData) => {
      const { data: result, error } = await supabase
        .from('suppliers')
        .insert(data)
        .select()
        .single();
      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      toast.success('Fournisseur créé avec succès');
    },
    onError: (error: Error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });
}

export function useUpdateSupplier() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: SupplierFormData }) => {
      const { data: result, error } = await supabase
        .from('suppliers')
        .update(data)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      toast.success('Fournisseur mis à jour avec succès');
    },
    onError: (error: Error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });
}

export function useDeleteSupplier() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('suppliers')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      toast.success('Fournisseur supprimé');
    },
    onError: (error: Error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });
}

export function useImportSuppliers() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (suppliers: SupplierFormData[]) => {
      const { data, error } = await supabase
        .from('suppliers')
        .upsert(suppliers, { onConflict: 'identifier', ignoreDuplicates: false })
        .select();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      toast.success(`${data?.length || 0} fournisseurs importés avec succès`);
    },
    onError: (error: Error) => {
      toast.error(`Erreur d'import: ${error.message}`);
    },
  });
}
