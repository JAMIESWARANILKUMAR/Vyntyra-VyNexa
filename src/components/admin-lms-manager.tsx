import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { 
  getLmsCourses, saveLmsCourse, deleteLmsCourse, type LmsCourseItem,
  listTeamMembers 
} from "@/lib/operations.functions";
import { 
  BookMarked, Plus, Search, Video, ExternalLink, Trash2, Edit, 
  Sparkles, CheckCircle2, Play, Users, Clock, Award, Filter, 
  RefreshCw, Loader2, Globe, Shield, BookOpen 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";

export function AdminLmsManager() {
  const qc = useQueryClient();
  const fetchCourses = useServerFn(getLmsCourses);
  const doSaveCourse = useServerFn(saveLmsCourse);
  const doDeleteCourse = useServerFn(deleteLmsCourse);
  const fetchTeam = useServerFn(listTeamMembers);

  const [searchQuery, setSearchQuery] = useState("");
  const [domainFilter, setDomainFilter] = useState<string>("all");
  const [audienceFilter, setAudienceFilter] = useState<string>("all");

  const [courseModalOpen, setCourseModalOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<LmsCourseItem | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [previewVideoId, setPreviewVideoId] = useState<string | null>(null);

  // Form State
  const [formTitle, setFormTitle] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formSource, setFormSource] = useState("YouTube");
  const [formUrl, setFormUrl] = useState("");
  const [formYoutubeId, setFormYoutubeId] = useState("");
  const [formDomain, setFormDomain] = useState<"tech" | "management" | "non_tech" | "all">("tech");
  const [formAudience, setFormAudience] = useState<"all" | "interns" | "employees" | "domain" | "specific_users">("all");
  const [formTargetUserIds, setFormTargetUserIds] = useState<string[]>([]);
  const [formBadge, setFormBadge] = useState("Skilling Scholar");
  const [formLevel, setFormLevel] = useState<"Beginner" | "Intermediate" | "Advanced">("Beginner");
  const [formHours, setFormHours] = useState<number>(10);
  const [formActive, setFormActive] = useState(true);

  // Queries
  const coursesQ = useQuery({
    queryKey: ["admin-lms-courses"],
    queryFn: () => fetchCourses(),
  });

  const teamQ = useQuery({
    queryKey: ["team-members-for-lms"],
    queryFn: () => fetchTeam(),
  });

  const courses = coursesQ.data || [];
  const team = teamQ.data || [];

  function openCreateModal() {
    setEditingCourse(null);
    setFormTitle("");
    setFormDescription("");
    setFormSource("YouTube");
    setFormUrl("");
    setFormYoutubeId("");
    setFormDomain("tech");
    setFormAudience("all");
    setFormTargetUserIds([]);
    setFormBadge("Skilling Scholar");
    setFormLevel("Beginner");
    setFormHours(10);
    setFormActive(true);
    setCourseModalOpen(true);
  }

  function openEditModal(c: LmsCourseItem) {
    setEditingCourse(c);
    setFormTitle(c.title);
    setFormDescription(c.description || "");
    setFormSource(c.source);
    setFormUrl(c.url);
    setFormYoutubeId(c.youtube_video_id || "");
    setFormDomain(c.domain || "tech");
    setFormAudience(c.target_audience || "all");
    setFormTargetUserIds(c.target_user_ids || []);
    setFormBadge(c.badge || "Skilling Scholar");
    setFormLevel(c.level || "Beginner");
    setFormHours(c.estimated_hours || 10);
    setFormActive(c.is_active !== false);
    setCourseModalOpen(true);
  }

  async function handleSaveSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!formTitle.trim() || !formUrl.trim()) {
      toast.error("Course title and URL are required.");
      return;
    }

    setIsSaving(true);
    try {
      await doSaveCourse({
        data: {
          id: editingCourse ? editingCourse.id : undefined,
          title: formTitle.trim(),
          description: formDescription.trim(),
          source: formSource,
          url: formUrl.trim(),
          youtube_video_id: formYoutubeId.trim() || null,
          domain: formDomain,
          target_audience: formAudience,
          target_user_ids: formTargetUserIds,
          badge: formBadge.trim(),
          level: formLevel,
          estimated_hours: Number(formHours) || 5,
          is_active: formActive,
        },
      });

      toast.success(editingCourse ? "Course updated successfully!" : "New course added to LMS catalog!");
      setCourseModalOpen(false);
      qc.invalidateQueries({ queryKey: ["admin-lms-courses"] });
      qc.invalidateQueries({ queryKey: ["intern-lms-courses"] });
    } catch (err: any) {
      toast.error("Failed to save course: " + err.message);
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete(courseId: string) {
    if (!confirm("Are you sure you want to remove this course from the LMS catalog?")) return;
    try {
      await doDeleteCourse({ data: { courseId } });
      toast.success("Course deleted.");
      qc.invalidateQueries({ queryKey: ["admin-lms-courses"] });
      qc.invalidateQueries({ queryKey: ["intern-lms-courses"] });
    } catch (err: any) {
      toast.error("Failed to delete course: " + err.message);
    }
  }

  const filteredCourses = courses.filter((c) => {
    const matchSearch =
      c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.source.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.badge.toLowerCase().includes(searchQuery.toLowerCase());

    const matchDomain = domainFilter === "all" || c.domain === domainFilter || c.domain === "all";
    const matchAudience = audienceFilter === "all" || c.target_audience === audienceFilter;

    return matchSearch && matchDomain && matchAudience;
  });

  return (
    <div className="space-y-6">
      {/* Header & Action Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="h-12 w-12 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-100 shadow-xs">
            <BookMarked className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-slate-900">LMS &amp; Skilling Courses Directorate</h2>
              <Badge className="bg-emerald-50 text-emerald-800 border-emerald-200 font-mono text-[10px]">
                {courses.length} Active Modules
              </Badge>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Manage video playlists, YouTube masterclasses, and certified skilling paths with target audience visibility controls.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 w-full md:w-auto">
          <Button
            onClick={openCreateModal}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs h-10 px-4 rounded-xl shadow-sm gap-2 w-full md:w-auto"
          >
            <Plus className="h-4 w-4" />
            Add Course or Video Link
          </Button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search by course title, YouTube link, platform, or badge..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 text-xs h-9"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <Filter className="h-3.5 w-3.5" />
            <span className="font-semibold">Domain:</span>
          </div>
          <Select value={domainFilter} onValueChange={setDomainFilter}>
            <SelectTrigger className="h-9 text-xs w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Domains</SelectItem>
              <SelectItem value="tech">Tech / Dev</SelectItem>
              <SelectItem value="management">MBA / Mgmt</SelectItem>
              <SelectItem value="non_tech">Non-Tech / CRM</SelectItem>
            </SelectContent>
          </Select>

          <div className="flex items-center gap-1.5 text-xs text-slate-500 ml-2">
            <Users className="h-3.5 w-3.5" />
            <span className="font-semibold">Audience:</span>
          </div>
          <Select value={audienceFilter} onValueChange={setAudienceFilter}>
            <SelectTrigger className="h-9 text-xs w-[150px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Audiences</SelectItem>
              <SelectItem value="interns">Interns Only</SelectItem>
              <SelectItem value="employees">Employees Only</SelectItem>
              <SelectItem value="domain">Domain Specific</SelectItem>
              <SelectItem value="specific_users">Specific Users</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Courses Grid */}
      {coursesQ.isLoading ? (
        <div className="p-16 flex items-center justify-center gap-2 text-slate-400 text-sm bg-white rounded-2xl border border-slate-200">
          <Loader2 className="h-5 w-5 animate-spin" /> Loading courses catalog...
        </div>
      ) : filteredCourses.length === 0 ? (
        <div className="p-16 text-center text-slate-400 text-sm bg-white rounded-2xl border border-slate-200 space-y-3">
          <BookOpen className="h-10 w-10 mx-auto text-slate-300" />
          <p className="font-medium">No LMS courses match your search filter.</p>
          <Button size="sm" variant="outline" onClick={openCreateModal} className="text-xs font-bold gap-1.5">
            <Plus className="h-3.5 w-3.5" /> Create Course
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {filteredCourses.map((course) => {
            return (
              <div
                key={course.id}
                className="rounded-2xl border border-slate-200 bg-white hover:border-slate-300 hover:shadow-md transition-all flex flex-col justify-between overflow-hidden group"
              >
                <div>
                  {/* Card Header Top */}
                  <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                    <span className="text-[10px] font-extrabold uppercase font-mono px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
                      {course.source}
                    </span>
                    <Badge variant="outline" className="text-[9px] uppercase font-bold text-slate-600 border-slate-300">
                      {course.domain === "all" ? "All Domains" : course.domain.toUpperCase()}
                    </Badge>
                  </div>

                  {/* Body Details */}
                  <div className="p-5 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-bold text-sm text-slate-900 line-clamp-2 leading-snug">
                        {course.title}
                      </h3>
                    </div>

                    <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                      {course.description || "Comprehensive modular skilling track with milestone exercises and certificate credential."}
                    </p>

                    {/* Metadata Badges */}
                    <div className="flex items-center gap-2 flex-wrap pt-1">
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 flex items-center gap-1">
                        <Award className="h-3 w-3 text-amber-600" /> {course.badge}
                      </span>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                        {course.level}
                      </span>
                      {course.estimated_hours && (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 flex items-center gap-1">
                          <Clock className="h-3 w-3 text-slate-400" /> {course.estimated_hours} hrs
                        </span>
                      )}
                    </div>

                    {/* Target Audience Bar */}
                    <div className="pt-2 text-[11px] text-slate-500 flex items-center gap-1.5 border-t border-slate-100">
                      <Users className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">
                        Audience: <strong className="text-slate-800 capitalize">{course.target_audience.replace("_", " ")}</strong>
                        {course.target_audience === "specific_users" && course.target_user_ids?.length ? ` (${course.target_user_ids.length} users)` : ""}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Card Actions Footer */}
                <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    {course.youtube_video_id ? (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setPreviewVideoId(course.youtube_video_id || null)}
                        className="h-8 text-xs font-bold gap-1 text-red-600 border-red-200 hover:bg-red-50"
                      >
                        <Play className="h-3.5 w-3.5 fill-red-600 text-red-600" /> Preview
                      </Button>
                    ) : (
                      <a
                        href={course.url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:underline px-2 py-1"
                      >
                        <ExternalLink className="h-3.5 w-3.5" /> Open Link
                      </a>
                    )}
                  </div>

                  <div className="flex items-center gap-1">
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => openEditModal(course)}
                      className="h-8 w-8 text-slate-500 hover:text-slate-900 rounded-lg hover:bg-slate-200/60"
                      title="Edit Course"
                    >
                      <Edit className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => handleDelete(course.id)}
                      className="h-8 w-8 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50"
                      title="Delete Course"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Course Dialog */}
      <Dialog open={courseModalOpen} onOpenChange={setCourseModalOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-bold text-slate-900">
              <BookMarked className="h-5 w-5 text-emerald-600" />
              {editingCourse ? "Edit LMS Course / Masterclass" : "Add New Course or Video Masterclass"}
            </DialogTitle>
            <DialogDescription className="text-xs">
              Configure course syllabus, embedded YouTube playback, and define which roles/domains can view it.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveSubmit} className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-700">Course Title *</Label>
              <Input
                required
                placeholder="e.g. Masterclass: Full Stack TypeScript & React Enterprise Architecture"
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                className="text-xs"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-700">Source Platform / Provider *</Label>
                <Select value={formSource} onValueChange={setFormSource}>
                  <SelectTrigger className="text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="YouTube">YouTube Video / Playlist</SelectItem>
                    <SelectItem value="Google Cloud">Google Cloud Skills</SelectItem>
                    <SelectItem value="AWS Training">AWS Training &amp; Certifications</SelectItem>
                    <SelectItem value="Microsoft Learn">Microsoft Learn (AZ/PL Series)</SelectItem>
                    <SelectItem value="GeeksforGeeks">GeeksforGeeks Masterclass</SelectItem>
                    <SelectItem value="Coursera">Coursera / Industry Specialization</SelectItem>
                    <SelectItem value="Internal Workshop">VyNexa Internal Workshop</SelectItem>
                    <SelectItem value="External Masterclass">External Custom Provider</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-700">Domain Category</Label>
                <Select value={formDomain} onValueChange={(v: any) => setFormDomain(v)}>
                  <SelectTrigger className="text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="tech">Tech &amp; Software Engineering</SelectItem>
                    <SelectItem value="management">MBA / Management &amp; Operations</SelectItem>
                    <SelectItem value="non_tech">Non-Tech (CRM, Sales &amp; Marketing)</SelectItem>
                    <SelectItem value="all">Universal (All Domains)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-700">Course / Video URL *</Label>
              <Input
                required
                placeholder="https://www.youtube.com/watch?v=... or https://learn.microsoft.com/..."
                value={formUrl}
                onChange={(e) => {
                  setFormUrl(e.target.value);
                  const val = e.target.value;
                  const match = val.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/);
                  if (match && match[1]) {
                    setFormYoutubeId(match[1]);
                  }
                }}
                className="text-xs font-mono"
              />
              <p className="text-[10px] text-slate-400">
                Pasting a YouTube URL will automatically configure the built-in video player.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-700">YouTube Video ID (Optional)</Label>
                <Input
                  placeholder="e.g. nu_pCVPKzTk"
                  value={formYoutubeId}
                  onChange={(e) => setFormYoutubeId(e.target.value)}
                  className="text-xs font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-700">Skill Badge Awarded</Label>
                <Input
                  placeholder="e.g. Cloud Architect, Full Stack Pro"
                  value={formBadge}
                  onChange={(e) => setFormBadge(e.target.value)}
                  className="text-xs"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-700">Description &amp; Syllabus Overview</Label>
              <Textarea
                rows={2}
                placeholder="Brief summary of learning objectives and key topics covered..."
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                className="text-xs"
              />
            </div>

            {/* Target Audience Visibility Controls */}
            <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 space-y-3">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-emerald-600" />
                <Label className="text-xs font-bold text-slate-800">Who Should This Course Be Displayed To? *</Label>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                {[
                  { id: "all", label: "🌐 Everyone (All)" },
                  { id: "interns", label: "🎓 Interns Only" },
                  { id: "employees", label: "💼 Employees Only" },
                  { id: "domain", label: "🏢 Domain Specific" },
                  { id: "specific_users", label: "🎯 Specific Users" },
                ].map((aud) => (
                  <label
                    key={aud.id}
                    className={`flex items-center gap-2 p-2.5 rounded-lg border cursor-pointer font-semibold transition-all ${
                      formAudience === aud.id
                        ? "bg-white border-emerald-500 text-emerald-900 shadow-2xs"
                        : "bg-white/60 border-slate-200 text-slate-600 hover:bg-white"
                    }`}
                  >
                    <input
                      type="radio"
                      name="course_audience"
                      value={aud.id}
                      checked={formAudience === aud.id}
                      onChange={() => setFormAudience(aud.id as any)}
                      className="accent-emerald-600"
                    />
                    <span>{aud.label}</span>
                  </label>
                ))}
              </div>

              {/* Specific Users Selector */}
              {formAudience === "specific_users" && (
                <div className="pt-2 space-y-2">
                  <div className="text-[11px] font-bold text-slate-700">Select Specific Users:</div>
                  <div className="max-h-40 overflow-y-auto border rounded-lg bg-white divide-y p-1">
                    {team.map((u: any) => {
                      const isSelected = formTargetUserIds.includes(u.id);
                      return (
                        <label key={u.id} className="flex items-center gap-2 px-3 py-1.5 hover:bg-slate-50 cursor-pointer text-xs">
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setFormTargetUserIds((prev) => [...prev, u.id]);
                              } else {
                                setFormTargetUserIds((prev) => prev.filter((id) => id !== u.id));
                              }
                            }}
                          />
                          <span className="font-semibold text-slate-800">{u.full_name}</span>
                          <span className="text-[10px] text-slate-400 font-mono">({u.role || "member"})</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-700">Difficulty Level</Label>
                <Select value={formLevel} onValueChange={(v: any) => setFormLevel(v)}>
                  <SelectTrigger className="text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Beginner">Beginner</SelectItem>
                    <SelectItem value="Intermediate">Intermediate</SelectItem>
                    <SelectItem value="Advanced">Advanced</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-700">Est. Hours</Label>
                <Input
                  type="number"
                  min="1"
                  max="200"
                  value={formHours}
                  onChange={(e) => setFormHours(parseInt(e.target.value) || 5)}
                  className="text-xs"
                />
              </div>
            </div>

            <DialogFooter className="pt-3 border-t">
              <Button type="button" variant="ghost" size="sm" onClick={() => setCourseModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSaving} size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold gap-1.5">
                {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                {editingCourse ? "Update Course" : "Save Course to LMS"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* YouTube Video Preview Dialog */}
      <Dialog open={!!previewVideoId} onOpenChange={(open) => !open && setPreviewVideoId(null)}>
        <DialogContent className="sm:max-w-3xl p-0 overflow-hidden bg-black border-slate-800">
          <div className="relative aspect-video w-full">
            {previewVideoId && (
              <iframe
                src={`https://www.youtube.com/embed/${previewVideoId}?autoplay=1`}
                title="Course Video Preview"
                className="w-full h-full border-0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
