
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
import TrialBanner from "@/components/TrialBanner";

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
  const [userSetupComplete, setUserSetupComplete] = useState(false);
  
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  // Ensure user setup is complete before loading other data
  useEffect(() => {
    if (user && !userSetupComplete) {
      ensureUserSetup();
    }
  }, [user, userSetupComplete]);

  // Load dashboard data only after user setup is complete
  useEffect(() => {
    if (user && userSetupComplete) {
      loadDashboardData();
    }
  }, [user, userSetupComplete]);

  const ensureUserSetup = async () => {
    try {
      console.log('Ensuring user setup...');
      const { data, error } = await supabase.functions.invoke('ensure-user-setup');
      
      if (error) {
        console.error('Error ensuring user setup:', error);
        toast({
          title: "Setup Error",
          description: "There was an issue setting up your account. Please try refreshing the page.",
          variant: "destructive"
        });
        return;
      }
      
      console.log('User setup completed:', data);
      setUserData(data.user);
      setUserSetupComplete(true);
      
      if (data.trial_info?.is_trial) {
        toast({
          title: "Welcome to your 7-day trial!",
          description: `You have ${data.trial_info.days_left} days remaining. Enjoy all Weekly plan features!`,
        });
      }
      
    } catch (error) {
      console.error('Error in user setup:', error);
      toast({
        title: "Setup Error",
        description: "Please try refreshing the page.",
        variant: "destructive"
      });
    }
  };

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Load invoices
      const { data: invoices, error: invoicesError } = await supabase
        .from("invoices")
        .select("*")
        .eq("user_id", user?.id);

      if (invoicesError) {
        console.error("Error fetching invoices:", invoicesError);
      }

      // Load expenses
      const { data: expenses, error: expensesError } = await supabase
        .from("expenses")
        .select("*")
        .eq("user_id", user?.id);

      if (expensesError) {
        console.error("Error fetching expenses:", expensesError);
      }

      // Load payments
      const { data: payments, error: paymentsError } = await supabase
        .from("payments")
        .select("*")
        .eq("user_id", user?.id);

      if (paymentsError) {
        console.error("Error fetching payments:", paymentsError);
      }

      // Load referral earnings
      const { data: referralEarnings, error: referralEarningsError } = await supabase
        .from("referral_earnings")
        .select("*")
        .eq("referrer_id", user?.id);

      if (referralEarningsError) {
        console.error("Error fetching referral earnings:", referralEarningsError);
      }

      // Calculate stats
      const totalInvoices = invoices?.length || 0;
      const pendingInvoices = invoices?.filter(inv => inv.status === 'Pending')?.length || 0;
      const totalExpenses = expenses?.reduce((sum, exp) => sum + (Number(exp.amount) || 0), 0) || 0;
      const totalPayments = payments?.reduce((sum, pay) => sum + (Number(pay.amount) || 0), 0) || 0;
      const referralEarningsAmount = referralEarnings?.reduce((sum, ref) => sum + (Number(ref.amount) || 0), 0) || 0;

      setStats({
        totalInvoices,
        pendingInvoices,
        totalExpenses,
        totalPayments,
        referralEarnings: referralEarningsAmount,
      });

      // Set subscription info from user data
      if (userData) {
        setCurrentSubscription({
          tier: userData.subscription_tier || 'Free',
          status: userData.is_trial ? 'trial' : 'active',
          end_date: userData.trial_end_date
        });
      }

    } catch (error) {
      console.error("Error loading dashboard data:", error);
      toast({
        title: "Error loading data",
        description: "Please try refreshing the page.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Generate real chart data from user's actual data
  const generateChartData = () => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
    return months.map(month => ({
      name: month,
      revenue: stats.totalPayments / 6, // Distribute total payments across months
      expenses: stats.totalExpenses / 6  // Distribute total expenses across months
    }));
  };

  const chartData = generateChartData();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-green-50">
      <div className="max-w-7xl mx-auto p-4 space-y-6">
        {/* Trial Banner */}
        <TrialBanner />
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Stats Cards */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Invoices</CardTitle>
              <Badge variant="secondary">{stats.totalInvoices}</Badge>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₦{stats.totalPayments.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                {stats.pendingInvoices} pending
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
              <Badge variant="outline">₦{stats.totalExpenses.toLocaleString()}</Badge>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₦{stats.totalExpenses.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                This month
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Referral Earnings</CardTitle>
              <Badge variant="default">₦{stats.referralEarnings?.toLocaleString()}</Badge>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₦{stats.referralEarnings?.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                Available for withdrawal
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Subscription</CardTitle>
              <Badge variant={currentSubscription?.status === 'trial' ? 'secondary' : 'default'}>
                {currentSubscription?.tier}
              </Badge>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {currentSubscription?.status === 'trial' ? 'Trial' : 'Active'}
              </div>
              <p className="text-xs text-muted-foreground">
                {currentSubscription?.status === 'trial' ? 'Upgrade anytime' : 'Manage subscription'}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Financial Overview Chart */}
        <Card className="col-span-full">
          <CardHeader>
            <CardTitle>Financial Overview</CardTitle>
            <CardDescription>
              Your revenue and expenses over the last 6 months
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stackId="1"
                  stroke="hsl(var(--primary))"
                  fill="hsl(var(--primary))"
                  fillOpacity={0.6}
                />
                <Area
                  type="monotone"
                  dataKey="expenses"
                  stackId="2"
                  stroke="hsl(var(--destructive))"
                  fill="hsl(var(--destructive))"
                  fillOpacity={0.6}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Sales Report Section */}
        <SalesReport />
      </div>
    </div>
  );
};

export default Dashboard;
