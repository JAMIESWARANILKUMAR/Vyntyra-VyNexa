import { useState, useEffect } from 'react';
import { useServerFn } from '@tanstack/react-start';
import { useQueryClient } from '@tanstack/react-query';
import { X, Star, Send, Loader2, ClipboardList, ChevronRight, ChevronLeft, ArrowRight, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from './ui/button';
import { motion, AnimatePresence } from 'framer-motion';

import { submitDetailedFeedback } from '@/lib/operations.functions';

export function FeedbackPopupModal({ profile }: { profile: any }) {
  const qc = useQueryClient();
  const submitFeedback = useServerFn(submitDetailedFeedback);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFormExpanded, setIsFormExpanded] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const [step, setStep] = useState(1);
  const totalSteps = 8;
  
  // Section 1: Demographics
  const [internName, setInternName] = useState('');
  const [domainTrack, setDomainTrack] = useState('');
  const [internshipDuration, setInternshipDuration] = useState('');

  useEffect(() => {
    if (profile) {
      if (!internName && profile.full_name) {
        const name = profile.full_name;
        const id = profile.intern_id ? ` (VYN-${profile.intern_id})` : profile.employee_id ? ` (VYN-${profile.employee_id})` : profile.id ? ` (VYN-${profile.id.substring(0,6).toUpperCase()})` : '';
        setInternName(`${name}${id}`);
      }
      if (!domainTrack && (profile.department || profile.position)) {
        setDomainTrack(profile.department || profile.position);
      }
    }
  }, [profile]);
  
  // Section 2: Mentorship & Guidance
  const [mentorAccessibility, setMentorAccessibility] = useState(0);
  const [mentorCheckins, setMentorCheckins] = useState('');
  const [feedbackQuality, setFeedbackQuality] = useState(0);
  const [doubtsResolved, setDoubtsResolved] = useState(0);
  const [leadershipValued, setLeadershipValued] = useState(0);
  const [mentorImprovement, setMentorImprovement] = useState('');

  // Section 3: Tasks, Projects & Learning Curve
  const [tasksClarity, setTasksClarity] = useState(0);
  const [tasksComplexity, setTasksComplexity] = useState('');
  const [tasksAutonomy, setTasksAutonomy] = useState(0);
  const [skillsImproved, setSkillsImproved] = useState('');
  const [bestProject, setBestProject] = useState('');

  // Section 4: Resources, Tools & Documentation
  const [docsCompleteness, setDocsCompleteness] = useState(0);
  const [accessDelays, setAccessDelays] = useState('');
  const [missingTools, setMissingTools] = useState('');

  // Section 5: Portal & Platform Experience
  const [portalUsability, setPortalUsability] = useState(0);
  const [portalBugs, setPortalBugs] = useState('');
  const [portalImprovement, setPortalImprovement] = useState('');

  // Section 6: Working Hours, Workload & Flexibility
  const [workloadManageability, setWorkloadManageability] = useState(0);
  const [deadlinesRealistic, setDeadlinesRealistic] = useState(0);
  const [boundariesRespected, setBoundariesRespected] = useState(0);

  // Section 7: Team Collaboration & Culture
  const [commChannels, setCommChannels] = useState(0);
  const [collaboration, setCollaboration] = useState(0);
  const [safeEnvironment, setSafeEnvironment] = useState(0);
  const [culture3Words, setCulture3Words] = useState('');

  // Section 8: Career Impact, NPS & Honest Feedback
  const [npsScore, setNpsScore] = useState<number | null>(null);
  const [returnInterest, setReturnInterest] = useState('');
  const [biggestBottleneck, setBiggestBottleneck] = useState('');
  const [programChange, setProgramChange] = useState('');

  if (!profile?.feedback_popup_active) return null;
  if (isDismissed) return null;
  if (profile?.feedback_popup_expiry && new Date(profile.feedback_popup_expiry) < new Date()) return null;

  const validateStep = (s: number) => {
    if (s === 1) return true;
    if (s === 2) return mentorAccessibility > 0 && mentorCheckins && feedbackQuality > 0 && doubtsResolved > 0 && leadershipValued > 0 && mentorImprovement.trim();
    if (s === 3) return tasksClarity > 0 && tasksComplexity && tasksAutonomy > 0 && skillsImproved.trim() && bestProject.trim();
    if (s === 4) return docsCompleteness > 0 && accessDelays && missingTools.trim();
    if (s === 5) return portalUsability > 0 && portalBugs && portalImprovement.trim();
    if (s === 6) return workloadManageability > 0 && deadlinesRealistic > 0 && boundariesRespected > 0;
    if (s === 7) return commChannels > 0 && collaboration > 0 && safeEnvironment > 0 && culture3Words.trim();
    if (s === 8) return npsScore !== null && returnInterest && biggestBottleneck.trim() && programChange.trim();
    return true;
  };

  const handleNext = () => {
    if (!validateStep(step)) {
      toast.error('Please complete all required fields in this section to proceed.');
      return;
    }
    setStep(s => Math.min(totalSteps, s + 1));
  };

  const handlePrev = () => {
    setStep(s => Math.max(1, s - 1));
  };

  const handleSubmit = async () => {
    if (!validateStep(8)) {
      toast.error('Please complete all required fields in this section to proceed.');
      return;
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
          nps_score: npsScore!,
          return_interest: returnInterest,
          biggest_bottleneck: biggestBottleneck,
          program_change: programChange
        } 
      });
      toast.success('Thank you! Your feedback has been submitted successfully.');
      qc.invalidateQueries({ queryKey: ['profile'] });
    } catch (err: any) {
      toast.error(err.message || 'Failed to submit feedback.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const StarRating = ({ value, onChange, label, sublabel }: { value: number, onChange: (val: number) => void, label: string, sublabel?: string }) => (
    <div className="flex flex-col gap-1.5 p-5 rounded-2xl border border-slate-100 bg-white shadow-[0_2px_10px_rgba(0,0,0,0.02)] hover:border-indigo-100 hover:shadow-[0_4px_20px_rgba(79,70,229,0.06)] transition-all duration-300">
      <span className="text-[15px] font-bold text-slate-800">{label} <span className="text-rose-500">*</span></span>
      {sublabel && <span className="text-[11px] text-slate-500 font-medium mb-2">{sublabel}</span>}
      <div className="flex items-center gap-2 cursor-pointer">
        {[1, 2, 3, 4, 5].map(star => (
          <Star 
            key={star} 
            className={`h-8 w-8 transition-all duration-300 ${star <= value ? 'fill-amber-400 text-amber-400 scale-110 drop-shadow-sm' : 'text-slate-200 hover:text-amber-200'}`}
            onClick={() => onChange(star)}
          />
        ))}
      </div>
    </div>
  );

  if (!isFormExpanded) {
    return (
      <div className="fixed inset-0 z-[200] bg-slate-900/90 backdrop-blur-md flex items-center justify-center p-4">
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }} 
          animate={{ scale: 1, opacity: 1 }} 
          className="bg-white rounded-[2rem] max-w-md w-full p-10 shadow-2xl border border-slate-200 text-center relative"
        >
          <button onClick={() => setIsDismissed(true)} className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors"><X className="h-5 w-5"/></button>
          <motion.div 
            animate={{ y: [0, -10, 0] }}
            transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
            className="mx-auto w-24 h-24 bg-gradient-to-br from-indigo-500 to-purple-600 text-white rounded-full flex items-center justify-center mb-8 shadow-xl shadow-indigo-500/30"
          >
            <ClipboardList className="h-10 w-10" />
          </motion.div>
          <h3 className="font-black text-slate-900 text-3xl mb-3">Feedback Required</h3>
          <p className="text-sm text-slate-500 mb-8 leading-relaxed px-4">
            You have a mandatory master feedback form waiting for you. Your honest feedback helps us improve the Vyntyra experience.
          </p>
          <Button onClick={() => setIsFormExpanded(true)} className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold h-14 rounded-2xl shadow-lg text-lg group">
            Start Feedback Journey <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
          </Button>
        </motion.div>
      </div>
    );
  }

  const slideVariants: any = {
    enter: (direction: number) => ({
      x: direction > 0 ? 50 : -50,
      opacity: 0,
      scale: 0.98
    }),
    center: {
      x: 0,
      opacity: 1,
      scale: 1,
      transition: { duration: 0.4, type: 'spring', bounce: 0.2 }
    },
    exit: (direction: number) => ({
      x: direction < 0 ? 50 : -50,
      opacity: 0,
      scale: 0.98,
      transition: { duration: 0.3 }
    })
  };

  return (
    <div className="fixed inset-0 z-[200] bg-slate-900/95 backdrop-blur-md flex items-center justify-center p-2 sm:p-4">
      <div className="bg-slate-50 rounded-[2.5rem] max-w-4xl w-full max-h-[95vh] flex flex-col shadow-2xl overflow-hidden text-slate-900 relative">
        
        {/* Dynamic Header */}
        <div className="bg-white p-8 shrink-0 relative overflow-hidden border-b border-slate-100 z-10">
           <div className="absolute top-0 left-0 w-full h-1.5 bg-slate-100">
             <motion.div 
               className="h-full bg-gradient-to-r from-indigo-600 to-purple-600"
               initial={{ width: 0 }}
               animate={{ width: `${(step / totalSteps) * 100}%` }}
               transition={{ duration: 0.5, ease: 'easeOut' }}
             />
           </div>
           <div className="flex items-center justify-between relative z-10 pt-2">
             <div className="flex items-center gap-5">
               <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-2xl text-indigo-600 shadow-sm">
                 <ClipboardList className="h-8 w-8" />
               </div>
               <div>
                 <h3 className="font-black text-slate-900 text-2xl leading-tight">
                   Master Feedback Form
                 </h3>
                 <p className="text-sm text-slate-500 mt-1 font-medium">Your honest feedback shapes the future.</p>
               </div>
             </div>
             <div className="flex items-center gap-4">
               <div className="hidden sm:flex items-center justify-center px-4 py-2 bg-slate-100 text-slate-600 rounded-full font-bold text-sm">
                  Step {step} of {totalSteps}
               </div>
               <button onClick={() => setIsDismissed(true)} className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors"><X className="h-6 w-6"/></button>
             </div>
           </div>
        </div>

        {/* Animated Body */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden p-6 sm:p-10 relative">
          <AnimatePresence mode="wait" custom={1}>
            <motion.div
              key={step}
              custom={1}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              className="space-y-8 min-h-[300px] max-w-3xl mx-auto"
            >
              
              {step === 1 && (
                <div className="space-y-8">
                  <div className="mb-8">
                    <h4 className="font-black text-3xl text-slate-900 mb-2">Demographics & Context</h4>
                    <p className="text-slate-500">Tell us a bit about yourself. (Optional)</p>
                  </div>
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-slate-700">Full Name & Intern ID</label>
                      <input type="text" className="w-full h-14 px-5 text-base rounded-2xl border border-slate-200 bg-white shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all" placeholder="e.g. Jane Doe (VYN-102)" value={internName} onChange={e => setInternName(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-slate-700">Domain / Track</label>
                      <select className="w-full h-14 px-5 text-base rounded-2xl border border-slate-200 bg-white shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all" value={domainTrack} onChange={e => setDomainTrack(e.target.value)}>
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
                      <label className="text-sm font-bold text-slate-700">Internship Duration</label>
                      <input type="text" className="w-full h-14 px-5 text-base rounded-2xl border border-slate-200 bg-white shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all" placeholder="e.g. June-August 2026" value={internshipDuration} onChange={e => setInternshipDuration(e.target.value)} />
                    </div>
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-8">
                  <div className="mb-8">
                    <h4 className="font-black text-3xl text-slate-900 mb-2">Mentorship & Guidance</h4>
                    <p className="text-slate-500">How was your experience with your mentor?</p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <StarRating label="Mentor Accessibility & Responsiveness" sublabel="1 = Never available, 5 = Highly responsive" value={mentorAccessibility} onChange={setMentorAccessibility} />
                    
                    <div className="flex flex-col gap-1.5 p-5 rounded-2xl border border-slate-100 bg-white shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
                      <label className="text-[15px] font-bold text-slate-800">Regular 1-on-1s / Check-ins? <span className="text-rose-500">*</span></label>
                      <select className="w-full h-12 mt-2 px-4 text-sm rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-200 transition-all" value={mentorCheckins} onChange={e => setMentorCheckins(e.target.value)} required>
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
                    
                    <div className="md:col-span-2 flex flex-col gap-1.5 p-5 rounded-2xl border border-slate-100 bg-white shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
                      <label className="text-[15px] font-bold text-slate-800">What is one specific thing your mentor/lead could have done differently? <span className="text-rose-500">*</span></label>
                      <input type="text" className="w-full h-12 mt-2 px-4 text-sm rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-200 transition-all" placeholder="Your specific feedback..." value={mentorImprovement} onChange={e => setMentorImprovement(e.target.value)} required />
                    </div>
                  </div>
                </div>
              )}

              {step === 3 && (
                <div className="space-y-8">
                  <div className="mb-8">
                    <h4 className="font-black text-3xl text-slate-900 mb-2">Tasks & Projects</h4>
                    <p className="text-slate-500">Evaluate your learning curve and project quality.</p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <StarRating label="Clarity of Assigned Tasks & Briefs" sublabel="1 = Very confusing, 5 = Crystal clear" value={tasksClarity} onChange={setTasksClarity} />
                    
                    <div className="flex flex-col gap-1.5 p-5 rounded-2xl border border-slate-100 bg-white shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
                      <label className="text-[15px] font-bold text-slate-800">Did task complexity scale reasonably? <span className="text-rose-500">*</span></label>
                      <select className="w-full h-12 mt-2 px-4 text-sm rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-200 transition-all" value={tasksComplexity} onChange={e => setTasksComplexity(e.target.value)} required>
                        <option value="">Select...</option>
                        <option value="Scaled too fast">Scaled too fast</option>
                        <option value="Just right">Just right</option>
                        <option value="Too slow">Too slow</option>
                        <option value="Tasks stayed trivial">Tasks stayed trivial</option>
                      </select>
                    </div>

                    <StarRating label="Creative Autonomy & Ownership" sublabel="1 = Micromanaged, 5 = High autonomy" value={tasksAutonomy} onChange={setTasksAutonomy} />
                    
                    <div className="flex flex-col gap-1.5 p-5 rounded-2xl border border-slate-100 bg-white shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
                      <label className="text-[15px] font-bold text-slate-800">Which skills did you improve the most? <span className="text-rose-500">*</span></label>
                      <input type="text" className="w-full h-12 mt-2 px-4 text-sm rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-200 transition-all" placeholder="E.g., React, Communication, Git..." value={skillsImproved} onChange={e => setSkillsImproved(e.target.value)} required />
                    </div>
                    <div className="md:col-span-2 flex flex-col gap-1.5 p-5 rounded-2xl border border-slate-100 bg-white shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
                      <label className="text-[15px] font-bold text-slate-800">Which specific project delivered the most real-world learning value? <span className="text-rose-500">*</span></label>
                      <input type="text" className="w-full h-12 mt-2 px-4 text-sm rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-200 transition-all" placeholder="Name of project or task..." value={bestProject} onChange={e => setBestProject(e.target.value)} required />
                    </div>
                  </div>
                </div>
              )}

              {step === 4 && (
                <div className="space-y-8">
                  <div className="mb-8">
                    <h4 className="font-black text-3xl text-slate-900 mb-2">Resources & Tools</h4>
                    <p className="text-slate-500">Did you have what you needed to succeed?</p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <StarRating label="Onboarding & Setup Documentation" sublabel="1 = Incomplete/Outdated, 5 = Clear & comprehensive" value={docsCompleteness} onChange={setDocsCompleteness} />
                    
                    <div className="flex flex-col gap-1.5 p-5 rounded-2xl border border-slate-100 bg-white shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
                      <label className="text-[15px] font-bold text-slate-800">Delays receiving access, APIs, or repo permissions? <span className="text-rose-500">*</span></label>
                      <select className="w-full h-12 mt-2 px-4 text-sm rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-200 transition-all" value={accessDelays} onChange={e => setAccessDelays(e.target.value)} required>
                        <option value="">Select...</option>
                        <option value="No delays">No delays</option>
                        <option value="Minor delay (<1 day)">Minor delay (&lt;1 day)</option>
                        <option value="Significant blocker (>2 days)">Significant blocker (&gt;2 days)</option>
                      </select>
                    </div>

                    <div className="md:col-span-2 flex flex-col gap-1.5 p-5 rounded-2xl border border-slate-100 bg-white shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
                      <label className="text-[15px] font-bold text-slate-800">What tools or references were missing that could have boosted productivity? <span className="text-rose-500">*</span></label>
                      <input type="text" className="w-full h-12 mt-2 px-4 text-sm rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-200 transition-all" placeholder="e.g. Figma Pro, better API docs..." value={missingTools} onChange={e => setMissingTools(e.target.value)} required />
                    </div>
                  </div>
                </div>
              )}

              {step === 5 && (
                <div className="space-y-8">
                  <div className="mb-8">
                    <h4 className="font-black text-3xl text-slate-900 mb-2">Portal Experience</h4>
                    <p className="text-slate-500">Your thoughts on the VyNexa connect platform.</p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <StarRating label="Portal Usability & Speed" sublabel="1 = Clunky/Slow, 5 = Seamless & intuitive" value={portalUsability} onChange={setPortalUsability} />
                    
                    <div className="flex flex-col gap-1.5 p-5 rounded-2xl border border-slate-100 bg-white shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
                      <label className="text-[15px] font-bold text-slate-800">Did you encounter downtime, session errors, or bugs? <span className="text-rose-500">*</span></label>
                      <select className="w-full h-12 mt-2 px-4 text-sm rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-200 transition-all" value={portalBugs} onChange={e => setPortalBugs(e.target.value)} required>
                        <option value="">Select...</option>
                        <option value="Frequently">Frequently</option>
                        <option value="Occasionally">Occasionally</option>
                        <option value="Never">Never</option>
                      </select>
                    </div>

                    <div className="md:col-span-2 flex flex-col gap-1.5 p-5 rounded-2xl border border-slate-100 bg-white shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
                      <label className="text-[15px] font-bold text-slate-800">Which feature/improvement would make the portal significantly better? <span className="text-rose-500">*</span></label>
                      <input type="text" className="w-full h-12 mt-2 px-4 text-sm rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-200 transition-all" placeholder="Your suggestion..." value={portalImprovement} onChange={e => setPortalImprovement(e.target.value)} required />
                    </div>
                  </div>
                </div>
              )}

              {step === 6 && (
                <div className="space-y-8">
                  <div className="mb-8">
                    <h4 className="font-black text-3xl text-slate-900 mb-2">Workload & Flexibility</h4>
                    <p className="text-slate-500">Help us understand your work-life balance.</p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <StarRating label="Daily Workload Manageability" sublabel="1 = Overwhelming, 5 = Well-balanced" value={workloadManageability} onChange={setWorkloadManageability} />
                    <StarRating label="Realistic Deadlines & Sprints" sublabel="1 = Unrealistic, 5 = Highly realistic" value={deadlinesRealistic} onChange={setDeadlinesRealistic} />
                    <StarRating label="Respect for Personal Boundaries" sublabel="1 = Poor boundaries, 5 = Strict respect" value={boundariesRespected} onChange={setBoundariesRespected} />
                  </div>
                </div>
              )}

              {step === 7 && (
                <div className="space-y-8">
                  <div className="mb-8">
                    <h4 className="font-black text-3xl text-slate-900 mb-2">Team Culture</h4>
                    <p className="text-slate-500">Evaluate the environment and collaboration.</p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <StarRating label="Communication Channels Organization" sublabel="1 = Chaotic, 5 = Organized" value={commChannels} onChange={setCommChannels} />
                    <StarRating label="Collaboration with Team" sublabel="1 = Disconnected, 5 = Highly collaborative" value={collaboration} onChange={setCollaboration} />
                    <StarRating label="Safe Environment for Questions" sublabel="1 = Discouraging, 5 = Highly encouraging" value={safeEnvironment} onChange={setSafeEnvironment} />
                    
                    <div className="flex flex-col gap-1.5 p-5 rounded-2xl border border-slate-100 bg-white shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
                      <label className="text-[15px] font-bold text-slate-800">How would you describe the overall culture and team spirit in 3 words? <span className="text-rose-500">*</span></label>
                      <input type="text" className="w-full h-12 mt-2 px-4 text-sm rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-200 transition-all" placeholder="e.g. Fast, Collaborative, Fun" value={culture3Words} onChange={e => setCulture3Words(e.target.value)} required />
                    </div>
                  </div>
                </div>
              )}

              {step === 8 && (
                <div className="space-y-8">
                  <div className="mb-8">
                    <h4 className="font-black text-3xl text-slate-900 mb-2">Final Thoughts</h4>
                    <p className="text-slate-500">Your honest conclusion and NPS score.</p>
                  </div>
                  
                  <div className="space-y-4 p-8 bg-indigo-50/50 rounded-3xl border border-indigo-100">
                    <label className="text-base font-black text-indigo-950 block mb-4 text-center">Net Promoter Score: How likely are you to recommend us? <span className="text-rose-500">*</span></label>
                    <div className="flex flex-wrap justify-center gap-2 sm:gap-3">
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(num => (
                        <button
                          key={num}
                          type="button"
                          onClick={() => setNpsScore(num)}
                          className={`h-12 w-12 sm:h-14 sm:w-14 rounded-2xl font-black text-lg transition-all border shadow-sm ${npsScore === num ? 'bg-indigo-600 text-white border-indigo-600 scale-110 shadow-indigo-600/30' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-indigo-300'}`}
                        >
                          {num}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="flex flex-col gap-1.5 p-5 rounded-2xl border border-slate-100 bg-white shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
                      <label className="text-[15px] font-bold text-slate-800">If offered, would you be interested in returning for an advanced or full-time role? <span className="text-rose-500">*</span></label>
                      <select className="w-full h-12 mt-2 px-4 text-sm rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-200 transition-all" value={returnInterest} onChange={e => setReturnInterest(e.target.value)} required>
                        <option value="">Select...</option>
                        <option value="Definitely yes">Definitely yes</option>
                        <option value="Maybe">Maybe</option>
                        <option value="Unlikely">Unlikely</option>
                        <option value="No">No</option>
                      </select>
                    </div>

                    <div className="flex flex-col gap-1.5 p-5 rounded-2xl border border-slate-100 bg-white shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
                      <label className="text-[15px] font-bold text-slate-800">What was the single biggest bottleneck or frustration you faced? <span className="text-rose-500">*</span></label>
                      <textarea className="w-full h-32 p-4 mt-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-200 text-sm resize-none transition-all" placeholder="Be honest, we want to improve..." value={biggestBottleneck} onChange={e => setBiggestBottleneck(e.target.value)} required />
                    </div>

                    <div className="flex flex-col gap-1.5 p-5 rounded-2xl border border-slate-100 bg-white shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
                      <label className="text-[15px] font-bold text-slate-800">If you were running the internship program next cohort, what is the #1 thing you would change? <span className="text-rose-500">*</span></label>
                      <textarea className="w-full h-32 p-4 mt-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-200 text-sm resize-none transition-all" placeholder="Your top idea..." value={programChange} onChange={e => setProgramChange(e.target.value)} required />
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Footer Navigation */}
        <div className="bg-white p-6 sm:px-10 border-t border-slate-100 flex items-center justify-between gap-4 shrink-0 z-20 shadow-[0_-10px_30px_rgba(0,0,0,0.03)]">
          <div className="flex-1">
            {step > 1 ? (
              <Button type="button" variant="outline" onClick={handlePrev} className="h-14 px-6 rounded-2xl font-bold border-slate-200 hover:bg-slate-50 text-slate-600 transition-all">
                <ChevronLeft className="mr-2 h-5 w-5" /> Back
              </Button>
            ) : (
              <div />
            )}
          </div>
          
          <div className="flex flex-1 justify-end">
            {step < totalSteps ? (
              <Button type="button" onClick={handleNext} className="h-14 px-10 rounded-2xl font-bold bg-slate-900 hover:bg-slate-800 text-white shadow-xl shadow-slate-900/20 flex items-center transition-all group">
                Continue <ChevronRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            ) : (
              <Button type="button" onClick={handleSubmit} disabled={isSubmitting} className="h-14 px-10 rounded-2xl font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xl shadow-indigo-600/30 flex items-center transition-all group">
                {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : <Send className="h-5 w-5 mr-2 group-hover:scale-110 transition-transform" />}
                Submit Feedback
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
