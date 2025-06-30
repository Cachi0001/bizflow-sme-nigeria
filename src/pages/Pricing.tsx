import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

const Pricing = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [currentPlan, setCurrentPlan] = useState<string>('Free');

  useEffect(() => {
    if (user) {
      setCurrentPlan(user.user_metadata?.subscription_tier || 'Free');
    }
  }, [user]);

  const isCurrentPlan = (plan: string) => {
    return currentPlan === plan;
  };

  const handleUpgrade = async (newPlan: string) => {
    if (!user) {
      toast({
        title: "Not logged in",
        description: "Please log in to upgrade your plan.",
        variant: "destructive"
      });
      return;
    }

    if (isCurrentPlan(newPlan)) {
      toast({
        title: "Already on this plan",
        description: `You are already subscribed to the ${newPlan} plan.`,
        variant: "default"
      });
      return;
    }

    setLoading(true);

    try {
      // Call your upgrade API or function here
      // For example, call the handle-upgrade function deployed in Supabase Edge Functions
      const response = await fetch('/.netlify/functions/handle-upgrade', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId: user.id,
          currentPlan,
          newPlan
        })
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: "Upgrade successful",
          description: data.message || `You have upgraded to the ${newPlan} plan.`,
          variant: "default"
        });
        setCurrentPlan(newPlan);
      } else {
        toast({
          title: "Upgrade failed",
          description: data.error || "Failed to upgrade your plan. Please try again.",
          variant: "destructive"
        });
      }
    } catch (error: any) {
      console.error('Upgrade error:', error);
      toast({
        title: "Upgrade failed",
        description: error.message || "Failed to upgrade your plan. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50">
      <header className="bg-white border-b px-4 py-3">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900">Pricing Plans</h1>
          <p className="mt-2 text-gray-600">Choose the plan that fits your business needs.</p>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto">
          <h2 className="text-4xl font-extrabold text-gray-900 sm:text-5xl">Simple, Transparent Pricing</h2>
          <p className="mt-4 text-lg text-gray-600">
            Upgrade anytime to unlock powerful features and referral rewards.
          </p>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* Free Plan */}
          <Card className={`border ${isCurrentPlan('Free') ? 'border-green-500 shadow-lg' : 'border-gray-200'} bg-gradient-to-br from-green-50 to-blue-50`}>
            <CardHeader className="text-center pb-8 pt-12">
              <CardTitle className="text-2xl font-bold text-gray-900">Free Plan</CardTitle>
              <div className="mt-4">
                <span className="text-5xl font-bold text-green-600">₦0</span>
                <span className="text-lg font-medium text-gray-500">/month</span>
              </div>
              <CardDescription className="mt-4 text-base">
                Perfect for startups and small businesses
              </CardDescription>
            </CardHeader>
            <CardContent className="pb-8">
              <ul className="space-y-4 mb-8">
                <li className="flex items-center">
                  <Check className="h-5 w-5 text-green-500 mr-3" />
                  <span>Unlimited invoices</span>
                </li>
                <li className="flex items-center">
                  <Check className="h-5 w-5 text-green-500 mr-3" />
                  <span>Unlimited expense records</span>
                </li>
                <li className="flex items-center">
                  <Check className="h-5 w-5 text-green-500 mr-3" />
                  <span>Unlimited clients</span>
                </li>
                <li className="flex items-center">
                  <Check className="h-5 w-5 text-green-500 mr-3" />
                  <span>Basic reporting</span>
                </li>
                <li className="flex items-center">
                  <Check className="h-5 w-5 text-green-500 mr-3" />
                  <span>Community support</span>
                </li>
                <li className="flex items-center">
                  <Check className="h-5 w-5 text-green-500 mr-3" />
                  <span>Referral link (no earnings)</span>
                </li>
              </ul>
              <Button 
                onClick={() => handleUpgrade('Free')} 
                disabled={loading || isCurrentPlan('Free')}
                className="w-full bg-gradient-to-r from-green-600 to-blue-500 hover:from-green-700 hover:to-blue-600 text-white"
                size="lg"
              >
                {loading ? "Processing..." : isCurrentPlan('Free') ? "Current Plan" : "Choose Free"}
              </Button>
            </CardContent>
          </Card>

          {/* Monthly Plan */}
          <Card className={`border ${isCurrentPlan('Monthly') ? 'border-green-500 shadow-lg' : 'border-gray-200'} bg-gradient-to-br from-green-50 to-blue-50`}>
            <CardHeader className="text-center pb-8 pt-12">
              <CardTitle className="text-2xl font-bold text-gray-900">Monthly Plan</CardTitle>
              <div className="mt-4">
                <span className="text-5xl font-bold text-green-600">₦4,500</span>
                <span className="text-lg font-medium text-gray-500">/month</span>
              </div>
              <CardDescription className="mt-4 text-base">
                Ideal for growing businesses
              </CardDescription>
            </CardHeader>
            <CardContent className="pb-8">
              <ul className="space-y-4 mb-8">
                <li className="flex items-center">
                  <Check className="h-5 w-5 text-green-500 mr-3" />
                  <span>6,000 invoices per month</span>
                </li>
                <li className="flex items-center">
                  <Check className="h-5 w-5 text-green-500 mr-3" />
                  <span>6,000 expense records per month</span>
                </li>
                <li className="flex items-center">
                  <Check className="h-5 w-5 text-green-500 mr-3" />
                  <span>Unlimited clients</span>
                </li>
                <li className="flex items-center">
                  <Check className="h-5 w-5 text-green-500 mr-3" />
                  <span>Advanced reporting</span>
                </li>
                <li className="flex items-center">
                  <Check className="h-5 w-5 text-green-500 mr-3" />
                  <span>Priority email support</span>
                </li>
                <li className="flex items-center">
                  <Check className="h-5 w-5 text-green-500 mr-3" />
                  <span>₦500 per referral</span>
                </li>
                <li className="flex items-center">
                  <Check className="h-5 w-5 text-green-500 mr-3" />
                  <span>Team management</span>
                </li>
                <li className="flex items-center">
                  <Check className="h-5 w-5 text-green-500 mr-3" />
                  <span>Pro-rata upgrades</span>
                </li>
              </ul>
              <Button 
                onClick={() => handleUpgrade('Monthly')} 
                disabled={loading || isCurrentPlan('Monthly')}
                className="w-full bg-gradient-to-r from-green-600 to-blue-500 hover:from-green-700 hover:to-blue-600 text-white"
                size="lg"
              >
                {loading ? "Processing..." : isCurrentPlan('Monthly') ? "Current Plan" : "Choose Monthly"}
              </Button>
            </CardContent>
          </Card>

          {/* Yearly Plan */}
          <Card className="relative border-2 border-green-500 shadow-2xl bg-gradient-to-br from-green-50 to-blue-50">
            <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
              <span className="bg-gradient-to-r from-green-600 to-blue-500 text-white px-4 py-2 rounded-full text-sm font-medium">
                Most Popular
              </span>
            </div>
            <CardHeader className="text-center pb-8 pt-12">
              <CardTitle className="text-2xl font-bold text-gray-900">Yearly Plan</CardTitle>
              <div className="mt-4">
                <span className="text-5xl font-bold text-green-600">₦50,000</span>
                <span className="text-lg font-medium text-gray-500">/year</span>
              </div>
              <CardDescription className="mt-4 text-base">
                Best value for growing businesses
              </CardDescription>
            </CardHeader>
            <CardContent className="pb-8">
              <ul className="space-y-4 mb-8">
                <li className="flex items-center">
                  <Check className="h-5 w-5 text-green-500 mr-3" />
                  <span>6,000 invoices per year</span>
                </li>
                <li className="flex items-center">
                  <Check className="h-5 w-5 text-green-500 mr-3" />
                  <span>6,000 expense records per year</span>
                </li>
                <li className="flex items-center">
                  <Check className="h-5 w-5 text-green-500 mr-3" />
                  <span>Unlimited clients</span>
                </li>
                <li className="flex items-center">
                  <Check className="h-5 w-5 text-green-500 mr-3" />
                  <span>Advanced reporting</span>
                </li>
                <li className="flex items-center">
                  <Check className="h-5 w-5 text-green-500 mr-3" />
                  <span>Priority email support</span>
                </li>
                <li className="flex items-center">
                  <Check className="h-5 w-5 text-green-500 mr-3" />
                  <span>₦5,000 per referral</span>
                </li>
                <li className="flex items-center">
                  <Check className="h-5 w-5 text-green-500 mr-3" />
                  <span>Team management</span>
                </li>
                <li className="flex items-center">
                  <Check className="h-5 w-5 text-green-500 mr-3" />
                  <span>Pro-rata upgrades</span>
                </li>
              </ul>
              <Button 
                onClick={() => handleUpgrade('Yearly')} 
                disabled={loading || isCurrentPlan('Yearly')}
                className="w-full bg-gradient-to-r from-green-600 to-blue-500 hover:from-green-700 hover:to-blue-600 text-white"
                size="lg"
              >
                {loading ? "Processing..." : isCurrentPlan('Yearly') ? "Current Plan" : "Choose Yearly"}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Pricing;
