import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQueryClient } from "@tanstack/react-query";
import { Star, Send, Loader2, ClipboardList, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "./ui/button";

import { submitDetailedFeedback } from "@/lib/operations.functions";

export function FeedbackPopupModal({ profile }: { profile: any }) {
  const qc = useQueryClient();
  const submitFeedback = useServerFn(submitDetailedFeedback);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Section 1: Demographics
  const [internName, setInternName] = useState("");
  const [domainTrack, setDomainTrack] = useState("");
  const [internshipDuration, setInternshipDuration] = useState("");
  
  // Section 2: Mentorship & Guidance
  const [mentorAccessibility, setMentorAccessibility] = useState(0);
  const [mentorCheckins, setMentorCheckins] = useState("");
  const [feedbackQuality, setFeedbackQuality] = useState(0);
  const [doubtsResolved, setDoubtsResolved] = useState(0);
  const [leadershipValued, setLeadershipValued] = useState(0);
  const [mentorImprovement, setMentorImprovement] = useState("");

  // Section 3: Tasks, Projects & Learning Curve
  const [tasksClarity, setTasksClarity] = useState(0);
  const [tasksComplexity, setTasksComplexity] = useState("");
  const [tasksAutonomy, setTasksAutonomy] = useState(0);
  const [skillsImproved, setSkillsImproved] = useState("");
  const [bestProject, setBestProject] = useState("");

  // Section 4: Resources, Tools & Documentation
  const [docsCompleteness, setDocsCompleteness] = useState(0);
  const [accessDelays, setAccessDelays] = useState("");
  const [missingTools, setMissingTools] = useState("");

  // Section 5: Portal & Platform Experience
  const [portalUsability, setPortalUsability] = useState(0);
  const [portalBugs, setPortalBugs] = useState("");
  const [portalImprovement, setPortalImprovement] = useState("");

  // Section 6: Working Hours, Workload & Flexibility
  const [workloadManageability, setWorkloadManageability] = useState(0);
  const [deadlinesRealistic, setDeadlinesRealistic] = useState(0);
  const [boundariesRespected, setBoundariesRespected] = useState(0);

  // Section 7: Team Collaboration & Culture
  const [commChannels, setCommChannels] = useState(0);
  const [collaboration, setCollaboration] = useState(0);
  const [safeEnvironment, setSafeEnvironment] = useState(0);
  const [culture3Words, setCulture3Words] = useState("");

  // Section 8: Career Impact, NPS & Honest Feedback
  const [npsScore, setNpsScore] = useState<number | null>(null);
  const [returnInterest, setReturnInterest] = useState("");
  const [biggestBottleneck, setBiggestBottleneck] = useState("");
  const [programChange, setProgramChange] = useState("");
  const [isFormExpanded, setIsFormExpanded] = useState(false);

  if (!profile?.feedback_popup_active) return null;

  if (!isFormExpanded) {
    return (
      <div className="fixed inset-0 z-[200] bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl max-w-md w-full p-8 shadow-2xl border border-slate-200 text-center animate-in zoom-in-95 duration-200">
          <div className="mx-auto w-16 h-16 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mb-6">
            <ClipboardList className="h-8 w-8" />
          </div>
          <h3 className="font-extrabold text-slate-900 text-2xl mb-3">Feedback Required</h3>
          <p className="text-sm text-slate-500 mb-8 leading-relaxed">
            You have a mandatory master feedback form waiting for you. Your honest feedback helps us improve the Vyntyra experience.
          </p>
          <Button onClick={() => setIsFormExpanded(true)} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold h-14 rounded-xl shadow-lg shadow-indigo-600/20 text-lg">
            Start Feedback Form
          </Button>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check all required rating fields
    const requiredRatings = [
      mentorAccessibility, feedbackQuality, doubtsResolved, leadershipValued,
      tasksClarity, tasksAutonomy, docsCompleteness, portalUsability,
      workloadManageability, deadlinesRealistic, boundariesRespected,
      commChannels, collaboration, safeEnvironment
    ];
    if (requiredRatings.some(r => r === 0) || npsScore === null) {
      return toast.error("Please fill out all the star ratings and the NPS score.");
    }

    const requiredSelects = [
      mentorCheckins, tasksComplexity, accessDelays, portalBugs, returnInterest
    ];
    if (requiredSelects.some(s => !s.trim())) {
      return toast.error("Please answer all the multiple choice dropdown questions.");
    }

    const requiredTexts = [
      mentorImprovement, skillsImproved, bestProject, missingTools, 
      portalImprovement, culture3Words, biggestBottleneck, programChange
    ];
    if (requiredTexts.some(t => !t.trim())) {
      return toast.error("Please fill out all the text feedback questions. Every question is mandatory.");
    }
    
    setIsSubmitting(true);
    try {
      await submitFeedback({ 
        data: {
          intern_name: internName,
          domain_track: domainTrack,
          internship_duration: internshipDuration,
          mentor_accessibility: mentorAccessibility,
          mentor_checkins: mentorCheckins,
          feedback_quality: feedbackQuality,
          doubts_resolved: doubtsResolved,
          leadership_valued: leadershipValued,
          mentor_improvement: mentorImprovement,
          tasks_clarity: tasksClarity,
          tasks_complexity: tasksComplexity,
          tasks_autonomy: tasksAutonomy,
          skills_improved: skillsImproved,
          best_project: bestProject,
          docs_completeness: docsCompleteness,
          access_delays: accessDelays,
          missing_tools: missingTools,
          portal_usability: portalUsability,
          portal_bugs: portalBugs,
          portal_improvement: portalImprovement,
          workload_manageability: workloadManageability,
          deadlines_realistic: deadlinesRealistic,
          boundaries_respected: boundariesRespected,
          comm_channels: commChannels,
          collaboration: collaboration,
          safe_environment: safeEnvironment,
          culture_3_words: culture3Words,
          nps_score: npsScore,
          return_interest: returnInterest,
          biggest_bottleneck: biggestBottleneck,
          program_change: programChange
        } 
      });
      toast.success("Thank you! Your feedback has been submitted successfully.");
      qc.invalidateQueries({ queryKey: ["profile"] });
    } catch (err: any) {
      toast.error(err.message || "Failed to submit feedback.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const StarRating = ({ value, onChange, label, sublabel }: { value: number, onChange: (val: number) => void, label: string, sublabel?: string }) => (
    <div className="flex flex-col gap-1">
      <span className="text-sm font-bold text-slate-800">{label} <span className="text-rose-500">*</span></span>
      {sublabel && <span className="text-[10px] text-slate-500 font-medium mb-1">{sublabel}</span>}
      <div className="flex items-center gap-1.5 cursor-pointer">
        {[1, 2, 3, 4, 5].map(star => (
          <Star 
            key={star} 
            className={`h-7 w-7 transition-colors ${star <= value ? "fill-amber-400 text-amber-400" : "text-slate-200 hover:text-amber-200"}`}
            onClick={() => onChange(star)}
          />
        ))}
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-[200] bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4">
      <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[95vh] flex flex-col shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-200 text-slate-900">
        
        {/* Fixed Header */}
        <div className="flex items-center gap-4 border-b p-6 sm:px-10 shrink-0">
          <div className="p-3 bg-indigo-100 border border-indigo-200 rounded-2xl text-indigo-700 shadow-sm">
            <ClipboardList className="h-8 w-8" />
          </div>
          <div>
            <h3 className="font-extrabold text-slate-900 text-2xl leading-tight">
              Master Feedback Form
            </h3>
            <p className="text-sm text-slate-500 mt-1">Your honest, structured feedback shapes the future of our internship program.</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="overflow-y-auto p-6 sm:p-10 space-y-12">
          
          {/* Section 1 */}
          <div className="space-y-6">
            <h4 className="font-bold text-lg text-indigo-700 border-b border-indigo-100 pb-2">Section 1: Demographics & Context (Optional)</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700">Full Name & Intern ID</label>
                <input type="text" className="w-full h-10 px-3 text-sm rounded-xl border border-slate-200 bg-slate-50" placeholder="e.g. Jane Doe (VYN-102)" value={internName} onChange={e => setInternName(e.target.value)} />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700">Domain / Track</label>
                <select className="w-full h-10 px-3 text-sm rounded-xl border border-slate-200 bg-slate-50" value={domainTrack} onChange={e => setDomainTrack(e.target.value)}>
                  <option value="">Select Domain...</option>
                  <option value="Web Development">Web Development</option>
                  <option value="AI/ML">AI/ML</option>
                  <option value="UI/UX Design">UI/UX Design</option>
                  <option value="Management">Management</option>
                  <option value="HR">HR</option>
                  <option value="Cloud & DevOps">Cloud & DevOps</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700">Internship Duration</label>
                <input type="text" className="w-full h-10 px-3 text-sm rounded-xl border border-slate-200 bg-slate-50" placeholder="e.g. June-August 2026" value={internshipDuration} onChange={e => setInternshipDuration(e.target.value)} />
              </div>
            </div>
          </div>

          {/* Section 2 */}
          <div className="space-y-6">
            <h4 className="font-bold text-lg text-indigo-700 border-b border-indigo-100 pb-2">Section 2: Mentorship & Guidance</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <StarRating label="Mentor Accessibility & Responsiveness" sublabel="1 = Never available, 5 = Highly responsive" value={mentorAccessibility} onChange={setMentorAccessibility} />
              
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-800">Regular 1-on-1s / Check-ins? <span className="text-rose-500">*</span></label>
                <select className="w-full h-10 px-3 text-sm rounded-xl border border-slate-200 bg-slate-50" value={mentorCheckins} onChange={e => setMentorCheckins(e.target.value)} required>
                  <option value="">Select...</option>
                  <option value="Daily">Daily</option>
                  <option value="Weekly">Weekly</option>
                  <option value="Bi-weekly">Bi-weekly</option>
                  <option value="Rarely">Rarely</option>
                  <option value="Never">Never</option>
                </select>
              </div>

              <StarRating label="Constructive & Detailed Feedback" sublabel="1 = Vague/Unhelpful, 5 = Detailed & actionable" value={feedbackQuality} onChange={setFeedbackQuality} />
              <StarRating label="Timely Resolution of Technical Blockers" sublabel="1 = Never, 5 = Always" value={doubtsResolved} onChange={setDoubtsResolved} />
              <StarRating label="Felt Valued as an Active Contributor" sublabel="1 = Strongly disagree, 5 = Strongly agree" value={leadershipValued} onChange={setLeadershipValued} />
              
              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-bold text-slate-800">What is one specific thing your mentor/lead could have done differently?</label>
                <input type="text" className="w-full h-10 px-3 text-sm rounded-xl border border-slate-200 bg-slate-50" placeholder="Your specific feedback..." value={mentorImprovement} onChange={e => setMentorImprovement(e.target.value)} />
              </div>
            </div>
          </div>

          {/* Section 3 */}
          <div className="space-y-6">
            <h4 className="font-bold text-lg text-indigo-700 border-b border-indigo-100 pb-2">Section 3: Tasks, Projects & Learning Curve</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <StarRating label="Clarity of Assigned Tasks & Briefs" sublabel="1 = Very confusing, 5 = Crystal clear" value={tasksClarity} onChange={setTasksClarity} />
              
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-800">Did task complexity scale reasonably? <span className="text-rose-500">*</span></label>
                <select className="w-full h-10 px-3 text-sm rounded-xl border border-slate-200 bg-slate-50" value={tasksComplexity} onChange={e => setTasksComplexity(e.target.value)} required>
                  <option value="">Select...</option>
                  <option value="Scaled too fast">Scaled too fast</option>
                  <option value="Just right">Just right</option>
                  <option value="Too slow">Too slow</option>
                  <option value="Tasks stayed trivial">Tasks stayed trivial</option>
                </select>
              </div>

              <StarRating label="Creative Autonomy & Ownership" sublabel="1 = Micromanaged, 5 = High autonomy" value={tasksAutonomy} onChange={setTasksAutonomy} />
              
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-800">Which skills did you improve the most?</label>
                <input type="text" className="w-full h-10 px-3 text-sm rounded-xl border border-slate-200 bg-slate-50" placeholder="E.g., React, Communication, Git..." value={skillsImproved} onChange={e => setSkillsImproved(e.target.value)} />
              </div>
              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-bold text-slate-800">Which specific project delivered the most real-world learning value?</label>
                <input type="text" className="w-full h-10 px-3 text-sm rounded-xl border border-slate-200 bg-slate-50" placeholder="Name of project or task..." value={bestProject} onChange={e => setBestProject(e.target.value)} />
              </div>
            </div>
          </div>

          {/* Section 4 */}
          <div className="space-y-6">
            <h4 className="font-bold text-lg text-indigo-700 border-b border-indigo-100 pb-2">Section 4: Resources, Tools & Documentation</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <StarRating label="Onboarding & Setup Documentation" sublabel="1 = Incomplete/Outdated, 5 = Clear & comprehensive" value={docsCompleteness} onChange={setDocsCompleteness} />
              
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-800">Delays receiving access, APIs, or repo permissions? <span className="text-rose-500">*</span></label>
                <select className="w-full h-10 px-3 text-sm rounded-xl border border-slate-200 bg-slate-50" value={accessDelays} onChange={e => setAccessDelays(e.target.value)} required>
                  <option value="">Select...</option>
                  <option value="No delays">No delays</option>
                  <option value="Minor delay (<1 day)">Minor delay (&lt;1 day)</option>
                  <option value="Significant blocker (>2 days)">Significant blocker (&gt;2 days)</option>
                </select>
              </div>

              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-bold text-slate-800">What tools or references were missing that could have boosted productivity?</label>
                <input type="text" className="w-full h-10 px-3 text-sm rounded-xl border border-slate-200 bg-slate-50" placeholder="e.g. Figma Pro, better API docs..." value={missingTools} onChange={e => setMissingTools(e.target.value)} />
              </div>
            </div>
          </div>

          {/* Section 5 */}
          <div className="space-y-6">
            <h4 className="font-bold text-lg text-indigo-700 border-b border-indigo-100 pb-2">Section 5: Portal & Platform Experience</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <StarRating label="Portal Usability & Speed" sublabel="1 = Clunky/Slow, 5 = Seamless & intuitive" value={portalUsability} onChange={setPortalUsability} />
              
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-800">Did you encounter downtime, session errors, or bugs? <span className="text-rose-500">*</span></label>
                <select className="w-full h-10 px-3 text-sm rounded-xl border border-slate-200 bg-slate-50" value={portalBugs} onChange={e => setPortalBugs(e.target.value)} required>
                  <option value="">Select...</option>
                  <option value="Frequently">Frequently</option>
                  <option value="Occasionally">Occasionally</option>
                  <option value="Never">Never</option>
                </select>
              </div>

              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-bold text-slate-800">Which feature/improvement would make the portal significantly better?</label>
                <input type="text" className="w-full h-10 px-3 text-sm rounded-xl border border-slate-200 bg-slate-50" placeholder="Your suggestion..." value={portalImprovement} onChange={e => setPortalImprovement(e.target.value)} />
              </div>
            </div>
          </div>

          {/* Section 6 */}
          <div className="space-y-6">
            <h4 className="font-bold text-lg text-indigo-700 border-b border-indigo-100 pb-2">Section 6: Working Hours, Workload & Flexibility</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <StarRating label="Daily Workload Manageability" sublabel="1 = Overwhelming, 5 = Well-balanced" value={workloadManageability} onChange={setWorkloadManageability} />
              <StarRating label="Realistic Deadlines & Sprints" sublabel="1 = Unrealistic, 5 = Highly realistic" value={deadlinesRealistic} onChange={setDeadlinesRealistic} />
              <StarRating label="Respect for Personal Boundaries" sublabel="1 = Poor boundaries, 5 = Strict respect" value={boundariesRespected} onChange={setBoundariesRespected} />
            </div>
          </div>

          {/* Section 7 */}
          <div className="space-y-6">
            <h4 className="font-bold text-lg text-indigo-700 border-b border-indigo-100 pb-2">Section 7: Team Collaboration & Culture</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <StarRating label="Communication Channels Organization" sublabel="1 = Chaotic, 5 = Organized" value={commChannels} onChange={setCommChannels} />
              <StarRating label="Collaboration with Team" sublabel="1 = Disconnected, 5 = Highly collaborative" value={collaboration} onChange={setCollaboration} />
              <StarRating label="Safe Environment for Questions" sublabel="1 = Discouraging, 5 = Highly encouraging" value={safeEnvironment} onChange={setSafeEnvironment} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-800">How would you describe the overall culture and team spirit in 3 words?</label>
              <input type="text" className="w-full h-10 px-3 text-sm rounded-xl border border-slate-200 bg-slate-50" placeholder="e.g. Fast, Collaborative, Fun" value={culture3Words} onChange={e => setCulture3Words(e.target.value)} />
            </div>
          </div>

          {/* Section 8 */}
          <div className="space-y-6">
            <h4 className="font-bold text-lg text-indigo-700 border-b border-indigo-100 pb-2">Section 8: Career Impact, NPS & Honest Feedback</h4>
            
            <div className="space-y-3 pb-4">
              <label className="text-sm font-bold text-slate-800">Net Promoter Score: How likely are you to recommend us? <span className="text-rose-500">*</span></label>
              <div className="flex flex-wrap items-center gap-2">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(num => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => setNpsScore(num)}
                    className={`h-10 w-10 sm:h-12 sm:w-12 rounded-xl font-bold text-sm transition-all border shadow-sm ${npsScore === num ? 'bg-indigo-600 text-white border-indigo-600 scale-110' : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'}`}
                  >
                    {num}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-800">If offered, would you be interested in returning for an advanced or full-time role? <span className="text-rose-500">*</span></label>
              <select className="w-full h-10 px-3 text-sm rounded-xl border border-slate-200 bg-slate-50" value={returnInterest} onChange={e => setReturnInterest(e.target.value)} required>
                <option value="">Select...</option>
                <option value="Definitely yes">Definitely yes</option>
                <option value="Maybe">Maybe</option>
                <option value="Unlikely">Unlikely</option>
                <option value="No">No</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-800">What was the single biggest bottleneck or frustration you faced?</label>
              <textarea className="w-full h-24 p-3 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm resize-none" placeholder="Be honest, we want to improve..." value={biggestBottleneck} onChange={e => setBiggestBottleneck(e.target.value)} />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-800">If you were running the internship program next cohort, what is the #1 thing you would change?</label>
              <textarea className="w-full h-24 p-3 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm resize-none" placeholder="Your top idea..." value={programChange} onChange={e => setProgramChange(e.target.value)} />
            </div>

          </div>

          <div className="sticky bottom-0 bg-white p-6 sm:px-10 border-t flex flex-col sm:flex-row items-center justify-between gap-4 shrink-0 shadow-[0_-10px_20px_rgba(0,0,0,0.02)]">
            <p className="text-xs text-slate-500 flex items-center gap-1">
              <CheckCircle2 className="h-4 w-4 text-emerald-500" /> All required fields must be answered to submit.
            </p>
            <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-10 h-14 rounded-xl shadow-lg shadow-indigo-600/20 text-base">
              {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : <Send className="h-5 w-5 mr-2" />}
              Submit Master Feedback
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
