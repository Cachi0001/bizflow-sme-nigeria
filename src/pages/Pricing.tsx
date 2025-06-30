import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

const Pricing = () => {
  const [billingPeriod, setBillingPeriod] = useState<'weekly' | 'monthly' | 'yearly'>('monthly');
  const navigate = useNavigate();
  const { toast } = useToast();

  const plans = {
    free: {
      name: "Free Plan",
      price: { weekly: 0, monthly: 0, yearly: 0 },
      description: "Perfect for getting started",
      invoiceLimit: "5/month",
      expenseLimit: "10/month",
      referralReward: "None",
      features: [
        { name: "5 invoices per month", included: true },
        { name: "10 expense records per month", included: true },
        { name: "Basic dashboard analytics", included: true },
        { name: "Mobile responsive design", included: true },
        { name: "Basic email support", included: true },
        { name: "Client management", included: false },
        { name: "Unlimited invoices", included: false },
        { name: "Paystack integration", included: false },
        { name: "Custom branding", included: false },
        { name: "Advanced analytics", included: false }
      ]
    },
    weekly: {
      name: "Weekly Plan",
      price: { weekly: 1400, monthly: 1400, yearly: 1400 },
      description: "Flexible weekly payments",
      invoiceLimit: "100/week",
      expenseLimit: "100/week",
      referralReward: "None",
      features: [
        { name: "100 invoices per week", included: true },
        { name: "100 expense records per week", included: true },
        { name: "Full client management", included: true },
        { name: "Paystack payment integration", included: true },
        { name: "Custom invoice branding", included: true },
        { name: "Advanced analytics & reports", included: true },
        { name: "Priority email support", included: true },
        { name: "Mobile responsive design", included: true },
        { name: "Export data to Excel/PDF", included: true },
        { name: "Team collaboration", included: true }
      ]
    },
    monthly: {
      name: "Monthly Plan",
      price: { weekly: 4500, monthly: 4500, yearly: 4500 },
      description: "Best for growing businesses",
      popular: true,
      invoiceLimit: "450/month",
      expenseLimit: "450/month",
      referralReward: "₦500/referral",
      features: [
        { name: "450 invoices per month", included: true },
        { name: "450 expense records per month", included: true },
        { name: "Full client management", included: true },
        { name: "Paystack payment integration", included: true },
        { name: "Custom invoice branding", included: true },
        { name: "Advanced analytics & reports", included: true },
        { name: "Priority email support", included: true },
        { name: "Mobile responsive design", included: true },
        { name: "Referral rewards: ₦500 per paid referral", included: true },
        { name: "Export data to Excel/PDF", included: true },
        { name: "Team collaboration", included: true }
      ]
    },
    yearly: {
      name: "Yearly Plan",
      price: { weekly: 50000, monthly: 50000, yearly: 50000 },
      description: "Maximum value for serious businesses",
      invoiceLimit: "6,000/year",
      expenseLimit: "6,000/year",
      referralReward: "₦5,000/referral",
      features: [
        { name: "6,000 invoices per year", included: true },
        { name: "6,000 expense records per year", included: true },
        { name: "Full client management", included: true },
        { name: "Paystack payment integration", included: true },
        { name: "Custom invoice branding", included: true },
        { name: "Advanced analytics & reports", included: true },
        { name: "Priority email support", included: true },
        { name: "Mobile responsive design", included: true },
        { name: "Referral rewards: ₦5,000 per paid referral", included: true },
        { name: "Export data to Excel/PDF", included: true },
        { name: "Team collaboration", included: true },
        { name: "Pro-rata upgrade credits", included: true }
      ]
    }
  };

  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const handleSubscribe = (planName: string) => {
    if (planName === 'Free Plan') {
      navigate('/register');
    } else {
      toast({
        title: "Redirecting to Payment",
        description: `You'll be redirected to Paystack to complete your ${planName} subscription.`,
      });
      console.log('Payment redirect for:', planName);
      // This is where Paystack integration will go
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white">
      {/* Header */}
      <header className="px-4 lg:px-6 h-14 flex items-center border-b bg-white">
        <div className="flex items-center justify-center">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-br from-green-600 to-green-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">B</span>
            </div>
            <span className="text-xl sm:text-2xl font-bold text-green-600">Bizflow</span>
          </div>
        </div>
        <nav className="ml-auto flex gap-2 sm:gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate('/')}>Home</Button>
          <Button variant="ghost" size="sm" onClick={() => navigate('/features')}>Features</Button>
          <Button variant="outline" size="sm" onClick={() => navigate('/login')}>Login</Button>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="w-full py-8 md:py-12 px-4">
        <div className="container mx-auto text-center">
          <h1 className="text-2xl sm:text-3xl md:text-5xl font-bold tracking-tighter text-gray-900 mb-4">
            Simple, Transparent Pricing
          </h1>
          <p className="text-base sm:text-lg md:text-xl text-gray-600 mb-6 sm:mb-8 max-w-3xl mx-auto">
            Choose the plan that fits your business needs. Start free and upgrade as you grow.
          </p>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="py-4 sm:py-8 bg-white">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 max-w-7xl mx-auto">
            {Object.entries(plans).map(([key, plan]) => {
              const isPopular = 'popular' in plan && plan.popular;
              
              return (
                <Card 
                  key={key} 
                  className={`relative ${isPopular ? 'ring-2 ring-green-500 scale-105 shadow-xl bg-gradient-to-br from-green-50 to-white' : 'bg-white'} h-fit`}
                >
                  {isPopular && (
                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                      <Badge className="bg-green-600 text-white px-3 py-1 text-xs">
                        Most Popular
                      </Badge>
                    </div>
                  )}
                  
                  <CardHeader className="text-center pb-4">
                    <CardTitle className="text-lg sm:text-xl font-bold text-green-800">{plan.name}</CardTitle>
                    <CardDescription className="text-sm">{plan.description}</CardDescription>
                    
                    <div className="mt-3">
                      <div className="text-2xl sm:text-3xl font-bold text-green-600">
                        {formatPrice(plan.price.monthly)}
                      </div>
                      <div className="text-gray-600 text-xs sm:text-sm">
                        {plan.name === 'Weekly Plan' ? 'per week' : 
                         plan.name === 'Yearly Plan' ? 'per year' : 
                         plan.name === 'Free Plan' ? 'forever' : 'per month'}
                      </div>
                    </div>

                    {/* Usage Limits */}
                    <div className="mt-4 space-y-2 text-xs">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Invoices:</span>
                        <span className="font-medium text-green-700">{plan.invoiceLimit}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Expenses:</span>
                        <span className="font-medium text-green-700">{plan.expenseLimit}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Referral Reward:</span>
                        <span className="font-medium text-green-600">{plan.referralReward}</span>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="pt-0">
                    <div className="space-y-2 mb-4 sm:mb-6">
                      {plan.features.slice(0, 6).map((feature, index) => (
                        <div key={index} className="flex items-center">
                          {feature.included ? (
                            <CheckCircle className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                          ) : (
                            <X className="h-4 w-4 text-gray-300 mr-2 flex-shrink-0" />
                          )}
                          <span className={`text-xs ${feature.included ? 'text-gray-900' : 'text-gray-400'}`}>
                            {feature.name}
                          </span>
                        </div>
                      ))}
                    </div>

                    <Button 
                      className={`w-full text-sm ${isPopular ? 'bg-green-600 hover:bg-green-700' : ''}`}
                      size="sm"
                      onClick={() => handleSubscribe(plan.name)}
                      variant={isPopular ? 'default' : 'outline'}
                    >
                      {plan.name === 'Free Plan' ? 'Get Started Free' : 
                       `Subscribe to ${plan.name}`}
                    </Button>

                    {plan.name !== 'Free Plan' && (
                      <p className="text-xs text-gray-500 text-center mt-2">
                        Cancel anytime. Pro-rata upgrades available.
                      </p>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Pro-rata Upgrade Info Section */}
      <section className="py-8 sm:py-12 bg-gradient-to-br from-green-50 to-blue-50">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold mb-4 sm:mb-6 text-gray-900">
            Flexible Upgrade Options
          </h2>
          <p className="text-sm sm:text-lg text-gray-700 mb-6 sm:mb-8 max-w-2xl mx-auto">
            Upgrade or downgrade your plan anytime with pro-rata credits. You only pay for what you use.
          </p>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 max-w-4xl mx-auto">
            <Card className="text-center bg-white border-green-200">
              <CardContent className="p-4 sm:p-6">
                <div className="text-lg sm:text-xl font-bold text-green-600 mb-2">Instant Upgrades</div>
                <div className="text-sm sm:text-base text-gray-600">Get more features immediately when you upgrade</div>
              </CardContent>
            </Card>
            
            <Card className="text-center bg-white border-green-200">
              <CardContent className="p-4 sm:p-6">
                <div className="text-lg sm:text-xl font-bold text-green-600 mb-2">Pro-rata Credits</div>
                <div className="text-sm sm:text-base text-gray-600">Unused subscription time converts to credits</div>
              </CardContent>
            </Card>

            <Card className="text-center bg-white border-green-200">
              <CardContent className="p-4 sm:p-6">
                <div className="text-lg sm:text-xl font-bold text-green-600 mb-2">No Penalty</div>
                <div className="text-sm sm:text-base text-gray-600">Change plans without losing money or features</div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Referral Section */}
      <section className="py-8 sm:py-16 bg-gradient-to-br from-green-50 to-green-100">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold mb-4 sm:mb-6 text-gray-900">
            Earn Money with Referrals
          </h2>
          <p className="text-sm sm:text-lg text-gray-700 mb-6 sm:mb-8 max-w-2xl mx-auto">
            Refer businesses to Bizflow and earn real money when they upgrade to paid plans.
          </p>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 max-w-4xl mx-auto">
            <Card className="text-center bg-white border-green-200">
              <CardContent className="p-4 sm:p-6">
                <div className="text-2xl sm:text-3xl font-bold text-green-600 mb-2">₦500</div>
                <div className="text-sm sm:text-base text-gray-600">Monthly Plan subscribers</div>
              </CardContent>
            </Card>
            
            <Card className="text-center bg-white border-green-200">
              <CardContent className="p-4 sm:p-6">
                <div className="text-2xl sm:text-3xl font-bold text-green-600 mb-2">₦5,000</div>
                <div className="text-sm sm:text-base text-gray-600">Yearly Plan subscribers</div>
              </CardContent>
            </Card>
          </div>

          <div className="mt-6 sm:mt-8 space-y-2 text-xs sm:text-sm text-gray-600 max-w-2xl mx-auto">
            <p>• Minimum withdrawal: ₦3,000 (15% withdrawal fee applies)</p>
            <p>• Unlimited referrals - No cap on total earnings</p>
            <p>• Instant notifications when you earn rewards</p>
            <p>• Share via WhatsApp, SMS, or email</p>
          </div>

          <Button 
            size="sm"
            className="mt-6 sm:mt-8 bg-green-600 hover:bg-green-700"
            onClick={() => navigate('/register')}
          >
            Start Referring and Earning
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-6 sm:py-8">
        <div className="container mx-auto px-4 text-center">
          <div className="mb-4">
            <div className="flex items-center justify-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-green-600 to-green-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">B</span>
              </div>
              <span className="text-xl sm:text-2xl font-bold text-green-500">Bizflow</span>
            </div>
          </div>
          <p className="text-gray-400 text-xs sm:text-sm">
            © 2024 Bizflow. Made with ❤️ for Nigerian businesses.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Pricing;
