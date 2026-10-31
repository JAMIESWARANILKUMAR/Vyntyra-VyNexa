import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { EnterpriseDatasetRecord } from "./dataset-vault.functions";

export type ExportFormat = "xlsx" | "csv" | "pdf" | "txt";

export interface ExportOptions {
  filename?: string;
  format: ExportFormat;
  records: EnterpriseDatasetRecord[];
  category?: string;
  passwordProtected?: boolean;
  password?: string;
}

// ─── Web Crypto AES-256-GCM Encryption Helper ───────────────────────
async function encryptData(
  plainText: string,
  passcode: string
): Promise<{ cipherBase64: string; ivBase64: string; saltBase64: string }> {
  const enc = new TextEncoder();
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));

  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    enc.encode(passcode),
    { name: "PBKDF2" },
    false,
    ["deriveKey"]
  );

  const key = await crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt,
      iterations: 100000,
      hash: "SHA-256",
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt"]
  );

  const cipherBuffer = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    enc.encode(plainText)
  );

  const toB64 = (buf: Uint8Array) => {
    let binary = "";
    for (let i = 0; i < buf.byteLength; i++) {
      binary += String.fromCharCode(buf[i]);
    }
    return btoa(binary);
  };

  return {
    cipherBase64: toB64(new Uint8Array(cipherBuffer)),
    ivBase64: toB64(iv),
    saltBase64: toB64(salt),
  };
}

// ─── Build Self-Decrypting Secure HTML Container ───────────────────
function buildSecuredHtmlCapsule(options: {
  title: string;
  targetFilename: string;
  cipherBase64: string;
  ivBase64: string;
  saltBase64: string;
  category: string;
  recordCount: number;
  mimeType: string;
}): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Secured Dataset: ${options.title} | Vyntyra Vault</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      background: #090d16;
      color: #e2e8f0;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 1.5rem;
    }
    .card {
      background: #111827;
      border: 1px solid #1f2937;
      border-radius: 1rem;
      max-width: 480px;
      width: 100%;
      padding: 2.25rem;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.6);
      text-align: center;
    }
    .badge {
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
      padding: 0.25rem 0.75rem;
      border-radius: 9999px;
      font-size: 0.75rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      background: rgba(239, 68, 68, 0.15);
      color: #f87171;
      border: 1px solid rgba(239, 68, 68, 0.3);
      margin-bottom: 1.25rem;
    }
    .icon {
      width: 48px;
      height: 48px;
      margin: 0 auto 1.25rem;
      color: #38bdf8;
      background: rgba(56, 189, 248, 0.1);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 24px;
    }
    h1 {
      font-size: 1.35rem;
      font-weight: 700;
      color: #f8fafc;
      margin-bottom: 0.5rem;
    }
    p {
      font-size: 0.875rem;
      color: #94a3b8;
      line-height: 1.5;
      margin-bottom: 1.5rem;
    }
    .meta-box {
      background: #0f172a;
      border: 1px solid #1e293b;
      border-radius: 0.5rem;
      padding: 0.75rem 1rem;
      margin-bottom: 1.5rem;
      font-size: 0.8rem;
      text-align: left;
    }
    .meta-row {
      display: flex;
      justify-content: space-between;
      margin-bottom: 0.25rem;
    }
    .meta-label { color: #64748b; }
    .meta-val { color: #cbd5e1; font-weight: 600; }
    .input-group {
      margin-bottom: 1.25rem;
      text-align: left;
    }
    label {
      display: block;
      font-size: 0.75rem;
      font-weight: 600;
      color: #94a3b8;
      margin-bottom: 0.35rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    input[type="password"], input[type="text"] {
      width: 100%;
      padding: 0.75rem 1rem;
      background: #030712;
      border: 1px solid #374151;
      border-radius: 0.5rem;
      color: #fff;
      font-size: 0.95rem;
      outline: none;
      transition: border-color 0.2s;
    }
    input:focus { border-color: #38bdf8; }
    .btn {
      width: 100%;
      padding: 0.85rem 1.25rem;
      border: none;
      border-radius: 0.5rem;
      background: linear-gradient(135deg, #2563eb, #1d4ed8);
      color: #fff;
      font-size: 0.95rem;
      font-weight: 700;
      cursor: pointer;
      transition: all 0.2s;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
    }
    .btn:hover { background: linear-gradient(135deg, #1d4ed8, #1e40af); transform: translateY(-1px); }
    .error-msg {
      margin-top: 1rem;
      padding: 0.65rem;
      background: rgba(239, 68, 68, 0.15);
      border: 1px solid rgba(239, 68, 68, 0.3);
      border-radius: 0.375rem;
      color: #fca5a5;
      font-size: 0.8rem;
      display: none;
    }
    .success-box {
      display: none;
      margin-top: 1.25rem;
      padding: 1rem;
      background: rgba(16, 185, 129, 0.15);
      border: 1px solid rgba(16, 185, 129, 0.3);
      border-radius: 0.5rem;
      color: #6ee7b7;
      font-size: 0.875rem;
    }
    footer {
      margin-top: 1.75rem;
      font-size: 0.75rem;
      color: #64748b;
      border-top: 1px solid #1f2937;
      padding-top: 1rem;
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="badge">🔒 AES-256 Encrypted Container</div>
    <div class="icon">🛡️</div>
    <h1>Security Authentication Required</h1>
    <p>This dataset has been encrypted by Vyntyra Super Admin. Enter the allocated security password to decrypt and download.</p>
    
    <div class="meta-box">
      <div class="meta-row"><span class="meta-label">File Name:</span><span class="meta-val">${options.targetFilename}</span></div>
      <div class="meta-row"><span class="meta-label">Category:</span><span class="meta-val">${options.category.toUpperCase()}</span></div>
      <div class="meta-row"><span class="meta-label">Records:</span><span class="meta-val">${options.recordCount} rows</span></div>
      <div class="meta-row"><span class="meta-label">Security:</span><span class="meta-val">PBKDF2-SHA256 / AES-GCM</span></div>
    </div>

    <form id="unlockForm">
      <div class="input-group">
        <label for="passcode">File Passcode</label>
        <input type="password" id="passcode" placeholder="Enter assigned password..." required autocomplete="off" />
      </div>
      <button type="submit" class="btn" id="unlockBtn">
        <span>🔓 Decrypt & Download File</span>
      </button>
    </form>

    <div id="errorMsg" class="error-msg">Incorrect password. Please verify with your administrator.</div>
    <div id="successBox" class="success-box">✓ Passcode verified! Your decrypted file is downloading...</div>

    <footer>
      Vyntyra Consultancy Services · Enterprise Data Vault & Compliance
    </footer>
  </div>

  <script>
    const encryptedPayload = {
      cipher: "${options.cipherBase64}",
      iv: "${options.ivBase64}",
      salt: "${options.saltBase64}",
      filename: "${options.targetFilename}",
      mime: "${options.mimeType}"
    };

    function base64ToUint8(base64) {
      const bin = atob(base64);
      const bytes = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) {
        bytes[i] = bin.charCodeAt(i);
      }
      return bytes;
    }

    async function decryptFile(passcode) {
      const enc = new TextEncoder();
      const salt = base64ToUint8(encryptedPayload.salt);
      const iv = base64ToUint8(encryptedPayload.iv);
      const cipherBytes = base64ToUint8(encryptedPayload.cipher);

      const keyMaterial = await crypto.subtle.importKey(
        "raw",
        enc.encode(passcode),
        { name: "PBKDF2" },
        false,
        ["deriveKey"]
      );

      const key = await crypto.subtle.deriveKey(
        {
          name: "PBKDF2",
          salt: salt,
          iterations: 100000,
          hash: "SHA-256",
        },
        keyMaterial,
        { name: "AES-GCM", length: 256 },
        false,
        ["decrypt"]
      );

      return await crypto.subtle.decrypt(
        { name: "AES-GCM", iv: iv },
        key,
        cipherBytes
      );
    }

    document.getElementById("unlockForm").addEventListener("submit", async (e) => {
      e.preventDefault();
      const pass = document.getElementById("passcode").value;
      const errorMsg = document.getElementById("errorMsg");
      const successBox = document.getElementById("successBox");
      const btn = document.getElementById("unlockBtn");

      errorMsg.style.display = "none";
      btn.disabled = true;
      btn.innerText = "Verifying & Decrypting...";

      try {
        const decryptedBuffer = await decryptFile(pass);
        successBox.style.display = "block";
        
        // Trigger download
        const blob = new Blob([decryptedBuffer], { type: encryptedPayload.mime });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = encryptedPayload.filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        btn.innerText = "✓ File Downloaded";
      } catch (err) {
        console.error("Decryption error:", err);
        errorMsg.style.display = "block";
        btn.disabled = false;
        btn.innerText = "🔓 Decrypt & Download File";
      }
    });
  </script>
</body>
</html>`;
}

// ─── Main Export Dispatcher ─────────────────────────────────────────
export async function exportDataset(options: ExportOptions): Promise<void> {
  const { format, records, category = "dataset", passwordProtected = false, password = "" } = options;
  const baseName = options.filename || `Vyntyra_${category}_${new Date().toISOString().split("T")[0]}`;

  if (records.length === 0) {
    throw new Error("No records available to export.");
  }

  // 1. Generate Plain Content based on Format
  let plainContent: string | Blob = "";
  let finalFilename = "";
  let mimeType = "";

  if (format === "csv") {
    plainContent = generateCsvContent(records);
    finalFilename = `${baseName}.csv`;
    mimeType = "text/csv;charset=utf-8;";
  } else if (format === "xlsx") {
    plainContent = generateExcelXmlContent(records, category);
    finalFilename = `${baseName}.xlsx`;
    mimeType = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
  } else if (format === "txt") {
    plainContent = generateTxtContent(records, category);
    finalFilename = `${baseName}.txt`;
    mimeType = "text/plain;charset=utf-8;";
  } else if (format === "pdf") {
    const doc = generatePdfDocument(records, category, passwordProtected ? password : null);
    plainContent = doc.output("blob");
    finalFilename = `${baseName}.pdf`;
    mimeType = "application/pdf";
  }

  // 2. Handle Password-Protected Export
  if (passwordProtected && password?.trim()) {
    let rawText = "";
    if (typeof plainContent === "string") {
      rawText = plainContent;
    } else {
      // Convert Blob to Base64 or binary string
      const arrayBuffer = await plainContent.arrayBuffer();
      const bytes = new Uint8Array(arrayBuffer);
      let binary = "";
      for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i]);
      }
      rawText = binary;
    }

    const { cipherBase64, ivBase64, saltBase64 } = await encryptData(rawText, password.trim());
    const securedHtml = buildSecuredHtmlCapsule({
      title: baseName,
      targetFilename: finalFilename,
      cipherBase64,
      ivBase64,
      saltBase64,
      category,
      recordCount: records.length,
      mimeType,
    });

    // Trigger download of the secured capsule
    const capsuleBlob = new Blob([securedHtml], { type: "text/html;charset=utf-8;" });
    downloadBlob(capsuleBlob, `${finalFilename}.secured.html`);
    return;
  }

  // 3. Unprotected Direct Download
  if (typeof plainContent === "string") {
    const blob = new Blob([plainContent], { type: mimeType });
    downloadBlob(blob, finalFilename);
  } else {
    downloadBlob(plainContent, finalFilename);
  }
}

// ─── CSV Generator (RFC 4180 with UTF-8 BOM) ────────────────────────
export function generateCsvContent(records: EnterpriseDatasetRecord[]): string {
  // Collect all extra custom keys across records
  const extraKeysSet = new Set<string>();
  records.forEach((r) => {
    if (r.raw_attributes && typeof r.raw_attributes === "object") {
      Object.keys(r.raw_attributes).forEach((k) => extraKeysSet.add(k));
    }
  });
  const extraKeys = Array.from(extraKeysSet).slice(0, 15); // limit extra columns

  const standardHeaders = [
    "ID",
    "Category",
    "Name / Title",
    "City",
    "District",
    "State",
    "Country",
    "Industry",
    "Sector",
    "Role / Designation",
    "Contact Email",
    "Contact Phone",
    "Website",
    "Notes",
    "Created At",
  ];

  const headers = [...standardHeaders, ...extraKeys];

  const escapeCsv = (val: any) => {
    if (val === null || val === undefined) return '""';
    const str = String(val).replace(/"/g, '""');
    return `"${str}"`;
  };

  const rows: string[] = [];
  rows.push(headers.map(escapeCsv).join(","));

  for (const r of records) {
    const standardVals = [
      r.id,
      r.category,
      r.title,
      r.location_city || "",
      r.location_district || "",
      r.location_state || "",
      r.location_country || "India",
      r.industry || "",
      r.sector || "",
      r.role_designation || "",
      r.contact_email || "",
      r.contact_phone || "",
      r.website_url || "",
      r.notes || "",
      r.created_at ? new Date(r.created_at).toLocaleString() : "",
    ];

    const extraVals = extraKeys.map((k) => r.raw_attributes?.[k] ?? "");
    rows.push([...standardVals, ...extraVals].map(escapeCsv).join(","));
  }

  // Prepend UTF-8 BOM for flawless Excel decoding
  return "\uFEFF" + rows.join("\r\n");
}

// ─── Excel XML Spreadsheet Generator (Opens seamlessly in Excel) ────
export function generateExcelXmlContent(
  records: EnterpriseDatasetRecord[],
  categoryName: string
): string {
  const escapeXml = (str: any) => {
    if (str === null || str === undefined) return "";
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&apos;");
  };

  const headers = [
    "Entity Name / Title",
    "Category",
    "City",
    "District",
    "State",
    "Country",
    "Industry",
    "Sector",
    "Role / Designation",
    "Contact Email",
    "Contact Phone",
    "Website",
    "Notes",
    "Registered Date",
  ];

  const rowsXml = records
    .map((r) => {
      const vals = [
        r.title,
        r.category?.toUpperCase(),
        r.location_city || "-",
        r.location_district || "-",
        r.location_state || "-",
        r.location_country || "India",
        r.industry || "-",
        r.sector || "-",
        r.role_designation || "-",
        r.contact_email || "-",
        r.contact_phone || "-",
        r.website_url || "-",
        r.notes || "-",
        r.created_at ? new Date(r.created_at).toLocaleDateString() : "-",
      ];

      return `<Row>
        ${vals.map((v) => `<Cell><Data ss:Type="String">${escapeXml(v)}</Data></Cell>`).join("")}
      </Row>`;
    })
    .join("");

  return `<?xml version="1.0" encoding="UTF-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
  xmlns:o="urn:schemas-microsoft-com:office:office"
  xmlns:x="urn:schemas-microsoft-com:office:excel"
  xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"
  xmlns:html="http://www.w3.org/TR/REC-html40">
  <Styles>
    <Style ss:ID="Default" ss:Name="Normal">
      <Alignment ss:Vertical="Center"/>
      <Borders/>
      <Font ss:FontName="Calibri" x:Family="Swiss" ss:Size="11" ss:Color="#000000"/>
    </Style>
    <Style ss:ID="HeaderStyle">
      <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
      <Borders>
        <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#000000"/>
      </Borders>
      <Font ss:FontName="Calibri" x:Family="Swiss" ss:Size="11" ss:Color="#FFFFFF" ss:Bold="1"/>
      <Interior ss:Color="#1E3A8A" ss:Pattern="Solid"/>
    </Style>
  </Styles>
  <Worksheet ss:Name="${escapeXml(categoryName.substring(0, 30))}">
    <Table>
      <Row ss:Height="24">
        ${headers.map((h) => `<Cell ss:StyleID="HeaderStyle"><Data ss:Type="String">${escapeXml(h)}</Data></Cell>`).join("")}
      </Row>
      ${rowsXml}
    </Table>
  </Worksheet>
</Workbook>`;
}

// ─── TXT Tabular Report Generator ───────────────────────────────────
export function generateTxtContent(
  records: EnterpriseDatasetRecord[],
  categoryName: string
): string {
  const line = "=".repeat(120);
  const subLine = "-".repeat(120);
  const now = new Date().toLocaleString();

  let out = `${line}\n`;
  out += `  VYNTYRA CONSULTANCY SERVICES — ENTERPRISE DATASET VAULT\n`;
  out += `  Category: ${categoryName.toUpperCase()} | Generated: ${now} | Total Records: ${records.length}\n`;
  out += `${line}\n\n`;

  records.forEach((r, idx) => {
    out += `[#${idx + 1}] ${r.title.toUpperCase()}\n`;
    out += `    Category : ${r.category} | Country: ${r.location_country || "India"}\n`;
    out += `    Location : ${[r.location_city, r.location_district, r.location_state].filter(Boolean).join(", ") || "N/A"}\n`;
    out += `    Domain   : Industry: ${r.industry || "N/A"} | Sector: ${r.sector || "N/A"} | Role: ${r.role_designation || "N/A"}\n`;
    out += `    Contact  : Email: ${r.contact_email || "N/A"} | Phone: ${r.contact_phone || "N/A"}\n`;
    if (r.website_url) out += `    Website  : ${r.website_url}\n`;
    if (r.notes) out += `    Notes    : ${r.notes}\n`;

    if (r.raw_attributes && Object.keys(r.raw_attributes).length > 0) {
      const extra = Object.entries(r.raw_attributes)
        .slice(0, 6)
        .map(([k, v]) => `${k}: ${v}`)
        .join(" | ");
      out += `    Custom   : ${extra}\n`;
    }
    out += `${subLine}\n`;
  });

  out += `\n${line}\n`;
  out += `  CONFIDENTIAL DOCUMENT — For Authorized Personnel & Super Admin Only\n`;
  out += `${line}\n`;

  return out;
}

// ─── PDF Document Generator (Using jsPDF & autoTable) ───────────────
export function generatePdfDocument(
  records: EnterpriseDatasetRecord[],
  categoryName: string,
  passcodeHint: string | null
): jsPDF {
  const doc = new jsPDF({
    orientation: "landscape",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const now = new Date().toLocaleString();

  // Header Banner
  doc.setFillColor(30, 58, 138); // Dark Navy Blue
  doc.rect(0, 0, pageWidth, 24, "F");

  doc.setFont("helvetica", "bold");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.text("VYNTYRA CONSULTANCY SERVICES", 14, 11);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(203, 213, 225);
  doc.text("Enterprise Technology, AI Solutions & Academic Relations", 14, 18);

  // Security Tag Right
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(254, 202, 202);
  doc.text("RESTRICTED & CONFIDENTIAL", pageWidth - 14, 11, { align: "right" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(226, 232, 240);
  doc.text(`Generated: ${now}`, pageWidth - 14, 18, { align: "right" });

  // Sub-header Info
  doc.setTextColor(30, 41, 59);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text(`Enterprise Dataset Export — ${categoryName.toUpperCase()}`, 14, 32);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  doc.text(
    `Total Records: ${records.length} | Export Mode: High-Fidelity Audit Report`,
    14,
    37
  );

  if (passcodeHint) {
    doc.setFillColor(254, 242, 242);
    doc.setDrawColor(239, 68, 68);
    doc.roundedRect(pageWidth - 90, 26, 76, 13, 2, 2, "FD");
    doc.setTextColor(185, 28, 28);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.text("🔒 ACCESS PROTECTED REPORT", pageWidth - 86, 31);
    doc.setFontSize(7.5);
    doc.setFont("helvetica", "normal");
    doc.text(`Authorized Passcode Encrypted`, pageWidth - 86, 36);
  }

  // Format table data
  const headers = [
    "#",
    "Entity Name / Title",
    "Category",
    "Location",
    "Industry / Domain",
    "Role / Position",
    "Contact Details",
    "Notes / Extra",
  ];

  const bodyData = records.map((r, i) => {
    const loc = [r.location_city, r.location_district, r.location_state]
      .filter(Boolean)
      .join(", ") || "-";
    const domain = [r.industry, r.sector].filter(Boolean).join(" · ") || "-";
    const contact = [r.contact_email, r.contact_phone].filter(Boolean).join("\n") || "-";
    const notes = r.notes || (r.raw_attributes ? Object.entries(r.raw_attributes).slice(0, 2).map(([k, v]) => `${k}:${v}`).join(" | ") : "-");

    return [
      String(i + 1),
      r.title || "-",
      r.category?.toUpperCase() || "-",
      loc,
      domain,
      r.role_designation || "-",
      contact,
      notes,
    ];
  });

  autoTable(doc, {
    head: [headers],
    body: bodyData,
    startY: 42,
    margin: { left: 14, right: 14, bottom: 18 },
    styles: {
      fontSize: 8,
      cellPadding: 2.5,
      textColor: [30, 41, 59],
      lineColor: [226, 232, 240],
      lineWidth: 0.1,
      overflow: "linebreak",
    },
    headStyles: {
      fillColor: [30, 58, 138],
      textColor: [255, 255, 255],
      fontStyle: "bold",
      fontSize: 8.5,
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    columnStyles: {
      0: { cellWidth: 10, halign: "center" },
      1: { cellWidth: 50, fontStyle: "bold" },
      2: { cellWidth: 22 },
      3: { cellWidth: 40 },
      4: { cellWidth: 35 },
      5: { cellWidth: 32 },
      6: { cellWidth: 42 },
      7: { cellWidth: "auto" },
    },
    didDrawPage: (data) => {
      // Footer
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      doc.text(
        "Vyntyra Enterprise Dataset Vault · Proprietary & Confidential",
        14,
        pageHeight - 8
      );
      const pageStr = `Page ${data.pageNumber}`;
      doc.text(pageStr, pageWidth - 14, pageHeight - 8, { align: "right" });
    },
  });

  return doc;
}

// ─── Browser Download Helper ────────────────────────────────────────
function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
