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

- **`(marketing)`** — the full marketing/docs site (home, docs, changelog list, alternatives, download, pro, privacy, tos, paypal). Root layout includes Fumadocs `RootProvider`, Google Analytics, AdSense, `StoreLoader`, `TelemetryLoader`, full SEO metadata.
- **`(embed)`** — routes meant to be loaded inside the desktop app's webview (currently just `/changelog/[slug]`, the single-changelog-entry view shown in `ChangelogModal.tsx`'s iframe). Root layout is intentionally minimal: fonts + global styles only, no analytics, no ads, no Fumadocs provider, no background fetches — this route is the one exception the app's Vercel Firewall rule allows through from `tauri.localhost`, so it should stay lightweight.

```
docs/
  app/                     # Next.js App Router
    (marketing)/           # Full-layout marketing/docs site — route group, own root layout
      (home)/              # Marketing home — nested route group with its own sub-layout
        _components/       # Section components (Hero, Features, FAQ, etc.)
        layout.tsx
        page.tsx           # Composes all home sections
        search.tsx         # Search dialog
      docs/                # Documentation pages
        _components/       # Doc-specific UI (CardLink, Cards, Logo, MockButton, etc.)
        _content/          # MDX source files (see Content section below)
        [[...slug]]/page.tsx # Catch-all routing — renders every doc page
        layout.tsx         # Docs layout (Fumadocs sidebar, breadcrumbs, search)
      changelog/           # Changelog list page only (/changelog) — full layout, has NavBar/FooterSection
      alternatives/        # Comparison pages (ASF, Idle Master, SAM)
      privacy/ tos/ pro/ download/ paypal/  # Static/other pages
      layout.tsx           # Marketing root layout — SEO metadata, analytics, ads, fonts, providers
    (embed)/               # Minimal-layout routes loaded inside the desktop app's webview
      changelog/[slug]/    # Single changelog entry (/changelog/[slug]) — no analytics/ads/RootProvider
      layout.tsx           # Minimal root layout — fonts + global styles only
    api/                   # Route Handlers (search index, llms-full.txt) — outside the layout tree
    llms-full.txt/
    globals.css            # Global styles — imported independently by both root layouts
  lib/
    source.ts              # Fumadocs source loaders (docs + changelogs)
    layout.shared.tsx      # Shared nav options reused across layouts
  changelogs/              # Changelog MDX files (versioned, e.g. 5.3.0.mdx)
  public/                  # Static assets — logos, OG images, ads.txt
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
  idling.mdx
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

Sign-in is documented once on `get-started/how-to-sign-in.mdx` — **Sign in with Steam** (agent
mode, recommended, no local Steam client needed) vs. **Legacy Sign In** (CLI mode, fallback,
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

### Navigation (`meta.json`)

Each `meta.json` in `_content/` controls sidebar ordering:
```json
{ "title": "Card Farming", "pages": ["index", "card-farming-algorithm", "..."] }
```

## Key Files

### `source.config.ts`
Defines Fumadocs collections:
- **`docs`** — reads from `app/(marketing)/docs/_content/`, adds `keywords` frontmatter field
- **`blog`** (changelogs) — reads from `changelogs/`, adds `date` + `tags` fields, async

### `lib/source.ts`
Creates Fumadocs source loaders used throughout the app:
- `docs.getPage(slug)` / `docs.getPages()` — doc page access
- `blog.getPage(slug)` / `blog.getPages()` — changelog access
- `getLLMText(page)` — generates plain-text from processed MDX (used in LLM context files)
- `getPageImage(page)` — returns OG image path per doc page

### `lib/layout.shared.tsx`
Returns base nav options (`{ nav: { title: 'Steam Game Idler' } }`). Imported by both the home and docs layouts.

### `mdx-components.tsx`
Wraps all `<img>` tags with Fumadocs `<ImageZoom>` for click-to-zoom. Extended by every MDX page.

### `app/(marketing)/layout.tsx`
Marketing root layout that provides:
- Fumadocs `RootProvider` (theming, search)
- Google Analytics + AdSense scripts
- Geist + Geist Mono fonts
- Full SEO metadata (OG tags, Twitter card, JSON-LD schema)

### `app/(embed)/layout.tsx`
Minimal root layout for `/changelog/[slug]` only — Geist/Geist Mono fonts + `globals.css`, no analytics, no ads, no Fumadocs `RootProvider`. Kept deliberately light since this is the one route the desktop app's webview still loads directly.

### `app/(marketing)/docs/layout.tsx`
Docs section layout using Fumadocs `DocsLayout`:
- Sidebar with Orama-powered search
- GitHub + Discord external links
- Theme switch disabled

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
