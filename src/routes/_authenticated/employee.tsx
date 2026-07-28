import { createFileRoute } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { 
  Building2, Calendar, ClipboardList, Clock, 
  GraduationCap, Mail, User, Shield, Briefcase
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export const Route = createFileRoute('/_authenticated/employee')({
  head: () => ({ meta: [{ title: 'Employee Dashboard — Vyntyra' }] }),
  component: EmployeeDashboard,
});

function EmployeeDashboard() {
  const { data: session } = useQuery({
    queryKey: ['session'],
    queryFn: async () => {
      const { data } = await supabase.auth.getSession();
      return data.session;
    }
  });

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-surface/80 backdrop-blur-lg border-b border-border shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <img src="https://vyntyraconsultancyservices.in/logo.png" alt="Vyntyra" className="h-8 w-auto rounded-md" />
            <div className="border-l border-border pl-4">
              <h1 className="font-semibold text-lg leading-tight">Employee Dashboard</h1>
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Vyntyra Workspace</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-sm font-medium hidden sm:block">
              {session?.user?.email}
            </div>
            <Button variant="outline" size="sm" onClick={() => supabase.auth.signOut()}>
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* Overview Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bg-gradient-to-br from-primary/5 to-transparent border-primary/10">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2 text-muted-foreground">
                <Briefcase className="h-4 w-4 text-primary" /> Active Projects
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">3</div>
              <p className="text-xs text-muted-foreground mt-1">Leading 1, Contributing 2</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2 text-muted-foreground">
                <ClipboardList className="h-4 w-4 text-gold" /> Pending Tasks
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">5</div>
              <p className="text-xs text-muted-foreground mt-1">2 due this week</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2 text-muted-foreground">
                <Clock className="h-4 w-4 text-emerald-500" /> Today's Attendance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <div className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-2xl font-bold">Checked In</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">Since 09:00 AM</p>
            </CardContent>
          </Card>
        </div>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main Feed */}
          <div className="lg:col-span-2 space-y-8">
            {/* Announcements */}
            <section>
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Mail className="h-5 w-5 text-gold" /> Announcements
              </h2>
              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Quarterly Townhall Meeting</CardTitle>
                    <CardDescription>Posted by Super Admin • 2 hours ago</CardDescription>
                  </CardHeader>
                  <CardContent className="text-sm text-foreground/80">
                    Join us this Friday for the Q3 townhall where we will discuss our upcoming enterprise AI milestones and new client acquisitions. Check your schedules for the meeting link.
                  </CardContent>
                </Card>
              </div>
            </section>
            
            {/* My Tasks */}
            <section>
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <ClipboardList className="h-5 w-5 text-primary" /> My Tasks
              </h2>
              <Card>
                <div className="divide-y divide-border">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="p-4 flex flex-col sm:flex-row gap-4 justify-between sm:items-center hover:bg-muted/30 transition-colors">
                      <div>
                        <h4 className="font-medium text-sm">Update Client Architecture Diagram #{i}</h4>
                        <p className="text-xs text-muted-foreground mt-1">Due in 2 days</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-secondary text-secondary-foreground">
                          In Progress
                        </span>
                        <Button variant="outline" size="sm">Update</Button>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </section>
          </div>

          {/* Sidebar */}
          <div className="space-y-8">
            {/* Schedule */}
            <section>
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Calendar className="h-5 w-5 text-gold" /> Schedule
              </h2>
              <Card>
                <CardContent className="p-0">
                  <div className="divide-y divide-border">
                    <div className="p-4 flex gap-4">
                      <div className="flex flex-col items-center justify-center min-w-[50px] bg-muted/50 rounded-md p-2">
                        <span className="text-xs font-bold text-muted-foreground">OCT</span>
                        <span className="text-lg font-bold text-primary">12</span>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium">Engineering Sync</h4>
                        <p className="text-xs text-muted-foreground mt-1">10:00 AM - 11:30 AM</p>
                      </div>
                    </div>
                    <div className="p-4 flex gap-4">
                      <div className="flex flex-col items-center justify-center min-w-[50px] bg-muted/50 rounded-md p-2">
                        <span className="text-xs font-bold text-muted-foreground">OCT</span>
                        <span className="text-lg font-bold text-primary">15</span>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium">Townhall</h4>
                        <p className="text-xs text-muted-foreground mt-1">02:00 PM - 03:00 PM</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </section>

            {/* Profile Summary */}
            <section>
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <User className="h-5 w-5 text-primary" /> Profile Details
              </h2>
              <Card>
                <CardContent className="p-4 space-y-4 text-sm">
                  <div>
                    <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Department</div>
                    <div className="font-medium">Engineering</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Position</div>
                    <div className="font-medium">Senior Software Engineer</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Leave Balance</div>
                    <div className="font-medium">14 Days Remaining</div>
                  </div>
                </CardContent>
              </Card>
            </section>
          </div>
          
        </div>
      </main>
    </div>
  );
}
