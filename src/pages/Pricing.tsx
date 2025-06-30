import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";

const Pricing = () => {
  const [upgrading, setUpgrading] = useState<string | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleUpgrade = async (tier: string) => {
    try {
      setUpgrading(tier);
      // Simulate upgrade process
      toast({
        title: "Upgrade initiated",
        description: `Upgrading to ${tier} plan...`
      });
      // Replace with actual upgrade logic
      setTimeout(() => {
        toast({
          title: "Upgrade successful!",
          description: `You've been upgraded to ${tier} plan.`
        });
        setUpgrading(null);
      }, 2000);
    } catch (error: any) {
      console.error('Upgrade error:', error);
      toast({
        title: "Upgrade failed",
        description: error.message || "Please try again later.",
        variant: "destructive"
      });
      setUpgrading(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50">
      {/* Header */}
      <header className="bg-white border-b px-4 py-3">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <Button variant="ghost" onClick={() => navigate('/dashboard')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
          <h1 className="text-xl font-bold text-gray-900">Pricing Plans</h1>
        </div>
      </header>

      {/* Intro */}
      <div className="max-w-4xl mx-auto text-center py-10">
        <h2 className="text-3xl font-extrabold text-gray-900">
          Choose the plan that's right for your business
        </h2>
        <p className="mt-4 text-lg text-gray-600">
          Simple, transparent pricing. Upgrade or downgrade at any time.
        </p>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Free Plan */}
          <Card className="bg-white shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl font-bold text-gray-900">Free</CardTitle>
              <div className="mt-4">
                <span className="text-4xl font-bold text-gray-900">₦0</span>
                <span className="text-gray-500">/month</span>
              </div>
              <CardDescription className="mt-2">
                Perfect for getting started
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="space-y-3">
                <li className="flex items-center">
                  <Check className="h-5 w-5 text-green-500 mr-2" />
                  <span>5 invoices per month</span>
                </li>
                <li className="flex items-center">
                  <Check className="h-5 w-5 text-green-500 mr-2" />
                  <span>5 expense records per month</span>
                </li>
                <li className="flex items-center">
                  <Check className="h-5 w-5 text-green-500 mr-2" />
                  <span>Basic reporting</span>
                </li>
              </ul>
              <Button className="w-full bg-gray-200 text-gray-700 hover:bg-gray-300">
                Get Started
              </Button>
            </CardContent>
          </Card>

          {/* Weekly Plan */}
          <Card className="bg-gradient-to-br from-green-50 to-blue-50 shadow-lg hover:shadow-xl transition-shadow border-2 border-green-200">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl font-bold text-white">Weekly Plan</CardTitle>
              <div className="mt-4">
                <span className="text-4xl font-bold text-white">₦1,400</span>
                <span className="text-gray-200">/week</span>
              </div>
              <CardDescription className="mt-2 text-gray-100">
                For short-term projects and freelancers
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="space-y-3">
                <li className="flex items-center text-white">
                  <Check className="h-5 w-5 text-green-300 mr-2" />
                  <span>100 invoices per week</span>
                </li>
                <li className="flex items-center text-white">
                  <Check className="h-5 w-5 text-green-300 mr-2" />
                  <span>100 expense records per week</span>
                </li>
                <li className="flex items-center text-white">
                  <Check className="h-5 w-5 text-green-300 mr-2" />
                  <span>Unlimited clients</span>
                </li>
                <li className="flex items-center text-white">
                  <Check className="h-5 w-5 text-green-300 mr-2" />
                  <span>Advanced reporting</span>
                </li>
              </ul>
              <Button 
                className="w-full bg-white text-green-600 hover:bg-green-100"
                onClick={() => handleUpgrade('Weekly')}
                disabled={upgrading === 'Weekly'}
              >
                {upgrading === 'Weekly' ? 'Processing...' : 'Choose Weekly'}
              </Button>
            </CardContent>
          </Card>

          {/* Yearly Plan - Updated limits */}
          <Card className="bg-white shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl font-bold text-gray-900">Yearly Plan</CardTitle>
              <div className="mt-4">
                <span className="text-4xl font-bold text-gray-900">₦50,000</span>
                <span className="text-gray-500">/year</span>
              </div>
              <CardDescription className="mt-2">
                Best value for growing businesses
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="space-y-3">
                <li className="flex items-center">
                  <Check className="h-5 w-5 text-green-500 mr-2" />
                  <span>6,000 invoices per year</span>
                </li>
                <li className="flex items-center">
                  <Check className="h-5 w-5 text-green-500 mr-2" />
                  <span>6,000 expense records per year</span>
                </li>
                <li className="flex items-center">
                  <Check className="h-5 w-5 text-green-500 mr-2" />
                  <span>Unlimited clients</span>
                </li>
                <li className="flex items-center">
                  <Check className="h-5 w-5 text-green-500 mr-2" />
                  <span>Advanced reporting</span>
                </li>
                <li className="flex items-center">
                  <Check className="h-5 w-5 text-green-500 mr-2" />
                  <span>Team management</span>
                </li>
                <li className="flex items-center">
                  <Check className="h-5 w-5 text-green-500 mr-2" />
                  <span>Priority support</span>
                </li>
                <li className="flex items-center">
                  <Check className="h-5 w-5 text-green-500 mr-2" />
                  <span>Data export</span>
                </li>
              </ul>
              <Button 
                className="w-full bg-gradient-to-r from-green-600 to-blue-500 hover:from-green-700 hover:to-blue-600 text-white"
                onClick={() => handleUpgrade('Yearly')}
                disabled={upgrading === 'Yearly'}
              >
                {upgrading === 'Yearly' ? 'Processing...' : 'Choose Yearly'}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* FAQ Section */}
        <div className="mt-16">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Frequently Asked Questions</h2>
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-medium text-gray-900">
                What payment methods do you accept?
              </h3>
              <p className="text-gray-600">
                We accept all major credit cards, as well as payments through PayPal.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-medium text-gray-900">
                Can I change my plan later?
              </h3>
              <p className="text-gray-600">
                Yes, you can upgrade or downgrade your plan at any time. The changes will take effect immediately.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-medium text-gray-900">
                Is there a discount for annual subscriptions?
              </h3>
              <p className="text-gray-600">
                Yes, our yearly plan offers a significant discount compared to the monthly plans.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Pricing;
