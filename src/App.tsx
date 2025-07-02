
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { Layout } from "@/components/Layout";
import Index from "./pages/Index";
import Register from "./pages/Register";
import Login from "./pages/Login";
import ResetPassword from "./pages/ResetPassword";
import Dashboard from "./pages/Dashboard";
import Features from "./pages/Features";
import Pricing from "./pages/Pricing";
import Profile from "./pages/Profile";
import Products from "./pages/Products";
import Invoices from "./pages/Invoices";
import Expenses from "./pages/Expenses";
import Clients from "./pages/Clients";
import Payments from "./pages/Payments";
import Transactions from "./pages/Transactions";
import Referrals from "./pages/Referrals";
import SalesReport from "./pages/SalesReport";
import NotFound from "./pages/NotFound";
import TeamManagement from "./pages/TeamManagement";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Layout />}>
              <Route index element={<Index />} />
              <Route path="register" element={<Register />} />
              <Route path="login" element={<Login />} />
              <Route path="reset-password" element={<ResetPassword />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="products" element={<Products />} />
              <Route path="profile" element={<Profile />} />
              <Route path="invoices" element={<Invoices />} />
              <Route path="expenses" element={<Expenses />} />
              <Route path="clients" element={<Clients />} />
              <Route path="payments" element={<Payments />} />
              <Route path="transactions" element={<Transactions />} />
              <Route path="referrals" element={<Referrals />} />
              <Route path="sales-report" element={<SalesReport />} />
              <Route path="team" element={<TeamManagement />} />
              <Route path="features" element={<Features />} />
              <Route path="pricing" element={<Pricing />} />
              <Route path="*" element={<NotFound />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
