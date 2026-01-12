import { Helmet } from 'react-helmet-async';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useSeedTestAccounts } from '@/hooks/useSeedTestAccounts';
import { 
  Users, 
  Play, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Shield,
  Copy,
  AlertTriangle 
} from 'lucide-react';
import { toast } from 'sonner';

const roleColors: Record<string, string> = {
  comptable: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  daf: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  dg: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200',
  admin: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  auditeur: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
};

const roleDescriptions: Record<string, string> = {
  comptable: 'Validation niveau 1 - Opérationnel',
  daf: 'Validation niveau 2 - Financier',
  dg: 'Validation niveau 3 - Stratégique',
  admin: 'Administration complète',
  auditeur: 'Consultation uniquement',
};

export default function SeedTestAccounts() {
  const { testAccounts, isCreating, results, progress, createTestAccounts } = useSeedTestAccounts();

  const copyCredentials = (email: string) => {
    navigator.clipboard.writeText(`${email} / Test123!`);
    toast.success('Identifiants copiés !');
  };

  const getStatusIcon = (status: 'success' | 'error' | 'pending') => {
    switch (status) {
      case 'success':
        return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case 'error':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'pending':
        return <Clock className="h-5 w-5 text-muted-foreground animate-pulse" />;
    }
  };

  return (
    <>
      <Helmet>
        <title>Comptes de Test | FacturaPro</title>
      </Helmet>

      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Users className="h-6 w-6" />
            Création des Comptes de Test
          </h1>
          <p className="text-muted-foreground">
            Génère automatiquement 5 comptes avec différents rôles pour tester le workflow d'approbation
          </p>
        </div>

        {/* Warning Card */}
        <Card className="border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950">
          <CardContent className="flex items-start gap-3 pt-6">
            <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0" />
            <div>
              <p className="font-medium text-amber-800 dark:text-amber-200">
                Environnement de test uniquement
              </p>
              <p className="text-sm text-amber-700 dark:text-amber-300">
                Ces comptes utilisent des emails fictifs (.test) et un mot de passe commun. 
                Ne pas utiliser en production.
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Accounts to Create */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Comptes à créer
              </CardTitle>
              <CardDescription>
                Mot de passe commun : <code className="bg-muted px-2 py-1 rounded">Test123!</code>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {testAccounts.map((account, index) => {
                const result = results[index];
                return (
                  <div
                    key={account.email}
                    className="flex items-center justify-between p-3 rounded-lg border bg-card"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Badge className={roleColors[account.role]}>
                          {account.role.toUpperCase()}
                        </Badge>
                        <span className="font-medium">{account.fullName}</span>
                      </div>
                      <p className="text-sm text-muted-foreground">{account.email}</p>
                      <p className="text-xs text-muted-foreground">
                        {roleDescriptions[account.role]}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {result && getStatusIcon(result.status)}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => copyCredentials(account.email)}
                        title="Copier les identifiants"
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          {/* Actions & Results */}
          <Card>
            <CardHeader>
              <CardTitle>Actions</CardTitle>
              <CardDescription>
                Créez tous les comptes en un clic
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <Button
                size="lg"
                className="w-full"
                onClick={createTestAccounts}
                disabled={isCreating}
              >
                {isCreating ? (
                  <>
                    <Clock className="mr-2 h-4 w-4 animate-spin" />
                    Création en cours...
                  </>
                ) : (
                  <>
                    <Play className="mr-2 h-4 w-4" />
                    Créer tous les comptes de test
                  </>
                )}
              </Button>

              {isCreating && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Progression</span>
                    <span>{Math.round(progress)}%</span>
                  </div>
                  <Progress value={progress} />
                </div>
              )}

              {results.length > 0 && (
                <div className="space-y-3">
                  <h4 className="font-medium">Résultats</h4>
                  {results.map((result) => (
                    <div
                      key={result.email}
                      className={`flex items-start gap-3 p-3 rounded-lg border ${
                        result.status === 'success'
                          ? 'border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950'
                          : result.status === 'error'
                          ? 'border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950'
                          : 'border-muted'
                      }`}
                    >
                      {getStatusIcon(result.status)}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            {result.role}
                          </Badge>
                          <span className="text-sm font-medium truncate">
                            {result.email}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          {result.message}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Test Scenarios */}
              <div className="pt-4 border-t">
                <h4 className="font-medium mb-3">Scénarios de test recommandés</h4>
                <ul className="text-sm text-muted-foreground space-y-2">
                  <li>• <strong>Comptable</strong> : Approuver une facture &lt; 1000€</li>
                  <li>• <strong>DAF</strong> : Approuver après Comptable (montant 1000-10000€)</li>
                  <li>• <strong>DG</strong> : Approuver après DAF (montant &gt; 10000€)</li>
                  <li>• <strong>Admin</strong> : Configurer les règles d'approbation</li>
                  <li>• <strong>Auditeur</strong> : Vérifier accès lecture seule</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
