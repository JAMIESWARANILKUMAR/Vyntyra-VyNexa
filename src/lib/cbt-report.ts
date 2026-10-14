import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export interface CbtQuestionAudit {
  question_id: string;
  question_number: number;
  question_text: string;
  question_type: string;
  max_points: number;
  awarded_score: number;
  is_correct: boolean;
  candidate_answer: string;
  correct_answer: string;
  explanation?: string;
  feedback?: string;
}

export interface CbtNextAttemptSuggestion {
  title: string;
  category: "concept" | "technique" | "strategy" | "benchmark";
  advice: string;
}

export interface CbtReportData {
  candidateName: string;
  candidateEmail: string;
  internId: string;
  examTitle: string;
  examDescription?: string;
  submittedAt: string;
  submissionId: string;
  totalScore: number;
  maxScore: number;
  percentage: number;
  passingScore: number;
  passed: boolean;
  totalQuestions: number;
  correctCount: number;
  partialCount: number;
  incorrectCount: number;
  accuracyRate: number;
  infractionsCount: number;
  malpracticeLogs?: any[];
  questions: CbtQuestionAudit[];
  suggestions: CbtNextAttemptSuggestion[];
}

export function generateNextAttemptSuggestions(
  questions: CbtQuestionAudit[],
  passingScore: number,
  percentage: number,
  totalScore: number,
  maxScore: number
): CbtNextAttemptSuggestion[] {
  const suggestions: CbtNextAttemptSuggestion[] = [];
  const missedQuestions = questions.filter(q => q.awarded_score < q.max_points);
  const zeroScoreQuestions = questions.filter(q => q.awarded_score === 0);
  const partialQuestions = questions.filter(q => q.awarded_score > 0 && q.awarded_score < q.max_points);

  // 1. Benchmark & Points Gap Target
  if (percentage < passingScore) {
    const pointsNeeded = Math.max(1, Math.ceil((passingScore / 100) * maxScore) - totalScore);
    suggestions.push({
      title: "Score Target for Passing Qualification",
      category: "benchmark",
      advice: `You are currently at ${percentage}%. You need ${pointsNeeded} additional points to cross the ${passingScore}% passing threshold. Turning ${Math.ceil(pointsNeeded / 10)} of your ${missedQuestions.length} missed questions into full marks will secure qualification.`
    });
  } else {
    suggestions.push({
      title: "Passing Benchmark Achieved",
      category: "benchmark",
      advice: `Congratulations on clearing the ${passingScore}% benchmark with ${percentage}%! To reach the 90%+ master tier on your next attempt, focus on eliminating partial marks in subjective and scenario questions.`
    });
  }

  // 2. Question Type Analysis
  const missedTf = missedQuestions.filter(q => q.question_type.toLowerCase() === "true_false");
  if (missedTf.length > 0) {
    suggestions.push({
      title: "True / False Conceptual Precision",
      category: "technique",
      advice: `You missed ${missedTf.length} True/False question(s). For technical statements, look out for absolute terms (e.g., 'always', 'only', 'server-side', 'never') which often indicate common enterprise misconceptions.`
    });
  }

  const missedSubjective = missedQuestions.filter(q => 
    q.question_type.toLowerCase() === "short_answer" || 
    q.question_type.toLowerCase() === "long_answer" || 
    q.question_type.toLowerCase() === "subjective"
  );
  if (missedSubjective.length > 0) {
    suggestions.push({
      title: "Comprehensive Technical Definitions in Written Answers",
      category: "strategy",
      advice: `In written answers, avoid high-level summaries. Always provide the formal technical definition, primary objective, key components (e.g. instruction, context, input data), and real-world mechanisms to capture full 10/10 rubric marks.`
    });
  }

  const missedCoding = missedQuestions.filter(q => q.question_type.toLowerCase() === "coding" || q.question_type.toLowerCase() === "code_snippet");
  if (missedCoding.length > 0) {
    suggestions.push({
      title: "Code Syntax & Output Trace Verification",
      category: "technique",
      advice: `On code snippet and implementation questions, trace execution step-by-step on scratch paper before selecting your answer. Pay special attention to return types, operator precedence, and variable scopes.`
    });
  }

  // 3. Topic Discovery from Question Texts
  const missedTopics: string[] = [];
  missedQuestions.forEach(q => {
    const text = q.question_text.toLowerCase();
    if (text.includes("prompt")) missedTopics.push("Prompt Engineering Principles");
    if (text.includes("constructor") || text.includes("prototype") || text.includes("object")) missedTopics.push("JavaScript Object Blueprints & OOP");
    if (text.includes("jdbc") || text.includes("sql") || text.includes("database")) missedTopics.push("Database Connectivity & SQL APIs");
    if (text.includes("async") || text.includes("promise") || text.includes("thread")) missedTopics.push("Asynchronous Concurrency");
    if (text.includes("security") || text.includes("auth") || text.includes("jwt")) missedTopics.push("Security & Identity Standards");
    if (text.includes("proctor") || text.includes("malpractice") || text.includes("exam")) missedTopics.push("Assessment Regulations & Policy");
  });

  const uniqueTopics = Array.from(new Set(missedTopics));
  if (uniqueTopics.length > 0) {
    suggestions.push({
      title: "High-Priority Revision Topics",
      category: "concept",
      advice: `Prioritize deep revision on: ${uniqueTopics.join(", ")}. Reviewing these exact modules in the syllabus documentation will yield the fastest score improvement.`
    });
  }

  // General fallback if suggestions are sparse
  if (suggestions.length < 3) {
    suggestions.push({
      title: "Time Allocation & Exam Pacing",
      category: "strategy",
      advice: "Allocate at least 45 seconds per MCQ and reserve 3-4 minutes for complex coding and scenario items. Review all flagged answers before final submission."
    });
  }

  return suggestions;
}

export function downloadCbtDetailedReportPdf(data: CbtReportData): void {
  const doc = new jsPDF({ format: "a4", unit: "mm" });
  const PW = 210;
  const ML = 14;
  const MR = PW - 14;
  const TW = MR - ML;

  const navy = [15, 23, 42]; // #0f172a
  const gold = [180, 130, 20]; // #b48214
  const slate = [71, 85, 105];
  const emerald = [16, 185, 129];
  const rose = [225, 29, 72];
  const amber = [217, 119, 6];

  // Top Corporate Ribbon
  doc.setFillColor(navy[0], navy[1], navy[2]);
  doc.rect(0, 0, PW, 5, "F");
  doc.setFillColor(gold[0], gold[1], gold[2]);
  doc.rect(0, 5, PW, 1.5, "F");

  // Header Title
  let y = 14;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(navy[0], navy[1], navy[2]);
  doc.text("VYNTYRA CONSULTANCY SERVICES", ML, y);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(slate[0], slate[1], slate[2]);
  doc.text("DIRECTORATE OF TECHNICAL ASSESSMENTS • PROJECT VYNEXA", ML, y + 4.5);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.text("Confidential Official Assessment Mark Sheet & Proctoring Telemetry Audit", ML, y + 8.5);

  // Result Badge in top-right
  const badgeText = data.passed ? "QUALIFIED / PASSED" : "FAILED / RETAKE REQUIRED";
  const badgeBg = data.passed ? emerald : rose;
  doc.setFillColor(badgeBg[0], badgeBg[1], badgeBg[2]);
  doc.roundedRect(MR - 55, y - 2, 55, 11, 1.5, 1.5, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(255, 255, 255);
  doc.text(badgeText, MR - 27.5, y + 5, { align: "center" });

  y += 14;
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.5);
  doc.line(ML, y, MR, y);
  y += 5;

  // Candidate & Exam Info Table
  autoTable(doc, {
    startY: y,
    head: [["CANDIDATE PROFILE", "ASSESSMENT METRICS"]],
    body: [
      [
        `Candidate Name:  ${data.candidateName}\nEmail Address:   ${data.candidateEmail}\nIntern / Reg ID: ${data.internId}`,
        `Exam Title:      ${data.examTitle}\nDate Submitted:  ${data.submittedAt}\nSubmission ID:   ${data.submissionId.slice(0, 18)}`
      ]
    ],
    theme: "plain",
    headStyles: { fillColor: [241, 245, 249], textColor: [15, 23, 42], fontStyle: "bold", fontSize: 8 },
    bodyStyles: { fontSize: 8, textColor: [51, 65, 85], cellPadding: 3.5, font: "courier" },
    styles: { overflow: "linebreak" },
    margin: { left: ML, right: ML }
  });

  // @ts-ignore
  y = (doc.lastAutoTable?.finalY || y + 25) + 5;

  // Executive Scorecard Metrics Table
  autoTable(doc, {
    startY: y,
    head: [["TOTAL POINTS", "PERCENTAGE", "BENCHMARK", "CORRECT (FULL)", "PARTIAL", "INCORRECT", "ACCURACY"]],
    body: [
      [
        `${data.totalScore} / ${data.maxScore} pts`,
        `${data.percentage}%`,
        `${data.passingScore}%`,
        `${data.correctCount} / ${data.totalQuestions}`,
        `${data.partialCount}`,
        `${data.incorrectCount}`,
        `${data.accuracyRate}%`
      ]
    ],
    theme: "grid",
    headStyles: { fillColor: [15, 23, 42], textColor: 255, fontStyle: "bold", fontSize: 7.5, halign: "center" },
    bodyStyles: { fontSize: 8.5, fontStyle: "bold", textColor: [15, 23, 42], halign: "center", cellPadding: 3 },
    margin: { left: ML, right: ML }
  });

  // @ts-ignore
  y = (doc.lastAutoTable?.finalY || y + 20) + 6;

  // Suggestions for Next Attempt Box
  if (data.suggestions && data.suggestions.length > 0) {
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(203, 213, 225);
    doc.roundedRect(ML, y, TW, 6 + (data.suggestions.length * 10.5), 1.5, 1.5, "FD");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.setTextColor(navy[0], navy[1], navy[2]);
    doc.text("EXAMINER AUDIT: RECOMMENDATIONS & ROADMAP FOR NEXT ATTEMPT", ML + 4, y + 4.5);

    let suggY = y + 9;
    data.suggestions.slice(0, 4).forEach((s) => {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(7.5);
      doc.setTextColor(indigoText[0], indigoText[1], indigoText[2]);
      doc.text(`* ${s.title}:`, ML + 4, suggY);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(7);
      doc.setTextColor(slate[0], slate[1], slate[2]);
      const wrapped = doc.splitTextToSize(s.advice, TW - 8);
      doc.text(wrapped, ML + 6, suggY + 3.5);
      suggY += 3.5 + (wrapped.length * 2.8);
    });

    y = suggY + 4;
  }

  // Question-by-Question Response Audit
  const questionRows = data.questions.map((q) => {
    const isFull = q.awarded_score >= q.max_points;
    const isPartial = q.awarded_score > 0 && q.awarded_score < q.max_points;
    const scoreText = `${q.awarded_score} / ${q.max_points} pts`;

    return [
      `Q${q.question_number}`,
      (q.question_type || "mcq").toUpperCase().replace("_", " "),
      q.question_text,
      q.candidate_answer || "(Unanswered)",
      q.correct_answer || "Refer to explanation",
      scoreText,
      q.feedback || q.explanation || "Official pre-marked solution."
    ];
  });

  autoTable(doc, {
    startY: y,
    head: [["#", "TYPE", "QUESTION STATEMENT", "CANDIDATE RESPONSE", "CORRECT BENCHMARK", "SCORE", "FEEDBACK & REMARKS"]],
    body: questionRows,
    theme: "striped",
    headStyles: { fillColor: [30, 41, 59], textColor: 255, fontStyle: "bold", fontSize: 7, halign: "center" },
    bodyStyles: { fontSize: 6.8, textColor: [30, 41, 59], cellPadding: 2.5 },
    columnStyles: {
      0: { cellWidth: 9, halign: "center", fontStyle: "bold" },
      1: { cellWidth: 16, halign: "center", fontStyle: "bold", fontSize: 6 },
      2: { cellWidth: 48 },
      3: { cellWidth: 32 },
      4: { cellWidth: 30, textColor: [16, 149, 102], fontStyle: "bold" },
      5: { cellWidth: 15, halign: "center", fontStyle: "bold" },
      6: { cellWidth: 32, fontSize: 6.5 }
    },
    didParseCell: (hookData) => {
      if (hookData.section === "body" && hookData.column.index === 5) {
        const text = String(hookData.cell.raw || "");
        if (text.startsWith("0 ")) {
          hookData.cell.styles.textColor = [225, 29, 72]; // Rose
        } else if (text.includes("10 / 10") || text.includes("10/10")) {
          hookData.cell.styles.textColor = [16, 185, 129]; // Emerald
        } else {
          hookData.cell.styles.textColor = [217, 119, 6]; // Amber
        }
      }
    },
    margin: { left: ML, right: ML }
  });

  // Footer on all pages
  // @ts-ignore
  const totalPages = doc.internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.3);
    doc.line(ML, 287, MR, 287);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(6.5);
    doc.setTextColor(148, 163, 184);
    doc.text(`Vyntyra VyNexa Connect Automated Assessment Audit • Secure Digital Record • Session ${data.submissionId.slice(0, 12)}`, ML, 291);
    doc.text(`Page ${i} of ${totalPages}`, MR, 291, { align: "right" });
  }

  // Trigger browser download
  const safeCandidate = data.candidateName.replace(/[^a-zA-Z0-9_-]/g, "_") || "Candidate";
  const safeExam = data.examTitle.replace(/[^a-zA-Z0-9_-]/g, "_") || "CBT_Exam";
  doc.save(`VCS_CBT_Report_${safeCandidate}_${safeExam}.pdf`);
}

const indigoText = [67, 56, 202];
