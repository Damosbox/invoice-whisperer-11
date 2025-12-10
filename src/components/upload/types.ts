export type UploadStatus = 'pending' | 'validating' | 'uploading' | 'success' | 'error' | 'duplicate';

export interface FileUploadItem {
  id: string;
  file: File;
  status: UploadStatus;
  progress: number;
  error?: string;
  invoiceId?: string;
  duplicateInvoiceId?: string;
}
