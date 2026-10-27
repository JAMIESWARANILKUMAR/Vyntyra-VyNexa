import { 
  createMockSessionFn, 
  submitInterviewTurnFn, 
  recordInterviewTelemetryFn, 
  finalizeMockInterviewReportFn, 
  getMockSessionFn,
  listMockSessionsFn,
  scheduleMockInterviewFn,
  listAdminMockSessionsFn,
  listMentorMockSessionsFn,
  listCandidateMockSessionsFn,
  updateMentorNotesAndGradeFn,
  assignUserRoleFn,
  listManageableUsersFn
} from "@/lib/mock-interview.functions";
import { authenticateWorkerRequest } from "@/lib/mock-interview-rbac";

export default async function defineInterviewApiRoute(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const pathname = url.pathname;
  const method = req.method.toUpperCase();

  // CORS Headers
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Content-Type": "application/json"
  };

  if (method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    // ═══════════════════════════════════════════════════════════════════
    // 1. /api/interviews/create (Super Admin, Admin, Employee)
    // ═══════════════════════════════════════════════════════════════════
    if ((pathname.endsWith("/create") || pathname.endsWith("/init")) && method === "POST") {
      const auth = await authenticateWorkerRequest(req);
      if (auth.error && !pathname.endsWith("/init")) {
        return new Response(JSON.stringify({ error: auth.error }), { status: 401, headers: corsHeaders });
      }
      const body = await req.json();
      const result = await createMockSessionFn({ data: body });
      return new Response(JSON.stringify(result), { status: 200, headers: corsHeaders });
    }

    // ═══════════════════════════════════════════════════════════════════
    // 2. /api/interviews/schedule (Super Admin, Admin, Employee)
    // ═══════════════════════════════════════════════════════════════════
    if (pathname.endsWith("/schedule") && method === "POST") {
      const auth = await authenticateWorkerRequest(req);
      if (auth.error || auth.role === 'candidate') {
        return new Response(JSON.stringify({ error: "Forbidden: Only staff (Super Admin, Admin, Employee) can schedule interviews." }), { status: 403, headers: corsHeaders });
      }
      const body = await req.json();
      const result = await scheduleMockInterviewFn({
        data: {
          ...body,
          callerRole: auth.role,
          callerUserId: auth.user?.id
        }
      });
      return new Response(JSON.stringify(result), { status: 200, headers: corsHeaders });
    }

    // ═══════════════════════════════════════════════════════════════════
    // 3. /api/interviews/monitor/:id (Super Admin, Admin, Assigned Mentor)
    // ═══════════════════════════════════════════════════════════════════
    if (pathname.includes("/monitor") && method === "GET") {
      const auth = await authenticateWorkerRequest(req);
      if (auth.error || auth.role === 'candidate') {
        return new Response(JSON.stringify({ error: "Forbidden: Candidates cannot access the observer monitoring stream." }), { status: 403, headers: corsHeaders });
      }
      const pathParts = pathname.split("/");
      const sessionId = pathParts[pathParts.length - 1] || url.searchParams.get("sessionId");
      if (!sessionId) {
        return new Response(JSON.stringify({ error: "Missing sessionId parameter" }), { status: 400, headers: corsHeaders });
      }
      const result = await getMockSessionFn({ data: { sessionId } });

      // If mentor, check assignment
      if (auth.role === 'employee' && result.session.mentor_id && result.session.mentor_id !== auth.user.id) {
        return new Response(JSON.stringify({ error: "Forbidden: You are only permitted to monitor your assigned mentees." }), { status: 403, headers: corsHeaders });
      }

      return new Response(JSON.stringify({
        ...result,
        observerMode: true,
        monitoringStaff: { id: auth.user.id, role: auth.role }
      }), { status: 200, headers: corsHeaders });
    }

    // ═══════════════════════════════════════════════════════════════════
    // 4. /api/interviews/session/* (Candidate & Monitoring Staff)
    // ═══════════════════════════════════════════════════════════════════
    if (pathname.includes("/session") && method === "GET") {
      const sessionId = url.searchParams.get("sessionId");
      if (!sessionId) {
        return new Response(JSON.stringify({ error: "sessionId query parameter required" }), { status: 400, headers: corsHeaders });
      }
      const result = await getMockSessionFn({ data: { sessionId } });
      return new Response(JSON.stringify(result), { status: 200, headers: corsHeaders });
    }

    // Turn submission
    if (pathname.endsWith("/turn") && method === "POST") {
      const body = await req.json();
      const result = await submitInterviewTurnFn({ data: body });
      return new Response(JSON.stringify(result), { status: 200, headers: corsHeaders });
    }

    // Telemetry
    if (pathname.endsWith("/telemetry") && method === "POST") {
      const body = await req.json();
      const result = await recordInterviewTelemetryFn({ data: body });
      return new Response(JSON.stringify(result), { status: 200, headers: corsHeaders });
    }

    // Finalize Report
    if (pathname.endsWith("/report") && method === "POST") {
      const body = await req.json();
      const result = await finalizeMockInterviewReportFn({ data: body });
      return new Response(JSON.stringify(result), { status: 200, headers: corsHeaders });
    }

    // ═══════════════════════════════════════════════════════════════════
    // 5. /api/interviews/users/role (Super Admin & Admin only)
    // ═══════════════════════════════════════════════════════════════════
    if (pathname.endsWith("/users/role") && method === "POST") {
      const auth = await authenticateWorkerRequest(req);
      if (auth.error || (auth.role !== 'super_admin' && auth.role !== 'admin')) {
        return new Response(JSON.stringify({ error: "Forbidden: User role assignment requires Super Admin or Admin authorization." }), { status: 403, headers: corsHeaders });
      }
      const body = await req.json();
      const result = await assignUserRoleFn({
        data: {
          ...body,
          callerRole: auth.role
        }
      });
      return new Response(JSON.stringify(result), { status: 200, headers: corsHeaders });
    }

    // ═══════════════════════════════════════════════════════════════════
    // 6. /api/interviews/mentor/grade (Employee, Admin, Super Admin)
    // ═══════════════════════════════════════════════════════════════════
    if (pathname.endsWith("/mentor/grade") && method === "POST") {
      const auth = await authenticateWorkerRequest(req);
      if (auth.error || auth.role === 'candidate') {
        return new Response(JSON.stringify({ error: "Forbidden: Only mentors and administrators can submit evaluations." }), { status: 403, headers: corsHeaders });
      }
      const body = await req.json();
      const result = await updateMentorNotesAndGradeFn({
        data: {
          ...body,
          mentorName: auth.user?.user_metadata?.full_name || auth.user?.email
        }
      });
      return new Response(JSON.stringify(result), { status: 200, headers: corsHeaders });
    }

    return new Response(JSON.stringify({
      name: "VyNexa RBAC AI Mock Interview API",
      status: "online",
      version: "2.0-RBAC",
      endpoints: [
        "POST /api/interviews/create [super_admin, admin, employee]",
        "POST /api/interviews/schedule [super_admin, admin, employee]",
        "GET /api/interviews/monitor/:id [super_admin, admin, assigned employee]",
        "GET /api/interviews/session?sessionId={id} [candidate, staff]",
        "POST /api/interviews/users/role [super_admin, admin]",
        "POST /api/interviews/mentor/grade [super_admin, admin, employee]"
      ]
    }), { status: 200, headers: corsHeaders });
  } catch (err: any) {
    return new Response(JSON.stringify({
      error: err.message || "Internal Server Error",
      status: 500
    }), { status: 500, headers: corsHeaders });
  }
}
