# How the Achievement Unlocker decides timing

Generated corpus content (see `.claude/skills/generate-architecture-guide/SKILL.md`) — verified
against `src-tauri/src/achievement_unlocker/manager.rs`, `settings.rs`, and `order.rs`. Regenerate
via that skill if this behavior changes; don't hand-edit to patch small drift.

## Why achievements don't unlock instantly

The first game a run actually starts working on waits a short, fixed grace period (about 10
seconds) once it becomes active before SGI begins working on it at all. That grace period belongs
to "starting up" a game specifically — it isn't repeated for every game in the queue, only for the
game(s) that begin a fresh round of unlocking (see the next section for what happens to every game
after that). This fixed grace is paid regardless of any other configured delay — if that same game
also has its own custom "delay before first unlock" set (via the order editor, see below), that
wait is added on top of the 10-second grace rather than replacing it, so a freshly-started game with
a custom pre-delay configured waits through both, back to back.

Once a game is actively unlocking, its achievements unlock one at a time, with a fresh wait before
each one. If you haven't set a custom delay for a specific achievement in the order editor, that
wait is a random amount of time within the range configured in Achievement Unlocker settings,
redrawn for every achievement — deliberate, so unlocks don't land in a suspiciously perfectly-even
rhythm.

## How the queue processes multiple games

When more than one game is queued, SGI first checks every queued game to see what's actually left
to unlock, dropping from the queue automatically: any game with nothing left, any game with
achievements Steam flags as "protected" from being unlocked, and any game already over its
configured maximum-playtime cap (checked again while actually unlocking it, too — see the
max-playtime architecture guide for that cap's own mechanics). Only once every currently-queued game
has been checked this way does SGI start actually unlocking anything.

The ~10-second starting grace period from above applies once per game that begins a fresh round of
unlocking — in multi-game mode (Casual: 3, Gamer: 32), that means every one of the games that starts
at the same time gets its own 10-second grace, since they're all beginning together. But a
replacement game that a slot picks up afterward, once one of those concurrent games finishes, does
not get another 10-second grace of its own — it starts right away (unless it has its own configured
delay-before-first-unlock, which still applies for that game the same as it would anywhere else). If
you're running games one at a time (single-game mode), it works the same way: only the very first
game of the run gets the 10-second grace; every game after that instead gets an extra pause (about 2
minutes) once the previous game finishes, before it starts — unless the next game already has its
own configured delay-before-first-unlock, in which case that's used instead of the 2-minute pause so
you don't wait twice. That substitution only applies to the between-games pause, though — it never
cancels the 10-second grace itself, which is only ever skipped for a non-first game in the first
place.

If you add a game to the queue while a run is already active, it won't be picked up until every game
currently being unlocked finishes — SGI re-checks the queue at the start of each round rather than
continuously mid-round, so a newly added game waits for the current round to fully wrap up before
it's even scanned.

## Custom order, skipped achievements, and delays

If you've set a custom order for a game (via the order editor), SGI unlocks in exactly that order,
skips any achievement you marked to skip, and uses whatever per-achievement delay you configured
instead of a random one for that specific achievement — any other achievement in the same game still
falls back to a random draw if you didn't set a delay for it too. Achievements you didn't manually
place fall to the end of the list, sorted starting with the most commonly-unlocked achievement and
ending with the rarest — the same order used when there's no custom order at all.

The order editor also lets you set a "delay before first unlock" for the game as a whole, separate
from any per-achievement delay — how long SGI waits, after the game is picked up, before touching
its first achievement. This is the "own configured delay-before-first-unlock" referenced above: it's
what a replacement game uses instead of the 2-minute between-games pause in single-game mode, and
it's what stacks on top of the 10-second grace when it's set on the very first game of a run.

## Scheduling and idling while waiting

If you've set a schedule (only unlock during certain hours), the unlocker pauses achievement
unlocking outside that window and resumes automatically once it's back in range — it doesn't lose
its place. If you've also enabled idling for a queued game, SGI starts idling it once it actually
begins working on that game, rather than waiting until it starts unlocking achievements — for a
freshly-picked game that means idling starts right after its 10-second starting grace ends, and for
a replacement game picked up later in the same run (which has no grace of its own) idling starts
essentially as soon as it's picked up. Either way, idling starts before any per-game "delay before
first unlock" wait, so a long delay before that game's first unlock doesn't leave it doing nothing
the whole time — unless a schedule window is currently closed, in which case idling pauses too until
the window reopens.

## Retries and giving up

If unlocking a specific achievement fails, SGI retries it up to 3 times with a short increasing
wait between attempts before moving on and trying again on the next round — a single failed
unlock doesn't stop the rest of the queue.

## What happens when the queue empties

Once every queued game has nothing left to unlock, SGI can automatically start Card Farming or
Auto Idle next, if you've configured a "next task" in Achievement Unlocker settings.
