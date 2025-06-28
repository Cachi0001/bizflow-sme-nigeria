
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
      features: [
        { name: "5 invoices per month", included: true },
        { name: "10 expense records per month", included: true },
        { name: "Basic dashboard analytics", included: true },
        { name: "Referral system access", included: true },
        { name: "Mobile responsive design", included: true },
        { name: "Basic email support", included: true },
        { name: "Client management", included: false },
        { name: "Unlimited invoices", included: false },
        { name: "Paystack integration", included: false },
        { name: "Custom branding", included: false },
        { name: "Advanced analytics", included: false },
        { name: "Voice commands (coming soon)", included: false }
      ]
    },
    silver: {
      name: "Silver Plan",
      price: { weekly: 1200, monthly: 4000, yearly: 40000 },
      description: "Best for growing businesses",
      popular: true,
      features: [
        { name: "Unlimited invoices", included: true },
        { name: "Unlimited expense tracking", included: true },
        { name: "Full client management", included: true },
        { name: "Paystack payment integration", included: true },
        { name: "Custom invoice branding", included: true },
        { name: "Advanced analytics & reports", included: true },
        { name: "Priority email support", included: true },
        { name: "Mobile responsive design", included: true },
        { name: "Referral system access", included: true },
        { name: "Voice commands (coming soon)", included: true },
        { name: "Export data to Excel/PDF", included: true },
        { name: "Team collaboration", included: true }
      ]
    },
    gold: {
      name: "Gold Premium",
      price: { weekly: 1800, monthly: 6000, yearly: 60000 },
      description: "Enterprise features (Coming Soon)",
      comingSoon: true,
      features: [
        { name: "Everything in Silver Plan", included: true },
        { name: "Advanced team management", included: true },
        { name: "API access for integrations", included: true },
        { name: "White-label solutions", included: true },
        { name: "Priority phone support", included: true },
        { name: "Advanced automation", included: true },
        { name: "Multi-location support", included: true },
        { name: "Custom reporting", included: true },
        { name: "Dedicated account manager", included: true }
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
    } else if (planName === 'Silver Plan') {
      // Redirect to Paystack payment (to be implemented)
      toast({
        title: "Redirecting to Payment",
        description: "You'll be redirected to Paystack to complete your subscription."
      });
      // This is where Paystack integration will go
    } else {
      toast({
        title: "Coming Soon",
        description: "Gold Premium plan will be available soon!"
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white">
      {/* Header */}
      <header className="px-4 lg:px-6 h-14 flex items-center border-b bg-white">
        <div className="flex items-center justify-center">
          <span className="text-2xl font-bold text-primary">Bizflow</span>
        </div>
        <nav className="ml-auto flex gap-4 sm:gap-6">
          <Button variant="ghost" onClick={() => navigate('/')}>Home</Button>
          <Button variant="ghost" onClick={() => navigate('/features')}>Features</Button>
          <Button variant="outline" onClick={() => navigate('/login')}>Login</Button>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="w-full py-12 md:py-16 px-4">
        <div className="container mx-auto text-center">
          <h1 className="text-3xl md:text-5xl font-bold tracking-tighter text-gray-900 mb-4">
            Simple, Transparent Pricing
          </h1>
          <p className="text-lg md:text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Choose the plan that fits your business needs. Start free and upgrade as you grow.
          </p>

          {/* Billing Period Toggle */}
          <div className="flex items-center justify-center mb-12">
            <div className="bg-gray-100 p-1 rounded-lg flex">
              <Button
                variant={billingPeriod === 'weekly' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setBillingPeriod('weekly')}
                className="rounded-md"
              >
                Weekly
              </Button>
              <Button
                variant={billingPeriod === 'monthly' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setBillingPeriod('monthly')}
                className="rounded-md"
              >
                Monthly
              </Button>
              <Button
                variant={billingPeriod === 'yearly' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setBillingPeriod('yearly')}
                className="rounded-md"
              >
                Yearly
                <Badge variant="secondary" className="ml-2 text-xs">Save 17%</Badge>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="py-8 bg-white">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {Object.entries(plans).map(([key, plan]) => {
              const isPopular = 'popular' in plan && plan.popular;
              const isComingSoon = 'comingSoon' in plan && plan.comingSoon;
              
              return (
                <Card 
                  key={key} 
                  className={`relative ${isPopular ? 'ring-2 ring-primary scale-105 shadow-xl' : ''} ${isComingSoon ? 'opacity-75' : ''}`}
                >
                  {isPopular && (
                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                      <Badge className="bg-primary text-white px-4 py-1">
                        Most Popular
                      </Badge>
                    </div>
                  )}
                  
                  <CardHeader className="text-center pb-6">
                    <CardTitle className="text-2xl font-bold">{plan.name}</CardTitle>
                    <CardDescription className="text-base">{plan.description}</CardDescription>
                    
                    <div className="mt-4">
                      <div className="text-4xl font-bold text-primary">
                        {formatPrice(plan.price[billingPeriod])}
                      </div>
                      <div className="text-gray-600 text-sm">
                        per {billingPeriod === 'yearly' ? 'year' : billingPeriod.slice(0, -2)}
                      </div>
                      {billingPeriod === 'yearly' && plan.price.yearly > 0 && (
                        <div className="text-green-600 text-sm font-medium mt-1">
                          Save {formatPrice(plan.price.monthly * 12 - plan.price.yearly)} annually
                        </div>
                      )}
                    </div>
                  </CardHeader>

                  <CardContent className="pt-0">
                    <div className="space-y-3 mb-6">
                      {plan.features.map((feature, index) => (
                        <div key={index} className="flex items-center">
                          {feature.included ? (
                            <CheckCircle className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                          ) : (
                            <X className="h-5 w-5 text-gray-300 mr-3 flex-shrink-0" />
                          )}
                          <span className={`text-sm ${feature.included ? 'text-gray-900' : 'text-gray-400'}`}>
                            {feature.name}
                          </span>
                        </div>
                      ))}
                    </div>

                    <Button 
                      className="w-full" 
                      size="lg"
                      disabled={isComingSoon}
                      onClick={() => handleSubscribe(plan.name)}
                      variant={isPopular ? 'default' : 'outline'}
                    >
                      {isComingSoon ? 'Coming Soon' : 
                       plan.name === 'Free Plan' ? 'Get Started Free' : 
                       `Subscribe to ${plan.name}`}
                    </Button>

                    {plan.name === 'Silver Plan' && (
                      <p className="text-xs text-gray-500 text-center mt-2">
                        Billed {billingPeriod}. Cancel anytime.
                      </p>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Referral Section */}
      <section className="py-16 bg-green-50">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-6 text-gray-900">
            Earn Money with Referrals
          </h2>
          <p className="text-lg text-gray-700 mb-8 max-w-2xl mx-auto">
            Refer friends and family to Bizflow and earn real money when they upgrade to Silver Plan.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <Card className="text-center">
              <CardContent className="p-6">
                <div className="text-3xl font-bold text-primary mb-2">₦500</div>
                <div className="text-gray-600">Weekly Silver subscribers</div>
              </CardContent>
            </Card>
            
            <Card className="text-center">
              <CardContent className="p-6">
                <div className="text-3xl font-bold text-primary mb-2">₦1,500</div>
                <div className="text-gray-600">Monthly Silver subscribers</div>
              </CardContent>
            </Card>
            
            <Card className="text-center">
              <CardContent className="p-6">
                <div className="text-3xl font-bold text-primary mb-2">₦2,000</div>
                <div className="text-gray-600">Yearly Silver subscribers</div>
              </CardContent>
            </Card>
          </div>

          <Button 
            size="lg" 
            className="mt-8"
            onClick={() => navigate('/register')}
          >
            Start Referring and Earning
          </Button>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12 text-gray-900">
            Frequently Asked Questions
          </h2>
          
          <div className="max-w-3xl mx-auto space-y-6">
            <Card>
              <CardContent className="p-6">
                <h3 className="font-semibold mb-2">Can I change my plan anytime?</h3>
                <p className="text-gray-600">Yes, you can upgrade or downgrade your plan at any time. Changes take effect immediately.</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <h3 className="font-semibold mb-2">How does the referral system work?</h3>
                <p className="text-gray-600">Share your unique referral link and earn money when someone signs up and upgrades to a paid plan. Payments are made monthly.</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <h3 className="font-semibold mb-2">Is my data secure?</h3>
                <p className="text-gray-600">Yes, we use industry-standard encryption and security measures to protect your business data.</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <h3 className="font-semibold mb-2">Do you offer customer support?</h3>
                <p className="text-gray-600">Free plan users get basic email support. Silver plan users get priority email support. Gold plan will include phone support.</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8">
        <div className="container mx-auto px-4 text-center">
          <div className="mb-4">
            <span className="text-2xl font-bold text-primary">Bizflow</span>
          </div>
          <p className="text-gray-400 text-sm">
            © 2024 Bizflow. Made with ❤️ for Nigerian businesses.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Pricing;
