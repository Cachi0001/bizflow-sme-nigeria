
import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (phone: string, email: string, password: string, businessName?: string) => Promise<any>;
  signIn: (phoneOrEmail: string, password: string) => Promise<any>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<any>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    let mounted = true;

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.email);
        
        if (mounted) {
          setSession(session);
          setUser(session?.user ?? null);
          setLoading(false);
        }
      }
    );

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (mounted) {
        console.log('Initial session:', session?.user?.email);
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signUp = async (phone: string, email: string, password: string, businessName?: string) => {
    try {
      if (!email || !password) {
        throw new Error("Email and password are required");
      }

      console.log('Attempting signup with:', { email, phone, businessName });

      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          emailRedirectTo: `https://bizflow-sme-nigeria.lovable.app/dashboard`,
          data: {
            phone: phone?.trim() || '',
            business_name: businessName?.trim() || '',
            role: 'Owner',
            subscription_tier: 'Free'
          }
        }
      });

      if (error) {
        console.error('Supabase signup error:', error);
        throw error;
      }

      console.log('Signup successful:', data);

      if (data.user && !data.user.email_confirmed_at) {
        toast({
          title: "Check your email!",
          description: "We sent you a confirmation link. Please check your email and click the link to activate your account."
        });
      } else {
        toast({
          title: "Account created successfully!",
          description: "Welcome to Bizflow. You can now start managing your business."
        });
      }

      return { data, error: null };
    } catch (error: any) {
      console.error('Signup error:', error);
      const errorMessage = error.message || "Failed to create account. Please try again.";
      
      toast({
        title: "Registration failed",
        description: errorMessage,
        variant: "destructive"
      });
      return { data: null, error };
    }
  };

  const signIn = async (phoneOrEmail: string, password: string) => {
    try {
      if (!phoneOrEmail || !password) {
        throw new Error("Phone/Email and password are required");
      }

      const identifier = phoneOrEmail.includes('@') ? phoneOrEmail.trim() : phoneOrEmail.trim();
      
      console.log('Attempting signin with:', identifier);

      const { data, error } = await supabase.auth.signInWithPassword({
        email: identifier,
        password
      });

      if (error) {
        console.error('Supabase signin error:', error);
        throw error;
      }

      console.log('Signin successful:', data);

      toast({
        title: "Welcome back!",
        description: "Successfully logged in to your account."
      });

      return { data, error: null };
    } catch (error: any) {
      console.error('Login error:', error);
      const errorMessage = error.message || "Invalid credentials. Please try again.";
      
      toast({
        title: "Login failed",
        description: errorMessage,
        variant: "destructive"
      });
      return { data: null, error };
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      toast({
        title: "Logged out",
        description: "You have been successfully logged out."
      });
    } catch (error: any) {
      console.error('Logout error:', error);
      toast({
        title: "Logout failed",
        description: error.message || "Failed to log out. Please try again.",
        variant: "destructive"
      });
    }
  };

  const resetPassword = async (email: string) => {
    try {
      const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `https://bizflow-sme-nigeria.lovable.app/reset-password`
      });

      if (error) throw error;

      toast({
        title: "Password reset email sent",
        description: "Check your email for password reset instructions."
      });

      return { data, error: null };
    } catch (error: any) {
      console.error('Password reset error:', error);
      toast({
        title: "Password reset failed",
        description: error.message || "Failed to send reset email. Please try again.",
        variant: "destructive"
      });
      return { data: null, error };
    }
  };

  const value = {
    user,
    session,
    loading,
    signUp,
    signIn,
    signOut,
    resetPassword
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
