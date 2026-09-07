# How SGI updates itself

Generated corpus content (see `.claude/skills/generate-architecture-guide/SKILL.md`). Regenerate
via that skill if this behavior changes; don't hand-edit to patch small drift.

## Update checks and verification

SGI checks for new versions automatically. Every update is cryptographically signed by the
developer, and SGI verifies that signature before installing anything — an update that isn't
genuinely signed by the developer is rejected, so a tampered or fake update can't be installed this
way.

## How you're offered an update

Most of the time, a new version shows up as a button you click to install when you're ready.
Occasionally, for a release the developer marks as important, SGI installs it automatically the
next time it starts, without needing you to click anything — this only affects app instances that
haven't already checked once since launch.

## Portable vs. installed

If you're running the Windows portable (zip) build, SGI doesn't auto-update at all — you'd
download a new version yourself when you want one. Every other install method, including every
Linux packaging format, supports auto-updating normally.
