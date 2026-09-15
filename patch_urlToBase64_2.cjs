const fs = require('fs');
const path = './src/lib/nocGenerator.ts';
let code = fs.readFileSync(path, 'utf8');

const regex = /let targetUrl = trimmed;\s+if \(targetUrl\.startsWith\("\/"\) && typeof window !== "undefined"\) {\s+targetUrl = window\.location\.origin \+ targetUrl;\s+}/g;

const replacement = `let targetUrl = trimmed;
    if (targetUrl.startsWith("/")) {
      if (typeof window !== "undefined") {
        targetUrl = window.location.origin + targetUrl;
      } else {
        targetUrl = "https://careers.vyntyraconsultancyservices.in" + targetUrl;
      }
    }`;

if (regex.test(code)) {
  code = code.replace(regex, replacement);
  fs.writeFileSync(path, code);
  console.log('Fixed urlToBase64 in nocGenerator!');
} else {
  console.log('Could not find target in nocGenerator.');
}
