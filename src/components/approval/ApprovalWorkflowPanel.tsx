import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { 
  CheckCircle2, 
  XCircle, 
  Clock, 
  User, 
  MessageSquare,
  ChevronRight,
  PlayCircle
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import {
  useApprovalHistory,
  useInitializeApproval,
  useApproveInvoice,
  useRejectInvoice,
  getRoleLabel,
  ApprovalHistoryItem,
} from '@/hooks/useApprovalWorkflow';
import { useUserRoles } from '@/hooks/useUserRoles';
import { useAuth } from '@/contexts/AuthContext';

interface ApprovalWorkflowPanelProps {
  invoiceId: string;
  invoiceAmount: number;
  isCriticalSupplier: boolean;
  invoiceStatus: string;
  currentLevel?: number;
  requiredLevels?: number;
}

export function ApprovalWorkflowPanel({
  invoiceId,
  invoiceAmount,
  isCriticalSupplier,
  invoiceStatus,
  currentLevel = 0,
  requiredLevels = 1,
}: ApprovalWorkflowPanelProps) {
  const navigate = useNavigate();
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [approveComment, setApproveComment] = useState('');

  const { user } = useAuth();
  const { data: history = [], isLoading } = useApprovalHistory(invoiceId);
  const { data: userRoles = [] } = useUserRoles(user?.id);
  const initializeMutation = useInitializeApproval();
  const approveMutation = useApproveInvoice();
  const rejectMutation = useRejectInvoice();

  const hasWorkflow = history.length > 0;
  const canInitialize = invoiceStatus === 'a_rapprocher' || invoiceStatus === 'a_valider_extraction';

  // Find current pending level that user can approve
  const pendingLevel = history.find(h => h.status === 'pending');
  const canApprove = pendingLevel && userRoles.includes(pendingLevel.required_role as any);

  const handleInitialize = () => {
    initializeMutation.mutate({
      invoiceId,
      amount: invoiceAmount,
      isCriticalSupplier,
    });
  };

  const handleApprove = () => {
    if (pendingLevel) {
      approveMutation.mutate({
        invoiceId,
        level: pendingLevel.level,
        comment: approveComment || undefined,
      }, {
        onSuccess: () => {
          setApproveComment('');
          // Redirect to approval queue after a short delay
          setTimeout(() => {
            navigate('/approval');
          }, 1500);
        }
      });
    }
  };

  const handleReject = () => {
    if (pendingLevel && rejectReason.trim()) {
      rejectMutation.mutate({
        invoiceId,
        level: pendingLevel.level,
        reason: rejectReason,
      }, {
        onSuccess: () => {
          setRejectDialogOpen(false);
          setRejectReason('');
          // Redirect to approval queue after a short delay
          setTimeout(() => {
            navigate('/approval');
          }, 1500);
        }
      });
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <ChevronRight className="h-4 w-4" />
          Workflow d'approbation
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!hasWorkflow ? (
          <div className="text-center py-4">
            <p className="text-sm text-muted-foreground mb-4">
              Aucun workflow d'approbation initialisé
            </p>
            {canInitialize && (
              <Button 
                onClick={handleInitialize}
                disabled={initializeMutation.isPending}
                size="sm"
              >
                <PlayCircle className="h-4 w-4 mr-2" />
                Initialiser l'approbation
              </Button>
            )}
          </div>
        ) : (
          <>
            {/* Workflow Steps */}
            <div className="space-y-3">
              {history.map((item, index) => (
                <ApprovalStep 
                  key={item.id} 
                  item={item} 
                  isLast={index === history.length - 1}
                />
              ))}
            </div>

            {/* Actions for current level */}
            {canApprove && invoiceStatus === 'a_approuver' && (
              <div className="pt-4 border-t space-y-3">
                <p className="text-sm font-medium">
                  Votre action requise (Niveau {pendingLevel.level})
                </p>
                <Textarea
                  placeholder="Commentaire (optionnel)"
                  value={approveComment}
                  onChange={(e) => setApproveComment(e.target.value)}
                  rows={2}
                />
                <div className="flex gap-2">
                  <Button
                    onClick={handleApprove}
                    disabled={approveMutation.isPending}
                    className="flex-1"
                  >
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Approuver
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => setRejectDialogOpen(true)}
                    disabled={rejectMutation.isPending}
                    className="flex-1"
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Rejeter
                  </Button>
                </div>
              </div>
            )}

            {/* Progress indicator */}
            <div className="pt-2 text-xs text-muted-foreground text-center">
              {history.filter(h => h.status === 'approved').length} / {history.length} niveau(x) approuvé(s)
            </div>
          </>
        )}

        {/* Reject Dialog */}
        <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Rejeter la facture</DialogTitle>
              <DialogDescription>
                Veuillez indiquer la raison du rejet
              </DialogDescription>
            </DialogHeader>
            <Textarea
              placeholder="Raison du rejet..."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={4}
            />
            <DialogFooter>
              <Button variant="outline" onClick={() => setRejectDialogOpen(false)}>
                Annuler
              </Button>
              <Button
                variant="destructive"
                onClick={handleReject}
                disabled={!rejectReason.trim() || rejectMutation.isPending}
              >
                Confirmer le rejet
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}

function ApprovalStep({ item, isLast }: { item: ApprovalHistoryItem; isLast: boolean }) {
  const statusConfig = {
    pending: { icon: Clock, color: 'text-amber-500', bg: 'bg-amber-500/10', label: 'En attente' },
    approved: { icon: CheckCircle2, color: 'text-green-500', bg: 'bg-green-500/10', label: 'Approuvé' },
    rejected: { icon: XCircle, color: 'text-red-500', bg: 'bg-red-500/10', label: 'Rejeté' },
  };

  const config = statusConfig[item.status];
  const Icon = config.icon;

  return (
    <div className="flex gap-3">
      {/* Timeline */}
      <div className="flex flex-col items-center">
        <div className={cn("p-1.5 rounded-full", config.bg)}>
          <Icon className={cn("h-4 w-4", config.color)} />
        </div>
        {!isLast && <div className="w-0.5 flex-1 bg-border mt-1" />}
      </div>

      {/* Content */}
      <div className="flex-1 pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-medium text-sm">
              Niveau {item.level} - {getRoleLabel(item.required_role)}
            </span>
            <Badge variant="outline" className={cn("text-xs", config.color)}>
              {config.label}
            </Badge>
          </div>
        </div>

        {item.status !== 'pending' && item.approved_at && (
          <div className="mt-1 text-xs text-muted-foreground space-y-1">
            <div className="flex items-center gap-1">
              <User className="h-3 w-3" />
              <span>
                {item.approver_profile?.full_name || item.approver_profile?.email || 'Utilisateur'}
              </span>
              <span>•</span>
              <span>
                {format(new Date(item.approved_at), 'dd MMM yyyy à HH:mm', { locale: fr })}
              </span>
            </div>
            {item.comment && (
              <div className="flex items-start gap-1 mt-1">
                <MessageSquare className="h-3 w-3 mt-0.5" />
                <span className="italic">{item.comment}</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
