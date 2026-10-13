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

  const navy = [15, 23, 42]; // #0f172a
  const gold = [176, 136, 24]; // #b08818
  const slate = [71, 85, 105]; // #475569
  const ink = [30, 41, 59]; // #1e293b
  const green = [16, 185, 129]; // #10b981
  const bgLight = [248, 250, 252]; // #f8fafc
  const borderLight = [226, 232, 240]; // #e2e8f0

  const PW = 210;
  const PH = 297;
  const ML = 16;
  const MR = PW - 16;
  const TW = MR - ML;

  const logoBase64 = getLocalAssetBase64("icon-512.png");
  const sigBase64 = getLocalAssetBase64("signature.png");

  let currentPage = 1;

  const drawHeader = (isFirstPage: boolean) => {
    // Top colored bands
    doc.setFillColor(navy[0], navy[1], navy[2]);
    doc.rect(0, 0, PW, 4.5, "F");
    doc.setFillColor(gold[0], gold[1], gold[2]);
    doc.rect(0, 4.5, PW, 1, "F");

    let y = 10;
    if (logoBase64) {
      try {
        doc.addImage(logoBase64, "PNG", ML, y, 16, 16);
      } catch (_) {}
    }

    const textX = logoBase64 ? ML + 20 : ML;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.setTextColor(navy[0], navy[1], navy[2]);
    doc.text("VYNTYRA CONSULTANCY SERVICES", textX, y + 4.5);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.setTextColor(slate[0], slate[1], slate[2]);
    doc.text("PROJECT VYNEXA • COMPUTER-BASED EXAMINATION & EVALUATION DIRECTORATE", textX, y + 9);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.text("ISO 9001:2015 Certified  |  MSME Registered: UDYAM-AP-10-0143100  |  Visakhapatnam, AP, India", textX, y + 13.5);

    // Right Badge
    doc.setFillColor(navy[0], navy[1], navy[2]);
    doc.roundedRect(PW - 65, y, 49, 14, 2, 2, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.setTextColor(255, 255, 255);
    doc.text("OFFICIAL EXAM PAPER", PW - 40.5, y + 5.5, { align: "center" });
    doc.setFontSize(6.5);
    doc.setTextColor(245, 158, 11);
    doc.text("CONFIDENTIAL SOLUTION GUIDE", PW - 40.5, y + 10.5, { align: "center" });

    // Divider Rule
    doc.setDrawColor(borderLight[0], borderLight[1], borderLight[2]);
    doc.setLineWidth(0.5);
    doc.line(ML, 29, MR, 29);
  };

  const drawFooter = () => {
    doc.setDrawColor(borderLight[0], borderLight[1], borderLight[2]);
    doc.setLineWidth(0.4);
    doc.line(ML, PH - 14, MR, PH - 14);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(slate[0], slate[1], slate[2]);
    doc.text("CONFIDENTIAL & PROPRIETARY • VYNTYRA CONSULTANCY SERVICES • ADMIN EVALUATION COPY", ML, PH - 9);
    doc.text(`Page ${currentPage}`, MR, PH - 9, { align: "right" });
  };

  // Draw Page 1
  drawHeader(true);
  drawFooter();

  let curY = 34;

  // ── Exam Metadata Banner ──────────────────────────────────────────
  doc.setFillColor(bgLight[0], bgLight[1], bgLight[2]);
  doc.setDrawColor(borderLight[0], borderLight[1], borderLight[2]);
  doc.roundedRect(ML, curY, TW, 36, 3, 3, "FD");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(navy[0], navy[1], navy[2]);
  doc.text(exam.title || "Computer-Based Assessment", ML + 5, curY + 7);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(slate[0], slate[1], slate[2]);
  const desc = doc.splitTextToSize(exam.description || "Official evaluation paper generated and allocated via VyNexa Connect CBT Engine.", TW - 10);
  doc.text(desc[0] || "", ML + 5, curY + 12);

  // Grid details inside banner
  const totalPoints = questions.reduce((sum, q) => sum + (Number(q.max_points) || 10), 0);
  const col1X = ML + 5;
  const col2X = ML + 55;
  const col3X = ML + 110;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(ink[0], ink[1], ink[2]);
  doc.text(`Duration: ${exam.time_limit_minutes || 30} Minutes`, col1X, curY + 20);
  doc.text(`Total Questions: ${questions.length}`, col2X, curY + 20);
  doc.text(`Total Marks: ${totalPoints} Pts`, col3X, curY + 20);

  doc.text(`Passing Criteria: ${exam.passing_score || 50}%`, col1X, curY + 26);
  doc.text(`Camera Policy: ${exam.enable_camera !== false ? "Webcam Enforced" : "Focus Tracking Only"}`, col2X, curY + 26);
  doc.text(`Strictness Mode: ${(exam.camera_strictness || "standard").toUpperCase()}`, col3X, curY + 26);

  const targetsStr = targetLabels && targetLabels.length > 0 ? targetLabels.slice(0, 3).join(", ") + (targetLabels.length > 3 ? ` (+${targetLabels.length - 3} more)` : "") : "All Assigned Interns";
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(slate[0], slate[1], slate[2]);
  doc.text(`Allocated Candidate(s) / Teams: ${targetsStr}`, col1X, curY + 32);

  curY += 42;

  // ── Questions Section ─────────────────────────────────────────────
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10.5);
  doc.setTextColor(navy[0], navy[1], navy[2]);
  doc.text(`EXAMINATION QUESTIONS & OFFICIAL SOLUTION KEYS (${questions.length})`, ML, curY);
  curY += 5;

  questions.forEach((q: any, idx: number) => {
    // Check if new page needed
    if (curY > PH - 48) {
      doc.addPage();
      currentPage++;
      drawHeader(false);
      drawFooter();
      curY = 34;
    }

    const qNum = idx + 1;
    const qType = (q.question_type || "mcq").toUpperCase();
    const qPoints = q.max_points || 10;
    const qTimer = q.time_limit_seconds || 60;

    // Question Card Box
    doc.setFillColor(bgLight[0], bgLight[1], bgLight[2]);
    doc.setDrawColor(borderLight[0], borderLight[1], borderLight[2]);

    const qTextLines = doc.splitTextToSize(`${qNum}. ${q.question_text || ""}`, TW - 10);
    const options = Array.isArray(q.options)
      ? q.options
      : typeof q.options === "object" && q.options !== null
      ? Object.entries(q.options).map(([id, text]) => ({ id, text }))
      : [];

    let cardHeight = 12 + qTextLines.length * 4.2;
    if (options.length > 0) cardHeight += options.length * 4.8 + 4;
    if (q.explanation) cardHeight += 10;
    if (q.reference_code) cardHeight += 16;

    // Bounded card height or page break
    if (curY + cardHeight > PH - 25) {
      doc.addPage();
      currentPage++;
      drawHeader(false);
      drawFooter();
      curY = 34;
    }

    doc.roundedRect(ML, curY, TW, cardHeight, 2, 2, "FD");

    // Header badge inside card
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.setTextColor(navy[0], navy[1], navy[2]);
    doc.text(`QUESTION #${qNum}  •  ${qType}  •  ${qPoints} POINTS  •  TIMING: ${qTimer} SECONDS`, ML + 4, curY + 5.5);

    doc.setDrawColor(borderLight[0], borderLight[1], borderLight[2]);
    doc.line(ML + 4, curY + 7.5, MR - 4, curY + 7.5);

    // Question statement
    let innerY = curY + 12;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.setTextColor(ink[0], ink[1], ink[2]);
    doc.text(qTextLines, ML + 4, innerY);
    innerY += qTextLines.length * 4.2 + 2;

    // Options (for MCQ / Scenario)
    if (options.length > 0) {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      options.forEach((opt: any) => {
        const optId = String(opt.id || "").toUpperCase();
        const correctId = typeof q.correct_answer === "object" ? String(q.correct_answer?.id || "") : String(q.correct_answer || "");
        const isCorrect = optId === correctId.toUpperCase() || optId === correctId;

        if (isCorrect) {
          doc.setFillColor(236, 253, 245); // light emerald
          doc.setDrawColor(green[0], green[1], green[2]);
          doc.roundedRect(ML + 4, innerY - 3, TW - 8, 4.2, 1, 1, "FD");
          doc.setTextColor(6, 95, 70);
          doc.setFont("helvetica", "bold");
          doc.text(`[${optId}] ${opt.text || ""}  ✓ [CORRECT SOLUTION]`, ML + 6, innerY);
        } else {
          doc.setTextColor(slate[0], slate[1], slate[2]);
          doc.setFont("helvetica", "normal");
          doc.text(`[${optId}] ${opt.text || ""}`, ML + 6, innerY);
        }
        innerY += 4.8;
      });
      innerY += 2;
    }

    // Explanation / Solution Key Block
    if (q.explanation) {
      doc.setFillColor(241, 245, 249);
      doc.setDrawColor(203, 213, 225);
      doc.roundedRect(ML + 4, innerY - 2.5, TW - 8, 7.5, 1, 1, "FD");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(7);
      doc.setTextColor(navy[0], navy[1], navy[2]);
      const cleanExp = doc.splitTextToSize(`Solution Key: ${q.explanation}`, TW - 12);
      doc.text(cleanExp[0] || "", ML + 6, innerY + 1.5);
      innerY += 8;
    }

    curY += cardHeight + 4;
  });

  // ── Founder Signature & Seal Block ────────────────────────────────
  if (curY > PH - 55) {
    doc.addPage();
    currentPage++;
    drawHeader(false);
    drawFooter();
    curY = 34;
  }

  curY += 4;
  doc.setFillColor(bgLight[0], bgLight[1], bgLight[2]);
  doc.setDrawColor(gold[0], gold[1], gold[2]);
  doc.roundedRect(ML, curY, TW, 42, 2, 2, "FD");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(navy[0], navy[1], navy[2]);
  doc.text("EXECUTIVE AUTHORIZATION & CORPORATE VERIFICATION SEAL", ML + 6, curY + 6.5);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(slate[0], slate[1], slate[2]);
  doc.text("This examination paper, evaluation rubric, and proctoring parameters have been officially approved and sealed.", ML + 6, curY + 11.5);
  doc.text("Academic & Corporate Directorate • Vyntyra Consultancy Services Pvt. Ltd. (UDYAM-AP-10-0143100)", ML + 6, curY + 15.5);

  // Draw Signature Image
  if (sigBase64) {
    try {
      doc.addImage(sigBase64, "PNG", MR - 52, curY + 14, 42, 16);
    } catch (_) {}
  }

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(ink[0], ink[1], ink[2]);
  doc.text("Jami Eswar Anil Kumar", ML + 6, curY + 28);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(slate[0], slate[1], slate[2]);
  doc.text("Founder & Managing Director", ML + 6, curY + 32);
  doc.text(`Official Seal Verification ID: VCS-CBT-${exam.id ? exam.id.slice(0, 8).toUpperCase() : "SECURE"}-${Date.now().toString().slice(-6)}`, ML + 6, curY + 36);

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
