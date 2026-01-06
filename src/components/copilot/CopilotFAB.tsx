import { Button } from '@/components/ui/button';
import { Sparkles, X } from 'lucide-react';
import { useCopilot } from '@/contexts/CopilotContext';
import { cn } from '@/lib/utils';

export function CopilotFAB() {
  const { isOpen, toggle } = useCopilot();

  return (
    <Button
      onClick={toggle}
      size="lg"
      className={cn(
        'fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full shadow-lg transition-all duration-300',
        isOpen 
          ? 'bg-muted hover:bg-muted/80 text-muted-foreground' 
          : 'bg-primary hover:bg-primary/90 text-primary-foreground'
      )}
    >
      <div className={cn('transition-transform duration-300', isOpen && 'rotate-90')}>
        {isOpen ? <X className="h-6 w-6" /> : <Sparkles className="h-6 w-6" />}
      </div>
    </Button>
  );
}
