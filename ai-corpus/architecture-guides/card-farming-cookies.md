# Why Card Farming and Inventory Manager sometimes need extra sign-in

Generated corpus content (see `.claude/skills/generate-architecture-guide/SKILL.md`). Regenerate
via that skill if this behavior changes; don't hand-edit to patch small drift.

## Why these two features need a Steam Community session

Card Farming and Inventory Manager both need a live Steam Community web session (the same kind of
session your browser holds when you're logged into steamcommunity.com) to do their job — reading
your inventory, farming card drops, and so on. That's a separate thing from being signed in to SGI
itself.

## Steam Sign-in gets this automatically

If you're signed in with Steam Sign-in, SGI can get this web session on its own, silently, with no
extra prompt from you.

## Legacy Sign-in needs one extra step the first time

If you're on Legacy Sign-in, SGI has no existing session to reuse, so the first time Card Farming
or Inventory Manager actually needs one, a small sign-in window appears so you can create it. After
that, SGI reuses it.

## Automatic refresh is a Gamer-tier convenience

Keeping that session automatically refreshed over time (so it doesn't expire) is a Gamer-tier
feature. On lower tiers, you can still use both features by manually pasting your Steam Community
cookies into Settings when needed.
