import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Users, X, Plus, Loader2, CheckCircle2, UserPlus } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { updateTeamTaskMembers, getTeamTaskMembers } from "@/lib/operations.functions";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

export function ManageTeamModal({ 
  open, 
  onOpenChange, 
  task,
  interns = []
}: { 
  open: boolean; 
  onOpenChange: (open: boolean) => void; 
  task: any;
  interns?: any[];
}) {
  const [selectedInternIds, setSelectedInternIds] = useState<string[]>([]);
  const [loadedInternPool, setLoadedInternPool] = useState<any[]>([]);
  const [isLoadingMembers, setIsLoadingMembers] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchTeamMembers = useServerFn(getTeamTaskMembers);
  const doUpdateTeam = useServerFn(updateTeamTaskMembers);
  const qc = useQueryClient();

  useEffect(() => {
    if (!open || !task?.id) {
      return;
    }

    let isMounted = true;
    setIsLoadingMembers(true);

    fetchTeamMembers({
      data: {
        taskId: task.id,
        teamId: task.team_id || null,
      }
    })
      .then((res: any) => {
        if (!isMounted) return;
        if (res?.memberIds && res.memberIds.length > 0) {
          setSelectedInternIds(res.memberIds);
        } else if (task?.assigned_to) {
          setSelectedInternIds([task.assigned_to]);
        }

        if (res?.allInterns && res.allInterns.length > 0) {
          setLoadedInternPool(res.allInterns);
        }
      })
      .catch((err) => {
        console.warn("[ManageTeamModal] Failed to load team members via server:", err);
        if (task?.assigned_to) {
          setSelectedInternIds([task.assigned_to]);
        }
      })
      .finally(() => {
        if (isMounted) setIsLoadingMembers(false);
      });

    return () => {
      isMounted = false;
    };
  }, [open, task?.id, task?.team_id]);

  // Combine props interns and server-loaded interns
  const combinedInterns = (() => {
    const map = new Map<string, any>();
    (interns || []).forEach(i => { if (i?.id) map.set(i.id, i); });
    (loadedInternPool || []).forEach(i => { if (i?.id && !map.has(i.id)) map.set(i.id, i); });
    return Array.from(map.values()).sort((a, b) => 
      (a.full_name || a.email || "").localeCompare(b.full_name || b.email || "")
    );
  })();

  const handleAddIntern = (id: string) => {
    if (!id) return;
    if (!selectedInternIds.includes(id)) {
      setSelectedInternIds(prev => [...prev, id]);
    }
  };

  const handleRemoveIntern = (id: string) => {
    setSelectedInternIds(prev => prev.filter(i => i !== id));
  };

  const handleSave = async () => {
    if (selectedInternIds.length === 0) {
      toast.error("Please select at least one intern for this task.");
      return;
    }
    
    setIsSubmitting(true);
    try {
      await doUpdateTeam({
        data: {
          taskId: task.id,
          teamId: task?.team_id || null,
          target_intern_ids: selectedInternIds
        }
      });

      toast.success(
        selectedInternIds.length > 1 
          ? `Team updated (${selectedInternIds.length} members) and synced to intern dashboards!` 
          : "Task assignment updated successfully!"
      );

      // Invalidate all related caches
      qc.invalidateQueries({ queryKey: ["admin-intern-tasks"] });
      qc.invalidateQueries({ queryKey: ["tasks"] });
      qc.invalidateQueries({ queryKey: ["my-tasks"] });
      qc.invalidateQueries({ queryKey: ["team-members"] });

      onOpenChange(false);
    } catch (err: any) {
      toast.error(err.message || "Failed to update team");
    } finally {
      setIsSubmitting(false);
    }
  };

  const availableToAdd = combinedInterns.filter(i => !selectedInternIds.includes(i.id));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base font-bold">
            <Users className="h-5 w-5 text-purple-600" />
            Manage Collaborative Team
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-500">
            Add or remove interns working on <strong>{task?.title || "this task"}</strong>. All changes instantly sync to their dashboards.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {isLoadingMembers ? (
            <div className="py-8 flex flex-col items-center justify-center gap-2 text-slate-400 text-xs">
              <Loader2 className="h-5 w-5 animate-spin text-purple-600" />
              <span>Loading current team members...</span>
            </div>
          ) : (
            <>
              {/* Add Intern Selector */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                  <UserPlus className="h-3.5 w-3.5 text-purple-600" /> Add Team Member
                </label>
                <Select onValueChange={handleAddIntern} value="">
                  <SelectTrigger className="text-xs h-9">
                    <SelectValue placeholder={availableToAdd.length > 0 ? "Select an intern to add to team..." : "All available interns already added"} />
                  </SelectTrigger>
                  <SelectContent className="max-h-56">
                    {availableToAdd.map(intern => (
                      <SelectItem key={intern.id} value={intern.id} className="text-xs">
                        {intern.full_name || intern.email} {intern.intern_id ? `(${intern.intern_id})` : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Current Team Members */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-700">
                    Assigned Team Members ({selectedInternIds.length})
                  </label>
                  {selectedInternIds.length > 1 && (
                    <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200 text-[10px]">
                      Collaborative Team
                    </Badge>
                  )}
                </div>

                <div className="border border-slate-200 rounded-lg p-2.5 min-h-[110px] max-h-[220px] overflow-y-auto flex flex-wrap gap-2 content-start bg-slate-50/50">
                  {selectedInternIds.map(id => {
                    const intern = combinedInterns.find(i => i.id === id);
                    const displayName = intern?.full_name || intern?.email || id.substring(0, 8);
                    const internIdTag = intern?.intern_id ? ` • ${intern.intern_id}` : "";
                    
                    return (
                      <Badge 
                        key={id} 
                        variant="secondary" 
                        className="flex items-center gap-1.5 py-1 px-2.5 bg-white border border-slate-200 shadow-2xs text-xs font-medium text-slate-800"
                      >
                        <span>{displayName}{internIdTag}</span>
                        <button 
                          type="button"
                          onClick={() => handleRemoveIntern(id)}
                          className="ml-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-full p-0.5 transition-colors"
                          title={`Remove ${displayName}`}
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    );
                  })}
                  {selectedInternIds.length === 0 && (
                    <div className="w-full text-center py-6 text-slate-400 text-xs italic">
                      No team members selected. Please select at least one intern above.
                    </div>
                  )}
                </div>
              </div>

              {selectedInternIds.length > 1 && (
                <div className="p-2.5 rounded-md bg-purple-50/80 border border-purple-100 text-[11px] text-purple-900 flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-purple-600 shrink-0" />
                  <span>
                    This task will appear as a shared collaborative team task on all {selectedInternIds.length} members' dashboards.
                  </span>
                </div>
              )}
            </>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button 
            size="sm"
            onClick={handleSave} 
            disabled={isSubmitting || isLoadingMembers || selectedInternIds.length === 0}
            className="bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                Saving Team...
              </>
            ) : (
              "Save Changes"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
