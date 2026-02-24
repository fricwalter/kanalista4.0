-- Ensure backend/service-role operations can read/write app tables.
-- This prevents auth callback upserts from failing with "permission denied for table users".

GRANT USAGE ON SCHEMA public TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.users TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.xtream_credentials TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.channel_cache TO service_role;
