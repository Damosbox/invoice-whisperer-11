import { useState } from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { 
  AlertTriangle, 
  Plus, 
  Filter, 
  Eye,
  Building2,
  Euro,
  Clock
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useDisputes, DisputeStatus, DisputeCategory, DisputePriority } from '@/hooks/useDisputes';
import { useNavigate } from 'react-router-dom';

const statusLabels: Record<DisputeStatus, string> = {
  open: 'Ouvert',
  in_progress: 'En cours',
  resolved: 'Résolu',
  closed: 'Fermé',
};

const statusColors: Record<DisputeStatus, string> = {
  open: 'destructive',
  in_progress: 'default',
  resolved: 'secondary',
  closed: 'outline',
};

const categoryLabels: Record<DisputeCategory, string> = {
  amount_mismatch: 'Écart montant',
  quality_issue: 'Qualité',
  delivery_issue: 'Livraison',
  duplicate: 'Doublon',
  missing_po: 'BC manquant',
  other: 'Autre',
};

const priorityLabels: Record<DisputePriority, string> = {
  low: 'Basse',
  medium: 'Moyenne',
  high: 'Haute',
  critical: 'Critique',
};

const priorityColors: Record<DisputePriority, string> = {
  low: 'bg-gray-100 text-gray-700',
  medium: 'bg-blue-100 text-blue-700',
  high: 'bg-orange-100 text-orange-700',
  critical: 'bg-red-100 text-red-700',
};

export default function Disputes() {
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = useState<DisputeStatus | 'all'>('all');
  const [search, setSearch] = useState('');

  const { data: disputes, isLoading } = useDisputes(
    statusFilter !== 'all' ? statusFilter : undefined
  );

  const filteredDisputes = disputes?.filter(d => {
    if (!search) return true;
    const searchLower = search.toLowerCase();
    return (
      d.invoice?.invoice_number?.toLowerCase().includes(searchLower) ||
      d.invoice?.suppliers?.name?.toLowerCase().includes(searchLower) ||
      d.description.toLowerCase().includes(searchLower)
    );
  });

  const stats = {
    open: disputes?.filter(d => d.status === 'open').length || 0,
    in_progress: disputes?.filter(d => d.status === 'in_progress').length || 0,
    resolved: disputes?.filter(d => d.status === 'resolved').length || 0,
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-3 gap-4">
          {[1,2,3].map(i => <Skeleton key={i} className="h-24" />)}
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Litiges</h1>
          <p className="text-muted-foreground">
            {disputes?.length || 0} litige(s) enregistré(s)
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-l-4 border-l-destructive">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Ouverts</p>
                <p className="text-2xl font-bold">{stats.open}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-destructive/20" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-primary">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">En cours</p>
                <p className="text-2xl font-bold">{stats.in_progress}</p>
              </div>
              <Clock className="h-8 w-8 text-primary/20" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-green-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Résolus ce mois</p>
                <p className="text-2xl font-bold">{stats.resolved}</p>
              </div>
              <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
                ✓
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Input
            placeholder="Rechercher par facture, fournisseur..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select
          value={statusFilter}
          onValueChange={(v) => setStatusFilter(v as DisputeStatus | 'all')}
        >
          <SelectTrigger className="w-[180px]">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Statut" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les statuts</SelectItem>
            <SelectItem value="open">Ouvert</SelectItem>
            <SelectItem value="in_progress">En cours</SelectItem>
            <SelectItem value="resolved">Résolu</SelectItem>
            <SelectItem value="closed">Fermé</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Disputes List */}
      {filteredDisputes?.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="font-medium">Aucun litige</p>
            <p className="text-sm text-muted-foreground mt-1">
              Les litiges créés depuis les factures apparaîtront ici
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredDisputes?.map(dispute => (
            <Card 
              key={dispute.id} 
              className="hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => navigate(`/disputes/${dispute.id}`)}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-3">
                      <Badge variant={statusColors[dispute.status] as any}>
                        {statusLabels[dispute.status]}
                      </Badge>
                      <Badge variant="outline">
                        {categoryLabels[dispute.category]}
                      </Badge>
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${priorityColors[dispute.priority]}`}>
                        {priorityLabels[dispute.priority]}
                      </span>
                    </div>

                    <p className="text-sm line-clamp-2">{dispute.description}</p>

                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Building2 className="h-4 w-4" />
                        {dispute.invoice?.suppliers?.name || 'Fournisseur inconnu'}
                      </div>
                      <div className="flex items-center gap-1">
                        <Euro className="h-4 w-4" />
                        {dispute.invoice?.amount_ttc?.toLocaleString('fr-FR', {
                          style: 'currency',
                          currency: 'EUR',
                        }) || '-'}
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {format(new Date(dispute.created_at), 'dd MMM yyyy', { locale: fr })}
                      </div>
                    </div>
                  </div>

                  <Button variant="ghost" size="icon">
                    <Eye className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
