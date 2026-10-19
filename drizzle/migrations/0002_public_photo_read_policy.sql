CREATE POLICY "Public reads photos of published properties" ON storage.objects FOR SELECT TO anon, authenticated
  USING (bucket_id = 'property-photos' AND EXISTS (
    SELECT 1 FROM public.property_images pi JOIN public.properties p ON p.id = pi.property_id
    WHERE pi.storage_path = storage.objects.name AND p.status = 'published'));