
import io
import re

ops_file = "src/lib/operations.functions.ts"
with io.open(ops_file, "r", encoding="utf-8") as f:
    ops_content = f.read()

# We want to replace the html of the intern email.
pattern = r"html: `<p>Hi \$\{profileData\.full_name \|\| \"Intern\"\},</p><p>Your submission for the task \"<strong>\$\{taskData\.title\}</strong>\" has been successfully received\.</p><p>Our operations team will review it shortly\.</p><p>Best,<br>Vyntyra Team</p>`"

replacement = """html: `<p>Hi ${profileData.full_name || "Intern"},</p><p>Your submission for the task "<strong>${taskData.title}</strong>" has been successfully received.</p><p>Our operations team will review it shortly.</p><p>Best,</p><p><strong>Jamieswaran Ilkumar</strong><br>Founder & CEO<br>Vyntyra Consultancy Services</p><p><img src="${process.env.VITE_APP_URL || "https://portal.vyntyraconsultancyservices.in"}/signature.png" alt="Founder Signature" style="max-width: 150px;" /></p>`"""

ops_content = re.sub(pattern, replacement, ops_content)

with io.open(ops_file, "w", encoding="utf-8", newline="\n") as f:
    f.write(ops_content)

print("Patched operations.functions.ts with signature")
