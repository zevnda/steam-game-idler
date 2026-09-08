# Why achievement rarity percentages can look different between sign-in methods

Generated corpus content (see `.claude/skills/generate-architecture-guide/SKILL.md`) — verified
against `src-tauri/src/achievements/web_api.rs`, `src-tauri/src/achievements/commands.rs`, and
`libs/SteamUtility/Backends/SteamworksLocalBackend.cs`. Regenerate via that skill if this behavior
changes; don't hand-edit to patch small drift.

## Where the rarity percentage comes from

The "X% of players have this achievement" figure comes from Steam itself — it's public data Steam
publishes per game, the same number the Steam client itself shows on an achievement's tooltip. It
has nothing to do with your own account or session.

## Why it can occasionally be missing under Steam Sign-in

Legacy Sign-in gets this percentage directly as part of the same request that fetches your
achievement data — your local Steam client already knows it, so there's no extra step.

Steam Sign-in's connection doesn't have a direct equivalent for that specific piece of data, so SGI
fills it in with a separate, quick follow-up request to Steam's public rarity endpoint before
handing the achievement list back to you. That follow-up request happens entirely behind the
scenes as part of the same loading step — you don't see the achievement list appear first and then
have rarity numbers pop in afterward; the whole list (rarity included, wherever it's available)
loads together in one step, which is why loading achievements under Steam Sign-in can take a touch
longer than under Legacy Sign-in. If that follow-up request itself fails or times out, the
achievement list still loads normally — the affected achievements simply show without a rarity pill
rather than the whole list failing to load, and they sort to the bottom whenever you sort the list
by rarity/global unlock percentage.
