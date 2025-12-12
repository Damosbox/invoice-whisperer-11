import { Invoice } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Link2, Package, Truck, CheckCircle, AlertTriangle, XCircle, HelpCircle } from 'lucide-react';

interface MatchingInfoProps {
  invoice: Invoice;
}

const matchStatusConfig: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  match_automatique: { 
    label: 'Match automatique', 
    icon: <CheckCircle className="h-4 w-4" />, 
    color: 'text-green-500' 
  },
  match_probable: { 
    label: 'Match probable', 
    icon: <AlertTriangle className="h-4 w-4" />, 
    color: 'text-yellow-500' 
  },
  match_incertain: { 
    label: 'Match incertain', 
    icon: <HelpCircle className="h-4 w-4" />, 
    color: 'text-orange-500' 
  },
  aucun_match: { 
    label: 'Aucun match', 
    icon: <XCircle className="h-4 w-4" />, 
    color: 'text-red-500' 
  },
};

export function MatchingInfo({ invoice }: MatchingInfoProps) {
  const matchConfig = matchStatusConfig[invoice.match_status] || matchStatusConfig.aucun_match;
  const matchScore = invoice.match_score ?? 0;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Link2 className="h-5 w-5" />
          Rapprochement
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Match status */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Statut</span>
          <div className={`flex items-center gap-2 ${matchConfig.color}`}>
            {matchConfig.icon}
            <span className="font-medium">{matchConfig.label}</span>
          </div>
        </div>

        {/* Match score */}
        {matchScore > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Score de correspondance</span>
              <span className="font-medium">{Math.round(matchScore * 100)}%</span>
            </div>
            <Progress value={matchScore * 100} className="h-2" />
          </div>
        )}

        {/* Matched PO */}
        {invoice.purchase_order && (
          <div className="flex items-center justify-between py-2 px-3 bg-muted/30 rounded-lg">
            <div className="flex items-center gap-2">
              <Package className="h-4 w-4 text-primary" />
              <span className="text-sm">Bon de Commande</span>
            </div>
            <Badge variant="outline">{invoice.purchase_order.po_number}</Badge>
          </div>
        )}

        {/* Matched BL */}
        {invoice.delivery_note && (
          <div className="flex items-center justify-between py-2 px-3 bg-muted/30 rounded-lg">
            <div className="flex items-center gap-2">
              <Truck className="h-4 w-4 text-primary" />
              <span className="text-sm">Bon de Livraison</span>
            </div>
            <Badge variant="outline">{invoice.delivery_note.bl_number}</Badge>
          </div>
        )}

        {/* No matches */}
        {!invoice.purchase_order && !invoice.delivery_note && invoice.match_status === 'aucun_match' && (
          <p className="text-sm text-muted-foreground text-center py-4">
            Aucun document associé trouvé. 
            {invoice.po_number_extracted && (
              <span className="block mt-1">
                Numéro BC extrait: <strong>{invoice.po_number_extracted}</strong>
              </span>
            )}
          </p>
        )}

        {/* Anomalies */}
        {invoice.has_anomalies && invoice.anomaly_types && (
          <div className="pt-3 border-t">
            <div className="flex items-center gap-2 text-destructive mb-2">
              <AlertTriangle className="h-4 w-4" />
              <span className="text-sm font-medium">Anomalies détectées</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {invoice.anomaly_types.map((type, idx) => (
                <Badge key={idx} variant="destructive" className="text-xs">
                  {type}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
