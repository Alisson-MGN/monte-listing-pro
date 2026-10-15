CREATE TYPE public.app_role AS ENUM ('admin');
CREATE TYPE public.property_type AS ENUM ('casa','apartamento','terreno','comercial','rural');
CREATE TYPE public.transaction_type AS ENUM ('venda','aluguel');
CREATE TYPE public.property_status AS ENUM ('draft','published','sold','rented');

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE POLICY "Users read own roles" ON public.user_roles FOR SELECT TO authenticated USING (user_id = auth.uid());

-- The first account ever created becomes the administrator; later accounts get no role.
CREATE OR REPLACE FUNCTION public.grant_first_admin()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.user_roles WHERE role = 'admin') THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin');
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER on_auth_user_created_first_admin AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.grant_first_admin();

CREATE TABLE public.properties (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  property_type public.property_type NOT NULL,
  transaction_type public.transaction_type NOT NULL,
  price numeric(14,2) NOT NULL DEFAULT 0 CHECK (price >= 0),
  condominium_fee numeric(12,2) CHECK (condominium_fee >= 0),
  iptu numeric(12,2) CHECK (iptu >= 0),
  bedrooms integer NOT NULL DEFAULT 0 CHECK (bedrooms >= 0),
  bathrooms integer NOT NULL DEFAULT 0 CHECK (bathrooms >= 0),
  parking_spaces integer NOT NULL DEFAULT 0 CHECK (parking_spaces >= 0),
  area_m2 numeric(12,2) CHECK (area_m2 >= 0),
  address text,
  show_address boolean NOT NULL DEFAULT false,
  public_address text GENERATED ALWAYS AS (CASE WHEN show_address THEN address END) STORED,
  neighborhood text NOT NULL DEFAULT '',
  city text NOT NULL DEFAULT 'Monte Santo de Minas',
  state text NOT NULL DEFAULT 'MG',
  cover_image text,
  status public.property_status NOT NULL DEFAULT 'draft',
  featured boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX properties_status_idx ON public.properties (status, featured DESC, created_at DESC);
-- Visitors never receive the private address column; they get public_address instead.
GRANT SELECT (id,title,description,property_type,transaction_type,price,condominium_fee,iptu,bedrooms,bathrooms,parking_spaces,area_m2,show_address,public_address,neighborhood,city,state,cover_image,status,featured,created_at,updated_at) ON public.properties TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.properties TO authenticated;
GRANT ALL ON public.properties TO service_role;
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public reads published properties" ON public.properties FOR SELECT TO anon, authenticated USING (status = 'published');
CREATE POLICY "Admins read all properties" ON public.properties FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins insert properties" ON public.properties FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins update properties" ON public.properties FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins delete properties" ON public.properties FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END $$;
CREATE TRIGGER properties_set_updated_at BEFORE UPDATE ON public.properties
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.property_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  url text NOT NULL,
  position integer NOT NULL DEFAULT 0 CHECK (position >= 0),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX property_images_order_idx ON public.property_images (property_id, position);
GRANT SELECT ON public.property_images TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.property_images TO authenticated;
GRANT ALL ON public.property_images TO service_role;
ALTER TABLE public.property_images ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public reads images of published properties" ON public.property_images FOR SELECT TO anon, authenticated
  USING (EXISTS (SELECT 1 FROM public.properties p WHERE p.id = property_id AND p.status = 'published'));
CREATE POLICY "Admins read all images" ON public.property_images FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins insert images" ON public.property_images FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins update images" ON public.property_images FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins delete images" ON public.property_images FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));