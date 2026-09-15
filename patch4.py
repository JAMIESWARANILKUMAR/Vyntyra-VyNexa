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

replacements = [
    (
        "const [manageTeamTask, setManageTeamTask] = useState<any>(null);",
        "const [manageTeamTask, setManageTeamTask] = useState<any>(null);\n  const [editingDeadlineTaskId, setEditingDeadlineTaskId] = useState<string | null>(null);\n  const [inlineDueDate, setInlineDueDate] = useState(\"\");"
    ),
    (
        "const handleBulkDelete = async () => {",
        "const handleInlineDeadlineUpdate = async (taskId: string) => {\n    if (!inlineDueDate) return;\n    try {\n      await doBulkUpdateTasks({ data: { taskIds: [taskId], due_date: inlineDueDate } });\n      toast.success(\"Deadline updated successfully!\");\n      setEditingDeadlineTaskId(null);\n      setInlineDueDate(\"\");\n      qc.invalidateQueries({ queryKey: [\"admin-intern-tasks\"] });\n      qc.invalidateQueries({ queryKey: [\"my-tasks\"] });\n    } catch (err: any) {\n      toast.error(err.message || \"Failed to update deadline\");\n    }\n  };\n\n  const handleBulkDelete = async () => {"
    ),
    (
        "<Button\n                      size=\"sm\"\n                      variant=\"outline\"\n                      className=\"h-8 text-xs text-amber-700 border-amber-200 hover:bg-amber-50 cursor-pointer\"\n                      onClick={() => {\n                        setSelectedTaskForReview(t);\n                        setAdminRemarks(t.progress_notes || \"\");\n                      }}\n                    >\n                      <RotateCcw className=\"h-3.5 w-3.5 mr-1\" /> Review\n                    </Button>",
        "<Button\n                      size=\"sm\"\n                      variant=\"outline\"\n                      className=\"h-8 text-xs text-amber-700 border-amber-200 hover:bg-amber-50 cursor-pointer\"\n                      onClick={() => {\n                        setSelectedTaskForReview(t);\n                        setAdminRemarks(t.progress_notes || \"\");\n                      }}\n                    >\n                      <RotateCcw className=\"h-3.5 w-3.5 mr-1\" /> Review\n                    </Button>\n\n                    {editingDeadlineTaskId === t.id ? (\n                      <div className=\"flex items-center gap-1\">\n                        <Input type=\"date\" autoFocus value={inlineDueDate} onChange={e => setInlineDueDate(e.target.value)} className=\"h-8 text-xs w-[130px]\" />\n                        <Button size=\"sm\" className=\"h-8 bg-blue-600 hover:bg-blue-700 text-white px-2 cursor-pointer\" onClick={() => handleInlineDeadlineUpdate(t.id)}>Save</Button>\n                        <Button size=\"sm\" variant=\"ghost\" className=\"h-8 px-2 cursor-pointer\" onClick={() => setEditingDeadlineTaskId(null)}>Cancel</Button>\n                      </div>\n                    ) : (\n                      <Button\n                        size=\"sm\"\n                        variant=\"outline\"\n                        className=\"h-8 text-xs font-bold text-slate-700 bg-slate-50 border-slate-200 hover:bg-slate-100 gap-1.5 shadow-2xs cursor-pointer\"\n                        onClick={() => {\n                          setEditingDeadlineTaskId(t.id);\n                          setInlineDueDate(t.due_date ? t.due_date.split('T')[0] : \"\");\n                        }}\n                        title=\"Modify Task Deadline\"\n                      >\n                        <Calendar className=\"h-3.5 w-3.5\" /> Deadline\n                      </Button>\n                    )}"
    )
]

patch_file('src/components/admin-intern-tasks-view.tsx', replacements)