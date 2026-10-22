REVOKE ALL ON public.properties FROM anon;
GRANT SELECT (id,title,description,property_type,transaction_type,price,condominium_fee,iptu,bedrooms,bathrooms,parking_spaces,area_m2,show_address,public_address,neighborhood,city,state,cover_image,status,featured,created_at,updated_at) ON public.properties TO anon;
REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON public.property_images FROM anon;
REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON public.user_roles FROM anon;
REVOKE ALL ON public.user_roles FROM anon;