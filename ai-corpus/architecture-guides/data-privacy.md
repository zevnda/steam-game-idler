# Where your data lives, and what leaves your machine

Generated corpus content (see `.claude/skills/generate-architecture-guide/SKILL.md`) — verified
against `src-tauri/src/platform.rs`. Regenerate via that skill if this behavior changes; don't
hand-edit to patch small drift.

## Everything is stored locally

Your settings, cache, and log files are all stored locally on your own computer, in the app's own
data folder (or, if you're running the portable Windows build, right alongside the app's own
executable instead) — never uploaded anywhere or synced to any SGI-controlled server.

## Finding your log file

If you ever need to find your log file (for example, to attach to a bug report), you can reveal it
in your file explorer from the Debug tab in Settings, rather than needing to know the exact folder
path yourself.

## What actually reaches the internet

A few things do talk to servers outside your machine as part of normal operation: SGI talks
directly to Steam's own servers for anything Steam-related (achievement data, your games library,
free-game detection, and so on), and separately checks in with SGI's own licensing server
periodically to confirm your Pro subscription status if you have one. Neither of these routes your
data through any third party beyond Steam itself and SGI's own infrastructure.
