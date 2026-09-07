# How automatic free game detection and claiming works

Generated corpus content (see `.claude/skills/generate-architecture-guide/SKILL.md`) — verified
against `src-tauri/src/free_games/discovery.rs` and `src/features/free-games/hooks/
useFreeGamesWatcher.ts`. Regenerate via that skill if this behavior changes; don't hand-edit to
patch small drift.

## How SGI finds free games

While SGI is running, it checks Steam's public storefront roughly once an hour for games currently
listed as free-to-keep promotions. This is a plain, unauthenticated check against Steam's own
store page — it works identically no matter which sign-in method you're using, and doesn't need
your account for the detection step itself.

## The app needs to be running

Detection only happens while SGI is open — it isn't a separate background service that keeps
running after you close the app. If a free game shows up and gets claimed while SGI is closed, SGI
won't have caught it; reopening the app triggers a fresh check.

## Notification vs. automatic claiming

By default, SGI notifies you when it finds a free game so you can claim it yourself on Steam.
Automatically claiming it to your account on your behalf (no action needed from you) is a Gamer-tier
feature — everyone else still gets the notification.
