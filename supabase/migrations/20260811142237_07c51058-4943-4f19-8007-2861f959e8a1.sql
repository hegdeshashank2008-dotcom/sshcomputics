-- Material taxonomy
CREATE TABLE public.material_sections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category text NOT NULL,
  name text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.material_sections TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.material_sections TO authenticated;
GRANT ALL ON public.material_sections TO service_role;
ALTER TABLE public.material_sections ENABLE ROW LEVEL SECURITY;
CREATE POLICY sections_public_read ON public.material_sections FOR SELECT USING (true);
CREATE POLICY sections_admin_write ON public.material_sections FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE TABLE public.material_subjects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  section_id uuid NOT NULL REFERENCES public.material_sections(id) ON DELETE CASCADE,
  name text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.material_subjects TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.material_subjects TO authenticated;
GRANT ALL ON public.material_subjects TO service_role;
ALTER TABLE public.material_subjects ENABLE ROW LEVEL SECURITY;
CREATE POLICY subjects_public_read ON public.material_subjects FOR SELECT USING (true);
CREATE POLICY subjects_admin_write ON public.material_subjects FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));

ALTER TABLE public.study_materials
  ADD COLUMN section_id uuid REFERENCES public.material_sections(id) ON DELETE SET NULL,
  ADD COLUMN subject_id uuid REFERENCES public.material_subjects(id) ON DELETE SET NULL,
  ADD COLUMN updated_at timestamptz NOT NULL DEFAULT now();

-- Colleges: approval + last update
ALTER TABLE public.colleges
  ADD COLUMN updated_at timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN approved boolean NOT NULL DEFAULT true,
  ADD COLUMN submitted_by uuid REFERENCES auth.users(id) ON DELETE SET NULL;

DROP POLICY IF EXISTS colleges_public_read ON public.colleges;
CREATE POLICY colleges_public_read ON public.colleges FOR SELECT USING (approved = true);
CREATE POLICY colleges_owner_read ON public.colleges FOR SELECT TO authenticated
  USING (submitted_by = auth.uid() OR has_role(auth.uid(), 'admin'));
CREATE POLICY colleges_user_submit ON public.colleges FOR INSERT TO authenticated
  WITH CHECK (submitted_by = auth.uid() AND approved = false);

-- Hostel & PG reviews
CREATE TABLE public.stay_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  stay_type text NOT NULL DEFAULT 'hostel',
  name text NOT NULL,
  state text NOT NULL,
  district text NOT NULL,
  city text NOT NULL,
  address text,
  rent_monthly numeric,
  rating integer NOT NULL DEFAULT 5,
  author_name text NOT NULL DEFAULT 'Student',
  comment text,
  approved boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.stay_reviews TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.stay_reviews TO authenticated;
GRANT ALL ON public.stay_reviews TO service_role;
ALTER TABLE public.stay_reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY stay_public_read ON public.stay_reviews FOR SELECT USING (approved = true);
CREATE POLICY stay_owner_read ON public.stay_reviews FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR has_role(auth.uid(), 'admin'));
CREATE POLICY stay_insert_own ON public.stay_reviews FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());
CREATE POLICY stay_update ON public.stay_reviews FOR UPDATE TO authenticated
  USING (user_id = auth.uid() OR has_role(auth.uid(), 'admin'))
  WITH CHECK (user_id = auth.uid() OR has_role(auth.uid(), 'admin'));
CREATE POLICY stay_delete ON public.stay_reviews FOR DELETE TO authenticated
  USING (user_id = auth.uid() OR has_role(auth.uid(), 'admin'));

-- Admin-only settings (quiz generator config)
CREATE TABLE public.app_settings (
  key text PRIMARY KEY,
  value jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.app_settings TO authenticated;
GRANT ALL ON public.app_settings TO service_role;
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY settings_admin_all ON public.app_settings FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TRIGGER colleges_touch BEFORE UPDATE ON public.colleges
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER materials_touch BEFORE UPDATE ON public.study_materials
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER stay_touch BEFORE UPDATE ON public.stay_reviews
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER settings_touch BEFORE UPDATE ON public.app_settings
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Seed default sections
INSERT INTO public.material_sections (category, name, sort_order)
SELECT 'school', 'Class ' || g, g FROM generate_series(1, 12) AS g;
INSERT INTO public.material_sections (category, name, sort_order) VALUES
  ('coding', 'Python', 1), ('coding', 'C', 2), ('coding', 'C++', 3), ('coding', 'Java', 4),
  ('coding', 'JavaScript', 5), ('coding', 'HTML & CSS', 6), ('coding', 'SQL', 7),
  ('coding', 'Data Structures & Algorithms', 8),
  ('engineering', 'Computer Science & Engineering', 1), ('engineering', 'Information Science', 2),
  ('engineering', 'Electronics & Communication', 3), ('engineering', 'Electrical & Electronics', 4),
  ('engineering', 'Mechanical Engineering', 5), ('engineering', 'Civil Engineering', 6),
  ('engineering', 'Artificial Intelligence & Data Science', 7);
