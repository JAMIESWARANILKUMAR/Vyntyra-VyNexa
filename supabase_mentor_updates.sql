-- Update profiles to support Intern-Mentor relationships and document/image URLs
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS mentor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS avatar_url TEXT,
ADD COLUMN IF NOT EXISTS offer_letter_url TEXT,
ADD COLUMN IF NOT EXISTS noc_url TEXT;

-- Update tasks table RLS to allow mentors to assign tasks to their interns
-- (Existing RLS allows admins to manage tasks, but we want employees to manage tasks for their mentees)
DROP POLICY IF EXISTS "Allow employees to manage mentee tasks" ON public.tasks;

CREATE POLICY "Allow employees to manage mentee tasks" ON public.tasks
    FOR ALL TO authenticated USING (
        -- Can manage if they are the one assigning it
        assigned_by = auth.uid() OR
        -- Or if they are the mentor of the assigned person
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE public.profiles.id = tasks.assigned_to 
            AND public.profiles.mentor_id = auth.uid()
        )
    );
