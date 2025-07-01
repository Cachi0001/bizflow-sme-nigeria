
-- Add missing trial-related columns to the users table
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS is_trial BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS trial_end_date TIMESTAMP WITH TIME ZONE DEFAULT NULL;

-- Update existing users to have trial status if they don't have it set
UPDATE public.users 
SET is_trial = true, 
    trial_end_date = (created_at + INTERVAL '7 days')
WHERE is_trial IS NULL AND created_at > (NOW() - INTERVAL '30 days');
