const fs = require('fs');
const path = './src/lib/operations.functions.ts';
let code = fs.readFileSync(path, 'utf8');

const targetStr = "<p>It is now queued for mentor review.</p>";
const replacementStr = "<p>It is now queued for mentor review.</p>\\n          <br><p>Best,</p><p><strong>Jamieswaran Ilkumar</strong><br>Founder & CEO<br>Vyntyra Consultancy Services</p><p><img src=\"\/signature.png\" alt=\"Founder Signature\" style=\"max-width: 150px;\" /></p>";

let count = 0;
while(code.includes(targetStr) && count < 1) {
    code = code.replace(targetStr, replacementStr);
    count++;
}
console.log('Replaced', count, 'times');

fs.writeFileSync(path, code);