import { Helmet } from 'react-helmet-async';
import { CopilotContextCard } from '@/components/copilot/CopilotContextCard';
import { Card } from '@/components/ui/card';
import { CopilotChatFull } from '@/components/copilot/CopilotChatFull';

export default function Copilot() {
  return (
    <>
      <Helmet>
        <title>IA Copilot - FacturaPro</title>
      </Helmet>
      
      <div className="container mx-auto py-6 h-[calc(100vh-4rem)]">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-full">
          {/* Chat principal */}
          <Card className="lg:col-span-3 flex flex-col overflow-hidden">
            <CopilotChatFull />
          </Card>
          
          {/* Sidebar contexte */}
          <div className="space-y-4">
            <CopilotContextCard />
            
            <Card className="p-4">
              <h3 className="font-medium mb-2 text-sm">💡 Conseils</h3>
              <ul className="text-xs text-muted-foreground space-y-2">
                <li>• Posez des questions précises pour des réponses détaillées</li>
                <li>• L'IA analyse vos données en temps réel</li>
                <li>• Demandez des recommandations d'actions</li>
                <li>• Explorez les tendances et anomalies</li>
              </ul>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
}
