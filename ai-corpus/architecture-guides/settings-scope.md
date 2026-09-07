# Why some settings follow you between accounts and others don't

Generated corpus content (see `.claude/skills/generate-architecture-guide/SKILL.md`). Regenerate
via that skill if this behavior changes; don't hand-edit to patch small drift.

## Two kinds of settings

Some SGI settings belong to the app installation itself, not to any particular Steam account — for
example, a custom Steam Web API key override applies no matter which Steam account you're
currently using. Other settings genuinely belong to one specific Steam account — for example,
Achievement Unlocker's delay/schedule preferences and Card Farming's per-account settings are saved
per Steam account, not shared app-wide.

## Why this matters

If you switch between multiple signed-in accounts and notice that some settings look different (or
reset to default) for the account you just switched to, that's expected — those particular settings
are tied to that Steam account specifically, not shared across every account you have signed in.
Account-wide settings (like your API key override) stay the same no matter which account you're
viewing.
