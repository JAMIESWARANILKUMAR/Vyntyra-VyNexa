import io

def patch_file(path, replacements):
    with io.open(path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    for old, new in replacements:
        if old not in content:
            print(f"Warning: could not find text to replace in {path}\n'{old}'")
        else:
            content = content.replace(old, new)
        
    with io.open(path, 'w', encoding='utf-8', newline='\n') as f:
        f.write(content)
    print(f"Patched {path}")

# Re-apply bulkUpdateTasks from dc19b36, plus inline edit logic
# Note: Since f9b60ca already has bulkDeleteTasks, we just need to add bulkUpdateTasks in the import
replacements = [
    (
        "reviewDeadlineExtension, bulkDeleteTasks, deleteTaskBatch, deleteAllInternTasks,",
        "reviewDeadlineExtension, bulkDeleteTasks, bulkUpdateTasks, deleteTaskBatch, deleteAllInternTasks,"
    ),
    (
        "const doBulkDelete = useServerFn(bulkDeleteTasks);",
        "const doBulkDelete = useServerFn(bulkDeleteTasks);\n  const doBulkUpdateTasks = useServerFn(bulkUpdateTasks);"
    ),
    (
        "const [manageTeamTask, setManageTeamTask] = useState<any>(null);",
        "const [manageTeamTask, setManageTeamTask] = useState<any>(null);\n  const [bulkDueDate, setBulkDueDate] = useState(\"\");\n  const [editingDeadlineTaskId, setEditingDeadlineTaskId] = useState<string | null>(null);\n  const [inlineDueDate, setInlineDueDate] = useState(\"\");"
    ),
    (
        "const handleBulkDelete = async () => {",
        "const handleBulkUpdateDueDate = async () => {\n    if (!bulkDueDate || selectedTaskIds.length === 0) {\n      toast.error(\"Please select tasks and a due date first\");\n      return;\n    }\n    try {\n      await doBulkUpdateTasks({ data: { taskIds: selectedTaskIds, due_date: bulkDueDate } });\n      toast.success(\"Due dates updated successfully!\");\n      setSelectedTaskIds([]);\n      setBulkDueDate(\"\");\n      qc.invalidateQueries({ queryKey: [\"admin-intern-tasks\"] });\n      qc.invalidateQueries({ queryKey: [\"my-tasks\"] });\n    } catch (err: any) {\n      toast.error(err.message || \"Failed to update tasks\");\n    }\n  };\n\n  const handleInlineDeadlineUpdate = async (taskId: string) => {\n    if (!inlineDueDate) return;\n    try {\n      await doBulkUpdateTasks({ data: { taskIds: [taskId], due_date: inlineDueDate } });\n      toast.success(\"Deadline updated successfully!\");\n      setEditingDeadlineTaskId(null);\n      setInlineDueDate(\"\");\n      qc.invalidateQueries({ queryKey: [\"admin-intern-tasks\"] });\n      qc.invalidateQueries({ queryKey: [\"my-tasks\"] });\n    } catch (err: any) {\n      toast.error(err.message || \"Failed to update deadline\");\n    }\n  };\n\n  const handleBulkDelete = async () => {"
    ),
    (
        "<Button size=\"sm\" variant=\"destructive\" onClick={handleBulkDelete} className=\"h-8 text-xs font-semibold cursor-pointer\">",
        "<div className=\"flex items-center gap-1.5 mr-2 border-r pr-3 border-slate-300\">\n                    <Input type=\"date\" value={bulkDueDate} onChange={(e) => setBulkDueDate(e.target.value)} className=\"h-8 text-xs w-[130px]\" />\n                    <Button size=\"sm\" onClick={handleBulkUpdateDueDate} className=\"h-8 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-xs cursor-pointer\">\n                      Update Deadline\n                    </Button>\n                  </div>\n                <Button size=\"sm\" variant=\"destructive\" onClick={handleBulkDelete} className=\"h-8 text-xs font-semibold cursor-pointer\">"
    ),
    (
        "<Button\n                      size=\"sm\"\n                      variant=\"outline\"\n                      className=\"h-8 text-xs text-amber-700 border-amber-200 hover:bg-amber-50 cursor-pointer\"\n                      onClick={() => {\n                        setSelectedTaskForReview(t);\n                        setAdminRemarks(t.progress_notes || \"\");\n                      }}\n                    >\n                      <RotateCcw className=\"h-3.5 w-3.5 mr-1\" /> Review\n                    </Button>",
        "<Button\n                      size=\"sm\"\n                      variant=\"outline\"\n                      className=\"h-8 text-xs text-amber-700 border-amber-200 hover:bg-amber-50 cursor-pointer\"\n                      onClick={() => {\n                        setSelectedTaskForReview(t);\n                        setAdminRemarks(t.progress_notes || \"\");\n                      }}\n                    >\n                      <RotateCcw className=\"h-3.5 w-3.5 mr-1\" /> Review\n                    </Button>\n\n                    {editingDeadlineTaskId === t.id ? (\n                      <div className=\"flex items-center gap-1\">\n                        <Input type=\"date\" autoFocus value={inlineDueDate} onChange={e => setInlineDueDate(e.target.value)} className=\"h-8 text-xs w-[130px]\" />\n                        <Button size=\"sm\" className=\"h-8 bg-blue-600 text-white px-2\" onClick={() => handleInlineDeadlineUpdate(t.id)}>Save</Button>\n                        <Button size=\"sm\" variant=\"ghost\" className=\"h-8 px-2\" onClick={() => setEditingDeadlineTaskId(null)}>Cancel</Button>\n                      </div>\n                    ) : (\n                      <Button\n                        size=\"sm\"\n                        variant=\"outline\"\n                        className=\"h-8 text-xs font-bold text-slate-700 bg-slate-50 border-slate-200 hover:bg-slate-100 gap-1.5 shadow-2xs cursor-pointer\"\n                        onClick={() => {\n                          setEditingDeadlineTaskId(t.id);\n                          setInlineDueDate(t.due_date ? t.due_date.split('T')[0] : \"\");\n                        }}\n                        title=\"Modify Task Deadline\"\n                      >\n                        <Calendar className=\"h-3.5 w-3.5\" /> Deadline\n                      </Button>\n                    )}"
    ),
    (
        "className=\"h-8 text-xs font-bold text-amber-700 bg-amber-50/80 border-amber-200 hover:bg-amber-100 gap-1 shadow-2xs cursor-pointer\"",
        "className=\"h-8 text-xs font-bold text-amber-700 bg-amber-50/80 border-amber-200 hover:bg-amber-100 gap-1 shadow-2xs cursor-pointer\""
    )
]

patch_file('src/components/admin-intern-tasks-view.tsx', replacements)