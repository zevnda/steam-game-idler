# How Auto Idle decides which games to idle

Generated corpus content (see `.claude/skills/generate-architecture-guide/SKILL.md`) — verified
against `src-tauri/src/auto_idle/commands.rs`. Regenerate via that skill if this behavior changes;
don't hand-edit to patch small drift.

## It's your own list, not an automatic pick

Auto Idle doesn't choose games on its own — it idles whatever games you've added to your Auto Idle
list, in the order you've arranged them (drag-reorder is supported), and only the ones you've left
enabled. Adding, removing, reordering, and toggling games on or off all update that same list.

## When it actually starts idling

The list itself doesn't do anything until it's triggered — which happens when SGI starts up, when
you press "Start Now," or automatically as the next step after the Achievement Unlocker's queue
finishes (if you've configured that chaining in Achievement Unlocker settings). Each trigger claims
every currently-enabled game in your list for idling at once, on top of whatever else is already
idling from other features.

## Games skipped for being over their playtime cap

If a game in your list already has a configured max-playtime cap and you've already reached it,
that game is skipped when Auto Idle triggers — it stays in your list, just not claimed for idling
until the cap situation changes (e.g. you raise or remove the cap).
