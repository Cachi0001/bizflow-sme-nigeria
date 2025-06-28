
-- Create payments table for automated and manual payment recording
CREATE TABLE public.payments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  description TEXT,
  customer_name TEXT,
  amount DECIMAL(10,2) NOT NULL,
  transaction_id TEXT,
  payment_method TEXT CHECK (payment_method IN ('Cash', 'Bank Transfer', 'Credit', 'POS')) NOT NULL,
  auto_recorded BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID,
  updated_by UUID,
  deleted_at TIMESTAMP WITH TIME ZONE
);

-- Enable Row Level Security
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- Create RLS policy for payments
CREATE POLICY "Users can manage own payments" ON public.payments
  FOR ALL USING (auth.uid() = user_id);

-- Add index for transaction_id lookups
CREATE INDEX idx_payments_transaction_id ON public.payments(transaction_id) WHERE transaction_id IS NOT NULL;

-- Update expenses table to include inventory purchase category
-- (This will add the category if it doesn't exist in existing records)
