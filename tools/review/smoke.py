#!/usr/bin/env python3
"""Reviewer smoke test: headless Chromium (SwiftShader) play-through of Adventure + Arcade.

Setup (once):  pip install playwright && python3 -m playwright install chromium
               mkdir -p /tmp/three && cd /tmp/three && npm i three@0.186   (the jsdelivr CDN is often blocked; we serve it locally)
Run:           (cd <worktree> && python3 -m http.server 8766 &)   then   python3 tools/review/smoke.py [port] [three_dir]

Headless runs ~20x slower than a real GPU (game time crawls), so waits are long and
draw-call numbers read a little high. Prints stats per stage and every console error.
Screenshots land in /tmp/smoke_*.png.
"""
import asyncio, sys
from playwright.async_api import async_playwright

PORT = sys.argv[1] if len(sys.argv) > 1 else '8766'
THREE = (sys.argv[2] if len(sys.argv) > 2 else '/tmp/three') + '/node_modules/three/'
URL = f'http://localhost:{PORT}/?q=high'

async def page(b, errs, mode):
    pg = await b.new_page(viewport={'width': 1600, 'height': 900})
    pg.on('pageerror', lambda e: errs.append(f'{mode} pageerror: {str(e)[:300]}'))
    pg.on('console', lambda m: errs.append(f'{mode} {m.type}: {m.text[:200]}')
          if m.type in ('error', 'warning') and '404' not in m.text and 'GL Driver' not in m.text else None)
    async def jsd(route):
        rel = route.request.url.split('/npm/three@')[1].split('/', 1)[1].split('?')[0]
        await route.fulfill(path=THREE + rel, content_type='application/javascript')
    await pg.route('**/cdn.jsdelivr.net/npm/three@*/**', jsd)
    await pg.route('**/fonts.googleapis.com/**', lambda r: r.fulfill(body='', content_type='text/css'))
    await pg.goto(f'{URL}&{mode}'); await pg.wait_for_timeout(9000)
    await pg.keyboard.press('Space'); await pg.wait_for_timeout(500)
    await pg.keyboard.press('Enter'); await pg.wait_for_timeout(7000)   # both players join
    return pg

async def until(pg, expr, secs=80):
    for _ in range(secs // 2):
        if await pg.evaluate(expr): return True
        await pg.wait_for_timeout(2000)
    return False

async def main():
    errs = []
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--use-gl=swiftshader', '--enable-unsafe-swiftshader'])
        E = None
        # ---- Adventure: Hank's quest, hammer, save, garage after chapter 1
        pg = await page(b, errs, 'adventure'); E = pg.evaluate
        await pg.screenshot(path='/tmp/smoke_adv_start.png')
        print('quests', await E("QUEST_LIST.map(q=>q.id).join(',')"), '| calls', await E("__sp.stats().calls"))
        print('hammer before', await E("hasAbility('hammer')"))
        await E("(()=>{const g=questGivers.hank;__sp.tp(g.x,g.z+g.r+players[0].r-0.03);players[0].heading=Math.PI;})()")
        await pg.keyboard.down('KeyW'); await pg.wait_for_timeout(1500); await pg.keyboard.up('KeyW')
        print('quest started', await until(pg, "!!questA"))
        await E("__sp.quest('hank_lunchbox',true)"); await pg.wait_for_timeout(6000)
        print('hammer after', await E("hasAbility('hammer')"), '| saved', await E("!!localStorage.getItem('sp_adv')"))
        await E("__sp.level(2)"); await pg.wait_for_timeout(4000); await pg.keyboard.press('KeyQ')
        print('garage rises', await until(pg, "!!garage"))
        await pg.screenshot(path='/tmp/smoke_adv_garage.png')
        await pg.close()
        # ---- Arcade: garage in/out, GIANT, boss, bedroom
        pg = await page(b, errs, 'arcade'); E = pg.evaluate
        print('arcade start calls', await E("__sp.stats().calls"))
        await E("__sp.level(1)"); await pg.wait_for_timeout(3000); await E("__sp.level(1)")
        print('garage', await until(pg, "!!garage"))
        await E("__sp.garageIn()"); await pg.wait_for_timeout(6000)
        await pg.screenshot(path='/tmp/smoke_garage_in.png')
        print('inside', (await E("JSON.stringify(__sp.garageInfo())"))[:160])
        await E("__sp.garageGo()"); await until(pg, "!garage||garage.phase==='sink'")
        await E("__sp.level(5,true)"); await pg.wait_for_timeout(15000)
        print('giant', await E("JSON.stringify(__sp.stats())"))
        await E("__sp.boss()"); await pg.wait_for_timeout(20000)
        print('boss', await E("JSON.stringify(__sp.stats())"))
        await pg.screenshot(path='/tmp/smoke_boss.png')
        await E("__sp.room()"); await pg.wait_for_timeout(10000)
        print('bedroom', await E("JSON.stringify(__sp.stats())"))
        await b.close()
    print('ERRORS' if errs else 'no console errors', errs[:15])

asyncio.run(main())
