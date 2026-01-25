-- Create role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'owner', 'employee');

-- Create user_roles table
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (user_id, role)
);

-- Enable RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check roles (prevents infinite recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Create function to check if user has any role (is authorized)
CREATE OR REPLACE FUNCTION public.is_authorized(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
  )
$$;

-- RLS policies for user_roles table
-- Only admins can view all roles
CREATE POLICY "Admins can view all roles"
ON public.user_roles
FOR SELECT
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'owner'));

-- Only admins/owners can insert roles
CREATE POLICY "Admins can insert roles"
ON public.user_roles
FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'owner'));

-- Only admins/owners can delete roles
CREATE POLICY "Admins can delete roles"
ON public.user_roles
FOR DELETE
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'owner'));

-- Create authorized_emails table for pre-approved emails
CREATE TABLE public.authorized_emails (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT NOT NULL UNIQUE,
    role app_role NOT NULL DEFAULT 'employee',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_by UUID REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.authorized_emails ENABLE ROW LEVEL SECURITY;

-- RLS policies for authorized_emails
CREATE POLICY "Authorized users can view emails"
ON public.authorized_emails
FOR SELECT
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'owner'));

CREATE POLICY "Admins can insert emails"
ON public.authorized_emails
FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'owner'));

CREATE POLICY "Admins can delete emails"
ON public.authorized_emails
FOR DELETE
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'owner'));

-- Function to auto-assign role on signup if email is authorized
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  authorized_role app_role;
BEGIN
  -- Check if email is pre-authorized
  SELECT role INTO authorized_role
  FROM public.authorized_emails
  WHERE email = NEW.email;
  
  -- If authorized, assign the role
  IF authorized_role IS NOT NULL THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, authorized_role);
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Update existing table policies to require authorization
-- Drop old permissive policies
DROP POLICY IF EXISTS "Allow public read on stores" ON public.stores;
DROP POLICY IF EXISTS "Allow public insert on stores" ON public.stores;
DROP POLICY IF EXISTS "Allow public update on stores" ON public.stores;
DROP POLICY IF EXISTS "Allow public delete on stores" ON public.stores;

DROP POLICY IF EXISTS "Allow public read on inventory_items" ON public.inventory_items;
DROP POLICY IF EXISTS "Allow public insert on inventory_items" ON public.inventory_items;
DROP POLICY IF EXISTS "Allow public update on inventory_items" ON public.inventory_items;
DROP POLICY IF EXISTS "Allow public delete on inventory_items" ON public.inventory_items;

DROP POLICY IF EXISTS "Allow public read on order_items" ON public.order_items;
DROP POLICY IF EXISTS "Allow public insert on order_items" ON public.order_items;
DROP POLICY IF EXISTS "Allow public update on order_items" ON public.order_items;
DROP POLICY IF EXISTS "Allow public delete on order_items" ON public.order_items;

DROP POLICY IF EXISTS "Allow public read on settings" ON public.settings;
DROP POLICY IF EXISTS "Allow public insert on settings" ON public.settings;
DROP POLICY IF EXISTS "Allow public update on settings" ON public.settings;

-- New policies requiring authorization
CREATE POLICY "Authorized users can read stores"
ON public.stores FOR SELECT
USING (public.is_authorized(auth.uid()));

CREATE POLICY "Authorized users can insert stores"
ON public.stores FOR INSERT
WITH CHECK (public.is_authorized(auth.uid()));

CREATE POLICY "Authorized users can update stores"
ON public.stores FOR UPDATE
USING (public.is_authorized(auth.uid()));

CREATE POLICY "Authorized users can delete stores"
ON public.stores FOR DELETE
USING (public.is_authorized(auth.uid()));

CREATE POLICY "Authorized users can read inventory"
ON public.inventory_items FOR SELECT
USING (public.is_authorized(auth.uid()));

CREATE POLICY "Authorized users can insert inventory"
ON public.inventory_items FOR INSERT
WITH CHECK (public.is_authorized(auth.uid()));

CREATE POLICY "Authorized users can update inventory"
ON public.inventory_items FOR UPDATE
USING (public.is_authorized(auth.uid()));

CREATE POLICY "Authorized users can delete inventory"
ON public.inventory_items FOR DELETE
USING (public.is_authorized(auth.uid()));

CREATE POLICY "Authorized users can read orders"
ON public.order_items FOR SELECT
USING (public.is_authorized(auth.uid()));

CREATE POLICY "Authorized users can insert orders"
ON public.order_items FOR INSERT
WITH CHECK (public.is_authorized(auth.uid()));

CREATE POLICY "Authorized users can update orders"
ON public.order_items FOR UPDATE
USING (public.is_authorized(auth.uid()));

CREATE POLICY "Authorized users can delete orders"
ON public.order_items FOR DELETE
USING (public.is_authorized(auth.uid()));

CREATE POLICY "Authorized users can read settings"
ON public.settings FOR SELECT
USING (public.is_authorized(auth.uid()));

CREATE POLICY "Authorized users can insert settings"
ON public.settings FOR INSERT
WITH CHECK (public.is_authorized(auth.uid()));

CREATE POLICY "Authorized users can update settings"
ON public.settings FOR UPDATE
USING (public.is_authorized(auth.uid()));