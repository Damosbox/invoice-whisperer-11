import { 
  FileText, 
  X, 
  CheckCircle2, 
  AlertCircle, 
  Copy, 
  Loader2,
  RefreshCw 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import type { FileUploadItem } from './types';

interface FileListProps {
  files: FileUploadItem[];
  onRemove: (id: string) => void;
  onRetry: (id: string) => void;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' Ko';
  return (bytes / (1024 * 1024)).toFixed(1) + ' Mo';
}

function getStatusIcon(status: FileUploadItem['status']) {
  switch (status) {
    case 'success':
      return <CheckCircle2 className="h-4 w-4 text-status-validated" />;
    case 'error':
      return <AlertCircle className="h-4 w-4 text-destructive" />;
    case 'duplicate':
      return <Copy className="h-4 w-4 text-status-pending" />;
    case 'validating':
    case 'uploading':
      return <Loader2 className="h-4 w-4 text-primary animate-spin" />;
    default:
      return <FileText className="h-4 w-4 text-muted-foreground" />;
  }
}

function getStatusText(item: FileUploadItem): string {
  switch (item.status) {
    case 'pending':
      return 'En attente';
    case 'validating':
      return 'Validation...';
    case 'uploading':
      return 'Upload en cours...';
    case 'success':
      return 'Importé avec succès';
    case 'duplicate':
      return 'Doublon détecté';
    case 'error':
      return item.error || 'Erreur';
    default:
      return '';
  }
}

export function FileList({ files, onRemove, onRetry }: FileListProps) {
  if (files.length === 0) return null;

  return (
    <div className="space-y-2">
      {files.map((item) => (
        <div
          key={item.id}
          className={cn(
            "flex items-center gap-3 p-3 rounded-lg border transition-colors",
            item.status === 'success' && "bg-status-validated/5 border-status-validated/30",
            item.status === 'error' && "bg-destructive/5 border-destructive/30",
            item.status === 'duplicate' && "bg-status-pending/5 border-status-pending/30",
            item.status === 'pending' && "bg-card border-border",
            (item.status === 'validating' || item.status === 'uploading') && "bg-primary/5 border-primary/30"
          )}
        >
          {/* Icon */}
          <div className="shrink-0">
            {getStatusIcon(item.status)}
          </div>

          {/* File Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="text-sm font-medium truncate">{item.file.name}</p>
              <span className="text-xs text-muted-foreground shrink-0">
                {formatFileSize(item.file.size)}
              </span>
            </div>
            
            {/* Progress bar for uploading */}
            {(item.status === 'validating' || item.status === 'uploading') && (
              <Progress value={item.progress} className="h-1 mt-2" />
            )}

            {/* Status text */}
            <p className={cn(
              "text-xs mt-1",
              item.status === 'success' && "text-status-validated",
              item.status === 'error' && "text-destructive",
              item.status === 'duplicate' && "text-status-pending",
              item.status === 'pending' && "text-muted-foreground",
              (item.status === 'validating' || item.status === 'uploading') && "text-primary"
            )}>
              {getStatusText(item)}
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1 shrink-0">
            {item.status === 'error' && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => onRetry(item.id)}
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
            )}
            {(item.status === 'pending' || item.status === 'error' || item.status === 'duplicate') && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-destructive"
                onClick={() => onRemove(item.id)}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
