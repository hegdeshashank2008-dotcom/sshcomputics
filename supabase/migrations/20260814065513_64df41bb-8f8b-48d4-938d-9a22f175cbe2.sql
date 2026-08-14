CREATE TABLE public.animation_videos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  topic TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  storage_path TEXT,
  external_url TEXT,
  source TEXT NOT NULL DEFAULT 'admin',
  status TEXT NOT NULL DEFAULT 'completed',
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.animation_videos TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.animation_videos TO authenticated;
GRANT ALL ON public.animation_videos TO service_role;

ALTER TABLE public.animation_videos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "animation_public_read" ON public.animation_videos FOR SELECT USING (true);
CREATE POLICY "animation_admin_insert" ON public.animation_videos FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "animation_admin_update" ON public.animation_videos FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "animation_admin_delete" ON public.animation_videos FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_animation_videos_updated_at BEFORE UPDATE ON public.animation_videos
FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE POLICY "animations_read_auth" ON storage.objects FOR SELECT TO authenticated, anon USING (bucket_id = 'animations');
CREATE POLICY "animations_admin_write" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'animations' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "animations_admin_delete" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'animations' AND public.has_role(auth.uid(), 'admin'));