import { Upload as UploadIcon, Play, Trash2, CheckCircle2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DropZone } from '@/components/upload/DropZone';
import { FileList } from '@/components/upload/FileList';
import { UploadStats } from '@/components/upload/UploadStats';
import { useFileUpload } from '@/hooks/useFileUpload';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

export default function Upload() {
  const navigate = useNavigate();
  const { 
    files, 
    isUploading, 
    stats, 
    addFiles, 
    removeFile, 
    clearCompleted, 
    clearAll,
    uploadAll, 
    retryFile 
  } = useFileUpload();

  const handleFilesAdded = (newFiles: File[]) => {
    addFiles(newFiles);
    toast.info(`${newFiles.length} fichier(s) ajouté(s)`);
  };

  const handleUpload = async () => {
    await uploadAll();
    if (stats.success > 0) {
      toast.success(`${stats.success} facture(s) importée(s) avec succès`);
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Import de factures</h1>
          <p className="text-muted-foreground">
            Importez vos factures fournisseurs pour traitement automatique
          </p>
        </div>
        {stats.success > 0 && (
          <Button variant="outline" onClick={() => navigate('/invoices')}>
            <CheckCircle2 className="h-4 w-4 mr-2" />
            Voir les factures importées
          </Button>
        )}
      </div>

      {/* Drop Zone */}
      <Card className="border-0 shadow-none">
        <CardContent className="p-0">
          <DropZone 
            onFilesAdded={handleFilesAdded} 
            disabled={isUploading}
          />
        </CardContent>
      </Card>

      {/* Stats */}
      <UploadStats stats={stats} />

      {/* Action Buttons */}
      {files.length > 0 && (
        <div className="flex items-center gap-3">
          <Button 
            onClick={handleUpload} 
            disabled={isUploading || stats.pending === 0}
          >
            <Play className="h-4 w-4 mr-2" />
            {isUploading ? 'Import en cours...' : `Importer ${stats.pending} fichier(s)`}
          </Button>

          {stats.success > 0 && (
            <Button variant="outline" onClick={clearCompleted}>
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Effacer les importés
            </Button>
          )}

          <Button variant="ghost" onClick={clearAll} disabled={isUploading}>
            <Trash2 className="h-4 w-4 mr-2" />
            Tout effacer
          </Button>
        </div>
      )}

      {/* File List */}
      <FileList 
        files={files} 
        onRemove={removeFile} 
        onRetry={retryFile}
      />

      {/* Help Card */}
      {files.length === 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <UploadIcon className="h-4 w-4" />
              Comment ça marche ?
            </CardTitle>
            <CardDescription>
              Guide rapide pour importer vos factures
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <div className="flex items-start gap-3">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-medium shrink-0">1</span>
              <p>Glissez-déposez vos fichiers PDF ou images dans la zone ci-dessus</p>
            </div>
            <div className="flex items-start gap-3">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-medium shrink-0">2</span>
              <p>Le système vérifie automatiquement les doublons et valide les fichiers</p>
            </div>
            <div className="flex items-start gap-3">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-medium shrink-0">3</span>
              <p>Cliquez sur "Importer" pour lancer le traitement OCR automatique</p>
            </div>
            <div className="flex items-start gap-3">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-medium shrink-0">4</span>
              <p>Retrouvez vos factures dans l'Inbox pour validation des données extraites</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
