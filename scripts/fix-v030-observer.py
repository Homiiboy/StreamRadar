from pathlib import Path
p = Path('js/desktop.js')
s = p.read_text(encoding='utf-8')
old = """  function installSettingsObserver() {\n    const observer = new MutationObserver(() => ensureUpdateCenter());\n    observer.observe(document.body, { childList:true, subtree:true });\n    ensureUpdateCenter();\n  }\n"""
new = """  function installSettingsObserver() {\n    const observer = new MutationObserver(() => {\n      const settingsReady = Boolean(document.querySelector('.settings-center'));\n      const updateCenterMissing = !document.querySelector('#settingsUpdateTab') || !document.querySelector('#settingsUpdatePage');\n      if (settingsReady && updateCenterMissing) ensureUpdateCenter();\n    });\n    observer.observe(document.body, { childList:true, subtree:true });\n    ensureUpdateCenter();\n  }\n"""
if old not in s:
    if new in s:
        raise SystemExit(0)
    raise SystemExit('observer marker not found')
p.write_text(s.replace(old, new, 1), encoding='utf-8', newline='\n')
