import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { 
  FileText, 
  Receipt, 
  Users, 
  Gift, 
  TrendingUp, 
  DollarSign, 
  AlertCircle,
  Mic,
  LogOut,
  User,
  Home,
  CreditCard
} from "lucide-react";

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalExpenses: 0,
    pendingInvoices: 0,
    totalClients: 0,
    totalPayments: 0
  });
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, signOut } = useAuth();

  useEffect(() => {
    if (user) {
      loadStats();
    }
  }, [user]);

  const loadStats = async () => {
    try {
      // Load invoices
      const { data: invoices, error: invoicesError } = await supabase
        .from('invoices')
        .select('*')
        .eq('user_id', user?.id);

      if (invoicesError) throw invoicesError;

      // Load expenses
      const { data: expenses, error: expensesError } = await supabase
        .from('expenses')
        .select('*')
        .eq('user_id', user?.id);

      if (expensesError) throw expensesError;

      // Load clients
      const { data: clients, error: clientsError } = await supabase
        .from('clients')
        .select('*')
        .eq('user_id', user?.id);

      if (clientsError) throw clientsError;

      // Load payments
      const { data: payments, error: paymentsError } = await supabase
        .from('payments')
        .select('*')
        .eq('user_id', user?.id);

      if (paymentsError) throw paymentsError;

      // Calculate statistics
      const totalRevenue = (invoices || [])
        .filter((inv: any) => inv.status === 'Paid')
        .reduce((sum: number, inv: any) => sum + Number(inv.amount), 0);
      
      const totalExpenses = (expenses || [])
        .reduce((sum: number, exp: any) => sum + Number(exp.amount), 0);
      
      const pendingInvoices = (invoices || [])
        .filter((inv: any) => inv.status === 'Pending').length;

      const totalPayments = (payments || [])
        .reduce((sum: number, payment: any) => sum + Number(payment.amount), 0);

      setStats({
        totalRevenue,
        totalExpenses,
        pendingInvoices,
        totalClients: (clients || []).length,
        totalPayments
      });
    } catch (error) {
      console.error('Error loading stats:', error);
      toast({
        title: "Error loading dashboard data",
        description: "Please refresh the page to try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut();
      toast({
        title: "Logged out",
        description: "You have been successfully logged out."
      });
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const copyReferralLink = () => {
    if (!user) return;
    
    const referralLink = `${window.location.origin}/register?ref=${user.user_metadata?.referral_code}`;
    navigator.clipboard.writeText(referralLink);
    
    const rewardAmount = user.user_metadata?.subscription_tier === 'Yearly' ? '₦5,000' : 
                        user.user_metadata?.subscription_tier === 'Monthly' ? '₦500' : 'no reward';
    
    toast({
      title: "Referral link copied!",
      description: `Share this link to earn ${rewardAmount} per paid referral. Minimum withdrawal: ₦3,000.`
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN'
    }).format(amount);
  };

  if (!user || loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  const subscriptionTier = user.user_metadata?.subscription_tier || 'Free';
  const businessName = user.user_metadata?.business_name || 'Business Owner';

  const isPaidUser = subscriptionTier !== 'Free';

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50">
      {/* Header */}
      <header className="bg-white border-b px-4 py-3">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center space-x-2 sm:space-x-4">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-green-600 to-blue-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">B</span>
              </div>
              <span className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-green-600 to-blue-500 bg-clip-text text-transparent">Bizflow</span>
            </div>
            <span className="text-sm sm:text-base text-gray-600 hidden sm:inline">Dashboard</span>
          </div>
          
          <nav className="hidden md:flex items-center space-x-4 lg:space-x-6">
            <Button variant="ghost" size="sm">
              <Home className="h-4 w-4 mr-2" />
              Home
            </Button>
            <Button variant="ghost" size="sm" onClick={() => navigate('/profile')}>
              <User className="h-4 w-4 mr-2" />
              Profile
            </Button>
            <Button variant="ghost" size="sm" onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </nav>

          <div className="md:hidden">
            <Button variant="ghost" size="sm" onClick={handleLogout}>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto p-4 space-y-6">
        {/* Welcome Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900">
              Welcome back, {businessName}!
            </h1>
            <p className="text-sm sm:text-base text-gray-600 mt-1">
              Here's what's happening with your business today.
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            <Badge variant={subscriptionTier === 'Free' ? 'secondary' : 'default'}>
              {subscriptionTier} Plan
            </Badge>
            {subscriptionTier === 'Free' && (
              <Button size="sm" onClick={() => navigate('/pricing')} className="bg-gradient-to-r from-green-600 to-blue-500 hover:from-green-700 hover:to-blue-600">
                Upgrade
              </Button>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer bg-gradient-to-br from-green-50 to-blue-50" onClick={() => navigate('/invoices')}>
            <CardContent className="p-3 sm:p-4 text-center">
              <FileText className="h-6 w-6 sm:h-8 sm:w-8 text-green-600 mx-auto mb-2" />
              <h3 className="text-sm sm:text-base font-medium">Create Invoice</h3>
              <p className="text-xs text-gray-600 hidden sm:block">Quick invoice generation</p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer bg-gradient-to-br from-green-50 to-blue-50" onClick={() => navigate('/expenses')}>
            <CardContent className="p-3 sm:p-4 text-center">
              <Receipt className="h-6 w-6 sm:h-8 sm:w-8 text-green-600 mx-auto mb-2" />
              <h3 className="text-sm sm:text-base font-medium">Track Expenses</h3>
              <p className="text-xs text-gray-600 hidden sm:block">Monitor your spending</p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer bg-gradient-to-br from-green-50 to-blue-50" onClick={() => navigate('/clients')}>
            <CardContent className="p-3 sm:p-4 text-center">
              <Users className="h-6 w-6 sm:h-8 sm:w-8 text-green-600 mx-auto mb-2" />
              <h3 className="text-sm sm:text-base font-medium">Manage Clients</h3>
              <p className="text-xs text-gray-600 hidden sm:block">Customer database</p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer bg-gradient-to-br from-green-50 to-blue-50" onClick={() => navigate('/payments')}>
            <CardContent className="p-3 sm:p-4 text-center">
              <CreditCard className="h-6 w-6 sm:h-8 sm:w-8 text-green-600 mx-auto mb-2" />
              <h3 className="text-sm sm:text-base font-medium">Payments</h3>
              <p className="text-xs text-gray-600 hidden sm:block">Record & view payments</p>
            </CardContent>
          </Card>
        </div>

        {/* Additional Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer bg-gradient-to-br from-green-50 to-blue-50" onClick={() => navigate('/transactions')}>
            <CardContent className="p-4 text-center">
              <TrendingUp className="h-8 w-8 text-green-600 mx-auto mb-2" />
              <h3 className="text-base font-medium">Transaction History</h3>
              <p className="text-xs text-gray-600">View all money in and out</p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer bg-gradient-to-br from-green-50 to-blue-50" onClick={() => navigate('/referrals')}>
            <CardContent className="p-4 text-center">
              <Gift className="h-8 w-8 text-green-600 mx-auto mb-2" />
              <h3 className="text-base font-medium">Referral Program</h3>
              <p className="text-xs text-gray-600">Earn money by referring businesses</p>
            </CardContent>
          </Card>

          {isPaidUser && (
            <Card className="hover:shadow-lg transition-shadow cursor-pointer bg-gradient-to-br from-green-50 to-blue-50" onClick={() => navigate('/team')}>
              <CardContent className="p-4 text-center">
                <Users className="h-8 w-8 text-green-600 mx-auto mb-2" />
                <h3 className="text-base font-medium">Team Management</h3>
                <p className="text-xs text-gray-600">Manage your salespeople</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Referral Banner */}
        {(subscriptionTier === 'Monthly' || subscriptionTier === 'Yearly') && (
          <Card className="bg-gradient-to-r from-green-100 to-blue-100 border-green-200 cursor-pointer" onClick={copyReferralLink}>
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Gift className="h-6 w-6 text-green-600 mr-3" />
                  <div>
                    <h3 className="font-medium text-green-900">
                      Earn {subscriptionTier === 'Yearly' ? '₦5,000' : '₦500'} per referral!
                    </h3>
                    <p className="text-sm text-green-700">
                      Share your referral link and earn when businesses upgrade
                    </p>
                  </div>
                </div>
                <Button variant="outline" size="sm" className="bg-gradient-to-r from-green-600 to-blue-500 hover:from-green-700 hover:to-blue-600 text-white border-0">
                  Copy Link
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Analytics Dashboard */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <Card className="bg-gradient-to-br from-green-50 to-blue-50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-xl sm:text-2xl font-bold text-green-600">
                {formatCurrency(stats.totalRevenue)}
              </div>
              <p className="text-xs text-muted-foreground">
                From paid invoices
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-blue-50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Payments</CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-xl sm:text-2xl font-bold text-blue-600">
                {formatCurrency(stats.totalPayments)}
              </div>
              <p className="text-xs text-muted-foreground">
                All recorded payments
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-blue-50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
              <Receipt className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-xl sm:text-2xl font-bold text-red-600">
                {formatCurrency(stats.totalExpenses)}
              </div>
              <p className="text-xs text-muted-foreground">
                This month
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-blue-50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Clients</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-xl sm:text-2xl font-bold text-blue-600">
                {stats.totalClients}
              </div>
              <p className="text-xs text-muted-foreground">
                Active customers
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Subscription Status */}
        <Card className="bg-gradient-to-br from-green-50 to-blue-50">
          <CardHeader>
            <CardTitle className="flex items-center justify-between text-base sm:text-lg">
              <span>Subscription Status</span>
              <Badge variant={subscriptionTier === 'Free' ? 'secondary' : 'default'}>
                {subscriptionTier} Plan
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {subscriptionTier === 'Free' && (
                <div>
                  <p className="text-sm text-gray-600 mb-4">
                    You're currently on the Free plan. Upgrade for unlimited features and referral rewards!
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
                    <div>
                      <div className="text-lg font-bold text-green-600">₦4,500</div>
                      <div className="text-sm text-gray-600">per month</div>
                      <div className="text-xs text-green-600">₦500/referral</div>
                    </div>
                    <div>
                      <div className="text-lg font-bold text-green-600">₦50,000</div>
                      <div className="text-sm text-gray-600">per year</div>
                      <div className="text-xs text-green-600">₦5,000/referral</div>
                    </div>
                  </div>
                  <Button className="w-full mt-4 bg-gradient-to-r from-green-600 to-blue-500 hover:from-green-700 hover:to-blue-600" onClick={() => navigate('/pricing')}>
                    Upgrade Now
                  </Button>
                </div>
              )}
              
              {subscriptionTier !== 'Free' && (
                <div className="text-center">
                  <p className="text-green-600 font-medium">
                    ✅ You're on the {subscriptionTier} Plan with unlimited access!
                  </p>
                  <p className="text-sm text-gray-600 mt-2">
                    Earn {subscriptionTier === 'Yearly' ? '₦5,000' : '₦500'} for each business you refer that upgrades to a paid plan
                  </p>
                  <Button 
                    className="mt-4 bg-gradient-to-r from-green-600 to-blue-500 hover:from-green-700 hover:to-blue-600" 
                    onClick={() => navigate('/referrals')}
                  >
                    View Referral Dashboard
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
