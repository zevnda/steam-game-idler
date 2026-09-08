# How automatic free game detection and claiming works

Generated corpus content (see `.claude/skills/generate-architecture-guide/SKILL.md`) — verified
against `src-tauri/src/free_games/{mod,commands,discovery,store_claim}.rs`,
`src-tauri/src/local_steam/free_game_claim.rs`, and `src/features/free-games/hooks/
useFreeGamesWatcher.ts`/`useClaimFreeGame.ts`. Regenerate via that skill if this behavior changes;
don't hand-edit to patch small drift.

## How SGI finds free games

While SGI is running, it checks Steam's public storefront roughly once an hour for games currently
listed as temporarily free (100%-off promotions on the storefront's Specials listing) — not
permanently free-to-play titles, which wouldn't need claiming in the first place. This is a plain,
unauthenticated check against Steam's own store page — it works identically no matter which
sign-in method you're using, and doesn't need your account for the detection step itself.

## The app needs to be running

Detection only happens while SGI is open — it isn't a separate background service that keeps
running after you close the app. If a free game shows up and gets claimed while SGI is closed, SGI
won't have caught it; reopening the app triggers a fresh check.

## How claiming actually works

Whether it's you clicking "Claim" on a game in the Free Games tab, or SGI auto-redeeming one for
you, claiming happens the same way for both sign-in methods: SGI sends the same authenticated
request Steam's own store "Add to Cart"/claim button sends, directly from inside the app.

- If you're signed in with an agent-mode account, no browser window or login prompt ever appears
  for this — SGI already has what it needs from your active session.
- If you're signed in with the local Steam-client (CLI) method, claiming needs a Steam Store web
  session that the local Steam client itself doesn't hand over automatically. The first time you
  claim a game (or turn on auto-redeem) with a given account, a real Steam sign-in window opens
  once so you can authorize it; after that, SGI reuses that saved session silently for every future
  claim, without showing a window again — unless that saved session eventually expires entirely, in
  which case a sign-in window appears again just that once. You can also refresh this manually from
  the Free Games settings tab ("Reauthenticate"/"Sign out").

After a claim request, SGI double-checks your library to confirm the game actually landed before
reporting success — a real grant doesn't always show up instantly. If that check hasn't caught up
within a few seconds, SGI reports the claim as unconfirmed rather than guessing, but keeps quietly
rechecking for a short while after; if it turns out the game was actually granted, SGI corrects
itself and updates automatically without you needing to retry anything.

## Notification vs. automatic claiming

By default, SGI notifies you when it finds a free game so you can review and claim it yourself
from the Free Games tab. Automatically claiming it to your account on your behalf (no action
needed from you, once you've turned it on) is a Gamer-tier feature — everyone else still gets the
notification and a one-click manual claim.
