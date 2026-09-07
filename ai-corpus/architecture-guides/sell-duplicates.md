# How selling duplicate items works

Generated corpus content (see `.claude/skills/generate-architecture-guide/SKILL.md`) — verified
against `src-tauri/src/inventory/market.rs`. Regenerate via that skill if this behavior changes;
don't hand-edit to patch small drift.

## It's the real Steam Community market

Selling duplicates (Gamer tier) lists your items on the actual Steam Community market, using your
own signed-in session — the same marketplace you'd use listing items by hand on the Steam website,
not a third-party marketplace or an SGI-run one.

## Fees are real Steam fees

Steam and the item's publisher both take a cut of every market sale (roughly 5% and 10%
respectively) — the same fees apply whether you list an item yourself or SGI does it for you. SGI
calculates the listing price so your intended amount is what you actually receive after those fees
come out.

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
