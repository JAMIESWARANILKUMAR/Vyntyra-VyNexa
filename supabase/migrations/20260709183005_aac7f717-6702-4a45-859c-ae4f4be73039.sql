
CREATE OR REPLACE FUNCTION public.tg_auto_grant_admin()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NEW.email = 'hr@vyntyraconsultancyservices.in' THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
  RETURN NEW;
END; $$;

REVOKE EXECUTE ON FUNCTION public.tg_auto_grant_admin() FROM PUBLIC, anon, authenticated;

CREATE TRIGGER auto_grant_admin_on_signup
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.tg_auto_grant_admin();
