-- 1. Role helper: switch from SECURITY DEFINER to SECURITY INVOKER
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path TO 'public'
AS $function$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$function$;

-- 2. Profiles: owner (or admin) reads only
DROP POLICY IF EXISTS profiles_select_auth ON public.profiles;
CREATE POLICY profiles_select_own ON public.profiles
  FOR SELECT TO authenticated
  USING (auth.uid() = id OR public.has_role(auth.uid(), 'admin'::app_role));

-- 3. Hide reviewer account ids from anonymous readers (column-level grants)
REVOKE SELECT ON public.college_feedback FROM anon;
GRANT SELECT (id, college_id, author_name, rating, comment, created_at)
  ON public.college_feedback TO anon;

REVOKE SELECT ON public.stay_reviews FROM anon;
GRANT SELECT (id, stay_type, name, state, district, city, address, rent_monthly, rating, author_name, comment, approved, created_at, updated_at)
  ON public.stay_reviews TO anon;