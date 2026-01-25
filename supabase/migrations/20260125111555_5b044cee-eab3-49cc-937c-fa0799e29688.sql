-- Create stores table
CREATE TABLE public.stores (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL DEFAULT 'メルカリ店舗1',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create inventory_items table
CREATE TABLE public.inventory_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  photo TEXT DEFAULT '',
  product_name TEXT NOT NULL DEFAULT '',
  color TEXT DEFAULT '',
  size TEXT DEFAULT '',
  quantity INTEGER NOT NULL DEFAULT 1,
  cost_price_cny NUMERIC NOT NULL DEFAULT 0,
  selling_price_jpy NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create order_items table
CREATE TABLE public.order_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  photo TEXT DEFAULT '',
  product_name TEXT NOT NULL DEFAULT '',
  color TEXT DEFAULT '',
  size TEXT DEFAULT '',
  cost_price_cny NUMERIC NOT NULL DEFAULT 0,
  converted_with_shipping NUMERIC NOT NULL DEFAULT 0,
  actual_payment NUMERIC NOT NULL DEFAULT 0,
  profit NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create settings table (global settings)
CREATE TABLE public.settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  exchange_rate NUMERIC NOT NULL DEFAULT 23,
  international_shipping NUMERIC NOT NULL DEFAULT 1000,
  domestic_shipping NUMERIC NOT NULL DEFAULT 1000,
  target_profit NUMERIC NOT NULL DEFAULT 6000,
  platform_fee_rate NUMERIC NOT NULL DEFAULT 0.22,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security (public access for now - no auth required)
ALTER TABLE public.stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

-- Create public read/write policies (for shared access without login)
CREATE POLICY "Allow public read on stores" ON public.stores FOR SELECT USING (true);
CREATE POLICY "Allow public insert on stores" ON public.stores FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on stores" ON public.stores FOR UPDATE USING (true);
CREATE POLICY "Allow public delete on stores" ON public.stores FOR DELETE USING (true);

CREATE POLICY "Allow public read on inventory_items" ON public.inventory_items FOR SELECT USING (true);
CREATE POLICY "Allow public insert on inventory_items" ON public.inventory_items FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on inventory_items" ON public.inventory_items FOR UPDATE USING (true);
CREATE POLICY "Allow public delete on inventory_items" ON public.inventory_items FOR DELETE USING (true);

CREATE POLICY "Allow public read on order_items" ON public.order_items FOR SELECT USING (true);
CREATE POLICY "Allow public insert on order_items" ON public.order_items FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on order_items" ON public.order_items FOR UPDATE USING (true);
CREATE POLICY "Allow public delete on order_items" ON public.order_items FOR DELETE USING (true);

CREATE POLICY "Allow public read on settings" ON public.settings FOR SELECT USING (true);
CREATE POLICY "Allow public insert on settings" ON public.settings FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on settings" ON public.settings FOR UPDATE USING (true);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create triggers for updated_at
CREATE TRIGGER update_stores_updated_at
  BEFORE UPDATE ON public.stores
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_inventory_items_updated_at
  BEFORE UPDATE ON public.inventory_items
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_settings_updated_at
  BEFORE UPDATE ON public.settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for all tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.stores;
ALTER PUBLICATION supabase_realtime ADD TABLE public.inventory_items;
ALTER PUBLICATION supabase_realtime ADD TABLE public.order_items;
ALTER PUBLICATION supabase_realtime ADD TABLE public.settings;

-- Insert default settings
INSERT INTO public.settings (exchange_rate, international_shipping, domestic_shipping, target_profit, platform_fee_rate)
VALUES (23, 1000, 1000, 6000, 0.22);