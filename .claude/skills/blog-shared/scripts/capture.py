#!/usr/bin/env python3
"""
Screenshot part of a public web page for a blog post - a Steam page, an announcement, a Market
listing, a forum post. Shared by /create-blog-post and /find-blog-topics.

Run with the claude-seo venv's Python (it has Playwright + Chromium):
    PY=~/.claude/plugins/marketplaces/AgriciDaniel-claude-seo/.venv/Scripts/python.exe
    "$PY" -I capture.py URL OUT.png [--width 1440] [--height 1000] [--scale 2]
        [--click "All Sets (14)"] [--selector CSS] [--clip x,y,w,h] [--full]
        [--hide CSS ...] [--blur CSS ...] [--wait 6000]

- `--selector` screenshots one element; `--clip` a rectangle in CSS pixels; neither = viewport.
- `--click` clicks the first element with that exact visible text first (open a dropdown, expand
  a comment), `--hide` removes elements (cookie banners, sign-in nags), `--blur` blurs elements
  (usernames, avatars - see the privacy rule in post-format.md).
- Waits for `load` plus `--wait` ms, not `networkidle`: Steam pages keep polling and never go idle.

Then convert for the site with ffmpeg (see post-format.md "Producing media"):
    ffmpeg -y -i OUT.png -vf "scale=1600:-2" -c:v libwebp -quality 82 OUT.webp
"""

import argparse
import sys

from playwright.sync_api import sync_playwright


def main():
    parser = argparse.ArgumentParser(description="Screenshot part of a public web page")
    parser.add_argument("url")
    parser.add_argument("out")
    parser.add_argument("--width", type=int, default=1440)
    parser.add_argument("--height", type=int, default=1000)
    parser.add_argument("--scale", type=float, default=2, help="device scale factor (2 = retina-sharp)")
    parser.add_argument("--click", action="append", default=[], help="visible text to click first")
    parser.add_argument("--selector", help="screenshot only this element")
    parser.add_argument("--clip", help="x,y,w,h rectangle in CSS pixels")
    parser.add_argument("--full", action="store_true", help="full-page screenshot")
    parser.add_argument("--hide", action="append", default=[], help="CSS selector to remove")
    parser.add_argument("--blur", action="append", default=[], help="CSS selector to blur")
    parser.add_argument("--wait", type=int, default=6000, help="ms to wait after load")
    args = parser.parse_args()

    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page(
            viewport={"width": args.width, "height": args.height},
            device_scale_factor=args.scale,
            locale="en-US",
        )
        page.goto(args.url, wait_until="load", timeout=90000)
        page.wait_for_timeout(args.wait)

        for selector in args.hide:
            page.add_style_tag(content=f"{selector} {{ display: none !important; }}")
        for selector in args.blur:
            page.add_style_tag(content=f"{selector} {{ filter: blur(8px) !important; }}")
        for text in args.click:
            page.get_by_text(text, exact=True).first.click()
            page.wait_for_timeout(1500)

        if args.selector:
            page.locator(args.selector).first.screenshot(path=args.out)
        elif args.clip:
            x, y, w, h = (float(v) for v in args.clip.split(","))
            page.screenshot(path=args.out, clip={"x": x, "y": y, "width": w, "height": h})
        else:
            page.screenshot(path=args.out, full_page=args.full)

        print(f"saved {args.out} ({page.title()})")
        browser.close()


if __name__ == "__main__":
    sys.exit(main())
