import sys

def run():
    with open('src/routes/_authenticated/admin/operations.tsx', 'r', encoding='utf-8') as f:
        content = f.read()

    search1 = '''                ) : displayTasks.length === 0 ? (
                  <EmptyState icon={<ClipboardList className="h-6 w-6" />} message={team.length === 0 ? "Add team members first, then assign tasks" : "No tasks yet. Assign one above!"} />
                ) : (
                  displayTasks.map((t: any) => (
                    <div key={t.id} className="p-4 hover:bg-slate-50 transition-colors">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">'''

    replace1 = '''                ) : displayTasks.length === 0 ? (
                  <EmptyState icon={<ClipboardList className="h-6 w-6" />} message={team.length === 0 ? "Add team members first, then assign tasks" : "No tasks yet. Assign one above!"} />
                ) : (
                  <>
                    <div className="bg-slate-50/80 border-b p-3 flex flex-wrap items-center justify-between gap-3 sticky top-0 z-10 backdrop-blur-sm">
                      <div className="flex items-center gap-3">
                        <input type="checkbox" className="rounded border-gray-300 w-4 h-4 cursor-pointer"
                          checked={selectedTasks.length > 0 && selectedTasks.length === displayTasks.length}
                          onChange={(e) => setSelectedTasks(e.target.checked ? displayTasks.map((t: any) => t.id) : [])}
                        />
                        <span className="text-sm font-medium text-slate-700">{selectedTasks.length} selected</span>
                      </div>
                      {selectedTasks.length > 0 && (
                        <div className="flex items-center gap-2">
                          <Input type="date" value={bulkDueDate} onChange={(e) => setBulkDueDate(e.target.value)} className="h-8 text-xs w-[130px] sm:w-[140px]" />
                          <Button size="sm" className="h-8 text-xs" onClick={handleBulkUpdateDueDate}>Update Deadline</Button>
                        </div>
                      )}
                    </div>
                    {displayTasks.map((t: any) => (
                      <div key={t.id} className="p-4 hover:bg-slate-50 transition-colors">
                        <div className="flex items-start justify-between gap-2">
                          <div className="pt-1 pr-2">
                            <input type="checkbox" className="rounded border-gray-300 w-4 h-4 cursor-pointer"
                              checked={selectedTasks.includes(t.id)}
                              onChange={(e) => setSelectedTasks(e.target.checked ? [...selectedTasks, t.id] : selectedTasks.filter(id => id !== t.id))}
                            />
                          </div>
                          <div className="flex-1 min-w-0">'''

    search2 = '''                    </div>
                  ))
                )}
              </div>
            </section>'''

    replace2 = '''                    </div>
                  ))
                }
                </>
                )}
              </div>
            </section>'''

    content = content.replace('\r\n', '\n')
    search1 = search1.replace('\r\n', '\n')
    replace1 = replace1.replace('\r\n', '\n')
    search2 = search2.replace('\r\n', '\n')
    replace2 = replace2.replace('\r\n', '\n')

    content = content.replace(search1, replace1)
    content = content.replace(search2, replace2)

    with open('src/routes/_authenticated/admin/operations.tsx', 'w', encoding='utf-8') as f:
        f.write(content)

if __name__ == '__main__':
    run()
