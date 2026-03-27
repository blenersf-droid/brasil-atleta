-- Role-based RLS enhancements for Story 2.2
-- Adds helper function to extract role from JWT

CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS text AS $$
  SELECT COALESCE(
    (auth.jwt() -> 'user_metadata' ->> 'user_type'),
    'atleta'
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.get_user_entity_id()
RETURNS uuid AS $$
  SELECT (auth.jwt() -> 'user_metadata' ->> 'entity_id')::uuid;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

COMMENT ON FUNCTION public.get_user_role IS 'Returns the role of the authenticated user from JWT metadata';
COMMENT ON FUNCTION public.get_user_entity_id IS 'Returns the entity_id of the authenticated user from JWT metadata';
