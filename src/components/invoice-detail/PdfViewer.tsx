import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { FileText, Download, ExternalLink, AlertCircle } from 'lucide-react';

interface PdfViewerProps {
  filePath: string;
}

export function PdfViewer({ filePath }: PdfViewerProps) {
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function getSignedUrl() {
      setIsLoading(true);
      setError(null);

      try {
        const { data, error: signError } = await supabase.storage
          .from('invoices')
          .createSignedUrl(filePath, 3600); // 1 hour expiry

        if (signError) throw signError;
        setPdfUrl(data.signedUrl);
      } catch (err) {
        console.error('Failed to get PDF URL:', err);
        setError('Impossible de charger le document');
      } finally {
        setIsLoading(false);
      }
    }

    if (filePath) {
      getSignedUrl();
    }
  }, [filePath]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="w-full h-[500px] rounded-lg" />
      </div>
    );
  }

  if (error || !pdfUrl) {
    return (
      <div className="flex flex-col items-center justify-center h-[500px] bg-muted/30 rounded-lg border border-dashed gap-4">
        <AlertCircle className="h-12 w-12 text-muted-foreground" />
        <p className="text-muted-foreground">{error || 'Document non disponible'}</p>
      </div>
    );
  }

  // Check if it's a PDF
  const isPdf = filePath.toLowerCase().endsWith('.pdf');

  return (
    <div className="space-y-3">
      {/* Action buttons */}
      <div className="flex gap-2 justify-end">
        <Button variant="outline" size="sm" asChild>
          <a href={pdfUrl} target="_blank" rel="noopener noreferrer">
            <ExternalLink className="h-4 w-4 mr-2" />
            Ouvrir
          </a>
        </Button>
        <Button variant="outline" size="sm" asChild>
          <a href={pdfUrl} download>
            <Download className="h-4 w-4 mr-2" />
            Télécharger
          </a>
        </Button>
      </div>

      {/* PDF/Image viewer */}
      <div className="rounded-lg border bg-muted/20 overflow-hidden">
        {isPdf ? (
          <iframe
            src={`${pdfUrl}#toolbar=1&navpanes=0`}
            className="w-full h-[500px]"
            title="Facture PDF"
          />
        ) : (
          <img 
            src={pdfUrl} 
            alt="Facture" 
            className="w-full h-auto max-h-[500px] object-contain"
          />
        )}
      </div>
    </div>
  );
}
