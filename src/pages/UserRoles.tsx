import { UserRolesTable } from '@/components/admin/UserRolesTable';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ShieldCheck } from 'lucide-react';

export default function UserRoles() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Gestion des rôles</h1>
        <p className="text-muted-foreground">
          Attribuez et gérez les rôles des utilisateurs de la plateforme
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-primary" />
            <CardTitle>Utilisateurs et rôles</CardTitle>
          </div>
          <CardDescription>
            Cochez les rôles pour chaque utilisateur. Un utilisateur peut avoir plusieurs rôles.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <UserRolesTable />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Description des rôles</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-1">
              <h4 className="font-medium text-destructive">Administrateur</h4>
              <p className="text-sm text-muted-foreground">
                Accès complet à toutes les fonctionnalités, gestion des utilisateurs et configuration système.
              </p>
            </div>
            <div className="space-y-1">
              <h4 className="font-medium text-primary">DAF</h4>
              <p className="text-sm text-muted-foreground">
                Direction Administrative et Financière. Validation niveau 2, gestion des fournisseurs et règles.
              </p>
            </div>
            <div className="space-y-1">
              <h4 className="font-medium text-status-approval">DG</h4>
              <p className="text-sm text-muted-foreground">
                Direction Générale. Validation niveau 3 pour les montants élevés, tableaux de bord stratégiques.
              </p>
            </div>
            <div className="space-y-1">
              <h4 className="font-medium text-status-validated">Comptable</h4>
              <p className="text-sm text-muted-foreground">
                Traitement quotidien des factures, validation OCR, rapprochement et exports comptables.
              </p>
            </div>
            <div className="space-y-1">
              <h4 className="font-medium text-muted-foreground">Auditeur</h4>
              <p className="text-sm text-muted-foreground">
                Accès en lecture seule aux factures et journaux d'audit pour contrôle et conformité.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
