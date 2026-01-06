import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, ShieldCheck } from 'lucide-react';
import { ApprovalRulesTable } from '@/components/approval/ApprovalRulesTable';
import { ApprovalRuleForm } from '@/components/approval/ApprovalRuleForm';
import { ApprovalRule, useApprovalRules } from '@/hooks/useApprovalWorkflow';
import { Skeleton } from '@/components/ui/skeleton';

export default function ApprovalRules() {
  const [formOpen, setFormOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<ApprovalRule | null>(null);
  const { data: rules, isLoading } = useApprovalRules(true);

  const handleEdit = (rule: ApprovalRule) => {
    setEditingRule(rule);
    setFormOpen(true);
  };

  const handleCreate = () => {
    setEditingRule(null);
    setFormOpen(true);
  };

  const handleFormClose = (open: boolean) => {
    setFormOpen(open);
    if (!open) setEditingRule(null);
  };

  return (
    <>
      <Helmet>
        <title>Règles d'approbation | FacturaPro</title>
        <meta name="description" content="Configuration des règles d'approbation multi-niveaux pour les factures" />
      </Helmet>

      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ShieldCheck className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-2xl font-bold">Règles d'approbation</h1>
              <p className="text-muted-foreground">
                Configurez les workflows d'approbation multi-niveaux
              </p>
            </div>
          </div>
          <Button onClick={handleCreate}>
            <Plus className="h-4 w-4 mr-2" />
            Nouvelle règle
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Règles configurées</CardTitle>
            <CardDescription>
              Les règles sont évaluées par ordre de priorité décroissant. 
              La première règle correspondante est appliquée.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : (
              <ApprovalRulesTable rules={rules || []} onEdit={handleEdit} />
            )}
          </CardContent>
        </Card>
      </div>

      <ApprovalRuleForm 
        open={formOpen} 
        onOpenChange={handleFormClose}
        rule={editingRule}
      />
    </>
  );
}
