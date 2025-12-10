import { AlertTriangle, Filter } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function Exceptions() {
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Exceptions</h1>
          <p className="text-muted-foreground">
            Factures avec anomalies nécessitant une attention particulière
          </p>
        </div>
        <Button variant="outline">
          <Filter className="h-4 w-4 mr-2" />
          Filtrer
        </Button>
      </div>

      {/* Empty State */}
      <Card>
        <CardContent className="p-12">
          <div className="flex flex-col items-center justify-center text-center space-y-4">
            <div className="p-4 rounded-full bg-status-exception/10">
              <AlertTriangle className="h-8 w-8 text-status-exception" />
            </div>
            <div>
              <p className="font-medium">Aucune exception</p>
              <p className="text-sm text-muted-foreground mt-1">
                Les factures avec anomalies apparaîtront ici
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
