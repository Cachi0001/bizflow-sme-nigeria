
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
  Users,
  Copy,
  DollarSign,
  ArrowLeft,
  Banknote,
  TrendingUp,
  UserCheck
} from "lucide-react";
import { useNavigate } from "react-router-dom";

interface ReferralEarning {
  id: string;
  amount: number;
  status: string;
  created_at: string;
  referred_id: string;
  users?: {
    business_name: string;
    email: string;
  };
}

interface WithdrawalData {
  amount: string;
  bankName: string;
  accountNumber: string;
  accountName: string;
}

const Referrals = () => {
  const [referralCode, setReferralCode] = useState("");
  const [referralLink, setReferralLink] = useState("");
  const [earnings, setEarnings] = useState<ReferralEarning[]>([]);
  const [totalEarnings, setTotalEarnings] = useState(0);
  const [availableBalance, setAvailableBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const [withdrawing, setWithdrawing] = useState(false);
  const [showWithdrawForm, setShowWithdrawForm] = useState(false);
  const [withdrawalData, setWithdrawalData] = useState<WithdrawalData>({
    amount: "",
    bankName: "",
    accountNumber: "",
    accountName: ""
  });

  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      loadUserData();
      loadEarnings();
    }
  }, [user]);

  const loadUserData = async () => {
    try {
      let currentReferralCode = referralCode;
      if (!currentReferralCode) {
        const { data, error } = await supabase
          .from("users")
          .select("referral_code")
          .eq("id", user?.id)
          .single();

        if (error) throw error;

        if (data?.referral_code) {
          currentReferralCode = data.referral_code;
          setReferralCode(currentReferralCode);
        } else {
          // Generate a new referral code if one doesn\'t exist
          const newCode = `REF-${user?.id.substring(0, 8)}`; // Use user ID for consistent code
          const { error: updateError } = await supabase
            .from("users")
            .update({ referral_code: newCode })
            .eq("id", user?.id);

          if (updateError) throw updateError;
          currentReferralCode = newCode;
          setReferralCode(newCode);
        }
      }
      setReferralLink(`${window.location.origin}/register?ref=${currentReferralCode}`);
    } catch (error) {
      console.error("Error loading or generating user data:", error);
    }
  };

  const loadEarnings = async () => {
    try {
      const { data, error } = await supabase
        .from("referral_earnings")
        .select(`
          *,
          users!referral_earnings_referred_id_fkey(business_name, email)
        `)
        .eq("referrer_id", user?.id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      setEarnings(data || []);

      const total = data?.reduce((sum, earning) => sum + Number(earning.amount), 0) || 0;
      setTotalEarnings(total);

      const available = data?.filter(e => e.status === "pending").reduce((sum, earning) => sum + Number(earning.amount), 0) || 0;
      setAvailableBalance(available);
    } catch (error) {
      console.error("Error loading earnings:", error);
      toast({
        title: "Error loading earnings",
        description: "Please try again later.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const copyReferralLink = () => {
    navigator.clipboard.writeText(referralLink);
    toast({
      title: "Referral link copied!",
      description: "Share this link with others to earn rewards."
    });
  };

  const handleWithdrawal = async (e: React.FormEvent) => {
    e.preventDefault();

    const amount = parseFloat(withdrawalData.amount);

    if (amount < 3000) {
      toast({
        title: "Minimum withdrawal amount",
        description: "The minimum withdrawal amount is ₦3,000.",
        variant: "destructive"
      });
      return;
    }

    if (amount > availableBalance) {
      toast({
        title: "Insufficient balance",
        description: "You don\'t have enough balance for this withdrawal.",
        variant: "destructive"
      });
      return;
    }

    setWithdrawing(true);

    try {
      // Calculate final amount after 15% platform fee
      const platformFee = amount * 0.15;
      const finalAmount = amount - platformFee;

      const { error } = await supabase
        .from("withdrawal_requests")
        .insert({
          user_id: user?.id,
          amount: finalAmount,
          bank_name: withdrawalData.bankName,
          account_number: withdrawalData.accountNumber,
          account_name: withdrawalData.accountName,
          status: "pending"
        });

      if (error) throw error;

      // Update earnings status to "withdrawn"
      const { error: updateError } = await supabase
        .from("referral_earnings")
        .update({ status: "withdrawn" })
        .eq("referrer_id", user?.id)
        .eq("status", "pending");

      if (updateError) throw updateError;

      toast({
        title: "Withdrawal request submitted!",
        description: `Your withdrawal of ₦${finalAmount.toFixed(2)} (after 15% fee) has been submitted for processing.`
      });

      setShowWithdrawForm(false);
      setWithdrawalData({
        amount: "",
        bankName: "",
        accountNumber: "",
        accountName: ""
      });

      loadEarnings();
    } catch (error: any) {
      console.error("Error submitting withdrawal:", error);
      toast({
        title: "Withdrawal failed",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setWithdrawing(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50">
      {/* Header */}
      <header className="bg-white border-b px-4 py-3">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" onClick={() => navigate("/dashboard")}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
            <div className="flex items-center space-x-2">
              <Users className="h-6 w-6 text-green-600" />
              <h1 className="text-xl font-bold text-gray-900">Referral Program</h1>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto p-4 space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-gradient-to-br from-green-50 to-blue-50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Earnings</p>
                  <p className="text-2xl font-bold text-gray-900">₦{totalEarnings.toLocaleString()}</p>
                </div>
                <TrendingUp className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-blue-50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Available Balance</p>
                  <p className="text-2xl font-bold text-gray-900">₦{availableBalance.toLocaleString()}</p>
                </div>
                <DollarSign className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-blue-50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Referrals</p>
                  <p className="text-2xl font-bold text-gray-900">{earnings.length}</p>
                </div>
                <UserCheck className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Referral Link */}
        <Card className="bg-gradient-to-br from-green-50 to-blue-50">
          <CardHeader>
            <CardTitle>Your Referral Link</CardTitle>
            <CardDescription>
              Share this link to earn 10% of every upgrade made by your referrals.
              Earnings are only applicable to paid plans.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Input
                value={referralLink}
                readOnly
                className="font-mono text-sm"
              />
              <Button onClick={copyReferralLink} className="bg-gradient-to-r from-green-600 to-blue-500 hover:from-green-700 hover:to-blue-600">
                <Copy className="h-4 w-4 mr-2" />
                Copy
              </Button>
            </div>
            <div className="mt-4 p-4 bg-blue-50 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">How it works:</h4>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• Share your referral link with friends and family</li>
                <li>• When they register and upgrade to any paid plan, you earn 10%</li>
                <li>• Weekly Plan: Earn ₦140 • Monthly Plan: Earn ₦450 • Yearly Plan: Earn ₦5,000</li>
                <li>• Minimum withdrawal: ₦3,000 (15% platform fee applies)</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Withdrawal Section */}
        <Card className="bg-gradient-to-br from-green-50 to-blue-50">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Withdraw Earnings
              {availableBalance >= 3000 && (
                <Button
                  onClick={() => setShowWithdrawForm(!showWithdrawForm)}
                  className="bg-gradient-to-r from-green-600 to-blue-500 hover:from-green-700 hover:to-blue-600"
                >
                  <Banknote className="h-4 w-4 mr-2" />
                  Withdraw
                </Button>
              )}
            </CardTitle>
            <CardDescription>
              Minimum withdrawal amount is ₦3,000. A 15% platform fee will be deducted.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {availableBalance < 3000 ? (
              <div className="text-center py-8 text-gray-500">
                <Banknote className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <p>You need at least ₦3,000 to withdraw.</p>
                <p className="text-sm">Current balance: ₦{availableBalance.toLocaleString()}</p>
              </div>
            ) : showWithdrawForm ? (
              <form onSubmit={handleWithdrawal} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="amount">Withdrawal Amount (₦)</Label>
                    <Input
                      id="amount"
                      type="number"
                      min="3000"
                      max={availableBalance}
                      value={withdrawalData.amount}
                      onChange={(e) => setWithdrawalData({...withdrawalData, amount: e.target.value})}
                      placeholder="Enter amount"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="bankName">Bank Name</Label>
                    <Input
                      id="bankName"
                      value={withdrawalData.bankName}
                      onChange={(e) => setWithdrawalData({...withdrawalData, bankName: e.target.value})}
                      placeholder="Enter bank name"
                      required
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="accountNumber">Account Number</Label>
                    <Input
                      id="accountNumber"
                      value={withdrawalData.accountNumber}
                      onChange={(e) => setWithdrawalData({...withdrawalData, accountNumber: e.target.value})}
                      placeholder="Enter account number"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="accountName">Account Name</Label>
                    <Input
                      id="accountName"
                      value={withdrawalData.accountName}
                      onChange={(e) => setWithdrawalData({...withdrawalData, accountName: e.target.value})}
                      placeholder="Enter account name"
                      required
                    />
                  </div>
                </div>
                {withdrawalData.amount && (
                  <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-sm text-yellow-800">
                      <strong>Amount after 15% fee:</strong> ₦{(parseFloat(withdrawalData.amount || "0") * 0.85).toFixed(2)}
                    </p>
                  </div>
                )}
                <div className="flex gap-2">
                  <Button
                    type="submit"
                    disabled={withdrawing}
                    className="bg-gradient-to-r from-green-600 to-blue-500 hover:from-green-700 hover:to-blue-600"
                  >
                    {withdrawing ? "Processing..." : "Submit Withdrawal"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowWithdrawForm(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            ) : (
              <div className="text-center py-4">
                <p className="text-green-600 font-medium">
                  You have ₦{availableBalance.toLocaleString()} available for withdrawal
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Earnings History */}
        <Card className="bg-gradient-to-br from-green-50 to-blue-50">
          <CardHeader>
            <CardTitle>Earnings History</CardTitle>
            <CardDescription>
              Track your referral earnings and their status
            </CardDescription>
          </CardHeader>
          <CardContent>
            {earnings.length === 0 ? (
              <div className="text-center py-8">
                <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No referral earnings yet.</p>
                <p className="text-sm text-gray-400">Start sharing your referral link to earn rewards!</p>
              </div>
            ) : (
              <div className="space-y-4">
                {earnings.map((earning) => (
                  <div key={earning.id} className="flex items-center justify-between p-4 bg-white rounded-lg border">
                    <div>
                      <p className="font-medium">₦{Number(earning.amount).toLocaleString()}</p>
                      <p className="text-sm text-gray-500">
                        {earning.users?.business_name || earning.users?.email || "Unknown User"}
                      </p>
                      <p className="text-xs text-gray-400">
                        {new Date(earning.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <Badge variant={earning.status === "pending" ? "warning" : "success"}>
                      {earning.status}
                    </Badge>
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


