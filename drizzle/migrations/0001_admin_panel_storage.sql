DROP TRIGGER IF EXISTS on_auth_user_created_first_admin ON auth.users;
COMMENT ON FUNCTION public.grant_first_admin() IS 'DEPRECATED: admins are now granted explicitly in user_roles';
ALTER TABLE public.property_images ADD COLUMN IF NOT EXISTS storage_path text;

CREATE POLICY "Admins upload property photos" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'property-photos' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins update property photos" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'property-photos' AND public.has_role(auth.uid(), 'admin'))
  WITH CHECK (bucket_id = 'property-photos' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins delete property photos" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'property-photos' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins list property photos" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'property-photos' AND public.has_role(auth.uid(), 'admin'));