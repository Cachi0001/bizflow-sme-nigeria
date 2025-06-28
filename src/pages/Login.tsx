
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

const Login = () => {
  const [formData, setFormData] = useState({
    phoneOrEmail: "",
    password: ""
  });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // For demo purposes, check if user exists in localStorage
      const existingUsers = JSON.parse(localStorage.getItem('users') || '[]');
      const user = existingUsers.find((u: any) => 
        (u.phone === formData.phoneOrEmail || u.email === formData.phoneOrEmail) && 
        u.password === formData.password
      );

      if (user) {
        localStorage.setItem('currentUser', JSON.stringify(user));
        localStorage.setItem('authToken', 'temp_token_' + user.id);
        
        toast({
          title: "Welcome back!",
          description: "Successfully logged in to your account."
        });
        
        navigate('/dashboard');
      } else {
        // Create a demo user for testing
        const demoUser = {
          id: Date.now(),
          phone: formData.phoneOrEmail,
          email: formData.phoneOrEmail.includes('@') ? formData.phoneOrEmail : null,
          role: 'Owner',
          businessName: 'Demo Business',
          subscriptionTier: 'Free',
          referralCode: Math.random().toString(36).substring(2, 8).toUpperCase(),
          createdAt: new Date().toISOString()
        };

        localStorage.setItem('currentUser', JSON.stringify(demoUser));
        localStorage.setItem('authToken', 'temp_token_' + demoUser.id);

        toast({
          title: "Demo Login Successful",
          description: "Logged in with demo account for testing."
        });

        navigate('/dashboard');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to log in. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mb-4">
            <span className="text-2xl font-bold text-primary">Bizflow</span>
          </div>
          <CardTitle className="text-2xl">Welcome Back</CardTitle>
          <CardDescription>
            Sign in to your Bizflow account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="phoneOrEmail">Phone Number or Email</Label>
              <Input
                id="phoneOrEmail"
                type="text"
                placeholder="080xxxxxxxx or your@email.com"
                value={formData.phoneOrEmail}
                onChange={(e) => setFormData({...formData, phoneOrEmail: e.target.value})}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
                required
              />
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Signing In..." : "Sign In"}
            </Button>

            <div className="text-center">
              <Button variant="link" className="text-sm text-primary">
                Forgot Password?
              </Button>
            </div>

            <div className="text-center text-sm">
              <span className="text-gray-600">Don't have an account? </span>
              <Button 
                variant="link" 
                className="p-0 h-auto font-normal text-primary"
                onClick={() => navigate('/register')}
              >
                Sign up here
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;
