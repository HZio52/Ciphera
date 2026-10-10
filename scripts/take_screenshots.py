"""
Automated screenshot generator using Chrome DevTools Protocol (CDP) and websockets.
Captures pixel-perfect screenshots of Ciphera at 1920x1080 and 1440x900 resolutions.
"""

import asyncio
import base64
import json
from pathlib import Path
import urllib.request
import websockets

SCREENSHOT_DIR = Path("docs/screenshots")
SCREENSHOT_DIR.mkdir(parents=True, exist_ok=True)


async def send_cmd(ws, method, params=None, msg_id=1):
    req = {"id": msg_id, "method": method, "params": params or {}}
    await ws.send(json.dumps(req))
    while True:
        resp = await ws.recv()
        data = json.loads(resp)
        if data.get("id") == msg_id:
            return data.get("result", {})


async def evaluate_js(ws, expr, msg_id):
    return await send_cmd(ws, "Runtime.evaluate", {"expression": expr, "awaitPromise": True}, msg_id=msg_id)


async def capture(ws, filepath, width, height, msg_id):
    # Set viewport
    await send_cmd(ws, "Emulation.setDeviceMetricsOverride", {
        "width": width,
        "height": height,
        "deviceScaleFactor": 1,
        "mobile": False
    }, msg_id=msg_id)
    await asyncio.sleep(0.5)

    res = await send_cmd(ws, "Page.captureScreenshot", {"format": "png"}, msg_id=msg_id + 1)
    img_data = base64.b64decode(res["data"])
    with open(filepath, "wb") as f:
        f.write(img_data)
    print(f"Captured: {filepath} ({width}x{height}, {len(img_data)} bytes)")


async def main():
    # Get active page target
    with urllib.request.urlopen("http://localhost:9222/json/list") as response:
        pages = json.loads(response.read().decode())
    
    page = next(p for p in pages if p.get("type") == "page" and "localhost:3000" in p.get("url", ""))
    ws_url = page["webSocketDebuggerUrl"]
    print(f"Connecting to CDP at {ws_url}...")

    async with websockets.connect(ws_url, max_size=50_000_000) as ws:
        await send_cmd(ws, "Page.enable", msg_id=10)
        await send_cmd(ws, "Runtime.enable", msg_id=11)

        # 1. Roadmap 2026 (Light Mode) 1920x1080 & 1440x900
        await evaluate_js(ws, "window.scrollTo(0, 0);", 20)
        await capture(ws, SCREENSHOT_DIR / "roadmap_1920x1080.png", 1920, 1080, 30)
        await capture(ws, SCREENSHOT_DIR / "roadmap_1440x900.png", 1440, 900, 32)

        # 2. Roadmap at 2035 (Light Mode)
        await evaluate_js(ws, """
            const btns = Array.from(document.querySelectorAll('button'));
            const b2035 = btns.find(b => b.textContent.includes('2035'));
            if (b2035) b2035.click();
        """, 40)
        await asyncio.sleep(0.6)
        await capture(ws, SCREENSHOT_DIR / "roadmap_2035_1920x1080.png", 1920, 1080, 42)

        # Reset year back to 2026
        await evaluate_js(ws, """
            const btns = Array.from(document.querySelectorAll('button'));
            const b2026 = btns.find(b => b.textContent.includes('2026 (Now)'));
            if (b2026) b2026.click();
        """, 45)
        await asyncio.sleep(0.4)

        # 3. Scenarios page (Bars, Lines, Both views)
        await evaluate_js(ws, """
            const btns = Array.from(document.querySelectorAll('nav button'));
            const bScen = btns.find(b => b.textContent.includes('Scenarios'));
            if (bScen) bScen.click();
        """, 50)
        await asyncio.sleep(0.6)
        # Capture Bars view (default)
        await capture(ws, SCREENSHOT_DIR / "scenarios_bars_1920x1080.png", 1920, 1080, 52)
        await capture(ws, SCREENSHOT_DIR / "scenarios_1920x1080.png", 1920, 1080, 53)
        await capture(ws, SCREENSHOT_DIR / "scenarios_1440x900.png", 1440, 900, 54)

        # Switch to Lines view (Margin over time)
        await evaluate_js(ws, """
            const btns = Array.from(document.querySelectorAll('button'));
            const bLines = btns.find(b => b.textContent.trim() === 'Lines');
            if (bLines) bLines.click();
        """, 55)
        await asyncio.sleep(0.6)
        await capture(ws, SCREENSHOT_DIR / "scenarios_lines_1920x1080.png", 1920, 1080, 56)
        await capture(ws, SCREENSHOT_DIR / "scenarios_lines_1440x900.png", 1440, 900, 57)

        # Switch to Both view
        await evaluate_js(ws, """
            const btns = Array.from(document.querySelectorAll('button'));
            const bBoth = btns.find(b => b.textContent.trim() === 'Both');
            if (bBoth) bBoth.click();
        """, 58)
        await asyncio.sleep(0.6)
        await capture(ws, SCREENSHOT_DIR / "scenarios_both_1920x1080.png", 1920, 1080, 59)

        # 4. Quantum Demo page (run simulation)
        await evaluate_js(ws, """
            const btns = Array.from(document.querySelectorAll('nav button'));
            const bQ = btns.find(b => b.textContent.includes('Quantum demo'));
            if (bQ) bQ.click();
        """, 60)
        await asyncio.sleep(0.6)
        # Click Run simulation / Next
        await evaluate_js(ws, """
            const stepButtons = Array.from(document.querySelectorAll('button'));
            const runBtn = stepButtons.find(b => b.textContent.includes('Run Quantum') || b.textContent.includes('Next: Run on Simulator'));
            if (runBtn) runBtn.click();
        """, 65)
        await asyncio.sleep(0.8)
        await capture(ws, SCREENSHOT_DIR / "quantum_demo_1920x1080.png", 1920, 1080, 70)
        await capture(ws, SCREENSHOT_DIR / "quantum_demo_1440x900.png", 1440, 900, 72)

        # 5. Evidence page
        await evaluate_js(ws, """
            const btns = Array.from(document.querySelectorAll('nav button'));
            const bEv = btns.find(b => b.textContent.includes('Evidence'));
            if (bEv) bEv.click();
        """, 80)
        await asyncio.sleep(0.6)
        await capture(ws, SCREENSHOT_DIR / "evidence_1920x1080.png", 1920, 1080, 82)
        await capture(ws, SCREENSHOT_DIR / "evidence_1440x900.png", 1440, 900, 84)

        # 6. Dark Mode Screenshot (on Roadmap)
        await evaluate_js(ws, """
            const btns = Array.from(document.querySelectorAll('nav button'));
            const bRd = btns.find(b => b.textContent.includes('Roadmap'));
            if (bRd) bRd.click();
            const darkBtn = document.querySelector('button[title=\"Toggle Dark Mode\"]');
            if (darkBtn) darkBtn.click();
        """, 90)
        await asyncio.sleep(0.6)
        await capture(ws, SCREENSHOT_DIR / "roadmap_dark_1920x1080.png", 1920, 1080, 92)

        # Reset dark mode back
        await evaluate_js(ws, """
            const darkBtn = document.querySelector('button[title=\"Toggle Dark Mode\"]');
            if (darkBtn) darkBtn.click();
        """, 95)
        print("All screenshots generated successfully.")


if __name__ == "__main__":
    asyncio.run(main())
