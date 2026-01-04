import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  ArrowLeft,
  Building2,
  Euro,
  Calendar,
  FileText,
  Send,
  MessageSquare,
  Phone,
  Mail,
  CheckCircle,
  Clock,
  Plus,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  useDispute,
  useDisputeCommunications,
  useUpdateDispute,
  useAddCommunication,
  disputeEmailTemplates,
  DisputeStatus,
  CommunicationType,
} from '@/hooks/useDisputes';

const statusLabels: Record<DisputeStatus, string> = {
  open: 'Ouvert',
  in_progress: 'En cours',
  resolved: 'Résolu',
  closed: 'Fermé',
};

const categoryLabels: Record<string, string> = {
  amount_mismatch: 'Écart de montant',
  quality_issue: 'Problème qualité',
  delivery_issue: 'Problème livraison',
  duplicate: 'Doublon',
  missing_po: 'BC manquant',
  other: 'Autre',
};

const commTypeIcons: Record<CommunicationType, any> = {
  internal_note: MessageSquare,
  email_sent: Send,
  email_received: Mail,
  call: Phone,
  meeting: Calendar,
};

const commTypeLabels: Record<CommunicationType, string> = {
  internal_note: 'Note interne',
  email_sent: 'Email envoyé',
  email_received: 'Email reçu',
  call: 'Appel',
  meeting: 'Réunion',
};

export default function DisputeDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);
  const [noteDialogOpen, setNoteDialogOpen] = useState(false);
  const [newNote, setNewNote] = useState('');
  const [emailContent, setEmailContent] = useState('');

  const { data: dispute, isLoading } = useDispute(id || null);
  const { data: communications } = useDisputeCommunications(id || null);
  const updateDispute = useUpdateDispute();
  const addCommunication = useAddCommunication();

  const handleStatusChange = (newStatus: DisputeStatus) => {
    if (!id) return;
    updateDispute.mutate({ id, data: { status: newStatus } });
  };

  const handleAddNote = async () => {
    if (!id || !newNote.trim()) return;
    await addCommunication.mutateAsync({
      dispute_id: id,
      type: 'internal_note',
      content: newNote,
    });
    setNewNote('');
    setNoteDialogOpen(false);
  };

  const handleGenerateEmail = () => {
    if (!dispute) return;
    const template = disputeEmailTemplates[dispute.category as keyof typeof disputeEmailTemplates];
    if (template) {
      let content = template.body
        .replace('{invoiceNumber}', dispute.invoice?.invoice_number || 'N/A')
        .replace('{amount}', dispute.invoice?.amount_ttc?.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' }) || 'N/A')
        .replace('{description}', dispute.description);
      setEmailContent(content);
      setEmailDialogOpen(true);
    }
  };

  const handleSendEmail = async () => {
    if (!id || !emailContent.trim()) return;
    await addCommunication.mutateAsync({
      dispute_id: id,
      type: 'email_sent',
      content: emailContent,
      email_template: dispute?.category,
      recipients: dispute?.invoice?.suppliers?.email ? [dispute.invoice.suppliers.email] : [],
    });
    setEmailContent('');
    setEmailDialogOpen(false);
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-3 gap-6">
          <Skeleton className="h-96 col-span-2" />
          <Skeleton className="h-96" />
        </div>
      </div>
    );
  }

  if (!dispute) {
    return (
      <div className="p-6">
        <Button variant="ghost" onClick={() => navigate('/disputes')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Retour aux litiges
        </Button>
        <p className="mt-4 text-muted-foreground">Litige non trouvé</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate('/disputes')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour
          </Button>
          <div>
            <h1 className="text-2xl font-bold">
              Litige - {dispute.invoice?.invoice_number || 'Sans numéro'}
            </h1>
            <p className="text-muted-foreground">
              Créé le {format(new Date(dispute.created_at), 'dd MMMM yyyy', { locale: fr })}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Select value={dispute.status} onValueChange={handleStatusChange}>
            <SelectTrigger className="w-[160px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="open">Ouvert</SelectItem>
              <SelectItem value="in_progress">En cours</SelectItem>
              <SelectItem value="resolved">Résolu</SelectItem>
              <SelectItem value="closed">Fermé</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Dispute Info */}
          <Card>
            <CardHeader>
              <CardTitle>Détails du litige</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <Badge variant="outline">{categoryLabels[dispute.category]}</Badge>
                <Badge>{statusLabels[dispute.status]}</Badge>
              </div>

              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Description</p>
                <p>{dispute.description}</p>
              </div>

              {dispute.resolution_notes && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Notes de résolution</p>
                  <p>{dispute.resolution_notes}</p>
                </div>
              )}

              <Separator />

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Fournisseur</p>
                  <p className="font-medium flex items-center gap-1">
                    <Building2 className="h-4 w-4" />
                    {dispute.invoice?.suppliers?.name || '-'}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Montant TTC</p>
                  <p className="font-medium flex items-center gap-1">
                    <Euro className="h-4 w-4" />
                    {dispute.invoice?.amount_ttc?.toLocaleString('fr-FR', {
                      style: 'currency',
                      currency: 'EUR',
                    }) || '-'}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Date facture</p>
                  <p className="font-medium flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    {dispute.invoice?.issue_date
                      ? format(new Date(dispute.invoice.issue_date), 'dd/MM/yyyy')
                      : '-'}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">N° BC</p>
                  <p className="font-medium flex items-center gap-1">
                    <FileText className="h-4 w-4" />
                    {dispute.invoice?.po_number_extracted || '-'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Playbook / Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Actions recommandées</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <Button className="w-full justify-start" variant="outline" onClick={handleGenerateEmail}>
                  <Mail className="h-4 w-4 mr-2" />
                  Générer un email type au fournisseur
                </Button>
                <Button className="w-full justify-start" variant="outline" onClick={() => setNoteDialogOpen(true)}>
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Ajouter une note interne
                </Button>
                <Button 
                  className="w-full justify-start" 
                  variant="outline"
                  onClick={() => navigate(`/invoices/${dispute.invoice_id}`)}
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Voir la facture originale
                </Button>
                {dispute.status !== 'resolved' && (
                  <Button 
                    className="w-full justify-start" 
                    onClick={() => handleStatusChange('resolved')}
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Marquer comme résolu
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Communications Timeline */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Historique</CardTitle>
              <Button size="sm" variant="outline" onClick={() => setNoteDialogOpen(true)}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {communications?.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                Aucune communication enregistrée
              </p>
            ) : (
              <div className="space-y-4">
                {communications?.map((comm) => {
                  const Icon = commTypeIcons[comm.type];
                  return (
                    <div key={comm.id} className="flex gap-3">
                      <div className="flex-shrink-0 mt-1">
                        <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                          <Icon className="h-4 w-4" />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium">
                            {commTypeLabels[comm.type]}
                          </p>
                          <span className="text-xs text-muted-foreground">
                            {format(new Date(comm.created_at), 'dd/MM HH:mm')}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-3">
                          {comm.content}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Email Dialog */}
      <Dialog open={emailDialogOpen} onOpenChange={setEmailDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Générer un email</DialogTitle>
            <DialogDescription>
              Email type pour contacter le fournisseur
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium mb-2">Destinataire</p>
              <p className="text-sm text-muted-foreground">
                {dispute?.invoice?.suppliers?.email || 'Email non disponible'}
              </p>
            </div>
            <Textarea
              value={emailContent}
              onChange={(e) => setEmailContent(e.target.value)}
              rows={12}
              className="font-mono text-sm"
            />
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setEmailDialogOpen(false)}>
                Annuler
              </Button>
              <Button onClick={handleSendEmail}>
                <Send className="h-4 w-4 mr-2" />
                Enregistrer comme envoyé
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Note Dialog */}
      <Dialog open={noteDialogOpen} onOpenChange={setNoteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ajouter une note</DialogTitle>
            <DialogDescription>
              Ajoutez une note interne à l'historique du litige
            </DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder="Votre note..."
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            rows={4}
          />
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setNoteDialogOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleAddNote} disabled={!newNote.trim()}>
              Ajouter
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
