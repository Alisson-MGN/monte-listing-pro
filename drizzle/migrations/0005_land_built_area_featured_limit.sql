ALTER TABLE public.properties ADD COLUMN land_area_m2 numeric, ADD COLUMN built_area_m2 numeric;
UPDATE public.properties SET built_area_m2 = area_m2 WHERE area_m2 IS NOT NULL;
COMMENT ON COLUMN public.properties.area_m2 IS 'DEPRECATED: replaced by land_area_m2 and built_area_m2';
GRANT SELECT (land_area_m2, built_area_m2) ON public.properties TO anon, authenticated;
GRANT INSERT (land_area_m2, built_area_m2), UPDATE (land_area_m2, built_area_m2) ON public.properties TO authenticated;
GRANT ALL ON public.properties TO service_role;

CREATE OR REPLACE FUNCTION public.limit_featured_properties()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.featured AND (TG_OP = 'INSERT' OR NOT OLD.featured) THEN
    IF (SELECT count(*) FROM public.properties WHERE featured AND id <> NEW.id) >= 10 THEN
      RAISE EXCEPTION 'FEATURED_LIMIT' USING HINT = 'Máximo de 10 imóveis em destaque.';
    END IF;
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER properties_featured_limit BEFORE INSERT OR UPDATE OF featured ON public.properties
FOR EACH ROW EXECUTE FUNCTION public.limit_featured_properties();