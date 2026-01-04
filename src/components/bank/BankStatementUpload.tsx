import { useState, useCallback } from 'react';
import { Upload, FileSpreadsheet, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ColumnMappingDialog } from './ColumnMappingDialog';

interface BankStatementUploadProps {
  onImportComplete: () => void;
}

export function BankStatementUpload({ onImportComplete }: BankStatementUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [csvData, setCsvData] = useState<string[][]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [showMappingDialog, setShowMappingDialog] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const parseCSV = (text: string): string[][] => {
    const lines = text.split('\n').filter(line => line.trim());
    return lines.map(line => {
      const values: string[] = [];
      let current = '';
      let inQuotes = false;

      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if ((char === ',' || char === ';') && !inQuotes) {
          values.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }
      values.push(current.trim());
      return values;
    });
  };

  const handleFile = useCallback(async (file: File) => {
    setError(null);
    
    if (!file.name.endsWith('.csv') && !file.name.endsWith('.ofx')) {
      setError('Format non supporté. Utilisez un fichier CSV ou OFX.');
      return;
    }

    try {
      const text = await file.text();
      
      if (file.name.endsWith('.csv')) {
        const parsed = parseCSV(text);
        if (parsed.length < 2) {
          setError('Le fichier CSV doit contenir au moins un en-tête et une ligne de données.');
          return;
        }
        setHeaders(parsed[0]);
        setCsvData(parsed.slice(1));
        setSelectedFile(file);
        setShowMappingDialog(true);
      } else if (file.name.endsWith('.ofx')) {
        // OFX parsing - simplified for common format
        const transactions = parseOFX(text);
        if (transactions.length === 0) {
          setError('Aucune transaction trouvée dans le fichier OFX.');
          return;
        }
        // For OFX, we auto-map the fields
        setCsvData(transactions.map(t => [
          t.date,
          t.amount.toString(),
          t.description,
          t.reference || '',
          t.counterparty || '',
        ]));
        setHeaders(['Date', 'Montant', 'Description', 'Référence', 'Contrepartie']);
        setSelectedFile(file);
        setShowMappingDialog(true);
      }
    } catch (err) {
      setError(`Erreur de lecture: ${err instanceof Error ? err.message : 'Erreur inconnue'}`);
    }
  }, []);

  const parseOFX = (text: string): Array<{
    date: string;
    amount: number;
    description: string;
    reference?: string;
    counterparty?: string;
  }> => {
    const transactions: Array<{
      date: string;
      amount: number;
      description: string;
      reference?: string;
      counterparty?: string;
    }> = [];

    // Simple OFX parser - extract STMTTRN blocks
    const stmtTrnRegex = /<STMTTRN>([\s\S]*?)<\/STMTTRN>/gi;
    let match;

    while ((match = stmtTrnRegex.exec(text)) !== null) {
      const block = match[1];
      
      const getTagValue = (tag: string): string => {
        const tagRegex = new RegExp(`<${tag}>([^<\\n]+)`, 'i');
        const tagMatch = block.match(tagRegex);
        return tagMatch ? tagMatch[1].trim() : '';
      };

      const dateStr = getTagValue('DTPOSTED');
      const amount = parseFloat(getTagValue('TRNAMT')) || 0;
      const description = getTagValue('NAME') || getTagValue('MEMO') || '';
      const reference = getTagValue('FITID');

      if (dateStr && !isNaN(amount)) {
        // Parse OFX date format (YYYYMMDD or YYYYMMDDHHMMSS)
        const year = dateStr.substring(0, 4);
        const month = dateStr.substring(4, 6);
        const day = dateStr.substring(6, 8);
        const formattedDate = `${year}-${month}-${day}`;

        transactions.push({
          date: formattedDate,
          amount,
          description,
          reference,
        });
      }
    }

    return transactions;
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFile(files[0]);
    }
  }, [handleFile]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files ? Array.from(e.target.files) : [];
    if (files.length > 0) {
      handleFile(files[0]);
    }
    e.target.value = '';
  }, [handleFile]);

  const handleMappingComplete = () => {
    setShowMappingDialog(false);
    setSelectedFile(null);
    setCsvData([]);
    setHeaders([]);
    onImportComplete();
  };

  return (
    <div className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={cn(
          "relative border-2 border-dashed rounded-lg transition-all duration-200 cursor-pointer",
          isDragging 
            ? "border-primary bg-primary/5 scale-[1.02]" 
            : "border-border hover:border-primary/50 hover:bg-muted/30"
        )}
      >
        <input
          type="file"
          accept=".csv,.ofx"
          onChange={handleFileSelect}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />
        
        <div className="flex flex-col items-center justify-center p-12 text-center">
          <div className={cn(
            "p-4 rounded-full mb-4 transition-colors",
            isDragging ? "bg-primary/20" : "bg-primary/10"
          )}>
            {isDragging ? (
              <FileSpreadsheet className="h-8 w-8 text-primary" />
            ) : (
              <Upload className="h-8 w-8 text-primary" />
            )}
          </div>
          
          <p className="font-medium text-foreground">
            {isDragging ? "Déposez le fichier ici" : "Glissez votre relevé bancaire ici"}
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            ou cliquez pour sélectionner un fichier
          </p>
          <p className="text-xs text-muted-foreground mt-3">
            Formats acceptés : CSV, OFX
          </p>
        </div>
      </div>

      <ColumnMappingDialog
        open={showMappingDialog}
        onOpenChange={setShowMappingDialog}
        fileName={selectedFile?.name || ''}
        headers={headers}
        data={csvData}
        onComplete={handleMappingComplete}
      />
    </div>
  );
}
