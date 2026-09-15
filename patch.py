import io
import sys

def patch_file(path, replacements):
    with io.open(path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    for old, new in replacements:
        if old not in content:
            print(f"Warning: could not find text to replace in {path}")
        content = content.replace(old, new)
        
    with io.open(path, 'w', encoding='utf-8', newline='\n') as f:
        f.write(content)
    print(f"Patched {path}")

intern_replacements = [
    (
        '<nav className="hidden 2xl:flex items-center gap-1 overflow-x-auto py-1 scrollbar-none max-w-[50%] bg-orange-50/90 border border-orange-200/80 rounded-2xl px-2">',
        '<nav className="hidden 2xl:flex items-center gap-1 overflow-x-auto py-1 scrollbar-none max-w-[50%] flex-1 min-w-0 bg-orange-50/90 border border-orange-200/80 rounded-2xl px-2">'
    ),
    (
        '<div className="flex items-center gap-1.5 sm:gap-2.5 overflow-x-auto no-scrollbar pb-1 sm:pb-0">',
        '<div className="flex items-center justify-end gap-1.5 sm:gap-2.5 overflow-x-auto no-scrollbar shrink min-w-0 pb-1 sm:pb-0">'
    ),
    (
        '<div className="rounded-2xl border border-orange-200/80 overflow-hidden shadow-xs">\n                <table className="w-full text-left border-collapse text-xs">',
        '<div className="rounded-2xl border border-orange-200/80 overflow-x-auto shadow-xs">\n                <table className="w-full text-left border-collapse text-xs min-w-[500px]">'
    ),
    (
        '<div className="border rounded-xl overflow-hidden bg-white dark:bg-slate-900 mt-2">\n                      <table className="w-full text-xs text-left">',
        '<div className="border rounded-xl overflow-x-auto bg-white dark:bg-slate-900 mt-2">\n                      <table className="w-full text-xs text-left min-w-[400px]">'
    ),
    (
        'className="p-6 hover:bg-orange-100/40 transition-colors flex items-center justify-between gap-4"',
        'className="p-6 hover:bg-orange-100/40 transition-colors flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"'
    ),
    (
        '<div className="flex flex-col items-end gap-2 shrink-0 md:pl-4">',
        '<div className="flex flex-col items-start sm:items-end gap-2 shrink-0 md:pl-4">'
    )
]

patch_file('src/routes/_authenticated/intern.tsx', intern_replacements)