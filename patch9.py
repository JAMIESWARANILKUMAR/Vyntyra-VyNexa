import io

def patch_file(path, replacements):
    with io.open(path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    for old, new in replacements:
        content = content.replace(old, new)
        
    with io.open(path, 'w', encoding='utf-8', newline='\n') as f:
        f.write(content)

replacements = [
    (
        "className={\x0clex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer h-auto }",
        "className={lex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer h-auto }"
    ),
    (
        "className={px-2 py-0.5 rounded-full text-[10px] font-bold }",
        "className={px-2 py-0.5 rounded-full text-[10px] font-bold }"
    )
]

patch_file('src/components/admin-intern-tasks-view.tsx', replacements)