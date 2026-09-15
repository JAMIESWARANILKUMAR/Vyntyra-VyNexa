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

# To handle iframe drive previews:
drive_helper = """
  // Helper to safely render drive links or standard links in an iframe
  const getPreviewUrl = (url: string) => {
    if (!url) return "";
    if (url.includes("drive.google.com/file/d/")) {
      return url.replace(/\/view.*$/, "/preview");
    }
    return url;
  };
"""

replacements = [
    (
        "const [activeViewTab, setActiveViewTab] = useState<\"active\" | \"stored_bank\">(\"active\");",
        "const [activeViewTab, setActiveViewTab] = useState<\"active\" | \"submissions\" | \"stored_bank\">(\"active\");\n  const [previewTask, setPreviewTask] = useState<any>(null);"
    ),
    (
        "const activeAssignedTasks = tasks.filter((t) => t && t.assigned_to && !t.is_pool_task);",
        "const activeAssignedTasks = tasks.filter((t) => t && (t.assigned_to || t.team_id || t.assignment_mode === 'team') && !t.is_pool_task);\n  const pendingSubmissions = tasks.filter((t) => t && t.status === \"submitted\");"
    ),
    (
        "const handleInlineDeadlineUpdate = async (taskId: string) => {",
        drive_helper + "\n\n  const handleInlineDeadlineUpdate = async (taskId: string) => {"
    ),
    (
        "<FolderArchive className=\"h-4 w-4 text-emerald-600\" />\n          <span>Stored Task Bank (Future Repository)</span>",
        "<Button\n          type=\"button\"\n          variant=\"ghost\"\n          onClick={() => setActiveViewTab(\"submissions\")}\n          className={lex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer h-auto }\n        >\n          <CheckCheck className=\"h-4 w-4 text-rose-600\" />\n          <span>Pending Submissions</span>\n          <span className={px-2 py-0.5 rounded-full text-[10px] font-bold }>\n            {pendingSubmissions.length}\n          </span>\n        </Button>\n\n        <button\n          type=\"button\"\n          onClick={() => setActiveViewTab(\"stored_bank\")}\n          className={lex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer }\n        >\n          <FolderArchive className=\"h-4 w-4 text-emerald-600\" />\n          <span>Stored Task Bank (Future Repository)</span>"
    ),
    (
        "<a\n                            href={taskFile}\n                            target=\"_blank\"\n                            rel=\"noreferrer\"\n                            className=\"text-indigo-600 hover:underline inline-flex items-center gap-1 font-medium\"\n                          >\n                            <FileText className=\"h-3.5 w-3.5\" /> View Task File\n                          </a>",
        "<button\n                            onClick={() => setPreviewTask({...t, _previewUrl: taskFile})}\n                            className=\"text-indigo-600 hover:underline inline-flex items-center gap-1 font-medium cursor-pointer\"\n                          >\n                            <FileText className=\"h-3.5 w-3.5\" /> View Task File\n                          </button>"
    )
]

patch_file('src/components/admin-intern-tasks-view.tsx', replacements)