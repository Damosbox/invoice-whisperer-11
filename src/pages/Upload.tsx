import { Upload as UploadIcon, FileText } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

export default function Upload() {
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Import de factures</h1>
        <p className="text-muted-foreground">
          Importez vos factures fournisseurs pour traitement automatique
        </p>
      </div>

      {/* Upload Zone Placeholder */}
      <Card className="border-dashed border-2 border-border hover:border-primary/50 transition-colors">
        <CardContent className="p-12">
          <div className="flex flex-col items-center justify-center text-center space-y-4">
            <div className="p-4 rounded-full bg-primary/10">
              <UploadIcon className="h-8 w-8 text-primary" />
            </div>
            <div>
              <p className="font-medium">Glissez vos fichiers ici</p>
              <p className="text-sm text-muted-foreground mt-1">
                ou cliquez pour sélectionner des fichiers
              </p>
            </div>
            <p className="text-xs text-muted-foreground">
              Formats acceptés : PDF, PNG, JPG, JPEG (max 10 Mo)
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Fonctionnalité en cours de développement
          </CardTitle>
          <CardDescription>
            L'upload avec drag & drop, détection des doublons et lancement automatique 
            de l'OCR sera disponible dans la prochaine version.
          </CardDescription>
        </CardHeader>
      </Card>
    </div>
  );
}
