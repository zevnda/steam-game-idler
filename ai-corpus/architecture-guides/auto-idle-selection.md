# How Auto Idle decides which games to idle

Generated corpus content (see `.claude/skills/generate-architecture-guide/SKILL.md`) — verified
against `src-tauri/src/auto_idle/{mod,commands,cache}.rs` and `src-tauri/src/idling/{mod,claims}.rs`.
Regenerate via that skill if this behavior changes; don't hand-edit to patch small drift.

## It's your own list, not an automatic pick

Auto Idle doesn't choose games on its own — it idles whatever games you've added to your Auto Idle
list and left enabled. You can arrange the list yourself (drag-reorder is supported), but that
ordering is just for your own organization, not a priority order Auto Idle follows (see below).
Adding, removing, reordering, and toggling games on or off all update that same list.

## When it actually starts idling

The list itself doesn't do anything until it's triggered — which happens when SGI starts up, when
you press "Start Now," or automatically as the next step after the Achievement Unlocker's queue
finishes (if you've configured that chaining in Achievement Unlocker settings). Each trigger claims
every currently-enabled game in your list for idling at once, on top of whatever else is already
idling from other features.

## Games skipped for being over their playtime cap

If a game in your list already has a configured max-playtime cap and you've already reached it,
that game is skipped when Auto Idle triggers — it stays in your list, just not claimed for idling
until the cap situation changes (e.g. you raise or remove the cap). This is a "skip before it even
starts" check; separately, a game that's already idling (from Auto Idle or manual idling) is also
watched on an ongoing basis and gets stopped mid-session if it crosses its cap while idling — that
ongoing check isn't specific to Auto Idle, so it isn't covered here.

## List order doesn't decide who wins if you're over the concurrent-idle limit

There's a hard cap of 32 games idling at once per account, shared across every feature that idles
games (manual idling, Auto Idle, Achievement Unlocker, Card Farming) — not something specific to
Auto Idle, but it interacts with Auto Idle's list in a way worth calling out. If your enabled,
under-cap games — combined with whatever else is already idling on the account from other features
— would add up to more than 32 at once, the extra games get left out. Which specific games make the
cut isn't decided by the order you've arranged your list in, and isn't decided by which feature
claimed them first — there's no priority system beyond "enabled" and "not over its playtime cap."
Reordering your list is purely for your own organization; it doesn't influence which games get an
idling slot when space is tight. In practice this only comes up if you're pushing the account close
to or past the 32-game limit across everything running at once — a smaller list is unaffected.
