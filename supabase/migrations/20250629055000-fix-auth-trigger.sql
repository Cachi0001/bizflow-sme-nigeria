
-- Drop existing trigger and function to recreate them properly
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();
DROP FUNCTION IF EXISTS public.generate_referral_code();

-- Recreate the referral code generation function
CREATE OR REPLACE FUNCTION public.generate_referral_code()
RETURNS text
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN upper(substring(md5(random()::text) from 1 for 8));
END;
$$;

-- Make phone column nullable in users table since it's causing issues
ALTER TABLE public.users ALTER COLUMN phone DROP NOT NULL;

-- Recreate the handle_new_user function with better error handling
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Insert into public.users with automatic role assignment
  INSERT INTO public.users (id, email, phone, role, referral_code, business_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'phone', ''),
    'Owner',
    generate_referral_code(),
    COALESCE(NEW.raw_user_meta_data->>'business_name', '')
  )
  ON CONFLICT (id) DO NOTHING;
  
  -- Create initial Free subscription
  INSERT INTO public.subscriptions (user_id, tier, status)
  VALUES (NEW.id, 'Free', 'Active')
  ON CONFLICT DO NOTHING;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error but don't block user creation
    RAISE WARNING 'Error in handle_new_user: %', SQLERRM;
    RETURN NEW;
END;
$$;

-- Recreate the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Ensure RLS policies exist
DO $$
BEGIN
  -- Users table policies
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'users' AND policyname = 'Users can view own profile') THEN
    CREATE POLICY "Users can view own profile" ON public.users
      FOR SELECT USING (auth.uid() = id);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'users' AND policyname = 'Users can update own profile') THEN
    CREATE POLICY "Users can update own profile" ON public.users
      FOR UPDATE USING (auth.uid() = id);
  END IF;

  -- Subscriptions table policies
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'subscriptions' AND policyname = 'Users can view own subscriptions') THEN
    CREATE POLICY "Users can view own subscriptions" ON public.subscriptions
      FOR SELECT USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'subscriptions' AND policyname = 'Users can manage own subscriptions') THEN
    CREATE POLICY "Users can manage own subscriptions" ON public.subscriptions
      FOR ALL USING (auth.uid() = user_id);
  END IF;

  -- Invoices table policies
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'invoices' AND policyname = 'Users can manage own invoices') THEN
    CREATE POLICY "Users can manage own invoices" ON public.invoices
      FOR ALL USING (auth.uid() = user_id);
  END IF;

  -- Expenses table policies
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'expenses' AND policyname = 'Users can manage own expenses') THEN
    CREATE POLICY "Users can manage own expenses" ON public.expenses
      FOR ALL USING (auth.uid() = user_id);
  END IF;

  -- Clients table policies
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'clients' AND policyname = 'Users can manage own clients') THEN
    CREATE POLICY "Users can manage own clients" ON public.clients
      FOR ALL USING (auth.uid() = user_id);
  END IF;

  -- Payments table policies
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'payments' AND policyname = 'Users can manage own payments') THEN
    CREATE POLICY "Users can manage own payments" ON public.payments
      FOR ALL USING (auth.uid() = user_id);
  END IF;

  -- Referrals table policies
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'referrals' AND policyname = 'Users can view own referrals') THEN
    CREATE POLICY "Users can view own referrals" ON public.referrals
      FOR SELECT USING (auth.uid() = referrer_id OR auth.uid() = referred_id);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'referrals' AND policyname = 'Users can create referrals') THEN
    CREATE POLICY "Users can create referrals" ON public.referrals
      FOR INSERT WITH CHECK (auth.uid() = referrer_id);
  END IF;
END
$$;

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;
