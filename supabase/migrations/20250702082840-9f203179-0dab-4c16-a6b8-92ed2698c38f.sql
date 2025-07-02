-- Create products table for inventory management
CREATE TABLE public.products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  sku TEXT,
  category TEXT,
  price DECIMAL(10,2) NOT NULL DEFAULT 0,
  cost_price DECIMAL(10,2) DEFAULT 0,
  stock_quantity INTEGER NOT NULL DEFAULT 0,
  low_stock_threshold INTEGER DEFAULT 10,
  image_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id),
  deleted_at TIMESTAMP WITH TIME ZONE
);

-- Create product categories table
CREATE TABLE public.product_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create stock movements table for tracking inventory changes
CREATE TABLE public.stock_movements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  movement_type TEXT NOT NULL CHECK (movement_type IN ('sale', 'purchase', 'adjustment', 'return')),
  quantity INTEGER NOT NULL,
  unit_price DECIMAL(10,2),
  total_amount DECIMAL(10,2),
  reference_id UUID, -- Could reference invoice_id, expense_id, etc.
  reference_type TEXT, -- 'invoice', 'expense', 'manual', etc.
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- Create invoice items table to link invoices with products
CREATE TABLE public.invoice_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  invoice_id UUID NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  product_name TEXT NOT NULL, -- Store name for historical purposes
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price DECIMAL(10,2) NOT NULL,
  total_price DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoice_items ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for products
CREATE POLICY "Users can manage own products" ON public.products
  FOR ALL USING (auth.uid() = user_id);

-- Create RLS policies for product categories
CREATE POLICY "Users can manage own categories" ON public.product_categories
  FOR ALL USING (auth.uid() = user_id);

-- Create RLS policies for stock movements
CREATE POLICY "Users can view own stock movements" ON public.stock_movements
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can create stock movements" ON public.stock_movements
  FOR INSERT WITH CHECK (true);

-- Create RLS policies for invoice items
CREATE POLICY "Users can manage own invoice items" ON public.invoice_items
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.invoices 
      WHERE invoices.id = invoice_items.invoice_id 
      AND invoices.user_id = auth.uid()
    )
  );

-- Create indexes for better performance
CREATE INDEX idx_products_user_id ON public.products(user_id);
CREATE INDEX idx_products_sku ON public.products(sku);
CREATE INDEX idx_products_category ON public.products(category);
CREATE INDEX idx_products_stock_quantity ON public.products(stock_quantity);
CREATE INDEX idx_stock_movements_product_id ON public.stock_movements(product_id);
CREATE INDEX idx_stock_movements_user_id ON public.stock_movements(user_id);
CREATE INDEX idx_invoice_items_invoice_id ON public.invoice_items(invoice_id);
CREATE INDEX idx_invoice_items_product_id ON public.invoice_items(product_id);

-- Create function to update product updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_products_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW
  EXECUTE FUNCTION public.update_products_updated_at();

-- Create function to automatically update stock on invoice creation
CREATE OR REPLACE FUNCTION public.handle_stock_movement_on_invoice()
RETURNS TRIGGER AS $$
BEGIN
  -- Update product stock quantity
  UPDATE public.products 
  SET stock_quantity = stock_quantity - NEW.quantity,
      updated_at = now()
  WHERE id = NEW.product_id AND NEW.product_id IS NOT NULL;
  
  -- Create stock movement record if product exists
  IF NEW.product_id IS NOT NULL THEN
    INSERT INTO public.stock_movements (
      product_id, 
      user_id, 
      movement_type, 
      quantity, 
      unit_price, 
      total_amount,
      reference_id,
      reference_type,
      notes,
      created_by
    )
    SELECT 
      NEW.product_id,
      i.user_id,
      'sale',
      -NEW.quantity, -- Negative because it's a sale (stock reduction)
      NEW.unit_price,
      NEW.total_price,
      NEW.invoice_id,
      'invoice',
      'Stock deducted for invoice sale',
      i.user_id
    FROM public.invoices i 
    WHERE i.id = NEW.invoice_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for automatic stock deduction on invoice item creation
CREATE TRIGGER handle_stock_movement_on_invoice_items
  AFTER INSERT ON public.invoice_items
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_stock_movement_on_invoice();

-- Create function to get low stock products
CREATE OR REPLACE FUNCTION public.get_low_stock_products(user_id_param UUID)
RETURNS TABLE (
  id UUID,
  name TEXT,
  sku TEXT,
  stock_quantity INTEGER,
  low_stock_threshold INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.name,
    p.sku,
    p.stock_quantity,
    p.low_stock_threshold
  FROM public.products p
  WHERE p.user_id = user_id_param 
    AND p.is_active = true
    AND p.stock_quantity <= p.low_stock_threshold;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;