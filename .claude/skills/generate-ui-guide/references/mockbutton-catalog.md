# MockButton catalog

Exhaustive list of every `type` value `docs/app/(marketing)/docs/_components/MockButton.tsx`
supports, and exactly what it renders as. Docs pages use `<MockButton type='...' />` to represent
a UI button/icon without a screenshot — **the rendered label/icon here, not the surrounding prose
or heading text, is the button's real name.** This file exists because that distinction was missed
once already: a docs page's `### Farm All Games With Drops Remaining` heading got misread as a
button label, when the actual `<MockButton type='card-farming-action' />` under it renders "Start".
Always cross-check a docs page's MockButton usages against this table instead of inferring a
button's label from surrounding prose.

If a docs page uses a `type` value not listed below, or a value listed here no longer matches what
`MockButton.tsx` actually renders (check it — this file can drift), fix this file as part of that
run and say so in your report.

Base pill style is a small rounded badge (`bg-fd-muted`, 12px bold text); icon-only variants render
at a fixed height with no label. A few (`lock`/`lock-all`/`remove-all`) render with a destructive
red style instead. `go-pro` renders as a special white/blue badge mimicking the in-app title-bar
badge, not the standard pill.

## General / common

| type | Renders as |
|---|---|
| `content` | `{content}` prop only, no icon — generic labeled pill |
| `context-add` | ➕ `{content}` (icon-only if no `content` given) |
| `context-cog` | ⚙️ `{content}` (icon-only if no `content` given) — used for "Settings → X" |
| `refresh` | ↻ icon only |
| `checkbox` | small checked checkbox, no label |
| `grabber` | six-dot drag-handle icon only |
| `copy` | 📋 "Copy" |
| `clear` | "Clear" (text only) |
| `save` | ⬆ "Save" |
| `save-alt` | "Save" (text only, no icon) |
| `save-changes` | ⬆ "Save Changes" |
| `blacklist` | 🚫 `{content}` (icon-only if no `content` given) |
| `manual-add` | ➕ icon only |

## Card Farming

| type | Renders as |
|---|---|
| `card-farming` | 🃏 "Card Farming" |
| `card-farming-action` | ▶ **"Start"** — not "Farm All Games With Drops Remaining" |
| `blacklist` | (shared, see above) — used for blacklisting a game from the browse grid |

## Achievement Unlocker

| type | Renders as |
|---|---|
| `achievement-unlocker` | 🏆 "Achievement Unlocker" |
| `achievement-unlocker-action` | ▶ "Start" |
| `unlock-order` | sort/arrows icon only |
| `import-timings` | "Import Timings" (text only) |
| `unlock` | 🔓 "Unlock" |
| `unlock-all` | 🔓 "Unlock All" |
| `lock` | 🔒 "Lock" (destructive red) |
| `lock-all` | 🔒 "Lock All" (destructive red) |

## Achievement Manager

| type | Renders as |
|---|---|
| `achievement-manager` | 🏆 icon only |

## Inventory Manager

| type | Renders as |
|---|---|
| `inventory-manager` | 🏬 "Inventory Manager" |
| `list-card` | export/list icon only — list a single item |
| `list-selected` | "Sell Selected" (text only) |
| `list-all` | "Sell All" (text only) |
| `remove-all` | "Remove listings" (text only, destructive red) |
| `sell-dupes` | 📋 "Sell Dupes" |

## Free Games

| type | Renders as |
|---|---|
| `free-games` | 🎁 "Free Games" |

## Favorites

| type | Renders as |
|---|---|
| `favorites` | ❤ "Favorites" |

## Idling / Playtime Booster

Note: the live docs page for this feature is `features/playtime-booster.mdx` ("Playtime Booster"),
not `idling.mdx` — see `docs-site-map.md`.

| type | Renders as |
|---|---|
| `your-games` | 🎮 "Games" |
| `idling-games` | ▶ "Idling" |
| `start-idle` | ▶ icon only |
| `start-manually` | ▶ "Start" |
| `stop` | ⏹ "Stop" (destructive red) |
| `stop-all` | ⏹ "Stop all" (destructive red) |

## Auto-Idle

| type | Renders as |
|---|---|
| `auto-idle` | ⏳ "Automatic Idler" |

## General / games list

| type | Renders as |
|---|---|
| `all-games` | "All Games" (text only) |

## Sign-in / accounts

| type | Renders as |
|---|---|
| `steam` | Steam icon only |
| `steam-sign-in` | "Steam Sign-in" (text only) |
| `legacy-sign-in` | "Legacy Sign-in" (text only) |
| `qr-sign-in` | "Or sign in with QR" (text only) |
| `continue` | "Continue" (text only) |
| `account-switcher` | person icon only |
| `add-account` | ➕ "Add another account" |
| `sign-out` | ⏏ "Sign out" |

## Settings / debug / export

| type | Renders as |
|---|---|
| `view-log-file` | "View log file" (text only) |
| `open-settings-file` | "Open settings file" (text only) |
| `export-settings` | "Export settings" (text only) |
| `clear-logs` | "Clear logs" (text only) |
| `reset-settings` | "Reset settings" (text only, destructive red) |
| `clear-data` | "Clear data" (text only, destructive red) |

## Subscription / Pro / payments

| type | Renders as |
|---|---|
| `manage-subscription` | "Manage subscription" + external-link icon |
| `upgrade` | "Upgrade" (text only) |
| `activate` | "Activate" (text only) |
| `go-pro` | "GO PRO" special badge style (not the standard pill) |
| `pay-stripe` | Stripe icon + "Stripe" |
| `pay-paypal` | PayPal icon + "PayPal" |
