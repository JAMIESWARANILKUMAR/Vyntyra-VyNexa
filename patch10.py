import io

def patch_file(path, replacements):
    with io.open(path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    for old, new in replacements:
        if old not in content:
            print(f"Warning: could not find text to replace in {path}\n'{old[:50]}...'")
        else:
            content = content.replace(old, new)
            print("Successfully replaced.")
        
    with io.open(path, 'w', encoding='utf-8', newline='\n') as f:
        f.write(content)

bad_outer_button = """        <button
          type="button"
          onClick={() => setActiveViewTab("stored_bank")}
          className={lex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer }
        >"""

replacements = [
    (bad_outer_button, "")
]

patch_file('src/components/admin-intern-tasks-view.tsx', replacements)