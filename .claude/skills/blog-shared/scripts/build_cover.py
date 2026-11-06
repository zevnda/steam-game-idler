"""Build a blog cover from its fragment (covers/{slug}.html) and the shared frame.

    "$PY" -I build_cover.py <slug> [--png out.png] [--webp out.webp] [--html out.html]

The fragment holds only what differs per cover (see covers/README.md):

    <cover category="Explainers" hue="185" tilt="true" archetype="dial">
      <title>How Steam <span class="hl">tracks playtime</span></title>
      <style> ...visual CSS... </style>
      <visual> ...markup that goes inside .visual__inner... </visual>
    </cover>

Everything else (starfield, brand pill, eyebrow, title fit, URL) comes from
templates/cover.html, so the frame stays identical across every cover. Defaults: --png goes to
the current directory; --webp is only written when given (ffmpeg, 1200x630, quality 88). PY is
the claude-seo venv's python, which has Playwright + Chromium.
"""

import argparse
import re
import subprocess
import sys
from pathlib import Path

from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parent.parent
TEMPLATE = ROOT / "templates" / "cover.html"
COVERS = ROOT / "covers"


def parse_fragment(text: str) -> dict:
    head = re.search(r"<cover\b([^>]*)>", text)
    if not head:
        sys.exit("fragment has no <cover ...> element")
    attrs = dict(re.findall(r'(\w+)="([^"]*)"', head.group(1)))
    for key in ("category", "hue", "archetype"):
        if key not in attrs:
            sys.exit(f'<cover> needs a {key}="..." attribute')

    def block(tag: str) -> str:
        m = re.search(rf"<{tag}>(.*?)</{tag}>", text, re.S)
        if not m:
            sys.exit(f"fragment has no <{tag}> block")
        return m.group(1).strip()

    return {
        "CATEGORY": attrs["category"],
        "HUE": attrs["hue"],
        "TILT": "tilt" if attrs.get("tilt", "false") == "true" else "",
        "TITLE": block("title"),
        "STYLE": block("style"),
        "VISUAL": block("visual"),
    }


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("slug")
    ap.add_argument("--png")
    ap.add_argument("--webp")
    ap.add_argument("--html", help="also keep the assembled HTML here (for debugging)")
    args = ap.parse_args()

    fragment = COVERS / f"{args.slug}.html"
    if not fragment.exists():
        sys.exit(f"no fragment at {fragment}")
    slots = parse_fragment(fragment.read_text(encoding="utf-8"))

    html = TEMPLATE.read_text(encoding="utf-8")
    for key, value in slots.items():
        html = html.replace("{{" + key + "}}", value)
    leftover = re.search(r"\{\{[A-Z]+\}\}", html)
    if leftover:
        sys.exit("unfilled slot left in the frame: " + leftover.group(0))

    png = Path(args.png or f"{args.slug}-cover.png").resolve()
    assembled = Path(args.html).resolve() if args.html else png.with_suffix(".html")
    assembled.write_text(html, encoding="utf-8")

    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page(viewport={"width": 1200, "height": 630}, device_scale_factor=2)
        page.goto(assembled.as_uri())
        page.wait_for_load_state("networkidle")
        page.evaluate("document.fonts.ready")
        page.wait_for_timeout(300)
        page.screenshot(path=str(png))
        browser.close()
    print(f"saved {png}")

    if args.webp:
        subprocess.run(
            ["ffmpeg", "-loglevel", "error", "-y", "-i", str(png), "-vf",
             "scale=1200:630:flags=lanczos", "-c:v", "libwebp", "-quality", "88", args.webp],
            check=True,
        )
        print(f"saved {args.webp}")


if __name__ == "__main__":
    main()
