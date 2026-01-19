import { useCallback, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { uploadProvider } from '@/services/ingestion';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import type { FileUploadItem, UploadStatus } from '@/components/upload/types';

// Simple ID generator
const generateId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
};

export function useFileUpload() {
  const [files, setFiles] = useState<FileUploadItem[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const updateFile = useCallback((id: string, updates: Partial<FileUploadItem>) => {
    setFiles(prev => prev.map(f => f.id === id ? { ...f, ...updates } : f));
  }, []);

  // UP-04: Validate files immediately on add
  const addFiles = useCallback((newFiles: File[]) => {
    const items: FileUploadItem[] = newFiles.map(file => {
      const validation = uploadProvider.validateFile(file);
      if (!validation.valid) {
        return {
          id: generateId(),
          file,
          status: 'error' as UploadStatus,
          progress: 0,
          error: validation.error,
        };
      }
      return {
        id: generateId(),
        file,
        status: 'pending' as UploadStatus,
        progress: 0,
      };
    });
    
    // Notify user of rejected files
    const rejected = items.filter(i => i.status === 'error');
    if (rejected.length > 0) {
      toast.error(`${rejected.length} fichier(s) refusé(s) : format non supporté`);
    }
    
    setFiles(prev => [...prev, ...items]);
    return items;
  }, []);

  const removeFile = useCallback((id: string) => {
    setFiles(prev => prev.filter(f => f.id !== id));
  }, []);

  const clearCompleted = useCallback(() => {
    setFiles(prev => prev.filter(f => f.status !== 'success'));
  }, []);

  const clearAll = useCallback(() => {
    setFiles([]);
  }, []);

  const uploadFile = useCallback(async (item: FileUploadItem) => {
    if (!user) {
      updateFile(item.id, { status: 'error', error: 'Utilisateur non connecté' });
      return;
    }

    // Validation
    updateFile(item.id, { status: 'validating', progress: 10 });
    const validation = uploadProvider.validateFile(item.file);
    
    if (!validation.valid) {
      updateFile(item.id, { status: 'error', error: validation.error, progress: 0 });
      return;
    }

    // Upload
    updateFile(item.id, { status: 'uploading', progress: 30 });
    
    const result = await uploadProvider.ingest(item.file, { source: 'upload', userId: user.id });

    if (result.success) {
      updateFile(item.id, { 
        status: 'success', 
        progress: 100, 
        invoiceId: result.invoiceId 
      });
      // UP-03: Invalidate invoices cache so Kanban refreshes
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
    } else if (result.isDuplicate) {
      updateFile(item.id, { 
        status: 'duplicate', 
        progress: 100, 
        error: result.error,
        duplicateInvoiceId: result.invoiceId 
      });
    } else {
      updateFile(item.id, { 
        status: 'error', 
        progress: 0, 
        error: result.error 
      });
    }
  }, [user, updateFile, queryClient]);

  const uploadAll = useCallback(async () => {
    const pendingFiles = files.filter(f => f.status === 'pending');
    if (pendingFiles.length === 0) return;

    setIsUploading(true);

    for (const file of pendingFiles) {
      await uploadFile(file);
    }

    setIsUploading(false);
  }, [files, uploadFile]);

  const retryFile = useCallback(async (id: string) => {
    const file = files.find(f => f.id === id);
    if (!file) return;

    updateFile(id, { status: 'pending', progress: 0, error: undefined });
    await uploadFile({ ...file, status: 'pending', progress: 0 });
  }, [files, updateFile, uploadFile]);

  const stats = {
    total: files.length,
    pending: files.filter(f => f.status === 'pending').length,
    uploading: files.filter(f => f.status === 'validating' || f.status === 'uploading').length,
    success: files.filter(f => f.status === 'success').length,
    error: files.filter(f => f.status === 'error').length,
    duplicate: files.filter(f => f.status === 'duplicate').length,
  };

  return {
    files,
    isUploading,
    stats,
    addFiles,
    removeFile,
    clearCompleted,
    clearAll,
    uploadAll,
    retryFile,
  };
}
