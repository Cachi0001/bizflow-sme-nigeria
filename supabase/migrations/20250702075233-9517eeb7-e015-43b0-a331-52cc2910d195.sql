
-- First, let's check what values are allowed for subscription_tier and fix the constraint
-- Drop the existing constraint if it exists
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_subscription_tier_check;

-- Add a new constraint that allows the correct subscription tier values
ALTER TABLE public.users ADD CONSTRAINT users_subscription_tier_check 
CHECK (subscription_tier IN ('Free', 'Weekly', 'Monthly', 'Yearly'));

-- Also make sure we have the correct default value
ALTER TABLE public.users ALTER COLUMN subscription_tier SET DEFAULT 'Free';

-- Update any existing users that might have invalid subscription_tier values
UPDATE public.users 
SET subscription_tier = 'Free' 
WHERE subscription_tier NOT IN ('Free', 'Weekly', 'Monthly', 'Yearly') OR subscription_tier IS NULL;
