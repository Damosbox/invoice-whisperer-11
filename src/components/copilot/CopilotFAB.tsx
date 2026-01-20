import { Button } from '@/components/ui/button';
import { Sparkles, X } from 'lucide-react';
import { useCopilot } from '@/contexts/CopilotContext';
import { cn } from '@/lib/utils';

export function CopilotFAB() {
  const { isOpen, toggle } = useCopilot();

  // Hide FAB when panel is open to avoid overlapping with send button
  if (isOpen) return null;

  return (
    <Button
      onClick={toggle}
      size="lg"
      className="fixed bottom-6 right-6 z-40 h-14 w-14 rounded-full shadow-lg bg-primary hover:bg-primary/90 text-primary-foreground"
    >
      <Sparkles className="h-6 w-6" />
    </Button>
  );
}
