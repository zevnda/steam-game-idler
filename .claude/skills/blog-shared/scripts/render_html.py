#!/usr/bin/env python3
"""
Render a local HTML file to a PNG at an exact size - blog covers (1200x630) and original diagrams.
Start from the templates in ../templates/ (copy one into the scratchpad, edit the text/content,
render it, then look at the result before using it).

    PY=~/.claude/plugins/marketplaces/AgriciDaniel-claude-seo/.venv/Scripts/python.exe
    "$PY" -I render_html.py page.html out.png [--width 1200] [--height 630] [--scale 2]

Renders at 2x for crisp text, then convert/downscale with ffmpeg to the final WebP size:
    ffmpeg -y -i out.png -vf "scale=1200:630" -c:v libwebp -quality 85 cover.webp

Templates load Geist from Google Fonts, so this needs network access; it waits for document.fonts
to be ready so text never renders in a fallback font.
"""

import argparse
import pathlib
import sys

from playwright.sync_api import sync_playwright


def main():
    parser = argparse.ArgumentParser(description="Render local HTML to PNG")
    parser.add_argument("html")
    parser.add_argument("out")
    parser.add_argument("--width", type=int, default=1200)
    parser.add_argument("--height", type=int, default=630)
    parser.add_argument("--scale", type=float, default=2)
    args = parser.parse_args()

    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page(
            viewport={"width": args.width, "height": args.height}, device_scale_factor=args.scale
        )
        page.goto(pathlib.Path(args.html).resolve().as_uri(), wait_until="networkidle")
        page.evaluate("document.fonts.ready")
        page.wait_for_timeout(300)
        page.screenshot(path=args.out, clip={"x": 0, "y": 0, "width": args.width, "height": args.height})
        print(f"saved {args.out}")
        browser.close()


if __name__ == "__main__":
    sys.exit(main())
