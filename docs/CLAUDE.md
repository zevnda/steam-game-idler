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

```
docs/
  app/                     # Next.js App Router
    (home)/                # Marketing home — route group with its own layout
      _components/         # Section components (Hero, Features, FAQ, etc.)
      layout.tsx
      page.tsx             # Composes all home sections
      search.tsx           # Search dialog
    docs/                  # Documentation pages
      _components/         # Doc-specific UI (CardLink, Cards, Logo, MockButton, etc.)
      _content/            # MDX source files (see Content section below)
      [[...slug]]/page.tsx # Catch-all routing — renders every doc page
      layout.tsx           # Docs layout (Fumadocs sidebar, breadcrumbs, search)
    changelog/             # Changelog list + detail pages
    alternatives/          # Comparison pages (ASF, Idle Master, SAM)
    supported-games/       # Dynamic game pages (/supported-games/[appName])
    privacy/ tos/ pro/     # Static pages
    layout.tsx             # Root layout — SEO metadata, analytics, fonts, providers
    globals.css            # Global styles
  lib/
    source.ts              # Fumadocs source loaders (docs + changelogs)
    layout.shared.tsx      # Shared nav options reused across layouts
  changelogs/              # Changelog MDX files (versioned, e.g. 5.3.0.mdx)
  public/                  # Static assets — logos, OG images, ads.txt
  source.config.ts         # Fumadocs collection definitions (docs + blog/changelogs)
  next.config.ts           # Static export config + Fumadocs MDX plugin
  mdx-components.tsx       # MDX component overrides (adds image zoom)
  next-sitemap.config.mjs  # Sitemap + robots.txt generation (postbuild)
  vercel.json              # Vercel deployment — skips build when docs/ unchanged
```

## Routing

| Route                        | Source                                   |
| ---------------------------- | ---------------------------------------- |
| `/`                          | `app/(home)/page.tsx`                    |
| `/docs`                      | `app/docs/_content/index.mdx`            |
| `/docs/[...slug]`            | `app/docs/_content/**/*.mdx`             |
| `/changelog`                 | `app/changelog/page.tsx`                 |
| `/changelog/[slug]`          | `changelogs/*.mdx`                       |
| `/alternatives`              | `app/alternatives/page.tsx`              |
| `/alternatives/[tool]`       | `app/alternatives/[tool]/page.tsx`       |
| `/supported-games/[appName]` | `app/supported-games/[appName]/page.tsx` |
| `/privacy`, `/tos`, `/pro`   | Static page files                        |

## Content

### Documentation MDX (`app/docs/_content/`)

Structure maps directly to sidebar navigation. Each feature folder contains:
- `index.mdx` — overview page
- `meta.json` — defines sidebar order and section title
- Additional `.mdx` files — sub-topic pages

Current sections:
```
get-started/         install, how-to-sign-in, build-it-yourself
features/
  card-farming/      algorithm, drop times, blacklisting, account restrictions
  achievement-manager/  special flags
  achievement-unlocker/ import timings, custom order & unlock delay
  inventory-manager/    marketplace fees, pricing, removing listings
  playtime-booster/     stop idling, additional info
  task-scheduling/      possible task chains
  free-games/           notifications, what counts
  auto-idler.mdx
  manual-add.mdx
settings/            general, customization, per-feature settings, debug
faq.mdx
troubleshooting.mdx
steam-credentials.mdx
pro.mdx
```

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
- **`docs`** — reads from `app/docs/_content/`, adds `keywords` frontmatter field
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

### `app/layout.tsx`
Root layout that provides:
- Fumadocs `RootProvider` (theming, search)
- Google Analytics + AdSense scripts
- Geist + Geist Mono fonts
- Full SEO metadata (OG tags, Twitter card, JSON-LD schema)

### `app/docs/layout.tsx`
Docs section layout using Fumadocs `DocsLayout`:
- Sidebar with Orama-powered search
- GitHub + Discord external links
- Theme switch disabled

## Styling

**Tailwind CSS v4** via PostCSS (`@tailwindcss/postcss`). There is no `tailwind.config.mjs` — Fumadocs UI ships its own theme. Custom styles go in `globals.css`.

**Path alias**: `@/*` → `./` (docs root). Use `@/lib/source`, `@/app/docs/_components/...`, etc.

## Adding Content

**New doc page**: Add an `.mdx` file to the appropriate `app/docs/_content/` subdirectory, then add its filename (without `.mdx`) to the corresponding `meta.json` `pages` array.

**New changelog entry**: Add `changelogs/{version}.mdx` with required `date` frontmatter. It appears automatically in `/changelog`.

**New MDX component**: Export it from `mdx-components.tsx` so it's available in all MDX files without imports.

## Deployment

Deployed to Vercel as a static export (`output: 'export'` in `next.config.ts`). The `vercel.json` `ignoreCommand` skips rebuilds when no files under `docs/` changed. Sitemap and `robots.txt` are generated in the `postbuild` step via `next-sitemap`.

Production URL: `https://steamgameidler.com`
