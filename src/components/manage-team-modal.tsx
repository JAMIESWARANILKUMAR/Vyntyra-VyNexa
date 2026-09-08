import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Users, X, Plus } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { updateTeamTaskMembers } from "@/lib/operations.functions";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function ManageTeamModal({ 
  open, 
  onOpenChange, 
  task,
  interns 
}: { 
  open: boolean; 
  onOpenChange: (open: boolean) => void; 
  task: any;
  interns: any[];
}) {
  const [selectedInternIds, setSelectedInternIds] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const doUpdateTeam = useServerFn(updateTeamTaskMembers);
  const qc = useQueryClient();

  useEffect(() => {
    if (open && task?.team_id) {
      // Fetch current team members to populate the list
      supabase.from("tasks").select("assigned_to").eq("team_id", task.team_id)
        .then(({ data }) => {
          if (data) {
            const ids = data.map(d => d.assigned_to).filter(Boolean);
            if (ids.length > 0) setSelectedInternIds(ids);
            else if (task.assigned_to) setSelectedInternIds([task.assigned_to]);
          }
        });
    } else if (open && task?.assigned_to) {
      setSelectedInternIds([task.assigned_to]);
    }
  }, [open, task]);

  const handleAddIntern = (id: string) => {
    if (!selectedInternIds.includes(id)) {
      setSelectedInternIds([...selectedInternIds, id]);
    }
  };

  const handleRemoveIntern = (id: string) => {
    setSelectedInternIds(selectedInternIds.filter(i => i !== id));
  };

  const handleSave = async () => {
    if (selectedInternIds.length === 0) {
      toast.error("Team must have at least one member");
      return;
    }
    if (!task?.team_id) {
      toast.error("This is not a team task. Please recreate it as a team task.");
      return;
    }
    
    setIsSubmitting(true);
    try {
      await doUpdateTeam({
        data: {
          taskId: task.id,
          teamId: task.team_id,
          target_intern_ids: selectedInternIds
        }
      });
      toast.success("Team updated successfully");
      qc.invalidateQueries({ queryKey: ["admin-intern-tasks"] });
      onOpenChange(false);
    } catch (err: any) {
      toast.error(err.message || "Failed to update team");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-purple-600" />
            Manage Team
          </DialogTitle>
          <DialogDescription>
            Add or remove interns for the task <strong>{task?.title}</strong>.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Add Intern</label>
            <Select onValueChange={handleAddIntern} value="">
              <SelectTrigger>
                <SelectValue placeholder="Select an intern to add..." />
              </SelectTrigger>
              <SelectContent>
                {interns.filter(i => !selectedInternIds.includes(i.id)).map(intern => (
                  <SelectItem key={intern.id} value={intern.id}>
                    {intern.full_name || intern.email}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Current Team Members ({selectedInternIds.length})</label>
            <div className="border rounded-md p-2 min-h-[100px] flex flex-wrap gap-2 content-start">
              {selectedInternIds.map(id => {
                const intern = interns.find(i => i.id === id);
                return (
                  <Badge key={id} variant="secondary" className="flex items-center gap-1 py-1 px-2">
                    {intern?.full_name || intern?.email || id.substring(0, 8)}
                    <button 
                      onClick={() => handleRemoveIntern(id)}
                      className="ml-1 hover:bg-slate-200 rounded-full p-0.5"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                );
              })}
              {selectedInternIds.length === 0 && (
                <span className="text-sm text-slate-500 italic p-1">No members selected</span>
              )}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave} disabled={isSubmitting || selectedInternIds.length === 0}>
            {isSubmitting ? "Saving..." : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
