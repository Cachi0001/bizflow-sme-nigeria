import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  DollarSign,
  FileText,
  ListChecks,
  Users,
  Wallet,
  UserCheck,
  TrendingUp,
  File,
  Settings,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import SalesReport from "@/components/SalesReport";

interface DashboardStats {
  totalInvoices: number;
  pendingInvoices: number;
  totalExpenses: number;
  totalPayments: number;
  referralEarnings?: number;
}

interface Subscription {
  tier: string;
  status: string;
  end_date: string | null;
}

const Dashboard = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalInvoices: 0,
    pendingInvoices: 0,
    totalExpenses: 0,
    totalPayments: 0,
    referralEarnings: 0,
  });
  const [userData, setUserData] = useState<any>(null);
  const [currentSubscription, setCurrentSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [upgrading, setUpgrading] = useState<string | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [chartData, setChartData] = useState<any[]>([]);

  useEffect(() => {
    if (user) {
      loadDashboardData();
      loadChartData();
    }
  }, [user]);

  const loadDashboardData = async () => {
    try {
      const [invoicesData, expensesData, paymentsData, subscriptionData, userDataResponse] = await Promise.all([
        supabase.from("invoices").select("*").eq("user_id", user?.id),
        supabase.from("expenses").select("*").eq("user_id", user?.id),
        supabase.from("payments").select("*").eq("user_id", user?.id),
        supabase.from("subscriptions").select("*").eq("user_id", user?.id).single(),
        supabase.from("users").select("*").eq("id", user?.id).single()
      ]);

      const invoices = invoicesData.data || [];
      const expenses = expensesData.data || [];
      const payments = paymentsData.data || [];
      const subscription = subscriptionData.data;
      const userData = userDataResponse.data;

      setStats({
        totalInvoices: invoices.length,
        pendingInvoices: invoices.filter(inv => inv.status === "Pending").length,
        totalExpenses: expenses.reduce((sum, exp) => sum + Number(exp.amount), 0),
        totalPayments: payments.reduce((sum, pay) => sum + Number(pay.amount), 0),
      });

      setUserData(userData);
      setCurrentSubscription(subscription);

      // Load referral earnings if available
      if (userData?.referral_code) {
        const { data: earningsData } = await supabase
          .from("referral_earnings")
          .select("amount")
          .eq("referrer_id", user?.id);
        
        const totalEarnings = earningsData?.reduce((sum, earning) => sum + Number(earning.amount), 0) || 0;
        setStats(prev => ({ ...prev, referralEarnings: totalEarnings }));
      }

    } catch (error) {
      console.error("Error loading dashboard data:", error);
      toast({
        title: "Error loading dashboard",
        description: "Please try refreshing the page.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const loadChartData = async () => {
    try {
      const { data: invoicesData, error: invoicesError } = await supabase
        .from("invoices")
        .select("amount, created_at")
        .eq("user_id", user?.id);

      const { data: expensesData, error: expensesError } = await supabase
        .from("expenses")
        .select("amount, created_at")
        .eq("user_id", user?.id);

      if (invoicesError) throw invoicesError;
      if (expensesError) throw expensesError;

      const monthlyData: { [key: string]: { invoices: number; expenses: number } } = {};

      // Initialize data for the last 7 months
      const today = new Date();
      for (let i = 6; i >= 0; i--) {
        const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
        const monthName = date.toLocaleString("default", { month: "short" });
        monthlyData[monthName] = { invoices: 0, expenses: 0 };
      }

      invoicesData.forEach(item => {
        const monthName = new Date(item.created_at).toLocaleString("default", { month: "short" });
        if (monthlyData[monthName]) {
          monthlyData[monthName].invoices += item.amount;
        }
      });

      expensesData.forEach(item => {
        const monthName = new Date(item.created_at).toLocaleString("default", { month: "short" });
        if (monthlyData[monthName]) {
          monthlyData[monthName].expenses += item.amount;
        }
      });

      setChartData(Object.keys(monthlyData).map(month => ({ name: month, ...monthlyData[month] })));

    } catch (error) {
      console.error("Error loading chart data:", error);
      toast({
        title: "Error loading chart data",
        description: "Please try again later.",
        variant: "destructive"
      });
    }
  };

  const handleUpgrade = async (tier: string) => {
    try {
      setUpgrading(tier);
      
      const { data, error } = await supabase.functions.invoke("handle-upgrade", {
        body: { tier, userId: user?.id }
      });

      if (error) throw error;

      if (data.redirectUrl) {
        window.location.href = data.redirectUrl;
      } else {
        toast({
          title: "Upgrade successful!",
          description: `You've been upgraded to ${tier} plan.`
        });
        loadDashboardData();
      }
    } catch (error: any) {
      console.error("Upgrade error:", error);
      toast({
        title: "Upgrade failed",
        description: error.message || "Please try again later.",
        variant: "destructive"
      });
    } finally {
      setUpgrading(null);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50">
      <header className="bg-white border-b px-4 py-3">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center space-x-2">
            <Settings className="h-6 w-6 text-green-600" />
            <h1 className="text-xl font-bold text-gray-900">Dashboard</h1>
          </div>
          <div className="flex items-center space-x-4">
            {userData?.business_name && (
              <span className="text-gray-700">{userData?.business_name}</span>
            )}
            <Button variant="outline" onClick={() => navigate("/profile")}>
              Profile
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto p-4 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-br from-green-50 to-blue-50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Invoices</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalInvoices}</p>
                </div>
                <FileText className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-blue-50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Pending Invoices</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.pendingInvoices}</p>
                </div>
                <ListChecks className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-blue-50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Expenses</p>
                  <p className="text-2xl font-bold text-gray-900">₦{stats.totalExpenses.toLocaleString()}</p>
                </div>
                <Wallet className="h-8 w-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-blue-50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Payments</p>
                  <p className="text-2xl font-bold text-gray-900">₦{stats.totalPayments.toLocaleString()}</p>
                </div>
                <DollarSign className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-br from-green-50 to-blue-50 hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate("/invoices")}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Invoices</p>
                  <p className="text-lg font-semibold text-gray-900">Manage</p>
                </div>
                <FileText className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-blue-50 hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate("/expenses")}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Expenses</p>
                  <p className="text-lg font-semibold text-gray-900">Track</p>
                </div>
                <Wallet className="h-8 w-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-blue-50 hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate("/clients")}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Clients</p>
                  <p className="text-lg font-semibold text-gray-900">View</p>
                </div>
                <Users className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-blue-50 hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate("/payments")}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Payments</p>
                  <p className="text-lg font-semibold text-gray-900">Record</p>
                </div>
                <DollarSign className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-blue-50 hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate("/transactions")}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Transactions</p>
                  <p className="text-lg font-semibold text-gray-900">History</p>
                </div>
                <File className="h-8 w-8 text-indigo-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-blue-50 hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate("/referrals")}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Referrals</p>
                  <p className="text-lg font-semibold text-gray-900">
                    ₦{(stats.referralEarnings || 0).toLocaleString()}
                  </p>
                </div>
                <Users className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>

          {/* Team Management - Only for paid plans */}
          {currentSubscription?.tier !== "Free" && (
            <Card className="bg-gradient-to-br from-green-50 to-blue-50 hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate("/team")}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Team</p>
                    <p className="text-lg font-semibold text-gray-900">Manage</p>
                  </div>
                  <UserCheck className="h-8 w-8 text-indigo-600" />
                </div>
              </CardContent>
            </Card>
          )}

          <Card className="bg-gradient-to-br from-green-50 to-blue-50 hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate("/profile")}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Profile</p>
                  <p className="text-lg font-semibold text-gray-900">Settings</p>
                </div>
                <Settings className="h-8 w-8 text-gray-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Financial Overview Chart */}
        <Card className="bg-gradient-to-br from-green-50 to-blue-50">
          <CardHeader>
            <CardTitle>Financial Overview</CardTitle>
            <CardDescription>Invoices vs Expenses</CardDescription>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={chartData}
                margin={{
                  top: 10,
                  right: 30,
                  left: 0,
                  bottom: 0,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis domain={[0, 'auto']} /> {/* Adjusted Y-axis domain */}
                <Tooltip />
                <Area type="monotone" dataKey="invoices" stackId="1" stroke="#82ca9d" fill="#82ca9d" />
                <Area type="monotone" dataKey="expenses" stackId="1" stroke="#8884d8" fill="#8884d8" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Sales Report Section */}
        <SalesReport />

        {/* Subscription Section */}
        <Card className="bg-gradient-to-br from-green-50 to-blue-50">
          <CardHeader>
            <CardTitle>Subscription</CardTitle>
            <CardDescription>
              {currentSubscription?.tier === "Free"
                ? "You are currently on the Free plan."
                : `You are on the ${currentSubscription?.tier} plan.`}
          </CardDescription>
          </CardHeader>
          <CardContent>
            {currentSubscription?.tier === "Free" ? (
              <div className="text-center py-4">
                <p className="text-green-600 font-medium">
                  Upgrade to a paid plan to unlock more features!
                </p>
                <Button 
                  className="mt-4 bg-gradient-to-r from-green-600 to-blue-500 hover:from-green-700 hover:to-blue-600"
                  onClick={() => navigate("/pricing")}
                >
                  View Pricing
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                <p>Status: {currentSubscription?.status}</p>
                {currentSubscription?.end_date && (
                  <p>
                    Expires on:' '
                    {new Date(currentSubscription.end_date).toLocaleDateString()}
                  </p>
                )}
                <Button 
                  className="bg-gradient-to-r from-green-600 to-blue-500 hover:from-green-700 hover:to-blue-600"
                  onClick={() => navigate("/pricing")}
                >
                  Manage Subscription
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;




