import { createFileRoute } from '@tanstack/react-router';
import { Building2, Plus, Mail, ClipboardList, Calendar, Trash2, Users, ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useServerFn } from '@tanstack/react-start';
import { listTeamMembers, provisionUser, revokeUser } from '@/lib/operations.functions';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

export const Route = createFileRoute('/_authenticated/admin/operations')({
  head: () => ({ meta: [{ title: 'Operations Dashboard — Vyntyra' }] }),
  component: OperationsDashboard,
});

function OperationsDashboard() {
  const qc = useQueryClient();
  const fetchTeam = useServerFn(listTeamMembers);
  const doProvision = useServerFn(provisionUser);
  const doRevoke = useServerFn(revokeUser);
  
  const [provisionOpen, setProvisionOpen] = useState(false);
  const [isProvisioning, setIsProvisioning] = useState(false);
  const [formData, setFormData] = useState({ full_name: '', email: '', password: '', role: 'employee' as 'employee' | 'intern' });

  const { data: team = [], isLoading } = useQuery({
    queryKey: ['team-members'],
    queryFn: () => fetchTeam(),
  });

  const handleProvision = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProvisioning(true);
    try {
      await doProvision({ data: formData });
      toast.success("User provisioned successfully!");
      setProvisionOpen(false);
      qc.invalidateQueries({ queryKey: ['team-members'] });
      setFormData({ full_name: '', email: '', password: '', role: 'employee' });
    } catch (error: any) {
      toast.error(error.message || "Failed to provision user");
    } finally {
      setIsProvisioning(false);
    }
  };

  const handleRevoke = async (userId: string) => {
    try {
      await doRevoke({ data: { userId } });
      toast.success("User access revoked.");
      qc.invalidateQueries({ queryKey: ['team-members'] });
    } catch (error: any) {
      toast.error(error.message || "Failed to revoke user");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-surface/80 backdrop-blur-lg border-b border-border shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <img src="https://vyntyraconsultancyservices.in/logo.png" alt="Vyntyra" className="h-8 w-auto rounded-md" />
            <div className="border-l border-border pl-4">
              <h1 className="font-semibold text-lg leading-tight">Super Admin Operations</h1>
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Team Management & Announcements</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="outline" size="sm" onClick={() => window.history.back()}>
              Back to Recruitment
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* Access Control Manager */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <Users className="h-5 w-5 text-indigo-500" /> Access Control
            </h2>
            <Dialog open={provisionOpen} onOpenChange={setProvisionOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="gap-2"><Plus className="h-4 w-4" /> Provision User</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Provision Team Member</DialogTitle>
                  <DialogDescription>Create a new account for an employee or intern to access the portal.</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleProvision} className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>Full Name</Label>
                    <Input required value={formData.full_name} onChange={e => setFormData({...formData, full_name: e.target.value})} placeholder="John Doe" />
                  </div>
                  <div className="space-y-2">
                    <Label>Email</Label>
                    <Input required type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} placeholder="john@example.com" />
                  </div>
                  <div className="space-y-2">
                    <Label>Temporary Password</Label>
                    <Input required type="text" minLength={6} value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} placeholder="min 6 characters" />
                  </div>
                  <div className="space-y-2">
                    <Label>Role</Label>
                    <Select value={formData.role} onValueChange={(v: any) => setFormData({...formData, role: v})}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="employee">Employee</SelectItem>
                        <SelectItem value="intern">Intern</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <DialogFooter className="pt-4">
                    <Button type="button" variant="ghost" onClick={() => setProvisionOpen(false)}>Cancel</Button>
                    <Button type="submit" disabled={isProvisioning}>{isProvisioning ? "Provisioning..." : "Create Account"}</Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
          
          <Card>
            <div className="divide-y divide-border">
              {isLoading ? (
                <div className="p-8 text-center text-muted-foreground text-sm">Loading team members...</div>
              ) : team.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground text-sm">No team members provisioned yet.</div>
              ) : (
                team.map((member: any) => (
                  <div key={member.id} className="p-4 hover:bg-muted/30 transition-colors flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-sm flex items-center gap-2">
                        {member.full_name}
                        <span className={`px-2 py-0.5 rounded-full text-[10px] uppercase font-bold tracking-wider ${member.role === 'employee' ? 'bg-primary/10 text-primary' : 'bg-secondary/10 text-secondary'}`}>
                          {member.role}
                        </span>
                      </h4>
                      <p className="text-xs text-muted-foreground mt-1">{member.email}</p>
                    </div>
                    
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle className="flex items-center gap-2"><ShieldAlert className="h-5 w-5 text-destructive" /> Revoke Access</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to completely delete <strong>{member.full_name}</strong>'s account? They will instantly lose all access to their dashboard. This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleRevoke(member.id)} className="bg-destructive hover:bg-destructive/90 text-white">
                            Yes, Revoke Access
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                ))
              )}
            </div>
          </Card>
        </section>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Announcements Manager */}
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <Mail className="h-5 w-5 text-gold" /> Announcements
              </h2>
              <Button size="sm" className="gap-2"><Plus className="h-4 w-4" /> New Post</Button>
            </div>
            
            <Card>
              <div className="divide-y divide-border">
                <div className="p-4 hover:bg-muted/30 transition-colors">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-medium text-sm">Quarterly Townhall Meeting</h4>
                      <p className="text-xs text-muted-foreground mt-1">Target: Employees • Posted 2 hours ago</p>
                    </div>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive"><Trash2 className="h-4 w-4" /></Button>
                  </div>
                  <p className="text-sm mt-3 text-muted-foreground line-clamp-2">
                    Join us this Friday for the Q3 townhall where we will discuss our upcoming enterprise AI milestones...
                  </p>
                </div>
              </div>
            </Card>
          </section>

          {/* Task Manager */}
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <ClipboardList className="h-5 w-5 text-primary" /> Global Tasks
              </h2>
              <Button size="sm" className="gap-2"><Plus className="h-4 w-4" /> Assign Task</Button>
            </div>
            
            <Card>
              <div className="divide-y divide-border">
                <div className="p-4 hover:bg-muted/30 transition-colors">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-medium text-sm">Update Client Architecture Diagram</h4>
                      <p className="text-xs text-muted-foreground mt-1">Assigned to: John Doe • Due in 2 days</p>
                    </div>
                    <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold bg-secondary text-secondary-foreground">
                      In Progress
                    </span>
                  </div>
                </div>
              </div>
            </Card>
          </section>

          {/* Schedules Manager */}
          <section className="space-y-4 md:col-span-2">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <Calendar className="h-5 w-5 text-emerald-500" /> Schedules & Meetings
              </h2>
              <Button size="sm" className="gap-2"><Plus className="h-4 w-4" /> Add Event</Button>
            </div>
            
            <Card>
              <CardContent className="p-4 text-center text-muted-foreground text-sm">
                Schedules management UI will appear here.
              </CardContent>
            </Card>
          </section>

        </div>
      </main>
    </div>
  );
}
