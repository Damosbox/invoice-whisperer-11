import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { AuthProvider } from "@/contexts/AuthContext";
import { AppLayout } from "@/components/layout/AppLayout";
import { ProtectedRoute } from "@/components/layout/ProtectedRoute";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Invoices from "./pages/Invoices";
import InvoiceDetail from "./pages/InvoiceDetail";
import Upload from "./pages/Upload";
import Suppliers from "./pages/Suppliers";
import Supplier360 from "./pages/Supplier360";
import SupplierRiskDashboard from "./pages/SupplierRiskDashboard";
import PurchaseOrders from "./pages/PurchaseOrders";
import Exceptions from "./pages/Exceptions";
import Disputes from "./pages/Disputes";
import DisputeDetail from "./pages/DisputeDetail";
import ApprovalRules from "./pages/ApprovalRules";
import UserRoles from "./pages/UserRoles";
import ApprovalQueue from "./pages/ApprovalQueue";
import OcrValidationQueue from "./pages/OcrValidationQueue";
import OcrQuality from "./pages/OcrQuality";
import MatchingQueue from "./pages/MatchingQueue";
import InvoiceMatching from "./pages/InvoiceMatching";
import Delegations from "./pages/Delegations";
import BankReconciliation from "./pages/BankReconciliation";
import Copilot from "./pages/Copilot";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <HelmetProvider>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/auth" element={<Auth />} />
              <Route 
                element={
                  <ProtectedRoute>
                    <AppLayout />
                  </ProtectedRoute>
                }
              >
                <Route path="/" element={<Index />} />
                <Route path="/invoices" element={<Invoices />} />
                <Route path="/invoices/:id" element={<InvoiceDetail />} />
                <Route path="/invoices/:id/matching" element={<InvoiceMatching />} />
                <Route path="/upload" element={<Upload />} />
                <Route path="/suppliers" element={<Suppliers />} />
                <Route path="/suppliers/:id" element={<Supplier360 />} />
                <Route path="/supplier-risk" element={<SupplierRiskDashboard />} />
                <Route path="/purchase-orders" element={<PurchaseOrders />} />
                <Route path="/exceptions" element={<Exceptions />} />
                <Route path="/disputes" element={<Disputes />} />
                <Route path="/disputes/:id" element={<DisputeDetail />} />
                <Route path="/approval-rules" element={<ApprovalRules />} />
                <Route path="/user-roles" element={<UserRoles />} />
                <Route path="/approval" element={<ApprovalQueue />} />
                <Route path="/ocr-validation" element={<OcrValidationQueue />} />
                <Route path="/ocr-quality" element={<OcrQuality />} />
                <Route path="/matching" element={<MatchingQueue />} />
                <Route path="/delegations" element={<Delegations />} />
                <Route path="/bank-reconciliation" element={<BankReconciliation />} />
                <Route path="/copilot" element={<Copilot />} />
              </Route>
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  </HelmetProvider>
);

export default App;
