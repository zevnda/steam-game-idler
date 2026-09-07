# How idling is shared between features

Generated corpus content (see `.claude/skills/generate-architecture-guide/SKILL.md`) — verified
against `src-tauri/src/idling/claims.rs`. Regenerate via that skill if this behavior changes; don't
hand-edit to patch small drift.

## Why stopping one feature doesn't always stop a game from idling

Manual idling, Auto Idle, Card Farming, and the Achievement Unlocker can all want the same game
idling at the same time — for example, a game you're manually idling might also be mid-farm in
Card Farming. SGI tracks each feature's own "these are the games I want idling" list separately,
then idles the combined set. That means a game only actually stops idling once *every* feature
that wants it running has stopped wanting it — stopping just one of them (say, ending a Card
Farming session) leaves the game idling if Achievement Unlocker (or anything else) still needs it.

## What "Stop" on the Idling page actually does

The Idling page groups currently-idling games by whichever feature(s) started them. A single
game's own "Stop" button there removes it from every feature's list at once, regardless of which
one(s) originally started it — a hard override for "I want this specific game to stop, full
stop." Each feature section's own "Stop" only clears that one feature's list, which may or may not
actually stop the game if another feature is still claiming it.

## "Stop All"

"Stop All" clears every feature's idling list at once for the account you're currently viewing —
it's the only action guaranteed to stop everything, since it doesn't rely on any one feature
releasing its own claim.

## This is per Steam account

If you have more than one Steam account signed in at once, each account's idling is tracked and
resolved completely independently — stopping or clearing idling on one account never affects
another account's games.
