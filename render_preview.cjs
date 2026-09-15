const fs = require('fs');
const { createCanvas } = require('canvas');

// Try to render a visual mock using canvas
const W = 595, H = 842;
const canvas = createCanvas(W, H);
const ctx = canvas.getContext('2d');

// White background
ctx.fillStyle = '#ffffff';
ctx.fillRect(0, 0, W, H);

// ── HEADER BARS ─────────────────────────────────────────────
ctx.fillStyle = '#0f172a';
ctx.fillRect(0, 0, W, 18);
ctx.fillStyle = '#b48c28';
ctx.fillRect(0, 18, W, 4);

// ── COMPANY NAME ────────────────────────────────────────────
ctx.fillStyle = '#0f172a';
ctx.font = 'bold 32px sans-serif';
ctx.fillText('VYNTYRA', 108, 75);
ctx.fillStyle = '#b48c28';
ctx.font = '12px sans-serif';
ctx.fillText('CONSULTANCY SERVICES', 108, 93);

// ── ADDRESS ─────────────────────────────────────────────────
ctx.fillStyle = '#475569';
ctx.font = '10px sans-serif';
ctx.textAlign = 'right';
ctx.fillText('Dwaraka Nagar, Dwaraka Plaza', W - 25, 65);
ctx.fillText('Visakhapatnam, AP, India - 530016', W - 25, 79);
ctx.fillText('Email: careers@vyntyraconsultancyservices.in', W - 25, 93);
ctx.textAlign = 'left';

// ── REF/DATE PILL ───────────────────────────────────────────
ctx.fillStyle = '#f8fafc';
roundRect(ctx, 50, 145, 495, 34, 6);
ctx.fill();
ctx.fillStyle = '#1e293b';
ctx.font = 'bold 11px sans-serif';
ctx.fillText('Ref: VCS/OL/2026/APP12345', 64, 167);
ctx.font = '11px sans-serif';
ctx.textAlign = 'right';
ctx.fillText('Date: September 13, 2026', W - 55, 167);
ctx.textAlign = 'left';

// ── DOCUMENT TITLE ──────────────────────────────────────────
ctx.fillStyle = '#0f172a';
ctx.font = 'bold 18px sans-serif';
ctx.textAlign = 'center';
ctx.letterSpacing = '2px';
ctx.fillText('LETTER OF OFFER & APPOINTMENT', W / 2, 215);
// Gold underline
ctx.strokeStyle = '#b48c28';
ctx.lineWidth = 2;
ctx.beginPath();
ctx.moveTo(215, 222);
ctx.lineTo(380, 222);
ctx.stroke();
ctx.textAlign = 'left';

// ── RECIPIENT ───────────────────────────────────────────────
ctx.fillStyle = '#1e293b';
ctx.font = 'bold 13px sans-serif';
ctx.fillText('TO: Guntu Leesha', 50, 255);

// ── INTRO TEXT ──────────────────────────────────────────────
ctx.fillStyle = '#475569';
ctx.font = '11px sans-serif';
const intro = wrapText(ctx, 'We are delighted to extend this formal offer of appointment for the position of Internship — Engineering & Technology at Vyntyra Consultancy Services. Following your outstanding performance in our recruitment and interview rounds, we are confident that you will bring significant value, expertise, and innovative thinking to our organization.', 50, 275, 495, 16);

// ── JOB DETAILS TABLE ───────────────────────────────────────
const tableY = 275 + (intro * 16) + 12;
const rowH = 28;
const rows = [
  ['Position / Title', 'Internship — Engineering & Technology'],
  ['Domain', 'Engineering & Technology'],
  ['Sub-domain', 'MERN Stack (MongoDB, Express, React, Node.js)'],
  ['Total Compensation', 'N/A'],
  ['Start Date', 'August 15, 2026'],
  ['End Date', 'November 15, 2026'],
  ['Job Location', 'Visakhapatnam / Remote'],
];

rows.forEach(([label, val], i) => {
  const y = tableY + i * rowH;
  if (i % 2 === 0) {
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(50, y, 495, rowH);
  }
  ctx.fillStyle = '#1e293b';
  ctx.font = 'bold 10.5px sans-serif';
  ctx.fillText(label, 64, y + 18);
  ctx.fillStyle = '#475569';
  ctx.font = '10.5px sans-serif';
  ctx.fillText(val, 210, y + 18);
});

// Table border
ctx.strokeStyle = '#cbd5e1';
ctx.lineWidth = 0.8;
roundRect(ctx, 50, tableY, 495, rows.length * rowH, 5);
ctx.stroke();

// ── TERMS ───────────────────────────────────────────────────
const termsY = tableY + rows.length * rowH + 20;
ctx.fillStyle = '#475569';
ctx.font = '10px sans-serif';
const t1rows = wrapText(ctx, 'This offer is subject to verification of your professional credentials and references. On your day of joining, please submit self-attested copies of your academic records, experience certificates, identity proof, and address proof for administrative filing.', 50, termsY, 495, 14);
const t2Y = termsY + t1rows * 14 + 6;
const t2rows = wrapText(ctx, 'Please note that the code of conduct, non-disclosure policies, and terms of service of the company will be detailed in your employment contract, which will be executed on your joining date.', 50, t2Y, 495, 14);
const siY = t2Y + t2rows * 14 + 6;
const siRows = wrapText(ctx, 'Kindly confirm your acceptance by signing this letter and returning a scanned copy within 7 business days, failing which this offer shall automatically expire.', 50, siY, 495, 14);

// ── SIGNATURE ───────────────────────────────────────────────
const sigY = siY + siRows * 14 + 18;
ctx.fillStyle = '#0f172a';
ctx.font = 'bold 10.5px sans-serif';
ctx.fillText('For Vyntyra Consultancy Services,', 50, sigY);
ctx.fillText('Jami Eswar Anil Kumar', 50, sigY + 38);
ctx.fillStyle = '#475569';
ctx.font = '10px sans-serif';
ctx.fillText('Founder & Managing Director', 50, sigY + 52);
ctx.strokeStyle = '#cbd5e1';
ctx.lineWidth = 0.5;
ctx.beginPath();
ctx.moveTo(50, sigY + 58);
ctx.lineTo(180, sigY + 58);
ctx.stroke();
ctx.fillStyle = '#475569';
ctx.fillText('Authorized Signatory', 50, sigY + 70);

ctx.fillStyle = '#0f172a';
ctx.font = 'bold 10.5px sans-serif';
ctx.fillText('Accepted and Agreed By:', 340, sigY);
ctx.strokeStyle = '#cbd5e1';
ctx.beginPath();
ctx.moveTo(340, sigY + 38);
ctx.lineTo(535, sigY + 38);
ctx.stroke();
ctx.fillStyle = '#475569';
ctx.font = '10px sans-serif';
ctx.fillText('Candidate Signature & Date', 340, sigY + 50);

// ── FOOTER ──────────────────────────────────────────────────
ctx.fillStyle = '#0f172a';
ctx.fillRect(0, H - 28, W, 28);
ctx.fillStyle = '#cbd5e1';
ctx.font = '9px sans-serif';
ctx.textAlign = 'center';
ctx.fillText('Confidential | Vyntyra Consultancy Services (C) 2026. All rights reserved.', W / 2, H - 10);
ctx.textAlign = 'left';

// ── Save ────────────────────────────────────────────────────
const out = canvas.toBuffer('image/png');
fs.writeFileSync('C:/Users/Jamia/.gemini/antigravity/brain/68f9bade-1b92-4817-b487-ba92da67c55e/offer_letter_preview.png', out);
console.log('Done!');

function wrapText(ctx, text, x, y, maxWidth, lineHeight) {
  const words = text.split(' ');
  let line = '';
  let rowCount = 0;
  for (let n = 0; n < words.length; n++) {
    const testLine = line + words[n] + ' ';
    const metrics = ctx.measureText(testLine);
    if (metrics.width > maxWidth && n > 0) {
      ctx.fillText(line, x, y + rowCount * lineHeight);
      line = words[n] + ' ';
      rowCount++;
    } else {
      line = testLine;
    }
  }
  ctx.fillText(line, x, y + rowCount * lineHeight);
  return rowCount + 1;
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}
