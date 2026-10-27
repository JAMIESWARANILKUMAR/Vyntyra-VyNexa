import { getAdminClient } from "@/integrations/supabase/admin";

export type UserRole = 'super_admin' | 'admin' | 'employee' | 'candidate';

export type InterviewCapability =
  | 'manage_users_roles'
  | 'manage_templates'
  | 'schedule_interview'
  | 'monitor_live_all'
  | 'monitor_live_assigned'
  | 'view_analytics_global'
  | 'view_analytics_org'
  | 'view_analytics_assigned'
  | 'view_analytics_personal'
  | 'submit_mentor_evaluation';

/**
 * Permissions Matrix Enforcement
 */
export const PERMISSIONS_MATRIX: Record<UserRole, InterviewCapability[]> = {
  super_admin: [
    'manage_users_roles',
    'manage_templates',
    'schedule_interview',
    'monitor_live_all',
    'monitor_live_assigned',
    'view_analytics_global',
    'view_analytics_org',
    'view_analytics_assigned',
    'view_analytics_personal',
    'submit_mentor_evaluation'
  ],
  admin: [
    'manage_users_roles', // Org/Dept scope
    'manage_templates',
    'schedule_interview',
    'monitor_live_all',
    'monitor_live_assigned',
    'view_analytics_org',
    'view_analytics_assigned',
    'view_analytics_personal',
    'submit_mentor_evaluation'
  ],
  employee: [
    'manage_templates',
    'schedule_interview',
    'monitor_live_assigned',
    'view_analytics_assigned',
    'view_analytics_personal',
    'submit_mentor_evaluation'
  ],
  candidate: [
    'view_analytics_personal'
  ]
};

/**
 * Checks if a role has the specified capability
 */
export function hasInterviewPermission(
  role: UserRole, 
  capability: InterviewCapability,
  context?: { sessionMentorId?: string; currentUserId?: string }
): boolean {
  const allowed = PERMISSIONS_MATRIX[role] || PERMISSIONS_MATRIX.candidate;
  
  if (allowed.includes(capability)) {
    return true;
  }

  // Mentor assigned session check
  if (capability === 'monitor_live_assigned' || capability === 'view_analytics_assigned') {
    if (role === 'employee' && context?.sessionMentorId && context?.currentUserId) {
      return context.sessionMentorId === context.currentUserId;
    }
  }

  return false;
}

/**
 * Extracts and resolves a user's role from Supabase or JWT session
 */
export async function resolveUserInterviewRole(
  userId?: string | null, 
  email?: string | null,
  cachedUserType?: string | null
): Promise<{ role: UserRole; isSuperAdmin: boolean; isAdmin: boolean; isEmployee: boolean }> {
  const normalizedEmail = (email || '').trim().toLowerCase();

  // 1. Explicit Super Admin bypass (HR Master or system super host)
  if (
    normalizedEmail === 'hr@vyntyraconsultancyservices.in' ||
    cachedUserType === 'super_admin'
  ) {
    return { role: 'super_admin', isSuperAdmin: true, isAdmin: true, isEmployee: true };
  }

  // 2. Organization staff detection by corporate domain
  const isCorporateDomain = 
    normalizedEmail.endsWith('@vyntyraconsultancyservices.in') || 
    normalizedEmail.endsWith('@vcs.in');

  if (userId) {
    try {
      const supabase = getAdminClient();

      // Check user_roles table
      const { data: userRoleRow } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .maybeSingle();

      if (userRoleRow?.role) {
        const r = String(userRoleRow.role).toLowerCase();
        if (r === 'super_admin' || r === 'superadmin') return { role: 'super_admin', isSuperAdmin: true, isAdmin: true, isEmployee: true };
        if (r === 'admin' || r === 'moderator') return { role: 'admin', isSuperAdmin: false, isAdmin: true, isEmployee: true };
        if (r === 'employee' || r === 'mentor' || r === 'staff') return { role: 'employee', isSuperAdmin: false, isAdmin: false, isEmployee: true };
      }

      // Check profiles table
      const { data: profileRow } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .maybeSingle();

      if (profileRow?.role) {
        const pr = String(profileRow.role).toLowerCase();
        if (pr === 'super_admin') return { role: 'super_admin', isSuperAdmin: true, isAdmin: true, isEmployee: true };
        if (pr === 'admin') return { role: 'admin', isSuperAdmin: false, isAdmin: true, isEmployee: true };
        if (pr === 'employee' || pr === 'mentor') return { role: 'employee', isSuperAdmin: false, isAdmin: false, isEmployee: true };
      }
    } catch (e) {
      console.warn("[resolveUserInterviewRole] Role resolution error:", e);
    }
  }

  // 3. Metadata or domain fallback
  if (cachedUserType === 'admin') return { role: 'admin', isSuperAdmin: false, isAdmin: true, isEmployee: true };
  if (cachedUserType === 'employee' || isCorporateDomain) return { role: 'employee', isSuperAdmin: false, isAdmin: false, isEmployee: true };

  return { role: 'candidate', isSuperAdmin: false, isAdmin: false, isEmployee: false };
}

/**
 * Worker / Middleware helper to extract Bearer token and verify caller
 */
export async function authenticateWorkerRequest(req: Request): Promise<{
  user: any | null;
  role: UserRole;
  error?: string;
}> {
  const authHeader = req.headers.get("authorization") || req.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return { user: null, role: 'candidate', error: "Missing or invalid Authorization header" };
  }

  const token = authHeader.replace("Bearer ", "").trim();
  if (!token) {
    return { user: null, role: 'candidate', error: "Empty Bearer token" };
  }

  try {
    const supabase = getAdminClient();
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
      return { user: null, role: 'candidate', error: "Invalid authentication token" };
    }

    const { role } = await resolveUserInterviewRole(user.id, user.email, user.user_metadata?.userType);
    return { user, role };
  } catch (err: any) {
    return { user: null, role: 'candidate', error: err.message || "Auth error" };
  }
}
