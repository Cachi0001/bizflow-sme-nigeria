
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { CalendarIcon, DownloadIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

interface SalesData {
  id: string;
  client_name: string;
  amount: number;
  payment_method: string;
  created_at: string;
  status: string;
}

interface DailySummary {
  totalSales: number;
  totalTransactions: number;
  paymentMethods: Record<string, number>;
}

const DailySalesReport = () => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [salesData, setSalesData] = useState<SalesData[]>([]);
  const [summary, setSummary] = useState<DailySummary>({
    totalSales: 0,
    totalTransactions: 0,
    paymentMethods: {},
  });
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user && selectedDate) {
      fetchDailySales();
    }
  }, [user, selectedDate]);

  const fetchDailySales = async () => {
    setLoading(true);
    try {
      const startDate = new Date(selectedDate);
      startDate.setHours(0, 0, 0, 0);
      
      const endDate = new Date(selectedDate);
      endDate.setHours(23, 59, 59, 999);

      // Fetch payments for the selected date
      const { data: payments, error } = await supabase
        .from("payments")
        .select("*")
        .eq("user_id", user?.id)
        .gte("created_at", startDate.toISOString())
        .lte("created_at", endDate.toISOString())
        .order("created_at", { ascending: false });

      if (error) throw error;

      const salesData: SalesData[] = payments?.map(payment => ({
        id: payment.id,
        client_name: payment.customer_name || "Walk-in Customer",
        amount: Number(payment.amount),
        payment_method: payment.payment_method,
        created_at: payment.created_at,
        status: "Completed",
      })) || [];

      setSalesData(salesData);

      // Calculate summary
      const totalSales = salesData.reduce((sum, sale) => sum + sale.amount, 0);
      const totalTransactions = salesData.length;
      const paymentMethods: Record<string, number> = {};

      salesData.forEach(sale => {
        paymentMethods[sale.payment_method] = (paymentMethods[sale.payment_method] || 0) + sale.amount;
      });

      setSummary({
        totalSales,
        totalTransactions,
        paymentMethods,
      });

    } catch (error) {
      console.error("Error fetching sales data:", error);
      toast({
        title: "Error",
        description: "Failed to fetch sales data.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const downloadReport = () => {
    const reportData = {
      date: format(selectedDate, "PPP"),
      summary,
      transactions: salesData,
    };

    const dataStr = JSON.stringify(reportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement("a");
    link.href = url;
    link.download = `daily-sales-report-${format(selectedDate, "yyyy-MM-dd")}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast({
      title: "Success",
      description: "Sales report downloaded successfully!",
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Daily Sales Report</h2>
          <p className="text-muted-foreground">View and download your daily sales performance</p>
        </div>
        <Button onClick={downloadReport} disabled={loading || salesData.length === 0}>
          <DownloadIcon className="mr-2 h-4 w-4" />
          Download Report
        </Button>
      </div>

      <div className="flex items-center gap-4">
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn("justify-start text-left font-normal", !selectedDate && "text-muted-foreground")}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {selectedDate ? format(selectedDate, "PPP") : <span>Pick a date</span>}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={(date) => date && setSelectedDate(date)}
              initialFocus
            />
          </PopoverContent>
        </Popover>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₦{summary.totalSales.toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Transactions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.totalTransactions}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Payment Methods</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {Object.entries(summary.paymentMethods).map(([method, amount]) => (
                <div key={method} className="flex justify-between items-center text-sm">
                  <span className="capitalize">{method}</span>
                  <Badge variant="outline">₦{amount.toLocaleString()}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sales Table */}
      <Card>
        <CardHeader>
          <CardTitle>Transaction Details</CardTitle>
          <CardDescription>
            Detailed breakdown of all sales for {format(selectedDate, "PPP")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Loading sales data...</div>
          ) : salesData.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No sales recorded for this date.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Time</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Payment Method</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {salesData.map((sale) => (
                  <TableRow key={sale.id}>
                    <TableCell>
                      {format(new Date(sale.created_at), "HH:mm")}
                    </TableCell>
                    <TableCell>{sale.client_name}</TableCell>
                    <TableCell>₦{sale.amount.toLocaleString()}</TableCell>
                    <TableCell className="capitalize">{sale.payment_method}</TableCell>
                    <TableCell>
                      <Badge variant="default">{sale.status}</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default DailySalesReport;
