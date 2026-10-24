# docs/CLAUDE.md

This file provides guidance to Claude Code when working in the `docs/` package — the documentation and marketing site for Steam Game Idler.

## Overview

A **Next.js 16 + Fumadocs** static site deployed to Vercel. It serves two purposes:
1. **Marketing home page** — landing page with feature highlights, comparisons, FAQ, testimonials
2. **Documentation** — structured MDX docs for every app feature

This package is fully independent of the root Tauri app. Changes here have no effect on the desktop app.

## Commands

Run from the **repo root** using root aliases:

```bash
pnpm dd              # docs dev server (http://localhost:3000)
pnpm build:docs      # production build + sitemap postbuild
pnpm lint:docs       # ESLint
```

Or run directly inside `docs/`:

```bash
pnpm dev
pnpm build           # static export → out/
pnpm lint
pnpm types:check     # fumadocs-mdx codegen + tsc --noEmit
```

**No test framework** — there is no jest/vitest setup.

## Architecture

The app uses Next.js's **multiple root layouts** pattern: there is no single top-level `app/layout.tsx`. Instead, every route belongs to one of two top-level route groups, each with its own independent root layout (own `<html>`/`<body>`, own providers/scripts):

- **`(marketing)`** — the full marketing/docs site (home, docs, changelog list, alternatives, download, pro, privacy, tos, paypal). Root layout includes Fumadocs `RootProvider`, Google Analytics, `StoreLoader`, `TelemetryLoader`, full SEO metadata.
- **`(embed)`** — routes meant to be loaded inside the desktop app's webview (currently just `/changelog/[slug]`, the single-changelog-entry view shown in `ChangelogModal.tsx`'s iframe). Root layout is intentionally minimal: fonts + global styles only, no analytics, no Fumadocs provider, no background fetches — this route is the one exception the app's Vercel Firewall rule allows through from `tauri.localhost`, so it should stay lightweight.

```
docs/
  app/                     # Next.js App Router
    (marketing)/           # Full-layout marketing/docs site — route group, own root layout
      (home)/              # Marketing home — nested route group with its own sub-layout
        _components/       # Shared marketing components (DownloadButton, StoreLoader...)
          landing/         # The home page's own sections + the interactive three.js showcase (see below)
        layout.tsx
        page.tsx           # Composes all home sections
        search.tsx         # Search dialog
      docs/                # Documentation pages
        _components/       # Doc-specific UI (CardLink, Cards, Logo, MockButton, etc.)
        _content/          # MDX source files (see Content section below)
        [[...slug]]/page.tsx # Catch-all routing — renders every doc page
        layout.tsx         # Docs layout (Fumadocs sidebar, breadcrumbs, search)
      changelog/           # Changelog list page only (/changelog) — full layout, has LandingNav/LandingFooter
      blog/                # Blog listing (/blog), posts (/blog/[slug]), RSS feed (/blog/rss.xml)
      alternatives/        # Comparison pages (ASF, Idle Master, SAM)
      privacy/ tos/ pro/ download/ paypal/  # Static/other pages
      layout.tsx           # Marketing root layout — SEO metadata, analytics, fonts, providers
    (embed)/               # Minimal-layout routes loaded inside the desktop app's webview
      changelog/[slug]/    # Single changelog entry (/changelog/[slug]) — no analytics/RootProvider
      layout.tsx           # Minimal root layout — fonts + global styles only
    api/                   # Route Handlers (search index, llms-full.txt) — outside the layout tree
    llms-full.txt/
    globals.css            # Global styles — imported independently by both root layouts
  lib/
    source.ts              # Fumadocs source loaders (docs, changelogs, blog posts)
    blog.ts                # Blog helpers: published-post filtering (drafts), reading time, authors, related posts
    layout.shared.tsx      # Shared nav options reused across layouts
  changelogs/              # Changelog MDX files (versioned, e.g. 5.3.0.mdx)
  blog/                    # Blog post MDX files ({slug}.mdx); images in public/blog/{slug}/
  public/                  # Static assets — logos, OG images, ads.txt (AdSense verification only)
  source.config.ts         # Fumadocs collection definitions (docs dir: app/(marketing)/docs/_content)
  next.config.ts           # Static export config + Fumadocs MDX plugin
  mdx-components.tsx       # MDX component overrides (adds image zoom)
  next-sitemap.config.mjs  # Sitemap + robots.txt generation (postbuild)
  vercel.json              # Vercel deployment — skips build when docs/ unchanged
```

## Routing

| Route                      | Source                                                                                                   |
| -------------------------- | -------------------------------------------------------------------------------------------------------- |
| `/`                        | `app/(marketing)/(home)/page.tsx`                                                                        |
| `/docs`                    | `app/(marketing)/docs/_content/index.mdx`                                                                |
| `/docs/[...slug]`          | `app/(marketing)/docs/_content/**/*.mdx`                                                                 |
| `/changelog`               | `app/(marketing)/changelog/page.tsx`                                                                     |
| `/changelog/[slug]`        | `app/(embed)/changelog/[slug]/page.tsx` + `changelogs/*.mdx` — minimal layout, loaded by the desktop app |
| `/blog`                    | `app/(marketing)/blog/page.tsx`                                                                          |
| `/blog/[slug]`             | `app/(marketing)/blog/[slug]/page.tsx` + `blog/*.mdx`                                                    |
| `/blog/rss.xml`            | `app/(marketing)/blog/rss.xml/route.ts`                                                                  |
| `/alternatives`            | `app/(marketing)/alternatives/page.tsx`                                                                  |
| `/alternatives/[tool]`     | `app/(marketing)/alternatives/[tool]/page.tsx`                                                           |
| `/privacy`, `/tos`, `/pro` | Static page files under `app/(marketing)/`                                                               |

Route groups (`(marketing)`, `(embed)`, `(home)`) don't appear in the URL — only affect file organization and which root layout a route uses.

## Content

### Documentation MDX (`app/(marketing)/docs/_content/`)

Structure maps directly to sidebar navigation. Each feature folder contains:
- `index.mdx` — overview page
- `meta.json` — defines sidebar order and section title
- Additional `.mdx` files — sub-topic pages

Current sections:
```
get-started/         install, how-to-sign-in, multi-account, build-it-yourself
features/
  card-farming/      index, drop times, blacklisting games, account restrictions
  achievement-manager/  index, special flags
  achievement-unlocker/ index, import timings, custom order & unlock delay
  inventory-manager/    index, marketplace fees, pricing, removing listings
  free-games/           index, notifications, what counts as a free game
  playtime-booster.mdx
  favorites.mdx
  auto-idle.mdx
settings/            general, customization, card-farming, achievement-unlocker,
                     inventory-manager, free-games, game-settings, keybinds, subscription, debug
faq.mdx
troubleshooting.mdx
steam-credentials.mdx  # Steam Community cookies for Card Farming/Inventory Manager only —
                        # distinct from app sign-in, which lives under get-started/how-to-sign-in
pro.mdx
```

Sign-in is documented once on `get-started/how-to-sign-in.mdx` — **Steam Sign-in** (agent
mode, recommended, no local Steam client needed) vs. **Legacy Sign-in** (CLI mode, fallback,
requires a real local running Steam client) — and referenced elsewhere rather than re-explained
wherever a feature behaves differently per sign-in mode.

**Frontmatter** for doc pages uses `frontmatterSchema` extended with:
```ts
keywords: z.array(z.string()).optional()
```

### Changelog MDX (`changelogs/`)

Files named `{version}.mdx` (e.g. `5.3.0.mdx`). Frontmatter:
```yaml
---
title: "v5.3.0"
date: "2025-01-15"       # ISO date — required
tags: ["New", "Improved", "Fixed"]    # tags are optional, at least one is required
---
```

### Blog MDX (`blog/`)

Posts are written by the `/create-blog-post` skill (`.claude/skills/create-blog-post/`), which
researches a topic, refuses ones that would hurt the site's SEO, and documents the frontmatter
and components in `references/post-format.md`. `/find-blog-topics` finds and vets topics when
there isn't one. Both share `.claude/skills/blog-shared/`: the validity gate, the research
playbook, a registry of research sources with working fetch methods (`sources.md`), and the topic
backlog (queued/drafted/published/rejected, `topic-backlog.md`). The schema lives in `source.config.ts` (`posts`):
`title`, `description` (required: meta description and visible lede), `date`, optional `updated`
(substantive revisions only - it drives `dateModified` and the sitemap `lastmod`), `seoTitle`,
`category` (`Steam News` | `Guides` | `Explainers` | `Updates`), `tags`, `keywords`, `image`
(1200x630 cover, doubles as the OG image), `imageAlt`, `author`, `draft`.

- **Drafts** (`draft: true`) render under `next dev` only. They're excluded from the production
  build, RSS and sitemap via `getPublishedPosts()`/`getPost()` in `lib/blog.ts`. Always go through
  those helpers, never `blog.getPages()` directly, for anything public.
- The post page generates BlogPosting + BreadcrumbList JSON-LD, `article:*` OG tags and the
  canonical from frontmatter. Don't hand-write them into a post.
- Post-only MDX components (`Figure`, `KeyTakeaways`, `YouTube`, `Steps`/`Step`, `Tabs`/`Tab`)
  come from `app/(marketing)/blog/_components/mdx.tsx`, on top of `mdx-components.tsx`.
- `next-sitemap.config.mjs` reads each post's `updated ?? date` for its `lastmod` (and the
  newest one for `/blog`); `/blog` is `noindex` while there are no published posts.
- Published posts are also appended to `/llms-full.txt`.

### Navigation (`meta.json`)

Each `meta.json` in `_content/` controls sidebar ordering:
```json
{ "title": "Card Farming", "pages": ["index", "card-farming-algorithm", "..."] }
```

## Key Files

### `source.config.ts`
Defines Fumadocs collections:
- **`docs`** — reads from `app/(marketing)/docs/_content/`, adds `keywords` frontmatter field
- **`changelog`** — reads from `changelogs/`, adds `date` + `tags` fields, async
- **`posts`** — blog posts, reads from `blog/` (see "Blog MDX" above)

### `lib/source.ts`
Creates Fumadocs source loaders used throughout the app:
- `docs.getPage(slug)` / `docs.getPages()` — doc page access
- `changelog.getPage(slug)` / `changelog.getPages()` — changelog access
- `blog` — blog posts, drafts included (use `lib/blog.ts`'s helpers for anything public)
- `getLLMText(page)` — generates plain-text from processed MDX (used in LLM context files)
- `getPageImage(page)` — returns OG image path per doc page

### `lib/layout.shared.tsx`
Returns base nav options (`{ nav: { title: 'Steam Game Idler' } }`). Imported by both the home and docs layouts.

### `mdx-components.tsx`
Wraps all `<img>` tags with Fumadocs `<ImageZoom>` for click-to-zoom. Extended by every MDX page.

### `app/(marketing)/layout.tsx`
Marketing root layout that provides:
- Fumadocs `RootProvider` (theming, search)
- Google Analytics
- Geist + Geist Mono fonts
- Full SEO metadata (OG tags, Twitter card, JSON-LD schema)
- The site serves **no ads**: AdSense was removed entirely. What's left of it: the
  `google-adsense-account` verification meta tag, commented out in the layout, and `public/ads.txt`.
  Don't reintroduce ad slots or scripts.

### `app/(embed)/layout.tsx`
Minimal root layout for `/changelog/[slug]` only — Geist/Geist Mono fonts + `globals.css`, no analytics, no Fumadocs `RootProvider`. Kept deliberately light since this is the one route the desktop app's webview still loads directly.

### `app/(marketing)/docs/layout.tsx`
Docs section layout using Fumadocs `DocsLayout`:
- Sidebar with Orama-powered search
- GitHub + Discord external links
- Theme switch disabled

### Home page (`app/(marketing)/(home)/_components/landing/`)
The landing page's sections live here. Its nav (`LandingNav`), footer (`LandingFooter`), closing CTA
(`FinalCta`) and `SectionHeading` are shared by every inner marketing page too (Pro, Download,
Alternatives, Changelog, Blog, legal). `SectionHeading`'s mono `eyebrow` label is optional: the home
page passes one, the inner pages don't. Off the home page, `LandingNav` points its in-page links at
`/#...`. (`/pro` still uses its own `pro/_components/SectionHeading`.) Entrance animation follows
the home page everywhere: a page's header (title, sub, actions, header picture) rises once as one
block with `.page-enter` (the home hero's `hero-enter`, transform only - never fade a title's
opacity, it delays LCP); section headings never animate; the content under them reveals on scroll
with `FadeIn`/`StaggerGroup`. Order: showcase -> feature
bento -> get started -> compare -> community -> open source -> FAQ -> final CTA.
- **`showcase/Showcase.tsx`** pins a full-viewport three.js stage: the hero headline sits above a
  live 3D replica of the app, and scrolling hands over to a docked "playground" (feature picker +
  the window). One scroll-progress value drives both the stage (`setView(frame, pose)`) and the
  overlays (the `--t` CSS variable), so scrolling never re-renders React. The hero -> playground
  hand-over is one continuous thread, not two fades: supporting copy steps back (`.hero-recede`),
  the headline (the page's h1) travels into the playground's heading slot and *stays* as its
  heading - the slot is an invisible same-text spacer, shown only under reduced motion
  (`HAND_OVER` + `drawOverlay` in `Showcase.tsx`, JS because it needs measured positions), and the
  picker assembles piece by piece (`.pg-reveal` + per-element `--at` windows in `Playground.tsx`).
  Keep those three sets of `t` windows in step when retiming any of it. The overlays read a
  *damped* `--t` that eases toward the scroll position at the same rate the stage eases its
  camera (`VIEW_DAMPING` in `engine/types.ts`) - tie any new scroll-linked overlay to that, not
  to raw scroll, or it will snap while the window glides.
- **`features.ts`** is the single source for the demo features (copy, mock page, pose, tier extras);
  **`demoStore.ts`** (zustand) lets any section drive the demo - the bento's "Try it live" buttons
  and theme swatches. Picking a feature navigates the mock; navigating *inside* the mock updates the
  picker (`source: 'app'` stops that bouncing back).
- **`showcase/engine/`** is lazily `import()`ed, so three.js (~160 KB gz) never blocks first paint,
  and only renders while the showcase is on screen. `stage.ts` = renderer/camera rig/raycast input;
  `mockApp.ts` = the app UI drawn immediate-mode onto a canvas texture (re-uploaded only when
  something changed) with hit regions mapped from raycast UVs; `effects.ts` = pooled cards, sparks,
  coins, confetti. No post-processing on purpose (bloom smears the screen's UI text; an
  EffectComposer drops the MSAA that text needs). Glows are additive shaders that must never write
  canvas alpha (`glowBlend` in `shaders.ts`) - the canvas is transparent over the CSS god rays.
  `engine/types.ts` and `engine/palette.ts` are three-free and safe to import from the main bundle.
- **Illustrations** (`landing/art/`): every bento tile and the "Get started" pipeline is a small
  storyboard - a pure function of `t` from `useElapsed`, played by `usePlayTrigger` (hover/focus,
  or in-view on touch devices) or `useInViewPlay`. Unhovering resets `t` to 0, which resets the
  scene; `FakeCursor` keys are px inside each scene's fixed-size `.art-stage`.
- **Honesty rules**: fictional games only (`engine/games.ts` - never real capsule art, it's
  third-party branding), UI wording copied from the desktop app's `en-US.json`, feature claims only
  from the README/docs, and no invented numbers (user counts, earnings, ratings).
- **Hero placeholder + Web Vitals**: the 3D stage only starts after `load` + idle, in small
  yielding steps (`yieldToMain` in `stage.ts`; no PMREM environment - it alone was ~0.9s of
  blocking work). Until then `public/landing/sgi-mock-hero*.webp` - an exact snapshot of the
  mock's opening frame, posed with CSS 3D to match the stage camera (`.hero-ph`) - holds the hero
  and is the page's LCP element. **Regenerate it whenever the mock's Games page changes**: on the
  dev page run `__sgiMockSnapshot(1600)` / `__sgiMockSnapshot(960)` (dev-only hook in `stage.ts`)
  and save the data URLs over those two files; do the same in a phone-sized window for
  `sgi-mock-hero-compact.webp` (900) / `sgi-mock-hero-compact-560.webp` (560).
- **Compact layout**: phones/portrait tablets (`STACKED_QUERY`) get the mock's `compact` layout
  (`mockLayout()` in `mockApp.ts`: a 560x960 portrait window, icon-rail sidebar, reflowed grids)
  shown whole, instead of a cropped desktop window. Every page draws both layouts; effects
  (cards, coins, rings) scale with the window via `FX` in `stage.ts`. The hero headline's entrance animation must never
  animate opacity (it would delay LCP).
- **No-WebGL fallback**: `showcase/FallbackShot.tsx` places the real CDN screenshots on the same
  frame the 3D window would occupy (also shown while three.js loads).

## Styling

**Tailwind CSS v4** via PostCSS (`@tailwindcss/postcss`). There is no `tailwind.config.mjs` — Fumadocs UI ships its own theme. Custom styles go in `globals.css`.

**Path alias**: `@/*` → `./` (docs root). Use `@/lib/source`, `@/app/(marketing)/docs/_components/...`, etc.

## Adding Content

**New doc page**: Add an `.mdx` file to the appropriate `app/(marketing)/docs/_content/` subdirectory, then add its filename (without `.mdx`) to the corresponding `meta.json` `pages` array.

**New changelog entry**: Add `changelogs/{version}.mdx` with required `date` frontmatter. It appears automatically in `/changelog`.

**New MDX component**: Export it from `mdx-components.tsx` so it's available in all MDX files without imports.

## Deployment

Deployed to Vercel as a static export (`output: 'export'` in `next.config.ts`). The `vercel.json` `ignoreCommand` skips rebuilds when no files under `docs/` changed. Sitemap and `robots.txt` are generated in the `postbuild` step via `next-sitemap`.

Production URL: `https://steamgameidler.com`

### Post-deploy tasks (`.github/workflows/docs-deploy.yml`)

Runs after every successful **production** Vercel deploy (GitHub's `deployment_status` event). A
`changes` job finds the previous successful production deploy, then the `indexnow` job uses that
range (helpers in `docs/scripts/lib/changes.mjs`). New blog posts are announced in Discord by hand,
not by CI:

- **`indexnow`** - `docs/scripts/indexnow.mjs` maps changed files to public URLs (blog posts, docs
  pages, static marketing routes - not shared components/styles, which would resubmit the whole
  site) and POSTs only those to `api.indexnow.org` for Bing/Yandex. Google ignores IndexNow, so
  this can't affect Google rankings. Manual use from `docs/`: `node scripts/indexnow.mjs --urls
  blog/some-post [--dry-run]` (no leading slash - Git Bash rewrites `/blog/...` into a Windows
  path).

**Never rename or delete `public/a99bafb2fec849c3abfd6d70326b67fa.txt`** - it's the IndexNow key
file; without it every submission fails with HTTP 403.
