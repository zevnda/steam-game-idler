# How the Achievement Unlocker decides timing

Generated corpus content (see `.claude/skills/generate-architecture-guide/SKILL.md`) — verified
against `src-tauri/src/achievement_unlocker/manager.rs`. Regenerate via that skill if this
behavior changes; don't hand-edit to patch small drift.

## Why achievements don't unlock instantly

Each queued game waits a short grace period (about 10 seconds) after it becomes active before its
first achievement unlocks, then further achievements unlock one at a time with a delay between
each. If you haven't set a custom delay for a specific achievement in the order editor, the wait is
a random amount of time within the range configured in Achievement Unlocker settings, redrawn for
every achievement — this is deliberate, so unlocks don't land in a suspiciously perfectly-even
rhythm.

## How the queue processes multiple games

When more than one game is queued, SGI first checks every queued game to see what's actually left
to unlock (dropping any game with nothing left, or with achievements Steam flags as
"protected" from being unlocked, from the queue automatically), and only then starts unlocking.
If you're running games one at a time (single-game mode), finishing one game before starting the
next adds an extra short pause — unless the next game already has its own configured
delay-before-first-unlock, in which case that's used instead so you don't wait twice. Running
multiple games at once (Casual: 3, Gamer: 32) skips that extra pause entirely, since those games
are already unlocking in parallel.

## Custom order, skipped achievements, and delays

If you've set a custom order for a game (via the order editor), SGI unlocks in exactly that order,
skips any achievement you marked to skip, and uses whatever per-achievement delay you configured
instead of a random one. Achievements you didn't manually place fall back to being sorted by rarity
(least common first) at the end of the list. Without any custom order at all, every eligible
achievement is just sorted by rarity.

## Scheduling and idling while waiting

If you've set a schedule (only unlock during certain hours), the unlocker pauses achievement
unlocking outside that window and resumes automatically once it's back in range — it doesn't lose
its place. If you've also enabled idling for a queued game, SGI starts idling that game as soon as
it becomes active (not only once it starts actually unlocking), so a long delay-before-first-unlock
doesn't mean the game sits doing nothing the whole time — unless a schedule window is currently
closed, in which case idling pauses too until the window reopens.

## Retries and giving up

If unlocking a specific achievement fails, SGI retries it up to 3 times with a short increasing
wait between attempts before moving on and trying again on the next pass — a single failed
unlock doesn't stop the rest of the queue.

## What happens when the queue empties

Once every queued game has nothing left to unlock, SGI can automatically start Card Farming or
Auto Idle next, if you've configured a "next task" in Achievement Unlocker settings.
