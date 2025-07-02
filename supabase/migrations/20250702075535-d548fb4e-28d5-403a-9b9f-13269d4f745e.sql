-- Fix phone number uniqueness constraint issue
-- Remove the unique constraint on phone since multiple users might have same/empty phone
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_phone_key;

-- Make phone nullable to handle cases where users don't provide phone numbers
ALTER TABLE public.users ALTER COLUMN phone DROP NOT NULL;

-- Update any existing records with empty phones to NULL
UPDATE public.users SET phone = NULL WHERE phone = '' OR phone IS NULL;