# How themes, backgrounds, and fonts work

Generated corpus content (see `.claude/skills/generate-architecture-guide/SKILL.md`). Regenerate
via that skill if this behavior changes; don't hand-edit to patch small drift.

## Switching is instant

Changing SGI's theme, font, or custom background image in Settings → Customization applies
immediately — no restart needed — and your choice persists the next time you open the app.

## What's free vs. Casual-tier

The default theme and default font are available to everyone. Every other theme, a custom
background image, and every other font are Casual-tier features.

## Custom background image

A custom background image you upload replaces the default dashboard backdrop with a blurred,
scrimmed version of your image so foreground text and cards stay readable over it. You can clear it
back to the default at any time from the same Settings tab.

## Why your theme or font never flashes to default when you open the app

Your last-applied theme and font are also remembered in a small local cache on your device, separate
from your saved settings. When SGI opens, that cached choice is painted on the very first frame —
before the rest of the app has even finished loading — so returning users see their actual theme and
font right away instead of a flash of the default look that then corrects itself a moment later.

This first-frame paint is provisional: at that point nothing about your account or subscription has
loaded yet, so it can't confirm you're still eligible for a Casual-gated theme or font. Once the app
finishes loading your real settings and confirms your subscription status (which happens every time
you open the app, and is also rechecked periodically while the app stays open), it reconciles the
provisional appearance against what you're actually entitled to right now. If your cached choice
turns out to be a Casual-gated theme or font and you're not currently eligible, it's swapped back to
the default at that point and the local cache is corrected to match — you're not left showing a theme
you're no longer entitled to.

## What happens if your Casual access lapses

If your subscription lapses while a Casual-gated theme, font, or background image is active, each of
them stops being applied once the app next confirms your subscription status — falling back to the
default theme, default font, and the plain default background respectively. This isn't limited to
app restarts: because subscription status is rechecked periodically while the app stays open, a
lapse can also revert an active theme or font mid-session without needing to relaunch.

Importantly, this reversion only changes what's currently displayed — it doesn't erase your saved
choice or delete your uploaded background image. If you resubscribe, your previous theme, font, and
background reapply automatically without needing to re-pick them, since your selection was never
actually cleared, only paused from rendering while you were ineligible. A background image can also
still be explicitly removed at any time regardless of subscription status, so a downgrade never
leaves you with an unwanted file you have no way to delete.
