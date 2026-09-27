import fs from 'fs';
let code = fs.readFileSync('src/components/intern-task-assignment-modal.tsx', 'utf-8');
if (!code.includes('import MDEditor')) {
  code = "import MDEditor from '@uiw/react-md-editor';\n" + code;
}
code = code.replace('<Textarea\n                  placeholder="Paste the syllabus or project requirements here..."\n                  rows={10}\n                  value={documentText}\n                  onChange={(e) => setDocumentText(e.target.value)}\n                />', '<div data-color-mode="light"><MDEditor value={documentText} onChange={(val) => setDocumentText(val || "")} height={300} preview="edit" textareaProps={{ placeholder: "Paste the syllabus or project requirements here..." }} /></div>');
code = code.replace('<Textarea\n                    placeholder="Describe step-by-step requirements, expected deliverables, tech stack..."\n                    rows={3}\n                    value={manualDescription}\n                    onChange={(e) => setManualDescription(e.target.value)}\n                  />', '<div data-color-mode="light"><MDEditor value={manualDescription} onChange={(val) => setManualDescription(val || "")} height={200} preview="edit" textareaProps={{ placeholder: "Describe step-by-step requirements, expected deliverables, tech stack..." }} /></div>');
fs.writeFileSync('src/components/intern-task-assignment-modal.tsx', code);
