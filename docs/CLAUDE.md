# CLAUDE.md — docs/

This is the documentation site for Steam Game Idler, built with **Fumadocs** on **Next.js 16** (App Router). It is a standalone pnpm workspace package (`steam-game-idler-docs`) deployed statically to Vercel. It has no relationship to the root Tauri app — `src/` changes have no effect here.

## Commands

Run from the **repo root** (pnpm workspace aliases):

```bash
pnpm dd           # docs dev server (http://localhost:3001)
pnpm build:docs   # production build + next-sitemap postbuild
pnpm lint:docs    # ESLint for docs
```

Or from inside `docs/` directly:

```bash
pnpm dev
pnpm build        # next build (static export) + postbuild (sitemap)
pnpm types:check  # tsc --noEmit
```

There is **no test framework**.

## Architecture

### Routing (App Router)

```
app/
  (home)/               # Route group — home page + changelog
    layout.tsx          # Thin wrapper div
    page.tsx            # Home page (assembles section components)
    changelog/
      page.tsx          # Changelog list
      [slug]/page.tsx   # Individual changelog entry
      client.tsx        # Client-side rendering logic
  docs/
    layout.tsx          # DocsLayout (Fumadocs sidebar + nav)
    [[...slug]]/page.tsx  # Catch-all for all /docs/* pages
  alternatives/         # Comparison pages (ArchiSteamFarm, Idle Master, SAM)
  supported-games/
    [appName]/page.tsx  # Dynamic per-game pages
  pro/
  privacy/
  tos/
  api/
    search/route.ts     # Orama full-text search endpoint
  layout.tsx            # Root layout: RootProvider, fonts, metadata, structured data
  globals.css           # Full design system (tokens, component classes, keyframes)
  manifest.ts           # PWA manifest
```

### Path alias

`@docs/*` resolves to `./app/*` — use `@docs/components/...`, `@docs/stores/...` etc.

### Content layer (Fumadocs MDX)

Two MDX collections defined in [source.config.ts](source.config.ts):

| Collection | Source dir | URL base | Notes |
|---|---|---|---|
| `docs` | `content/docs/` | `/docs` | `keywords` frontmatter added via Zod extension |
| `blog` (changelog) | `content/changelog/` | `/changelog` | requires `date` frontmatter |

The compiled source is output to `.source/` and loaded by [lib/source.ts](lib/source.ts).

**Docs frontmatter schema:**

```yaml
title: string          # required
description: string    # optional
icon: string           # optional — Lucide icon name (e.g. "Hand", "ArrowBigDownDash")
index: boolean         # optional — marks a section index page
keywords: string[]     # optional — used for SEO
```

**Changelog frontmatter schema:**

```yaml
title: string          # version number (e.g. "5.3.0")
date: string           # ISO date (e.g. "2025-01-15")
tags: string[]         # optional — e.g. ["Added", "Fixed", "Improved"]
```

**Sidebar ordering (`meta.json`):**

Each directory under `content/docs/` can have a `meta.json` that controls sidebar order and injects section headers:

```json
{
  "pages": ["---Get Started---", "index", "./get-started/install", "---Features---", ...]
}
```

Strings wrapped in `---` become non-clickable section labels.

### MDX components

Custom MDX components are registered in [mdx-components.tsx](mdx-components.tsx). All images are wrapped in `ImageZoom` from fumadocs-ui. Standard Fumadocs components (`Steps`, `Step`, `Callout`, `Tabs`, `Tab`) are available in all MDX files without import.

Content-specific components under [app/components/content/](app/components/content/) can be used in MDX:

| Component | Use |
|---|---|
| `Cards` + `CardLink` | Grid of navigation links |
| `CopyableFAQ` | Expandable FAQ with copy button |
| `DocsCTA` | Call-to-action badge/link |
| `MockButton` | Inline UI mockup element |

To use in MDX, import at the top of the file:
```mdx
import { Cards, CardLink } from '@docs/components/content/Cards'
```

### State management

Single Zustand store at [app/stores/globalStore.ts](app/stores/globalStore.ts):
- `downloadUrl` — latest release download URL (fetched from GitHub API)
- `latestVersion` — latest release version string
- `repoStars` — GitHub star count

Populated by [app/components/StoreLoader.tsx](app/components/StoreLoader.tsx) on mount (client component). Used in HeroSection to render live download link and version badge.

### Search

Full-text search via **Orama** at the `/api/search` endpoint. The Fumadocs `RootProvider` in [app/layout.tsx](app/layout.tsx) is wired to a custom [app/components/search.tsx](app/components/search.tsx) dialog. No separate indexing step — Fumadocs builds the index at request time from the source.

## Design system

All tokens, component classes, and keyframes live in [app/globals.css](app/globals.css). This is the single source of truth — do not add one-off inline styles for things that belong here.

### Design tokens (`@theme`)

| Token | Value | Use |
|---|---|---|
| `--color-background` | `#000` | Page background |
| `--color-surface` | `#111` | Card/panel backgrounds |
| `--color-surface-raised` | `#1a1a1a` | Elevated surfaces |
| `--color-border` | `rgba(255,255,255,0.08)` | Default border |
| `--color-text-primary` | `#f5f5f5` | Body text |
| `--color-text-muted` | `#a3a3a3` | Secondary text |
| `--color-accent` | `#00a3ff` | Brand blue |
| `--radius-card` | `12px` | Card corner radius |
| `--radius-button` | `6px` | Button corner radius |

Dark theme only. Do not add a light theme.

### Reusable component classes

| Class | Description |
|---|---|
| `.card` | Dark surface card with border and hover lift |
| `.btn-primary` | Solid accent blue button |
| `.btn-ghost` | Outlined ghost button |
| `.btn-download` | White download button with shimmer shine animation |
| `.badge` | Small pill label |
| `.section-divider` | Glowing horizontal rule between home sections |
| `.glow-card` | Card with cursor-tracked glow effect |
| `.spotlight-card` | Card with spinning conic-gradient border + cursor glow |
| `.mockup-float` | 3D perspective float animation for app screenshots |

### Animations (keyframes)

| Name | Use |
|---|---|
| `shimmer-sweep` | Left-to-right shine on `.btn-download` |
| `rainbow-border` | 8s conic-gradient rotation on `.spotlight-card` |
| `mockup-float` | 3D bob animation (translateY + perspective rotations) |

### Interactive card components

Three card primitives in [app/components/](app/components/):

- [CardBorder.tsx](app/components/CardBorder.tsx) — server component; subtle gradient-masked top/side border overlay
- [GlowCard.tsx](app/components/GlowCard.tsx) — client component; tracks cursor position via `--mx`/`--my` CSS vars; renders `.glow-card` wrapper
- [SpotlightCard.tsx](app/components/SpotlightCard.tsx) — client component; extends GlowCard with a spinning conic-gradient border (`.spotlight-card`); composes `CardBorder` inside

Use `SpotlightCard` for featured/prominent cards. Use `GlowCard` for secondary stat-style cards. Use `CardBorder` alone when you only need the border accent without the glow behavior.

## Home page sections

The home page at [app/(home)/page.tsx](app/(home)/page.tsx) renders these sections in order, separated by `.section-divider` elements:

| Component | File | Description |
|---|---|---|
| `HeroSection` | [HeroSection.tsx](app/components/home/HeroSection.tsx) | Headline, download button (live from globalStore), version badge |
| `AppMockupSection` | [AppMockupSection.tsx](app/components/home/AppMockupSection.tsx) | Scroll-triggered app screenshot with 3D float + reflection |
| `FeaturesSection` | [FeaturesSection.tsx](app/components/home/FeaturesSection.tsx) | 4 SpotlightCard feature tiles |
| `SecuritySection` | [SecuritySection.tsx](app/components/home/SecuritySection.tsx) | Open-source / no-telemetry trust signals |
| `StatsSection` | [StatsSection.tsx](app/components/home/StatsSection.tsx) | GlowCard stat tiles (stars, downloads, games) |
| `ComparisonSection` | [ComparisonSection.tsx](app/components/home/ComparisonSection.tsx) | Feature table vs SAM / ASF / Idle Master |
| `FAQSection` | [FAQSection.tsx](app/components/home/FAQSection.tsx) | Accordion FAQ (also feeds FAQPage schema.org) |
| `CTASection` | [CTASection.tsx](app/components/home/CTASection.tsx) | Final download CTA |
| `FooterSection` | [FooterSection.tsx](app/components/home/FooterSection.tsx) | Nav links, legal |

`SectionAccent` ([SectionAccent.tsx](app/components/home/SectionAccent.tsx)) is a decorative radial gradient overlay dropped at the top of sections that need a subtle glow anchor point.

## Adding content

### New doc page

1. Create `content/docs/<path>.mdx` with required `title` frontmatter.
2. Add the path to the nearest `meta.json` `pages` array to control sidebar position.
3. No component imports needed for `Steps`, `Step`, `Callout`, `Tabs`, `Tab` — these are auto-available.

### New changelog entry

1. Create `content/changelog/<version>.mdx`.
2. Required frontmatter: `title` (version string) and `date` (ISO date).
3. The changelog list page renders entries in reverse-chronological order automatically.

### New docs collection route

Not needed for normal content. If a new Fumadocs collection is required, add it in [source.config.ts](source.config.ts) and register the loader in [lib/source.ts](lib/source.ts).

## Key dependencies

| Package | Version | Role |
|---|---|---|
| `next` | 16.2.6 | Framework (App Router, static export) |
| `react` | 19.2.4 | UI library |
| `fumadocs-core` | 16.5.1 | Docs framework core |
| `fumadocs-mdx` | 14.2.6 | MDX processing + source loader |
| `fumadocs-ui` | 16.5.1 | Docs layout, sidebar, search UI |
| `tailwindcss` | 4.3.x | Styling (new `@tailwindcss/postcss` pipeline) |
| `motion` | 12.40.0 | Animations (`motion/react`, replaces framer-motion) |
| `@orama/orama` | 3.1.16 | Full-text search |
| `zustand` | 5.0.8 | Client state (globalStore) |
| `zod` | 4.1.13 | Frontmatter schema validation |
| `lucide-react` | latest | Icons in docs UI and MDX via `lucideIconsPlugin` |

## Static export notes

`next.config.ts` sets `output: 'export'` and `images.unoptimized: true`. This means:

- No server-side rendering — all dynamic data (GitHub API) is fetched client-side
- No `next/image` optimization — use plain `<img>` or wrap with ImageZoom
- Route handlers (`/api/search`) work at build time only via Fumadocs' static index generation
- Deploy output is in `out/`; sitemap is generated into `out/` via `next-sitemap` postbuild

## Ads

Google AdSense is injected in [app/layout.tsx](app/layout.tsx). Ad slots render in `AdOverlay` ([app/components/AdOverlay.tsx](app/components/AdOverlay.tsx)) and are suppressed on `/supported-games/*` and `/changelog/*` routes. Do not add ad slots to doc pages.
