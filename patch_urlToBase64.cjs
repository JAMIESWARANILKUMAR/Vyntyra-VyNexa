const fs = require('fs');
const path = './src/lib/nocGenerator.ts';
let code = fs.readFileSync(path, 'utf8');

const target = `    let targetUrl = trimmed;
    if (targetUrl.startsWith("/") && typeof window !== "undefined") {
      targetUrl = window.location.origin + targetUrl;
    }`;

const replacement = `    let targetUrl = trimmed;
    if (targetUrl.startsWith("/")) {
      if (typeof window !== "undefined") {
        targetUrl = window.location.origin + targetUrl;
      } else {
        // Fallback for server-side generation
        targetUrl = "https://careers.vyntyraconsultancyservices.in" + targetUrl;
      }
    }`;

if (code.includes(target)) {
  code = code.replace(target, replacement);
  fs.writeFileSync(path, code);
  console.log('Fixed urlToBase64 in nocGenerator!');
} else {
  console.log('Could not find target in nocGenerator.');
}
