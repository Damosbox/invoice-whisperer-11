import { CheckCircle2, AlertCircle, Copy, Clock, FileText } from 'lucide-react';

interface UploadStatsProps {
  stats: {
    total: number;
    pending: number;
    uploading: number;
    success: number;
    error: number;
    duplicate: number;
  };
}

export function UploadStats({ stats }: UploadStatsProps) {
  if (stats.total === 0) return null;

  const items = [
    { 
      label: 'Total', 
      value: stats.total, 
      icon: FileText, 
      color: 'text-muted-foreground',
      bg: 'bg-muted'
    },
    { 
      label: 'En attente', 
      value: stats.pending + stats.uploading, 
      icon: Clock, 
      color: 'text-primary',
      bg: 'bg-primary/10'
    },
    { 
      label: 'Importés', 
      value: stats.success, 
      icon: CheckCircle2, 
      color: 'text-status-validated',
      bg: 'bg-status-validated/10'
    },
    { 
      label: 'Doublons', 
      value: stats.duplicate, 
      icon: Copy, 
      color: 'text-status-pending',
      bg: 'bg-status-pending/10'
    },
    { 
      label: 'Erreurs', 
      value: stats.error, 
      icon: AlertCircle, 
      color: 'text-destructive',
      bg: 'bg-destructive/10'
    },
  ].filter(item => item.value > 0);

  return (
    <div className="flex flex-wrap gap-3">
      {items.map((item) => (
        <div 
          key={item.label}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${item.bg}`}
        >
          <item.icon className={`h-4 w-4 ${item.color}`} />
          <span className={`text-sm font-medium ${item.color}`}>
            {item.value} {item.label.toLowerCase()}
          </span>
        </div>
      ))}
    </div>
  );
}
