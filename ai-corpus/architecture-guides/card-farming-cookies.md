# Why Card Farming and Inventory Manager sometimes need extra sign-in

Generated corpus content (see `.claude/skills/generate-architecture-guide/SKILL.md`). Regenerate
via that skill if this behavior changes; don't hand-edit to patch small drift.

## Why these two features need a Steam Community session

Card Farming and Inventory Manager both need a live Steam Community web session (the same kind of
session your browser holds when you're logged into steamcommunity.com) to do their job — reading
your inventory, farming card drops, and so on. That's a separate thing from being signed in to SGI
itself, which is why both features show their own "connect your Steam Community session" step
before you can use them.

## Whether that step is automatic depends on your plan, not just how you're signed in

It's tempting to assume Steam Sign-in accounts always get this automatically and Legacy Sign-in
accounts always have to do it by hand — but the real deciding factor is your subscription tier.
Automatic acquisition (no cookies to find or paste yourself) is a Gamer-tier feature for **both**
sign-in methods. On a lower tier, both Steam Sign-in and Legacy Sign-in accounts fall back to the
same manual step.

## Gamer tier + Steam Sign-in: fully automatic, every time, no window at all

If you're on Gamer tier and signed in with Steam Sign-in, SGI mints this web session directly from
your already-authenticated connection — there's no separate sign-in window and no visible pause
beyond a normal loading state. This happens fresh each time it's needed, so there's nothing to
"remember" or refresh for this case; it's simply always current.

## Gamer tier + Legacy Sign-in: a hidden sign-in window, real the first time

If you're on Gamer tier but signed in with Legacy Sign-in, SGI has no existing live connection to
derive a session from, so it uses a small, normally-invisible sign-in window instead. The first
time (or whenever your underlying Steam Community session has actually gone stale), that window
becomes visible so you can sign in for real. Once that succeeds, SGI keeps reusing that session
behind the scenes, so a real visible window doesn't need to reappear every time — that's checked
silently in the background instead.

## On a lower tier (either sign-in method): paste your cookies once, then SGI remembers them

Without Gamer tier, neither sign-in method gets an automatic connection. Instead, you paste your
Steam Community cookies in once — either from the Settings modal's Steam Credentials tab, or from
Card Farming's/Inventory Manager's own connect prompt the first time you open them — and SGI saves
that set securely so you don't have to re-enter it every time you use either feature.

## Automatic refresh when a session goes stale is a Gamer-tier convenience

Over time any Steam Community session can expire. If your cookies were acquired automatically
(Gamer tier, either sign-in method), SGI can quietly try to refresh them on its own the next time
they're needed, with no prompt if that succeeds. A manually-pasted cookie set doesn't have that
same live connection to refresh from, so once it's confirmed expired, you're asked to reconnect —
by pasting a fresh set — rather than SGI silently renewing it for you. This applies regardless of
tier: it's simply that only an automatically-acquired session has something to silently refresh.
