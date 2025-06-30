
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
import { 
  ArrowLeft, 
  User, 
  Phone, 
  Mail, 
  Building, 
  Crown,
  Loader2,
  Save,
  Copy,
  Gift,
  Wallet
} from "lucide-react";

const Profile = () => {
  const [userProfile, setUserProfile] = useState<any>(null);
  const [formData, setFormData] = useState({
    phone: "",
    email: "",
    business_name: ""
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      loadUserProfile();
    }
  }, [user]);

  const loadUserProfile = async () => {
    try {
      const { data, error } = await supabase
        .from("users")
        .select("*, subscriptions(tier, status)")
        .eq("id", user?.id)
        .single();

      if (error) throw error;

      setUserProfile(data);
      setFormData({
        phone: data.phone || "",
        email: data.email || "",
        business_name: data.business_name || ""
      });
    } catch (error) {
      console.error("Error loading profile:", error);
      toast({
        title: "Error",
        description: "Failed to load profile data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const { error } = await supabase
        .from("users")
        .update({
          phone: formData.phone,
          email: formData.email,
          business_name: formData.business_name,
          updated_at: new Date().toISOString()
        })
        .eq("id", user?.id);

      if (error) throw error;

      toast({
        title: "Profile updated!",
        description: "Your profile information has been saved successfully."
      });

      loadUserProfile();
    } catch (error) {
      console.error("Error updating profile:", error);
      toast({
        title: "Update failed",
        description: "Failed to update profile. Please try again.",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const copyReferralLink = () => {
    if (userProfile?.referral_code) {
      const referralLink = `${window.location.origin}/register?ref=${userProfile.referral_code}`;
      navigator.clipboard.writeText(referralLink);
      
      const rewardAmount = userProfile?.subscriptions[0]?.tier === "Yearly" ? "₦5,000" : 
                          userProfile?.subscriptions[0]?.tier === "Monthly" ? "₦500" : "no reward";
      
      toast({
        title: "Referral link copied!",
        description: `Share this link to earn ${rewardAmount} per paid referral. Minimum withdrawal: ₦3,000.`
      });
    }
  };

  const handleLogout = async () => {
    await signOut();
    navigate("/");
  };

  const getReferralReward = () => {
    if (userProfile?.subscriptions[0]?.tier === "Yearly") return "₦5,000";
    if (userProfile?.subscriptions[0]?.tier === "Monthly") return "₦500";
    return "None";
  };

  const showReferralSection = userProfile?.subscriptions[0]?.tier !== "Free";

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-orange-50 flex items-center justify-center">
        <div className="flex items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
          <span className="text-gray-600">Loading profile...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-orange-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <Button 
              variant="ghost" 
              onClick={() => navigate("/dashboard")}
              className="flex items-center gap-2"
              size="sm"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Back to Dashboard</span>
            </Button>
            
            <div className="flex items-center space-x-2">
              <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-br from-blue-600 to-orange-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xs sm:text-sm">B</span>
              </div>
              <span className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-blue-600 to-orange-500 bg-clip-text text-transparent">
                Bizflow
              </span>
            </div>
            
            <Button variant="ghost" onClick={handleLogout} size="sm">
              Logout
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        {/* Profile Header */}
        <div className="text-center space-y-4">
          <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-blue-600 to-orange-500 rounded-full flex items-center justify-center mx-auto">
            <User className="h-8 w-8 sm:h-10 sm:w-10 text-white" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900">
              {userProfile?.business_name || "Your Profile"}
            </h1>
            <p className="text-sm sm:text-base text-gray-600">Manage your business information</p>
          </div>
        </div>

        {/* Profile Information */}
        <Card className="shadow-lg border-0">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <User className="h-5 w-5 text-blue-600" />
              Profile Information
            </CardTitle>
            <CardDescription className="text-sm">
              Update your business details and contact information
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSave} className="space-y-4 sm:space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    Phone Number
                  </Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="08012345678"
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    className="h-11 text-base"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    Email Address
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="your@email.com"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    className="h-11 text-base"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="businessName" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  <Building className="h-4 w-4" />
                  Business Name
                </Label>
                <Input
                  id="businessName"
                  type="text"
                  placeholder="Your Business Name"
                  value={formData.business_name}
                  onChange={(e) => setFormData({...formData, business_name: e.target.value})}
                  className="h-11 text-base"
                />
              </div>

              <Button 
                type="submit" 
                className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-orange-500 hover:from-blue-700 hover:to-orange-600"
                disabled={saving}
                size="sm"
              >
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Save Changes
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Account Status and Referral */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Subscription Status */}
          <Card className="shadow-lg border-0">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <Crown className="h-5 w-5 text-orange-500" />
                Subscription Status
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm sm:text-base text-gray-600">Current Plan:</span>
                <Badge variant={userProfile?.subscriptions[0]?.tier === "Free" ? "secondary" : "default"}>
                  {userProfile?.subscriptions[0]?.tier || "Free"} Plan
                </Badge>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm sm:text-base text-gray-600">Referral Reward:</span>
                <Badge variant="outline" className="text-green-600">
                  {getReferralReward()}
                </Badge>
              </div>

              {!showReferralSection && (
                <Button 
                  className="w-full bg-gradient-to-r from-blue-600 to-orange-500 hover:from-blue-700 hover:to-orange-600"
                  onClick={() => navigate("/pricing")}
                  size="sm"
                >
                  Upgrade to Earn Referral Rewards
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Referral System */}
          <Card className="shadow-lg border-0">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <Gift className="h-5 w-5 text-green-500" />
                Referral Program
              </CardTitle>
              <CardDescription className="text-sm">
                {showReferralSection ? `Earn ${getReferralReward()} per referral` : "Upgrade to earn referral rewards"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {showReferralSection ? (
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700">Your Referral Code:</Label>
                  <div className="flex items-center gap-2">
                    <Input 
                      value={userProfile?.referral_code || ""} 
                      readOnly 
                      className="font-mono text-center text-sm"
                    />
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={copyReferralLink}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-4">
                  <p className="text-gray-500">Upgrade your plan to access the referral program.</p>
                </div>
              )}
              
              <div className="text-xs sm:text-sm text-gray-600 space-y-1">
                <p>• Monthly Plan: Earn ₦500 per referral</p>
                <p>• Yearly Plan: Earn ₦5,000 per referral</p>
                <p>• Minimum withdrawal: ₦3,000 (15% fee)</p>
                <p>• No cap on total earnings</p>
              </div>

              {!showReferralSection && (
                <Button 
                  variant="outline"
                  className="w-full"
                  onClick={() => navigate("/pricing")}
                  size="sm"
                >
                  <Wallet className="mr-2 h-4 w-4" />
                  Upgrade to Start Earning
                </Button>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Account Actions */}
        <Card className="shadow-lg border-0">
          <CardHeader>
            <CardTitle className="text-red-600 text-base sm:text-lg">Account Actions</CardTitle>
            <CardDescription className="text-sm">
              Manage your account settings
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              variant="destructive" 
              onClick={handleLogout}
              className="w-full sm:w-auto"
              size="sm"
            >
              Sign Out
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Profile;


