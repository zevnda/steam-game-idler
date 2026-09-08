# Custom online status and idle messages while idling

Generated corpus content (see `.claude/skills/generate-architecture-guide/SKILL.md`). Regenerate
via that skill if this behavior changes; don't hand-edit to patch small drift.

## Only available via Steam Sign-in

Setting your Steam online status, and showing a custom message to friends instead of the default
"Playing [game]" while idling, only works when you're signed in with Steam Sign-in — there's no
equivalent for Legacy Sign-in, since it relies on a live connection Legacy Sign-in doesn't keep the
same way.

## Online status picker vs. custom message

Choosing your online status (online, away, invisible, and so on) while idling is free at every
tier. The custom idle status *message* shown to friends is a Gamer-tier feature — the status picker
itself isn't gated.

## It re-applies itself automatically — no periodic re-sending needed

Unlike Legacy Sign-in's "Always online" toggle, which has to keep periodically refreshing your
status to counteract your local Steam client's own away-detection, a Steam Sign-in status doesn't
drift or decay on its own — there's no local-client idle detection working against it in the first
place. So SGI doesn't run anything on a repeating timer to keep it applied.

What it does do is reapply your saved status automatically at the moments it could otherwise be
lost: right after signing in (including when SGI silently resumes a previous session on launch),
and after a brief connection hiccup reconnects behind the scenes while you're already signed in.
Your custom idle message works the same way from the opposite direction — it's included fresh
every time SGI announces which games you're currently idling, so it's always in sync with whatever
you last saved, whether you set it before, during, or after idling started. Either way, you never
need to re-enter or re-save anything just because your connection blipped or you restarted the app.

A custom idle status message only actually shows to friends while you're idling a game you
genuinely own; it won't display against a game you don't own.

If your subscription drops below Gamer tier, your saved custom idle message is automatically
cleared the next time SGI checks your subscription status — your online status picker selection
(free at every tier) isn't affected by this.

## Legacy Sign-in has a different feature for a similar goal

Legacy Sign-in doesn't have a presence/status feature, but has a separate "Always online" toggle
instead, which just stops your local Steam client from marking you as away — a different mechanism
solving a different problem, not a substitute for the custom status message.
