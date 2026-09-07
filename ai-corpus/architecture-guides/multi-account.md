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
automation.
