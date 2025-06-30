
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Loader2, Save } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface Client {
  id: string;
  name: string;
}

interface InvoiceFormProps {
  clients: Client[];
  onInvoiceCreated: () => void;
  user: any;
}

const InvoiceForm = ({ clients, onInvoiceCreated, user }: InvoiceFormProps) => {
  const [formData, setFormData] = useState({
    client_name: "",
    amount: "",
    due_date: undefined as Date | undefined,
    notes: "",
    status: "Pending" as string
  });
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.client_name || !formData.amount) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    // Validate due date only if status is Pending
    if (formData.status === "Pending" && !formData.due_date) {
      toast({
        title: "Due Date Required",
        description: "Due date is required for pending invoices",
        variant: "destructive"
      });
      return;
    }

    // Validate that due date is not in the past for pending invoices
    if (formData.status === "Pending" && formData.due_date && formData.due_date < new Date()) {
      toast({
        title: "Invalid Due Date",
        description: "Due date cannot be in the past",
        variant: "destructive"
      });
      return;
    }

    setSaving(true);

    try {
      const { error } = await supabase
        .from('invoices')
        .insert({
          client_name: formData.client_name,
          amount: Number(formData.amount),
          due_date: formData.status === "Pending" ? formData.due_date?.toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
          notes: formData.notes,
          status: formData.status,
          user_id: user?.id
        });

      if (error) throw error;

      toast({
        title: "Invoice created!",
        description: "Your invoice has been created successfully."
      });

      setFormData({
        client_name: "",
        amount: "",
        due_date: undefined,
        notes: "",
        status: "Pending"
      });

      onInvoiceCreated();
    } catch (error) {
      console.error('Error creating invoice:', error);
      toast({
        title: "Error",
        description: "Failed to create invoice. Please try again.",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="shadow-lg border-0 bg-gradient-to-br from-green-50 to-blue-50">
      <CardHeader>
        <CardTitle className="text-lg text-green-600">Create New Invoice</CardTitle>
        <CardDescription>Generate a professional invoice for your client</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="client">Client Name *</Label>
              <Select value={formData.client_name} onValueChange={(value) => setFormData({...formData, client_name: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Select or type client name" />
                </SelectTrigger>
                <SelectContent>
                  {clients.map((client) => (
                    <SelectItem key={client.id} value={client.name}>
                      {client.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="amount">Amount (₦) *</Label>
              <Input
                id="amount"
                type="number"
                placeholder="0.00"
                value={formData.amount}
                onChange={(e) => setFormData({...formData, amount: e.target.value})}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select value={formData.status} onValueChange={(value) => setFormData({...formData, status: value})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Pending">Pending</SelectItem>
                  <SelectItem value="Paid">Paid</SelectItem>
                  <SelectItem value="Overdue">Overdue</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {formData.status === "Pending" && (
              <div className="space-y-2">
                <Label>Due Date *</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !formData.due_date && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.due_date ? format(formData.due_date, "PPP") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={formData.due_date}
                      onSelect={(date) => setFormData({...formData, due_date: date})}
                      disabled={(date) => date < new Date()}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              placeholder="Additional details about the invoice..."
              value={formData.notes}
              onChange={(e) => setFormData({...formData, notes: e.target.value})}
              rows={3}
            />
          </div>

          <Button 
            type="submit" 
            className="w-full bg-gradient-to-r from-green-600 to-blue-500 hover:from-green-700 hover:to-blue-600"
            disabled={saving}
          >
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating Invoice...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Create Invoice
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default InvoiceForm;
