
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Receipt, Users, Gift, TrendingUp, Smartphone, CreditCard, Mic } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Features = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: <FileText className="h-8 w-8 text-green-600" />,
      title: "Invoice Management",
      description: "Create professional invoices quick quick, track payments, and send reminders to customers wey never pay.",
      freePlan: "5 invoices per month",
      silverPlan: "450 invoices per month with custom branding"
    },
    {
      icon: <Receipt className="h-8 w-8 text-green-600" />,
      title: "Expense Tracking", 
      description: "Monitor all your business expenses, categorize spending, and get monthly summaries to know where your money dey go.",
      freePlan: "10 expenses per month", 
      silverPlan: "450 expenses with advanced categorization"
    },
    {
      icon: <Users className="h-8 w-8 text-green-600" />,
      title: "Client Management",
      description: "Keep detailed records of all your customers, keep track their purchase history, and manage relationships better.",
      freePlan: "Not available",
      silverPlan: "Full client database with transaction history"
    },
    {
      icon: <Gift className="h-8 w-8 text-green-600" />,
      title: "Referral System",
      description: "Refer friends and family to Bizflow and earn real money - up to ₦5,000 for each person wey upgrade to paid plans.",
      freePlan: "Available - earn rewards",
      silverPlan: "Available - earn rewards"
    },
    {
      icon: <TrendingUp className="h-8 w-8 text-green-600" />,
      title: "Business Analytics", 
      description: "Get insights into your business performance with charts and reports to help you make better decisions.",
      freePlan: "Basic metrics only",
      silverPlan: "Advanced analytics and trends"
    },
    {
      icon: <CreditCard className="h-8 w-8 text-green-600" />,
      title: "Paystack Integration",
      description: "Accept payments directly through your invoices using Paystack - no more wahala of manual transfers.",
      freePlan: "Not available", 
      silverPlan: "Full payment processing"
    },
    {
      icon: <Smartphone className="h-8 w-8 text-green-600" />,
      title: "Mobile Responsive",
      description: "Use Bizflow on any device - phone, tablet, or computer. Everything works smoothly on small screens.",
      freePlan: "Full mobile access",
      silverPlan: "Full mobile access"
    },
    {
      icon: <Mic className="h-8 w-8 text-green-600" />,
      title: "Voice Commands",
      description: "Control your business with voice commands, - create invoices, check expenses, all by speaking (coming soon).",
      freePlan: "Not available",
      silverPlan: "Not available"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white">
      {/* Header */}
      <header className="px-4 lg:px-6 h-14 flex items-center border-b bg-white">
        <div className="flex items-center justify-center">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-br from-green-600 to-green-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">B</span>
            </div>
            <span className="text-2xl font-bold text-green-600">Bizflow</span>
          </div>
        </div>
        <nav className="ml-auto flex gap-4 sm:gap-6">
          <Button variant="ghost" onClick={() => navigate('/')}>Home</Button>
          <Button variant="ghost" onClick={() => navigate('/pricing')}>Pricing</Button>
          <Button variant="outline" onClick={() => navigate('/login')}>Login</Button>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="w-full py-12 md:py-24 px-4">
        <div className="container mx-auto text-center">
          <h1 className="text-3xl md:text-5xl font-bold tracking-tighter text-gray-900 mb-6">
            Powerful Features for Your Business
          </h1>
          <p className="text-lg md:text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Everything you need to manage your Nigerian business efficiently. 
            From invoicing to client management, we get you covered.
          </p>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow h-full bg-gradient-to-br from-green-50 to-white border-green-100">
                <CardHeader>
                  <div className="mb-4 w-12 h-12 bg-gradient-to-br from-green-100 to-green-50 rounded-xl flex items-center justify-center">
                    {feature.icon}
                  </div>
                  <CardTitle className="text-xl text-green-800">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent className="flex-1">
                  <CardDescription className="text-base mb-6 leading-relaxed text-gray-600">
                    {feature.description}
                  </CardDescription>
                  
                  <div className="space-y-3">
                    <div className="flex items-start">
                      <span className="inline-block w-2 h-2 bg-gray-400 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                      <div>
                        <span className="text-sm font-medium text-gray-600">Free Plan: </span>
                        <span className="text-sm text-gray-700">{feature.freePlan}</span>
                      </div>
                    </div>
                    
                    <div className="flex items-start">
                      <span className="inline-block w-2 h-2 bg-green-600 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                      <div>
                        <span className="text-sm font-medium text-green-600">Silver Plan: </span>
                        <span className="text-sm text-gray-700">{feature.silverPlan}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-r from-green-600 to-green-500 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to Transform Your Business?
          </h2>
          <p className="text-lg mb-8 max-w-2xl mx-auto opacity-90">
            Join thousands of Nigerian businesses already using Bizflow to streamline their operations.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg" 
              variant="secondary"
              className="text-lg px-8 py-3 bg-white text-green-600 hover:bg-gray-100"
              onClick={() => navigate('/register')}
            >
              Start Free Trial
            </Button>
            <Button 
              size="lg" 
              variant="outline"
              className="text-lg px-8 py-3 border-white text-white hover:bg-white hover:text-green-600"
              onClick={() => navigate('/pricing')}
            >
              View Pricing
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8">
        <div className="container mx-auto px-4 text-center">
          <div className="mb-4">
            <div className="flex items-center justify-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-green-600 to-green-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">B</span>
              </div>
              <span className="text-2xl font-bold text-green-500">Bizflow</span>
            </div>
          </div>
          <p className="text-gray-400 text-sm">
            © 2024 Bizflow. Made with ❤️ for Nigerian businesses.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Features;
