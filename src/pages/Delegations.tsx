import { useState } from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Plus, Calendar, User, X, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  useMyDelegations, 
  useCreateDelegation, 
  useDeactivateDelegation 
} from '@/hooks/useDelegations';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export default function Delegations() {
  const { user } = useAuth();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    delegate_id: '',
    start_date: '',
    end_date: '',
    reason: '',
  });

  const { data: delegations, isLoading } = useMyDelegations();
  const createDelegation = useCreateDelegation();
  const deactivateDelegation = useDeactivateDelegation();

  // Fetch users with approval roles
  const { data: approvers } = useQuery({
    queryKey: ['approvers-for-delegation'],
    queryFn: async () => {
      const { data: roles } = await supabase
        .from('user_roles')
        .select('user_id, role')
        .in('role', ['comptable', 'daf', 'dg', 'admin']);

      if (!roles) return [];

      const userIds = [...new Set(roles.map(r => r.user_id))];

      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, full_name, email')
        .in('user_id', userIds);

      return profiles?.filter(p => p.user_id !== user?.id) || [];
    },
    enabled: dialogOpen,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.delegate_id || !formData.start_date || !formData.end_date) return;

    await createDelegation.mutateAsync(formData);
    setDialogOpen(false);
    setFormData({ delegate_id: '', start_date: '', end_date: '', reason: '' });
  };

  const isActive = (delegation: any) => {
    if (!delegation.is_active) return false;
    const today = new Date();
    const start = new Date(delegation.start_date);
    const end = new Date(delegation.end_date);
    return today >= start && today <= end;
  };

  const activeDelegations = delegations?.filter(isActive) || [];
  const futureDelegations = delegations?.filter(d => 
    d.is_active && new Date(d.start_date) > new Date()
  ) || [];
  const pastDelegations = delegations?.filter(d => 
    !d.is_active || new Date(d.end_date) < new Date()
  ) || [];

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Délégation d'approbation</h1>
          <p className="text-muted-foreground">
            Gérez vos absences et déléguez vos droits d'approbation
          </p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nouvelle délégation
        </Button>
      </div>

      {/* Active Delegations Alert */}
      {activeDelegations.length > 0 && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Vous avez {activeDelegations.length} délégation(s) active(s). Vos approbations seront transférées automatiquement.
          </AlertDescription>
        </Alert>
      )}

      {/* Delegations Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Active */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500" />
              Actives
            </CardTitle>
            <CardDescription>{activeDelegations.length} délégation(s)</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {activeDelegations.map(d => (
              <DelegationCard 
                key={d.id} 
                delegation={d} 
                status="active"
                onDeactivate={() => deactivateDelegation.mutate(d.id)}
              />
            ))}
            {activeDelegations.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">
                Aucune délégation active
              </p>
            )}
          </CardContent>
        </Card>

        {/* Future */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-blue-500" />
              Programmées
            </CardTitle>
            <CardDescription>{futureDelegations.length} délégation(s)</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {futureDelegations.map(d => (
              <DelegationCard 
                key={d.id} 
                delegation={d} 
                status="future"
                onDeactivate={() => deactivateDelegation.mutate(d.id)}
              />
            ))}
            {futureDelegations.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">
                Aucune délégation programmée
              </p>
            )}
          </CardContent>
        </Card>

        {/* Past */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-gray-400" />
              Passées
            </CardTitle>
            <CardDescription>{pastDelegations.length} délégation(s)</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {pastDelegations.slice(0, 5).map(d => (
              <DelegationCard key={d.id} delegation={d} status="past" />
            ))}
            {pastDelegations.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">
                Aucun historique
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Create Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nouvelle délégation</DialogTitle>
            <DialogDescription>
              Déléguez vos droits d'approbation pendant votre absence
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Déléguer à</Label>
              <Select
                value={formData.delegate_id}
                onValueChange={(v) => setFormData({ ...formData, delegate_id: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un approbateur" />
                </SelectTrigger>
                <SelectContent>
                  {approvers?.map(p => (
                    <SelectItem key={p.user_id} value={p.user_id}>
                      {p.full_name || p.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Date de début</Label>
                <Input
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>
              <div className="space-y-2">
                <Label>Date de fin</Label>
                <Input
                  type="date"
                  value={formData.end_date}
                  onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                  min={formData.start_date || new Date().toISOString().split('T')[0]}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Motif (optionnel)</Label>
              <Textarea
                placeholder="Ex: Congés annuels, déplacement professionnel..."
                value={formData.reason}
                onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Annuler
              </Button>
              <Button 
                type="submit" 
                disabled={!formData.delegate_id || !formData.start_date || !formData.end_date}
              >
                Créer la délégation
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function DelegationCard({ 
  delegation, 
  status,
  onDeactivate 
}: { 
  delegation: any; 
  status: 'active' | 'future' | 'past';
  onDeactivate?: () => void;
}) {
  return (
    <div className="p-3 border rounded-lg space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <User className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">
            {delegation.delegate_profile?.full_name || delegation.delegate_profile?.email || 'Utilisateur'}
          </span>
        </div>
        {status !== 'past' && onDeactivate && (
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onDeactivate}>
            <X className="h-3 w-3" />
          </Button>
        )}
      </div>
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Calendar className="h-3 w-3" />
        <span>
          {format(new Date(delegation.start_date), 'dd MMM', { locale: fr })} - {format(new Date(delegation.end_date), 'dd MMM yyyy', { locale: fr })}
        </span>
      </div>
      {delegation.reason && (
        <p className="text-xs text-muted-foreground truncate">{delegation.reason}</p>
      )}
      <Badge variant={status === 'active' ? 'default' : status === 'future' ? 'secondary' : 'outline'} className="text-xs">
        {status === 'active' ? 'Active' : status === 'future' ? 'Programmée' : 'Terminée'}
      </Badge>
    </div>
  );
}
