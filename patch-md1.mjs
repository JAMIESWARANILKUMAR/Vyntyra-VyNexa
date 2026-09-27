import fs from 'fs';
let code = fs.readFileSync('src/routes/_authenticated/admin/operations.tsx', 'utf-8');
if (!code.includes('import MDEditor')) {
  code = "import MDEditor from '@uiw/react-md-editor';\n" + code;
}
code = code.replace('<Textarea rows={3} value={taskForm.description} onChange={e => setTaskForm({ ...taskForm, description: e.target.value })} placeholder="Detailed instructions..." />', '<div data-color-mode="light"><MDEditor value={taskForm.description} onChange={(val) => setTaskForm({ ...taskForm, description: val || "" })} height={200} preview="edit" textareaProps={{ placeholder: "Detailed instructions..." }} /></div>');
fs.writeFileSync('src/routes/_authenticated/admin/operations.tsx', code);
