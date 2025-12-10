import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/contexts/AuthContext';
import { useUserRoles, getRoleLabel, getRoleBadgeColor } from '@/hooks/useUserRoles';
import { cn } from '@/lib/utils';

interface UserRoleBadgeProps {
  collapsed?: boolean;
}

export function UserRoleBadge({ collapsed = false }: UserRoleBadgeProps) {
  const { user } = useAuth();
  const { data: roles, isLoading } = useUserRoles(user?.id);

  if (isLoading) {
    return <Skeleton className="h-6 w-20" />;
  }

  if (!roles || roles.length === 0) {
    return null;
  }

  const primaryRole = roles[0];

  if (collapsed) {
    return (
      <div 
        className={cn(
          "w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium border",
          getRoleBadgeColor(primaryRole)
        )}
        title={getRoleLabel(primaryRole)}
      >
        {primaryRole.slice(0, 2).toUpperCase()}
      </div>
    );
  }

  return (
    <Badge 
      variant="outline" 
      className={cn("text-xs", getRoleBadgeColor(primaryRole))}
    >
      {getRoleLabel(primaryRole)}
    </Badge>
  );
}
