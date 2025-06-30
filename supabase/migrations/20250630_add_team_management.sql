
-- Create enum for user roles if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role_enum') THEN
        CREATE TYPE user_role_enum AS ENUM ('Owner', 'Salesperson', 'Admin');
        -- Update users table to use the enum
        ALTER TABLE public.users ALTER COLUMN role TYPE user_role_enum USING role::user_role_enum;
    END IF;
END $$;

-- Create team_members table for salesperson management
CREATE TABLE IF NOT EXISTS public.team_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  salesperson_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(owner_id, salesperson_id)
);

-- Create referral_earnings table to track earnings
CREATE TABLE IF NOT EXISTS public.referral_earnings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  referrer_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  referred_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'withdrawn')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create withdrawal_requests table
CREATE TABLE IF NOT EXISTS public.withdrawal_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  bank_name TEXT NOT NULL,
  account_number TEXT NOT NULL,
  account_name TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  paystack_transfer_code TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on new tables
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referral_earnings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.withdrawal_requests ENABLE ROW LEVEL SECURITY;

-- Drop existing RLS policies for team_members if they exist
DROP POLICY IF EXISTS "Owners can manage their team members" ON public.team_members;
DROP POLICY IF EXISTS "Salespeople can view their own record" ON public.team_members;

-- RLS policies for team_members
CREATE POLICY "Owners can manage their team members" ON public.team_members
  FOR ALL USING (auth.uid() = owner_id);

CREATE POLICY "Salespeople can view their own record" ON public.team_members
  FOR SELECT USING (auth.uid() = salesperson_id);

-- Drop existing RLS policies for referral_earnings if they exist
DROP POLICY IF EXISTS "Users can view their own earnings" ON public.referral_earnings;
DROP POLICY IF EXISTS "System can create earnings" ON public.referral_earnings;
DROP POLICY IF EXISTS "Users can update their own earnings" ON public.referral_earnings;

-- RLS policies for referral_earnings
CREATE POLICY "Users can view their own earnings" ON public.referral_earnings
  FOR SELECT USING (auth.uid() = referrer_id);

CREATE POLICY "System can create earnings" ON public.referral_earnings
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update their own earnings" ON public.referral_earnings
  FOR UPDATE USING (auth.uid() = referrer_id);

-- Drop existing RLS policies for withdrawal_requests if they exist
DROP POLICY IF EXISTS "Users can manage their own withdrawals" ON public.withdrawal_requests;

-- RLS policies for withdrawal_requests
CREATE POLICY "Users can manage their own withdrawals" ON public.withdrawal_requests
  FOR ALL USING (auth.uid() = user_id);

-- Update existing RLS policies for invoices and expenses to allow salespeople
DROP POLICY IF EXISTS "Users can manage own invoices" ON public.invoices;
CREATE POLICY "Users can manage own invoices" ON public.invoices
  FOR ALL USING (
    auth.uid() = user_id OR 
    EXISTS (
      SELECT 1 FROM public.team_members tm 
      WHERE tm.salesperson_id = auth.uid() 
      AND tm.owner_id = user_id 
      AND tm.is_active = true
    )
  );

-- Restrict delete for salespeople on invoices
DROP POLICY IF EXISTS "Only owners can delete invoices" ON public.invoices;
CREATE POLICY "Only owners can delete invoices" ON public.invoices
  FOR DELETE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage own expenses" ON public.expenses;
CREATE POLICY "Users can manage own expenses" ON public.expenses
  FOR ALL USING (
    auth.uid() = user_id OR 
    EXISTS (
      SELECT 1 FROM public.team_members tm 
      WHERE tm.salesperson_id = auth.uid() 
      AND tm.owner_id = user_id 
      AND tm.is_active = true
    )
  );

-- Restrict delete for salespeople on expenses
DROP POLICY IF EXISTS "Only owners can delete expenses" ON public.expenses;
CREATE POLICY "Only owners can delete expenses" ON public.expenses
  FOR DELETE USING (auth.uid() = user_id);

-- Function to handle referral earnings when someone upgrades
CREATE OR REPLACE FUNCTION public.handle_referral_earnings()
RETURNS TRIGGER AS $$
DECLARE
  referrer_record RECORD;
  earning_amount DECIMAL(10,2);
BEGIN
  -- Check if this is an upgrade to a paid plan
  IF NEW.tier != 'Free' AND OLD.tier = 'Free' THEN
    -- Find the referrer
    SELECT u.* INTO referrer_record
    FROM public.users u
    INNER JOIN public.referrals r ON r.referrer_id = u.id
    WHERE r.referred_id = NEW.user_id;
    
    IF FOUND THEN
      -- Calculate earning based on upgrade amount
      CASE NEW.tier
        WHEN 'Weekly' THEN earning_amount := 140.00; -- 10% of ₦1,400
        WHEN 'Monthly' THEN earning_amount := 450.00; -- 10% of ₦4,500
        WHEN 'Yearly' THEN earning_amount := 5000.00; -- 10% of ₦50,000
        ELSE earning_amount := 0;
      END CASE;
      
      -- Insert earning record
      INSERT INTO public.referral_earnings (referrer_id, referred_id, amount)
      VALUES (referrer_record.id, NEW.user_id, earning_amount);
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for referral earnings
DROP TRIGGER IF EXISTS on_subscription_upgrade ON public.subscriptions;
CREATE TRIGGER on_subscription_upgrade
  AFTER UPDATE ON public.subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.handle_referral_earnings();

-- Function to check if user can delete (only owners)
CREATE OR REPLACE FUNCTION public.is_owner(user_id_param UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = user_id_param AND role = 'Owner'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update handle_new_user function to handle referral codes
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  ref_code TEXT;
  referrer_id UUID;
BEGIN
  -- Extract referral code from metadata
  ref_code := NEW.raw_user_meta_data->>'referral_code';
  
  -- Insert into public.users with automatic role assignment
  INSERT INTO public.users (id, email, phone, role, referral_code, business_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'phone', ''),
    'Owner', -- Default role for new signups
    generate_referral_code(),
    COALESCE(NEW.raw_user_meta_data->>'business_name', '')
  );
  
  -- Create initial Free subscription
  INSERT INTO public.subscriptions (user_id, tier, status)
  VALUES (NEW.id, 'Free', 'Active');
  
  -- Handle referral if code exists
  IF ref_code IS NOT NULL AND ref_code != '' THEN
    -- Find referrer by code
    SELECT id INTO referrer_id FROM public.users WHERE referral_code = ref_code;
    
    IF referrer_id IS NOT NULL THEN
      -- Create referral record
      INSERT INTO public.referrals (referrer_id, referred_id, referral_code)
      VALUES (referrer_id, NEW.id, ref_code);
    END IF;
  END IF;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error but don't block user creation
    RAISE WARNING 'Error in handle_new_user: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


