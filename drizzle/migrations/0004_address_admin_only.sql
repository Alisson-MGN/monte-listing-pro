REVOKE SELECT ON public.properties FROM authenticated;
GRANT SELECT (id,title,description,property_type,transaction_type,price,condominium_fee,iptu,bedrooms,bathrooms,parking_spaces,area_m2,show_address,public_address,neighborhood,city,state,cover_image,status,featured,created_at,updated_at) ON public.properties TO authenticated;

-- Private address is only returned to administrators.
CREATE OR REPLACE FUNCTION public.admin_property_addresses()
RETURNS TABLE (id uuid, address text) LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT p.id, p.address FROM public.properties p WHERE public.has_role(auth.uid(), 'admin')
$$;
REVOKE ALL ON FUNCTION public.admin_property_addresses() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_property_addresses() TO authenticated;