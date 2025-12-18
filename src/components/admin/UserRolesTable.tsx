import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Loader2, UserCog } from 'lucide-react';
import { toast } from 'sonner';
import type { AppRole } from '@/types';
import {
  useUsersWithRoles,
  useAddUserRole,
  useRemoveUserRole,
  ALL_ROLES,
  type UserWithRoles,
} from '@/hooks/useUserRolesAdmin';
import { getRoleLabel, getRoleBadgeColor } from '@/hooks/useUserRoles';

export function UserRolesTable() {
  const { data: users, isLoading, error } = useUsersWithRoles();
  const addRole = useAddUserRole();
  const removeRole = useRemoveUserRole();
  const [pendingChange, setPendingChange] = useState<{
    user: UserWithRoles;
    role: AppRole;
    action: 'add' | 'remove';
  } | null>(null);

  const handleRoleToggle = (user: UserWithRoles, role: AppRole, hasRole: boolean) => {
    setPendingChange({
      user,
      role,
      action: hasRole ? 'remove' : 'add',
    });
  };

  const confirmRoleChange = async () => {
    if (!pendingChange) return;

    const { user, role, action } = pendingChange;

    try {
      if (action === 'add') {
        await addRole.mutateAsync({ userId: user.profile.user_id, role });
        toast.success(`Rôle ${getRoleLabel(role)} ajouté à ${user.profile.full_name || user.profile.email}`);
      } else {
        await removeRole.mutateAsync({ userId: user.profile.user_id, role });
        toast.success(`Rôle ${getRoleLabel(role)} retiré de ${user.profile.full_name || user.profile.email}`);
      }
    } catch (err) {
      console.error('Error changing role:', err);
      toast.error('Erreur lors de la modification du rôle');
    } finally {
      setPendingChange(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12 text-destructive">
        Erreur lors du chargement des utilisateurs
      </div>
    );
  }

  if (!users || users.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <UserCog className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p>Aucun utilisateur trouvé</p>
      </div>
    );
  }

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[250px]">Utilisateur</TableHead>
              <TableHead className="w-[200px]">Email</TableHead>
              {ALL_ROLES.map((role) => (
                <TableHead key={role} className="text-center w-[120px]">
                  {getRoleLabel(role)}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.profile.id}>
                <TableCell className="font-medium">
                  {user.profile.full_name || 'Sans nom'}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {user.profile.email}
                </TableCell>
                {ALL_ROLES.map((role) => {
                  const hasRole = user.roles.includes(role);
                  return (
                    <TableCell key={role} className="text-center">
                      <Checkbox
                        checked={hasRole}
                        onCheckedChange={() => handleRoleToggle(user, role, hasRole)}
                        disabled={addRole.isPending || removeRole.isPending}
                      />
                    </TableCell>
                  );
                })}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <AlertDialog open={!!pendingChange} onOpenChange={() => setPendingChange(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {pendingChange?.action === 'add' ? 'Ajouter un rôle' : 'Retirer un rôle'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {pendingChange?.action === 'add' ? (
                <>
                  Voulez-vous ajouter le rôle{' '}
                  <Badge className={getRoleBadgeColor(pendingChange.role)}>
                    {getRoleLabel(pendingChange.role)}
                  </Badge>{' '}
                  à <strong>{pendingChange.user.profile.full_name || pendingChange.user.profile.email}</strong> ?
                </>
              ) : (
                <>
                  Voulez-vous retirer le rôle{' '}
                  <Badge className={pendingChange ? getRoleBadgeColor(pendingChange.role) : ''}>
                    {pendingChange && getRoleLabel(pendingChange.role)}
                  </Badge>{' '}
                  de <strong>{pendingChange?.user.profile.full_name || pendingChange?.user.profile.email}</strong> ?
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={confirmRoleChange}>
              {pendingChange?.action === 'add' ? 'Ajouter' : 'Retirer'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
