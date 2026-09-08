# Docs site map and content conventions

How `docs/app/(marketing)/docs/_content/` is actually organized, and the recurring authoring
conventions used across it — read this alongside the real `meta.json`/`.mdx` files for the feature
you're covering (this file is a map to navigate by, not a substitute for reading the pages
themselves — content changes; re-verify anything load-bearing).

If anything here stops matching what's actually on disk, fix this file as part of that run and say
so in your report.

## Full page tree

Only 6 `meta.json` files exist total: the root, plus one per feature folder that has subpages
(`card-farming`, `achievement-unlocker`, `achievement-manager`, `inventory-manager`, `free-games`).
`get-started/` and `settings/` have no `meta.json` of their own — the root `meta.json` lists their
pages directly.

```
_content/
  index.mdx                          top-level "Documentation" landing page
  faq.mdx
  pro.mdx                            tier comparison table (Yes/No components, local to this file)
  steam-credentials.mdx              Steam Community cookies for Card Farming/Inventory Manager —
                                      distinct from app sign-in (get-started/how-to-sign-in.mdx)
  troubleshooting.mdx
  get-started/
    install.mdx
    how-to-sign-in.mdx               Steam Sign-in (agent mode) vs Legacy Sign-in (CLI mode)
    multi-account.mdx
    build-it-yourself.mdx
  features/
    card-farming/            meta.json pages: how-it-works, blacklisting-games, card-drop-times
      index.mdx
      how-it-works.mdx
      blacklisting-games.mdx
      card-drop-times.mdx
    achievement-unlocker/    meta.json pages: custom-order-and-unlock-delay, import-timings
      index.mdx
      custom-order-and-unlock-delay.mdx
      import-timings.mdx
    achievement-manager/     meta.json pages: special-flags
      index.mdx
      special-flags.mdx
    inventory-manager/       meta.json pages: pricing-details, marketplace-fees
      index.mdx
      pricing-details.mdx
      marketplace-fees.mdx
    free-games/               meta.json pages: what-counts-as-a-free-game, notifications
      index.mdx
      what-counts-as-a-free-game.mdx
      notifications.mdx
    playtime-booster.mdx     single file, no subpages — this is idling/manual playtime boosting
    auto-idle.mdx             single file, no subpages
    favorites.mdx              single file, no subpages
    manual-add.mdx            single file, no subpages
  settings/
    general.mdx
    subscription.mdx
    customization.mdx
    card-farming.mdx
    achievement-unlocker.mdx
    inventory-manager.mdx
    free-games.mdx
    game-settings.mdx
    keybinds.mdx
    debug.mdx
```

Note: as of this check (2026-09-07), `docs/CLAUDE.md`'s own "Current sections" summary already
correctly lists `features/playtime-booster.mdx` ("Playtime Booster" / "How to Idle Steam Games and
Boost Playtime") rather than a stale `features/idling.mdx` — an earlier version of this file
flagged that as a live discrepancy; it's since been fixed on the `docs/CLAUDE.md` side. No action
needed unless a future check finds it's drifted again.

## Which docs subtree backs which `src/features/` folder

Not always 1:1 by name — check both sides before assuming:

- `src/features/card-farming/` ↔ `features/card-farming/*` + `settings/card-farming.mdx`
- `src/features/achievement-unlocker/` ↔ `features/achievement-unlocker/*` + `settings/achievement-unlocker.mdx`
- `src/features/idling/` (manual idling) ↔ `features/playtime-booster.mdx` (NOT `idling.mdx`)
- `src/features/auto-idle/` ↔ `features/auto-idle.mdx`
- `src/features/inventory-manager/` ↔ `features/inventory-manager/*` + `settings/inventory-manager.mdx`
- `src/features/free-games/` ↔ `features/free-games/*` + `settings/free-games.mdx`
- `src/features/favorites/` ↔ `features/favorites.mdx`
- achievement-manager overlay (opened from any `GameCard`, no route of its own) ↔ `features/achievement-manager/*`
- `src/features/settings/` (the Settings modal itself) ↔ `settings/general.mdx`, `settings/game-settings.mdx`, `settings/keybinds.mdx`, `settings/debug.mdx`, `settings/customization.mdx`, `settings/subscription.mdx`
- `src/features/account-switcher/` ↔ `get-started/multi-account.mdx`
- Steam Community cookie connect flow (shared by card-farming/inventory-manager) ↔ `steam-credentials.mdx`
- Sign-in landing / agent-sign-in / local-sign-in ↔ `get-started/how-to-sign-in.mdx`, `get-started/install.mdx`

## Content conventions

**Frontmatter**: always `title` + `description`; `index: true` marks a folder's overview page;
occasional `icon: <LucideIconName>`.

**Standard imports** in feature pages:
```mdx
import DocsCTA from '@/app/(marketing)/docs/_components/DocsCTA';
import MockButton from '@/app/(marketing)/docs/_components/MockButton';
import { Step, Steps } from 'fumadocs-ui/components/steps';
```
`Callout` needs no import — it comes from Fumadocs' `defaultMdxComponents`, merged in by
`docs/mdx-components.tsx`.

**`Callout` types**: `"info"` (prerequisites, tips, PRO-gating notes — by far the most common) and
`"warn"` (genuine caveats: rate limits, "read this other page first," destructive settings, a real
Steam-client requirement). No `error`/`success`/`tip` types appear anywhere in the corpus. One
known typo: `get-started/how-to-sign-in.mdx` uses `type='warning'` instead of `warn` — a real
inconsistency, not a third valid type.

**`Steps`/`Step` nesting**: top-level `<Steps>` wraps sequential `<Step>`s. A step can fork by mode
using a markdown sub-heading inside it (`### Steam Sign-in` / `### Legacy Sign-in`). A step with
several independent sub-flows nests its own `<Steps>` blocks introduced by `####` sub-headings
(see `inventory-manager/index.mdx`'s "sell individual/selected/all/duplicate" split). `pro.mdx`
nests `<Steps>` inside `<Accordion>` items for its FAQ section.

**Tier-gating in prose** — no MockButton/badge for this, always plain English, most often this near-
verbatim Callout (seen in `card-farming/index.mdx`, `inventory-manager/index.mdx`):
```
You must add your [Steam Credentials](/docs/steam-credentials) before you can use this feature.

Users using [Steam Sign-in](/docs/get-started/how-to-sign-in) with a [Gamer tier subscription](/pro)
do not need to manually enter their Steam credentials.
```
`pro.mdx` is the canonical tier-comparison reference (a full table using local `Yes`/`No`
components) — other pages link to `/pro` rather than restating tier tables.

**Cross-links**: always absolute from site root (`/docs/features/...`, `/docs/settings/...#anchor`),
never relative (`../`). The one non-`/docs` internal link is `/pro`.

**`DocsCTA` placement**: always the very last element on a feature page, self-closing, no props.
Present on every `features/**/index.mdx` and every top-level `features/*.mdx` file. Absent from
settings pages, get-started pages, and misc pages (`faq`/`troubleshooting`/`pro`/`steam-credentials`).

## Other custom MDX components (besides MockButton)

- **`DocsCTA`** — bordered "Ready to get started?" box with Downloads/GitHub links. No props.
- **`Cards`** / **`CardLink`** — grid + card-link components, used only on the root `index.mdx`
  landing page to link out to every doc section. Not used inside individual feature pages.
- **`CopyableFAQ`** — wraps an `Accordion` entry with a copy-to-clipboard button; used in `faq.mdx`
  (confirm any other usage by reading the actual file — a naive grep for "Cards" also matches
  unrelated "Card Farming"/"Card Drop Times" text).
- **`Logo`** — decorative inline SVG, used inside `DocsCTA` only.
- `img` tags are auto-wrapped in Fumadocs `ImageZoom` (click-to-zoom) via `mdx-components.tsx` —
  not something a page opts into explicitly.
