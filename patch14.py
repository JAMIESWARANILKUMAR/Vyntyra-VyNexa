import io

intern_file = 'src/routes/_authenticated/intern.tsx'
with io.open(intern_file, 'r', encoding='utf-8') as f:
    intern_content = f.read()

old_toast = """            toast.success("Task workspace saved and updated!");"""
new_toast = """            if (selectedTaskWorkspace.status === "submitted") {
              toast.success("Task submitted successfully!");
            } else {
              toast.success("Task workspace saved and updated!");
            }"""

intern_content = intern_content.replace(old_toast, new_toast)

with io.open(intern_file, 'w', encoding='utf-8', newline='\n') as f:
    f.write(intern_content)

print("Patched intern.tsx")