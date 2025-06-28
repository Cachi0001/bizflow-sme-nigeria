
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
  Settings
} from "lucide-react";

const Dashboard = () => {
  const [user, setUser] = useState<any>(null);
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalExpenses: 0,
    pendingInvoices: 0,
    totalClients: 0
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

    const totalRevenue = invoices
      .filter((inv: any) => inv.status === 'Paid')
      .reduce((sum: number, inv: any) => sum + inv.amount, 0);
    
    const totalExpenses = expenses
      .reduce((sum: number, exp: any) => sum + exp.amount, 0);
    
    const pendingInvoices = invoices
      .filter((inv: any) => inv.status === 'Pending').length;

    setStats({
      totalRevenue,
      totalExpenses,
      pendingInvoices,
      totalClients: clients.length
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
    toast({
      title: "Referral link copied!",
      description: "Share this link to earn up to ₦2,000 per referral."
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
          <div className="flex items-center space-x-4">
            <span className="text-2xl font-bold text-primary">Bizflow</span>
            <span className="text-gray-600">Dashboard</span>
          </div>
          
          <nav className="hidden md:flex items-center space-x-6">
            <Button variant="ghost" size="sm">
              <Home className="h-4 w-4 mr-2" />
              Home
            </Button>
            <Button variant="ghost" size="sm">
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
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
              Welcome back, {user.businessName || 'Business Owner'}!
            </h1>
            <p className="text-gray-600 mt-1">
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

        {/* AdSense Placeholder (Free Plan only) */}
        {user.subscriptionTier === 'Free' && (
          <Card className="bg-gray-100 border-dashed">
            <CardContent className="p-6 text-center">
              <div className="w-full h-64 bg-gray-200 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-300">
                <div className="text-center">
                  <div className="text-gray-500 text-lg font-medium">Ads by Google</div>
                  <div className="text-gray-400 text-sm mt-2">Coming Soon</div>
                  <div className="text-xs text-gray-400 mt-1">300x250</div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Quick Actions */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate('/invoices')}>
            <CardContent className="p-4 text-center">
              <FileText className="h-8 w-8 text-primary mx-auto mb-2" />
              <h3 className="font-medium">Create Invoice</h3>
              <p className="text-sm text-gray-600">Quick invoice generation</p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate('/expenses')}>
            <CardContent className="p-4 text-center">
              <Receipt className="h-8 w-8 text-primary mx-auto mb-2" />
              <h3 className="font-medium">Track Expenses</h3>
              <p className="text-sm text-gray-600">Monitor your spending</p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate('/clients')}>
            <CardContent className="p-4 text-center">
              <Users className="h-8 w-8 text-primary mx-auto mb-2" />
              <h3 className="font-medium">Manage Clients</h3>
              <p className="text-sm text-gray-600">Customer database</p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={copyReferralLink}>
            <CardContent className="p-4 text-center">
              <Gift className="h-8 w-8 text-primary mx-auto mb-2" />
              <h3 className="font-medium">Referral Link</h3>
              <p className="text-sm text-gray-600">Earn up to ₦2,000</p>
            </CardContent>
          </Card>
        </div>

        {/* Voice Commands Placeholder (Silver Plan only) */}
        {user.subscriptionTier === 'Silver' && (
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Mic className="h-6 w-6 text-blue-600 mr-3" />
                  <div>
                    <h3 className="font-medium text-blue-900">Voice Commands</h3>
                    <p className="text-sm text-blue-700">Coming Soon - Control your business with voice</p>
                  </div>
                </div>
                <Button variant="outline" disabled>
                  Try Voice Commands
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Analytics Dashboard */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {formatCurrency(stats.totalRevenue)}
              </div>
              <p className="text-xs text-muted-foreground">
                From paid invoices
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
              <Receipt className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {formatCurrency(stats.totalExpenses)}
              </div>
              <p className="text-xs text-muted-foreground">
                This month
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Invoices</CardTitle>
              <AlertCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                {stats.pendingInvoices}
              </div>
              <p className="text-xs text-muted-foreground">
                Awaiting payment
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Clients</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {stats.totalClients}
              </div>
              <p className="text-xs text-muted-foreground">
                Active customers
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Gold Premium Tease */}
        <Card className="bg-gradient-to-r from-yellow-100 to-orange-100 border-yellow-200 relative overflow-hidden">
          <div className="absolute inset-0 bg-white bg-opacity-60"></div>
          <CardContent className="p-6 relative">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  🚀 Unlock Gold Premium
                </h3>
                <p className="text-gray-700 mb-4">
                  Advanced analytics, team collaboration, priority support and more!
                </p>
                <div className="text-2xl font-bold text-orange-600">
                  ₦6,000/month
                </div>
              </div>
              <Button disabled variant="outline" className="relative">
                Coming Soon
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Subscription Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
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
                    You're currently on the Free plan. Upgrade to Silver for unlimited features!
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                    <div>
                      <div className="text-lg font-bold text-primary">₦1,200</div>
                      <div className="text-sm text-gray-600">per week</div>
                    </div>
                    <div>
                      <div className="text-lg font-bold text-primary">₦4,000</div>
                      <div className="text-sm text-gray-600">per month</div>
                    </div>
                    <div>
                      <div className="text-lg font-bold text-primary">₦40,000</div>
                      <div className="text-sm text-gray-600">per year</div>
                    </div>
                  </div>
                  <Button className="w-full mt-4" onClick={() => navigate('/pricing')}>
                    Upgrade to Silver Plan
                  </Button>
                </div>
              )}
              
              {user.subscriptionTier === 'Silver' && (
                <div className="text-center">
                  <p className="text-green-600 font-medium">
                    ✅ You're on the Silver Plan with unlimited access!
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
