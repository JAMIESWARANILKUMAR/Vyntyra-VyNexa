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

# In the review modal, add an iframe preview
preview_iframe = """
              {selectedTaskForReview.deliverable_url && (
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
                  <span className="text-[11px] font-bold text-slate-700 block">Submitted Deliverable:</span>
                  <a
                    href={selectedTaskForReview.deliverable_url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-blue-600 hover:underline flex items-center gap-1 font-mono break-all mb-2"
                  >
                    <ExternalLink className="h-3.5 w-3.5 shrink-0" />
                    {selectedTaskForReview.deliverable_url}
                  </a>
                  <div className="w-full h-[40vh] sm:h-[50vh] border border-slate-300 rounded-lg overflow-hidden bg-white relative">
                    <iframe 
                      src={getPreviewUrl(selectedTaskForReview.deliverable_url)} 
                      className="w-full h-full border-0" 
                      title="Deliverable Preview"
                      allow="autoplay"
                    />
                  </div>
                </div>
              )}
"""

replacements = [
    (
        "{selectedTaskForReview.deliverable_url && (\n                <div className=\"p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1\">\n                  <span className=\"text-[11px] font-bold text-slate-700 block\">Submitted Deliverable URL:</span>\n                  <a\n                    href={selectedTaskForReview.deliverable_url}\n                    target=\"_blank\"\n                    rel=\"noreferrer\"\n                    className=\"text-xs text-blue-600 hover:underline flex items-center gap-1 font-mono break-all\"\n                  >\n                    <ExternalLink className=\"h-3.5 w-3.5 shrink-0\" />\n                    {selectedTaskForReview.deliverable_url}\n                  </a>\n                </div>\n              )}",
        preview_iframe
    ),
    (
        "const filteredStoredTasks = storedBankTasks.filter((t) => {",
        "const filteredSubmissions = pendingSubmissions.filter((t) => {\n    if (!t) return false;\n    const internName = t.assigned_profile?.full_name || t.assigned_profile?.email || \"\";\n    const title = t.title || \"\";\n    const searchLower = (searchQuery || \"\").toLowerCase();\n    return !searchLower || title.toLowerCase().includes(searchLower) || internName.toLowerCase().includes(searchLower);\n  });\n\n  const filteredStoredTasks = storedBankTasks.filter((t) => {"
    )
]

patch_file('src/components/admin-intern-tasks-view.tsx', replacements)