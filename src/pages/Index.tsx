
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, Users, TrendingUp, Gift } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Index = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: <CheckCircle className="h-6 w-6 text-primary" />,
      title: "Invoice Management",
      description: "Create and track invoices quick quick - no wahala!"
    },
    {
      icon: <TrendingUp className="h-6 w-6 text-primary" />,
      title: "Expense Tracking", 
      description: "Monitor your spending make you no go broke"
    },
    {
      icon: <Users className="h-6 w-6 text-primary" />,
      title: "Client Management",
      description: "Keep track of all your customers for better business"
    },
    {
      icon: <Gift className="h-6 w-6 text-primary" />,
      title: "Referral Rewards",
      description: "Refer friends and earn up to ₦2,000 per referral"
    }
  ];

  const plans = [
    {
      name: "Free Plan",
      price: "₦0",
      period: "forever",
      features: [
        "5 invoices per month",
        "10 expenses tracking",
        "Basic dashboard",
        "Referral system access"
      ],
      cta: "Start Free",
      popular: false
    },
    {
      name: "Silver Plan", 
      price: "₦4,000",
      period: "per month",
      features: [
        "Unlimited invoices",
        "Unlimited expense tracking",
        "Client management",
        "Paystack integration",
        "Custom branding",
        "Voice commands (coming soon)"
      ],
      cta: "Upgrade to Silver",
      popular: true
    },
    {
      name: "Gold Premium",
      price: "₦6,000", 
      period: "per month",
      features: [
        "Advanced analytics",
        "Team collaboration", 
        "Priority support",
        "Advanced integrations"
      ],
      cta: "Coming Soon",
      popular: false,
      comingSoon: true
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white">
      {/* Header */}
      <header className="px-4 lg:px-6 h-14 flex items-center border-b">
        <div className="flex items-center justify-center">
          <span className="text-2xl font-bold text-primary">Bizflow</span>
        </div>
        <nav className="ml-auto flex gap-4 sm:gap-6">
          <Button variant="ghost" onClick={() => navigate('/features')}>Features</Button>
          <Button variant="ghost" onClick={() => navigate('/pricing')}>Pricing</Button>
          <Button variant="outline" onClick={() => navigate('/login')}>Login</Button>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="w-full py-12 md:py-24 lg:py-32 px-4">
        <div className="container mx-auto text-center">
          <h1 className="hero-text font-bold tracking-tighter text-gray-900 mb-6">
            Your Business, Simplified
          </h1>
          <p className="sub-text text-gray-600 mb-8 max-w-2xl mx-auto">
            Manage your Nigerian business with ease. From invoicing to expense tracking, 
            we get you covered. Join over 40 million SMEs wey dey use digital tools.
          </p>
          <Button 
            size="lg" 
            className="text-lg px-8 py-3"
            onClick={() => navigate('/register')}
          >
            Get Started Free
          </Button>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12 text-gray-900">
            Everything You Need to Run Your Business
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <Card key={index} className="text-center hover:shadow-lg transition-shadow">
                <CardHeader className="pb-2">
                  <div className="mx-auto mb-4">
                    {feature.icon}
                  </div>
                  <CardTitle className="text-lg">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="fluid-text">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12 text-gray-900">
            Choose Your Plan
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {plans.map((plan, index) => (
              <Card key={index} className={`relative ${plan.popular ? 'ring-2 ring-primary scale-105' : ''} ${plan.comingSoon ? 'opacity-75' : ''}`}>
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <span className="bg-primary text-white px-4 py-1 rounded-full text-sm font-medium">
                      Most Popular
                    </span>
                  </div>
                )}
                <CardHeader className="text-center">
                  <CardTitle className="text-xl">{plan.name}</CardTitle>
                  <div className="text-3xl font-bold text-primary">
                    {plan.price}
                    <span className="text-sm text-gray-600 font-normal">/{plan.period}</span>
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 mb-6">
                    {plan.features.map((feature, fIndex) => (
                      <li key={fIndex} className="flex items-center">
                        <CheckCircle className="h-4 w-4 text-primary mr-2" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Button 
                    className="w-full" 
                    disabled={plan.comingSoon}
                    onClick={() => plan.name === 'Free Plan' ? navigate('/register') : navigate('/pricing')}
                  >
                    {plan.cta}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-primary text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">
            Ready to Transform Your Business?
          </h2>
          <p className="text-lg mb-8 max-w-2xl mx-auto opacity-90">
            Join thousands of Nigerian businesses already using Bizflow to manage their operations efficiently.
          </p>
          <Button 
            size="lg" 
            variant="secondary"
            className="text-lg px-8 py-3"
            onClick={() => navigate('/register')}
          >
            Start Your Free Trial Today
          </Button>
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

export default Index;
