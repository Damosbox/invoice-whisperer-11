import { useState } from 'react';
import { Invoice, InvoiceStatus } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  ArrowRight, 
  Loader2,
  Send,
  FileCheck,
  Ban
} from 'lucide-react';
import { DisputeCategory, DisputePriority } from '@/hooks/useDisputes';

export interface DisputeData {
  category: DisputeCategory;
  priority: DisputePriority;
  description: string;
}

interface WorkflowActionsProps {
  invoice: Invoice;
  onStatusChange: (newStatus: InvoiceStatus, rejectionReason?: string) => void;
  onCreateDispute?: (data: DisputeData) => void;
  isUpdating: boolean;
}

interface WorkflowTransition {
  from: InvoiceStatus[];
  to: InvoiceStatus;
  label: string;
  icon: React.ReactNode;
  variant: 'default' | 'destructive' | 'outline' | 'secondary';
  requiresReason?: boolean;
}

const transitions: WorkflowTransition[] = [
  {
    from: ['a_valider_extraction'],
    to: 'a_rapprocher',
    label: 'Valider extraction',
    icon: <CheckCircle className="h-4 w-4" />,
    variant: 'default',
  },
  {
    from: ['a_rapprocher'],
    to: 'a_approuver',
    label: 'Envoyer pour approbation',
    icon: <Send className="h-4 w-4" />,
    variant: 'default',
  },
  {
    from: ['a_approuver'],
    to: 'prete_comptabilisation',
    label: 'Approuver',
    icon: <CheckCircle className="h-4 w-4" />,
    variant: 'default',
  },
  {
    from: ['a_approuver'],
    to: 'exception',
    label: 'Rejeter',
    icon: <XCircle className="h-4 w-4" />,
    variant: 'destructive',
    requiresReason: true,
  },
  {
    from: ['prete_comptabilisation'],
    to: 'comptabilisee',
    label: 'Marquer comptabilisée',
    icon: <FileCheck className="h-4 w-4" />,
    variant: 'default',
  },
  {
    from: ['a_valider_extraction', 'a_rapprocher'],
    to: 'exception',
    label: 'Signaler exception',
    icon: <AlertTriangle className="h-4 w-4" />,
    variant: 'destructive',
    requiresReason: true,
  },
  {
    from: ['a_approuver'],
    to: 'litige',
    label: 'Mettre en litige',
    icon: <Ban className="h-4 w-4" />,
    variant: 'destructive',
    requiresReason: true,
  },
  {
    from: ['exception', 'litige'],
    to: 'a_valider_extraction',
    label: 'Reprendre le traitement',
    icon: <ArrowRight className="h-4 w-4" />,
    variant: 'outline',
  },
];

export function WorkflowActions({ invoice, onStatusChange, onCreateDispute, isUpdating }: WorkflowActionsProps) {
  const [showReasonDialog, setShowReasonDialog] = useState(false);
  const [pendingTransition, setPendingTransition] = useState<WorkflowTransition | null>(null);
  const [reason, setReason] = useState('');
  const [disputeCategory, setDisputeCategory] = useState<DisputeCategory>('other');
  const [disputePriority, setDisputePriority] = useState<DisputePriority>('medium');

  const availableTransitions = transitions.filter(t => 
    t.from.includes(invoice.status)
  );

  const isDisputeTransition = pendingTransition?.to === 'litige';

  const handleTransition = (transition: WorkflowTransition) => {
    if (transition.requiresReason) {
      setPendingTransition(transition);
      setShowReasonDialog(true);
    } else {
      onStatusChange(transition.to);
    }
  };

  const confirmTransition = () => {
    if (pendingTransition) {
      // If creating a dispute, call the dedicated handler
      if (pendingTransition.to === 'litige' && onCreateDispute) {
        onCreateDispute({
          category: disputeCategory,
          priority: disputePriority,
          description: reason.trim(),
        });
      } else {
        // INV-10: Pass rejection reason to parent for saving
        onStatusChange(pendingTransition.to, reason.trim() || undefined);
      }
      setShowReasonDialog(false);
      setPendingTransition(null);
      setReason('');
      setDisputeCategory('other');
      setDisputePriority('medium');
    }
  };

  if (availableTransitions.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Aucune action disponible pour ce statut.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Actions workflow</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {availableTransitions.map((transition, idx) => (
            <Button
              key={idx}
              variant={transition.variant}
              className="w-full justify-start gap-2"
              onClick={() => handleTransition(transition)}
              disabled={isUpdating}
            >
              {isUpdating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                transition.icon
              )}
              {transition.label}
            </Button>
          ))}
        </CardContent>
      </Card>

      {/* Reason dialog */}
      <Dialog open={showReasonDialog} onOpenChange={setShowReasonDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{pendingTransition?.label}</DialogTitle>
            <DialogDescription>
              {isDisputeTransition 
                ? 'Veuillez renseigner les détails du litige.'
                : 'Veuillez indiquer la raison de cette action.'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {isDisputeTransition && (
              <>
                <div className="space-y-2">
                  <Label>Catégorie du litige</Label>
                  <Select value={disputeCategory} onValueChange={(v) => setDisputeCategory(v as DisputeCategory)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner une catégorie" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="amount_mismatch">Écart de montant</SelectItem>
                      <SelectItem value="quality_issue">Problème qualité</SelectItem>
                      <SelectItem value="delivery_issue">Problème livraison</SelectItem>
                      <SelectItem value="duplicate">Doublon</SelectItem>
                      <SelectItem value="missing_po">BC manquant</SelectItem>
                      <SelectItem value="other">Autre</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Priorité</Label>
                  <Select value={disputePriority} onValueChange={(v) => setDisputePriority(v as DisputePriority)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner une priorité" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Basse</SelectItem>
                      <SelectItem value="medium">Moyenne</SelectItem>
                      <SelectItem value="high">Haute</SelectItem>
                      <SelectItem value="critical">Critique</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}

            <div className="space-y-2">
              <Label>{isDisputeTransition ? 'Description du litige' : 'Raison'}</Label>
              <Textarea
                placeholder={isDisputeTransition ? 'Décrivez le litige en détail...' : 'Décrivez la raison...'}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="min-h-[100px]"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowReasonDialog(false)}>
              Annuler
            </Button>
            <Button 
              variant={pendingTransition?.variant || 'default'}
              onClick={confirmTransition}
              disabled={!reason.trim()}
            >
              {isDisputeTransition ? 'Créer le litige' : 'Confirmer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
