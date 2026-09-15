const fs = require('fs');
const path = './src/lib/operations.functions.ts';
let code = fs.readFileSync(path, 'utf8');

const targetStr = "<br><p>Best,</p><p><strong>Jamieswaran Ilkumar</strong><br>Founder & CEO<br>Vyntyra Consultancy Services</p><p><img src=\"\/signature.png\" alt=\"Founder Signature\" style=\"max-width: 150px;\" /></p>";

const replacementStr = "<br><p style=\"color: #334155; margin-bottom: 5px;\">Sincerely,</p><p style=\"margin: 10px 0;\"><img src=\"\/signature.png\" alt=\"Founder Signature\" style=\"max-width: 180px;\" /></p><p style=\"margin: 0; padding: 0; line-height: 1.4;\"><strong style=\"color: #002D62; font-size: 16px;\">Jami Eswar Anil Kumar</strong><br><span style=\"color: #4682B4; font-size: 14px;\">Founder & Managing Director</span><br><span style=\"color: #4682B4; font-size: 14px;\">Vyntyra Consultancy Services</span></p>";

let count = 0;
while(code.includes(targetStr)) {
    code = code.replace(targetStr, replacementStr);
    count++;
}
console.log('Replaced', count, 'times');

fs.writeFileSync(path, code);