
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, FileText, Loader2 } from "lucide-react";
import InvoiceForm from "@/components/invoices/InvoiceForm";
import InvoiceList from "@/components/invoices/InvoiceList";

interface Invoice {
  id: string;
  client_name: string;
  amount: number;
  due_date: string;
  status: string;
  notes?: string;
  created_at: string;
}

interface Client {
  id: string;
  name: string;
}

const Invoices = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    try {
      // Load invoices
      const { data: invoicesData, error: invoicesError } = await supabase
        .from('invoices')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (invoicesError) throw invoicesError;

      // Load clients
      const { data: clientsData, error: clientsError } = await supabase
        .from('clients')
        .select('*')
        .eq('user_id', user?.id)
        .order('name');

      if (clientsError) throw clientsError;

      setInvoices(invoicesData || []);
      setClients(clientsData || []);
    } catch (error) {
      console.error('Error loading data:', error);
      toast({
        title: "Error",
        description: "Failed to load invoices and clients",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 flex items-center justify-center">
        <div className="flex items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin text-green-600" />
          <span className="text-gray-600">Loading invoices...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <Button 
              variant="ghost" 
              onClick={() => navigate('/dashboard')}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Back to Dashboard</span>
            </Button>
            
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-green-600 to-blue-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">B</span>
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-green-600 to-blue-500 bg-clip-text text-transparent">
                Bizflow
              </span>
            </div>
            
            <div className="w-20"></div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        {/* Page Header */}
        <div className="text-center space-y-4">
          <div className="w-16 h-16 bg-gradient-to-br from-green-100 to-blue-100 rounded-full flex items-center justify-center mx-auto">
            <FileText className="h-8 w-8 text-green-600" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Invoice Management</h1>
            <p className="text-gray-600">Create and manage your business invoices</p>
          </div>
        </div>

        {/* Invoice Form */}
        <InvoiceForm 
          clients={clients}
          onInvoiceCreated={loadData}
          user={user}
        />

        {/* Invoice List */}
        <InvoiceList 
          invoices={invoices}
          onInvoiceDeleted={loadData}
        />
      </div>
    </div>
  );
};

export default Invoices;
