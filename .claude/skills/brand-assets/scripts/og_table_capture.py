import sys, json
from playwright.sync_api import sync_playwright
out = sys.argv[1]
# six rows per tool, all taken verbatim from that page's own table (alternatives/_data/competitors.ts)
PAGES = {
    'asf': ('archisteamfarm', ['Automated Card Farming', 'QR Code Sign-In', 'Achievement Manager',
                               'Automated Achievement Unlocker', 'Inventory Manager', 'Automatic Free Game Claiming']),
    'im': ('idle-master', ['Automated Card Farming', 'No Local Steam Client Required', 'Multiple Account Support',
                           'Achievement Manager', 'Inventory Manager', 'Automatic Free Game Claiming']),
    'sam': ('steam-achievement-manager', ['Achievement Manager', 'No Local Steam Client Required', 'Automated Card Farming',
                                          'Automated Achievement Unlocker', 'Playtime Boosting', 'Automatic Free Game Claiming']),
}
with sync_playwright() as p:
    b = p.chromium.launch()
    pg = b.new_page(viewport={'width': 1440, 'height': 1400}, device_scale_factor=2)
    for key, (slug, rows) in PAGES.items():
        pg.goto(f'http://localhost:3001/alternatives/{slug}', wait_until='networkidle', timeout=120000)
        t = pg.locator('.cmp').first
        t.scroll_into_view_if_needed(); pg.wait_for_timeout(1500)
        missing = t.evaluate('''(el, rows) => {
            const body = [...el.querySelectorAll('.cmp__row')].filter(r => !r.classList.contains('cmp__row--head'))
            const byName = Object.fromEntries(body.map(r => [r.querySelector('.cmp__feature').textContent.trim(), r]))
            body.forEach(r => r.remove())
            const miss = rows.filter(n => !byName[n])
            rows.forEach(n => byName[n] && el.appendChild(byName[n]))
            // settle any reveal animation so the capture is the final state
            let n = el; while (n) { n.style.opacity = '1'; n.style.transform = 'none'; n = n.parentElement; if (n === document.body) break }
            return miss
        }''', rows)
        if missing: raise SystemExit(f'{key}: rows not found {missing}')
        pg.wait_for_timeout(300)
        t.screenshot(path=f'{out}/table_{key}.png', omit_background=True)
        print('captured', key)
    b.close()
