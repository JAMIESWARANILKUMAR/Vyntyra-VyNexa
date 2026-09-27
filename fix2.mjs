import fs from 'fs';
let lines = fs.readFileSync('src/lib/operations.functions.ts', 'utf-8').split('\n');
for(let i=0; i<lines.length; i++) {
  if (lines[i].includes('updatedDesc = `[TeamId:')) {
    lines[i] = '    const updatedDesc = `[TeamId: ${effectiveTeamId}] [TeamName: ${teamName}] [Collaborators: ${teamMemberNames.join(", ")}]\n\n${cleanDesc}`;';
  }
  if (lines[i].includes('.replace') && lines[i].includes('Team:\\s*[^')) {
    lines[i] = '      .replace(/\\[(?:Collaborators|Team):\\s*[^\\]]+\\]\\s*/gi, "")';
  }
}
fs.writeFileSync('src/lib/operations.functions.ts', lines.join('\n'));

let lines2 = fs.readFileSync('src/components/task-rich-description.tsx', 'utf-8').split('\n');
for (let i = 0; i < lines2.length; i++) {
  if (lines2[i].includes('const teamMatch = text.match')) {
    lines2[i] = '  const teamMatch = text.match(/\\[(?:Collaborators|Team):\\s*([^\\]]+)\\]/i);';
  }
  if (lines2[i].includes('text = text.replace') && lines2[i].includes('Team:\\s*[^')) {
    lines2[i] = '    text = text.replace(/\\[(?:Collaborators|Team):\\s*[^\\]]+\\]/gi, "").trim();';
  }
}
fs.writeFileSync('src/components/task-rich-description.tsx', lines2.join('\n'));
