# How multiple Steam accounts work in SGI

Generated corpus content (see `.claude/skills/generate-architecture-guide/SKILL.md`). Regenerate
via that skill if this behavior changes; don't hand-edit to patch small drift.

## One app, several accounts at once

If you sign in with Steam Sign-in, SGI can keep several Steam accounts signed in and running
automation at the same time, in the same app window — you switch between them with the account
switcher rather than signing out and back in. Each account's idling, achievement unlocking, and
card farming keeps running independently of which account you're currently viewing.

## Legacy Sign-in is limited to one account

Legacy Sign-in only ever supports one signed-in account at a time, because it works through a real
local Steam client on your machine, and a Steam client itself can only be logged into one account
at once. This isn't a Steam Game Idler limitation specifically — it's a real constraint of how
Legacy Sign-in works.

## How many Steam Sign-in accounts you can run at once

The number of Steam Sign-in accounts you can have signed in and running automation simultaneously
depends on your subscription: Free allows 1, Casual allows up to 3, and Gamer allows up to 10.

## Downgrading never signs you out

If your subscription lapses or you switch to a lower tier while you have more accounts signed in
than that tier allows, SGI never force-signs-out any of your accounts. Instead, you simply won't
be able to switch to an account beyond your new tier's limit until you sign one out yourself or
your subscription covers it again. Signing an account out is the only thing that stops its
automation — an account that's now over your tier's limit keeps any automation it already had
running in the background exactly as before; the limit only blocks switching to it, not the
automation itself.

If the account you were actively viewing at the moment of a downgrade is the one that becomes
over-limit, SGI automatically switches your active view back to the very first account you ever
added to the app (which is always allowed, since every tier permits at least one account). This
is just so you're not stuck looking at a now-locked account with no obvious way back — it doesn't
change what's running in the background for any account.

## Signing out only affects the account you sign out

Signing out is per-account: it stops that one account's idling, card farming, and achievement
unlocking, then ends its session, while every other signed-in account keeps running untouched. If
that account had automation running, SGI asks you to confirm first, since sign-out will stop it;
if it had nothing running, sign-out happens immediately with no confirmation needed.

Only once you've signed out of every account — not just one of several — does SGI do a final
cleanup sweep to make sure nothing Steam-related is left running in the background. While any
other account is still signed in, that broader cleanup never runs, so it can't interrupt another
account's automation.

## When Steam signs you in elsewhere

Steam Sign-in only allows one active session per account at a time — this is a Steam limitation,
not something SGI imposes. If that same account gets signed in somewhere else (another device, a
different app, or your own real Steam client), Steam ends SGI's session for it, and SGI notices
right away: that account's card farming and achievement unlocking are stopped automatically, its
row in the account switcher is flagged, and a reconnect prompt opens on its own — you don't have
to go looking for it.

Reconnecting doesn't ask for your password again; it resumes the account using the session SGI
already has saved for it. If that fails (or there's nothing left to resume), you're offered the
option to sign that account back in a different way instead. This only affects Steam Sign-in
accounts — a Legacy Sign-in account runs through your own already-running local Steam client, so
there's no separate SGI session for Steam to displace.
