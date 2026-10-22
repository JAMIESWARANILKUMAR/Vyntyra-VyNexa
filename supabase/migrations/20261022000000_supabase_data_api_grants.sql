-- ==============================================================================
-- Migration: 20261022000000_supabase_data_api_grants.sql
-- Description: Configure default privileges and grant Data API access to public schema
-- Target: Supabase PostgreSQL (Idempotent and safe to run on existing databases)
-- Complies with Supabase October 30 Data API security update
-- ==============================================================================

-- 1. Ensure schema usage is granted to standard Supabase roles
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON SCHEMA public TO postgres;

-- 2. Configure default privileges for all FUTURE tables created in the public schema
-- This guarantees any table created after October 30 automatically receives Data API access.

-- Current session default privileges
ALTER DEFAULT PRIVILEGES IN SCHEMA public 
    GRANT SELECT ON TABLES TO anon;

ALTER DEFAULT PRIVILEGES IN SCHEMA public 
    GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO authenticated;

ALTER DEFAULT PRIVILEGES IN SCHEMA public 
    GRANT ALL ON TABLES TO service_role;

ALTER DEFAULT PRIVILEGES IN SCHEMA public 
    GRANT USAGE, SELECT ON SEQUENCES TO anon;

ALTER DEFAULT PRIVILEGES IN SCHEMA public 
    GRANT ALL ON SEQUENCES TO authenticated, service_role;

ALTER DEFAULT PRIVILEGES IN SCHEMA public 
    GRANT EXECUTE ON ROUTINES TO anon, authenticated, service_role;

-- Specific default privileges for tables created by the postgres role (used by migrations)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'postgres') THEN
        ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public 
            GRANT SELECT ON TABLES TO anon;

        ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public 
            GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO authenticated;

        ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public 
            GRANT ALL ON TABLES TO service_role;

        ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public 
            GRANT USAGE, SELECT ON SEQUENCES TO anon;

        ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public 
            GRANT ALL ON SEQUENCES TO authenticated, service_role;

        ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public 
            GRANT EXECUTE ON ROUTINES TO anon, authenticated, service_role;
    END IF;
END $$;

-- 3. Explicitly grant permissions on ALL CURRENT existing tables in the public schema
-- (Safe and non-destructive: does not modify columns, constraints, or existing rows)
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;

-- 4. Explicitly grant permissions on ALL CURRENT sequences in the public schema
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated, service_role;

-- 5. Explicitly grant execution on ALL CURRENT routines/functions in the public schema
GRANT EXECUTE ON ALL ROUTINES IN SCHEMA public TO anon, authenticated, service_role;

-- 6. Guarantee public submission grants for designated anon-accessible tables if they exist
DO $$
BEGIN
    -- Applications table (public candidate submissions)
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'applications') THEN
        GRANT INSERT ON public.applications TO anon;
    END IF;

    -- Application projects table
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'application_projects') THEN
        GRANT INSERT ON public.application_projects TO anon;
    END IF;

    -- Visitor counts / analytics table
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'visitor_counts') THEN
        GRANT INSERT, UPDATE ON public.visitor_counts TO anon;
    END IF;
END $$;

-- 7. Notify PostgREST to reload its schema cache immediately
NOTIFY pgrst, 'reload schema';
