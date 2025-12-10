import { ClipboardList, Plus, Search } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export default function PurchaseOrders() {
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Bons de commande</h1>
          <p className="text-muted-foreground">
            Référentiel des bons de commande pour le rapprochement
          </p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Ajouter
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Rechercher un BC..." className="pl-9" />
      </div>

      {/* Empty State */}
      <Card>
        <CardContent className="p-12">
          <div className="flex flex-col items-center justify-center text-center space-y-4">
            <div className="p-4 rounded-full bg-muted">
              <ClipboardList className="h-8 w-8 text-muted-foreground" />
            </div>
            <div>
              <p className="font-medium">Aucun bon de commande</p>
              <p className="text-sm text-muted-foreground mt-1">
                Importez vos bons de commande pour activer le rapprochement automatique
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
