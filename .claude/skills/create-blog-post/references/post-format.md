# Post format

## Where things live

- Post: `docs/blog/{slug}.mdx` → served at `https://steamgameidler.com/blog/{slug}`. The
  filename *is* the URL, so it's permanent once published.
- Images: `docs/public/blog/{slug}/` → referenced as `/blog/{slug}/<file>`. WebP preferred,
  descriptive kebab-case filenames (`achievement-sets-steam-settings.webp`, not `img1.webp`).
  Keep them in the repo, served same-origin by Vercel - not on the R2 CDN (decided 2026-10-20).
  The site has image optimization off (`images.unoptimized`), so Vercel bills nothing extra for
  them and the bandwidth is negligible. Same-origin keeps Google Images attribution and the cover's
  load speed simple, and the images ship in the same PR as the post. Exception: video files
  (demo clips) go on the R2 CDN (`cdn-steamgameidler.com`) or YouTube, never in git.
- Collection schema: `docs/source.config.ts` (`posts`). Page template, BlogPosting/Breadcrumb
  JSON-LD, OG tags, RSS and sitemap `lastmod` are all generated from the frontmatter. Don't
  hand-write any of that into the post.

## Frontmatter

```yaml
---
title: How Steam Achievement Sets Change Achievement Unlocking   # on-page H1; clear, natural
seoTitle: Steam Achievement Sets Explained - DLC, Archives & Tools # <title>, 50-60 chars, keyword first, ' - ' as separator (site convention)
description: Steam's new Achievement Sets beta groups achievements into ... # 130-160 chars; meta description AND visible lede
date: 2026-10-20          # YYYY-MM-DD, the day it's written (bump it if the PR waits days to merge)
# updated: 2026-11-02     # only for substantive revisions - drives dateModified + sitemap lastmod
category: Steam News      # one of: Steam News | Guides | Explainers | Updates
tags: [Achievements, Steam Beta]   # 2-4, reuse existing tags across posts (they power "Keep reading")
keywords: [steam achievement sets, ...]   # primary + main secondaries
image: /blog/{slug}/cover.webp     # 1200x630, always - produce it from templates/cover.html
imageAlt: Steam Achievement Sets explained, with base game and DLC progress bars
# draft: true             # only if the user asks to hold a post back; omit otherwise
---
```

Categories: **Steam News** (a Steam change and what it means), **Guides** (how to do something),
**Explainers** (how a Steam system works), **Updates** (a significant SGI change worth more than a
changelog line - use sparingly, never for routine releases).

## Components (available in every post, no import)

| Component | Use |
|---|---|
| `<KeyTakeaways>` + a markdown list | Right after the intro. 3-5 bullets, each a complete, quotable fact. |
| `<Figure src alt width height caption />` | Every image. `width`/`height` are the real pixel size (prevents layout shift). Captions are read more than body text, so make them informative. |
| `<YouTube id="..." title="..." caption="..." />` | Click-to-load embed (no player JS until clicked). Credit third-party creators in `caption`. |
| `<Callout type="info\|warn\|error">` | Fumadocs callout, for genuine caveats (beta status, account risk). |
| `<Steps>` / `<Step>` | Procedures. Pair with numbered H3s inside. |
| `<Tabs items={[...]}>` / `<Tab>` | Only when content truly splits (e.g. Steam Sign-in vs Legacy Sign-in). |
| Markdown tables | Comparisons, before/after, which-mode-supports-what. |

Bare markdown images work but have no caption or dimensions. Use `<Figure>`.

## Media markers

**Produce media yourself first; leave a marker only for what you genuinely can't produce.** See
"Producing media" below for the tools and rules. A marker is an MDX comment, so it never renders,
so leftover markers never block publishing:

```mdx
{/* MEDIA: screenshot | priority: high
    What: SGI's Achievement Manager for a game with sets: the left panel with "All achievements",
    "Base game" and a DLC set.
    How: open the game in SGI → Achievement Manager. Crop to the window, 1600px wide.
    File: /blog/steam-achievement-sets/sgi-achievement-manager-sets.webp (1600x1000)
    Alt: Steam Game Idler's Achievement Manager listing a game's base game and DLC achievement sets
    Caption: Steam Game Idler's Achievement Manager groups achievements by set.
    Why: first-hand proof the post's SGI claims are real; needs the user's signed-in app.
    Can't produce: needs the user's signed-in SGI account (would show their real library). */}
```

Every marker ends with a **Can't produce:** line giving the reason. If you can't write one, produce
the image instead.

Types: `screenshot`, `diagram`, `table` (you write it - not a marker), `video` (SGI demo to record),
`embed` (existing third-party video - just use `<YouTube>` directly), `gif` (short UI loop → ship as
looping muted MP4/WebM, not GIF), `cover`. Priority reflects SEO and comprehension impact.

Guidance:
- One meaningful visual roughly every 300-500 words; never decorative filler.
- The first image near the top matters most (AI answers and Google Images pick it up).
- Prefer real Steam/SGI screenshots and original diagrams. Never use real game capsule art as
  *decoration* (third-party branding). It may appear inside a genuine screenshot of a Steam page
  that the post discusses.
- Every image needs alt text that describes it and uses the topic's words naturally. No stuffing.
- Every post gets a cover (1200x630). It's also the social/OG image and the blog card.

## Producing media

Tools live in `.claude/skills/blog-shared/` and run with the claude-seo venv's Python, which has
Playwright + Chromium:
`PY=~/.claude/plugins/marketplaces/AgriciDaniel-claude-seo/.venv/Scripts/python.exe`.
Work in the session scratchpad, **look at every rendered PNG yourself** (Read it) before using it,
then convert and place the final file:

```bash
ffmpeg -y -i in.png -vf "scale=1600:-2:flags=lanczos" -c:v libwebp -quality 85 docs/public/blog/{slug}/name.webp
```

Covers: `scale=1200:630`, quality 88. Keep files small (< ~150 KB). Insert finished images with
`<Figure src width height alt caption />` (real pixel size), and covers via frontmatter `image` +
`imageAlt`.

### Covers - `templates/cover.html` + `scripts/render_html.py`

Copy the template to the scratchpad and edit only the marked spots: CATEGORY, TITLE (3-8 words,
1-3 key words in `<span class="hl">`), and the VISUAL slot plus its styles. The visual is an
original, abstract illustration of the topic built in HTML/CSS (cards, progress bars, trophies,
icons as inline SVG). Never real game art, never a fake Steam/SGI UI screenshot, never Steam/Valve
logos. Render with `"$PY" -I render_html.py cover.html cover.png` (2x), check it at full size and
imagine it at thumbnail size: the headline must be readable, nothing clipped, nothing overlapping.
Iterate until it's good enough to be the face of the post.

### Diagrams - `scripts/render_html.py`

Write a small HTML page (1600x900, the same dark tokens and Geist font as the cover template) for
flows, comparisons and timelines, and render it the same way. Content must match the post and
its sources exactly. A diagram is a claim too.

### Web screenshots - `scripts/capture.py`

For public pages the post discusses: Steam store/community pages, Valve announcements, the new
achievements page (`steamcommunity.com/achievements/<appid>`), Steam Support FAQs, GitHub
issues. Supports clicking text to open UI (`--click "All Sets (14)"`), cropping (`--clip`,
`--selector`), and hiding/blurring elements. Caption with what it is and the capture date.
Rules:
- **Privacy:** never show another person's identity without need. Blur usernames/avatars on
  forum posts, comments and Reddit threads (`--blur`), and never capture someone's personal
  profile, badges or inventory.
- **Credit** the source in the caption ("Steam's achievements page", "via r/Steam").
- Never stage or edit a screenshot to show something the page didn't show.
- Pages that need sign-in (your own badges/inventory, the Market when rate-limited) → marker.

### Video frames - `yt-dlp` + `ffmpeg`

Prefer embedding the video with `<YouTube>` (credited). Use a frame only to illustrate something
specific the post discusses, credited to the channel in the caption:
`yt-dlp -f "bv*[height<=1080]" -o v.mp4 <url>` then `ffmpeg -ss 00:01:23 -i v.mp4 -frames:v 1 f.png`.

### Never produce

SGI app screenshots (they need the user's signed-in account and would show their real library),
mock-ups that imitate real Steam or SGI UI, AI-generated images presented as screenshots, and
anything showing private data. These stay as markers for the user.

## Structure

```mdx
<intro: 2-4 sentences. The direct answer to the primary query in the first 100 words, with the
 primary keyword used naturally. No throat-clearing.>

<KeyTakeaways>
- ...
</KeyTakeaways>

## What <the change/thing> is            <- define it precisely, with the primary source linked
## How it works / What changed           <- specifics, dates, who it affects, beta vs. live
## <the user-facing implications>        <- cards / achievements / playtime as relevant
## What this means for Steam Game Idler  <- code-verified; per sign-in mode/platform if it differs;
                                            link the relevant docs page; what users should do
## FAQ                                   <- H3 per real question (PAA/Reddit/Steam forums),
                                            2-4 sentence answers that stand alone
## Sources                               <- bulleted primary sources with publisher + date
```

Adapt headings to the topic and the brief. This is the minimum shape, not a template to fill.
H2s and H3s only (the H1 comes from `title`); headings should say what the section answers.

## Voice

- Write for a Steam user who idles games, not for SEO. Plain, specific, honest. Short paragraphs.
- Lead with the conclusion, then the detail.
- Concrete over vague: exact setting names, real numbers with their source, real dates.
- Name SGI's UI exactly as `src/i18n/locales/en-US.json` does.
- **US English spelling**, matching the rest of the site: color, favorite, leveling, behavior,
  canceled, customize, organization, analyze. Applies to frontmatter, alt text, captions and
  any text rendered into images. Quotes and proper nouns keep their original spelling.
- Honest about limits and risk (beta features change; Steam rules apply). Don't over-promise what
  SGI does, and don't market. One natural mention of downloading SGI near the end is enough. The
  page template already adds a download CTA.
- Avoid AI tells: "delve", "in today's fast-paced world", "it's not X, it's Y" reveals, "game-changer",
  "seamless", "robust", "unlock the power of", triplet lists by reflex, sentences trailing extra
  comma clauses, emoji, rhetorical-question headings, a summary section that repeats the post.
- Link internally with descriptive anchors ("how card drops are calculated"), never "click here".
  Root-relative URLs (`/docs/features/card-farming`). External links to primary sources at
  the point of use.
