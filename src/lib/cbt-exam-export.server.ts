import fs from "fs";
import path from "path";
import { uploadBufferToR2 } from "./r2";

function getLocalAssetBase64(filename: string): string | null {
  try {
    const projectRoot = process.cwd();
    const publicPath = path.join(projectRoot, "public", filename);
    if (fs.existsSync(publicPath)) {
      const buffer = fs.readFileSync(publicPath);
      const ext = path.extname(filename).toLowerCase().replace(".", "");
      return `data:image/${ext === "jpg" ? "jpeg" : ext};base64,${buffer.toString("base64")}`;
    }
  } catch (err) {
    console.warn(`[cbt-export local-loader] Failed to read ${filename}:`, err);
  }
  return null;
}

export async function generateCbtExamPdf({
  exam,
  questions,
  targetLabels,
}: {
  exam: any;
  questions: any[];
  targetLabels: string[];
}): Promise<Buffer> {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ format: "a4", unit: "mm" });

  // Corporate Color Palette
  const navy = [15, 23, 42]; // #0f172a
  const gold = [180, 130, 20]; // #b48214
  const slate = [71, 85, 105]; // #475569
  const slateLight = [100, 116, 139]; // #64748b
  const ink = [15, 23, 42]; // #0f172a
  const green = [16, 185, 129]; // #10b981
  const bgLight = [248, 250, 252]; // #f8fafc
  const borderLight = [226, 232, 240]; // #e2e8f0

  const PW = 210;
  const PH = 297;
  const ML = 15;
  const MR = PW - 15; // 195
  const TW = MR - ML; // 180
  const TOP_CONTENT_Y = 33;
  const BOTTOM_LIMIT_Y = 277;

  const logoBase64 = getLocalAssetBase64("icon-512.png");
  const sigBase64 = getLocalAssetBase64("signature.png");

  // Helper for drawing official header
  const drawHeader = (isFirstPage: boolean) => {
    // Top colored bands
    doc.setFillColor(navy[0], navy[1], navy[2]);
    doc.rect(0, 0, PW, 4.5, "F");
    doc.setFillColor(gold[0], gold[1], gold[2]);
    doc.rect(0, 4.5, PW, 1.2, "F");

    const y = 9.5;
    if (logoBase64) {
      try {
        doc.addImage(logoBase64, "PNG", ML, y, 16, 16);
      } catch (_) {}
    }

    const textX = logoBase64 ? ML + 19 : ML;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.setTextColor(navy[0], navy[1], navy[2]);
    doc.text("VYNTYRA CONSULTANCY SERVICES", textX, y + 4.5);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(slate[0], slate[1], slate[2]);
    doc.text("DIRECTORATE OF TECHNICAL ASSESSMENTS & EXAMINATIONS • PROJECT VYNEXA", textX, y + 9);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(slateLight[0], slateLight[1], slateLight[2]);
    doc.text("ISO 9001:2015 Certified  |  MSME Reg: UDYAM-AP-10-0143100  |  Visakhapatnam, AP, India", textX, y + 13.5);

    // Right Official Paper Badge
    doc.setFillColor(navy[0], navy[1], navy[2]);
    doc.roundedRect(PW - 67, y, 52, 14, 2, 2, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.setTextColor(255, 255, 255);
    doc.text("OFFICIAL QUESTION PAPER", PW - 41, y + 5.5, { align: "center" });
    doc.setFontSize(6.5);
    doc.setTextColor(245, 158, 11);
    doc.text("BENCHMARK SOLUTION GUIDE", PW - 41, y + 10.5, { align: "center" });

    // Divider Line
    doc.setDrawColor(borderLight[0], borderLight[1], borderLight[2]);
    doc.setLineWidth(0.4);
    doc.line(ML, 28.5, MR, 28.5);
  };

  // Helper for drawing official footer with dynamic page count
  const drawFooter = (pageNum: number, totalPages: number) => {
    doc.setDrawColor(borderLight[0], borderLight[1], borderLight[2]);
    doc.setLineWidth(0.4);
    doc.line(ML, PH - 14, MR, PH - 14);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(6.8);
    doc.setTextColor(slate[0], slate[1], slate[2]);
    doc.text("CONFIDENTIAL & PROPRIETARY • VYNTYRA CONSULTANCY SERVICES PVT. LTD. • ALL RIGHTS RESERVED", ML, PH - 9);
    doc.setFont("helvetica", "bold");
    doc.text(`Page ${pageNum} of ${totalPages}`, MR, PH - 9, { align: "right" });
  };

  let curY = TOP_CONTENT_Y;

  // ── 1. Page 1: Assessment Meta Banner ──────────────────────────────
  const totalPoints = questions.reduce((sum, q) => sum + (Number(q.max_points) || 10), 0);
  const targetsStr = targetLabels && targetLabels.length > 0 
    ? targetLabels.slice(0, 3).join(", ") + (targetLabels.length > 3 ? ` (+${targetLabels.length - 3} more)` : "") 
    : (exam.allocation_mode === 'all' ? "All Registered Candidates" : "Designated Assessment Cohort");

  const titleLines = doc.splitTextToSize(exam.title || "Technical Assessment Examination", TW - 14);
  const descText = exam.description || "Official evaluation paper generated and allocated via VyNexa Connect CBT Engine.";
  const descLines = doc.splitTextToSize(descText, TW - 14);

  // Calculate dynamic banner height
  const bannerHeaderH = 6 + titleLines.length * 5 + descLines.length * 3.8;
  const bannerGridH = 26; // 2 rows of 4 metrics
  const bannerInstrH = 8;
  const bannerH = bannerHeaderH + bannerGridH + bannerInstrH + 4;

  // Outer container
  doc.setFillColor(bgLight[0], bgLight[1], bgLight[2]);
  doc.setDrawColor(borderLight[0], borderLight[1], borderLight[2]);
  doc.setLineWidth(0.4);
  doc.roundedRect(ML, curY, TW, bannerH, 2.5, 2.5, "FD");

  // Left gold decorative border strip
  doc.setFillColor(gold[0], gold[1], gold[2]);
  doc.roundedRect(ML, curY, 2.5, bannerH, 1, 1, "F");

  // Title
  let bY = curY + 6;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(navy[0], navy[1], navy[2]);
  doc.text(titleLines, ML + 6, bY);
  bY += titleLines.length * 5;

  // Description
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.8);
  doc.setTextColor(slate[0], slate[1], slate[2]);
  doc.text(descLines, ML + 6, bY);
  bY += descLines.length * 3.8 + 2;

  // Metrics Grid (4 columns, 2 rows)
  const colW = (TW - 12) / 4;
  const colPositions = [ML + 6, ML + 6 + colW, ML + 6 + colW * 2, ML + 6 + colW * 3];

  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(borderLight[0], borderLight[1], borderLight[2]);
  doc.roundedRect(ML + 5, bY, TW - 10, bannerGridH, 2, 2, "FD");

  const renderMetric = (label: string, val: string, x: number, y: number) => {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(6.5);
    doc.setTextColor(slateLight[0], slateLight[1], slateLight[2]);
    doc.text(label.toUpperCase(), x + 2, y + 4.5);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.setTextColor(navy[0], navy[1], navy[2]);
    doc.text(val, x + 2, y + 9.5);
  };

  // Row 1
  renderMetric("Duration", `${exam.time_limit_minutes || 30} Minutes`, colPositions[0], bY);
  renderMetric("Total Questions", `${questions.length} Items`, colPositions[1], bY);
  renderMetric("Maximum Score", `${totalPoints} Points`, colPositions[2], bY);
  renderMetric("Passing Score", `${exam.passing_score || 50}% Minimum`, colPositions[3], bY);

  // Row 2
  const r2Y = bY + 12.5;
  doc.setDrawColor(borderLight[0], borderLight[1], borderLight[2]);
  doc.line(ML + 5, r2Y, MR - 5, r2Y);

  renderMetric("Proctoring", exam.enable_camera !== false ? "Webcam Active" : "Focus Monitoring", colPositions[0], r2Y);
  renderMetric("Strictness", `${(exam.camera_strictness || "standard").toUpperCase()} Mode`, colPositions[1], r2Y);
  renderMetric("Deadline", exam.deadline ? new Date(exam.deadline).toLocaleDateString() : "Open Allocation", colPositions[2], r2Y);
  renderMetric("Target Cohort", targetsStr.slice(0, 20), colPositions[3], r2Y);

  bY += bannerGridH + 3.5;

  // Instructions strip
  doc.setFont("helvetica", "italic");
  doc.setFontSize(7);
  doc.setTextColor(slate[0], slate[1], slate[2]);
  doc.text(
    "Instructions: 1. All questions are mandatory. 2. Time limits per item are monitored. 3. Items marked with [✓] indicate verified benchmark solutions.",
    ML + 6,
    bY + 3.5
  );

  curY += bannerH + 6;

  // ── 2. Section Heading ─────────────────────────────────────────────
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.5);
  doc.setTextColor(navy[0], navy[1], navy[2]);
  doc.text(`EXAMINATION QUESTIONS & BENCHMARK SOLUTIONS (${questions.length} TOTAL ITEMS)`, ML, curY);

  doc.setDrawColor(gold[0], gold[1], gold[2]);
  doc.setLineWidth(0.8);
  doc.line(ML, curY + 2, ML + 55, curY + 2);

  curY += 6;

  // ── 3. Questions Loop with Exact Page-Fit ───────────────────────────
  questions.forEach((q: any, idx: number) => {
    const qNum = idx + 1;
    const qTypeRaw = q.question_type || "mcq";
    const qType = qTypeRaw.toUpperCase().replace("_", " ");
    const qPoints = q.max_points || 10;
    const qTimer = q.time_limit_seconds || 60;

    // Text & Line wrapping measurements
    const qTextLines = doc.splitTextToSize(`${q.question_text || "No question statement."}`, TW - 12);

    // Code snippet
    const codeRaw = q.reference_code || q.code_snippet || "";
    const codeLines = codeRaw ? doc.splitTextToSize(String(codeRaw).trim(), TW - 18) : [];

    // Options
    const rawOptions = Array.isArray(q.options)
      ? q.options
      : typeof q.options === "object" && q.options !== null
      ? Object.entries(q.options).map(([id, text]) => ({ id, text }))
      : [];

    const correctRaw = typeof q.correct_answer === "object" 
      ? String(q.correct_answer?.id || "") 
      : String(q.correct_answer || "");

    const measuredOptions = rawOptions.map((opt: any, optIdx: number) => {
      const optId = String(opt.id || String.fromCharCode(65 + optIdx)).toUpperCase();
      const isCorrect = optId === correctRaw.toUpperCase() || String(opt.text || "").trim() === correctRaw.trim();
      const optTextLines = doc.splitTextToSize(String(opt.text || ""), TW - 32);
      const boxHeight = Math.max(6.5, optTextLines.length * 3.8 + 3.5);
      return {
        id: optId,
        textLines: optTextLines,
        isCorrect,
        boxHeight
      };
    });

    // Subjective model answer / grading rubric
    const isSubjective = rawOptions.length === 0 && Boolean(q.correct_answer);
    const rubricLines = isSubjective
      ? doc.splitTextToSize(typeof q.correct_answer === "string" ? q.correct_answer : JSON.stringify(q.correct_answer), TW - 16)
      : [];

    // Explanation / Solution Key
    const expLines = q.explanation
      ? doc.splitTextToSize(String(q.explanation), TW - 16)
      : [];

    // Compute Exact Needed Height for this question card
    let neededHeight = 11; // Header bar & separator
    neededHeight += qTextLines.length * 4.1 + 3; // Question statement

    if (codeLines.length > 0) {
      neededHeight += codeLines.length * 3.4 + 7; // Code block
    }

    if (measuredOptions.length > 0) {
      for (const opt of measuredOptions) {
        neededHeight += opt.boxHeight + 1.8; // Options with small gap
      }
      neededHeight += 2;
    }

    if (rubricLines.length > 0) {
      neededHeight += rubricLines.length * 3.6 + 9;
    }

    if (expLines.length > 0) {
      neededHeight += expLines.length * 3.6 + 9;
    }

    neededHeight += 3; // Card bottom padding

    // Smart Pagination & Fit Check
    const spaceRemaining = BOTTOM_LIMIT_Y - curY;
    if (neededHeight <= (BOTTOM_LIMIT_Y - TOP_CONTENT_Y)) {
      if (neededHeight > spaceRemaining) {
        doc.addPage();
        curY = TOP_CONTENT_Y;
      }
    } else {
      // Very tall question
      if (spaceRemaining < 50) {
        doc.addPage();
        curY = TOP_CONTENT_Y;
      }
    }

    // Outer Question Card Box
    doc.setFillColor(bgLight[0], bgLight[1], bgLight[2]);
    doc.setDrawColor(borderLight[0], borderLight[1], borderLight[2]);
    doc.setLineWidth(0.35);
    doc.roundedRect(ML, curY, TW, neededHeight, 2, 2, "FD");

    // Header badge inside card
    doc.setFillColor(navy[0], navy[1], navy[2]);
    doc.roundedRect(ML + 3.5, curY + 3, 25, 5, 1, 1, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.setTextColor(255, 255, 255);
    doc.text(`QUESTION ${qNum}`, ML + 16, curY + 6.6, { align: "center" });

    // Question Type pill
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7);
    doc.setTextColor(slate[0], slate[1], slate[2]);
    doc.text(`[${qType}]`, ML + 31, curY + 6.6);

    // Points & Timer on the right
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.2);
    doc.setTextColor(navy[0], navy[1], navy[2]);
    doc.text(`POINTS: ${qPoints}  •  TIME: ${qTimer}s`, MR - 4, curY + 6.6, { align: "right" });

    // Divider Line inside card
    doc.setDrawColor(borderLight[0], borderLight[1], borderLight[2]);
    doc.setLineWidth(0.3);
    doc.line(ML + 3.5, curY + 9.5, MR - 3.5, curY + 9.5);

    // Question statement text
    let innerY = curY + 14;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.setTextColor(ink[0], ink[1], ink[2]);
    doc.text(qTextLines, ML + 5, innerY);
    innerY += qTextLines.length * 4.1 + 3;

    // Code Snippet (if available)
    if (codeLines.length > 0) {
      const codeH = codeLines.length * 3.4 + 6;
      doc.setFillColor(241, 245, 249);
      doc.setDrawColor(203, 213, 225);
      doc.roundedRect(ML + 4.5, innerY, TW - 9, codeH, 1.5, 1.5, "FD");

      doc.setFont("courier", "bold");
      doc.setFontSize(7.2);
      doc.setTextColor(15, 23, 42);
      doc.text(codeLines, ML + 7, innerY + 4.2);
      innerY += codeH + 3;
    }

    // Options Rendering
    if (measuredOptions.length > 0) {
      measuredOptions.forEach((opt: any) => {
        if (opt.isCorrect) {
          doc.setFillColor(236, 253, 245); // light emerald
          doc.setDrawColor(green[0], green[1], green[2]);
          doc.roundedRect(ML + 4.5, innerY, TW - 9, opt.boxHeight, 1.5, 1.5, "FD");

          // Option ID Badge (Emerald circle)
          doc.setFillColor(green[0], green[1], green[2]);
          doc.roundedRect(ML + 6, innerY + 1.2, 5, opt.boxHeight - 2.4, 1, 1, "F");
          doc.setFont("helvetica", "bold");
          doc.setFontSize(6.8);
          doc.setTextColor(255, 255, 255);
          doc.text(opt.id, ML + 8.5, innerY + (opt.boxHeight / 2) + 0.8, { align: "center" });

          // Option text
          doc.setFont("helvetica", "bold");
          doc.setFontSize(7.8);
          doc.setTextColor(6, 95, 70);
          doc.text(opt.textLines, ML + 13, innerY + 4.0);

          // Correct Solution Indicator badge
          doc.setFont("helvetica", "bold");
          doc.setFontSize(6.5);
          doc.setTextColor(green[0], green[1], green[2]);
          doc.text("[✓ CORRECT SOLUTION]", MR - 6, innerY + 4.0, { align: "right" });
        } else {
          doc.setFillColor(255, 255, 255);
          doc.setDrawColor(borderLight[0], borderLight[1], borderLight[2]);
          doc.roundedRect(ML + 4.5, innerY, TW - 9, opt.boxHeight, 1.5, 1.5, "FD");

          // Option ID Badge (Slate circle)
          doc.setFillColor(241, 245, 249);
          doc.roundedRect(ML + 6, innerY + 1.2, 5, opt.boxHeight - 2.4, 1, 1, "F");
          doc.setFont("helvetica", "bold");
          doc.setFontSize(6.8);
          doc.setTextColor(slate[0], slate[1], slate[2]);
          doc.text(opt.id, ML + 8.5, innerY + (opt.boxHeight / 2) + 0.8, { align: "center" });

          // Option text
          doc.setFont("helvetica", "normal");
          doc.setFontSize(7.8);
          doc.setTextColor(slate[0], slate[1], slate[2]);
          doc.text(opt.textLines, ML + 13, innerY + 4.0);
        }
        innerY += opt.boxHeight + 1.8;
      });
      innerY += 1.5;
    }

    // Subjective model answer / grading rubric
    if (rubricLines.length > 0) {
      const rubricH = rubricLines.length * 3.6 + 7.5;
      doc.setFillColor(248, 250, 252);
      doc.setDrawColor(borderLight[0], borderLight[1], borderLight[2]);
      doc.roundedRect(ML + 4.5, innerY, TW - 9, rubricH, 1.5, 1.5, "FD");

      doc.setFont("helvetica", "bold");
      doc.setFontSize(6.8);
      doc.setTextColor(slate[0], slate[1], slate[2]);
      doc.text("BENCHMARK MODEL ANSWER & GRADING RUBRIC:", ML + 7, innerY + 3.8);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(7.4);
      doc.setTextColor(navy[0], navy[1], navy[2]);
      doc.text(rubricLines, ML + 7, innerY + 7.2);
      innerY += rubricH + 2;
    }

    // Explanation / Solution Key Block
    if (expLines.length > 0) {
      const expH = expLines.length * 3.6 + 7.5;
      doc.setFillColor(254, 252, 232); // soft yellow tint
      doc.setDrawColor(253, 224, 71);
      doc.roundedRect(ML + 4.5, innerY, TW - 9, expH, 1.5, 1.5, "FD");

      doc.setFont("helvetica", "bold");
      doc.setFontSize(6.8);
      doc.setTextColor(161, 98, 7);
      doc.text("💡 OFFICIAL SOLUTION RATIONALE & KEY TAKEAWAYS:", ML + 7, innerY + 3.8);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(7.4);
      doc.setTextColor(113, 63, 18);
      doc.text(expLines, ML + 7, innerY + 7.2);
      innerY += expH + 2;
    }

    // Advance to next question with clean gap
    curY += neededHeight + 3.5;
  });

  // ── 4. Founder Signature & Corporate Verification Block ───────────
  if (curY + 38 > BOTTOM_LIMIT_Y) {
    doc.addPage();
    curY = TOP_CONTENT_Y;
  }

  curY += 2;
  const sealH = 34;
  doc.setFillColor(bgLight[0], bgLight[1], bgLight[2]);
  doc.setDrawColor(gold[0], gold[1], gold[2]);
  doc.setLineWidth(0.5);
  doc.roundedRect(ML, curY, TW, sealH, 2, 2, "FD");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(navy[0], navy[1], navy[2]);
  doc.text("EXECUTIVE AUTHORIZATION & CORPORATE VERIFICATION SEAL", ML + 6, curY + 6);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(slate[0], slate[1], slate[2]);
  doc.text("This examination paper and benchmark rubric have been officially approved and sealed.", ML + 6, curY + 10.5);
  doc.text("Academic & Corporate Directorate • Vyntyra Consultancy Services Pvt. Ltd. (UDYAM-AP-10-0143100)", ML + 6, curY + 14.5);

  // Founder Signature
  if (sigBase64) {
    try {
      doc.addImage(sigBase64, "PNG", MR - 50, curY + 8, 42, 14);
    } catch (_) {}
  }

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(ink[0], ink[1], ink[2]);
  doc.text("Jami Eswar Anil Kumar", ML + 6, curY + 23);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(slate[0], slate[1], slate[2]);
  doc.text("Founder & Managing Director", ML + 6, curY + 27);
  doc.text(`Official Verification Hash: VCS-CBT-${exam.id ? exam.id.slice(0, 8).toUpperCase() : "SECURE"}-${Date.now().toString().slice(-6)}`, ML + 6, curY + 30.8);

  // ── 5. Final Pass: Two-Pass Dynamic Total Page Count & Headers ────
  const totalPages = doc.internal.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    drawHeader(p === 1);
    drawFooter(p, totalPages);
  }

  const pdfArrayBuffer = doc.output("arraybuffer");
  return Buffer.from(pdfArrayBuffer);
}

export function generateCbtExamCsv({
  exam,
  questions,
}: {
  exam: any;
  questions: any[];
}): string {
  const escapeCsv = (val: any) => {
    if (val === null || val === undefined) return '""';
    const str = String(val).replace(/"/g, '""');
    return `"${str}"`;
  };

  const headers = [
    "Question Number",
    "Question Type",
    "Points",
    "Time Limit (Seconds)",
    "Question Text",
    "Option A",
    "Option B",
    "Option C",
    "Option D",
    "Correct Answer / Solution",
    "Explanation",
    "Reference Code",
    "Test Cases",
    "Exam Title",
    "Passing Score (%)",
  ];

  const rows: string[] = [headers.join(",")];

  questions.forEach((q: any, idx: number) => {
    const options = Array.isArray(q.options)
      ? q.options
      : typeof q.options === "object" && q.options !== null
      ? Object.entries(q.options).map(([id, text]) => ({ id, text }))
      : [];

    const optA = options.find((o: any) => String(o.id).toUpperCase() === "A")?.text || options[0]?.text || "";
    const optB = options.find((o: any) => String(o.id).toUpperCase() === "B")?.text || options[1]?.text || "";
    const optC = options.find((o: any) => String(o.id).toUpperCase() === "C")?.text || options[2]?.text || "";
    const optD = options.find((o: any) => String(o.id).toUpperCase() === "D")?.text || options[3]?.text || "";

    const correctAns = typeof q.correct_answer === "object" ? q.correct_answer?.id || JSON.stringify(q.correct_answer) : String(q.correct_answer || "");

    const row = [
      escapeCsv(idx + 1),
      escapeCsv(q.question_type || "mcq"),
      escapeCsv(q.max_points || 10),
      escapeCsv(q.time_limit_seconds || 60),
      escapeCsv(q.question_text || ""),
      escapeCsv(optA),
      escapeCsv(optB),
      escapeCsv(optC),
      escapeCsv(optD),
      escapeCsv(correctAns),
      escapeCsv(q.explanation || ""),
      escapeCsv(q.reference_code || ""),
      escapeCsv(q.test_cases ? JSON.stringify(q.test_cases) : ""),
      escapeCsv(exam.title || ""),
      escapeCsv(exam.passing_score || 50),
    ];
    rows.push(row.join(","));
  });

  return rows.join("\r\n");
}

export async function exportAndStoreExamPaper({
  exam,
  questions,
  targetLabels = [],
}: {
  exam: any;
  questions: any[];
  targetLabels?: string[];
}): Promise<{ pdfUrl: string; csvUrl: string }> {
  const cleanTitle = (exam.title || "Exam")
    .replace(/[^a-zA-Z0-9_-]/g, "_")
    .slice(0, 30);
  const examId = exam.id || `exam_${Date.now()}`;

  const pdfKey = `cbt_exam_papers/${examId}/${cleanTitle}_Official_Paper.pdf`;
  const csvKey = `cbt_exam_papers/${examId}/${cleanTitle}_Questions.csv`;

  let pdfUrl = "";
  let csvUrl = "";

  try {
    const pdfBuffer = await generateCbtExamPdf({ exam, questions, targetLabels });
    pdfUrl = await uploadBufferToR2(pdfBuffer, pdfKey, "application/pdf");
  } catch (pdfErr) {
    console.error("[exportAndStoreExamPaper] PDF Generation error:", pdfErr);
  }

  try {
    const csvContent = generateCbtExamCsv({ exam, questions });
    const csvBuffer = Buffer.from(csvContent, "utf-8");
    csvUrl = await uploadBufferToR2(csvBuffer, csvKey, "text/csv");
  } catch (csvErr) {
    console.error("[exportAndStoreExamPaper] CSV Generation error:", csvErr);
  }

  return { pdfUrl, csvUrl };
}
