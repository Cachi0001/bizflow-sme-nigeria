
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { 
  FileText, 
  Receipt, 
  Users, 
  Gift, 
  TrendingUp, 
  Star,
  CheckCircle,
  ArrowRight,
  Smartphone,
  Shield,
  Zap
} from "lucide-react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { useEffect, useState } from "react";

const Index = () => {
  const navigate = useNavigate();
  const [currentTestimonial, setCurrentTestimonial] = useState(0);

  const features = [
    {
      icon: <FileText className="h-6 w-6 text-green-600" />,
      title: "Invoice Management",
      description: "Create professional invoices quickly. Perfect for small business owners wey wan organize their billing."
    },
    {
      icon: <Receipt className="h-6 w-6 text-green-600" />,
      title: "Expense Tracking", 
      description: "Track your business expenses easily. Know where your money dey go and manage your budget better."
    },
    {
      icon: <Users className="h-6 w-6 text-green-600" />,
      title: "Client Management",
      description: "Keep all your customer details in one place. Build better relationships with your clients."
    },
    {
      icon: <Gift className="h-6 w-6 text-green-600" />,
      title: "Referral Rewards",
      description: "Earn up to ₦5,000 when you refer other business owners. Make money while helping others!"
    }
  ];

  const testimonials = [
    {
      name: "Adebayo O.",
      business: "Lagos Tailoring Services",
      rating: 5,
      text: "Bizflow don help me organize my business well well. Now I fit track all my invoices and expenses for one place!"
    },
    {
      name: "Fatima A.", 
      business: "Abuja Catering Co.",
      rating: 5,
      text: "Before I dey struggle to manage my client payments. Now everything dey clear and organized. Thank you Bizflow!"
    },
    {
      name: "Chinedu P.",
      business: "Port Harcourt Electronics",
      rating: 5,
      text: "The referral system na real deal! I don earn ₦3,000 just by telling my friends about Bizflow. E easy well well!"
    },
    {
      name: "Amina K.",
      business: "Kano Fashion House",
      rating: 5,
      text: "Expenses tracking feature help me save money o. Now I know where every kobo dey go for my business."
    },
    {
      name: "Emeka N.",
      business: "Enugu Auto Parts",
      rating: 5,
      text: "Client management system na fire! I fit track all my customers and their purchase history. Business don grow!"
    },
    {
      name: "Blessing T.",
      business: "Lagos Beauty Salon",
      rating: 5,
      text: "Invoice creation dey quick like lightning. My customers dey happy with the professional invoices I dey send."
    },
    {
      name: "Ibrahim S.",
      business: "Kaduna Furniture",
      rating: 5,
      text: "Paystack integration na game changer! Now my customers fit pay invoice directly. No more wahala!"
    },
    {
      name: "Grace E.",
      business: "Warri Restaurant",
      rating: 5,
      text: "Analytics feature show me which dishes dey sell pass. Now I know wetin my customers like most!"
    },
    {
      name: "Yakubu M.",
      business: "Jos Pharmacy",
      rating: 5,
      text: "Mobile app dey work smooth for my phone. I fit manage my business anywhere I dey go!"
    },
    {
      name: "Chioma V.",
      business: "Owerri Boutique",
      rating: 5,
      text: "Free plan help me start small. When business grow, I upgrade to Silver. Bizflow dey grow with me!"
    }
  ];

  // Auto-rotate testimonials
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTestimonial((prev) => (prev + 1) % testimonials.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [testimonials.length]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-green-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-green-600 to-green-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">B</span>
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-green-600 to-green-500 bg-clip-text text-transparent">
                Bizflow
              </span>
            </div>
            
            <nav className="hidden md:flex items-center space-x-6">
              <Button variant="ghost" onClick={() => navigate('/features')}>Features</Button>
              <Button variant="ghost" onClick={() => navigate('/pricing')}>Pricing</Button>
              <Button variant="ghost" onClick={() => navigate('/login')}>Login</Button>
              <Button onClick={() => navigate('/register')} className="bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600">
                Get Started Free
              </Button>
            </nav>

            <Button 
              variant="outline" 
              size="sm" 
              className="md:hidden"
              onClick={() => navigate('/register')}
            >
              Sign Up
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="px-4 sm:px-6 lg:px-8 py-12 lg:py-20">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-6 leading-tight">
              Your Business,{" "}
              <span className="bg-gradient-to-r from-green-600 to-green-500 bg-clip-text text-transparent">
                Simplified
              </span>
            </h1>
            
            <p className="text-lg sm:text-xl text-gray-600 mb-8 max-w-2xl mx-auto leading-relaxed">
              Manage invoices, expenses, and clients with ease. Built specifically for Nigerian SMEs. 
              Start free, upgrade when ready!
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
              <Button 
                size="lg" 
                onClick={() => navigate('/register')}
                className="bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 text-white px-8 py-4 text-lg font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 w-full sm:w-auto"
              >
                Get Started Free
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              
              <Button 
                variant="outline" 
                size="lg"
                onClick={() => navigate('/features')}
                className="px-8 py-4 text-lg font-semibold rounded-xl border-2 w-full sm:w-auto border-green-200 hover:border-green-300"
              >
                Learn More
              </Button>
            </div>

            {/* Trust Indicators */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6 text-sm text-gray-500">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-green-500" />
                <span>100% Secure & Private</span>
              </div>
              <div className="flex items-center gap-2">
                <Smartphone className="h-4 w-4 text-green-500" />
                <span>Mobile Responsive</span>
              </div>
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-green-500" />
                <span>Quick Setup</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Everything You Need to Manage Your Business
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Built with Nigerian businesses in mind. Simple, powerful, and affordable.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow duration-300 border-0 shadow-md bg-gradient-to-br from-green-50 to-white">
                <CardHeader className="text-center pb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-green-100 to-green-50 rounded-xl flex items-center justify-center mx-auto mb-4">
                    {feature.icon}
                  </div>
                  <CardTitle className="text-xl font-semibold">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-center text-gray-600 leading-relaxed">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Preview */}
      <section className="py-16 bg-gradient-to-br from-green-50 to-green-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Simple, Transparent Pricing
            </h2>
            <p className="text-lg text-gray-600">
              Start free, upgrade when your business grows
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Free Plan */}
            <Card className="shadow-lg border-0 bg-white">
              <CardHeader className="text-center">
                <CardTitle className="text-2xl font-bold">Free Plan</CardTitle>
                <div className="text-3xl font-bold text-green-600 mt-2">₦0</div>
                <CardDescription>Perfect for getting started</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>5 invoices per month</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>10 expenses per month</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>Basic dashboard</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>Mobile responsive</span>
                </div>
              </CardContent>
            </Card>

            {/* Monthly Plan */}
            <Card className="shadow-xl border-0 relative overflow-hidden bg-white">
              <div className="absolute top-0 right-0 bg-gradient-to-r from-green-600 to-green-500 text-white px-3 py-1 text-sm font-semibold">
                Most Popular
              </div>
              <CardHeader className="text-center">
                <CardTitle className="text-2xl font-bold">Monthly Plan</CardTitle>
                <div className="text-3xl font-bold text-green-600 mt-2">₦4,500</div>
                <CardDescription>per month</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>450 invoices per month</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>450 expenses per month</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>Client management</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>Paystack integration</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>₦500 referral rewards</span>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="text-center mt-8">
            <Button 
              size="lg" 
              onClick={() => navigate('/pricing')}
              className="bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600"
            >
              View All Plans
            </Button>
          </div>
        </div>
      </section>

      {/* Testimonials Carousel */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              What Our Users Say
            </h2>
            <p className="text-lg text-gray-600">
              Join thousands of Nigerian businesses already using Bizflow
            </p>
          </div>

          <div className="max-w-4xl mx-auto">
            <Carousel className="w-full" opts={{ align: "start", loop: true }}>
              <CarouselContent>
                {testimonials.map((testimonial, index) => (
                  <CarouselItem key={index} className="md:basis-1/2 lg:basis-1/3">
                    <Card className="shadow-lg border-0 h-full bg-gradient-to-br from-green-50 to-white">
                      <CardContent className="pt-6 h-full flex flex-col">
                        <div className="flex items-center mb-4">
                          {[...Array(testimonial.rating)].map((_, i) => (
                            <Star key={i} className="h-4 w-4 text-yellow-400 fill-current" />
                          ))}
                        </div>
                        <p className="text-gray-700 mb-4 italic flex-grow">"{testimonial.text}"</p>
                        <div className="mt-auto">
                          <p className="font-semibold text-green-700">{testimonial.name}</p>
                          <p className="text-sm text-gray-500">{testimonial.business}</p>
                        </div>
                      </CardContent>
                    </Card>
                  </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselPrevious className="hidden md:flex" />
              <CarouselNext className="hidden md:flex" />
            </Carousel>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-r from-green-600 to-green-500">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            Ready to Simplify Your Business?
          </h2>
          <p className="text-xl text-green-100 mb-8">
            Join thousands of Nigerian businesses using Bizflow. Start free today!
          </p>
          <Button 
            size="lg"
            onClick={() => navigate('/register')}
            className="bg-white text-green-600 hover:bg-gray-100 px-8 py-4 text-lg font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
          >
            Get Started Free
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-8 h-8 bg-gradient-to-br from-green-600 to-green-500 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">B</span>
                </div>
                <span className="text-xl font-bold">Bizflow</span>
              </div>
              <p className="text-gray-400">
                Simplifying business management for Nigerian SMEs.
              </p>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">Product</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="/features" className="hover:text-white transition-colors">Features</a></li>
                <li><a href="/pricing" className="hover:text-white transition-colors">Pricing</a></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">Company</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">About</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contact</a></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">Support</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Help Center</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 pt-8 mt-8 text-center text-gray-400">
            <p>&copy; 2024 Bizflow. Built for Nigerian SMEs with ❤️</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
