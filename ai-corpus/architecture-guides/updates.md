# How SGI updates itself

Generated corpus content (see `.claude/skills/generate-architecture-guide/SKILL.md`). Regenerate
via that skill if this behavior changes; don't hand-edit to patch small drift.

## Update checks and verification

SGI checks for new versions automatically — once when the app starts, then again every few
minutes while it keeps running. It checks two locations for the update manifest (a GitHub-hosted
file, with a backup location) so a check still succeeds even if one of them is temporarily
unreachable from your network.

Every update is cryptographically signed by the developer, and SGI verifies that signature before
installing anything — an update that isn't genuinely signed by the developer is rejected, so a
tampered or fake update can't be installed this way.

## How you're offered an update

Most of the time, when a newer version is found, a button appears in the titlebar for you to click
and install whenever you're ready — nothing installs until you do.

Two situations skip that button and install automatically instead, with no click needed:

- **The developer marks a particular release as important.** That kind of update installs itself
  and relaunches the app the moment any check notices it — including while you're already using
  the app, not just when it starts up. This isn't limited to accounts/instances that haven't
  checked yet; it applies to every running instance's next check, whenever that happens to be.
- **The very first check after the app launches**, regardless of whether the pending update is
  one the developer flagged as important or not. This exists so you're never left running an
  already-superseded version just because the update happened to be a small one — every check
  after that first one goes back to the normal click-to-install button instead.

You'll also see the changelog pop up automatically the first time the app reopens after either of
these silent installs, so you can see what changed even though you didn't click anything to get it.

Separately, the system tray icon also has its own "Check for updates" item. Using it behaves a
little differently from the titlebar button: if it finds an update, it installs immediately with no
confirmation step, since the tray has no window open to show a button in.

## Portable vs. installed

Auto-updating depends on how you installed SGI, not just which OS you're on:

- The **Windows portable (zip) build** doesn't auto-update at all — you'd download and replace it
  yourself when you want a new version.
- The **Windows installed build** and the **Linux AppImage** both auto-update normally.
- The **Linux `.deb`/`.rpm` packages** also don't auto-update — those are tied to your system's own
  package manager instead, so you'd install a newer package manually the same way you'd update any
  other `.deb`/`.rpm` application. Linux has no "portable mode" concept the way Windows does; this
  is simply a case where the app can't safely replace its own files because they're owned by the
  system package manager.
