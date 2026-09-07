# Why achievement rarity percentages can look different between sign-in methods

Generated corpus content (see `.claude/skills/generate-architecture-guide/SKILL.md`) — verified
against `src-tauri/src/achievements/web_api.rs`. Regenerate via that skill if this behavior
changes; don't hand-edit to patch small drift.

## Where the rarity percentage comes from

The "X% of players have this achievement" figure comes from Steam itself — it's public data Steam
publishes per game, the same number the Steam client itself shows on an achievement's tooltip. It
has nothing to do with your own account or session.

## Why it can briefly show as missing under Steam Sign-in

Legacy Sign-in gets this percentage directly as part of the same request that fetches your
achievement data. Steam Sign-in's connection doesn't have a direct equivalent for that specific
piece of data, so SGI fetches it as a separate, quick follow-up request and fills it in — this is
a normal part of loading achievements under Steam Sign-in, not an error, and it settles a moment
after the achievement list itself first appears.
