import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { t } from '@/lib/translations';

export interface SupplierFormData {
  name: string;
  identifier?: string;
  fiscal_identifier?: string;
  company_identifier?: string;
  country?: string;
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
      toast.success(t.suppliers.created);
    },
    onError: (error: Error) => {
      toast.error(t.suppliers.error(error.message));
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
      toast.success(t.suppliers.updated);
    },
    onError: (error: Error) => {
      toast.error(t.suppliers.error(error.message));
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
      toast.success(t.suppliers.deleted);
    },
    onError: (error: Error) => {
      toast.error(t.suppliers.error(error.message));
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
      toast.success(t.suppliers.imported(data?.length || 0));
    },
    onError: (error: Error) => {
      toast.error(t.suppliers.importError(error.message));
    },
  });
}
