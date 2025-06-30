import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate, useLocation } from "react-router-dom";
import { Mail, Phone, Briefcase, Lock } from "lucide-react";

const Register = () => {
  const [formData, setFormData] = useState({
    phone: "",
    email: "",
    password: "",
    businessName: "",
    referralCode: ""
  });
  const [loading, setLoading] = useState(false);
  const { signUp } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  useEffect(() => {
    // Extract referral code from URL
    const params = new URLSearchParams(location.search);
    const ref = params.get("ref");
    if (ref) {
      setFormData(prev => ({ ...prev, referralCode: ref }));
    }
  }, [location]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { phone, email, password, businessName, referralCode } = formData;
      const { data, error } = await signUp(phone, email, password, businessName, referralCode);

      if (error) {
        throw error;
      }

      if (data?.user?.email_confirmed_at) {
        navigate("/dashboard");
      } else {
        toast({
          title: "Account Created!",
          description: "Please check your email to verify your account before logging in.",
          variant: "default"
        });
        navigate("/login"); // Redirect to login page after successful registration, awaiting email verification
      }
    } catch (error: any) {
      toast({
        title: "Registration Failed",
        description: error.message || "An unexpected error occurred.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Create your account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Join Bizflow and manage your business finances
          </p>
        </div>
        <Card className="bg-white shadow-xl">
          <CardContent className="p-8">
            <form className="space-y-6" onSubmit={handleSubmit}>
              {/* Phone Number Field */}
              <div>
                <Label htmlFor="phone">Phone Number</Label>
                <div className="relative mt-1">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="Enter your phone number"
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Email Address Field */}
              <div>
                <Label htmlFor="email">Email Address</Label>
                <div className="relative mt-1">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="Enter your email address"
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Password Field */}
              <div>
                <Label htmlFor="password">Password</Label>
                <div className="relative mt-1">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="current-password"
                    required
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="Enter your password"
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Business Name Field */}
              <div>
                <Label htmlFor="businessName">Business Name</Label>
                <div className="relative mt-1">
                  <Briefcase className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <Input
                    id="businessName"
                    name="businessName"
                    type="text"
                    required
                    value={formData.businessName}
                    onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                    placeholder="Enter your business name"
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Referral Code Field */}
              <div>
                <Label htmlFor="referralCode">Referral Code (Optional)</Label>
                <Input
                  id="referralCode"
                  name="referralCode"
                  type="text"
                  value={formData.referralCode}
                  onChange={(e) => setFormData({ ...formData, referralCode: e.target.value })}
                  placeholder="Enter referral code if you have one"
                  className="mt-1"
                />
                {formData.referralCode && (
                  <p className="text-xs text-green-600 mt-1">
                    Great! You'll help support the person who referred you.
                  </p>
                )}
              </div>

              <div>
                <Button
                  type="submit"
                  className="w-full bg-gradient-to-r from-green-600 to-blue-500 hover:from-green-700 hover:to-blue-600 text-white"
                  disabled={loading}
                >
                  {loading ? "Creating account..." : "Create Account"}
                </Button>
              </div>
            </form>
            <div className="mt-4 text-center">
              Already have an account?{" "}
              <Button variant="link" onClick={() => navigate("/login")}>
                Log in
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Register;


