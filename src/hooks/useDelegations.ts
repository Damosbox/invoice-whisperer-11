import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';

export interface Delegation {
  id: string;
  delegator_id: string;
  delegate_id: string;
  start_date: string;
  end_date: string;
  reason: string | null;
  is_active: boolean;
  created_at: string;
  delegator_profile?: { full_name: string | null; email: string };
  delegate_profile?: { full_name: string | null; email: string };
}

export interface CreateDelegationData {
  delegate_id: string;
  start_date: string;
  end_date: string;
  reason?: string;
}

export function useDelegations() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['delegations'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('approver_delegations')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Fetch profiles for enrichment
      const userIds = [...new Set(data.flatMap(d => [d.delegator_id, d.delegate_id]))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, full_name, email')
        .in('user_id', userIds);

      const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);

      return data.map(d => ({
        ...d,
        delegator_profile: profileMap.get(d.delegator_id),
        delegate_profile: profileMap.get(d.delegate_id),
      })) as Delegation[];
    },
    enabled: !!user,
  });
}

export function useMyDelegations() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['my-delegations', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from('approver_delegations')
        .select('*')
        .eq('delegator_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Delegation[];
    },
    enabled: !!user,
  });
}

export function useActiveDelegationsForUser(userId: string | undefined) {
  return useQuery({
    queryKey: ['active-delegations', userId],
    queryFn: async () => {
      if (!userId) return [];

      const today = new Date().toISOString().split('T')[0];
      
      const { data, error } = await supabase
        .from('approver_delegations')
        .select('*')
        .eq('delegate_id', userId)
        .eq('is_active', true)
        .lte('start_date', today)
        .gte('end_date', today);

      if (error) throw error;
      return data as Delegation[];
    },
    enabled: !!userId,
  });
}

export function useCreateDelegation() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (data: CreateDelegationData) => {
      if (!user?.id) throw new Error('User not authenticated');

      const { data: result, error } = await supabase
        .from('approver_delegations')
        .insert({
          ...data,
          delegator_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['delegations'] });
      queryClient.invalidateQueries({ queryKey: ['my-delegations'] });
      toast.success('Délégation créée avec succès');
    },
    onError: (error: Error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });
}

export function useDeactivateDelegation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('approver_delegations')
        .update({ is_active: false })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['delegations'] });
      queryClient.invalidateQueries({ queryKey: ['my-delegations'] });
      toast.success('Délégation désactivée');
    },
    onError: (error: Error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });
}
