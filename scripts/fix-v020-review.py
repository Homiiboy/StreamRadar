from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

ui_path = ROOT / 'ui.js'
ui = ui_path.read_text(encoding='utf-8')

old = "      config = { ...defaultConfig, ...data.personalization };\n      localStorage.setItem(CONFIG_KEY, JSON.stringify(config));"
new = "      localStorage.setItem(CONFIG_KEY, JSON.stringify({ ...defaultConfig, ...data.personalization }));\n      config = loadConfig();"
if old not in ui:
    raise SystemExit('backup normalization target not found')
ui = ui.replace(old, new, 1)

old = "      const selectedProviders = $$('#onboardingProviderGrid input:checked').map(input => input.value); if (selectedProviders.length) setProviders(selectedProviders,false);"
new = "      const selectedProviders = $$('#onboardingProviderGrid input:checked').map(input => input.value); setProviders(selectedProviders,false);"
if old not in ui:
    raise SystemExit('onboarding provider target not found')
ui = ui.replace(old, new, 1)

old = "    if (target && target !== state.view) { state.view = target; renderReleases(); }"
new = "    if (target && target !== state.view) baseSetView(target);"
if old not in ui:
    raise SystemExit('startup view target not found')
ui = ui.replace(old, new, 1)
ui_path.write_text(ui.rstrip() + '\n', encoding='utf-8')

readme_path = ROOT / 'README.md'
readme = readme_path.read_text(encoding='utf-8')
readme = readme.replace('│   ├── StreamRadar_0.1.1_x64_de-DE.msi\n│   └── StreamRadar_0.2.0_x64_de-DE.msi', '│   ├── StreamRadar_0.1.1_x64_de-DE.msi\n│   ├── StreamRadar_0.1.2_x64_de-DE.msi\n│   └── StreamRadar_0.2.0_x64_de-DE.msi')
readme = readme.replace('Für v0.1.3 und spätere Releases gilt:', 'Für v0.2.1 und spätere Releases gilt:')
readme_path.write_text(readme.rstrip() + '\n', encoding='utf-8')

print('Applied v0.2.0 self-review fixes.')
