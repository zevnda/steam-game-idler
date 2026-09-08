# How idling is shared between features

Generated corpus content (see `.claude/skills/generate-architecture-guide/SKILL.md`) — verified
against `src-tauri/src/idling/claims.rs` and `src-tauri/src/idling/commands.rs`. Regenerate via
that skill if this behavior changes; don't hand-edit to patch small drift.

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
stop."

Each feature section also has its own "Stop" button that stops that entire section, but the two
sets of features use genuinely different mechanisms underneath, not just a smaller version of the
same action:

- **Manual idling and Auto Idle** have no ongoing background process behind their claim — the
  claim itself *is* the whole state. Stopping their section simply erases that feature's claim list
  and re-announces the reduced set.
- **Card Farming and the Achievement Unlocker** each run a persistent automation cycle that keeps
  deciding what it wants idling and re-announcing its claim on every pass. If their section's
  "Stop" only erased the claim the same way manual/Auto Idle's does, the running cycle would simply
  put the same games right back on its very next pass, making the button look like it did nothing.
  So stopping their section instead tells that feature's own automation to actually stop running —
  clearing its claim is a side effect of the cycle ending, not the action itself.

Either way, stopping one feature's section only affects that feature's own games — if Card Farming
was farming five games and you stop it, all five stop (since stopping Card Farming stops its whole
cycle), but a game some *other* feature also claims keeps idling until that feature releases it
too.

## Which section a shared game shows under

If a game is claimed by more than one feature at once (e.g. manually idled while also mid-farm in
Card Farming), the Idling page shows it under exactly one section rather than duplicating it, using
a fixed priority order: manual idling first, then Card Farming, then the Achievement Unlocker, then
Auto Idle last. So a game that's both manually idled and queued in Auto Idle always shows under
"Manually idled" — Auto Idle is still holding its own claim on it underneath, it just isn't the
section shown.

## "Stop All"

"Stop All" is the one action guaranteed to stop everything for the account you're viewing. It does
two things, not just one: it first explicitly stops the Card Farming and Achievement Unlocker
automation cycles (each a safe no-op if that feature isn't running), and only then clears every
feature's claim and announces an empty set. Stopping those two cycles first is what makes it
reliable — clearing claims alone, without also stopping the cycles behind Card Farming and the
Achievement Unlocker, would leave them free to re-claim their games again on their very next pass.

## This is per Steam account

If you have more than one Steam account signed in at once, each account's idling is tracked and
resolved completely independently — stopping or clearing idling on one account never affects
another account's games.

## A known, rare edge case: a manually-killed game can silently start idling again later

This only applies to Legacy Sign-in (local Steam client) accounts, and only if you kill a game's
idling process yourself from outside SGI (e.g. via Task Manager) instead of using SGI's own stop
controls. SGI notices the process died and immediately reflects that everywhere you can see it —
the game stops showing as idling right away, on both the Games page and the Idling page.

What doesn't get cleaned up in that moment is the underlying claim record for that game — SGI has
no way to know a process was killed externally and translate that into "this feature no longer
wants this game idling." So the claim quietly lingers even though nothing is actually running for
it. The practical effect: the *next* unrelated change to that same feature's claim list (starting
or stopping a different manually-idled game, for instance) re-announces the full list including the
stale entry, and SGI dutifully starts the game idling again — without you asking it to. Clicking
that specific game's own idle toggle once, or using that section's "Stop" (or "Stop All"), clears
the stale entry for good either way. This is a known, deliberately low-priority gap (rare enough in
practice not to be worth the added complexity to fully close) rather than something to report as a
new bug. Steam Sign-in (agent mode) accounts have no equivalent gap, since there's no separate local
process that can fall out of sync with SGI's own state the way a killed local process can.
