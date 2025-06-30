
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { 
  ArrowLeft, 
  Users, 
  Copy, 
  DollarSign, 
  Loader2, 
  Download,
  Gift,
  Wallet,
  UserCheck,
  TrendingUp
} from "lucide-react";

interface ReferralData {
  id: string;
  referred_user_email: string;
  referred_user_name: string;
  subscription_tier: string;
  reward_amount: number;
  status: string;
  created_at: string;
}

const Referrals = () => {
  const [referrals, setReferrals] = useState<ReferralData[]>([]);
  const [totalEarnings, setTotalEarnings] = useState(0);
  const [availableBalance, setAvailableBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const [withdrawing, setWithdrawing] = useState(false);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [withdrawalData, setWithdrawalData] = useState({
    account_number: "",
    account_name: "",
    bank_code: "",
    amount: ""
  });

  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      loadReferralData();
      loadUserProfile();
    }
  }, [user]);

  const loadUserProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', user?.id)
        .single();

      if (error) throw error;
      setUserProfile(data);
    } catch (error) {
      console.error('Error loading user profile:', error);
    }
  };

  const loadReferralData = async () => {
    try {
      // Get referrals where this user is the referrer
      const { data: referralData, error: referralError } = await supabase
        .from('referrals')
        .select(`
          id,
          referred_id,
          reward_type,
          status,
          created_at
        `)
        .eq('referrer_id', user?.id);

      if (referralError) throw referralError;

      // Get detailed user info for each referral
      const referralDetails = await Promise.all(
        (referralData || []).map(async (referral) => {
          const { data: userData, error: userError } = await supabase
            .from('users')
            .select('email, business_name, subscription_tier')
            .eq('id', referral.referred_id)
            .single();

          if (userError) {
            console.error('Error fetching user data:', userError);
            return null;
          }

          const rewardAmount = userData.subscription_tier === 'Yearly' ? 5000 : 
                              userData.subscription_tier === 'Monthly' ? 500 : 0;

          return {
            id: referral.id,
            referred_user_email: userData.email,
            referred_user_name: userData.business_name || 'Unknown User',
            subscription_tier: userData.subscription_tier,
            reward_amount: rewardAmount,
            status: referral.status,
            created_at: referral.created_at
          };
        })
      );

      const validReferrals = referralDetails.filter(Boolean) as ReferralData[];
      setReferrals(validReferrals);

      // Calculate total earnings
      const total = validReferrals.reduce((sum, referral) => {
        return referral.status === 'Completed' ? sum + referral.reward_amount : sum;
      }, 0);

      setTotalEarnings(total);
      setAvailableBalance(total); // For now, all completed earnings are available
    } catch (error) {
      console.error('Error loading referral data:', error);
      toast({
        title: "Error",
        description: "Failed to load referral data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const copyReferralLink = () => {
    if (userProfile?.referral_code) {
      const referralLink = `${window.location.origin}/register?ref=${userProfile.referral_code}`;
      navigator.clipboard.writeText(referralLink);
      
      toast({
        title: "Referral link copied!",
        description: "Share this link to earn rewards when businesses upgrade to paid plans."
      });
    }
  };

  const handleWithdrawal = async () => {
    if (!withdrawalData.account_number || !withdrawalData.account_name || !withdrawalData.bank_code || !withdrawalData.amount) {
      toast({
        title: "Missing Information",
        description: "Please fill in all withdrawal details",
        variant: "destructive"
      });
      return;
    }

    const withdrawalAmount = Number(withdrawalData.amount);
    if (withdrawalAmount < 3000) {
      toast({
        title: "Minimum Withdrawal",
        description: "Minimum withdrawal amount is ₦3,000",
        variant: "destructive"
      });
      return;
    }

    if (withdrawalAmount > availableBalance) {
      toast({
        title: "Insufficient Balance",
        description: "You don't have enough balance for this withdrawal",
        variant: "destructive"
      });
      return;
    }

    setWithdrawing(true);

    try {
      // Calculate platform fee (15%)
      const platformFee = withdrawalAmount * 0.15;
      const netAmount = withdrawalAmount - platformFee;

      // Here you would integrate with Paystack to make the transfer
      // For now, we'll just show success message
      toast({
        title: "Withdrawal Requested",
        description: `Withdrawal of ₦${netAmount.toLocaleString()} has been requested. Platform fee: ₦${platformFee.toLocaleString()}. You'll receive payment within 24 hours.`
      });

      // Reset form
      setWithdrawalData({
        account_number: "",
        account_name: "",
        bank_code: "",
        amount: ""
      });

      // In a real implementation, you would:
      // 1. Create a withdrawal record in the database
      // 2. Use Paystack Transfer API to send money
      // 3. Update available balance
      
    } catch (error) {
      console.error('Error processing withdrawal:', error);
      toast({
        title: "Withdrawal Failed",
        description: "Failed to process withdrawal. Please try again.",
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-NG', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Completed': return 'bg-green-100 text-green-800';
      case 'Pending': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 flex items-center justify-center">
        <div className="flex items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin text-green-600" />
          <span className="text-gray-600">Loading referral data...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <Button 
              variant="ghost" 
              onClick={() => navigate('/dashboard')}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Back to Dashboard</span>
            </Button>
            
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-green-600 to-blue-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">B</span>
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-green-600 to-blue-500 bg-clip-text text-transparent">
                Bizflow
              </span>
            </div>
            
            <div className="w-20"></div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        {/* Page Header */}
        <div className="text-center space-y-4">
          <div className="w-16 h-16 bg-gradient-to-br from-green-100 to-blue-100 rounded-full flex items-center justify-center mx-auto">
            <Gift className="h-8 w-8 text-green-600" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Referral Program</h1>
            <p className="text-gray-600">Earn money by referring businesses to Bizflow</p>
          </div>
        </div>

        {/* Earnings Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bg-gradient-to-br from-green-50 to-blue-50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Earnings</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {formatCurrency(totalEarnings)}
              </div>
              <p className="text-xs text-muted-foreground">
                From {referrals.filter(r => r.status === 'Completed').length} completed referrals
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-blue-50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Available Balance</CardTitle>
              <Wallet className="h-4 w-4 text-blue-600" />
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
              <CardTitle className="text-sm font-medium">Total Referrals</CardTitle>
              <Users className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">
                {referrals.length}
              </div>
              <p className="text-xs text-muted-foreground">
                Businesses referred
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Referral Link */}
        <Card className="shadow-lg border-0 bg-gradient-to-br from-green-50 to-blue-50">
          <CardHeader>
            <CardTitle className="text-lg text-green-600">Your Referral Link</CardTitle>
            <CardDescription>
              Share this link to earn rewards when businesses upgrade to paid plans
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2">
              <Input 
                value={userProfile?.referral_code ? `${window.location.origin}/register?ref=${userProfile.referral_code}` : ''} 
                readOnly 
                className="font-mono text-sm"
              />
              <Button 
                onClick={copyReferralLink}
                className="bg-gradient-to-r from-green-600 to-blue-500 hover:from-green-700 hover:to-blue-600"
              >
                <Copy className="h-4 w-4 mr-2" />
                Copy
              </Button>
            </div>
            <div className="text-sm text-gray-600 space-y-1">
              <p>• Monthly Plan: Earn ₦500 per referral</p>
              <p>• Yearly Plan: Earn ₦5,000 per referral</p>
              <p>• Minimum withdrawal: ₦3,000 (15% platform fee)</p>
            </div>
          </CardContent>
        </Card>

        {/* Withdrawal Section */}
        <Card className="shadow-lg border-0 bg-gradient-to-br from-green-50 to-blue-50">
          <CardHeader>
            <CardTitle className="text-lg text-green-600">Withdraw Earnings</CardTitle>
            <CardDescription>
              Withdraw your referral earnings to your bank account
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Dialog>
              <DialogTrigger asChild>
                <Button 
                  disabled={availableBalance < 3000}
                  className="bg-gradient-to-r from-green-600 to-blue-500 hover:from-green-700 hover:to-blue-600"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Withdraw Funds
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Withdraw Funds</DialogTitle>
                  <DialogDescription>
                    Enter your bank details to withdraw your earnings. Platform fee: 15%
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="amount">Amount (₦)</Label>
                    <Input
                      id="amount"
                      type="number"
                      placeholder="Minimum ₦3,000"
                      value={withdrawalData.amount}
                      onChange={(e) => setWithdrawalData({...withdrawalData, amount: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="account_number">Account Number</Label>
                    <Input
                      id="account_number"
                      placeholder="1234567890"
                      value={withdrawalData.account_number}
                      onChange={(e) => setWithdrawalData({...withdrawalData, account_number: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="account_name">Account Name</Label>
                    <Input
                      id="account_name"
                      placeholder="Your Account Name"
                      value={withdrawalData.account_name}
                      onChange={(e) => setWithdrawalData({...withdrawalData, account_name: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="bank_code">Bank Code</Label>
                    <Input
                      id="bank_code"
                      placeholder="e.g., 011 for First Bank"
                      value={withdrawalData.bank_code}
                      onChange={(e) => setWithdrawalData({...withdrawalData, bank_code: e.target.value})}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button 
                    onClick={handleWithdrawal}
                    disabled={withdrawing}
                    className="bg-gradient-to-r from-green-600 to-blue-500 hover:from-green-700 hover:to-blue-600"
                  >
                    {withdrawing ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      'Withdraw'
                    )}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>

        {/* Referral History */}
        <Card className="shadow-lg border-0 bg-gradient-to-br from-green-50 to-blue-50">
          <CardHeader>
            <CardTitle className="text-lg text-green-600">Referral History</CardTitle>
            <CardDescription>
              Track your referrals and earnings
            </CardDescription>
          </CardHeader>
          <CardContent>
            {referrals.length === 0 ? (
              <div className="text-center py-8">
                <UserCheck className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No referrals yet</h3>
                <p className="text-gray-600">Start sharing your referral link to earn rewards</p>
              </div>
            ) : (
              <div className="space-y-4">
                {referrals.map((referral) => (
                  <div key={referral.id} className="flex items-center justify-between p-4 bg-white rounded-lg shadow-sm">
                    <div className="flex items-center space-x-4">
                      <div className="p-2 bg-green-100 rounded-full">
                        <UserCheck className="h-4 w-4 text-green-600" />
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900">{referral.referred_user_name}</h4>
                        <div className="flex items-center space-x-4 mt-1">
                          <span className="text-sm text-gray-500">{referral.referred_user_email}</span>
                          <span className="text-sm text-gray-500">
                            {formatDate(referral.created_at)}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-green-600">
                        {formatCurrency(referral.reward_amount)}
                      </div>
                      <div className="flex items-center space-x-2 mt-1">
                        <Badge variant="outline">{referral.subscription_tier}</Badge>
                        <Badge className={getStatusColor(referral.status)}>
                          {referral.status}
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Referrals;
