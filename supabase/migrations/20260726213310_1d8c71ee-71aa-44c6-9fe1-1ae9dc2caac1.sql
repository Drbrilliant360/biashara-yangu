
CREATE SCHEMA IF NOT EXISTS private;
GRANT USAGE ON SCHEMA private TO authenticated, service_role;

ALTER FUNCTION public.has_role(uuid, public.app_role) SET SCHEMA private;
ALTER FUNCTION public.is_super_admin() SET SCHEMA private;
ALTER FUNCTION public.user_has_shop_access(uuid) SET SCHEMA private;
ALTER FUNCTION public.user_is_shop_staff(uuid) SET SCHEMA private;

REVOKE ALL ON FUNCTION private.has_role(uuid, public.app_role) FROM PUBLIC;
REVOKE ALL ON FUNCTION private.is_super_admin() FROM PUBLIC;
REVOKE ALL ON FUNCTION private.user_has_shop_access(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION private.user_is_shop_staff(uuid) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION private.has_role(uuid, public.app_role) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION private.is_super_admin() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION private.user_has_shop_access(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION private.user_is_shop_staff(uuid) TO authenticated, service_role;
