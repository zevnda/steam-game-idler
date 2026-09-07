<!-- url: https://steamgameidler.com/docs/troubleshooting -->
# Platform and sign-in differences

This file is source content for the AI Assistant's knowledge base (see `scripts/build-ai-corpus.mjs`)
— a user-facing summary of behavior that genuinely differs by operating system or sign-in method.
Keep this free of internal implementation detail (module names, code paths); it should read like a
support article, not a developer doc.

## Windows and Linux support

Steam Game Idler runs on both Windows and Linux desktop, but with different capability levels:

- **Windows** supports both sign-in methods: Steam Sign-in (recommended) and Legacy Sign-in
  (fallback, requires a real local Steam client).
- **Linux** supports Steam Sign-in only. There is no Legacy Sign-in option on Linux at all — the
  sign-in screen simply doesn't show that button on Linux.

## Steam Sign-in vs. Legacy Sign-in

- **Steam Sign-in** (username/password or QR code) is the recommended way to sign in. It doesn't
  need a local Steam client installed or running at all.
- **Legacy Sign-in** is a fallback for users who prefer not to enter their Steam credentials into
  SGI. It requires a real, currently-running, signed-in local Steam client on the same machine.
  Windows only.

### Features that work differently depending on which one you use

- **Game Coordinator titles** — Team Fortress 2, Dota 2, Counter-Strike 2, Left 4 Dead 2, and
  Portal 2 — are not supported for idling/achievements when signed in with Steam Sign-in. Use
  Legacy Sign-in (Windows only) for these specific games.
- **Idling** works differently under the hood: Legacy Sign-in idles one game per background
  process, while Steam Sign-in can idle up to 32 games from a single connection. In practice this
  just means Steam Sign-in has a higher idling limit.
- **Card Farming's automatic Steam cookie retrieval** works instantly and silently under Steam
  Sign-in. Under Legacy Sign-in, the first time it's needed, a small sign-in window appears since
  there's no other way to get a session.
- **Custom idle status message** (the text shown to friends instead of "Playing [game]") and the
  online status picker are only available when signed in with Steam Sign-in — there's no
  equivalent under Legacy Sign-in. An "Anti-AFK" feature exists for Legacy Sign-in instead, which
  keeps the local Steam client from showing you as away.
- Only one Legacy Sign-in account can be signed in at a time (a real Steam client can only be
  logged into one account). Multiple Steam Sign-in accounts can be signed in at once
  (concurrency limit depends on your subscription tier).

## Known Linux-only quirks

These are limitations of the underlying Linux desktop environment, not bugs in SGI:

- No rounded window corners (Windows gets this for free from Windows 11; Linux window managers
  don't do this automatically the same way).
- Clicking the system tray icon always opens the tray menu, rather than showing/hiding the window
  — this is how the Linux tray protocol works, there's no separate left-click behavior available.
- Occasionally an extra click is needed after dragging the title bar before other buttons respond
  — a known upstream issue in the underlying app framework on Linux.
- The tray's "Reset window position" option doesn't do anything on Linux — the Wayland display
  protocol doesn't allow apps to set their own window position.
- The AppImage build can feel slightly less smooth than the .deb/.rpm builds. If you're on Linux
  and performance matters to you, installing via .deb or .rpm (if your distro supports either) is
  recommended over the AppImage.
- Portable mode (running the app without installing it) is a Windows-only concept — every Linux
  package format installs normally and supports auto-updates.

## Subscription tiers and where they apply

Every core feature (Card Farming, Achievement Unlocker, Achievement Manager, Inventory Manager,
Free Games, Idling, Auto Idle, Favorites, Playtime Booster) is completely free and always will be.
PRO (Casual and Gamer tiers) unlocks convenience/automation extras on top — see the Pro comparison
table in the docs for exactly what each tier includes. A Pro subscription is tied to a license key,
not to any specific Steam account, and works the same regardless of whether you sign in with Steam
Sign-in or Legacy Sign-in.
