CREATE TABLE IF NOT EXISTS public.tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    assigned_to TEXT,
    target_user_id TEXT,
    claimed_by TEXT,
    user_id TEXT,
    due_date TIMESTAMPTZ,
    priority TEXT DEFAULT 'medium',
    status TEXT DEFAULT 'pending',
    is_pool_task BOOLEAN DEFAULT false,
    target_role TEXT DEFAULT 'all',
    team_members JSONB,
    target_user_ids JSONB,
    team_member_names JSONB,
    created_by UUID,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS target_user_id TEXT;
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS claimed_by TEXT;
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS user_id TEXT;
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS is_pool_task BOOLEAN DEFAULT false;
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS target_role TEXT DEFAULT 'all';
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS team_members JSONB;
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS target_user_ids JSONB;
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS team_member_names JSONB;

-- also for deliverables
CREATE TABLE IF NOT EXISTS public.deliverables (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID REFERENCES public.tasks(id) ON DELETE CASCADE,
    user_id TEXT,
    content TEXT,
    url TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);
