import { 
  createMockSessionFn, 
  submitInterviewTurnFn, 
  recordInterviewTelemetryFn, 
  finalizeMockInterviewReportFn, 
  getMockSessionFn,
  listMockSessionsFn 
} from "@/lib/mock-interview.functions";

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
    // 1. Initialize Mock Session: POST /api/interview/init
    if (pathname.endsWith("/init") && method === "POST") {
      const body = await req.json();
      const result = await createMockSessionFn({ data: body });
      return new Response(JSON.stringify(result), { status: 200, headers: corsHeaders });
    }

    // 2. Submit Turn: POST /api/interview/turn
    if (pathname.endsWith("/turn") && method === "POST") {
      const body = await req.json();
      const result = await submitInterviewTurnFn({ data: body });
      return new Response(JSON.stringify(result), { status: 200, headers: corsHeaders });
    }

    // 3. Telemetry: POST /api/interview/telemetry
    if (pathname.endsWith("/telemetry") && method === "POST") {
      const body = await req.json();
      const result = await recordInterviewTelemetryFn({ data: body });
      return new Response(JSON.stringify(result), { status: 200, headers: corsHeaders });
    }

    // 4. Finalize Report: POST /api/interview/report
    if (pathname.endsWith("/report") && method === "POST") {
      const body = await req.json();
      const result = await finalizeMockInterviewReportFn({ data: body });
      return new Response(JSON.stringify(result), { status: 200, headers: corsHeaders });
    }

    // 5. Get Session: GET /api/interview/session?sessionId=...
    if (pathname.endsWith("/session") && method === "GET") {
      const sessionId = url.searchParams.get("sessionId");
      if (!sessionId) {
        return new Response(JSON.stringify({ error: "sessionId query parameter required" }), { status: 400, headers: corsHeaders });
      }
      const result = await getMockSessionFn({ data: { sessionId } });
      return new Response(JSON.stringify(result), { status: 200, headers: corsHeaders });
    }

    // 6. List Sessions: GET /api/interview/list?candidateEmail=...&internId=...
    if (pathname.endsWith("/list") && method === "GET") {
      const candidateEmail = url.searchParams.get("candidateEmail") || undefined;
      const internId = url.searchParams.get("internId") || undefined;
      const result = await listMockSessionsFn({ data: { candidateEmail, internId } });
      return new Response(JSON.stringify(result), { status: 200, headers: corsHeaders });
    }

    return new Response(JSON.stringify({
      name: "VyNexa AI Mock Interview API",
      status: "online",
      endpoints: [
        "POST /api/interview/init",
        "POST /api/interview/turn",
        "POST /api/interview/telemetry",
        "POST /api/interview/report",
        "GET /api/interview/session?sessionId={id}",
        "GET /api/interview/list?internId={id}"
      ]
    }), { status: 200, headers: corsHeaders });
  } catch (err: any) {
    return new Response(JSON.stringify({
      error: err.message || "Internal Server Error",
      status: 500
    }), { status: 500, headers: corsHeaders });
  }
}
