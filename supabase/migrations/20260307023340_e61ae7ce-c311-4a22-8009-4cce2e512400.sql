
-- 1. User roles table (separate from profiles as per security guidelines)
CREATE TABLE IF NOT EXISTS public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  role text NOT NULL DEFAULT 'user',
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function for role checking
CREATE OR REPLACE FUNCTION public.has_admin_role(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = 'admin'
  )
$$;

-- RLS: admins can see all, users see own
CREATE POLICY "Admins can view all roles" ON public.user_roles
  FOR SELECT USING (public.has_admin_role(auth.uid()) OR auth.uid() = user_id);

CREATE POLICY "Only admins can manage roles" ON public.user_roles
  FOR ALL USING (public.has_admin_role(auth.uid()));

-- 2. Subscription plans table
CREATE TABLE IF NOT EXISTS public.subscription_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  description text,
  price_monthly numeric NOT NULL DEFAULT 0,
  price_yearly numeric NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'MXN',
  features jsonb DEFAULT '[]'::jsonb,
  max_events integer DEFAULT 3,
  max_applications integer DEFAULT 5,
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Plans viewable by everyone" ON public.subscription_plans FOR SELECT USING (true);
CREATE POLICY "Only admins can manage plans" ON public.subscription_plans FOR ALL USING (public.has_admin_role(auth.uid()));

-- 3. User subscriptions
CREATE TABLE IF NOT EXISTS public.user_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  plan_id uuid NOT NULL REFERENCES public.subscription_plans(id),
  status text NOT NULL DEFAULT 'trial',  -- trial, active, expired, cancelled
  trial_ends_at timestamptz,
  current_period_start timestamptz,
  current_period_end timestamptz,
  payment_provider text DEFAULT 'openpay',
  payment_reference text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);
ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users see own subscription" ON public.user_subscriptions FOR SELECT USING (auth.uid() = user_id OR public.has_admin_role(auth.uid()));
CREATE POLICY "Admins manage all subscriptions" ON public.user_subscriptions FOR ALL USING (public.has_admin_role(auth.uid()));
CREATE POLICY "Users can create own subscription" ON public.user_subscriptions FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 4. Payment transactions (for OpenPay integration)
CREATE TABLE IF NOT EXISTS public.payment_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  subscription_id uuid REFERENCES public.user_subscriptions(id),
  amount numeric NOT NULL,
  currency text NOT NULL DEFAULT 'MXN',
  status text NOT NULL DEFAULT 'pending',  -- pending, completed, failed, refunded
  provider text NOT NULL DEFAULT 'openpay',
  provider_reference text,
  description text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.payment_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users see own transactions" ON public.payment_transactions FOR SELECT USING (auth.uid() = user_id OR public.has_admin_role(auth.uid()));
CREATE POLICY "Admins manage transactions" ON public.payment_transactions FOR ALL USING (public.has_admin_role(auth.uid()));

-- 5. Platform settings (admin-configurable)
CREATE TABLE IF NOT EXISTS public.platform_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text NOT NULL UNIQUE,
  value jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Settings viewable by authenticated" ON public.platform_settings FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Only admins can manage settings" ON public.platform_settings FOR ALL USING (public.has_admin_role(auth.uid()));

-- 6. Insert default subscription plans
INSERT INTO public.subscription_plans (name, slug, description, price_monthly, price_yearly, features, max_events, max_applications, sort_order) VALUES
  ('Prueba Gratuita', 'free_trial', 'Explora la plataforma por 14 días', 0, 0, '["3 eventos", "5 aplicaciones por mes", "Mensajería básica", "Perfil básico"]'::jsonb, 3, 5, 0),
  ('Básico', 'basic', 'Ideal para empezar', 299, 2990, '["10 eventos", "20 aplicaciones por mes", "Mensajería ilimitada", "Perfil completo", "Soporte por email"]'::jsonb, 10, 20, 1),
  ('Pro', 'pro', 'Para profesionales', 599, 5990, '["Eventos ilimitados", "Aplicaciones ilimitadas", "Mensajería ilimitada", "Perfil destacado", "Analytics", "Soporte prioritario"]'::jsonb, -1, -1, 2),
  ('Enterprise', 'enterprise', 'Para organizaciones grandes', 1499, 14990, '["Todo en Pro", "API access", "White-label", "Manager dedicado", "Facturación personalizada"]'::jsonb, -1, -1, 3);

-- 7. Insert default platform settings
INSERT INTO public.platform_settings (key, value) VALUES
  ('trial_duration_days', '14'::jsonb),
  ('platform_commission', '10'::jsonb),
  ('openpay_enabled', 'false'::jsonb),
  ('maintenance_mode', 'false'::jsonb)
ON CONFLICT (key) DO NOTHING;

-- 8. Update handle_new_user trigger to create subscription
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  free_plan_id uuid;
BEGIN
  -- Create profile
  INSERT INTO public.profiles (user_id, display_name, avatar_url, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.email),
    'https://api.dicebear.com/7.x/avataaars/svg?seed=' || LEFT(NEW.id::text, 8),
    COALESCE((NEW.raw_user_meta_data->>'role')::app_role, 'user')
  );

  -- Auto-assign free trial
  SELECT id INTO free_plan_id FROM public.subscription_plans WHERE slug = 'free_trial' LIMIT 1;
  IF free_plan_id IS NOT NULL THEN
    INSERT INTO public.user_subscriptions (user_id, plan_id, status, trial_ends_at)
    VALUES (NEW.id, free_plan_id, 'trial', now() + interval '14 days');
  END IF;

  RETURN NEW;
END;
$$;
