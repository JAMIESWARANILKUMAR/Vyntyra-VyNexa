import io

def patch_file(path, replacements):
    with io.open(path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    for old, new in replacements:
        if old not in content:
            print(f"Warning: could not find text to replace in {path}\n'{old[:50]}...'")
        else:
            content = content.replace(old, new)
        
    with io.open(path, 'w', encoding='utf-8', newline='\n') as f:
        f.write(content)
    print(f"Patched {path}")

submissions_ui = """
      {/* PENDING SUBMISSIONS QUEUE VIEW */}
      {activeViewTab === "submissions" && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-950 p-5 rounded-2xl border shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold flex items-center gap-2"><CheckCheck className="h-5 w-5 text-rose-600" /> Pending Submissions Review Queue</h2>
              <Input
                placeholder="Search submissions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full sm:w-[250px] h-9 text-xs"
              />
            </div>
            
            <div className="space-y-3">
              {filteredSubmissions.length === 0 ? (
                <div className="p-8 text-center bg-slate-50 dark:bg-slate-900 rounded-xl border border-dashed border-slate-200">
                  <p className="text-slate-500 font-medium">No pending submissions to review. You're all caught up!</p>
                </div>
              ) : (
                filteredSubmissions.map((t: any) => (
                  <div key={t.id} className="p-4 bg-slate-50 hover:bg-slate-100 transition-colors rounded-xl border flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div className="space-y-1.5 flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-sm">{t.title}</span>
                        <Badge className="bg-indigo-100 text-indigo-800 text-[10px]">Submitted</Badge>
                      </div>
                      <div className="text-xs text-slate-600 flex items-center gap-2">
                        <User className="h-3 w-3" /> 
                        <span className="font-medium">{t.assigned_profile?.full_name || "Unknown Intern"}</span>
                        {t.assigned_profile?.email && <span>({t.assigned_profile.email})</span>}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 shrink-0">
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border-indigo-200 h-8 text-xs cursor-pointer"
                        onClick={() => {
                          setSelectedTaskForReview(t);
                          setAdminRemarks(t.progress_notes || "");
                        }}
                      >
                        <Eye className="h-3.5 w-3.5 mr-1.5" /> View Deliverable & Grade
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {activeViewTab === "stored_bank" && (
"""

replacements = [
    (
        "{activeViewTab === \"stored_bank\" && (",
        submissions_ui
    )
]

patch_file('src/components/admin-intern-tasks-view.tsx', replacements)