import { useCallback, useState } from 'react';
import { Upload, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DropZoneProps {
  onFilesAdded: (files: File[]) => void;
  disabled?: boolean;
  accept?: string;
}

export function DropZone({ onFilesAdded, disabled = false, accept }: DropZoneProps) {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) setIsDragging(true);
  }, [disabled]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (disabled) return;

    const droppedFiles = Array.from(e.dataTransfer.files);
    if (droppedFiles.length > 0) {
      onFilesAdded(droppedFiles);
    }
  }, [disabled, onFilesAdded]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files ? Array.from(e.target.files) : [];
    if (selectedFiles.length > 0) {
      onFilesAdded(selectedFiles);
    }
    // Reset input
    e.target.value = '';
  }, [onFilesAdded]);

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={cn(
        "relative border-2 border-dashed rounded-lg transition-all duration-200 cursor-pointer",
        isDragging 
          ? "border-primary bg-primary/5 scale-[1.02]" 
          : "border-border hover:border-primary/50 hover:bg-muted/30",
        disabled && "opacity-50 cursor-not-allowed"
      )}
    >
      <input
        type="file"
        multiple
        accept={accept || ".pdf,.jpg,.jpeg,.png,.tiff"}
        onChange={handleFileSelect}
        disabled={disabled}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
      />
      
      <div className="flex flex-col items-center justify-center p-12 text-center">
        <div className={cn(
          "p-4 rounded-full mb-4 transition-colors",
          isDragging ? "bg-primary/20" : "bg-primary/10"
        )}>
          {isDragging ? (
            <FileText className="h-8 w-8 text-primary" />
          ) : (
            <Upload className="h-8 w-8 text-primary" />
          )}
        </div>
        
        <p className="font-medium text-foreground">
          {isDragging ? "Déposez les fichiers ici" : "Glissez vos fichiers ici"}
        </p>
        <p className="text-sm text-muted-foreground mt-1">
          ou cliquez pour sélectionner des fichiers
        </p>
        <p className="text-xs text-muted-foreground mt-3">
          Formats acceptés : PDF, PNG, JPG, JPEG, TIFF (max 20 Mo par fichier)
        </p>
      </div>
    </div>
  );
}
