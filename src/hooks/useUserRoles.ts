import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { AppRole } from '@/types';

export function useUserRoles(userId: string | undefined) {
  return useQuery({
    queryKey: ['user-roles', userId],
    queryFn: async (): Promise<AppRole[]> => {
      if (!userId) return [];
      
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId);

      if (error) {
        console.error('Error fetching user roles:', error);
        return [];
      }

      return (data || []).map((r) => r.role as AppRole);
    },
    enabled: !!userId,
  });
}

export function getRoleLabel(role: AppRole): string {
  const labels: Record<AppRole, string> = {
    admin: 'Administrateur',
    daf: 'DAF',
    dg: 'Direction Générale',
    comptable: 'Comptable',
    auditeur: 'Auditeur',
  };
  return labels[role] || role;
}

export function getRoleBadgeColor(role: AppRole): string {
  const colors: Record<AppRole, string> = {
    admin: 'bg-destructive/10 text-destructive border-destructive/30',
    daf: 'bg-primary/10 text-primary border-primary/30',
    dg: 'bg-status-approval/10 text-status-approval border-status-approval/30',
    comptable: 'bg-status-validated/10 text-status-validated border-status-validated/30',
    auditeur: 'bg-muted text-muted-foreground border-border',
  };
  return colors[role] || 'bg-muted text-muted-foreground';
}
