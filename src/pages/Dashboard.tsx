
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
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
  const [user, setUser] = useState<any>(null);
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalExpenses: 0,
    pendingInvoices: 0,
    totalClients: 0,
    totalPayments: 0
  });
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const currentUser = localStorage.getItem('currentUser');
    const authToken = localStorage.getItem('authToken');
    
    if (!currentUser || !authToken) {
      navigate('/login');
      return;
    }

    const userData = JSON.parse(currentUser);
    setUser(userData);

    // Load user statistics
    loadStats(userData.id);
  }, [navigate]);

  const loadStats = (userId: number) => {
    // Load from localStorage for demo
    const invoices = JSON.parse(localStorage.getItem(`invoices_${userId}`) || '[]');
    const expenses = JSON.parse(localStorage.getItem(`expenses_${userId}`) || '[]');
    const clients = JSON.parse(localStorage.getItem(`clients_${userId}`) || '[]');
    const payments = JSON.parse(localStorage.getItem(`payments_${userId}`) || '[]');

    const totalRevenue = invoices
      .filter((inv: any) => inv.status === 'Paid')
      .reduce((sum: number, inv: any) => sum + inv.amount, 0);
    
    const totalExpenses = expenses
      .reduce((sum: number, exp: any) => sum + exp.amount, 0);
    
    const pendingInvoices = invoices
      .filter((inv: any) => inv.status === 'Pending').length;

    const totalPayments = payments
      .reduce((sum: number, payment: any) => sum + payment.amount, 0);

    setStats({
      totalRevenue,
      totalExpenses,
      pendingInvoices,
      totalClients: clients.length,
      totalPayments
    });
  };

  const handleLogout = () => {
    localStorage.removeItem('currentUser');
    localStorage.removeItem('authToken');
    toast({
      title: "Logged out",
      description: "You have been successfully logged out."
    });
    navigate('/');
  };

  const copyReferralLink = () => {
    const referralLink = `${window.location.origin}/register?ref=${user?.referralCode}`;
    navigator.clipboard.writeText(referralLink);
    
    const rewardAmount = user?.subscriptionTier === 'Yearly' ? '₦5,000' : 
                        user?.subscriptionTier === 'Monthly' ? '₦500' : 'no reward';
    
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

  if (!user) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b px-4 py-3">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center space-x-2 sm:space-x-4">
            <span className="text-xl sm:text-2xl font-bold text-primary">Bizflow</span>
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
              Welcome back, {user.businessName || 'Business Owner'}!
            </h1>
            <p className="text-sm sm:text-base text-gray-600 mt-1">
              Here's what's happening with your business today.
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            <Badge variant={user.subscriptionTier === 'Free' ? 'secondary' : 'default'}>
              {user.subscriptionTier} Plan
            </Badge>
            {user.subscriptionTier === 'Free' && (
              <Button size="sm" onClick={() => navigate('/pricing')}>
                Upgrade
              </Button>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate('/invoices')}>
            <CardContent className="p-3 sm:p-4 text-center">
              <FileText className="h-6 w-6 sm:h-8 sm:w-8 text-primary mx-auto mb-2" />
              <h3 className="text-sm sm:text-base font-medium">Create Invoice</h3>
              <p className="text-xs text-gray-600 hidden sm:block">Quick invoice generation</p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate('/expenses')}>
            <CardContent className="p-3 sm:p-4 text-center">
              <Receipt className="h-6 w-6 sm:h-8 sm:w-8 text-primary mx-auto mb-2" />
              <h3 className="text-sm sm:text-base font-medium">Track Expenses</h3>
              <p className="text-xs text-gray-600 hidden sm:block">Monitor your spending</p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate('/clients')}>
            <CardContent className="p-3 sm:p-4 text-center">
              <Users className="h-6 w-6 sm:h-8 sm:w-8 text-primary mx-auto mb-2" />
              <h3 className="text-sm sm:text-base font-medium">Manage Clients</h3>
              <p className="text-xs text-gray-600 hidden sm:block">Customer database</p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate('/payments')}>
            <CardContent className="p-3 sm:p-4 text-center">
              <CreditCard className="h-6 w-6 sm:h-8 sm:w-8 text-primary mx-auto mb-2" />
              <h3 className="text-sm sm:text-base font-medium">Payments</h3>
              <p className="text-xs text-gray-600 hidden sm:block">Record & view payments</p>
            </CardContent>
          </Card>
        </div>

        {/* Referral Banner */}
        {(user.subscriptionTier === 'Monthly' || user.subscriptionTier === 'Yearly') && (
          <Card className="bg-gradient-to-r from-green-100 to-blue-100 border-green-200 cursor-pointer" onClick={copyReferralLink}>
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Gift className="h-6 w-6 text-green-600 mr-3" />
                  <div>
                    <h3 className="font-medium text-green-900">
                      Earn {user.subscriptionTier === 'Yearly' ? '₦5,000' : '₦500'} per referral!
                    </h3>
                    <p className="text-sm text-green-700">
                      Share your referral link and earn when businesses upgrade
                    </p>
                  </div>
                </div>
                <Button variant="outline" size="sm">
                  Copy Link
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Analytics Dashboard */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <Card>
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

          <Card>
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

          <Card>
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

          <Card>
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
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between text-base sm:text-lg">
              <span>Subscription Status</span>
              <Badge variant={user.subscriptionTier === 'Free' ? 'secondary' : 'default'}>
                {user.subscriptionTier} Plan
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {user.subscriptionTier === 'Free' && (
                <div>
                  <p className="text-sm text-gray-600 mb-4">
                    You're currently on the Free plan. Upgrade for unlimited features and referral rewards!
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-center">
                    <div>
                      <div className="text-lg font-bold text-primary">₦1,400</div>
                      <div className="text-sm text-gray-600">per week</div>
                      <div className="text-xs text-gray-500">100 invoices/expenses</div>
                    </div>
                    <div>
                      <div className="text-lg font-bold text-primary">₦4,500</div>
                      <div className="text-sm text-gray-600">per month</div>
                      <div className="text-xs text-green-600">₦500/referral</div>
                    </div>
                    <div>
                      <div className="text-lg font-bold text-primary">₦50,000</div>
                      <div className="text-sm text-gray-600">per year</div>
                      <div className="text-xs text-green-600">₦5,000/referral</div>
                    </div>
                  </div>
                  <Button className="w-full mt-4" onClick={() => navigate('/pricing')}>
                    Upgrade Now
                  </Button>
                </div>
              )}
              
              {user.subscriptionTier !== 'Free' && (
                <div className="text-center">
                  <p className="text-green-600 font-medium">
                    ✅ You're on the {user.subscriptionTier} Plan with unlimited access!
                  </p>
                  <p className="text-sm text-gray-600 mt-2">
                    Earn {user.subscriptionTier === 'Yearly' ? '₦5,000' : '₦500'} for each business you refer that upgrades to a paid plan
                  </p>
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
