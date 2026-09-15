
import io

ops_file = "src/lib/operations.functions.ts"
with io.open(ops_file, "r", encoding="utf-8") as f:
    ops_content = f.read()

import re

# We will just find the block from `if (data.status === "submitted") {` to `return { success: true };\n  });`
# and replace it.

old_block = """    if (data.status === "submitted") {
      try {
        const { data: taskData } = await adminClient.from("tasks").select("title, assigned_to").eq("id", data.id).single();
        if (taskData?.assigned_to) {
          const { data: profileData } = await adminClient.from("profiles").select("email, full_name, mentor_id").eq("id", taskData.assigned_to).single();
          if (profileData?.email) {
             const { Resend } = await import("resend");
             const apiKey = process.env.RESEND_API_KEY;
             if (apiKey) {
               const resend = new Resend(apiKey);
               
               // Notify Intern
               await resend.emails.send({
                 from: "Vyntyra Careers <careers@vyntyraconsultancyservices.in>",
                 to: profileData.email,
                 subject: Task Submitted Successfully: ,
                 html: <p>Hi ,</p><p>Your submission for the task "<strong></strong>" has been successfully received.</p><p>Our operations team will review it shortly.</p><p>Best,<br>Vyntyra Team</p>
               });
               
               let notifyEmails = ["hr@vyntyraconsultancyservices.in"];
               if (profileData.mentor_id) {
                 const { data: mentorData } = await adminClient.from("profiles").select("email").eq("id", profileData.mentor_id).single();
                 if (mentorData?.email && mentorData.email !== "hr@vyntyraconsultancyservices.in") {
                   notifyEmails.push(mentorData.email);
                 }
               }
               
               // Notify Admin/Mentor
               await resend.emails.send({
                 from: "Vyntyra System <careers@vyntyraconsultancyservices.in>",
                 to: notifyEmails,
                 subject: New Task Submission from ,
                 html: <p>Admin,</p><p>Intern <strong>Unknown</strong> has submitted the task "<strong></strong>".</p><p>Please review it in the Admin portal.</p>
               });
             }
          }
        }
      } catch (e) {
        console.warn("Failed to send submission emails:", e);
      }
    }

    return { success: true };
  });"""

new_block = """    if (data.status === "submitted") {
      try {
        const { data: taskData } = await adminClient.from("tasks").select("title, assigned_to").eq("id", data.id).single();
        if (taskData?.assigned_to) {
          const { data: profileData } = await adminClient.from("profiles").select("email, full_name, mentor_id").eq("id", taskData.assigned_to).single();
          if (profileData?.email) {
             const { Resend } = await import("resend");
             const apiKey = process.env.RESEND_API_KEY;
             if (apiKey) {
               const resend = new Resend(apiKey);
               
               // Notify Intern
               await resend.emails.send({
                 from: "Vyntyra Careers <careers@vyntyraconsultancyservices.in>",
                 to: profileData.email,
                 subject: `Task Submitted Successfully: ${taskData.title}`,
                 html: `<p>Hi ${profileData.full_name || "Intern"},</p><p>Your submission for the task "<strong>${taskData.title}</strong>" has been successfully received.</p><p>Our operations team will review it shortly.</p><p>Best,<br>Vyntyra Team</p>`
               });
               
               let notifyEmails = ["hr@vyntyraconsultancyservices.in"];
               if (profileData.mentor_id) {
                 const { data: mentorData } = await adminClient.from("profiles").select("email").eq("id", profileData.mentor_id).single();
                 if (mentorData?.email && mentorData.email !== "hr@vyntyraconsultancyservices.in") {
                   notifyEmails.push(mentorData.email);
                 }
               }
               
               // Notify Admin/Mentor
               await resend.emails.send({
                 from: "Vyntyra System <careers@vyntyraconsultancyservices.in>",
                 to: notifyEmails,
                 subject: `New Task Submission from ${profileData.full_name}`,
                 html: `<p>Admin,</p><p>Intern <strong>${profileData.full_name || "Unknown"}</strong> has submitted the task "<strong>${taskData.title}</strong>".</p><p>Please review it in the Admin portal.</p>`
               });
             }
          }
        }
      } catch (e) {
        console.warn("Failed to send submission emails:", e);
      }
    }

    return { success: true };
  });"""

ops_content = ops_content.replace(old_block, new_block)

with io.open(ops_file, "w", encoding="utf-8", newline="\n") as f:
    f.write(ops_content)

print("Patched operations.functions.ts")
