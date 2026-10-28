import React, { useState } from 'react';
import { 
  Award, CheckCircle2, AlertCircle, Download, FileText, 
  RotateCcw, Sparkles, TrendingUp, ShieldCheck, Eye, Activity, 
  MessageSquare, Code2, ChevronDown, ChevronUp, Share2, ArrowRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { MockInterviewReportData } from '@/lib/mock-interview.functions';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface InterviewReportProps {
  report: MockInterviewReportData;
  candidateName: string;
  targetRole: string;
  domain: string;
  difficulty: string;
  sessionId: string;
  reportR2Url?: string | null;
  onRetake?: () => void;
  onBackToDashboard?: () => void;
}

export function InterviewReport({
  report,
  candidateName,
  targetRole,
  domain,
  difficulty,
  sessionId,
  reportR2Url,
  onRetake,
  onBackToDashboard
}: InterviewReportProps) {
  const [expandedQuestion, setExpandedQuestion] = useState<number | null>(0);
  const [isExportingPdf, setIsExportingPdf] = useState(false);

  // Hiring Verdict color styling
  const getVerdictStyle = (verdict: string) => {
    switch (verdict) {
      case 'Strong Hire':
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-emerald-500/20';
      case 'Hire':
        return 'bg-blue-500/20 text-blue-300 border-blue-500/40 shadow-blue-500/20';
      case 'Leaning Hire':
        return 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40 shadow-indigo-500/20';
      case 'Needs Practice':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-amber-500/20';
      default:
        return 'bg-rose-500/20 text-rose-300 border-rose-500/40 shadow-rose-500/20';
    }
  };

  // Export Executive PDF Report
  const handleExportPdf = () => {
    setIsExportingPdf(true);
    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();

      // Header Banner
      doc.setFillColor(15, 23, 42); // Slate 900
      doc.rect(0, 0, pageWidth, 40, 'F');

      doc.setTextColor(255, 255, 255);
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.text("VYNTYRA AI MOCK INTERVIEW EVALUATION", 14, 20);

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`Official Executive Scorecard - Vyntyra Consultancy Services LMS`, 14, 28);
      doc.text(`Date: ${new Date().toLocaleDateString('en-US')}`, pageWidth - 55, 28);

      // Candidate Metadata Section
      doc.setTextColor(30, 41, 59);
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text("Candidate Profile & Scope", 14, 50);

      autoTable(doc, {
        startY: 55,
        head: [['Candidate Name', 'Target Position', 'Difficulty', 'Overall Score', 'Hiring Recommendation']],
        body: [[
          candidateName,
          targetRole,
          difficulty.toUpperCase(),
          `${report.overallScore} / 100`,
          report.hiringVerdict
        ]],
        theme: 'grid',
        headStyles: { fillColor: [30, 58, 138] }, // Indigo
        styles: { fontSize: 9 }
      });

      // Executive Summary
      const summaryY = (doc as any).lastAutoTable.finalY + 12;
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text("Executive Bar Raiser Summary", 14, summaryY);

      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      const splitSummary = doc.splitTextToSize(report.executiveSummary, pageWidth - 28);
      doc.text(splitSummary, 14, summaryY + 6);

      // Core Competency Breakdown Table
      const metricsY = summaryY + 6 + (splitSummary.length * 5) + 6;
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text("Multi-Modal Competency Evaluation", 14, metricsY);

      autoTable(doc, {
        startY: metricsY + 4,
        head: [['Pillar', 'Score', 'Key Metrics & Telemetry']],
        body: [
          ['Technical Competency', `${report.technicalScore}%`, `Problem Solving: ${report.technicalBreakdown.problemSolving}%, System Architecture: ${report.technicalBreakdown.systemArchitecture}%`],
          ['Communication & Fluency', `${report.communicationScore}%`, `Pacing: ${report.fluencyWpm} WPM, Filler Words: ${report.fillerWordsCount}`],
          ['Behavioral Presence', `${report.behavioralScore}%`, `Eye Contact: ${report.eyeContactPercent}%, Head Stability: ${report.headStabilityPercent}%`],
          ['Code Quality', `${report.technicalBreakdown.codeQuality}%`, `Algorithmic Correctness & Time/Space Complexity`]
        ],
        theme: 'striped',
        headStyles: { fillColor: [15, 23, 42] },
        styles: { fontSize: 8.5 }
      });

      // Key Strengths & Growth Areas
      const strengthsY = (doc as any).lastAutoTable.finalY + 10;
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text("Key Strengths & Growth Areas", 14, strengthsY);

      const strengthsList = report.keyStrengths.map(s => [ 'Strength', s ]);
      const improvementList = report.areasForImprovement.map(a => [ 'Improvement', a ]);

      autoTable(doc, {
        startY: strengthsY + 4,
        head: [['Type', 'Actionable Observation']],
        body: [...strengthsList, ...improvementList],
        theme: 'plain',
        headStyles: { fillColor: [71, 85, 105] },
        styles: { fontSize: 8 }
      });

      // Save PDF
      doc.save(`Mock_Interview_${candidateName.replace(/\s+/g, '_')}_${report.overallScore}.pdf`);
      toast.success("Executive PDF Report downloaded successfully!");
    } catch (err) {
      console.error("PDF generation failed:", err);
      toast.error("Failed to generate PDF report");
    } finally {
      setIsExportingPdf(false);
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto p-4 sm:p-6 space-y-6 text-white font-sans">
      
      {/* ─── Top Header & Verdict Hero ─── */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0e1322] via-[#090d18] to-[#06080e] border border-white/10 p-6 sm:p-8 shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
          
          {/* Left: Candidate Details & Verdict */}
          <div className="space-y-3 text-center md:text-left">
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
              <span className="px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30 text-xs font-mono uppercase">
                {domain.replace('_', ' ')} • {difficulty} Level
              </span>
              <span className={`px-3 py-1 rounded-full text-xs font-bold border shadow-lg ${getVerdictStyle(report.hiringVerdict)}`}>
                Verdict: {report.hiringVerdict}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              1:1 Mock Interview Evaluation Report
            </h1>
            <p className="text-sm text-gray-400 max-w-xl">
              Candidate: <strong className="text-white">{candidateName}</strong> for the role of <strong className="text-blue-400">{targetRole}</strong>. Evaluated dynamically via OpenRouter reasoning models and multi-modal telemetry.
            </p>
          </div>

          {/* Right: Giant Overall Score Circle */}
          <div className="flex flex-col items-center justify-center bg-black/40 border border-white/10 rounded-3xl p-6 shadow-xl shrink-0 min-w-[200px]">
            <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-1">
              Overall Performance
            </span>
            <div className="flex items-baseline gap-1">
              <span className="text-5xl font-black bg-gradient-to-r from-blue-400 via-indigo-300 to-emerald-400 bg-clip-text text-transparent">
                {report.overallScore}
              </span>
              <span className="text-gray-400 text-lg font-bold">/100</span>
            </div>
            <div className="mt-2 flex items-center gap-1.5 text-xs text-emerald-400 font-semibold">
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span>Session Completed</span>
            </div>
          </div>

        </div>

        {/* Executive Summary Card */}
        <div className="mt-6 p-4 rounded-2xl bg-white/[0.03] border border-white/10 text-xs sm:text-sm text-gray-300 leading-relaxed">
          <strong className="text-blue-400 block mb-1 font-semibold uppercase tracking-wider text-[11px]">
            Executive Bar Raiser Assessment:
          </strong>
          {report.executiveSummary}
        </div>
      </div>

      {/* ─── Multi-Modal Competency Grid ─── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card 1: Technical Competency */}
        <div className="p-5 rounded-2xl bg-black/50 border border-white/10 space-y-3">
          <div className="flex items-center justify-between text-xs text-gray-400">
            <span className="font-bold uppercase tracking-wider">Technical Depth</span>
            <Code2 className="h-4 w-4 text-blue-400" />
          </div>
          <div className="text-3xl font-extrabold text-white">
            {report.technicalScore}%
          </div>
          <div className="space-y-1.5 text-xs text-gray-300">
            <div className="flex justify-between text-[11px]">
              <span>Problem Solving</span>
              <span className="font-mono text-blue-400">{report.technicalBreakdown.problemSolving}%</span>
            </div>
            <div className="flex justify-between text-[11px]">
              <span>Architecture</span>
              <span className="font-mono text-blue-400">{report.technicalBreakdown.systemArchitecture}%</span>
            </div>
            <div className="flex justify-between text-[11px]">
              <span>Code Quality</span>
              <span className="font-mono text-blue-400">{report.technicalBreakdown.codeQuality}%</span>
            </div>
          </div>
        </div>

        {/* Card 2: Communication & Pacing */}
        <div className="p-5 rounded-2xl bg-black/50 border border-white/10 space-y-3">
          <div className="flex items-center justify-between text-xs text-gray-400">
            <span className="font-bold uppercase tracking-wider">Speech & Fluency</span>
            <TrendingUp className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="text-3xl font-extrabold text-white">
            {report.communicationScore}%
          </div>
          <div className="space-y-1.5 text-xs text-gray-300">
            <div className="flex justify-between text-[11px]">
              <span>Pacing</span>
              <span className="font-mono text-emerald-400">{report.fluencyWpm} WPM</span>
            </div>
            <div className="flex justify-between text-[11px]">
              <span>Filler Words</span>
              <span className="font-mono text-emerald-400">{report.fillerWordsCount} detected</span>
            </div>
            <div className="flex justify-between text-[11px]">
              <span>Clarity & Diction</span>
              <span className="font-mono text-emerald-400">{report.communicationBreakdown.clarity}%</span>
            </div>
          </div>
        </div>

        {/* Card 3: Behavioral & Telemetry */}
        <div className="p-5 rounded-2xl bg-black/50 border border-white/10 space-y-3">
          <div className="flex items-center justify-between text-xs text-gray-400">
            <span className="font-bold uppercase tracking-wider">Presence & Focus</span>
            <Eye className="h-4 w-4 text-indigo-400" />
          </div>
          <div className="text-3xl font-extrabold text-white">
            {report.behavioralScore}%
          </div>
          <div className="space-y-1.5 text-xs text-gray-300">
            <div className="flex justify-between text-[11px]">
              <span>Eye Contact</span>
              <span className="font-mono text-indigo-400">{report.eyeContactPercent}%</span>
            </div>
            <div className="flex justify-between text-[11px]">
              <span>Head Stability</span>
              <span className="font-mono text-indigo-400">{report.headStabilityPercent}%</span>
            </div>
            <div className="flex justify-between text-[11px]">
              <span>Active Listening</span>
              <span className="font-mono text-indigo-400">{report.communicationBreakdown.activeListening}%</span>
            </div>
          </div>
        </div>

        {/* Card 4: Algorithmic Rigor */}
        <div className="p-5 rounded-2xl bg-black/50 border border-white/10 space-y-3">
          <div className="flex items-center justify-between text-xs text-gray-400">
            <span className="font-bold uppercase tracking-wider">CS Fundamentals</span>
            <ShieldCheck className="h-4 w-4 text-purple-400" />
          </div>
          <div className="text-3xl font-extrabold text-white">
            {report.technicalBreakdown.csFundamentals}%
          </div>
          <p className="text-[11px] text-gray-400 leading-normal">
            Demonstrates solid understanding of data structures, complexity scaling, and edge-case boundaries.
          </p>
        </div>

      </div>

      {/* ─── Strengths & Growth Areas Split Grid ─── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        
        {/* Strengths */}
        <div className="p-5 rounded-3xl bg-emerald-500/[0.04] border border-emerald-500/20 space-y-3">
          <h3 className="text-sm font-bold text-emerald-400 flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4" />
            Key Candidate Strengths
          </h3>
          <ul className="space-y-2 text-xs text-gray-300">
            {report.keyStrengths.map((str, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
                <span>{str}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Areas for Improvement */}
        <div className="p-5 rounded-3xl bg-amber-500/[0.04] border border-amber-500/20 space-y-3">
          <h3 className="text-sm font-bold text-amber-400 flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            Targeted Areas for Improvement
          </h3>
          <ul className="space-y-2 text-xs text-gray-300">
            {report.areasForImprovement.map((imp, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-400 mt-1.5 shrink-0" />
                <span>{imp}</span>
              </li>
            ))}
          </ul>
        </div>

      </div>

      {/* ─── Turn-by-Turn Question Reviews ─── */}
      {report.questionReviews && report.questionReviews.length > 0 && (
        <div className="p-6 rounded-3xl bg-black/60 border border-white/10 space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-blue-400" />
            Turn-by-Turn Question Analysis & Feedback
          </h3>

          <div className="space-y-2.5">
            {report.questionReviews.map((rev, idx) => {
              const isExpanded = expandedQuestion === idx;

              return (
                <div key={idx} className="rounded-2xl border border-white/10 bg-white/[0.02] overflow-hidden">
                  <button
                    onClick={() => setExpandedQuestion(isExpanded ? null : idx)}
                    className="w-full p-4 flex items-center justify-between text-left hover:bg-white/[0.03] transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-xs text-blue-400 font-bold">Q{idx + 1}</span>
                      <span className="text-xs font-semibold text-white">{rev.question}</span>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                        {rev.score}%
                      </span>
                      {isExpanded ? <ChevronUp className="h-4 w-4 text-gray-400" /> : <ChevronDown className="h-4 w-4 text-gray-400" />}
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="p-4 border-t border-white/10 bg-black/40 text-xs space-y-2">
                      <div>
                        <strong className="text-gray-400 uppercase text-[10px] block">Candidate Answer:</strong>
                        <p className="text-gray-200 mt-0.5">{rev.candidateSummary}</p>
                      </div>
                      <div>
                        <strong className="text-blue-400 uppercase text-[10px] block">Bar Raiser Feedback:</strong>
                        <p className="text-gray-300 mt-0.5">{rev.feedback}</p>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ─── 3-Week Personalized Roadmap ─── */}
      {report.preparationRoadmap && report.preparationRoadmap.length > 0 && (
        <div className="p-6 rounded-3xl bg-gradient-to-r from-blue-900/20 to-purple-900/20 border border-blue-500/30 space-y-3">
          <h3 className="text-sm font-bold text-blue-300 flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-blue-400" />
            3-Week Action Roadmap for Next Round
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {report.preparationRoadmap.map((item, idx) => (
              <div key={idx} className="p-3.5 rounded-2xl bg-black/50 border border-white/10 space-y-1">
                <span className="text-[10px] font-mono text-blue-400 uppercase font-bold">Milestone #{idx + 1}</span>
                <p className="text-xs text-gray-200">{item}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ─── Footer Action Bar ─── */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-white/10">
        <div className="flex items-center gap-2">
          {onBackToDashboard && (
            <Button
              variant="outline"
              size="sm"
              onClick={onBackToDashboard}
              className="h-9 px-4 rounded-xl border-white/15 text-white hover:bg-white/10 text-xs"
            >
              Back to LMS Dashboard
            </Button>
          )}

          {onRetake && (
            <Button
              size="sm"
              onClick={onRetake}
              className="h-9 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs flex items-center gap-1.5 shadow-md shadow-blue-600/20"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Retake Mock Interview</span>
            </Button>
          )}
        </div>

        <div className="flex items-center gap-2">
          {reportR2Url && (
            <a href={reportR2Url} target="_blank" rel="noreferrer">
              <Button
                variant="outline"
                size="sm"
                className="h-9 px-3.5 rounded-xl border-white/15 text-gray-300 hover:text-white text-xs flex items-center gap-1.5"
              >
                <FileText className="h-3.5 w-3.5" />
                <span>Raw JSON (R2)</span>
              </Button>
            </a>
          )}

          <Button
            size="sm"
            onClick={handleExportPdf}
            disabled={isExportingPdf}
            className="h-9 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs flex items-center gap-1.5 shadow-md shadow-emerald-600/20"
          >
            <Download className="h-3.5 w-3.5" />
            <span>{isExportingPdf ? "Generating PDF..." : "Export PDF Report"}</span>
          </Button>
        </div>
      </div>

    </div>
  );
}
