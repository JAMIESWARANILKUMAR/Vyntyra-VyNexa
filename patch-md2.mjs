import fs from 'fs';
let code = fs.readFileSync('src/routes/_authenticated/admin/operations.tsx', 'utf-8');
code = code.replace('<ReactQuill theme="snow" value={taskForm.description} onChange={(val) => setTaskForm({ ...taskForm, description: val })} placeholder="Detailed instructions..." className="bg-white rounded-md" />', '<div data-color-mode="light"><MDEditor value={taskForm.description} onChange={(val) => setTaskForm({ ...taskForm, description: val || "" })} height={200} preview="edit" textareaProps={{ placeholder: "Detailed instructions..." }} /></div>');
fs.writeFileSync('src/routes/_authenticated/admin/operations.tsx', code);
