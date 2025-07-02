import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (phone: string, email: string, password: string, businessName?: string, referralCode?: string) => Promise<any>;
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

  const signUp = async (phone: string, email: string, password: string, businessName?: string, referralCode?: string) => {
    try {
      if (!email || !password) {
        throw new Error("Email and password are required");
      }

      console.log('Attempting signup with:', { email, phone, businessName, referralCode });

      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/dashboard`,
          data: {
            phone: phone?.trim() || '',
            business_name: businessName?.trim() || '',
            role: 'Owner',
            subscription_tier: 'Weekly', // Start with Weekly tier for 7-day trial
            referral_code: referralCode || ''
          }
        }
      });

      if (error) {
        console.error('Supabase signup error:', error);
        throw error;
      }

      console.log('Signup successful:', data);

      // Call the handle-new-user Edge Function to set up trial and user data
      if (data.user) {
        try {
          const { error: setupError } = await supabase.functions.invoke('handle-new-user', {
            body: {
              userId: data.user.id,
              email: email.trim(),
              phone: phone?.trim() || '',
              businessName: businessName?.trim() || '',
              referralCode: referralCode || ''
            }
          });

          if (setupError) {
            console.error('Error setting up user trial:', setupError);
            // Don't fail the signup, but log the error
          } else {
            console.log('User trial setup completed successfully');
          }
        } catch (setupError) {
          console.error('Error calling handle-new-user function:', setupError);
          // Don't fail the signup, but log the error
        }
      }

      if (data.user && !data.user.email_confirmed_at) {
        toast({
          title: "Check your email!",
          description: "We sent you a confirmation link. Your 7-day free trial will start once you verify your email."
        });
      } else {
        toast({
          title: "Welcome to Bizflow!",
          description: "Your 7-day free trial has started. Enjoy full access to all Weekly plan features!"
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
      // Clear local state immediately for better UX
      setUser(null);
      setSession(null);
      
      // Attempt to sign out from Supabase
      const { error } = await supabase.auth.signOut();
      
      // Even if there's an error, we've cleared local state
      // This handles cases where the session is already expired
      if (error && !error.message.includes('session')) {
        console.warn('Logout warning:', error);
      }
      
      toast({
        title: "Logged out",
        description: "You have been successfully logged out."
      });
    } catch (error: any) {
      // Even on error, clear local state and show success
      // because the user clicked logout and expects to be logged out
      console.warn('Logout error (handled gracefully):', error);
      setUser(null);
      setSession(null);
      
      toast({
        title: "Logged out",
        description: "You have been logged out."
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
