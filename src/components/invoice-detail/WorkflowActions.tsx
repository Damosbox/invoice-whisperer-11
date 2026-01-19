import { useState } from 'react';
import { Invoice, InvoiceStatus } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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

interface WorkflowActionsProps {
  invoice: Invoice;
  onStatusChange: (newStatus: InvoiceStatus, rejectionReason?: string) => void;
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

export function WorkflowActions({ invoice, onStatusChange, isUpdating }: WorkflowActionsProps) {
  const [showReasonDialog, setShowReasonDialog] = useState(false);
  const [pendingTransition, setPendingTransition] = useState<WorkflowTransition | null>(null);
  const [reason, setReason] = useState('');

  const availableTransitions = transitions.filter(t => 
    t.from.includes(invoice.status)
  );

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
      // INV-10: Pass rejection reason to parent for saving
      onStatusChange(pendingTransition.to, reason.trim() || undefined);
      setShowReasonDialog(false);
      setPendingTransition(null);
      setReason('');
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
              Veuillez indiquer la raison de cette action.
            </DialogDescription>
          </DialogHeader>
          
          <Textarea
            placeholder="Décrivez la raison..."
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="min-h-[100px]"
          />

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowReasonDialog(false)}>
              Annuler
            </Button>
            <Button 
              variant={pendingTransition?.variant || 'default'}
              onClick={confirmTransition}
              disabled={!reason.trim()}
            >
              Confirmer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
