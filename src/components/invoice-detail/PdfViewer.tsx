import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Download, ExternalLink, AlertCircle, ShieldAlert, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { OcrField } from '@/types';
import { cn } from '@/lib/utils';

interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface PdfViewerProps {
  filePath: string;
  hideActions?: boolean;
  highlightedField?: OcrField | null;
}

export function PdfViewer({ filePath, hideActions = false, highlightedField }: PdfViewerProps) {
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [iframeBlocked, setIframeBlocked] = useState(false);
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    async function getSignedUrl() {
      setIsLoading(true);
      setError(null);
      setIframeBlocked(false);

      try {
        const { data, error: signError } = await supabase.storage
          .from('invoices')
          .createSignedUrl(filePath, 3600);

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

  // Handle zoom to bounding box when highlighted field changes
  useEffect(() => {
    if (highlightedField?.bounding_box && containerRef.current && imageSize.width > 0) {
      const box = highlightedField.bounding_box;
      const containerWidth = containerRef.current.clientWidth;
      const containerHeight = containerRef.current.clientHeight;
      
      // Calculate zoom level to fit the bounding box with some padding
      const boxWidth = (box.width / 100) * imageSize.width;
      const boxHeight = (box.height / 100) * imageSize.height;
      const padding = 1.5; // 50% padding around the box
      
      const zoomX = containerWidth / (boxWidth * padding);
      const zoomY = containerHeight / (boxHeight * padding);
      const newZoom = Math.min(Math.max(zoomX, zoomY, 2), 5); // Between 2x and 5x zoom
      
      // Calculate pan to center on bounding box
      const boxCenterX = ((box.x + box.width / 2) / 100) * imageSize.width;
      const boxCenterY = ((box.y + box.height / 2) / 100) * imageSize.height;
      
      const panX = (containerWidth / 2) - (boxCenterX * newZoom);
      const panY = (containerHeight / 2) - (boxCenterY * newZoom);
      
      setZoom(newZoom);
      setPan({ x: panX, y: panY });
    }
  }, [highlightedField, imageSize]);

  // Reset zoom when no field is highlighted
  useEffect(() => {
    if (!highlightedField) {
      setZoom(1);
      setPan({ x: 0, y: 0 });
    }
  }, [highlightedField]);

  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    setImageSize({ width: img.naturalWidth, height: img.naturalHeight });
  };

  const resetZoom = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  const zoomIn = () => setZoom(z => Math.min(z * 1.5, 5));
  const zoomOut = () => setZoom(z => Math.max(z / 1.5, 1));

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

  const isPdf = filePath.toLowerCase().endsWith('.pdf');
  const boundingBox = highlightedField?.bounding_box;

  return (
    <div className="space-y-3">
      {/* Action buttons */}
      {!hideActions && (
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
      )}

      {/* Zoom controls for images */}
      {!isPdf && (
        <div className="flex gap-1 justify-end">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={zoomOut} disabled={zoom <= 1}>
            <ZoomOut className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={zoomIn} disabled={zoom >= 5}>
            <ZoomIn className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={resetZoom} disabled={zoom === 1}>
            <RotateCcw className="h-4 w-4" />
          </Button>
          {zoom > 1 && (
            <span className="text-xs text-muted-foreground self-center ml-1">{Math.round(zoom * 100)}%</span>
          )}
        </div>
      )}

      {/* Blocked iframe fallback UI */}
      {iframeBlocked && (
        <Alert variant="destructive" className="border-orange-500/50 bg-orange-500/10">
          <ShieldAlert className="h-4 w-4" />
          <AlertTitle>Affichage bloqué</AlertTitle>
          <AlertDescription>
            L'aperçu du document est bloqué par votre réseau d'entreprise (proxy/firewall). 
            Utilisez les boutons ci-dessus pour ouvrir ou télécharger le fichier directement.
          </AlertDescription>
        </Alert>
      )}

      {/* PDF/Image viewer */}
      <div 
        ref={containerRef}
        className={cn(
          "rounded-lg border bg-muted/20 overflow-hidden relative",
          !isPdf && "cursor-grab"
        )}
        style={{ height: '500px' }}
      >
        {isPdf ? (
          <iframe
            src={`${pdfUrl}#toolbar=1&navpanes=0`}
            className="w-full h-full"
            title="Facture PDF"
            onError={() => setIframeBlocked(true)}
            onLoad={(e) => {
              try {
                const iframe = e.target as HTMLIFrameElement;
                if (!iframe.contentDocument && !iframe.contentWindow) {
                  setIframeBlocked(true);
                }
              } catch {
                // CORS error is OK
              }
            }}
          />
        ) : (
          <div 
            className="w-full h-full overflow-hidden relative"
            style={{
              transform: `translate(${pan.x}px, ${pan.y}px)`,
            }}
          >
            <img 
              ref={imageRef}
              src={pdfUrl} 
              alt="Facture" 
              className="transition-transform duration-300 ease-out origin-top-left"
              style={{
                transform: `scale(${zoom})`,
                maxWidth: zoom === 1 ? '100%' : 'none',
                maxHeight: zoom === 1 ? '500px' : 'none',
                objectFit: zoom === 1 ? 'contain' : 'none',
              }}
              onLoad={handleImageLoad}
              onError={() => setIframeBlocked(true)}
            />
            
            {/* Highlight overlay for bounding box */}
            {boundingBox && imageSize.width > 0 && (
              <div 
                className="absolute border-2 border-primary bg-primary/10 pointer-events-none transition-all duration-300 rounded animate-pulse"
                style={{
                  left: `${(boundingBox.x / 100) * imageSize.width * zoom}px`,
                  top: `${(boundingBox.y / 100) * imageSize.height * zoom}px`,
                  width: `${(boundingBox.width / 100) * imageSize.width * zoom}px`,
                  height: `${(boundingBox.height / 100) * imageSize.height * zoom}px`,
                }}
              />
            )}
          </div>
        )}
      </div>

      {/* Hint when field is highlighted */}
      {highlightedField && !isPdf && (
        <p className="text-xs text-muted-foreground text-center">
          Zone du champ mise en évidence • Survolez un autre champ ou quittez pour réinitialiser
        </p>
      )}
    </div>
  );
}
