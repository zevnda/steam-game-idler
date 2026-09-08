# How selling duplicate items works

Generated corpus content (see `.claude/skills/generate-architecture-guide/SKILL.md`) — verified
against `src-tauri/src/inventory/market.rs`, `src-tauri/src/inventory/settings.rs`, and the
duplicate-detection logic in Inventory Manager's own frontend code. Regenerate via that skill if
this behavior changes; don't hand-edit to patch small drift. For click-by-click UI details (buttons,
confirmation dialogs, settings fields), see `ai-corpus/ui-guides/inventory-manager.md`.

## It's the real Steam Community market

Selling duplicates (Gamer tier) lists your items on the actual Steam Community market, using your
own signed-in session — the same marketplace you'd use listing items by hand on the Steam website,
not a third-party marketplace or an SGI-run one.

## How duplicates are actually found

"Sell Dupes" looks at your **entire inventory**, not whatever you currently have searched or
filtered — it's a separate, whole-inventory clean-up pass rather than an action scoped to what's
currently on screen.

Items are grouped by exactly what they are — the same specific tradable item, not just the same
game. A foil version of a card and its non-foil counterpart are never treated as duplicates of each
other, and neither are two different items that merely belong to the same game. Within each group,
one copy is always kept; every additional copy beyond the first is what gets treated as a sellable
duplicate. Any item you've locked is excluded from this grouping entirely, so a locked "spare" copy
is never counted as a duplicate or listed automatically, no matter how many copies of it you own.

This grouping happens on your own device before anything is sent to Steam — figuring out which
items are duplicates doesn't require a network call by itself; only the actual listing step that
follows does.

## The price you type is what the buyer pays, not what you keep

Steam and the item's publisher both take a cut of every market sale (roughly 5% and 10%
respectively) — the same fees apply whether you list an item yourself or SGI does it for you.

Whatever price ends up attached to a duplicate for listing — one you typed yourself, or one SGI
auto-filled from the current market's buy/sell orders — is treated as the amount the **buyer** pays,
not the amount you receive. SGI works backward from that buyer-facing price to figure out the actual
listing price Steam needs (the amount you, the seller, are asking for before fees are added on top),
so that once Steam's cut and the publisher's cut are added back in, the buyer ends up paying
essentially the price shown. Your own proceeds always come out lower than that price once both fees
are subtracted — the fees are not on top of what you receive, they're taken out of it.

## Listings are spaced out on purpose

SGI waits a short delay (10 seconds by default, adjustable in Inventory Manager settings) between
each listing rather than firing them all at once, to avoid tripping Steam's own rate limiting on
the market. If Steam does respond with a rate-limit message partway through a batch, SGI stops
there rather than continuing to hammer the endpoint with the rest of your items — anything not
yet listed simply wasn't attempted, nothing is lost.

## Per-item failures don't stop the whole batch

If one specific item fails to list (a bad price, a rejected listing), the rest of your batch still
goes through — you'll see which specific items succeeded and which didn't rather than the whole
action failing outright.
