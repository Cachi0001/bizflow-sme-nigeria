import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import {
  Download,
  FileImage,
  FileText,
  Calendar,
  DollarSign,
  Package,
  CreditCard,
  Smartphone,
  Building2,
  Banknote
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface SalesData {
  id: string;
  date: string;
  client_name: string;
  description: string;
  quantity: number;
  amount: number;
  payment_method: 'Cash' | 'Bank Transfer' | 'Mobile Money';
  remarks?: string;
}

interface SalesSummary {
  totalAmount: number;
  totalQuantity: number;
  cashAmount: number;
  bankTransferAmount: number;
  mobileMoney: number;
  totalTransactions: number;
}

interface InvoiceData {
  id: string;
  created_at: string;
  amount: number;
  status: string;
  client_name: string;
}

interface PaymentData {
  invoice_id: string;
  payment_method: string;
  amount: number;
}

const SalesReport = () => {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [salesData, setSalesData] = useState<SalesData[]>([]);
  const [summary, setSummary] = useState<SalesSummary>({
    totalAmount: 0,
    totalQuantity: 0,
    cashAmount: 0,
    bankTransferAmount: 0,
    mobileMoney: 0,
    totalTransactions: 0
  });
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user && selectedDate) {
      loadSalesData();
    }
  }, [user, selectedDate]);

  const loadSalesData = async () => {
    setLoading(true);
    try {
      // Get invoices for the selected date that are paid
      const startDate = `${selectedDate}T00:00:00.000Z`;
      const endDate = `${selectedDate}T23:59:59.999Z`;

      const { data: invoicesData, error: invoicesError } = await supabase
        .from("invoices")
        .select("id, created_at, amount, status, client_name")
        .eq("user_id", user?.id)
        .gte("created_at", startDate)
        .lte("created_at", endDate)
        .eq("status", "Paid")
        .order("created_at", { ascending: false });

      if (invoicesError) {
        console.error("Error fetching invoices:", invoicesError);
        throw new Error("Failed to fetch invoice data");
      }

      const invoices = invoicesData as InvoiceData[] || [];

      // Get payment information for these invoices
      const invoiceIds = invoices.map(invoice => invoice.id);
      let paymentsData: PaymentData[] = [];
      
      if (invoiceIds.length > 0) {
        const { data: payments, error: paymentsError } = await supabase
          .from("payments")
          .select("invoice_id, payment_method, amount")
          .in("invoice_id", invoiceIds);

        if (paymentsError) {
          console.error("Error fetching payments:", paymentsError);
          // Continue without payment method data
        } else {
          paymentsData = payments as PaymentData[] || [];
        }
      }

      // Transform the data to match our SalesData interface
      const transformedData: SalesData[] = invoices.map(invoice => {
        const payment = paymentsData.find(p => p.invoice_id === invoice.id);
        return {
          id: invoice.id,
          date: new Date(invoice.created_at).toLocaleDateString('en-NG', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
          }),
          client_name: invoice.client_name || 'Walk-in Customer',
          description: 'Product/Service Sale', // Default description since column doesn't exist
          quantity: 1, // Default quantity since column doesn't exist
          amount: Number(invoice.amount) || 0,
          payment_method: (payment?.payment_method as 'Cash' | 'Bank Transfer' | 'Mobile Money') || 'Cash',
          remarks: ''
        };
      });

      setSalesData(transformedData);

      // Calculate summary with better error handling
      const totalAmount = transformedData.reduce((sum, sale) => sum + (Number(sale.amount) || 0), 0);
      const totalQuantity = transformedData.reduce((sum, sale) => sum + (Number(sale.quantity) || 0), 0);
      
      const cashAmount = transformedData
        .filter(sale => sale.payment_method === 'Cash')
        .reduce((sum, sale) => sum + (Number(sale.amount) || 0), 0);
      
      const bankTransferAmount = transformedData
        .filter(sale => sale.payment_method === 'Bank Transfer')
        .reduce((sum, sale) => sum + (Number(sale.amount) || 0), 0);
      
      const mobileMoney = transformedData
        .filter(sale => sale.payment_method === 'Mobile Money')
        .reduce((sum, sale) => sum + (Number(sale.amount) || 0), 0);

      setSummary({
        totalAmount,
        totalQuantity,
        cashAmount,
        bankTransferAmount,
        mobileMoney,
        totalTransactions: transformedData.length
      });

    } catch (error: any) {
      console.error("Error loading sales data:", error);
      toast({
        title: "Error loading sales data",
        description: error.message || "Please try again later.",
        variant: "destructive"
      });
      
      // Reset data on error
      setSalesData([]);
      setSummary({
        totalAmount: 0,
        totalQuantity: 0,
        cashAmount: 0,
        bankTransferAmount: 0,
        mobileMoney: 0,
        totalTransactions: 0
      });
    } finally {
      setLoading(false);
    }
  };

  const downloadAsImage = async () => {
    try {
      // Create a canvas element to generate the image
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      canvas.width = 800;
      canvas.height = 600 + (salesData.length * 30);

      // Set background
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Title
      ctx.fillStyle = '#000000';
      ctx.font = 'bold 24px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('DAILY SALES REPORT', canvas.width / 2, 40);

      // Date
      ctx.font = '16px Arial';
      ctx.fillText(`Date: ${new Date(selectedDate).toLocaleDateString()}`, canvas.width / 2, 70);

      // Summary
      ctx.textAlign = 'left';
      ctx.font = 'bold 14px Arial';
      ctx.fillText(`Total Sales: ₦${summary.totalAmount.toLocaleString()}`, 50, 110);
      ctx.fillText(`Total Quantity: ${summary.totalQuantity}`, 300, 110);
      ctx.fillText(`Total Transactions: ${summary.totalTransactions}`, 500, 110);

      ctx.fillText(`Cash: ₦${summary.cashAmount.toLocaleString()}`, 50, 130);
      ctx.fillText(`Bank Transfer: ₦${summary.bankTransferAmount.toLocaleString()}`, 200, 130);
      ctx.fillText(`Mobile Money: ₦${summary.mobileMoney.toLocaleString()}`, 400, 130);

      // Table headers
      const startY = 170;
      ctx.fillStyle = '#f0f0f0';
      ctx.fillRect(50, startY, 700, 30);
      ctx.fillStyle = '#000000';
      ctx.font = 'bold 12px Arial';
      ctx.fillText('Client Name', 60, startY + 20);
      ctx.fillText('Description', 180, startY + 20);
      ctx.fillText('Quantity', 350, startY + 20);
      ctx.fillText('Amount', 420, startY + 20);
      ctx.fillText('Payment Method', 520, startY + 20);

      // Table data
      ctx.font = '11px Arial';
      salesData.forEach((sale, index) => {
        const y = startY + 30 + (index * 25);
        ctx.fillText(sale.client_name.substring(0, 15), 60, y + 15);
        ctx.fillText(sale.description.substring(0, 20), 180, y + 15);
        ctx.fillText(sale.quantity.toString(), 350, y + 15);
        ctx.fillText(`₦${sale.amount.toLocaleString()}`, 420, y + 15);
        ctx.fillText(sale.payment_method, 520, y + 15);
      });

      // Download the image
      const link = document.createElement('a');
      link.download = `sales-report-${selectedDate}.png`;
      link.href = canvas.toDataURL();
      link.click();

      toast({
        title: "Report downloaded",
        description: "Sales report image has been downloaded successfully."
      });
    } catch (error) {
      console.error("Error generating image:", error);
      toast({
        title: "Download failed",
        description: "Failed to generate image. Please try again.",
        variant: "destructive"
      });
    }
  };

  const downloadAsPDF = async () => {
    try {
      // Create a more professional PDF content
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Daily Sales Report</title>
          <style>
            @page {
              margin: 20mm;
              size: A4;
            }
            body { 
              font-family: 'Arial', sans-serif; 
              margin: 0; 
              padding: 0;
              color: #333;
              line-height: 1.4;
            }
            .header { 
              text-align: center; 
              margin-bottom: 30px; 
              border-bottom: 2px solid #22c55e;
              padding-bottom: 20px;
            }
            .header h1 {
              color: #22c55e;
              font-size: 28px;
              margin: 0 0 10px 0;
              font-weight: bold;
            }
            .header h2 {
              color: #666;
              font-size: 18px;
              margin: 0;
              font-weight: normal;
            }
            .business-info {
              text-align: center;
              margin-bottom: 20px;
              font-size: 14px;
              color: #666;
            }
            .summary { 
              margin-bottom: 30px; 
            }
            .summary h3 {
              color: #22c55e;
              font-size: 18px;
              margin-bottom: 15px;
              border-bottom: 1px solid #e5e7eb;
              padding-bottom: 5px;
            }
            .summary-grid { 
              display: grid; 
              grid-template-columns: repeat(3, 1fr); 
              gap: 15px; 
              margin-bottom: 20px; 
            }
            .summary-item { 
              padding: 15px; 
              background: #f8fafc; 
              border-radius: 8px; 
              border-left: 4px solid #22c55e;
              text-align: center;
            }
            .summary-item .label {
              font-size: 12px;
              color: #666;
              text-transform: uppercase;
              letter-spacing: 0.5px;
              margin-bottom: 5px;
            }
            .summary-item .value {
              font-size: 20px;
              font-weight: bold;
              color: #22c55e;
            }
            .payment-breakdown {
              display: grid;
              grid-template-columns: repeat(3, 1fr);
              gap: 15px;
              margin-top: 20px;
            }
            .payment-item {
              padding: 12px;
              background: #ffffff;
              border: 1px solid #e5e7eb;
              border-radius: 6px;
              text-align: center;
            }
            .payment-item .method {
              font-size: 12px;
              color: #666;
              margin-bottom: 5px;
            }
            .payment-item .amount {
              font-size: 16px;
              font-weight: bold;
              color: #333;
            }
            table { 
              width: 100%; 
              border-collapse: collapse; 
              margin-top: 20px; 
              font-size: 12px;
            }
            th, td { 
              border: 1px solid #e5e7eb; 
              padding: 10px 8px; 
              text-align: left; 
            }
            th { 
              background-color: #22c55e; 
              color: white;
              font-weight: bold;
              font-size: 11px;
              text-transform: uppercase;
              letter-spacing: 0.5px;
            }
            tr:nth-child(even) {
              background-color: #f8fafc;
            }
            .payment-method { 
              padding: 4px 8px; 
              border-radius: 4px; 
              font-size: 10px; 
              font-weight: bold;
              text-transform: uppercase;
            }
            .cash { background-color: #dcfce7; color: #166534; }
            .bank { background-color: #dbeafe; color: #1e40af; }
            .mobile { background-color: #fef3c7; color: #92400e; }
            .footer {
              margin-top: 30px;
              text-align: center;
              font-size: 10px;
              color: #666;
              border-top: 1px solid #e5e7eb;
              padding-top: 15px;
            }
            .no-data {
              text-align: center;
              padding: 40px;
              color: #666;
              font-style: italic;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>DAILY SALES REPORT</h1>
            <h2>${new Date(selectedDate).toLocaleDateString('en-NG', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}</h2>
          </div>
          
          <div class="business-info">
            <strong>Generated on:</strong> ${new Date().toLocaleDateString('en-NG')} at ${new Date().toLocaleTimeString('en-NG')}
          </div>
          
          <div class="summary">
            <h3>Sales Summary</h3>
            <div class="summary-grid">
              <div class="summary-item">
                <div class="label">Total Sales Amount</div>
                <div class="value">₦${summary.totalAmount.toLocaleString()}</div>
              </div>
              <div class="summary-item">
                <div class="label">Total Quantity Sold</div>
                <div class="value">${summary.totalQuantity}</div>
              </div>
              <div class="summary-item">
                <div class="label">Total Transactions</div>
                <div class="value">${summary.totalTransactions}</div>
              </div>
            </div>
            
            <h3>Payment Method Breakdown</h3>
            <div class="payment-breakdown">
              <div class="payment-item">
                <div class="method">Cash Payments</div>
                <div class="amount">₦${summary.cashAmount.toLocaleString()}</div>
              </div>
              <div class="payment-item">
                <div class="method">Bank Transfer</div>
                <div class="amount">₦${summary.bankTransferAmount.toLocaleString()}</div>
              </div>
              <div class="payment-item">
                <div class="method">Mobile Money</div>
                <div class="amount">₦${summary.mobileMoney.toLocaleString()}</div>
              </div>
            </div>
          </div>

          ${salesData.length === 0 ? `
            <div class="no-data">
              <h3>No Sales Recorded</h3>
              <p>No sales transactions were recorded for this date.</p>
            </div>
          ` : `
            <h3 style="color: #22c55e; margin-bottom: 15px;">Detailed Sales Transactions</h3>
            <table>
              <thead>
                <tr>
                  <th>Time</th>
                  <th>Client Name</th>
                  <th>Product/Service Description</th>
                  <th>Qty</th>
                  <th>Amount</th>
                  <th>Payment Method</th>
                </tr>
              </thead>
              <tbody>
                ${salesData.map(sale => `
                  <tr>
                    <td>${sale.date}</td>
                    <td>${sale.client_name}</td>
                    <td>${sale.description}</td>
                    <td>${sale.quantity}</td>
                    <td>₦${sale.amount.toLocaleString()}</td>
                    <td>
                      <span class="payment-method ${sale.payment_method === 'Cash' ? 'cash' : sale.payment_method === 'Bank Transfer' ? 'bank' : 'mobile'}">
                        ${sale.payment_method}
                      </span>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          `}
          
          <div class="footer">
            <p><strong>Bizflow SME Nigeria</strong> - Professional Business Management Solution</p>
            <p>This report was generated automatically from your sales data.</p>
          </div>
        </body>
        </html>
      `;

      // Create a blob and download
      const blob = new Blob([htmlContent], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `bizflow-sales-report-${selectedDate}.html`;
      link.click();
      URL.revokeObjectURL(url);

      toast({
        title: "Report downloaded successfully",
        description: "Sales report HTML file has been downloaded. Open it in your browser and use 'Print to PDF' for a professional PDF version."
      });
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast({
        title: "Download failed",
        description: "Failed to generate PDF. Please try again.",
        variant: "destructive"
      });
    }
  };

  return (
    <Card className="bg-gradient-to-br from-green-50 to-blue-50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Daily Sales Report
        </CardTitle>
        <CardDescription>
          View and download your sales report for any selected day
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Date Selection */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            <Label htmlFor="date">Select Date:</Label>
          </div>
          <Input
            id="date"
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-auto"
          />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="flex items-center gap-2">
                <Download className="h-4 w-4" />
                Download Report
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={downloadAsImage}>
                <FileImage className="h-4 w-4 mr-2" />
                Download as Image
              </DropdownMenuItem>
              <DropdownMenuItem onClick={downloadAsPDF}>
                <FileText className="h-4 w-4 mr-2" />
                Download as PDF
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-green-600" />
                <div>
                  <p className="text-sm text-gray-600">Total Sales</p>
                  <p className="text-lg font-bold">₦{summary.totalAmount.toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Package className="h-4 w-4 text-blue-600" />
                <div>
                  <p className="text-sm text-gray-600">Quantity Sold</p>
                  <p className="text-lg font-bold">{summary.totalQuantity}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Banknote className="h-4 w-4 text-green-500" />
                <div>
                  <p className="text-sm text-gray-600">Cash</p>
                  <p className="text-lg font-bold">₦{summary.cashAmount.toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-blue-500" />
                <div>
                  <p className="text-sm text-gray-600">Bank Transfer</p>
                  <p className="text-lg font-bold">₦{summary.bankTransferAmount.toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Smartphone className="h-4 w-4 text-orange-500" />
                <div>
                  <p className="text-sm text-gray-600">Mobile Money</p>
                  <p className="text-lg font-bold">₦{summary.mobileMoney.toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-purple-500" />
                <div>
                  <p className="text-sm text-gray-600">Transactions</p>
                  <p className="text-lg font-bold">{summary.totalTransactions}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sales Table */}
        <div className="border rounded-lg overflow-hidden">
          <div className="bg-gray-50 px-4 py-3 border-b">
            <h3 className="font-semibold text-gray-900">
              Sales Details for {new Date(selectedDate).toLocaleDateString()}
            </h3>
          </div>
          
          {loading ? (
            <div className="p-8 text-center">
              <p>Loading sales data...</p>
            </div>
          ) : salesData.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-gray-500">No sales recorded for this date.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Date</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Client Name</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Product/Service Description</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Quantity Sold</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Total Amount</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Payment Method</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Remarks</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {salesData.map((sale, index) => (
                    <tr key={sale.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="px-4 py-3 text-sm text-gray-900">{sale.date}</td>
                      <td className="px-4 py-3 text-sm text-gray-900">{sale.client_name}</td>
                      <td className="px-4 py-3 text-sm text-gray-900">{sale.description}</td>
                      <td className="px-4 py-3 text-sm text-gray-900">{sale.quantity}</td>
                      <td className="px-4 py-3 text-sm text-gray-900">₦{sale.amount.toLocaleString()}</td>
                      <td className="px-4 py-3 text-sm">
                        <Badge 
                          variant={
                            sale.payment_method === 'Cash' ? 'default' :
                            sale.payment_method === 'Bank Transfer' ? 'secondary' : 'outline'
                          }
                        >
                          {sale.payment_method}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">{sale.remarks || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default SalesReport;
