import { createFileRoute } from '@tanstack/react-router';
import { Building2, Plus, Mail, ClipboardList, Calendar, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

export const Route = createFileRoute('/_authenticated/admin/operations')({
  head: () => ({ meta: [{ title: 'Operations Dashboard — Vyntyra' }] }),
  component: OperationsDashboard,
});

function OperationsDashboard() {
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
