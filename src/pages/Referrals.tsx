
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { 
  Gift, 
  Copy, 
  Users, 
  DollarSign, 
  ArrowLeft,
  Banknote,
  TrendingUp
} from "lucide-react";
import { useNavigate } from "react-router-dom";

interface ReferralEarning {
  id: string;
  referred_id: string;
  amount: number;
  status: string;
  created_at: string;
  users: {
    email: string;
    business_name: string;
  };
}

interface WithdrawalRequest {
  id: string;
  amount: number;
  bank_name: string;
  account_number: string;
  account_name: string;
  status: string;
  created_at: string;
}

const Referrals = () => {
  const [earnings, setEarnings] = useState<ReferralEarning[]>([]);
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [withdrawing, setWithdrawing] = useState(false);
  const [withdrawalForm, setWithdrawalForm] = useState({
    amount: "",
    bank_name: "",
    account_number: "",
    account_name: ""
  });
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      loadReferralData();
    }
  }, [user]);

  const loadReferralData = async () => {
    try {
      // Load earnings
      const { data: earningsData, error: earningsError } = await supabase
        .from('referral_earnings')
        .select(`
          *,
          users!referral_earnings_referred_id_fkey(email, business_name)
        `)
        .eq('referrer_id', user?.id)
        .order('created_at', { ascending: false });

      if (earningsError) throw earningsError;

      // Load withdrawals
      const { data: withdrawalsData, error: withdrawalsError } = await supabase
        .from('withdrawal_requests')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (withdrawalsError) throw withdrawalsError;

      setEarnings(earningsData || []);
      setWithdrawals(withdrawalsData || []);
    } catch (error) {
      console.error('Error loading referral data:', error);
      toast({
        title: "Error loading referral data",
        description: "Please try again later.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const copyReferralLink = () => {
    const referralLink = `${window.location.origin}/register?ref=${user?.user_metadata?.referral_code}`;
    navigator.clipboard.writeText(referralLink);
    
    toast({
      title: "Referral link copied!",
      description: "Share this link to earn money when people upgrade to paid plans."
    });
  };

  const getTotalEarnings = () => {
    return earnings.reduce((sum, earning) => sum + Number(earning.amount), 0);
  };

  const getAvailableBalance = () => {
    const totalEarnings = getTotalEarnings();
    const totalWithdrawn = withdrawals
      .filter(w => w.status === 'completed')
      .reduce((sum, w) => sum + Number(w.amount), 0);
    const pendingWithdrawals = withdrawals
      .filter(w => w.status === 'pending' || w.status === 'processing')
      .reduce((sum, w) => sum + Number(w.amount), 0);
    
    return totalEarnings - totalWithdrawn - pendingWithdrawals;
  };

  const submitWithdrawal = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(withdrawalForm.amount);
    const availableBalance = getAvailableBalance();

    if (amount < 3000) {
      toast({
        title: "Minimum withdrawal amount",
        description: "You can only withdraw ₦3,000 or more.",
        variant: "destructive"
      });
      return;
    }

    if (amount > availableBalance) {
      toast({
        title: "Insufficient balance",
        description: "You don't have enough balance for this withdrawal.",
        variant: "destructive"
      });
      return;
    }

    setWithdrawing(true);

    try {
      // Calculate amount after 15% platform fee
      const platformFee = amount * 0.15;
      const finalAmount = amount - platformFee;

      const { error } = await supabase
        .from('withdrawal_requests')
        .insert({
          user_id: user?.id,
          amount: finalAmount,
          bank_name: withdrawalForm.bank_name,
          account_number: withdrawalForm.account_number,
          account_name: withdrawalForm.account_name,
          status: 'pending'
        });

      if (error) throw error;

      toast({
        title: "Withdrawal request submitted!",
        description: `Your request for ₦${finalAmount.toLocaleString()} (after 15% fee) has been submitted for processing.`
      });

      setWithdrawalForm({
        amount: "",
        bank_name: "",
        account_number: "",
        account_name: ""
      });

      loadReferralData();
    } catch (error: any) {
      console.error('Error submitting withdrawal:', error);
      toast({
        title: "Error submitting withdrawal",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setWithdrawing(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN'
    }).format(amount);
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  const totalEarnings = getTotalEarnings();
  const availableBalance = getAvailableBalance();

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50">
      {/* Header */}
      <header className="bg-white border-b px-4 py-3">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" onClick={() => navigate('/dashboard')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
            <div className="flex items-center space-x-2">
              <Gift className="h-6 w-6 text-green-600" />
              <h1 className="text-xl font-bold text-gray-900">Referral System</h1>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto p-4 space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bg-gradient-to-br from-green-50 to-blue-50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Earnings</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {formatCurrency(totalEarnings)}
              </div>
              <p className="text-xs text-muted-foreground">
                From {earnings.length} referrals
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-blue-50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Available Balance</CardTitle>
              <Banknote className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {formatCurrency(availableBalance)}
              </div>
              <p className="text-xs text-muted-foreground">
                Ready for withdrawal
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-blue-50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Referrals</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">
                {earnings.length}
              </div>
              <p className="text-xs text-muted-foreground">
                People you've referred
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Referral Link */}
        <Card className="bg-gradient-to-br from-green-50 to-blue-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Copy className="h-5 w-5" />
              Your Referral Link
            </CardTitle>
            <CardDescription>
              Share this link to earn 10% commission when someone upgrades to a paid plan
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4">
              <Input
                value={`${window.location.origin}/register?ref=${user?.user_metadata?.referral_code || 'LOADING'}`}
                readOnly
                className="flex-1"
              />
              <Button onClick={copyReferralLink} className="bg-gradient-to-r from-green-600 to-blue-500 hover:from-green-700 hover:to-blue-600">
                <Copy className="h-4 w-4 mr-2" />
                Copy Link
              </Button>
            </div>
            <div className="mt-4 p-4 bg-blue-50 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">How it works:</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Share your referral link with friends and family</li>
                <li>• When they sign up and upgrade to any paid plan, you earn:</li>
                <li>&nbsp;&nbsp;- Weekly Plan: ₦140 (10% of ₦1,400)</li>
                <li>&nbsp;&nbsp;- Monthly Plan: ₦450 (10% of ₦4,500)</li>
                <li>&nbsp;&nbsp;- Yearly Plan: ₦5,000 (10% of ₦50,000)</li>
                <li>• Minimum withdrawal: ₦3,000 (15% platform fee applies)</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Withdrawal Form */}
        {availableBalance >= 3000 && (
          <Card className="bg-gradient-to-br from-green-50 to-blue-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Banknote className="h-5 w-5" />
                Request Withdrawal
              </CardTitle>
              <CardDescription>
                Minimum withdrawal: ₦3,000 (15% platform fee will be deducted)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={submitWithdrawal} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="amount">Amount (₦)</Label>
                    <Input
                      id="amount"
                      type="number"
                      min="3000"
                      max={availableBalance}
                      value={withdrawalForm.amount}
                      onChange={(e) => setWithdrawalForm({...withdrawalForm, amount: e.target.value})}
                      placeholder="3000"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="bank_name">Bank Name</Label>
                    <Input
                      id="bank_name"
                      value={withdrawalForm.bank_name}
                      onChange={(e) => setWithdrawalForm({...withdrawalForm, bank_name: e.target.value})}
                      placeholder="e.g., GTBank"
                      required
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="account_number">Account Number</Label>
                    <Input
                      id="account_number"
                      value={withdrawalForm.account_number}
                      onChange={(e) => setWithdrawalForm({...withdrawalForm, account_number: e.target.value})}
                      placeholder="0123456789"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="account_name">Account Name</Label>
                    <Input
                      id="account_name"
                      value={withdrawalForm.account_name}
                      onChange={(e) => setWithdrawalForm({...withdrawalForm, account_name: e.target.value})}
                      placeholder="John Doe"
                      required
                    />
                  </div>
                </div>
                <Button 
                  type="submit" 
                  disabled={withdrawing}
                  className="bg-gradient-to-r from-green-600 to-blue-500 hover:from-green-700 hover:to-blue-600"
                >
                  {withdrawing ? "Processing..." : "Submit Withdrawal Request"}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Earnings History */}
        <Card className="bg-gradient-to-br from-green-50 to-blue-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Earnings History
            </CardTitle>
          </CardHeader>
          <CardContent>
            {earnings.length === 0 ? (
              <div className="text-center py-8">
                <Gift className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No earnings yet. Start sharing your referral link!</p>
              </div>
            ) : (
              <div className="space-y-4">
                {earnings.map((earning) => (
                  <div key={earning.id} className="flex items-center justify-between p-4 bg-white rounded-lg border">
                    <div>
                      <p className="font-medium">
                        {earning.users?.business_name || earning.users?.email || 'Unknown User'}
                      </p>
                      <p className="text-sm text-gray-500">
                        Referred on {new Date(earning.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-green-600">
                        {formatCurrency(earning.amount)}
                      </p>
                      <Badge variant={earning.status === 'paid' ? 'default' : 'secondary'}>
                        {earning.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Withdrawal History */}
        {withdrawals.length > 0 && (
          <Card className="bg-gradient-to-br from-green-50 to-blue-50">
            <CardHeader>
              <CardTitle>Withdrawal History</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {withdrawals.map((withdrawal) => (
                  <div key={withdrawal.id} className="flex items-center justify-between p-4 bg-white rounded-lg border">
                    <div>
                      <p className="font-medium">{withdrawal.bank_name}</p>
                      <p className="text-sm text-gray-500">
                        {withdrawal.account_number} - {withdrawal.account_name}
                      </p>
                      <p className="text-xs text-gray-400">
                        {new Date(withdrawal.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">
                        {formatCurrency(withdrawal.amount)}
                      </p>
                      <Badge 
                        variant={
                          withdrawal.status === 'completed' ? 'default' :
                          withdrawal.status === 'failed' ? 'destructive' : 'secondary'
                        }
                      >
                        {withdrawal.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Referrals;
