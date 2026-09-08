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
yourself. The Achievement Unlocker checks the same cap on its own schedule instead (when picking up
the next game to work on), since it already tracks its own active-game state independently.

**Card Farming does not currently check this cap at all.** A game you're farming cards for keeps
accumulating playtime from Card Farming regardless of any max-playtime cap you've set for it — the
cap only takes effect for that game once something else (manual idling, Auto Idle, or the
Achievement Unlocker) is also idling it. If you want a hard cap on a game's playtime while card
farming it, there's currently no built-in way to enforce that from within Card Farming itself.

## A capped game is skipped before it even starts

Anywhere SGI is about to start automatically idling a batch of games (Auto Idle triggering, the
Achievement Unlocker scanning its queue), a game already over its cap is skipped from the start
rather than being idled and then immediately stopped. Card Farming has no equivalent skip check,
consistent with it not enforcing the cap at all (see above).
