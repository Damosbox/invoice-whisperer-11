import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Plus, FileSpreadsheet, Link2 } from 'lucide-react';
import { BankStatementUpload } from '@/components/bank/BankStatementUpload';
import { BankStatementsTable } from '@/components/bank/BankStatementsTable';
import { MatchingWorkbench } from '@/components/bank/MatchingWorkbench';
import { ReconciliationStats } from '@/components/bank/ReconciliationStats';
import { useBankStatements } from '@/hooks/useBankStatements';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

export default function BankReconciliation() {
  const [activeTab, setActiveTab] = useState('matching');
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const { data: statements, isLoading, refetch } = useBankStatements();

  const handleImportComplete = () => {
    setShowUploadDialog(false);
    refetch();
  };

  return (
    <>
      <Helmet>
        <title>Réconciliation Bancaire | FacturaPro</title>
      </Helmet>

      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Réconciliation Bancaire</h1>
            <p className="text-muted-foreground">
              Importez vos relevés et rapprochez les transactions avec les factures
            </p>
          </div>
          <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Importer un relevé
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Importer un relevé bancaire</DialogTitle>
                <DialogDescription>
                  Glissez votre fichier CSV ou OFX pour importer les transactions
                </DialogDescription>
              </DialogHeader>
              <BankStatementUpload onImportComplete={handleImportComplete} />
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats */}
        <ReconciliationStats />

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="matching" className="flex items-center gap-2">
              <Link2 className="h-4 w-4" />
              Rapprochement
            </TabsTrigger>
            <TabsTrigger value="statements" className="flex items-center gap-2">
              <FileSpreadsheet className="h-4 w-4" />
              Relevés importés
            </TabsTrigger>
          </TabsList>

          <TabsContent value="matching" className="mt-6">
            <MatchingWorkbench />
          </TabsContent>

          <TabsContent value="statements" className="mt-6">
            <BankStatementsTable
              statements={statements || []}
              isLoading={isLoading}
              onViewStatement={(id) => {
                // TODO: Open statement detail
                console.log('View statement:', id);
              }}
            />
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}
