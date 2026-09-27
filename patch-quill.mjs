import fs from 'fs';
let code = fs.readFileSync('src/routes/_authenticated/admin/operations.tsx', 'utf-8');
if (!code.includes('import ReactQuill')) {
  code = "import ReactQuill from 'react-quill';\nimport 'react-quill/dist/quill.snow.css';\n" + code;
}
code = code.replace('<Textarea rows={3} value={taskForm.description} onChange={e => setTaskForm({ ...taskForm, description: e.target.value })} placeholder="Detailed instructions..." />', '<ReactQuill theme="snow" value={taskForm.description} onChange={(val) => setTaskForm({ ...taskForm, description: val })} placeholder="Detailed instructions..." className="bg-white rounded-md" />');
fs.writeFileSync('src/routes/_authenticated/admin/operations.tsx', code);
