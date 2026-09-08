<!-- url: https://steamgameidler.com/docs/features/inventory-manager -->
<!-- supersedes: https://steamgameidler.com/docs/features/inventory-manager/pricing-details, https://steamgameidler.com/docs/features/inventory-manager/marketplace-fees, https://steamgameidler.com/docs/settings/inventory-manager -->
# Inventory Manager

This file is generated corpus content, produced by the `/generate-ui-guide` skill from the real
`src/features/inventory-manager/` component source, its hooks, its cross-feature store wiring, and
the full `features/inventory-manager/*` + `settings/inventory-manager.mdx` docs pages. It is the
single merged source for this feature (UI + docs + cross-feature connections) and should be
regenerated via that skill whenever Inventory Manager's UI, settings, or docs pages change — not
hand-patched for small drift. For the mechanics of how selling duplicates actually works under the
hood (the real Steam Community market, fee handling, why listings are spaced out, per-item failure
handling), see `ai-corpus/architecture-guides/sell-duplicates.md` — this file focuses on what you
click and see, not the backend "why."

## What Inventory Manager is and how to open it

Inventory Manager lets you view and sell every marketable item in your Steam Community inventory —
trading cards (including foil cards), profile backgrounds, emoticons, and booster packs — directly
from SGI, listing them on the real Steam Community Market using your own signed-in session. It is
not limited to trading cards despite that being the most common use — anything Steam tags as
`item_class_2` (trading card), `item_class_3` (background), `item_class_4` (emoticon),
`item_class_5` (booster pack), or `item_class_10` (currently on sale) shows up here.

Open it from the sidebar's **Misc** section: a store-front icon (`TbBuildingStore`) labeled
"Inventory Manager", routing to `/dashboard/inventory-manager`. Unlike Idling/Card Farming/
Achievement Unlocker, this sidebar entry never shows a pulse/activity dot — Inventory Manager has
no persistent background automation loop, so there's nothing to indicate as "currently running."

The page itself is **not** synced by `DashboardShell` the way idling/games-list/card-farming are —
it has no shared cross-page store. Navigating away and back re-runs its own init (though a cached
copy of your last-fetched items paints instantly via `get_inventory_cache` before any live
Steam Community check happens — see the connection section below).

## Connecting your Steam Community credentials (mandatory before anything else works)

**No inventory item, price, or market action can be shown or performed until this account's Steam
Community session is resolved.** This gate is `useInventory.ts`'s `canAccessInventory` check, which
stays false until either a real connect attempt has succeeded this session, or an automatic
background re-check is genuinely about to happen.

Two ways this can happen **without you ever seeing a connect screen**, checked once per account on
page load:
- You're signed in via **Steam Sign-in (agent mode)** and hold a **Gamer-tier** subscription — the
  agent's daemon already holds a live authenticated Steam session and silently derives Steam
  Community cookies with zero prompts.
- This account has **previously saved manual Steam Community cookies** — from this exact feature, from
  Card Farming's own connect panel, or from Settings → Steam Credentials, since all three share the
  same OS-level credential store. A saved cookie set is retried automatically in the background too.

If neither applies, you see **`InventoryConnectPanel`** — centered in the page, built on the same
shared `SteamCookiesConnectPanel` component Card Farming and Settings' Steam Credentials tab use (its
full mechanics: tab switching, prefill-from-saved, clear button, save-on-success — are common to all
three surfaces). Two tabs:
- **"Automatic"** — Gamer-tier only. Always a real, clickable tab (never disabled) — if you don't
  have Gamer tier, it shows a "GAMER" `TierBadge` and clicking it opens the upgrade modal
  (`proModalStore.openWithTier('gamer')`) instead of switching to it. If you do have Gamer tier,
  selecting it and clicking "Sign in" attempts the same silent daemon-derived connection described
  above, on demand.
- **"Manual"** — available at every tier. Paste your Steam Community `sls` cookie (required) and
  optionally `sma` (mobile-confirmation cookie), then click "Save" — a "Loaded from the Steam
  Credentials saved in Settings." note appears if these fields were prefilled from a previously
  saved value. A failed submit clears the fields entirely rather than leaving a possibly-bad paste
  sitting in the form.

While this check (and any automatic connect it triggers) is still resolving, the page shows a
loading skeleton grid, not the connect panel — so an account that's about to auto-connect never
flashes the connect screen first. The panel is only ever shown once this settles and no automatic
path applies.

**If a previously-working Steam Community session goes bad** (Steam signs it out, cookies expire),
the very next inventory action that hits it clears the saved cookies (from both this page's local
cache and the OS credential store) and drops you straight back to this connect panel with an inline
red error banner describing what happened — you have to reconnect (automatically or manually) before
any further action works again.

## Browsing, searching, sorting, and filtering your inventory

Once connected, the page splits into a left filter rail and a virtualized item grid (built to handle
inventories running into the hundreds or thousands of items without lag).

**Left rail** (`InventoryFilterPanel`, disabled entirely — 40% opacity, non-interactive — whenever
your account has zero items):
- A search box (magnifying-glass icon, placeholder text, an X-clear button once you've typed
  something) that matches against the item's full name or its owning game's name.
- **Sort by** dropdown (the same `GameSortSelect` control every other browsable list in the app
  uses): "Name (A-Z)", "Name (Z-A)", "Game (A-Z)", "Game (Z-A)", "Badge level" (highest first). Your
  choice persists across navigation, app restarts, and reload via `sortPreferencesStore`'s
  `localStorage` blob — same mechanism every other sortable page in the app uses.
- **Filter** section — a vertically stacked list of toggle rows, each with an icon and a checkmark
  when active, and **multiple can be active at once** (this is a multi-select filter, not a
  single-choice one): Trading cards, Foil, Backgrounds, Emoticons, Booster packs, On sale,
  Duplicates, Has badge, Locked.

**Important, easy-to-miss behavior: locked items are hidden from the grid by default.** Unless you
explicitly turn on the "Locked" filter toggle, every locked item is filtered out of view entirely —
not shown, not counted in the header's item count, not selectable. If you can't find an item you
know you locked, turn on the "Locked" filter to see it (and every other locked item) — that's also
the only way to unlock something once it's been locked.

Item-type filters (Trading cards/Backgrounds/Emoticons/Booster packs/On sale) and the Foil filter
combine with OR logic among themselves (checking both "Trading cards" and "Foil" shows any card OR
any foil item, not only foil cards), while "Has badge"/"Duplicates"/"Locked" each narrow the result
further as their own separate AND condition.

**Empty state**: if your search/filters exclude everything (or your account genuinely has no
marketable items), the grid shows "No items found" / "No marketable items match the current search
and filters." — the same message either way, there's no separate "your inventory is actually empty"
copy.

## Locking an item so it's never sold automatically

Every item card has a lock toggle in its top-right corner — a small round button showing an open
padlock (`TbLockOpen`) normally, or a filled warning-colored padlock (`TbLock`) once locked, tooltip
"Lock this item so it's never sold automatically". Locking an item:
- Dims that card to 50% opacity and disables its selection checkbox and price input.
- Removes it from every bulk action's candidate pool: Sell All (which only ever considers the
  currently-filtered/visible view anyway), Sell Dupes' duplicate detection (a locked duplicate is
  never counted as sellable, even if it's genuinely a spare copy), and List Selected (a locked item
  that somehow still has a price draft set gets skipped with a toast: "Skipped {n} locked item(s)").
- Also hides it from the default grid view entirely (see the filtering section above) — you have to
  turn on the "Locked" filter to see or unlock it again.

**This is purely local, client-side bookkeeping** — stored in this browser's `localStorage`
(`sgi.inventoryManager.lockedItems`, keyed by the item's `assetid`), never sent to the backend or
tied to your Steam/SGI account in any way. It does not sync across devices, and does not survive a
fresh install or a cleared local app data folder — if your locked items seem to have "reset," that's
why.

## Fetching a market price (the price order-book modal)

Each item card also has a "Fetch price" text link at the bottom (with a right-pointing arrow icon
that nudges right on hover) — click it to open **`PriceOrderModal`**, titled with the item's full
name, showing two side-by-side tables: "Sell orders" on the left, "Buy orders" on the right, each row
a `(price, quantity)` pair from Steam's real order book for that exact item. While the data is still
loading, both tables show a skeleton placeholder instead.

**Clicking any row** in either table fills that price into the item's price input on the card behind
the modal, closes the modal, and — because entering a positive price auto-selects an item (see the
next section) — also marks that item as selected for a bulk "List selected" action.

If a price for this item was already fetched earlier in your session, clicking "Fetch price" reopens
the modal instantly with that cached data, no new network request. Otherwise there's a **fixed
5-second client-side cooldown** between manual "Fetch price" clicks (separate from the account's
configurable Sell Delay setting, which only paces *listing* requests, not price lookups) — clicking
again before the cooldown elapses shows a toast: "Please wait {n} seconds before fetching more item
prices" and the modal doesn't open at all. While a price is in flight, the link's text changes to
"Fetching price…" and is disabled. This cooldown only applies to this manual per-item click — the
bulk Sell All/Sell Dupes flows fetch prices directly and are already paced by the account's Sell
Delay setting server-side, so they never hit this cooldown.

Every item card also has a small icon button next to the price input that links out to
`https://www.steamcardexchange.net/index.php?gamepage-appid-{appId}` in your default external
browser (tooltip "View on SteamCardExchange") — a third-party price-reference site for that item's
owning game, independent of Steam's own order book shown in the modal above.

## Selling one item ("List on the market")

Each card has a price input (accepts the account's configured currency, with the right number of
decimal places and step size for that currency — most currencies use cents/0.01 steps, a handful
like JPY/KRW/VND/CLP have no minor unit and step by whole units) and, next to it, an icon-only button
(export/package icon, `TbPackageExport`, tooltip "List on the market" — this is docs' `list-card`
button). This button is disabled whenever the price is 0 (or blank) or any other bulk action is
currently in flight anywhere on the page (selling all, selling dupes, listing your selection, or
removing listings — one shared "busy" state disables every listing control at once, not just its
own).

Clicking it:
1. Re-checks the item isn't locked (it could have been locked after you set a price but before you
   clicked) — if it is, shows a toast: "This item is locked and can't be listed." and stops.
2. Adds the account's **Price adjustment** setting to your entered price.
3. Checks the adjusted price against the account's **Sell limit** min/max — if it falls outside that
   range, shows a toast naming the exact price and range ("{price} is outside your configured sell
   limit ({min}-{max}).") and does not list it.
4. Otherwise lists that one item at the adjusted price, then clears its price/selection state on
   success.

## Selecting multiple items and "Sell Selected"

You select an item for a bulk sell in either of two equivalent ways: **checking its checkbox**
(top-left of the card — disabled/unavailable while the item is locked), or **simply entering a price
greater than 0** in its price input, which auto-selects it (clearing the price back to 0
auto-deselects it). The header's "List selected ({n})" count only counts items that are both
selected *and* currently carry a positive price draft.

The **"List selected"** button (secondary style, in the page header) is disabled while nothing is
selected or while any bulk action is already running. Clicking it opens a confirmation dialog:
"List {n} selected items?" — "This will list every selected item at its entered price. Estimated
time: {duration}. Leave the app running until the process is complete." (the estimate is your
selected count times the account's configured Sell Delay, in seconds). Confirming:
1. Any selected-but-locked items are skipped, with a toast "Skipped {n} locked item(s)".
2. Every remaining item's price gets the account's Price adjustment added, then checked against the
   Sell limit — any that fall outside are skipped with "Skipped {n} item(s) outside your sell limit".
3. Everything that survives both checks is listed in one batched request, spaced server-side by the
   account's Sell Delay setting.
4. You get a success toast ("{n} item(s) listed") if any succeeded, and a separate warning toast
   ("{n} item(s) couldn't be listed") if some in the batch failed.

## "Sell All"

The **"Sell all ({n})"** button lists every item **currently visible in the grid** — i.e. whatever
your active search query and filters are showing right now, not necessarily your entire inventory.
Disabled if the visible count is 0 or another bulk action is running. Confirming its dialog ("Sell
all visible items?" — fetches a market price for and lists up to {n} items currently shown, using
your inventory settings' price preference and sell limits; estimated time shown the same way as
above) runs this logic per visible item:
- Skips anything locked.
- If you already typed a manual price for that specific item (an explicit override), that price wins
  — adjusted and range-checked exactly like the single-item flow above — even inside this bulk
  action.
- Otherwise it fetches a live market price (reusing one fetch per distinct item name, so five
  identical duplicate cards only cost one price lookup, not five) and picks either the highest buy
  order or lowest sell order per your **Default price** setting, then applies Price adjustment and
  the Sell limit range check the same way.
- **If Steam's rate limit is hit while fetching prices partway through, the entire batch stops
  immediately** rather than continuing to hammer the remaining items — you get a toast: "Steam is
  rate-limiting price lookups right now. Please try again in a moment." Anything not yet reached
  simply wasn't attempted; nothing already-queued is lost.
- Everything that qualifies is listed in one batched call, paced by the account's Sell Delay. If
  literally nothing qualified, you get "No items were eligible to sell - check your inventory
  settings' sell limits." instead of a listing attempt.

## "Sell Dupes" (Gamer tier)

The **"Sell Dupes"** button automatically finds and lists every duplicate copy of an item you own,
keeping exactly one copy of each — this ignores your current search/filter view entirely and looks
at your **whole inventory** (grouped by `marketHashName`, so it's matching the exact same item, not
just the same game), skipping any locked items from duplicate consideration. It's the only Sell Dupes
detail specific to this feature's UI worth restating here; the deeper mechanics of how the duplicate
detection and listing pipeline actually behaves are covered fully in
`ai-corpus/architecture-guides/sell-duplicates.md`.

**This is a Gamer-tier gated control**, and it follows this app's standard gating pattern exactly —
**it is never a native-disabled button.** If you don't hold Gamer tier, the button stays real,
clickable, and dimmed to 50% opacity, with a small purple "GAMER" pill badge appended right after its
label (note: this specific badge is a small locally hand-built pill in `InventoryPageHeader.tsx`, not
the app's shared `TierBadge` component that most other gated controls use — same visual intent,
slightly different implementation). Clicking it while not entitled opens the upgrade modal pre-scrolled
to Gamer tier (`proModalStore.openWithTier('gamer')`) instead of running anything. Once you hold
Gamer tier, clicking it opens the same style of confirmation dialog as Sell All ("Sell duplicate
items?" — fetches a market price for and lists up to {n} duplicate items, keeping one copy of each,
using your inventory settings' price preference and sell limits; time estimate shown the same way).
The button's own `isDisabled` only ever reflects the genuine "nothing to sell" case (zero total items)
or another bulk action already running — never the tier gate itself, which is enforced purely by
what `onPress` does.

## Removing all active listings

The **"Remove listings"** button (danger/red style, docs' `remove-all`) cancels **every currently
active Steam Community Market listing this account has** — this is not scoped to your local grid,
selection, or filters at all; it queries and cancels your account's real live listings directly.
Disabled if the grid's visible item count is 0, or any bulk action is already running (note: this
uses the visible item count only to decide whether the button is clickable at all, not as the actual
scope of what gets removed).

Confirming its dialog ("Remove all active listings?" — "This will cancel every active market listing
for this account.") shows an estimated time based on a **fixed 1-second delay per listing** — this is
a hardcoded pacing on the backend's `remove_market_listings` command, deliberately separate from
(and not adjustable via) the account's configurable Sell Delay setting, which only paces *listing*
requests, not removals.

Outcomes:
- **No active listings at all**: an info toast, "You have no active market listings."
- **At least one removed successfully**: success toast "Removed {successful} of {total} listings",
  and the page automatically refreshes your item grid afterward (so item state that depends on
  active listings, like the "On sale" filter, reflects reality immediately).
- **Nothing could be removed**: a danger toast, "Couldn't remove any listings."

## Inventory Manager settings

Reached via the header's gear icon (`TbSettings`, opens the app-wide Settings modal directly to its
"Inventory Manager" tab) or through the Settings modal's own tab list. Every field commits
immediately on change — there's no separate Save button, and each field optimistically updates then
reverts (with a danger toast showing the mapped error) if the save actually fails on the backend.
This tab only loads its data while it's the actively selected tab (not just whenever the modal is
open at all), and because the Settings modal is an overlay that never unmounts the page underneath
it, the Inventory Manager page re-reads its own separate copy of these same settings the instant the
modal closes — so a change you just saved takes effect immediately, without needing to navigate away
and back.

- **Currency** — a dropdown of roughly 35 real Steam currency codes (USD, EUR, GBP, JPY, and so on,
  sorted alphabetically by ISO code). Governs which currency market prices are fetched/displayed and
  items are listed in, everywhere in this feature, including the price order-book modal and every
  price input. Default: USD.
- **Default price** — a two-button toggle: "Highest buy order" or "Lowest sell order". Only affects
  the price auto-filled by **Sell All**/**Sell Dupes** when an item has no manually-entered price
  override — it never affects a price you typed in yourself. Per the exact rule: "Highest Buy Order"
  lists at the item's highest current buy-order price, falling back to its lowest sell-order price if
  no buy order exists, and skipping the item entirely if neither price is available; "Lowest Sell
  Order" lists at the lowest current sell-order price and skips the item if that's unavailable — it
  never falls back to a buy order. Default: Highest buy order.
- **Price adjustment** — a flat amount added to *every* listing price, whether auto-filled by a bulk
  action or entered manually — applies uniformly across the single-item, selected, all, and dupes
  flows. A negative value (e.g. `-0.05`) undercuts the market by that amount; a positive value adds a
  buffer. If the adjusted price falls below the Sell limit minimum, the item is simply not listed.
  Default: 0.
- **Sell limit** — a minimum and maximum price; any item whose final (adjusted) price falls outside
  this range is silently skipped rather than listed, across every sell flow — protects against
  accidentally selling something valuable far too cheaply, or listing a common item at an unrealistic
  price. Default: 0.01–10.00 (in the configured currency's units).
- **Sell delay** — seconds to wait between each listing request during a bulk sell, to avoid
  tripping Steam's own marketplace rate limiting; a higher value is safer when selling a large
  number of items at once. This is also what every bulk-action confirmation dialog's "Estimated
  time" is computed from (count × this value) — it does **not** govern the fixed 1-second-per-item
  pacing used by "Remove listings", which is a separate hardcoded constant. Default: 10 seconds. A
  note on this settings row also reminds you that manually fetching a single item's price (the
  "Fetch price" link on each card) has its own separate fixed 5-second cooldown, unrelated to this
  setting.

A standing warning worth knowing: this feature fetches card prices via an **undocumented Steam API
endpoint with strict rate limits** — if you hit errors selling or fetching prices, the fix is to
raise Sell Delay, or simply wait a few hours before trying again.

## Marketplace fees and how your entered price becomes the actual listing price

Steam charges a combined **15% transaction fee** on every Community Market sale, split into two
parts: a **5% Steam Transaction Fee** (paid to Valve for facilitating the transaction) and a **10%
Game Publisher Fee** (paid to the publisher of the item's owning game — every publisher receives this
for their own items, not just Valve). These are real Steam fees, identical whether you list an item
by hand on the Steam website or SGI lists it for you — this app has no control over them.

**Every price you see or type anywhere in this feature (a manually entered item price, or the price
SGI auto-fills from the highest-buy/lowest-sell order in a bulk sell) is treated as what the buyer
pays, not what you receive.** SGI works out the correct underlying Steam listing price so the buyer
ends up paying exactly the amount shown/entered; your own net proceeds come out lower once both fees
are deducted. Concretely, per the docs' own worked example: if you set a price of $0.50, the buyer
pays $0.50 and you receive $0.44 after fees. This is why a listing whose entered/auto-filled price is
very close to your account's Sell limit minimum can end up earning noticeably less than that minimum
after fees — the Sell limit range check happens against the buyer-facing price, before fees are
subtracted.

## Errors, session expiry, and rate limiting

If a page refresh or action fails while items are already showing (as opposed to the very first
connect, which routes to the connect panel described above), a red alert banner appears above the
grid: "Couldn't update your inventory" with a description mapped to the specific error — e.g. a
generic fallback reads "Something went wrong updating your inventory. Please try again. ({code})" if
the exact cause isn't one of the feature's known error codes. A Steam Community session that's
expired or failed validation specifically clears your saved cookies and drops you back to the mandatory
connect panel (see the connection section above), since no cached items can safely keep showing once
the session backing them is no longer valid. A price-lookup rate limit specifically stops an in-progress
bulk sell rather than continuing to retry — see the "Sell All" section above.

## Cross-feature connections

- **`steamCookiesStore`**: this feature's saved Steam Community cookie set is shared with Card
  Farming's connect panel and Settings' Steam Credentials tab — connecting or clearing credentials
  on any one of the three surfaces is immediately visible on the others, since they all read/write
  the same underlying OS credential store through the one shared `SteamCookiesConnectPanel`
  component and `useSavedSteamCookies` hook.
- **`subscriptionStore`**/**`proModalStore`**: gate the connect panel's "Automatic" tab and the "Sell
  Dupes" button, both rerouting to `openWithTier('gamer')` when not entitled rather than disabling —
  the standard tier-gating pattern used throughout the app (see the "Sell Dupes" section above for
  the one small implementation inconsistency: this feature's own gated badge is a hand-rolled pill,
  not the shared `TierBadge` component the connect panel's own "Automatic" tab uses).
- **`settingsModalStore`**: the header's gear icon calls `openSettings('inventoryManager')`, jumping
  straight to this feature's tab in the app-wide Settings modal rather than a generic "open settings"
  call.
- **`sortPreferencesStore`**: this feature's chosen sort style is stored under its own `inventory` key
  in the same shared, `localStorage`-persisted sort-preferences blob every other sortable page's
  choice lives in.
- **No idle-claims involvement** — Inventory Manager never starts, stops, or claims idling games; it
  has nothing to do with the `idling::claims::IdleClaimsRegistry` mechanism other automation features
  use.
- **No visible sign-in-mode branching** — the backend commands this feature calls (`get_inventory`,
  `list_items`, `get_item_price`, `update_item_price_data`, `remove_market_listings`,
  `get_inventory_settings`/`set_inventory_settings`) do branch internally on the account's sign-in
  mode (agent vs. local/CLI) to resolve the right Steam Community session, but this never changes
  what you can click or see — only which invisible backend path resolves your cookies.
- **Settings**: backed by its own per-SteamID64 file, `inventory_settings.json` — not shared with any
  other feature. Separately, this feature also keeps its own per-account **cache** file (not a
  settings file) so items can paint instantly from a previous fetch before any live check completes.
