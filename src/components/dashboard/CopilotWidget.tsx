import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Sparkles, ArrowRight } from 'lucide-react';

const QUICK_QUESTIONS = [
  "Résume-moi la situation actuelle",
  "Factures en retard ?",
  "Anomalies à traiter ?",
];

export function CopilotWidget() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const handleQuestionClick = (question: string) => {
    setOpen(false);
    navigate('/copilot', { state: { initialQuestion: question } });
  };

  const handleOpenCopilot = () => {
    setOpen(false);
    navigate('/copilot');
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          size="lg"
          className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg"
        >
          <Sparkles className="h-6 w-6" />
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        className="w-72 p-3" 
        align="end" 
        side="top"
        sideOffset={8}
      >
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="font-medium text-sm">IA Copilot</span>
          </div>
          
          <div className="space-y-1">
            {QUICK_QUESTIONS.map((question, index) => (
              <button
                key={index}
                className="w-full text-left text-sm px-3 py-2 rounded-md hover:bg-muted transition-colors"
                onClick={() => handleQuestionClick(question)}
              >
                {question}
              </button>
            ))}
          </div>
          
          <Button 
            variant="outline" 
            className="w-full" 
            size="sm"
            onClick={handleOpenCopilot}
          >
            Ouvrir le chat complet
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
