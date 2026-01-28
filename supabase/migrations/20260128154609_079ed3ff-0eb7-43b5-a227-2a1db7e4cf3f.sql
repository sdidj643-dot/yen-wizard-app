-- Update RLS policies to allow public access

-- Stores
DROP POLICY IF EXISTS "Authorized users can read stores" ON public.stores;
DROP POLICY IF EXISTS "Authorized users can insert stores" ON public.stores;
DROP POLICY IF EXISTS "Authorized users can update stores" ON public.stores;
DROP POLICY IF EXISTS "Authorized users can delete stores" ON public.stores;

CREATE POLICY "Public can read stores" ON public.stores FOR SELECT USING (true);
CREATE POLICY "Public can insert stores" ON public.stores FOR INSERT WITH CHECK (true);
CREATE POLICY "Public can update stores" ON public.stores FOR UPDATE USING (true);
CREATE POLICY "Public can delete stores" ON public.stores FOR DELETE USING (true);

-- Inventory items
DROP POLICY IF EXISTS "Authorized users can read inventory" ON public.inventory_items;
DROP POLICY IF EXISTS "Authorized users can insert inventory" ON public.inventory_items;
DROP POLICY IF EXISTS "Authorized users can update inventory" ON public.inventory_items;
DROP POLICY IF EXISTS "Authorized users can delete inventory" ON public.inventory_items;

CREATE POLICY "Public can read inventory" ON public.inventory_items FOR SELECT USING (true);
CREATE POLICY "Public can insert inventory" ON public.inventory_items FOR INSERT WITH CHECK (true);
CREATE POLICY "Public can update inventory" ON public.inventory_items FOR UPDATE USING (true);
CREATE POLICY "Public can delete inventory" ON public.inventory_items FOR DELETE USING (true);

-- Order items
DROP POLICY IF EXISTS "Authorized users can read orders" ON public.order_items;
DROP POLICY IF EXISTS "Authorized users can insert orders" ON public.order_items;
DROP POLICY IF EXISTS "Authorized users can update orders" ON public.order_items;
DROP POLICY IF EXISTS "Authorized users can delete orders" ON public.order_items;

CREATE POLICY "Public can read orders" ON public.order_items FOR SELECT USING (true);
CREATE POLICY "Public can insert orders" ON public.order_items FOR INSERT WITH CHECK (true);
CREATE POLICY "Public can update orders" ON public.order_items FOR UPDATE USING (true);
CREATE POLICY "Public can delete orders" ON public.order_items FOR DELETE USING (true);

-- Settings
DROP POLICY IF EXISTS "Authorized users can read settings" ON public.settings;
DROP POLICY IF EXISTS "Authorized users can insert settings" ON public.settings;
DROP POLICY IF EXISTS "Authorized users can update settings" ON public.settings;

CREATE POLICY "Public can read settings" ON public.settings FOR SELECT USING (true);
CREATE POLICY "Public can insert settings" ON public.settings FOR INSERT WITH CHECK (true);
CREATE POLICY "Public can update settings" ON public.settings FOR UPDATE USING (true);