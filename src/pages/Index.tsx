import { 
  FileText, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle2, 
  Clock,
  ArrowRight
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

const stats = [
  { 
    label: 'Factures ce mois', 
    value: '—', 
    icon: FileText, 
    color: 'text-primary',
    bgColor: 'bg-primary/10' 
  },
  { 
    label: 'En attente', 
    value: '—', 
    icon: Clock, 
    color: 'text-status-pending',
    bgColor: 'bg-status-pending/10' 
  },
  { 
    label: 'Validées', 
    value: '—', 
    icon: CheckCircle2, 
    color: 'text-status-validated',
    bgColor: 'bg-status-validated/10' 
  },
  { 
    label: 'Exceptions', 
    value: '—', 
    icon: AlertTriangle, 
    color: 'text-status-exception',
    bgColor: 'bg-status-exception/10' 
  },
];

const quickActions = [
  { 
    label: 'Importer des factures', 
    description: 'Upload de fichiers PDF ou images',
    to: '/upload',
    icon: FileText 
  },
  { 
    label: 'Voir les factures', 
    description: 'Tableau Kanban de toutes les factures',
    to: '/invoices',
    icon: TrendingUp 
  },
  { 
    label: 'Gérer les exceptions', 
    description: 'Factures nécessitant une attention',
    to: '/exceptions',
    icon: AlertTriangle 
  },
];

export default function Index() {
  const navigate = useNavigate();

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">
          Bienvenue sur SUTA Finance - Plateforme de gestion des factures fournisseurs
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Card key={stat.label} className="border-border/50">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                  <stat.icon className={`h-5 w-5 ${stat.color}`} />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stat.value}</p>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Actions rapides</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {quickActions.map((action) => (
            <Card 
              key={action.label} 
              className="border-border/50 hover:border-primary/30 transition-colors cursor-pointer group"
              onClick={() => navigate(action.to)}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-muted">
                      <action.icon className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="font-medium">{action.label}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {action.description}
                      </p>
                    </div>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Info Card */}
      <Card className="border-primary/20 bg-primary/5">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Phase 1 - MVP en cours
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p>Fonctionnalités disponibles :</p>
          <ul className="list-disc list-inside space-y-1">
            <li>Authentification et gestion des rôles</li>
            <li>Navigation et layout principal</li>
            <li>Inbox Kanban des factures</li>
            <li>Import de factures (en cours)</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
