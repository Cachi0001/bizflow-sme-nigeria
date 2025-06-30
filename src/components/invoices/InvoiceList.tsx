
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { FileText, Trash2, Calendar, DollarSign } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface Invoice {
  id: string;
  client_name: string;
  amount: number;
  due_date: string;
  status: string;
  notes?: string;
  created_at: string;
}

interface InvoiceListProps {
  invoices: Invoice[];
  onInvoiceDeleted: () => void;
}

const InvoiceList = ({ invoices, onInvoiceDeleted }: InvoiceListProps) => {
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const { toast } = useToast();

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      const { error } = await supabase
        .from('invoices')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Invoice deleted",
        description: "The invoice has been successfully deleted."
      });

      onInvoiceDeleted();
    } catch (error) {
      console.error('Error deleting invoice:', error);
      toast({
        title: "Error",
        description: "Failed to delete invoice. Please try again.",
        variant: "destructive"
      });
    } finally {
      setDeletingId(null);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-NG', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Paid': return 'bg-green-100 text-green-800';
      case 'Pending': return 'bg-yellow-100 text-yellow-800';
      case 'Overdue': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (invoices.length === 0) {
    return (
      <Card className="shadow-lg border-0 bg-gradient-to-br from-green-50 to-blue-50">
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No invoices yet</h3>
            <p className="text-gray-600">Create your first invoice to get started</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-lg border-0 bg-gradient-to-br from-green-50 to-blue-50">
      <CardHeader>
        <CardTitle className="text-lg text-green-600">Recent Invoices ({invoices.length})</CardTitle>
        <CardDescription>Manage your invoices and track payments</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {invoices.map((invoice) => (
            <div key={invoice.id} className="flex items-center justify-between p-4 bg-white rounded-lg shadow-sm">
              <div className="flex items-center space-x-4">
                <div className="p-2 bg-green-100 rounded-full">
                  <FileText className="h-4 w-4 text-green-600" />
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">{invoice.client_name}</h4>
                  <div className="flex items-center space-x-4 mt-1">
                    <span className="text-sm text-gray-500 flex items-center">
                      <DollarSign className="h-3 w-3 mr-1" />
                      {formatCurrency(invoice.amount)}
                    </span>
                    <span className="text-sm text-gray-500 flex items-center">
                      <Calendar className="h-3 w-3 mr-1" />
                      Due: {formatDate(invoice.due_date)}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Badge className={getStatusColor(invoice.status)}>
                  {invoice.status}
                </Badge>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete Invoice</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to delete this invoice for {invoice.client_name}? 
                        This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => handleDelete(invoice.id)}
                        className="bg-red-600 hover:bg-red-700"
                        disabled={deletingId === invoice.id}
                      >
                        {deletingId === invoice.id ? "Deleting..." : "Delete"}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default InvoiceList;
