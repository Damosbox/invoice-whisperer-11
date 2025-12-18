import { useState } from 'react';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
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
import { MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import { ApprovalRule, getRoleLabel, useUpdateApprovalRule, useDeleteApprovalRule } from '@/hooks/useApprovalWorkflow';

interface ApprovalRulesTableProps {
  rules: ApprovalRule[];
  onEdit: (rule: ApprovalRule) => void;
}

export function ApprovalRulesTable({ rules, onEdit }: ApprovalRulesTableProps) {
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const updateRule = useUpdateApprovalRule();
  const deleteRule = useDeleteApprovalRule();

  const handleToggleActive = (rule: ApprovalRule) => {
    updateRule.mutate({ id: rule.id, is_active: !rule.is_active });
  };

  const handleDelete = () => {
    if (deleteId) {
      deleteRule.mutate(deleteId);
      setDeleteId(null);
    }
  };

  const formatAmount = (amount: number | null) => {
    if (amount === null) return '∞';
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(amount);
  };

  const getRoleBadges = (rule: ApprovalRule) => {
    const roles = [rule.level_1_role];
    if (rule.level_2_role) roles.push(rule.level_2_role);
    if (rule.level_3_role) roles.push(rule.level_3_role);
    
    return roles.map((role, i) => (
      <Badge key={i} variant="outline" className="mr-1">
        {i + 1}. {getRoleLabel(role)}
      </Badge>
    ));
  };

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nom</TableHead>
              <TableHead>Montant</TableHead>
              <TableHead>Fournisseur critique</TableHead>
              <TableHead>Niveaux d'approbation</TableHead>
              <TableHead>Priorité</TableHead>
              <TableHead>Actif</TableHead>
              <TableHead className="w-[70px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rules.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                  Aucune règle d'approbation
                </TableCell>
              </TableRow>
            ) : (
              rules.map((rule) => (
                <TableRow key={rule.id} className={!rule.is_active ? 'opacity-50' : ''}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{rule.name}</div>
                      {rule.description && (
                        <div className="text-sm text-muted-foreground">{rule.description}</div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {formatAmount(rule.min_amount)} - {formatAmount(rule.max_amount)}
                  </TableCell>
                  <TableCell>
                    {rule.is_critical_supplier ? (
                      <Badge variant="destructive">Oui</Badge>
                    ) : (
                      <Badge variant="secondary">Non</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {getRoleBadges(rule)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{rule.priority}</Badge>
                  </TableCell>
                  <TableCell>
                    <Switch
                      checked={rule.is_active}
                      onCheckedChange={() => handleToggleActive(rule)}
                    />
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onEdit(rule)}>
                          <Pencil className="h-4 w-4 mr-2" />
                          Modifier
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => setDeleteId(rule.id)}
                          className="text-destructive"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Supprimer
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer la règle ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. La règle sera définitivement supprimée.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
