# How the max playtime cap works

Generated corpus content (see `.claude/skills/generate-architecture-guide/SKILL.md`) — verified
against `src-tauri/src/max_playtime/enforcement.rs` and `achievement_unlocker/manager.rs`.
Regenerate via that skill if this behavior changes; don't hand-edit to patch small drift.

## What it does

If you set a maximum playtime for a game, SGI stops counting that game toward further automation
once your total playtime for it reaches that cap — the idea is to stop a game from accumulating
more hours than you actually want, even while it's being idled or automated.

## It's enforced differently depending on what's idling the game

For manual idling and Auto Idle, SGI checks roughly once a minute whether a currently-idling game
has crossed its cap, and stops idling it the instant it has — you don't need to notice and stop it
yourself. Card Farming and the Achievement Unlocker each check the same cap on their own schedule
instead (when picking up the next game to work on), since they already track their own active-game
state independently. Either way, the practical result is the same: once you hit the cap, that game
stops accumulating further playtime from SGI's automation.

## A capped game is skipped before it even starts

Anywhere SGI is about to start automatically idling a batch of games (Auto Idle triggering, the
Achievement Unlocker scanning its queue), a game already over its cap is skipped from the start
rather than being idled and then immediately stopped.
