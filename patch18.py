import io
import re

ops_file = "src/lib/operations.functions.ts"
with io.open(ops_file, "r", encoding="utf-8") as f:
    ops_content = f.read()

pattern = r"html: <p>Hi \$\{internProfile\.full_name \|\| 'Intern'\},</p>\s*<p>Your task deliverable for <strong>\$\{updatedTaskTitle\}</strong> has been submitted successfully\.</p>\s*<p>Deliverable URL: <a href=\"\$\{url\}\">\$\{url\}</a></p>\s*<p>It is now queued for mentor review\.</p>"

replacement = \"\"\"html: <p>Hi ,</p>
          <p>Your task deliverable for <strong></strong> has been submitted successfully.</p>
          <p>Deliverable URL: <a href=""></a></p>
          <p>It is now queued for mentor review.</p>
          <br><p>Best,</p><p><strong>Jamieswaran Ilkumar</strong><br>Founder & CEO<br>Vyntyra Consultancy Services</p><p><img src="/signature.png" alt="Founder Signature" style="max-width: 150px;" /></p>\"\"\"

ops_content = re.sub(pattern, replacement, ops_content)

with io.open(ops_file, "w", encoding="utf-8", newline="\n") as f:
    f.write(ops_content)

print("Patched operations.functions.ts submitTaskUrl signature")