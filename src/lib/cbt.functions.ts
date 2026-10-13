import { getEnv } from "@/lib/env";
import { createServerFn } from "@tanstack/react-start";
import { GoogleGenAI } from "@google/genai";
import { generateAiJson } from "@/lib/ai-gateway";
import { z } from "zod";
import { getAdminClient } from "@/integrations/supabase/admin";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { getOrSetCache, invalidateCache } from "@/lib/server-cache";

export const generateAiTestFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({
    taskContext: z.string(),
    documentText: z.string().optional(),
    modules: z.array(z.string()),
    questionCount: z.number().optional(),
    defaultTimeSeconds: z.number().optional()
  }).parse(d))
  .handler(async ({ data: args }) => {
    const targetCount = Number(args.questionCount) > 0 ? Number(args.questionCount) : 10;
    const defaultTimer = Number(args.defaultTimeSeconds) > 0 ? Number(args.defaultTimeSeconds) : 60;

    // 1. Attempt AI Generation via AI Gateway (Gemini primary with OpenRouter fallback)
    try {
      const prompt = `You are an expert technical evaluator. Generate a computer-based test (CBT) with EXACTLY ${targetCount} high-yield, comprehensive questions based on the following context.
      
TASK CONTEXT:
${args.taskContext}

DOCUMENT CONTEXT:
${args.documentText || "None"}

REQUESTED MODULES:
${args.modules.join(', ')}

IMPORTANT RULES:
1. Generate EXACTLY ${targetCount} questions in total!
2. Every question MUST have its solution pre-marked!
3. Default time_limit_seconds should be ${defaultTimer} (or adjusted between 30-180 seconds based on question complexity, e.g. 60s for standard MCQ, 120-180s for coding).
4. For MCQ/Aptitude/Scenario/True_False: Provide 4 distinct options with option IDs A, B, C, D (2 options for true_false) and pre-mark correct_answer: "A" or { "id": "A" }. Also include an in-depth "explanation" explaining why the solution is correct.
5. For Coding questions: Provide problem description, pre-marked reference solution code in "correct_answer", and at least 2 test cases in "test_cases" with "input" and "expected_output".
6. For Subjective / Long Answer questions: Provide the grading criteria and model answer in "correct_answer" and "explanation".

Output the result STRICTLY as JSON with schema:
{
  "questions": [
    {
      "question_type": "mcq" | "coding" | "aptitude" | "long_answer" | "scenario" | "true_false",
      "question_text": "...",
      "options": [{ "id": "A", "text": "..." }, { "id": "B", "text": "..." }, { "id": "C", "text": "..." }, { "id": "D", "text": "..." }],
      "correct_answer": "A",
      "explanation": "...",
      "max_points": 10,
      "time_limit_seconds": ${defaultTimer}
    }
  ]
}`;
      const result = await generateAiJson<{ questions: any[] }>({
        prompt,
        model: 'gemini-1.5-flash',
      });
      const parsed = result.data;
      if (parsed?.questions && Array.isArray(parsed.questions) && parsed.questions.length > 0) {
        // Normalize questions
        const sanitizedQuestions = parsed.questions.map((q: any) => ({
          ...q,
          time_limit_seconds: Number(q.time_limit_seconds) || defaultTimer,
          max_points: Number(q.max_points) || 10
        }));
        return { questions: sanitizedQuestions };
      }
    } catch (aiErr: any) {
      console.warn("[generateAiTestFn] AI Gateway generation error, using curriculum synthesizer:", aiErr.message);
    }

    // 2. High-Yield Contextual Curriculum Synthesizer Fallback (100% Guaranteed Success)
    return synthesizeQuestionsFromContext(args.taskContext, args.documentText, args.modules, targetCount, defaultTimer);
  });

function synthesizeQuestionsFromContext(
  taskContext: string, 
  documentText?: string, 
  modules: string[] = ["mcq", "scenario"],
  requestedCount: number = 10,
  defaultTimeSeconds: number = 60
): { questions: any[] } {
  const combined = `${taskContext || ""} ${documentText || ""}`.trim();
  const lower = combined.toLowerCase();
  
  const isWebTech = /web|html|css|javascript|js|frontend|backend|dom|http|ewt|essentials of web|react|node|client|browser/i.test(lower);
  const isAIML = /ai|ml|machine learning|deep learning|neural|dataset|model|classification|regression|nlp|python|pytorch|tensorflow/i.test(lower);
  const isDatabase = /database|dbms|sql|mysql|postgresql|nosql|mongo|query|acid|schema|table|join/i.test(lower);

  const selectedModules = (modules && modules.length > 0) ? modules : ["mcq", "scenario"];
  const questions: any[] = [];
  const addQ = (q: any) => questions.push(q);

  if (isWebTech || (!isAIML && !isDatabase)) {
    // ── Web Technologies & Full-Stack Curriculum ───────────────────────
    if (selectedModules.includes("mcq")) {
      addQ({
        question_type: "mcq",
        question_text: "In modern HTML5 specifications, which semantic element is specifically designated to encapsulate self-contained content that could be independently distributed or syndicated (e.g., a blog post, forum post, or news article)?",
        options: [
          { id: "A", text: "<article>" },
          { id: "B", text: "<section>" },
          { id: "C", text: "<aside>" },
          { id: "D", text: "<div>" },
        ],
        correct_answer: "A",
        explanation: "The <article> element represents a complete, self-contained composition in a document, page, or site and is intended to be independently distributable or reusable.",
        max_points: 10,
        time_limit_seconds: 60,
      });

      addQ({
        question_type: "mcq",
        question_text: "In CSS layout mechanics, how does the CSS Box Model calculate the rendered element width when 'box-sizing: border-box' is applied?",
        options: [
          { id: "A", text: "The specified width includes content, padding, and border (only margins remain external)." },
          { id: "B", text: "The specified width applies only to content, and padding and border are added additionally on top." },
          { id: "C", text: "The border is excluded and only margin and padding are included." },
          { id: "D", text: "The width is overridden by viewport minimum constraints dynamically." },
        ],
        correct_answer: "A",
        explanation: "With 'box-sizing: border-box', the element's width and height include content, padding, and border, preventing unexpected layout overflows.",
        max_points: 10,
        time_limit_seconds: 60,
      });

      addQ({
        question_type: "mcq",
        question_text: "In JavaScript asynchronous execution, how does the runtime Event Loop prioritize the Microtask queue (Promises, queueMicrotask) relative to the Macrotask (callback) queue (setTimeout, setInterval)?",
        options: [
          { id: "A", text: "The entire Microtask queue is completely drained before the next Macrotask is processed." },
          { id: "B", text: "Macrotasks always preempt and cancel running Microtasks." },
          { id: "C", text: "Microtasks and Macrotasks are executed concurrently across parallel threads." },
          { id: "D", text: "Macrotasks are executed first, followed by microtasks in reverse FIFO order." },
        ],
        correct_answer: "A",
        explanation: "The JavaScript event loop executes all microtasks in the microtask queue after every synchronous script execution and before picking the next task from the macrotask queue.",
        max_points: 10,
        time_limit_seconds: 60,
      });

      addQ({
        question_type: "mcq",
        question_text: "Which HTTP request method is defined by RFC 7231 as idempotent and is primarily used to replace all current representations of the target resource with the uploaded payload?",
        options: [
          { id: "A", text: "PUT" },
          { id: "B", text: "POST" },
          { id: "C", text: "PATCH" },
          { id: "D", text: "CONNECT" },
        ],
        correct_answer: "A",
        explanation: "PUT is idempotent: multiple identical PUT requests produce the exact same server state as a single request, completely replacing the target resource.",
        max_points: 10,
        time_limit_seconds: 60,
      });

      addQ({
        question_type: "mcq",
        question_text: "What is the primary operational difference between client-side sessionStorage and localStorage in modern web browsers?",
        options: [
          { id: "A", text: "sessionStorage data persists only while the browser tab remains open, whereas localStorage persists until explicitly cleared." },
          { id: "B", text: "sessionStorage is automatically sent with every HTTP request header." },
          { id: "C", text: "localStorage is cleared automatically when the user navigates between internal routes." },
          { id: "D", text: "sessionStorage is shared across all browser tabs and windows simultaneously." },
        ],
        correct_answer: "A",
        explanation: "sessionStorage is isolated to the top-level browsing context (tab) and cleared on tab closure; localStorage has no expiration time.",
        max_points: 10,
        time_limit_seconds: 60,
      });
    }

    if (selectedModules.includes("scenario")) {
      addQ({
        question_type: "scenario",
        question_text: "Scenario: A Single Page Application (SPA) on 'https://portal.vyntyraconsultancyservices.in' attempts to fetch user data from 'https://api.vyntyraconsultancyservices.in'. The browser blocks the request with a CORS error: 'No Access-Control-Allow-Origin header is present'. How should this be resolved?",
        options: [
          { id: "A", text: "Configure the API server to respond with 'Access-Control-Allow-Origin: https://portal.vyntyraconsultancyservices.in' and required headers." },
          { id: "B", text: "Ask all client users to disable browser security policies and firewalls." },
          { id: "C", text: "Convert the client request into an inline SQL statement inside JavaScript." },
          { id: "D", text: "Encode the frontend code into an iframe with sandbox permissions removed." },
        ],
        correct_answer: "A",
        explanation: "CORS is a browser security measure. When origins differ, the receiving server must declare permitted origins via Access-Control-Allow-Origin headers.",
        max_points: 10,
        time_limit_seconds: 90,
      });

      addQ({
        question_type: "scenario",
        question_text: "Scenario: Users report that double-clicking the 'Submit Registration' button causes duplicate candidate records in the database. What enterprise web pattern must be implemented?",
        options: [
          { id: "A", text: "Implement client-side button debouncing/disabling and enforce backend Idempotency Keys." },
          { id: "B", text: "Force a full browser window refresh after each character typed in form fields." },
          { id: "C", text: "Store all user entries in client cookies before form submission." },
          { id: "D", text: "Drop database unique constraints to permit duplicates." },
        ],
        correct_answer: "A",
        explanation: "Client-side button debouncing prevents multiple accidental dispatches, and backend idempotency keys guarantee that duplicate HTTP requests do not create duplicate database records.",
        max_points: 10,
        time_limit_seconds: 90,
      });

      addQ({
        question_type: "scenario",
        question_text: "Scenario: A web page loads slowly on mobile networks because large CSS and JavaScript bundles block initial rendering. Which optimization technique most effectively reduces First Contentful Paint (FCP)?",
        options: [
          { id: "A", text: "Inlining critical above-the-fold CSS, using 'defer' or 'async' on non-critical scripts, and minifying bundle assets." },
          { id: "B", text: "Increasing device screen resolution and display DPI via HTML meta tags." },
          { id: "C", text: "Converting all CSS stylesheets into inline base64 images." },
          { id: "D", text: "Disabling browser HTTP cache headers for all stylesheet files." },
        ],
        correct_answer: "A",
        explanation: "Inlining critical CSS and deferring non-critical JavaScript eliminates render-blocking resources, allowing the browser to paint content rapidly.",
        max_points: 10,
        time_limit_seconds: 90,
      });

      addQ({
        question_type: "scenario",
        question_text: "Scenario: You are designing a responsive layout navigation bar. On desktop viewports (>= 1024px), links should appear horizontally in a row. On mobile viewports (< 768px), links must collapse into a vertical hamburger menu. Which CSS technique is standard?",
        options: [
          { id: "A", text: "CSS Media Queries (@media (min-width: 1024px)) combined with Flexbox or Grid layout." },
          { id: "B", text: "Server-side browser user-agent sniffing to redirect users to separate subdomains." },
          { id: "C", text: "Setting viewport zoom dynamically to 0.5 using window.onresize JavaScript handlers." },
          { id: "D", text: "HTML frameset elements with conditional browser attributes." },
        ],
        correct_answer: "A",
        explanation: "CSS Media queries provide standard, responsive layout adaptation based on viewport constraints without requiring separate device-specific codebases.",
        max_points: 10,
        time_limit_seconds: 90,
      });
    }

    if (selectedModules.includes("true_false")) {
      addQ({
        question_type: "true_false",
        question_text: "In CSS, setting 'display: none' removes the element entirely from the document layout flow, whereas 'visibility: hidden' hides the element while still occupying its physical layout space.",
        options: [
          { id: "A", text: "True" },
          { id: "B", text: "False" },
        ],
        correct_answer: "A",
        explanation: "display: none produces no rendered box in the DOM tree, whereas visibility: hidden keeps the box dimensions and blank whitespace in the layout.",
        max_points: 5,
        time_limit_seconds: 30,
      });

      addQ({
        question_type: "true_false",
        question_text: "By fundamental design, the standard HTTP protocol (HTTP/1.1 and HTTP/2) is stateless, requiring cookies or tokens to maintain state across requests.",
        options: [
          { id: "A", text: "True" },
          { id: "B", text: "False" },
        ],
        correct_answer: "A",
        explanation: "HTTP is stateless: each request is executed independently without the server retaining automatic context from preceding requests.",
        max_points: 5,
        time_limit_seconds: 30,
      });
    }

    if (selectedModules.includes("code_snippet")) {
      addQ({
        question_type: "coding",
        question_text: "Write a JavaScript function 'formatIndianCurrency(amount)' that takes a non-negative number and returns a string formatted with commas according to the Indian numbering system (e.g. 100000 -> '1,00,000', 5000 -> '5,000').",
        options: [],
        correct_answer: "function formatIndianCurrency(amount) { return Number(amount).toLocaleString('en-IN'); }",
        explanation: "The Indian numbering format groups the last three digits followed by groups of two digits.",
        reference_code: "function formatIndianCurrency(amount) {\n  // Write your implementation here\n  return Number(amount).toLocaleString('en-IN');\n}",
        test_cases: [
          { input: "100000", expected_output: "1,00,000" },
          { input: "5000", expected_output: "5,000" },
          { input: "10000000", expected_output: "1,00,00,000" },
        ],
        max_points: 15,
        time_limit_seconds: 180,
      });
    }

    if (selectedModules.includes("short_answer")) {
      addQ({
        question_type: "short_answer",
        question_text: "Explain the concept of Document Object Model (DOM) Event Delegation in JavaScript and describe why it improves web application performance when rendering dynamic lists.",
        options: [],
        correct_answer: "Event delegation leverages DOM event bubbling by attaching a single event listener to a common parent element rather than attaching individual listeners to multiple children, reducing memory consumption and handling dynamically added items automatically.",
        explanation: "By relying on event bubbling, parent listeners catch events from dynamic child nodes without requiring per-node listener creation.",
        max_points: 10,
        time_limit_seconds: 120,
      });
    }
  } else if (isAIML) {
    // ── AI & Machine Learning Curriculum ─────────────────────────────
    if (selectedModules.includes("mcq")) {
      addQ({
        question_type: "mcq",
        question_text: "In supervised learning, what metric is most appropriate when evaluating a classification model on an imbalanced dataset where false negatives are critical (e.g. fraud or disease detection)?",
        options: [
          { id: "A", text: "Recall (Sensitivity)" },
          { id: "B", text: "Accuracy" },
          { id: "C", text: "Mean Squared Error (MSE)" },
          { id: "D", text: "R-Squared" },
        ],
        correct_answer: "A",
        explanation: "Recall measures the proportion of actual positives correctly identified, making it vital when false negatives carry severe consequences.",
        max_points: 10,
        time_limit_seconds: 60,
      });

      addQ({
        question_type: "mcq",
        question_text: "Which regularization technique adds a penalty proportional to the square of the magnitude of coefficients (L2 penalty) to prevent neural network overfitting?",
        options: [
          { id: "A", text: "Ridge Regularization (L2)" },
          { id: "B", text: "Lasso Regularization (L1)" },
          { id: "C", text: "ElasticNet without L2" },
          { id: "D", text: "Early Stopping without penalties" },
        ],
        correct_answer: "A",
        explanation: "Ridge regularization adds the sum of squared weights as a penalty term to the loss function, shrinking weights smoothly toward zero.",
        max_points: 10,
        time_limit_seconds: 60,
      });
    }

    if (selectedModules.includes("scenario")) {
      addQ({
        question_type: "scenario",
        question_text: "Scenario: A deep neural network achieves 99.8% training accuracy but only 64% validation accuracy. What condition does this indicate, and what is the recommended remedy?",
        options: [
          { id: "A", text: "High variance (overfitting); apply dropout, L2 regularization, data augmentation, or early stopping." },
          { id: "B", text: "High bias (underfitting); simplify the model by removing hidden layers." },
          { id: "C", text: "Gradient explosion; multiply all inputs by a factor of 100." },
          { id: "D", text: "Zero learning rate; remove all activation functions." },
        ],
        correct_answer: "A",
        explanation: "A high gap between training and validation accuracy signifies overfitting, which is alleviated by regularization and augmentation techniques.",
        max_points: 10,
        time_limit_seconds: 90,
      });
    }
  } else if (isDatabase) {
    // ── Database & SQL Curriculum ─────────────────────────────────────
    if (selectedModules.includes("mcq")) {
      addQ({
        question_type: "mcq",
        question_text: "Which SQL clause is used to filter records resulting from aggregate functions (such as COUNT, AVG, SUM), as opposed to filtering raw rows?",
        options: [
          { id: "A", text: "HAVING" },
          { id: "B", text: "WHERE" },
          { id: "C", text: "GROUP BY" },
          { id: "D", text: "ORDER BY" },
        ],
        correct_answer: "A",
        explanation: "WHERE filters rows before aggregation; HAVING filters aggregated groups after GROUP BY operations.",
        max_points: 10,
        time_limit_seconds: 60,
      });
    }

    if (selectedModules.includes("scenario")) {
      addQ({
        question_type: "scenario",
        question_text: "Scenario: An analytical query on a 10-million row 'orders' table takes 14 seconds to execute a filter on 'created_at'. How should database performance be optimized?",
        options: [
          { id: "A", text: "Create a B-tree index on the 'created_at' column." },
          { id: "B", text: "Convert the column data type from TIMESTAMP to VARCHAR." },
          { id: "C", text: "Remove the WHERE clause and filter results in client browser memory." },
          { id: "D", text: "Restart the PostgreSQL database daemon after each query." },
        ],
        correct_answer: "A",
        explanation: "A B-tree index on 'created_at' enables logarithmic index scans instead of sequential table scans, reducing query execution time from seconds to milliseconds.",
        max_points: 10,
        time_limit_seconds: 90,
      });
    }
  }

  // Add extra high-yield questions to ensure any requested count (up to 30) can be fulfilled
  const extraPool = [
    {
      question_type: "mcq",
      question_text: "In software engineering, what is the primary benefit of adhering to the Single Responsibility Principle (SRP) in system design?",
      options: [
        { id: "A", text: "A class or module has only one reason to change, maximizing maintainability and testability." },
        { id: "B", text: "All database queries are executed in a single monolithic file." },
        { id: "C", text: "Application code compiles directly into binary without dependencies." },
        { id: "D", text: "It prevents developers from using object-oriented inheritance." },
      ],
      correct_answer: "A",
      explanation: "SRP mandates that each module or class should be responsible for a single piece of functionality, reducing coupling and side-effects.",
      max_points: 10,
      time_limit_seconds: defaultTimeSeconds,
    },
    {
      question_type: "mcq",
      question_text: "In Git version control, what does 'git merge --squash feature-branch' accomplish when integrating changes?",
      options: [
        { id: "A", text: "It combines all commits from the feature branch into a single uncommitted change on the target branch." },
        { id: "B", text: "It deletes the remote repository branch and discards commit diffs." },
        { id: "C", text: "It performs an interactive rebase and force-pushes changes upstream." },
        { id: "D", text: "It creates a fast-forward commit with linear SHA preservation." },
      ],
      correct_answer: "A",
      explanation: "Squash merges condense all intermediate commits into a single cohesive commit, preserving a clean master/main log history.",
      max_points: 10,
      time_limit_seconds: defaultTimeSeconds,
    },
    {
      question_type: "mcq",
      question_text: "What is the primary operational objective of implementing a Reverse Proxy (such as Nginx or Cloudflare) in front of application backends?",
      options: [
        { id: "A", text: "Load balancing, SSL/TLS termination, edge caching, and DDoS mitigation." },
        { id: "B", text: "Executing heavy database SQL joins directly on the proxy layer." },
        { id: "C", text: "Transpiling client-side TypeScript code into machine bytecode." },
        { id: "D", text: "Replacing client browsers with headless server-side terminals." },
      ],
      correct_answer: "A",
      explanation: "Reverse proxies distribute network traffic, provide security protection, terminate SSL certificates, and cache static assets close to end users.",
      max_points: 10,
      time_limit_seconds: defaultTimeSeconds,
    },
    {
      question_type: "scenario",
      question_text: "Scenario: An e-commerce API suffers severe performance degradation during flash sales due to high read traffic on product catalog tables. What caching pattern should be adopted?",
      options: [
        { id: "A", text: "Cache-Aside pattern using an in-memory Redis cluster with reasonable TTL and cache invalidation on updates." },
        { id: "B", text: "Writing all product data to flat text files on disk for each HTTP request." },
        { id: "C", text: "Restarting PostgreSQL on a 5-minute cron job to clear buffers." },
        { id: "D", text: "Requiring every customer to download the entire database as a CSV before browsing." },
      ],
      correct_answer: "A",
      explanation: "The Cache-Aside pattern with Redis dramatically reduces database read loads, serving sub-millisecond responses for read-heavy operations.",
      max_points: 10,
      time_limit_seconds: Math.max(defaultTimeSeconds, 90),
    },
    {
      question_type: "true_false",
      question_text: "In relational database design, the ACID 'Isolation' property guarantees that concurrent transactions execute without interfering with one another's intermediate states.",
      options: [
        { id: "A", text: "True" },
        { id: "B", text: "False" },
      ],
      correct_answer: "A",
      explanation: "Isolation prevents dirty reads, non-repeatable reads, and phantom reads depending on the configured isolation level.",
      max_points: 5,
      time_limit_seconds: Math.max(20, Math.floor(defaultTimeSeconds / 2)),
    },
    {
      question_type: "mcq",
      question_text: "In modern cloud architectures, what is the key difference between horizontal scaling (scaling out) and vertical scaling (scaling up)?",
      options: [
        { id: "A", text: "Horizontal scaling adds more machine/container instances to a pool, while vertical scaling adds CPU/RAM to a single machine." },
        { id: "B", text: "Horizontal scaling is only possible on Windows servers." },
        { id: "C", text: "Vertical scaling eliminates all single points of failure automatically." },
        { id: "D", text: "There is no architectural difference between the two terms." },
      ],
      correct_answer: "A",
      explanation: "Scaling horizontally adds nodes to distribute load with high availability; scaling vertically upgrades the capacity of existing individual nodes.",
      max_points: 10,
      time_limit_seconds: defaultTimeSeconds,
    },
    {
      question_type: "mcq",
      question_text: "Which of the following describes the purpose of JSON Web Tokens (JWT) in stateless authentication architectures?",
      options: [
        { id: "A", text: "A digitally signed claims token that allows servers to verify client identity without querying a session database on every request." },
        { id: "B", text: "An encrypted algorithm to store whole database tables in browser local storage." },
        { id: "C", text: "A replacement for HTML markup in single-page applications." },
        { id: "D", text: "A specialized compiler for transpiling Python to JavaScript." },
      ],
      correct_answer: "A",
      explanation: "JWTs contain cryptographically signed claims (header, payload, signature), enabling stateless verification across distributed servers.",
      max_points: 10,
      time_limit_seconds: defaultTimeSeconds,
    },
    {
      question_type: "scenario",
      question_text: "Scenario: A mission-critical background job processing payment webhooks fails intermittently due to transient third-party network timeouts. How should resiliency be improved?",
      options: [
        { id: "A", text: "Implement exponential backoff retry mechanism with jitter and a Dead-Letter Queue (DLQ) for unrecoverable errors." },
        { id: "B", text: "Immediately drop the failed webhook payload and ignore payment confirmations." },
        { id: "C", text: "Execute the payment synchronous loop in an infinite while(true) block without delays." },
        { id: "D", text: "Increase database max_connections parameter to infinity." },
      ],
      correct_answer: "A",
      explanation: "Exponential backoff retries handle transient glitches smoothly without overloading downstream services, while DLQs capture persistent failures for manual audit.",
      max_points: 10,
      time_limit_seconds: Math.max(defaultTimeSeconds, 90),
    },
    {
      question_type: "coding",
      question_text: "Write a function 'deepClone(obj)' in JavaScript that creates a deep duplicate of a given nested plain object or array without mutating the original.",
      options: [],
      correct_answer: "function deepClone(obj) { return structuredClone ? structuredClone(obj) : JSON.parse(JSON.stringify(obj)); }",
      explanation: "structuredClone is the modern standard for creating deep object clones, preventing shared references across complex state objects.",
      reference_code: "function deepClone(obj) {\n  // Implement deep clone\n  return structuredClone(obj);\n}",
      test_cases: [
        { input: '{"a": 1, "b": {"c": 2}}', expected_output: '{"a": 1, "b": {"c": 2}}' },
        { input: '[1, [2, 3]]', expected_output: '[1, [2, 3]]' }
      ],
      max_points: 15,
      time_limit_seconds: Math.max(defaultTimeSeconds, 120),
    },
    {
      question_type: "short_answer",
      question_text: "Define Cross-Site Request Forgery (CSRF) and explain how SameSite cookie policies and Anti-CSRF tokens defend against it.",
      options: [],
      correct_answer: "CSRF occurs when an unauthorized script tricks an authenticated user's browser into executing unwanted actions on a trusted site. Anti-CSRF tokens provide unique, unpredictable server-validated secrets, and SameSite=Lax/Strict restricts cookie transmission on cross-site requests.",
      explanation: "Anti-CSRF tokens and SameSite cookies ensure that only requests originating genuinely from the expected application UI are authenticated.",
      max_points: 10,
      time_limit_seconds: Math.max(defaultTimeSeconds, 90),
    }
  ];

  // Append extra questions if needed to reach requestedCount
  for (const extraQ of extraPool) {
    if (questions.length >= requestedCount) break;
    addQ(extraQ);
  }

  // Adjust timers according to defaultTimeSeconds if user chose custom timer
  const finalQuestions = questions.slice(0, requestedCount).map((q, idx) => ({
    ...q,
    id: q.id || `q_${idx + 1}`,
    time_limit_seconds: q.time_limit_seconds || defaultTimeSeconds,
    max_points: q.max_points || 10
  }));

  return { questions: finalQuestions };
}

function formatQuestionTypes(types?: string[]): string {
  if (!types || types.length === 0) return "Multiple Choice (MCQ), Scenario-Based Assessment";
  const labelMap: Record<string, string> = {
    mcq: "Multiple Choice Questions (MCQ)",
    multiple_choice: "Multiple Choice Questions (MCQ)",
    coding: "Live Code Implementation & Automated Test Verification",
    scenario: "Real-World Industrial Scenario Analysis",
    aptitude: "Quantitative & Analytical Aptitude",
    subjective: "Subjective & Architectural Review",
    long_answer: "Comprehensive Technical Analysis",
    short_answer: "Concise Technical Theory",
    true_false: "Core Concept Validation (True/False)"
  };
  return types.map(t => labelMap[t.toLowerCase()] || t.toUpperCase()).join(", ");
}

interface SendCbtAssignmentEmailInput {
  to: string;
  internName: string;
  internId?: string;
  internRole?: string;
  examId?: string;
  testId?: string;
  testTitle: string;
  description?: string;
  totalQuestions?: number;
  timeLimitMinutes?: number;
  questionTypes?: string[];
  maxAttempts?: number;
  totalScore?: number;
  passingScore?: number;
  enableCamera?: boolean;
  cameraStrictness?: string;
  deadline?: string | null;
  isExtension?: boolean;
}

async function sendCbtAssignmentEmail(params: SendCbtAssignmentEmailInput) {
  const {
    to,
    internName: initialInternName,
    testTitle,
    description,
    timeLimitMinutes = 30,
    passingScore = 50,
    enableCamera = true,
    cameraStrictness = "standard",
    deadline,
    isExtension = false,
  } = params;

  const adminClient = getAdminClient();
  const resolvedExamId = params.examId || params.testId || "EXAM-VYN-CBT";

  // Dynamic candidate profile enrichment if internId or internRole is missing
  let internName = initialInternName || "Candidate";
  let internId = params.internId;
  let internRole = params.internRole;

  if ((!internId || !internRole || internName === "Candidate" || internName === "Intern") && to) {
    try {
      const { data: prof } = await adminClient
        .from('profiles')
        .select('id, intern_id, position, department, full_name')
        .eq('email', to)
        .maybeSingle();
      if (prof) {
        if (!internId) internId = prof.intern_id || `VCS-INT-${prof.id?.slice(0, 8)?.toUpperCase() || "PROV"}`;
        if (!internRole) internRole = prof.position || prof.department || "Technical Intern";
        if (internName === "Candidate" || internName === "Intern") internName = prof.full_name || internName;
      }
    } catch (_) {}
  }
  internId = internId || "VCS-INT-2026-PROV";
  internRole = internRole || "Technical Intern";

  // Dynamic question counts and scoring enrichment if not passed
  let totalQuestions = params.totalQuestions || 0;
  let totalScore = params.totalScore || 0;
  let questionTypes = params.questionTypes || [];
  let maxAttempts = params.maxAttempts || 1;

  if (totalQuestions === 0 && resolvedExamId) {
    try {
      const { data: qData } = await adminClient
        .from('cbt_questions')
        .select('question_type, max_points')
        .or(`exam_id.eq.${resolvedExamId},test_id.eq.${resolvedExamId}`);
      if (qData && qData.length > 0) {
        totalQuestions = qData.length;
        totalScore = totalScore || qData.reduce((acc: number, q: any) => acc + (Number(q.max_points) || 10), 0);
        if (questionTypes.length === 0) {
          questionTypes = Array.from(new Set(qData.map((q: any) => q.question_type || 'mcq')));
        }
      }
    } catch (_) {}
  }
  if (totalQuestions === 0) totalQuestions = 10;
  if (totalScore === 0) totalScore = totalQuestions * 10;

  const brevoKey = getEnv("BREVO_API_KEY");
  const resendKey = getEnv("RESEND_API_KEY");

  if (!brevoKey && !resendKey) {
    console.warn("[CBT Email] Neither BREVO_API_KEY nor RESEND_API_KEY configured; skipping dispatch.");
    return { sent: false, reason: "No email API key configured" };
  }

  const subject = isExtension
    ? `[VyNexa Connect] Assessment Deadline Extended: ${testTitle} (Exam ID: ${resolvedExamId})`
    : `[VyNexa Connect] Official CBT Assessment Allocation: ${testTitle} (Exam ID: ${resolvedExamId})`;

  const appUrl = "https://vynexaconnect.vyntyraconsultancyservices.in";
  const examUrl = `${appUrl}/cbt/${resolvedExamId}`;
  const formattedDeadline = deadline
    ? new Date(deadline).toLocaleString("en-US", {
        dateStyle: "medium",
        timeStyle: "short",
      })
    : "No expiration deadline (Continuous evaluation)";

  const formattedTypes = formatQuestionTypes(questionTypes);
  const proctoringLabel = enableCamera !== false 
    ? `Webcam AI Monitoring Required (${cameraStrictness.toUpperCase()} enforcement)` 
    : "Focus Tracking Active (Camera Not Mandatory)";

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f1f5f9; margin: 0; padding: 32px 12px; color: #1e293b; line-height: 1.5;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 660px; margin: 0 auto; background-color: #ffffff; border-radius: 14px; overflow: hidden; border: 1px solid #cbd5e1; box-shadow: 0 10px 25px -5px rgba(15, 23, 42, 0.08);">
    
    <!-- Top Accent Bar -->
    <tr>
      <td style="background: linear-gradient(90deg, #4f46e5 0%, #06b6d4 50%, #4f46e5 100%); height: 5px;"></td>
    </tr>

    <!-- Header Block -->
    <tr>
      <td style="background-color: #0b0f19; padding: 32px 28px; text-align: center;">
        <div style="display: inline-block; background-color: rgba(99, 102, 241, 0.2); border: 1px solid rgba(129, 140, 248, 0.4); border-radius: 9999px; padding: 4px 14px; margin-bottom: 12px;">
          <span style="color: #a5b4fc; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 1.5px;">
            ${isExtension ? "DEADLINE EXTENSION NOTICE" : "OFFICIAL CBT ASSESSMENT ALLOCATION"}
          </span>
        </div>
        <h1 style="color: #ffffff; margin: 0 0 6px; font-size: 22px; font-weight: 800; letter-spacing: 0.5px;">
          VYNTYRA CONSULTANCY SERVICES
        </h1>
        <p style="color: #94a3b8; margin: 0; font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px;">
          VyNexa Connect • Computer-Based Testing (CBT) System
        </p>
      </td>
    </tr>

    <!-- Main Content Area -->
    <tr>
      <td style="padding: 32px 28px;">
        <h2 style="color: #0f172a; font-size: 19px; font-weight: 700; margin-top: 0; margin-bottom: 8px;">
          ${isExtension ? "Assessment Deadline Notice" : "New Assessment Allocated"}
        </h2>
        <p style="color: #475569; font-size: 14px; line-height: 1.6; margin-top: 0; margin-bottom: 22px;">
          Dear <strong>${internName}</strong>,<br/>
          ${
            isExtension
              ? `The submission deadline for your assigned evaluation assessment has been officially updated. Please ensure your submission is completed within the revised timeline specified below.`
              : `You have been allocated an official evaluation assessment on the VyNexa Connect enterprise testing engine. Review your candidate details, examination specifications, and proctoring rules carefully before launching.`
          }
        </p>

        <!-- Candidate & Assessment Details Card -->
        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f8fafc; border-radius: 10px; border: 1px solid #e2e8f0; margin-bottom: 26px; overflow: hidden;">
          <tr>
            <td colspan="2" style="background-color: #f1f5f9; padding: 12px 18px; border-bottom: 1px solid #e2e8f0;">
              <span style="color: #0f172a; font-size: 13px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px;">
                Candidate &amp; Examination Credentials
              </span>
            </td>
          </tr>
          <tr>
            <td style="padding: 10px 18px; border-bottom: 1px solid #f1f5f9; width: 40%;"><span style="color: #64748b; font-size: 13px; font-weight: 600;">Candidate Name:</span></td>
            <td style="padding: 10px 18px; border-bottom: 1px solid #f1f5f9; width: 60%;"><strong style="color: #0f172a; font-size: 13px;">${internName}</strong></td>
          </tr>
          <tr>
            <td style="padding: 10px 18px; border-bottom: 1px solid #f1f5f9;"><span style="color: #64748b; font-size: 13px; font-weight: 600;">Intern ID:</span></td>
            <td style="padding: 10px 18px; border-bottom: 1px solid #f1f5f9;"><code style="color: #4f46e5; background-color: #eef2ff; padding: 2px 8px; border-radius: 4px; font-weight: 700; font-size: 12px;">${internId}</code></td>
          </tr>
          <tr>
            <td style="padding: 10px 18px; border-bottom: 1px solid #f1f5f9;"><span style="color: #64748b; font-size: 13px; font-weight: 600;">Intern Role / Domain:</span></td>
            <td style="padding: 10px 18px; border-bottom: 1px solid #f1f5f9;"><strong style="color: #0f172a; font-size: 13px;">${internRole}</strong></td>
          </tr>
          <tr>
            <td style="padding: 10px 18px; border-bottom: 1px solid #f1f5f9;"><span style="color: #64748b; font-size: 13px; font-weight: 600;">Unique Exam ID:</span></td>
            <td style="padding: 10px 18px; border-bottom: 1px solid #f1f5f9;"><code style="color: #0369a1; background-color: #e0f2fe; padding: 2px 8px; border-radius: 4px; font-weight: 700; font-size: 11px;">${resolvedExamId}</code></td>
          </tr>
          <tr>
            <td style="padding: 10px 18px; border-bottom: 1px solid #f1f5f9;"><span style="color: #64748b; font-size: 13px; font-weight: 600;">Assessment Name:</span></td>
            <td style="padding: 10px 18px; border-bottom: 1px solid #f1f5f9;"><strong style="color: #0f172a; font-size: 13px;">${testTitle}</strong></td>
          </tr>
          ${
            description
              ? `<tr>
            <td style="padding: 10px 18px; border-bottom: 1px solid #f1f5f9;"><span style="color: #64748b; font-size: 13px; font-weight: 600;">Description:</span></td>
            <td style="padding: 10px 18px; border-bottom: 1px solid #f1f5f9;"><span style="color: #334155; font-size: 13px;">${description}</span></td>
          </tr>`
              : ""
          }
          <tr>
            <td style="padding: 10px 18px; border-bottom: 1px solid #f1f5f9;"><span style="color: #64748b; font-size: 13px; font-weight: 600;">Total Questions:</span></td>
            <td style="padding: 10px 18px; border-bottom: 1px solid #f1f5f9;"><strong style="color: #0f172a; font-size: 13px;">${totalQuestions} Questions</strong></td>
          </tr>
          <tr>
            <td style="padding: 10px 18px; border-bottom: 1px solid #f1f5f9;"><span style="color: #64748b; font-size: 13px; font-weight: 600;">Assessment Duration:</span></td>
            <td style="padding: 10px 18px; border-bottom: 1px solid #f1f5f9;"><strong style="color: #0f172a; font-size: 13px;">${timeLimitMinutes} Minutes</strong></td>
          </tr>
          <tr>
            <td style="padding: 10px 18px; border-bottom: 1px solid #f1f5f9;"><span style="color: #64748b; font-size: 13px; font-weight: 600;">Question Types:</span></td>
            <td style="padding: 10px 18px; border-bottom: 1px solid #f1f5f9;"><span style="color: #334155; font-size: 12px; font-weight: 600;">${formattedTypes}</span></td>
          </tr>
          <tr>
            <td style="padding: 10px 18px; border-bottom: 1px solid #f1f5f9;"><span style="color: #64748b; font-size: 13px; font-weight: 600;">Allowed Attempts:</span></td>
            <td style="padding: 10px 18px; border-bottom: 1px solid #f1f5f9;"><strong style="color: #0f172a; font-size: 13px;">${maxAttempts} Attempt(s) (Single Active Session)</strong></td>
          </tr>
          <tr>
            <td style="padding: 10px 18px; border-bottom: 1px solid #f1f5f9;"><span style="color: #64748b; font-size: 13px; font-weight: 600;">Total Score / Passing:</span></td>
            <td style="padding: 10px 18px; border-bottom: 1px solid #f1f5f9;"><strong style="color: #059669; font-size: 13px;">${totalScore} Marks (Passing: ${passingScore}%)</strong></td>
          </tr>
          <tr>
            <td style="padding: 10px 18px; border-bottom: 1px solid #f1f5f9;"><span style="color: #64748b; font-size: 13px; font-weight: 600;">Proctoring Mode:</span></td>
            <td style="padding: 10px 18px; border-bottom: 1px solid #f1f5f9;"><span style="color: ${enableCamera !== false ? "#b91c1c" : "#0284c7"}; font-size: 12px; font-weight: 700;">${proctoringLabel}</span></td>
          </tr>
          <tr>
            <td style="padding: 10px 18px;"><span style="color: #64748b; font-size: 13px; font-weight: 600;">Submission Deadline:</span></td>
            <td style="padding: 10px 18px;"><strong style="color: #e11d48; font-size: 13px;">${formattedDeadline}</strong></td>
          </tr>
        </table>

        <!-- CBT Model Instructions & Guidelines -->
        <div style="background-color: #fffbeb; border: 1px solid #fef3c7; border-left: 4px solid #f59e0b; border-radius: 8px; padding: 18px; margin-bottom: 26px;">
          <h3 style="color: #92400e; font-size: 14px; font-weight: 800; margin: 0 0 10px; text-transform: uppercase; letter-spacing: 0.5px;">
            Mandatory CBT Instructions &amp; Proctoring Rules
          </h3>
          <ul style="color: #78350f; font-size: 12px; margin: 0; padding-left: 18px; line-height: 1.7;">
            <li><strong>Desktop / Laptop Only:</strong> Access is strictly restricted to desktop browsers (screen width &ge; 1024px). Mobile devices and tablets are blocked.</li>
            <li><strong>Browser Recommendation:</strong> Use the latest stable version of Google Chrome or Microsoft Edge. Ensure all browser extensions and ad-blockers are disabled.</li>
            <li><strong>Camera &amp; Audio Readiness:</strong> ${enableCamera !== false ? "Active HD webcam access is mandatory. The AI proctor continuously monitors candidate presence, facial orientation, and multiple face infractions." : "Focus-tracking is enforced throughout your assessment."}</li>
            <li><strong>Full-Screen Lockdown:</strong> The assessment operates in forced full-screen mode. Do not press ESC or attempt to exit full-screen mode during the exam.</li>
            <li><strong>Anti-Malpractice Protocol:</strong> Tab-switching, Alt-Tabbing, minimizing the window, opening developer tools (F12/Inspect), or right-clicking is logged immediately. <strong>Accumulating two (2) infractions results in instantaneous test termination.</strong></li>
            <li><strong>Continuous Timer &amp; Autosave:</strong> The timer runs continuously in real time. Answers are autosaved as you progress. Upon timer expiration (00:00:00), the exam will auto-freeze and submit.</li>
          </ul>
        </div>

        <!-- Call-to-Action Launch Button -->
        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="text-align: center; margin-bottom: 28px;">
          <tr>
            <td align="center">
              <a href="${examUrl}" style="display: inline-block; background-color: #4f46e5; color: #ffffff; font-size: 15px; font-weight: 700; text-decoration: none; padding: 15px 36px; border-radius: 8px; box-shadow: 0 4px 10px rgba(79, 70, 229, 0.35); letter-spacing: 0.3px;">
                Launch Assessment Session &rarr;
              </a>
              <p style="color: #64748b; font-size: 11px; margin: 10px 0 0;">
                Direct URL: <a href="${examUrl}" style="color: #4f46e5; text-decoration: underline;">${examUrl}</a>
              </p>
            </td>
          </tr>
        </table>

        <!-- Official Sign-off & Signature Block -->
        <div style="border-top: 1px solid #e2e8f0; padding-top: 20px; margin-top: 10px;">
          <p style="color: #334155; font-size: 13px; font-weight: 700; margin: 0 0 2px;">
            VyNexa Technical Evaluation &amp; Assessment Board
          </p>
          <p style="color: #64748b; font-size: 12px; font-weight: 600; margin: 0 0 2px;">
            Vyntyra Consultancy Services Private Limited
          </p>
          <p style="color: #94a3b8; font-size: 11px; margin: 0 0 4px;">
            Enterprise Talent Acquisition &amp; Performance Operations Division
          </p>
          <p style="color: #64748b; font-size: 11px; margin: 0;">
            Support: <a href="mailto:careers@vyntyraconsultancyservices.in" style="color: #4f46e5; text-decoration: none;">careers@vyntyraconsultancyservices.in</a> | 
            Portal: <a href="${appUrl}" style="color: #4f46e5; text-decoration: none;">vynexaconnect.vyntyraconsultancyservices.in</a>
          </p>
        </div>

      </td>
    </tr>

    <!-- Confidentiality Notice & Legal Disclaimer -->
    <tr>
      <td style="background-color: #f8fafc; padding: 22px 28px; border-top: 1px solid #e2e8f0;">
        <div style="background-color: #f1f5f9; border: 1px solid #e2e8f0; border-radius: 6px; padding: 12px 14px; margin-bottom: 12px;">
          <p style="color: #475569; font-size: 10px; line-height: 1.5; margin: 0;">
            <strong>CONFIDENTIALITY &amp; PROPRIETARY ASSESSMENT NOTICE:</strong> This electronic transmission and the embedded examination materials contain proprietary, confidential, and legally protected information owned by Vyntyra Consultancy Services Private Limited. This assessment is exclusively designated for the candidate identified above (<strong>${internName}</strong>, ID: <strong>${internId}</strong>). Any unauthorized reproduction, recording, screenshotting, sharing, public posting, or distribution of any part of this test or its solutions is strictly prohibited under the terms of your Internship Confidentiality Agreement and Non-Disclosure Agreement (NDA). Infractions will lead to immediate cancellation of your internship program, voiding of certifications, and potential legal remedies.
          </p>
        </div>
        <p style="color: #64748b; font-size: 11px; text-align: center; margin: 0 0 2px;">
          &copy; ${new Date().getFullYear()} Vyntyra Consultancy Services. All rights reserved.
        </p>
        <p style="color: #94a3b8; font-size: 10px; text-align: center; margin: 0;">
          Automated Transmission from VyNexa Secure Evaluation Engine.
        </p>
      </td>
    </tr>

  </table>
</body>
</html>`;

  let messageId: string | null = null;
  let providerUsed: "brevo" | "resend" = "brevo";
  let dispatchError: string | null = null;

  // 1. Primary: Brevo Email API (as requested by user)
  if (brevoKey) {
    try {
      const bRes = await fetch("https://api.brevo.com/v3/smtp/email", {
        method: "POST",
        headers: {
          "accept": "application/json",
          "content-type": "application/json",
          "api-key": brevoKey,
        },
        body: JSON.stringify({
          sender: {
            name: "Vyntyra Assessments • VyNexa Connect",
            email: "careers@vyntyraconsultancyservices.in",
          },
          to: [{ email: to, name: internName }],
          replyTo: {
            email: "careers@vyntyraconsultancyservices.in",
            name: "VyNexa Technical Evaluation Board",
          },
          subject,
          htmlContent: html,
        }),
      });

      const bData = await bRes.json().catch(() => ({}));
      if (bRes.ok) {
        messageId = bData.messageId || bData.id || `brevo-${Date.now()}`;
        providerUsed = "brevo";
      } else {
        const errMsg = bData.message || bData.code || `Brevo HTTP error ${bRes.status}`;
        console.warn("[cbt-email] Brevo primary dispatch failed, falling back to Resend:", errMsg);
        dispatchError = errMsg;
      }
    } catch (bErr: any) {
      console.warn("[cbt-email] Brevo request exception, falling back to Resend:", bErr.message);
      dispatchError = bErr.message;
    }
  }

  // 2. Secondary Fallback: Resend (if Brevo failed or Brevo key missing)
  if (!messageId && resendKey) {
    try {
      const { Resend } = await import("resend");
      const resend = new Resend(resendKey);
      let result = await resend.emails.send({
        from: `VyNexa Connect <careers@vyntyraconsultancyservices.in>`,
        to,
        subject,
        html,
      });

      if (result.error && (result.error.message.includes("domain") || result.error.message.includes("verify") || result.error.message.includes("validation"))) {
        result = await resend.emails.send({
          from: `VyNexa Connect <onboarding@resend.dev>`,
          to,
          subject,
          html,
        });
      }

      if (!result.error && result.data?.id) {
        messageId = result.data.id;
        providerUsed = "resend";
        dispatchError = null;
      } else if (result.error) {
        dispatchError = result.error.message;
      }
    } catch (rErr: any) {
      console.error("[cbt-email] Resend fallback error:", rErr.message);
      dispatchError = rErr.message;
    }
  }

  // 3. Log to automated_email_logs & automated_emails_log
  try {
    await adminClient.from("automated_email_logs").insert({
      recipient_email: to,
      recipient_name: internName,
      campaign_type: isExtension ? "cbt_deadline_extension" : "cbt_assessment_assigned",
      subject,
      status: messageId ? "sent" : "failed",
      provider_used: providerUsed,
      resend_message_id: messageId,
      error_message: dispatchError,
      created_at: new Date().toISOString(),
    });
  } catch (_) {}

  try {
    await adminClient.from("automated_emails_log").insert({
      recipient_email: to,
      recipient_name: internName,
      domain: internRole || "Technology",
      subject,
      status: messageId ? "sent" : "failed",
      provider: providerUsed,
      provider_message_id: messageId,
      error_message: dispatchError,
      sent_at: new Date().toISOString(),
    });
  } catch (_) {}

  if (messageId) {
    return { sent: true, id: messageId, provider: providerUsed };
  } else {
    return { sent: false, reason: dispatchError || "Email dispatch failed" };
  }
}

export const saveGeneratedTestFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({
    testMetadata: z.any(),
    questions: z.array(z.any())
  }).parse(d))
  .handler(async ({ data: args, context }) => {
    const adminClient = getAdminClient();
    const userId = context.user.id;
    
    const { 
      title, 
      description, 
      target_type, 
      target_id, 
      target_ids,
      target_intern_ids,
      target_team_ids,
      passing_score, 
      time_limit_minutes, 
      enable_camera, 
      camera_strictness,
      deadline, 
      shuffle_questions,
      show_instant_results,
      max_attempts,
      category 
    } = args.testMetadata;
    
    // Multi-target resolution: support arrays of interns and teams
    let resolvedInternIds: string[] = [];
    let resolvedTeamIds: string[] = [];

    if (Array.isArray(target_intern_ids)) {
      resolvedInternIds.push(...target_intern_ids.filter(Boolean));
    }
    if (Array.isArray(target_team_ids)) {
      resolvedTeamIds.push(...target_team_ids.filter(Boolean));
    }

    // Process target_ids or target_id based on target_type
    const rawTargetPool: string[] = [];
    if (Array.isArray(target_ids)) {
      rawTargetPool.push(...target_ids.filter(Boolean));
    }
    if (Array.isArray(target_id)) {
      rawTargetPool.push(...target_id.filter(Boolean));
    } else if (typeof target_id === 'string' && target_id && target_id !== 'none') {
      rawTargetPool.push(target_id.trim());
    }

    if (target_type === 'team') {
      resolvedTeamIds.push(...rawTargetPool);
    } else if (target_type === 'intern' || target_type === 'manual') {
      resolvedInternIds.push(...rawTargetPool);
    }

    // Dedup
    resolvedInternIds = Array.from(new Set(resolvedInternIds.filter(Boolean)));
    resolvedTeamIds = Array.from(new Set(resolvedTeamIds.filter(Boolean)));

    const allocationMode = resolvedTeamIds.length > 0 && resolvedInternIds.length === 0 ? 'team' : 'individual';

    // 1. Create the CBT Exam with graceful multi-tier fallback
    const fullPayload: any = {
      title: title || 'New AI CBT Exam',
      description: description || 'Generated AI Assessment',
      category: category || 'General',
      passing_score: Number(passing_score) || 50,
      created_by: userId,
      status: 'published',
      allocation_mode: allocationMode,
      team_ids: resolvedTeamIds,
      intern_ids: resolvedInternIds,
      time_limit_minutes: Number(time_limit_minutes) || 30,
      enable_camera: enable_camera !== false,
      camera_required: enable_camera !== false,
      camera_strictness: camera_strictness || 'standard',
      deadline: deadline || null,
      shuffle_questions: Boolean(shuffle_questions),
      show_instant_results: show_instant_results !== false,
      max_attempts: Number(max_attempts) || 1,
      pdf_url: null,
      csv_url: null,
    };

    let exam: any = null;
    let examInsertRes = await adminClient.from('cbt_exams').insert(fullPayload).select('id, title, passing_score, time_limit_minutes').single();

    if (examInsertRes.error) {
      console.warn("[saveGeneratedTestFn] Primary insert failed, trying reduced payload:", examInsertRes.error.message);
      const reducedPayload = {
        title: title || 'New AI CBT Exam',
        description: description || 'Generated AI Assessment',
        category: category || 'General',
        passing_score: Number(passing_score) || 50,
        created_by: userId,
        status: 'published',
        allocation_mode: allocationMode,
        team_ids: resolvedTeamIds,
        intern_ids: resolvedInternIds,
        time_limit_minutes: Number(time_limit_minutes) || 30,
        enable_camera: enable_camera !== false,
        camera_required: enable_camera !== false,
        deadline: deadline || null,
      };
      examInsertRes = await adminClient.from('cbt_exams').insert(reducedPayload).select('id, title, passing_score, time_limit_minutes').single();
    }

    if (examInsertRes.error) {
      console.warn("[saveGeneratedTestFn] Reduced insert failed, trying base table columns:", examInsertRes.error.message);
      const basePayload = {
        title: title || 'New AI CBT Exam',
        description: description || 'Generated AI Assessment',
        category: category || 'General',
        passing_score: Number(passing_score) || 50,
        created_by: userId,
        status: 'published',
        allocation_mode: allocationMode,
        team_ids: resolvedTeamIds,
        intern_ids: resolvedInternIds,
      };
      examInsertRes = await adminClient.from('cbt_exams').insert(basePayload).select('id, title, passing_score, time_limit_minutes').single();
    }

    if (examInsertRes.error || !examInsertRes.data) {
      throw new Error("Failed to create CBT Exam: " + (examInsertRes.error?.message || "Unknown error"));
    }

    exam = examInsertRes.data;

    // 2. Insert Questions into cbt_questions with robust multi-column schema fallback
    const questionsToInsert = args.questions.map((q: any, i: number) => ({
      exam_id: exam.id,
      question_text: q.question_text || `Question ${i + 1}`,
      question_type: q.question_type || 'mcq',
      options: typeof q.options === 'string' ? JSON.parse(q.options) : (q.options || {}),
      correct_answer: typeof q.correct_answer === 'object' && q.correct_answer !== null
        ? (q.correct_answer.id || JSON.stringify(q.correct_answer))
        : String(q.correct_answer ?? ''),
      time_limit_seconds: Number(q.time_limit_seconds) || 60,
      max_points: Number(q.max_points) || 10,
      order_index: i
    }));

    let candidateQuestions: any[] = questionsToInsert;
    let qInsertRes = await adminClient.from('cbt_questions').insert(candidateQuestions);

    if (qInsertRes.error) {
      console.warn("[saveGeneratedTestFn] First insert attempt failed:", qInsertRes.error.message);
      
      // If error indicates exam_id column not found, fallback to test_id
      if (qInsertRes.error.message.includes("exam_id")) {
        console.info("[saveGeneratedTestFn] Retrying question insert with 'test_id' instead of 'exam_id'");
        candidateQuestions = candidateQuestions.map(({ exam_id, ...rest }) => ({
          ...rest,
          test_id: exam.id
        }));
        qInsertRes = await adminClient.from('cbt_questions').insert(candidateQuestions);
      }

      // If error mentions max_points or time_limit_seconds, strip unsupported columns
      if (qInsertRes.error && (qInsertRes.error.message.includes("max_points") || qInsertRes.error.message.includes("time_limit_seconds"))) {
        console.info("[saveGeneratedTestFn] Retrying question insert without extended timer/points columns");
        candidateQuestions = candidateQuestions.map(({ max_points, time_limit_seconds, ...rest }: any) => rest);
        qInsertRes = await adminClient.from('cbt_questions').insert(candidateQuestions);
      }

      if (qInsertRes.error) {
        throw new Error("Failed to insert CBT questions into Supabase: " + qInsertRes.error.message);
      }
    }

    // 3. Automated Branded PDF & CSV Question Paper Generation (Stored in Cloudflare R2)
    let generatedPdfUrl = "";
    let generatedCsvUrl = "";
    try {
      const { exportAndStoreExamPaper } = await import("./cbt-exam-export.server");
      
      const targetLabels: string[] = [];
      if (resolvedInternIds.length > 0) {
        const { data: profs } = await adminClient.from('profiles').select('full_name, email').in('id', resolvedInternIds.slice(0, 5));
        if (profs) targetLabels.push(...profs.map(p => p.full_name || p.email));
        if (resolvedInternIds.length > 5) targetLabels.push(`+${resolvedInternIds.length - 5} more candidates`);
      }
      if (resolvedTeamIds.length > 0) {
        targetLabels.push(...resolvedTeamIds.map(t => `Team: ${t}`));
      }

      const exportResult = await exportAndStoreExamPaper({
        exam: { ...fullPayload, id: exam.id },
        questions: args.questions,
        targetLabels
      });

      generatedPdfUrl = exportResult.pdfUrl;
      generatedCsvUrl = exportResult.csvUrl;

      if (generatedPdfUrl || generatedCsvUrl) {
        await adminClient.from('cbt_exams').update({
          pdf_url: generatedPdfUrl || null,
          csv_url: generatedCsvUrl || null
        }).eq('id', exam.id);
      }
    } catch (paperErr) {
      console.error("[saveGeneratedTestFn] Branded Paper generation notice:", paperErr);
    }

    invalidateCache("admin_cbt_tests");

    // 4. Automated Candidate Notification Emails via Brevo
    try {
      let targetEmails: { email: string; name: string; internId?: string; internRole?: string }[] = [];
      if (resolvedInternIds.length > 0) {
        const { data: profiles } = await adminClient
          .from('profiles')
          .select('id, email, full_name, intern_id, position, department')
          .in('id', resolvedInternIds);
        if (profiles) {
          targetEmails.push(...profiles.map(p => ({ 
            email: p.email, 
            name: p.full_name || "Intern",
            internId: p.intern_id || `VCS-INT-${p.id.slice(0, 8).toUpperCase()}`,
            internRole: p.position || p.department || "Technical Intern"
          })));
        }
      }
      if (resolvedTeamIds.length > 0) {
        const { data: taskProfiles } = await adminClient
          .from('tasks')
          .select('assigned_to, profiles:assigned_to(id, email, full_name, intern_id, position, department)')
          .in('team_id', resolvedTeamIds);
        if (taskProfiles) {
          const seen = new Set(targetEmails.map(t => t.email));
          for (const t of taskProfiles) {
            const prof: any = t.profiles;
            if (prof?.email && !seen.has(prof.email)) {
              seen.add(prof.email);
              targetEmails.push({ 
                email: prof.email, 
                name: prof.full_name || "Intern",
                internId: prof.intern_id || `VCS-INT-${prof.id?.slice(0, 8)?.toUpperCase() || "PROV"}`,
                internRole: prof.position || prof.department || "Technical Intern"
              });
            }
          }
        }
      }

      const totalQuestions = args.questions.length;
      const totalScore = args.questions.reduce((sum: number, q: any) => sum + (Number(q.max_points) || 10), 0);
      const questionTypes = Array.from(new Set(args.questions.map((q: any) => q.question_type || 'mcq')));

      for (const target of targetEmails) {
        if (target.email) {
          await sendCbtAssignmentEmail({
            to: target.email,
            internName: target.name,
            internId: target.internId,
            internRole: target.internRole,
            examId: exam.id,
            testId: exam.id,
            testTitle: title || 'New Assessment',
            description,
            totalQuestions,
            timeLimitMinutes: Number(time_limit_minutes) || 30,
            questionTypes,
            maxAttempts: Number(max_attempts) || 1,
            totalScore,
            passingScore: Number(passing_score) || 50,
            enableCamera: enable_camera !== false,
            cameraStrictness: camera_strictness || 'standard',
            deadline,
            isExtension: false
          });
        }
      }
    } catch (emailErr) {
      console.warn("[saveGeneratedTestFn] Automated email dispatch encountered an issue:", emailErr);
    }

    const totalAssignedCount = resolvedInternIds.length + resolvedTeamIds.length;
    return { 
      success: true, 
      testId: exam.id, 
      pdfUrl: generatedPdfUrl,
      csvUrl: generatedCsvUrl,
      message: `Exam successfully created and assigned to ${totalAssignedCount > 0 ? `${totalAssignedCount} candidate/team targets` : "candidates"}! Branded PDF question paper & CSV generated and stored securely.` 
    };
  });

export const getInternTestSessionFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ testId: z.string() }).parse(d))
  .handler(async ({ data: args, context }) => {
    const adminClient = getAdminClient();
    
    const [{ data: test, error: testErr }, { data: questions, error: qErr }, { data: profile }] = await Promise.all([
      adminClient.from('cbt_exams').select('*').eq('id', args.testId).single(),
      adminClient.from('cbt_questions').select('*').eq('exam_id', args.testId).order('order_index', { ascending: true }),
      adminClient.from('profiles').select('id, intern_id, employee_id, full_name, email').eq('id', context.user.id).single()
    ]);
    if (testErr || !test) throw new Error("Test not found");
    
    let questionsData = questions;
    if (qErr && qErr.message?.includes("exam_id")) {
      const { data: fallbackQ } = await adminClient
        .from('cbt_questions')
        .select('*')
        .eq('test_id', args.testId)
        .order('order_index', { ascending: true });
      questionsData = fallbackQ;
    }

    let safeQuestions = (questionsData || []).map((q: any) => {
      let options = q.options;
      try { if (typeof options === 'string') options = JSON.parse(options); } catch (e) {}
      return {
        id: q.id,
        question_type: q.question_type,
        question_text: q.question_text,
        options: options,
        max_points: q.max_points || 10,
        time_limit_seconds: q.time_limit_seconds || 60
      };
    });

    if (test.shuffle_questions) {
      safeQuestions = [...safeQuestions].sort(() => Math.random() - 0.5);
    }

    const candidateId = profile?.intern_id || profile?.employee_id || (test.intern_ids && test.intern_ids[0]) || context.user.id.slice(0, 8).toUpperCase();
    
    return { 
      test: {
        ...test,
        internId: candidateId,
        internName: profile?.full_name || profile?.email || "Candidate"
      }, 
      questions: safeQuestions,
      internId: candidateId
    };
  });

export const submitCbtExamFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({
    testId: z.string(),
    answers: z.any(),
    proctoringLogs: z.any()
  }).parse(d))
  .handler(async ({ data: args, context }) => {
    const adminClient = getAdminClient();
    const userId = context.user.id;
    
    const { data: sub, error: subErr } = await adminClient.from('cbt_submissions').insert({
      exam_id: args.testId,
      intern_id: userId,
      status: "submitted",
      submitted_at: new Date().toISOString()
    }).select().single();
      
    if (subErr || !sub) throw new Error("Failed to save submission");

    const subId = sub.id;

    let pLogs = args.proctoringLogs || [];
    try { if (typeof pLogs === 'string') pLogs = JSON.parse(pLogs); } catch(e){}

    if (Array.isArray(pLogs) && pLogs.length > 0) {
      await adminClient.from('cbt_malpractice_logs').insert(
        pLogs.map((l: any) => ({
           submission_id: subId,
           infraction_type: l.reason,
           description: JSON.stringify(l),
           timestamp: l.time || new Date().toISOString()
        }))
      );
    }

    // Trigger grading via AI Gateway immediately
    let { data: questions, error: qErr } = await adminClient.from('cbt_questions').select('*').eq('exam_id', args.testId);
    if (!questions || questions.length === 0 || (qErr && qErr.message?.includes("exam_id"))) {
      const qFallback = await adminClient.from('cbt_questions').select('*').eq('test_id', args.testId);
      if (qFallback.data && qFallback.data.length > 0) {
        questions = qFallback.data;
      }
    }
    const { data: test } = await adminClient.from('cbt_exams').select('*').eq('id', args.testId).single();
    
    let totalScore = 0;
    
    let answersObj = args.answers;
    try { if (typeof answersObj === 'string') answersObj = JSON.parse(answersObj); } catch (e) {}

    let insertAnswers: any[] = [];
    let globalAiFeedback: any = {};
    let questionsReview: any[] = [];

    for (const q of (questions || [])) {
      const internAnswer = answersObj ? answersObj[q.id] : null;
      let correctAnswer = q.correct_answer;
      try { if (typeof correctAnswer === 'string') correctAnswer = JSON.parse(correctAnswer); } catch(e) {}
      
      let qScore = 0;
      let qFeedback = "";
      let isQuestionCorrect = false;
      let codingVerification: any = null;

      if (q.question_type === 'mcq' || q.question_type === 'true_false') {
        const isCorrect = internAnswer?.id === correctAnswer?.id || internAnswer === correctAnswer?.id || internAnswer === correctAnswer;
        qScore = isCorrect ? (q.max_points || 10) : 0;
        isQuestionCorrect = isCorrect;
        qFeedback = isCorrect ? 'Correct. Selected option matches verified solution.' : 'Incorrect. Option mismatch.';
        totalScore += qScore;
      } else if (q.question_type === 'coding') {
        const studentCode = typeof internAnswer === 'string' ? internAnswer.trim() : (internAnswer ? JSON.stringify(internAnswer) : "");
        if (!studentCode) {
          qScore = 0;
          isQuestionCorrect = false;
          qFeedback = "No code submitted. Output check failed.";
          codingVerification = {
            output_matches: false,
            passed_test_cases: 0,
            total_test_cases: 1,
            actual_output: "None (unanswered)",
            expected_output: "Refer to problem test cases",
            allocated_score: 0
          };
        } else {
          try {
            const prompt = `You are an automated code verification test runner and unit test judge.
EVALUATE CANDIDATE SUBMITTED CODE:
Problem: ${q.question_text}
Reference Context / Required Output / Expected Solution: ${JSON.stringify(correctAnswer)}
Candidate Submitted Code:
\`\`\`
${studentCode}
\`\`\`
Max Possible Points: ${q.max_points || 10}

Verification Instructions:
1. Determine whether the candidate code compiles/runs and produces the EXACT required output.
2. If required output is produced correctly, set output_matches to true and allocate full score (${q.max_points || 10}). If partially correct, allocate proportionate points. If non-working or wrong output, allocate 0.

Respond strictly in valid JSON format:
{
  "output_matches": boolean,
  "allocated_score": number,
  "passed_test_cases": number,
  "total_test_cases": number,
  "actual_output": "...",
  "expected_output": "...",
  "feedback": "..."
}`;
            const res = await generateAiJson<{
              output_matches: boolean;
              allocated_score: number;
              passed_test_cases: number;
              total_test_cases: number;
              actual_output: string;
              expected_output: string;
              feedback: string;
            }>({
              model: 'gemini-1.5-flash',
              prompt,
            });
            const resJson = res.data || ({} as any);
            const matches = Boolean(resJson.output_matches);
            qScore = typeof resJson.allocated_score === 'number' 
              ? resJson.allocated_score 
              : (matches ? (q.max_points || 10) : 0);
            isQuestionCorrect = matches || qScore >= ((q.max_points || 10) * 0.7);
            qFeedback = `${matches ? "✓ Required output verified & passed." : "✗ Required output check failed."} ${resJson.feedback || ""}`;
            codingVerification = {
              output_matches: matches,
              passed_test_cases: resJson.passed_test_cases ?? (matches ? 1 : 0),
              total_test_cases: resJson.total_test_cases ?? 1,
              actual_output: resJson.actual_output || "",
              expected_output: resJson.expected_output || "",
              allocated_score: qScore
            };
            totalScore += qScore;
          } catch (e) {
            console.error("[Coding verification error]:", e);
            qScore = 0;
            qFeedback = 'Automated verification error during evaluation.';
          }
        }
      } else {
        if (!internAnswer) {
          qFeedback = 'No answer provided.';
        } else {
          try {
            const prompt = `Evaluate this student answer strictly for technical correctness and provide constructive feedback.
Question: ${q.question_text}
Expected Answer Context: ${JSON.stringify(correctAnswer)}
Student Answer: ${JSON.stringify(internAnswer)}
Max Points Possible: ${q.max_points || 10}

Return JSON with exactly this schema: { "score": number, "feedback": "reasoning" }`;
            const res = await generateAiJson<{ score: number; feedback: string }>({
              model: 'gemini-1.5-flash',
              prompt,
            });
            const resJson = res.data || ({} as any);
            qScore = resJson.score || 0;
            qFeedback = resJson.feedback || "";
            isQuestionCorrect = qScore >= ((q.max_points || 10) * 0.6);
            totalScore += qScore;
          } catch (e) {
            qFeedback = 'Error grading with AI.';
          }
        }
      }

      globalAiFeedback[q.id] = { score: qScore, max: q.max_points, feedback: qFeedback, coding_verification: codingVerification };

      questionsReview.push({
        question_id: q.id,
        question_text: q.question_text,
        question_type: q.question_type,
        options: q.options,
        intern_answer: internAnswer,
        correct_answer: correctAnswer,
        explanation: q.explanation || "Official pre-marked solution.",
        test_cases: q.test_cases || null,
        coding_verification: codingVerification,
        is_correct: isQuestionCorrect,
        score: qScore,
        max_points: q.max_points || 10,
        feedback: qFeedback
      });

      insertAnswers.push({
         submission_id: subId,
         question_id: q.id,
         selected_option: (q.question_type === 'mcq' || q.question_type === 'true_false') ? JSON.stringify(internAnswer) : null,
         subjective_answer: (q.question_type !== 'mcq' && q.question_type !== 'true_false') ? JSON.stringify(internAnswer) : null,
         ai_score: qScore,
         ai_feedback: qFeedback
      });
    }

    if (insertAnswers.length > 0) {
      await adminClient.from('cbt_answers').insert(insertAnswers);
    }
    
    const maxPossibleScore = (questions || []).reduce((acc: number, curr: any) => acc + (curr.max_points || 10), 0) || 100;
    const percentage = Math.round((totalScore / maxPossibleScore) * 100);
    const passed = percentage >= (test?.passing_score || 50);

    const submissionSummary = {
      totalScore,
      maxPossibleScore,
      percentage,
      passed,
      passing_score: test?.passing_score || 50,
      questionsReview,
      submittedAt: new Date().toISOString()
    };
    
    await adminClient.from('cbt_submissions').update({
       total_score: totalScore,
       ai_feedback: JSON.stringify(submissionSummary),
       status: 'graded'
    }).eq('id', subId);
    
    invalidateCache("all_cbt_submissions");
    return { 
      success: true, 
      submissionId: subId, 
      score: totalScore, 
      maxPossibleScore, 
      percentage, 
      passed, 
      questionsReview 
    };
  });

export const listAdminTestsFn = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async (): Promise<any[]> => {
    return getOrSetCache("admin_cbt_tests", 10000, async () => {
      const adminClient = getAdminClient();
      const { data } = await adminClient.from('cbt_exams').select('*').order('created_at', { ascending: false });
      return data || [];
    });
  });

export const deleteAdminTestFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: any) => z.object({ testId: z.string() }).parse(d))
  .handler(async ({ data }) => {
    const adminClient = getAdminClient();
    await adminClient.from('cbt_exams').delete().eq('id', data.testId);
    return { success: true };
  });

export const toggleAdminTestStatusFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: any) => z.object({ testId: z.string(), status: z.string() }).parse(d))
  .handler(async ({ data }) => {
    const adminClient = getAdminClient();
    await adminClient.from('cbt_exams').update({ status: data.status }).eq('id', data.testId);
    return { success: true };
  });

export const getInternSubmissionResultFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ testId: z.string(), submissionId: z.string().optional() }).parse(d))
  .handler(async ({ data: args, context }) => {
    const adminClient = getAdminClient();
    const userId = context.user.id;
    
    let query = adminClient
      .from('cbt_submissions')
      .select('*, cbt_exams(*)')
      .eq('exam_id', args.testId);

    if (args.submissionId) {
      query = query.eq('id', args.submissionId);
    } else {
      query = query.eq('intern_id', userId);
    }

    const { data: sub } = await query.order('started_at', { ascending: false }).limit(1).maybeSingle();
    if (!sub) return null;

    let parsedFeedback: any = null;
    try {
      if (typeof sub.ai_feedback === 'string') {
        parsedFeedback = JSON.parse(sub.ai_feedback);
      }
    } catch {}

    const [{ data: questions }, { data: answers }, { data: logs }] = await Promise.all([
      adminClient.from('cbt_questions').select('*').eq('exam_id', args.testId).order('order_index', { ascending: true }),
      adminClient.from('cbt_answers').select('*').eq('submission_id', sub.id),
      adminClient.from('cbt_malpractice_logs').select('*').eq('submission_id', sub.id).order('timestamp', { ascending: true })
    ]);

    const passingScore = sub.cbt_exams?.passing_score || 50;
    const maxScore = (questions || []).reduce((acc: number, q: any) => acc + (q.max_points || 10), 0) || 100;
    const percentage = parsedFeedback?.percentage ?? Math.round(((sub.total_score || 0) / maxScore) * 100);
    const passed = parsedFeedback?.passed ?? (percentage >= passingScore);

    return {
      ...sub,
      score: sub.total_score,
      percentage,
      passed,
      maxScore,
      passingScore,
      questions: questions || [],
      answers: answers || [],
      questionsReview: parsedFeedback?.questionsReview || null,
      proctoring_logs: logs || []
    };
  });

export const getUniversalSubmissionScoreFn = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => z.object({ submissionId: z.string().optional(), testId: z.string().optional() }).parse(d))
  .handler(async ({ data: args }) => {
    const adminClient = getAdminClient();
    let query = adminClient
      .from('cbt_submissions')
      .select('*, cbt_exams(*), profiles:intern_id(id, full_name, email, intern_id)');

    if (args.submissionId) {
      query = query.eq('id', args.submissionId);
    } else if (args.testId) {
      query = query.eq('exam_id', args.testId);
    } else {
      return null;
    }

    const { data: sub } = await query.order('submitted_at', { ascending: false }).limit(1).maybeSingle();
    if (!sub) return null;

    let parsedFeedback: any = null;
    try {
      if (typeof sub.ai_feedback === 'string') {
        parsedFeedback = JSON.parse(sub.ai_feedback);
      }
    } catch {}

    const [{ data: questions }, { data: answers }, { data: logs }] = await Promise.all([
      adminClient.from('cbt_questions').select('*').eq('exam_id', sub.exam_id).order('order_index', { ascending: true }),
      adminClient.from('cbt_answers').select('*').eq('submission_id', sub.id),
      adminClient.from('cbt_malpractice_logs').select('*').eq('submission_id', sub.id).order('timestamp', { ascending: true })
    ]);

    const passingScore = sub.cbt_exams?.passing_score || 50;
    const maxScore = (questions || []).reduce((acc: number, q: any) => acc + (q.max_points || 10), 0) || 100;
    const percentage = parsedFeedback?.percentage ?? Math.round(((sub.total_score || 0) / maxScore) * 100);
    const passed = parsedFeedback?.passed ?? (percentage >= passingScore);

    return {
      submission: sub,
      score: sub.total_score,
      percentage,
      passed,
      maxScore,
      passingScore,
      questions: questions || [],
      answers: answers || [],
      questionsReview: parsedFeedback?.questionsReview || null,
      proctoring_logs: logs || []
    };
  });

export const getAdminTestQuestionsFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ testId: z.string() }).parse(d))
  .handler(async ({ data: args }) => {
    const adminClient = getAdminClient();
    let { data: questions, error } = await adminClient
      .from('cbt_questions')
      .select('*')
      .eq('exam_id', args.testId)
      .order('order_index', { ascending: true });

    if (error && error.message?.includes("exam_id")) {
      const res = await adminClient
        .from('cbt_questions')
        .select('*')
        .eq('test_id', args.testId)
        .order('order_index', { ascending: true });
      questions = res.data;
    }
    return questions || [];
  });

export const recordInternLoginSessionFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({
    sessionId: z.string(),
    expiresAt: z.number(),
    userAgent: z.string().optional()
  }).parse(d))
  .handler(async ({ data: args, context }) => {
    const adminClient = getAdminClient();
    const userId = context.user.id;
    try {
      await adminClient.from("site_settings").upsert({
        id: `intern_session_${userId}`,
        value: {
          user_id: userId,
          session_id: args.sessionId,
          expires_at: new Date(args.expiresAt).toISOString(),
          created_at: new Date().toISOString(),
          duration_days: 7,
          user_agent: args.userAgent || "browser"
        },
        updated_at: new Date().toISOString()
      });
    } catch (e) {
      console.warn("[recordInternLoginSessionFn] session log notice:", e);
    }
    return { success: true, sessionId: args.sessionId };
  });

export const listInternSubmissionsFn = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<any[]> => {
    const adminClient = getAdminClient();
    const userId = context.user.id;
    const { data } = await adminClient.from('cbt_submissions').select('*, cbt_exams(*)').eq('intern_id', userId).order('started_at', { ascending: false });
    return data || [];
  });

export const listCbtTargetsFn = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async () => {
    return getOrSetCache("cbt_targets", 10000, async () => {
      const supabase = getAdminClient();
      
      const [{ data: interns }, { data: tasks }] = await Promise.all([
        supabase.from("profiles").select("id, full_name, email").in("role", ["intern", "employee"]),
        supabase.from("tasks").select("team_id, team_name").not("team_id", "is", null)
      ]);
      
      const uniqueTeams: any[] = [];
      const seenIds = new Set();
      for (const t of (tasks || [])) {
         if (!seenIds.has(t.team_id)) {
            seenIds.add(t.team_id);
            uniqueTeams.push({ id: t.team_id, name: t.team_name || t.team_id });
         }
      }
      
      return { interns: interns || [], teams: uniqueTeams };
    });
  });
export const listAdminTestSubmissionsFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: any) => z.object({ testId: z.string() }).parse(d))
  .handler(async ({ data }) => {
    const adminClient = getAdminClient();
    const { data: subs } = await adminClient.from('cbt_submissions').select('*, profiles(full_name, email)').eq('exam_id', data.testId).order('submitted_at', { ascending: false });
    return subs || [];
  });
export const listInternAvailableExamsFn = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const adminClient = getAdminClient();
    const userId = context.user.id;
    
    // Fetch all needed data in parallel
    const [{ data: exams }, { data: userTasks }, { data: submissions }] = await Promise.all([
      adminClient.from('cbt_exams').select('*').eq('status', 'published'),
      adminClient.from('tasks').select('team_id').eq('assigned_to', userId).not('team_id', 'is', null),
      adminClient.from('cbt_submissions').select('exam_id').eq('intern_id', userId)
    ]);
    
    const userTeams = Array.from(new Set((userTasks || []).map(t => t.team_id)));
    
    // Filter exams where intern_ids contains userId OR team_ids overlaps with userTeams
    const availableExams = (exams || []).filter(exam => {
      const isTargetedIntern = exam.intern_ids && exam.intern_ids.includes(userId);
      const isTargetedTeam = exam.team_ids && exam.team_ids.some((tid: string) => userTeams.includes(tid));
      return isTargetedIntern || isTargetedTeam;
    });
    
    const submittedExamIds = new Set((submissions || []).map(s => s.exam_id));
    
    // Return only exams that haven't been submitted yet
    return availableExams.filter(exam => !submittedExamIds.has(exam.id));
  });

export const reassignAdminTestFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({
    testId: z.string(),
    target_type: z.enum(['intern', 'team', 'manual']),
    target_id: z.union([z.string(), z.array(z.string())]).optional(),
    target_ids: z.array(z.string()).optional(),
    target_intern_ids: z.array(z.string()).optional(),
    target_team_ids: z.array(z.string()).optional(),
    deadline: z.string().optional(),
    enable_camera: z.boolean().optional(),
    camera_strictness: z.string().optional(),
    time_limit_minutes: z.number().optional(),
    passing_score: z.number().optional(),
  }).parse(d))
  .handler(async ({ data: args }) => {
    const adminClient = getAdminClient();
    const { 
      testId, 
      target_type, 
      target_id, 
      target_ids,
      target_intern_ids,
      target_team_ids,
      deadline, 
      enable_camera, 
      camera_strictness, 
      time_limit_minutes, 
      passing_score 
    } = args;

    const { data: test, error: fetchErr } = await adminClient
      .from('cbt_exams')
      .select('*')
      .eq('id', testId)
      .single();

    if (fetchErr || !test) throw new Error("Exam not found");

    const updatePayload: any = {
      status: 'published',
    };

    if (deadline !== undefined) updatePayload.deadline = deadline || null;
    if (enable_camera !== undefined) {
      updatePayload.enable_camera = enable_camera;
      updatePayload.camera_required = enable_camera;
    }
    if (camera_strictness !== undefined) updatePayload.camera_strictness = camera_strictness;
    if (time_limit_minutes !== undefined) updatePayload.time_limit_minutes = Number(time_limit_minutes);
    if (passing_score !== undefined) updatePayload.passing_score = Number(passing_score);

    // Resolve multi-targets
    const newInterns: string[] = Array.isArray(target_intern_ids) ? [...target_intern_ids] : [];
    const newTeams: string[] = Array.isArray(target_team_ids) ? [...target_team_ids] : [];

    const rawTargets: string[] = [];
    if (Array.isArray(target_ids)) rawTargets.push(...target_ids);
    if (Array.isArray(target_id)) rawTargets.push(...target_id);
    else if (typeof target_id === 'string' && target_id && target_id !== 'none') rawTargets.push(target_id.trim());

    if (target_type === 'team') {
      newTeams.push(...rawTargets);
    } else {
      newInterns.push(...rawTargets);
    }

    const existingTeams = Array.isArray(test.team_ids) ? test.team_ids : [];
    const existingInterns = Array.isArray(test.intern_ids) ? test.intern_ids : [];

    const finalTeams = Array.from(new Set([...existingTeams, ...newTeams].filter(Boolean)));
    const finalInterns = Array.from(new Set([...existingInterns, ...newInterns].filter(Boolean)));

    updatePayload.team_ids = finalTeams;
    updatePayload.intern_ids = finalInterns;
    updatePayload.allocation_mode = finalTeams.length > 0 && finalInterns.length === 0 ? 'team' : 'individual';

    let { error: updateErr } = await adminClient
      .from('cbt_exams')
      .update(updatePayload)
      .eq('id', testId);

    if (updateErr) {
      console.warn("[reassignAdminTestFn] Primary update failed, trying safe fallback:", updateErr.message);
      const fallbackPayload: any = {
        status: 'published',
      };
      if (deadline !== undefined) fallbackPayload.deadline = deadline || null;
      if (enable_camera !== undefined) fallbackPayload.enable_camera = enable_camera;
      if (time_limit_minutes !== undefined) fallbackPayload.time_limit_minutes = Number(time_limit_minutes);
      
      const fallbackRes = await adminClient.from('cbt_exams').update(fallbackPayload).eq('id', testId);
      if (fallbackRes.error) {
        throw new Error("Failed to assign exam: " + fallbackRes.error.message);
      }
    }

    invalidateCache("admin_cbt_tests");

    // Send notification email to all newly assigned targets via Brevo
    try {
      let targetEmails: { email: string; name: string; internId?: string; internRole?: string }[] = [];
      if (newInterns.length > 0) {
        const { data: profiles } = await adminClient
          .from('profiles')
          .select('id, email, full_name, intern_id, position, department')
          .in('id', newInterns);
        if (profiles) {
          targetEmails.push(...profiles.map(p => ({ 
            email: p.email, 
            name: p.full_name || "Intern",
            internId: p.intern_id || `VCS-INT-${p.id.slice(0, 8).toUpperCase()}`,
            internRole: p.position || p.department || "Technical Intern"
          })));
        }
      }
      if (newTeams.length > 0) {
        const { data: taskProfiles } = await adminClient
          .from('tasks')
          .select('assigned_to, profiles:assigned_to(id, email, full_name, intern_id, position, department)')
          .in('team_id', newTeams);
        if (taskProfiles) {
          const seen = new Set(targetEmails.map(t => t.email));
          for (const t of taskProfiles) {
            const prof: any = t.profiles;
            if (prof?.email && !seen.has(prof.email)) {
              seen.add(prof.email);
              targetEmails.push({ 
                email: prof.email, 
                name: prof.full_name || "Intern",
                internId: prof.intern_id || `VCS-INT-${prof.id?.slice(0, 8)?.toUpperCase() || "PROV"}`,
                internRole: prof.position || prof.department || "Technical Intern"
              });
            }
          }
        }
      }

      for (const target of targetEmails) {
        if (target.email) {
          await sendCbtAssignmentEmail({
            to: target.email,
            internName: target.name,
            internId: target.internId,
            internRole: target.internRole,
            examId: testId,
            testId,
            testTitle: test.title,
            description: test.description,
            timeLimitMinutes: updatePayload.time_limit_minutes || test.time_limit_minutes || 30,
            passingScore: updatePayload.passing_score || test.passing_score || 50,
            enableCamera: updatePayload.enable_camera ?? (test.enable_camera !== false),
            cameraStrictness: updatePayload.camera_strictness || test.camera_strictness || 'standard',
            deadline: updatePayload.deadline ?? test.deadline,
            isExtension: false
          });
        }
      }
    } catch (err) {
      console.warn("[reassignAdminTestFn] Email notification warning:", err);
    }

    return { 
      success: true, 
      message: `Exam successfully assigned to ${newInterns.length + newTeams.length} candidate(s)/team(s)! Notification emails dispatched.` 
    };
  });

export const getAdminExamPaperDownloadsFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ testId: z.string() }).parse(d))
  .handler(async ({ data: args, context }) => {
    const adminClient = getAdminClient();
    const userId = context.user.id;

    // Admin authorization check: only admins can download official exam papers & solution guides
    const { data: profile } = await adminClient
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .single();

    const role = (profile?.role || '').toLowerCase();
    const isAdmin = ['admin', 'super_admin', 'director', 'founder', 'manager'].includes(role);
    if (!isAdmin) {
      throw new Error("Access restricted: Official Exam Papers & Solution Guides are strictly restricted to administrators.");
    }

    const { data: exam, error: examErr } = await adminClient
      .from('cbt_exams')
      .select('*')
      .eq('id', args.testId)
      .single();

    if (examErr || !exam) throw new Error("Exam not found");

    if (exam.pdf_url && exam.csv_url) {
      return { 
        pdfUrl: exam.pdf_url, 
        csvUrl: exam.csv_url, 
        title: exam.title 
      };
    }

    // Generate papers on demand if not present
    const { data: questions } = await adminClient
      .from('cbt_questions')
      .select('*')
      .eq('exam_id', args.testId)
      .order('order_index', { ascending: true });

    const { exportAndStoreExamPaper } = await import("./cbt-exam-export.server");
    const { pdfUrl, csvUrl } = await exportAndStoreExamPaper({
      exam,
      questions: questions || [],
      targetLabels: exam.allocation_mode === 'team' ? (exam.team_ids || []) : (exam.intern_ids || [])
    });

    if (pdfUrl || csvUrl) {
      await adminClient.from('cbt_exams').update({
        pdf_url: pdfUrl || exam.pdf_url,
        csv_url: csvUrl || exam.csv_url,
      }).eq('id', args.testId);
      invalidateCache("admin_cbt_tests");
    }

    return { 
      pdfUrl: pdfUrl || exam.pdf_url || "", 
      csvUrl: csvUrl || exam.csv_url || "",
      title: exam.title
    };
  });

export const extendAdminTestDeadlineFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({
    testId: z.string(),
    deadline: z.string(),
    notifyInterns: z.boolean().optional(),
  }).parse(d))
  .handler(async ({ data: args }) => {
    const adminClient = getAdminClient();
    const { testId, deadline, notifyInterns = true } = args;

    const { data: test, error: fetchErr } = await adminClient
      .from('cbt_exams')
      .select('*')
      .eq('id', testId)
      .single();

    if (fetchErr || !test) throw new Error("Exam not found");

    const { error: updateErr } = await adminClient
      .from('cbt_exams')
      .update({ deadline })
      .eq('id', testId);

    if (updateErr) throw new Error("Failed to extend deadline: " + updateErr.message);

    invalidateCache("admin_cbt_tests");

    if (notifyInterns) {
      try {
        let targetEmails: { email: string; name: string; internId?: string; internRole?: string }[] = [];
        if (test.intern_ids && test.intern_ids.length > 0) {
          const { data: profiles } = await adminClient
            .from('profiles')
            .select('id, email, full_name, intern_id, position, department')
            .in('id', test.intern_ids);
          if (profiles) {
            targetEmails = profiles.map(p => ({ 
              email: p.email, 
              name: p.full_name || "Intern",
              internId: p.intern_id || `VCS-INT-${p.id.slice(0, 8).toUpperCase()}`,
              internRole: p.position || p.department || "Technical Intern"
            }));
          }
        }
        if (test.team_ids && test.team_ids.length > 0) {
          const { data: taskProfiles } = await adminClient
            .from('tasks')
            .select('assigned_to, profiles:assigned_to(id, email, full_name, intern_id, position, department)')
            .in('team_id', test.team_ids);
          if (taskProfiles) {
            const seen = new Set(targetEmails.map(t => t.email));
            for (const t of taskProfiles) {
              const prof: any = t.profiles;
              if (prof?.email && !seen.has(prof.email)) {
                seen.add(prof.email);
                targetEmails.push({ 
                  email: prof.email, 
                  name: prof.full_name || "Intern",
                  internId: prof.intern_id || `VCS-INT-${prof.id?.slice(0, 8)?.toUpperCase() || "PROV"}`,
                  internRole: prof.position || prof.department || "Technical Intern"
                });
              }
            }
          }
        }

        for (const target of targetEmails) {
          if (target.email) {
            await sendCbtAssignmentEmail({
              to: target.email,
              internName: target.name,
              internId: target.internId,
              internRole: target.internRole,
              examId: testId,
              testId,
              testTitle: test.title,
              description: test.description,
              timeLimitMinutes: test.time_limit_minutes || 30,
              passingScore: test.passing_score || 50,
              enableCamera: test.enable_camera !== false,
              cameraStrictness: test.camera_strictness || 'standard',
              deadline,
              isExtension: true
            });
          }
        }
      } catch (err) {
        console.warn("[extendAdminTestDeadlineFn] Email dispatch error:", err);
      }
    }

    return { 
      success: true, 
      message: `Deadline extended to ${new Date(deadline).toLocaleString()}` 
    };
  });

export const getAdminSubmissionDetailFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ submissionId: z.string() }).parse(d))
  .handler(async ({ data: args }) => {
    const adminClient = getAdminClient();
    const { data: submission, error: subErr } = await adminClient
      .from('cbt_submissions')
      .select('*, profiles(id, full_name, email, intern_id), cbt_exams(*)')
      .eq('id', args.submissionId)
      .single();

    if (subErr || !submission) throw new Error("Submission not found");

    const [{ data: answers }, { data: malpracticeLogs }, { data: questions }] = await Promise.all([
      adminClient.from('cbt_answers').select('*').eq('submission_id', args.submissionId),
      adminClient.from('cbt_malpractice_logs').select('*').eq('submission_id', args.submissionId).order('timestamp', { ascending: true }),
      adminClient.from('cbt_questions').select('*').eq('exam_id', submission.exam_id).order('order_index', { ascending: true }),
    ]);

    return {
      submission,
      answers: answers || [],
      malpracticeLogs: malpracticeLogs || [],
      questions: questions || [],
    };
  });

export const overrideSubmissionScoreFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({
    submissionId: z.string(),
    newScore: z.number().min(0).max(100),
    reviewRemarks: z.string().optional()
  }).parse(d))
  .handler(async ({ data: args }) => {
    const adminClient = getAdminClient();
    const { error } = await adminClient
      .from('cbt_submissions')
      .update({
        total_score: args.newScore,
        ai_feedback: args.reviewRemarks || "Score manually verified and updated by administrator.",
        status: 'graded'
      })
      .eq('id', args.submissionId);

    if (error) throw new Error(error.message);
    invalidateCache("all_cbt_submissions");
    return { success: true, message: "Submission score updated successfully!" };
  });

export const listAllCbtSubmissionsFn = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async () => {
    return getOrSetCache("all_cbt_submissions", 5000, async () => {
      const adminClient = getAdminClient();
      const { data: subs, error } = await adminClient
        .from('cbt_submissions')
        .select('*, cbt_exams(title, passing_score), profiles(full_name, email, intern_id)')
        .order('submitted_at', { ascending: false });
      if (error) {
        console.error(error);
        return [];
      }
      return subs || [];
    });
  });

export const grantInternRetakeFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({
    submissionId: z.string(),
    reason: z.string().optional()
  }).parse(d))
  .handler(async ({ data: args }) => {
    const adminClient = getAdminClient();
    const { submissionId, reason } = args;

    const { data: sub, error: subErr } = await adminClient
      .from('cbt_submissions')
      .select('*, profiles(email, full_name), cbt_exams(title, id)')
      .eq('id', submissionId)
      .single();

    if (subErr || !sub) throw new Error("Submission not found");

    // Cleanly delete submission and answers to allow fresh retake
    await adminClient.from('cbt_answers').delete().eq('submission_id', submissionId);
    await adminClient.from('cbt_malpractice_logs').delete().eq('submission_id', submissionId);
    await adminClient.from('cbt_submissions').delete().eq('id', submissionId);

    invalidateCache("all_cbt_submissions");

    // Send automated email to candidate
    const candidateEmail = sub.profiles?.email;
    if (candidateEmail) {
      const apiKey = getEnv("RESEND_API_KEY");
      if (apiKey) {
        try {
          const { Resend } = await import("resend");
          const resend = new Resend(apiKey);
          const appUrl = "https://vynexaconnect.vyntyraconsultancyservices.in";
          await resend.emails.send({
            from: "VyNexa Connect <noreply@vyntyraconsultancyservices.in>",
            to: candidateEmail,
            subject: `[VyNexa Connect] Retake Approved: ${sub.cbt_exams?.title || "Assessment"}`,
            html: `
              <div style="font-family: sans-serif; padding: 24px; color: #1e293b;">
                <h2 style="color: #059669;">Assessment Retake Approved</h2>
                <p>Hello <strong>${sub.profiles?.full_name || "Candidate"}</strong>,</p>
                <p>Your previous assessment submission for <strong>${sub.cbt_exams?.title || "Assessment"}</strong> has been officially reset by the administrator.</p>
                <p>You may now launch and attempt the assessment again.</p>
                ${reason ? `<p><strong>Administrator Note:</strong> ${reason}</p>` : ""}
                <div style="margin-top: 24px;">
                  <a href="${appUrl}/cbt/${sub.cbt_exams?.id || sub.exam_id}" style="display: inline-block; background-color: #059669; color: #ffffff; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: bold;">
                    Launch Retake Assessment &rarr;
                  </a>
                </div>
              </div>
            `
          });
        } catch (err) {
          console.warn("[grantInternRetakeFn] Email warning:", err);
        }
      }
    }

    return { success: true, message: "Attempt reset! Intern has been granted a fresh retake and notified via email." };
  });

export const clearSubmissionStrikesFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({
    submissionId: z.string(),
  }).parse(d))
  .handler(async ({ data: args }) => {
    const adminClient = getAdminClient();
    await adminClient.from('cbt_malpractice_logs').delete().eq('submission_id', args.submissionId);
    await adminClient.from('cbt_submissions').update({ malpractice_warnings: 0 }).eq('id', args.submissionId);
    invalidateCache("all_cbt_submissions");
    return { success: true, message: "All violations and strikes cleared for this candidate." };
  });
