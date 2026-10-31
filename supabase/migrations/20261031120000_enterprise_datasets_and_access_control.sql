-- ═══════════════════════════════════════════════════════════════════════════════
-- Vyntyra Enterprise Dataset Vault & CSV Extraction Hub Schema
-- Table: public.enterprise_datasets
-- Description: Stores structured multi-entity records (Companies, Colleges,
--              Students, Interns, Employees, Leads) extracted from CSV files
--              with custom attributes, multi-field search & granular RBAC.
-- ═══════════════════════════════════════════════════════════════════════════════

-- 1. Create Main Table
CREATE TABLE IF NOT EXISTS public.enterprise_datasets (
    id TEXT PRIMARY KEY,
    category TEXT NOT NULL, -- 'companies', 'colleges', 'students', 'interns', 'employees', 'leads', or custom
    title TEXT NOT NULL, -- Company name, College name, Candidate name, Employee name, etc.
    
    -- Geographic & Location Taxonomy
    location_country TEXT DEFAULT 'India',
    location_state TEXT,
    location_district TEXT,
    location_city TEXT,
    
    -- Industry & Domain Categorization
    industry TEXT,
    sector TEXT,
    role_designation TEXT,
    
    -- Contact & Web Information
    contact_email TEXT,
    contact_phone TEXT,
    website_url TEXT,
    
    -- Metadata & Extracted Custom Columns
    tags TEXT[] NOT NULL DEFAULT '{}',
    notes TEXT,
    raw_attributes JSONB NOT NULL DEFAULT '{}'::jsonb,
    source_filename TEXT,
    
    -- Audit & Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by TEXT
);

-- 2. Performance & Filter Indices
CREATE INDEX IF NOT EXISTS idx_enterprise_datasets_category ON public.enterprise_datasets(category);
CREATE INDEX IF NOT EXISTS idx_enterprise_datasets_title ON public.enterprise_datasets(lower(title));
CREATE INDEX IF NOT EXISTS idx_enterprise_datasets_state ON public.enterprise_datasets(location_state);
CREATE INDEX IF NOT EXISTS idx_enterprise_datasets_city ON public.enterprise_datasets(location_city);
CREATE INDEX IF NOT EXISTS idx_enterprise_datasets_district ON public.enterprise_datasets(location_district);
CREATE INDEX IF NOT EXISTS idx_enterprise_datasets_industry ON public.enterprise_datasets(industry);
CREATE INDEX IF NOT EXISTS idx_enterprise_datasets_sector ON public.enterprise_datasets(sector);
CREATE INDEX IF NOT EXISTS idx_enterprise_datasets_role ON public.enterprise_datasets(role_designation);
CREATE INDEX IF NOT EXISTS idx_enterprise_datasets_email ON public.enterprise_datasets(lower(contact_email));
CREATE INDEX IF NOT EXISTS idx_enterprise_datasets_created_at ON public.enterprise_datasets(created_at DESC);

-- GIN Index for fast arbitrary JSON querying inside raw_attributes
CREATE INDEX IF NOT EXISTS idx_enterprise_datasets_raw_attrs ON public.enterprise_datasets USING GIN (raw_attributes);

-- 3. Row Level Security (RLS)
ALTER TABLE public.enterprise_datasets ENABLE ROW LEVEL SECURITY;

-- Admins have full access
DROP POLICY IF EXISTS "Admins have full dataset access" ON public.enterprise_datasets;
CREATE POLICY "Admins have full dataset access"
ON public.enterprise_datasets
FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.user_roles 
        WHERE user_id = auth.uid() AND role IN ('admin', 'super_admin')
    )
    OR
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'admin'
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.user_roles 
        WHERE user_id = auth.uid() AND role IN ('admin', 'super_admin')
    )
    OR
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'admin'
    )
);

-- Employees have read access if enabled in settings
DROP POLICY IF EXISTS "Authorized staff can view datasets" ON public.enterprise_datasets;
CREATE POLICY "Authorized staff can view datasets"
ON public.enterprise_datasets
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.user_roles 
        WHERE user_id = auth.uid() AND role IN ('employee', 'interviewer', 'mentor', 'staff')
    )
    OR
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role IN ('employee', 'staff')
    )
);

-- Service role has full unconditional access
GRANT ALL ON TABLE public.enterprise_datasets TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.enterprise_datasets TO authenticated;
