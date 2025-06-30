-- Add trial system columns to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS trial_end_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS is_trial BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS referral_code VARCHAR(20) UNIQUE;

-- Create index for referral code lookups
CREATE INDEX IF NOT EXISTS idx_users_referral_code ON users(referral_code);

-- Create index for trial end date
CREATE INDEX IF NOT EXISTS idx_users_trial_end_date ON users(trial_end_date);

-- Update existing users to have referral codes if they don't have them
UPDATE users 
SET referral_code = CONCAT(
  UPPER(SUBSTRING(COALESCE(business_name, 'USER'), 1, 3)),
  UPPER(SUBSTRING(MD5(RANDOM()::text), 1, 6))
)
WHERE referral_code IS NULL;

-- Create function to check if user's trial has expired
CREATE OR REPLACE FUNCTION is_trial_expired(user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  user_trial_end TIMESTAMP WITH TIME ZONE;
  user_is_trial BOOLEAN;
BEGIN
  SELECT trial_end_date, is_trial 
  INTO user_trial_end, user_is_trial
  FROM users 
  WHERE id = user_id;
  
  -- If not on trial, return false
  IF NOT user_is_trial THEN
    RETURN false;
  END IF;
  
  -- If trial end date is null, consider it expired
  IF user_trial_end IS NULL THEN
    RETURN true;
  END IF;
  
  -- Check if current time is past trial end date
  RETURN NOW() > user_trial_end;
END;
$$ LANGUAGE plpgsql;

-- Create function to get effective subscription tier (considering trial)
CREATE OR REPLACE FUNCTION get_effective_subscription_tier(user_id UUID)
RETURNS TEXT AS $$
DECLARE
  user_tier TEXT;
  user_is_trial BOOLEAN;
  trial_expired BOOLEAN;
BEGIN
  SELECT subscription_tier, is_trial 
  INTO user_tier, user_is_trial
  FROM users 
  WHERE id = user_id;
  
  -- If not on trial, return actual tier
  IF NOT user_is_trial THEN
    RETURN user_tier;
  END IF;
  
  -- Check if trial has expired
  SELECT is_trial_expired(user_id) INTO trial_expired;
  
  -- If trial expired, return 'Free'
  IF trial_expired THEN
    RETURN 'Free';
  END IF;
  
  -- If trial is active, return the trial tier
  RETURN user_tier;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically end trial when it expires
CREATE OR REPLACE FUNCTION auto_end_expired_trials()
RETURNS TRIGGER AS $$
BEGIN
  -- Update users whose trials have expired
  UPDATE users 
  SET 
    is_trial = false,
    subscription_tier = 'Free',
    updated_at = NOW()
  WHERE 
    is_trial = true 
    AND trial_end_date IS NOT NULL 
    AND NOW() > trial_end_date;
    
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create a scheduled job to run the trial expiration check
-- Note: This would typically be handled by a cron job or scheduled function
-- For now, we'll rely on the function being called when needed

