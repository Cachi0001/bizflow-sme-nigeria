
import { useState, useEffect } from "react";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, Star } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const Pricing = () => {
  const [loading, setLoading] = useState<string | null>(null);
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleUpgrade = async (planType: string, amount: number) => {
    if (!user) {
      navigate("/login");
      return;
    }

    setLoading(planType);
    try {
      const { data, error } = await supabase.functions.invoke('handle-upgrade', {
        body: {
          currentPlan: 'Free',
          newPlan: planType,
          userId: user.id,
          userEmail: user.email,
        }
      });

      if (error) throw error;

      if (data.success && data.redirectUrl) {
        // Open Paystack checkout in a new tab
        window.open(data.redirectUrl, '_blank');
        toast({
          title: "Redirecting to Payment",
          description: "Complete your payment to activate your subscription.",
        });
      } else if (data.success) {
        toast({
          title: "Upgrade Successful",
          description: data.message || "Your plan has been upgraded successfully!",
        });
        navigate("/dashboard");
      }
    } catch (error: any) {
      console.error("Upgrade error:", error);
      toast({
        title: "Upgrade Failed",
        description: error.message || "Failed to process upgrade. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(null);
    }
  };

  // Check user's current subscription to determine button states
  const [userSubscription, setUserSubscription] = useState<string>('Free');

  useEffect(() => {
    const fetchUserSubscription = async () => {
      if (!user) return;
      
      try {
        const { data: userData, error } = await supabase
          .from("users")
          .select("subscription_tier, is_trial")
          .eq("id", user.id)
          .single();

        if (!error && userData) {
          if (userData.is_trial) {
            setUserSubscription('Weekly');
          } else {
            setUserSubscription(userData.subscription_tier || 'Free');
          }
        }
      } catch (error) {
        console.error("Error fetching user subscription:", error);
      }
    };

    fetchUserSubscription();
  }, [user]);

  const currentPlan = userSubscription;

  const plans = [
    {
      name: "Free",
      price: "₦0",
      period: "forever",
      description: "Basic features for small businesses",
      popular: false,
      features: [
        "5 invoices per month",
        "5 expense records per month", 
        "Basic client management",
        "Basic reporting",
        "Email support",
      ],
      limitations: [
        "Limited invoices and expenses",
        "Basic features only",
        "No advanced analytics",
      ],
      buttonText: currentPlan === "Free" ? "Current Plan" : "Downgrade to Free",
      disabled: currentPlan === "Free",
    },
    {
      name: "Silver Weekly",
      price: "₦1,400",
      period: "per week",
      description: "Perfect for growing businesses",
      popular: true,
      features: [
        "100 invoices per week",
        "100 expense records per week",
        "Unlimited client management",
        "Advanced reporting & analytics",
        "Sales report downloads",
        "Priority email support",
        "Basic team features",
      ],
      buttonText: currentPlan === "Weekly" ? "Current Plan" : "Start Weekly Plan",
      planType: "Weekly",
      amount: 1400,
      disabled: currentPlan === "Weekly",
    },
    {
      name: "Silver Monthly",
      price: "₦4,500",
      period: "per month",
      description: "Most popular choice for SMEs",
      popular: false,
      features: [
        "450 invoices per month",
        "450 expense records per month",
        "Unlimited client management",
        "Advanced reporting & analytics",
        "Sales report downloads",
        "₦500 referral rewards",
        "Priority email support",
        "Team management",
      ],
      buttonText: currentPlan === "Monthly" ? "Current Plan" : "Start Monthly Plan",
      planType: "Monthly",
      amount: 4500,
      disabled: currentPlan === "Monthly",
    },
    {
      name: "Silver Yearly",
      price: "₦50,000",
      period: "per year",
      description: "Best value for established businesses",
      popular: false,
      features: [
        "6,000 invoices per year",
        "6,000 expense records per year",
        "Unlimited client management",
        "Advanced reporting & analytics",
        "Sales report downloads",
        "₦5,000 referral rewards",
        "Priority support",
        "Full team management",
        "Advanced analytics",
      ],
      buttonText: currentPlan === "Yearly" ? "Current Plan" : "Start Yearly Plan",
      planType: "Yearly",
      amount: 50000,
      disabled: currentPlan === "Yearly",
    },
  ];

  const goldPlan = {
    name: "Gold Premium",
    price: "₦6,000",
    period: "per month",
    description: "Coming Soon - Advanced AI Features",
    popular: false,
    features: [
      "Everything in Silver Yearly",
      "AI-powered analytics & forecasting",
      "Automated bank reconciliation",
      "Smart expense categorization",
      "Predictive inventory management",
      "Enhanced CRM with lead scoring",
      "Multi-currency support",
      "Advanced security features",
    ],
    comingSoon: true,
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
      <Navbar />
      
      <div className="pt-20 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center mb-16">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Choose Your Perfect Plan
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Start with our 7-day free trial featuring Weekly plan benefits, then choose the plan that fits your business needs.
            </p>
          </div>

          {/* Trial Banner */}
          <div className="mb-12">
            <Card className="bg-gradient-to-r from-green-500 to-blue-500 text-white border-none">
              <CardContent className="p-6 text-center">
                <h3 className="text-2xl font-bold mb-2">🎉 7-Day Free Trial Available!</h3>
                <p className="text-lg opacity-90 mb-4">
                  New users get full Weekly plan features for 7 days absolutely free. No credit card required!
                </p>
                <Button 
                  variant="secondary" 
                  className="bg-white text-green-600 hover:bg-gray-100"
                  onClick={() => navigate("/register")}
                >
                  Start Your Free Trial
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Main Plans Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
            {plans.map((plan) => (
              <Card
                key={plan.name}
                className={`relative transition-all duration-300 hover:shadow-lg ${
                  plan.popular 
                    ? "ring-2 ring-green-500 shadow-lg scale-105" 
                    : "hover:shadow-md"
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-gradient-to-r from-green-600 to-blue-500 text-white px-4 py-1">
                      <Star className="w-3 h-3 mr-1" />
                      Most Popular
                    </Badge>
                  </div>
                )}
                
                <CardHeader className="text-center pb-4">
                  <CardTitle className="text-xl font-bold">{plan.name}</CardTitle>
                  <div className="mt-2">
                    <span className="text-3xl font-bold text-gray-900">{plan.price}</span>
                    <span className="text-gray-600 ml-1">/{plan.period}</span>
                  </div>
                  <CardDescription className="mt-2">{plan.description}</CardDescription>
                </CardHeader>

                <CardContent className="space-y-4">
                  <ul className="space-y-2">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-start">
                        <Check className="w-4 h-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                        <span className="text-sm text-gray-600">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  {plan.limitations && (
                    <div className="pt-2 border-t">
                      <p className="text-xs text-gray-500 mb-2">Limitations:</p>
                      <ul className="space-y-1">
                        {plan.limitations.map((limitation, index) => (
                          <li key={index} className="text-xs text-gray-400">
                            • {limitation}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <Button
                    className={`w-full mt-6 ${
                      plan.popular
                        ? "bg-gradient-to-r from-green-600 to-blue-500 hover:from-green-700 hover:to-blue-600"
                        : ""
                    }`}
                    variant={plan.disabled ? "secondary" : plan.popular ? "default" : "outline"}
                    disabled={plan.disabled || loading === plan.planType}
                    onClick={() => plan.planType && plan.amount && handleUpgrade(plan.planType, plan.amount)}
                  >
                    {loading === plan.planType ? "Processing..." : plan.buttonText}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Gold Plan - Coming Soon */}
          <div className="max-w-4xl mx-auto">
            <Card className="bg-gradient-to-br from-yellow-50 to-amber-50 border-2 border-yellow-200 relative overflow-hidden">
              <div className="absolute inset-0 bg-white/50 backdrop-blur-sm flex items-center justify-center">
                <Badge className="bg-yellow-500 text-white text-lg px-6 py-2">
                  Coming Soon
                </Badge>
              </div>
              
              <CardHeader className="text-center pb-4">
                <CardTitle className="text-2xl font-bold text-yellow-800">{goldPlan.name}</CardTitle>
                <div className="mt-2">
                  <span className="text-4xl font-bold text-gray-900">{goldPlan.price}</span>
                  <span className="text-gray-600 ml-1">/{goldPlan.period}</span>
                </div>
                <CardDescription className="mt-2 text-yellow-700">{goldPlan.description}</CardDescription>
              </CardHeader>

              <CardContent>
                <div className="grid md:grid-cols-2 gap-6">
                  <ul className="space-y-2">
                    {goldPlan.features.slice(0, 4).map((feature, index) => (
                      <li key={index} className="flex items-start">
                        <Check className="w-4 h-4 text-yellow-500 mr-2 mt-0.5 flex-shrink-0" />
                        <span className="text-sm text-yellow-800">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <ul className="space-y-2">
                    {goldPlan.features.slice(4).map((feature, index) => (
                      <li key={index} className="flex items-start">
                        <Check className="w-4 h-4 text-yellow-500 mr-2 mt-0.5 flex-shrink-0" />
                        <span className="text-sm text-yellow-800">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Pricing;
