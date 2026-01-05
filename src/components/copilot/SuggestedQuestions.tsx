import { Button } from '@/components/ui/button';
import { HelpCircle } from 'lucide-react';

interface SuggestedQuestionsProps {
  onSelectQuestion: (question: string) => void;
  disabled?: boolean;
}

const SUGGESTED_QUESTIONS = [
  "Quel est le montant total des factures en retard ?",
  "Quels fournisseurs ont le plus de litiges ?",
  "Quelle est la tendance des factures ce mois-ci ?",
  "Combien de factures sont en exception ?",
  "Quel est le délai moyen de traitement ?",
  "Y a-t-il des anomalies critiques à traiter ?",
  "Quels sont les top 5 fournisseurs par montant ?",
  "Résume-moi la situation financière actuelle",
];

export function SuggestedQuestions({ onSelectQuestion, disabled }: SuggestedQuestionsProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
        <HelpCircle className="h-4 w-4" />
        Questions suggérées
      </div>
      <div className="flex flex-wrap gap-2">
        {SUGGESTED_QUESTIONS.map((question, index) => (
          <Button
            key={index}
            variant="outline"
            size="sm"
            className="text-xs h-auto py-2 px-3 whitespace-normal text-left"
            onClick={() => onSelectQuestion(question)}
            disabled={disabled}
          >
            {question}
          </Button>
        ))}
      </div>
    </div>
  );
}
