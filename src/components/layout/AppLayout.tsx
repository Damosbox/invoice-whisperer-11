import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  FileText, 
  Upload, 
  Users, 
  LogOut,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  ClipboardList,
  ShieldCheck,
  UserCog,
  CheckCircle2,
  ScanSearch,
  Link2,
  Scale,
  ShieldAlert,
  BarChart3,
  UserCheck,
  Sparkles,
  Landmark,
} from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { UserRoleBadge } from './UserRoleBadge';
import { toast } from 'sonner';
import { CopilotProvider } from '@/contexts/CopilotContext';
import { CopilotPanel } from '@/components/copilot/CopilotPanel';
import { CopilotFAB } from '@/components/copilot/CopilotFAB';

const mainNavItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/invoices', icon: FileText, label: 'Factures' },
  { to: '/upload', icon: Upload, label: 'Import' },
  { to: '/copilot', icon: Sparkles, label: 'IA Copilot' },
];

const workflowNavItems = [
  { to: '/ocr-validation', icon: ScanSearch, label: 'Validation OCR' },
  { to: '/matching', icon: Link2, label: 'Rapprochement' },
  { to: '/approval', icon: CheckCircle2, label: 'À approuver' },
  { to: '/delegations', icon: UserCheck, label: 'Délégations' },
  { to: '/bank-reconciliation', icon: Landmark, label: 'Réconciliation bancaire' },
];

const referenceNavItems = [
  { to: '/suppliers', icon: Users, label: 'Fournisseurs' },
  { to: '/supplier-risk', icon: ShieldAlert, label: 'Score risque' },
  { to: '/purchase-orders', icon: ClipboardList, label: 'Bons de commande' },
  { to: '/exceptions', icon: AlertTriangle, label: 'Exceptions' },
  { to: '/disputes', icon: Scale, label: 'Litiges' },
];

const adminNavItems = [
  { to: '/approval-rules', icon: ShieldCheck, label: 'Règles d\'approbation' },
  { to: '/user-roles', icon: UserCog, label: 'Gestion des rôles' },
  { to: '/ocr-quality', icon: BarChart3, label: 'Qualité OCR' },
];

export function AppLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    toast.success('Déconnexion réussie');
    navigate('/auth');
  };

  return (
    <CopilotProvider>
      <div className="flex min-h-screen w-full bg-background">
        {/* Sidebar */}
        <aside 
          className={cn(
            "flex flex-col border-r border-border bg-card transition-all duration-300 shrink-0",
            collapsed ? "w-16" : "w-56"
          )}
        >
        {/* Logo */}
        <div className="flex items-center gap-2 p-4 border-b border-border h-14">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shrink-0">
            <FileText className="h-4 w-4 text-primary-foreground" />
          </div>
          {!collapsed && <span className="font-semibold">FacturaPro</span>}
        </div>

        {/* User info */}
        <div className={cn("p-3 border-b border-border", collapsed ? "flex justify-center" : "")}>
          {collapsed ? (
            <UserRoleBadge collapsed />
          ) : (
            <div className="space-y-1">
              <p className="text-sm font-medium truncate">{user?.email}</p>
              <UserRoleBadge />
            </div>
          )}
        </div>

        {/* Main Navigation */}
        <nav className="flex-1 p-2 space-y-4 overflow-y-auto">
          <div className="space-y-1">
            {!collapsed && (
              <p className="px-3 py-1 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Principal
              </p>
            )}
            {mainNavItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors",
                    isActive 
                      ? "bg-primary/10 text-primary font-medium" 
                      : "text-muted-foreground hover:bg-muted hover:text-foreground",
                    collapsed && "justify-center px-2"
                  )
                }
              >
                <item.icon className="h-4 w-4 shrink-0" />
                {!collapsed && <span>{item.label}</span>}
              </NavLink>
            ))}
          </div>

          <Separator />

          <div className="space-y-1">
            {!collapsed && (
              <p className="px-3 py-1 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Workflow
              </p>
            )}
            {workflowNavItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors",
                    isActive 
                      ? "bg-primary/10 text-primary font-medium" 
                      : "text-muted-foreground hover:bg-muted hover:text-foreground",
                    collapsed && "justify-center px-2"
                  )
                }
              >
                <item.icon className="h-4 w-4 shrink-0" />
                {!collapsed && <span>{item.label}</span>}
              </NavLink>
            ))}
          </div>

          <Separator />

          <div className="space-y-1">
            {!collapsed && (
              <p className="px-3 py-1 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Référentiels
              </p>
            )}
            {referenceNavItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors",
                    isActive 
                      ? "bg-primary/10 text-primary font-medium" 
                      : "text-muted-foreground hover:bg-muted hover:text-foreground",
                    collapsed && "justify-center px-2"
                  )
                }
              >
                <item.icon className="h-4 w-4 shrink-0" />
                {!collapsed && <span>{item.label}</span>}
              </NavLink>
            ))}
          </div>

          <Separator />

          <div className="space-y-1">
            {!collapsed && (
              <p className="px-3 py-1 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Administration
              </p>
            )}
            {adminNavItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors",
                    isActive 
                      ? "bg-primary/10 text-primary font-medium" 
                      : "text-muted-foreground hover:bg-muted hover:text-foreground",
                    collapsed && "justify-center px-2"
                  )
                }
              >
                <item.icon className="h-4 w-4 shrink-0" />
                {!collapsed && <span>{item.label}</span>}
              </NavLink>
            ))}
          </div>
        </nav>

        {/* Footer */}
        <div className="p-2 border-t border-border space-y-1">
          <Button
            variant="ghost"
            size="sm"
            className={cn("w-full", collapsed ? "justify-center px-2" : "justify-start")}
            onClick={() => setCollapsed(!collapsed)}
          >
            {collapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <>
                <ChevronLeft className="h-4 w-4 mr-2" />
                <span>Réduire</span>
              </>
            )}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              "w-full text-muted-foreground hover:text-destructive", 
              collapsed ? "justify-center px-2" : "justify-start"
            )}
            onClick={handleSignOut}
          >
            <LogOut className="h-4 w-4 shrink-0" />
            {!collapsed && <span className="ml-2">Déconnexion</span>}
          </Button>
        </div>
      </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>

        {/* Copilot Panel & FAB */}
        <CopilotPanel />
        <CopilotFAB />
      </div>
    </CopilotProvider>
  );
}
