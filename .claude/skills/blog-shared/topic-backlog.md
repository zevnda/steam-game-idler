# Blog topic backlog

The blog's memory, shared by `/find-blog-topics` and `/create-blog-post`. Both skills read it
first and update it before finishing. This file is what keeps topics from being proposed twice,
rejected ones from coming back without new evidence, and news sweeps from re-reading the same
weeks. Newest entries go first in each section. Keep entries short; full research lives in the
gitignored `seo-blog-research-{slug}.md` files.

**Last discovery sweep:** 2026-10-23 (two-day window: only Valve item was the Oct 21 client update - bug fixes only; Protobufs changes were Remote Play/audio; no seasonal event in the next 6 weeks fits - nothing queued)

## Queued - passed the gate, not written yet

<!-- Format:
### <working title>
- **Primary keyword:** ... | **Type:** news (time-sensitive) / evergreen | **Score:** S1..S5 = n/10
- **Why now / evidence:** demand + source links (dated)
- **Angle / information gain:** ...
- **SGI tie:** ... (code area)
- **Write by:** YYYY-MM-DD (news) or - (evergreen) | **Added:** YYYY-MM-DD by find-blog-topics
-->

## Planned app work - separate commit, do next (user confirmed 2026-10-20)

### Move the desktop app's sidebar ads off `/supported-games/*`
- **Why:** the docs site's `/supported-games/*` pages were removed (2026-10-20). The app's
  `src/shared/components/pro/AdSlot.tsx` loads `https://steamgameidler.com/supported-games/{slug}`
  in an iframe (rotating through a hardcoded slug list) to request Google ads, so **from the deploy
  that removed them, in-app sidebar ads load a 404 page instead of an ad** until this is done.
- **To do:** decide the replacement (a dedicated, minimal ad-container route on the docs site,
  kept out of the sitemap and `noindex`, like the `(embed)` changelog route; or another ad
  approach), update `AdSlot.tsx`, and release. Already-installed old versions keep requesting
  the old URLs until they update.
- **Also:** the Vercel Firewall rule that 403s `/supported-games/*` for non-app visitors can be
  removed once the route is gone, so the old URLs return a clean 404 (Search Console still lists
  45 old supported-games URLs; 404 is the right "gone" signal). Re-point that rule at whatever
  route replaces it, if the new ad container needs the same protection.

## Planned docs updates - do after the blog launch (user confirmed 2026-10-20)

Not posts: these intents belong on existing docs pages. Do them once the launch posts are
published. GSC figures are 2026-07-20 to 2026-10-17; re-pull before starting.

- **`/docs/features/playtime-booster`**: "how to increase steam playtime without playing" (77),
  "steam boost hours" (51 @ 9.8), "how to boost hours on steam games" (42), "boost steam hours"
  (39 @ 9.4) - ~430 impressions, 8 clicks. Use searchers' wording ("hours", "boost") and add a
  short how-to near the top.
- **`/docs/steam-credentials`**: "sessionid steam" (123, was 31), "steamloginsecure" (111),
  "steam session id" (106, was 2) - ~490 impressions, 3 clicks, and rising. A clear "where to find
  your sessionid / steamLoginSecure" section and a title that names them would capture it.
- **`/docs/features/achievement-manager` (protected achievements)** - added 2026-10-20: ~650
  impressions / ~7 clicks at pos ~8 ("steam achievement manager protected achievements" 359,
  "steam protected achievements" 99, "...how to unlock protected achievements" 38, and SAM's own
  error text "sorry but this is a protected achievement and cannot be managed..." 44). All of it
  lands on the index page. The dedicated `special-flags` page is indexed but had **zero**
  impressions in 90 days. Strengthen the index page's "Protected achievements" section: answer
  "can they be unlocked or bypassed?" directly, and quote SAM's exact error message. Alternatively,
  retitle `special-flags` so Google prefers it. Pick one, so the two don't split the intent.
- **Review the six `| SGI` docs titles - on/after 2026-11-17** (added 2026-10-23): the
  keyword-first `seoTitle`s from #2167/#2175 (achievement-manager, special-flags,
  achievement-unlocker, card-farming, playtime-booster, steam-credentials) use `| SGI` because
  `| Steam Game Idler` would push them to 63-72 chars. Title rule: keyword phrase first, then
  `| Steam Game Idler`; `| SGI` only when the full brand would overrun ~60 chars. Don't switch
  every page to `| SGI` (the site gets ~4,400 impressions for "steam game idler" vs ~44 for
  "sgi steam"). After 4 weeks of data, compare each page's CTR/position with the 4 weeks before
  2026-10-20 and check whether Google rewrites the titles shown in results. Change one only if
  it underperforms or Google rewrites it, and keep the keyword phrase as-is. The
  achievement-unlocker title's `:` (vs ` - ` elsewhere) is cosmetic only; switch it to ` - `
  only if that title is being edited anyway.
- **`/docs/features/card-farming`**: "how to farm steam trading cards" and variants ~340
  impressions at pos 6-8, ~3 clicks. Make sure the opening answers the how-to directly.

## Written - awaiting merge

<!-- ### <title> - `docs/blog/<slug>.mdx` - written YYYY-MM-DD -->

## Published

<!-- ### <title> - `/blog/<slug>` - published YYYY-MM-DD
- Primary keyword: ... | Revisit: YYYY-MM-DD (why: beta ends / sale season / yearly refresh) -->

### Can You Remove, Hide or Reset Steam Achievements? What Actually Works - `/blog/remove-steam-achievements` - published 2026-10-20
- Primary keyword: can you remove steam achievements | Revisit: 2027-10 (yearly), or if Valve changes privacy/private-game rules or adds an official reset
- Indexed 2026-10-20 (URL Inspection 2026-10-21: Submitted and indexed, canonical matches; re-checked 2026-10-23: PASS).

### How to Level Up on Steam: Every Source of XP, and What It Costs - `/blog/how-to-level-up-on-steam` - published 2026-10-20
- Primary keyword: how to level up on steam | Revisit: each Winter/Summer Sale (new Seasonal Badge), and before the 2026 Steam Awards nominations (late Nov) to confirm the badge
- Indexed 2026-10-20 (URL Inspection 2026-10-21: Submitted and indexed, canonical matches; re-checked 2026-10-23: PASS).

### How Steam Trading Cards Work: Drops, Badges, Booster Packs and Selling - `/blog/how-steam-trading-cards-work` - published 2026-10-20
- Primary keyword: how do steam trading cards work | Revisit: 2027-10 (yearly refresh), or if Valve changes card/booster/badge rules
- Indexed 2026-10-20 (URL Inspection: Submitted and indexed; re-checked 2026-10-23: PASS).

### Steam Achievement Sets: What the Beta Changes for Achievement Hunters - `/blog/steam-achievement-sets` - published 2026-10-20
- Primary keyword: steam achievement sets | Revisit: when Achievement Sets leave beta (check the Steam news API), then set `updated:`
- Indexed 2026-10-20 (URL Inspection: Submitted and indexed; re-checked 2026-10-23: PASS).

## Rejected - don't re-propose without new evidence

<!-- ### <topic>
- Rejected YYYY-MM-DD: gate H1/H5/... - one-line evidence
- Revisit only if: <the specific change that would flip it> -->

### `GetOwnedGames` "include all free games" flag
- Rejected 2026-10-21: H2 - datamined only (`include_all_free_games` added to
  `CPlayer_GetOwnedGames_Request`, SteamTracking/Protobufs commit 2026-10-21), no announcement or
  visible behaviour. Dev-relevant: SGI calls `GetOwnedGames` in both modes (`games/web_api.rs`,
  `OwnershipManager.cs`).
- Revisit only if: Valve announces a change to how free games show in libraries/playtime.

### Protected achievements post ("can you unlock protected Steam achievements?")
- Rejected 2026-10-20: H5 - ~650 impressions already land on `/docs/features/achievement-manager`
  and `special-flags` targets the same intent. Logged as a docs update instead.
- Revisit only if: the docs fix lands and GSC still shows unanswered "bypass/unlock protected" demand.

### Can you get banned for idling Steam games?
- Rejected 2026-10-20: user decision (brand/legal, not SEO). Research found the Steam Subscriber
  Agreement has banned "Automation" that fakes playtime or earns "rewards or progress without
  genuine user input" since its 2025-09-18 revision (see `seo-blog-research-steam-idle-ban.md`).
  An honest post must say so; one that omits it would mislead.
- Revisit only if: the user asks for it, or Valve changes/clarifies that clause.
- Also noted for the user (not acted on, their call): the home FAQ and docs achievement-unlocker
  "Is it safe?" copy doesn't mention the clause.

### "How to unlock Steam achievements" guide post
- Rejected 2026-10-20: H5 - ~1,100 impressions already land on
  `/docs/features/achievement-unlocker` (pos ~7), and `seo-brief-achievement-unlocker.md` targets
  this cluster on that page.
- Revisit only if: that brief is dropped, or GSC shows the page losing these queries.

### "How to farm Steam trading cards" guide post
- Rejected 2026-10-20: H5 - the intent belongs to `/docs/features/card-farming` (see the
  docs-update suggestion).
- Revisit only if: the docs page can't hold a full guide without hurting its product focus.

### Steam limited user accounts (and card drops)
- Rejected 2026-10-20: H6/S2 - Valve's support FAQ answers it fully; autocomplete demand is about
  family sharing and gift cards, and the card-drop angle is already on the card-drop-times page.
- Revisit only if: GSC shows "limited account" + cards/drops queries reaching the site.

### Steam Next Fest / themed fests / Oct 13 client update (Big Art Mode)
- Rejected 2026-10-20: H1 - demos and themed sales award no cards or achievements; the client
  update is Big Picture UI only.
- Revisit only if: an event or update changes cards, achievements, playtime or idling.

## Seasonal calendar

Recurring moments with predictable demand. Refresh from the Steamworks upcoming-events page (see
sources.md) on each sweep, and pitch seasonal posts 2-3 weeks before the event so they can be
indexed in time.

| Event | Dates | Notes |
|---|---|---|
| Steam Winter Sale 2026 | 17 Dec 2026 - 4 Jan 2027 (confirmed 2026-10-20) | Pitch window opens ~late Nov (sale page not live as of 2026-10-20, so nothing to verify yet). Verify what the sale awards (event badge, stickers, Points items, cards?) from the sale page before a cards/badges angle. |
| Steam Spring Sale 2027 | 18 - 25 Mar 2027 (confirmed) | Same check. |
| Steam Summer Sale 2027 | 24 Jun - 8 Jul 2027 (confirmed) | Same check. |
| Steam Autumn Sale | 2026 edition began 1 Oct 2026 (Steam news); 2027 TBD | Earlier than the old late-November habit - don't assume dates. |
| Steam Next Fest | 22 Feb - 1 Mar 2027, 14 - 21 Jun 2027 (confirmed) | Demos have no cards/achievements - usually *not* a fit. |
| Themed fests | many; see Steamworks upcoming events | Genre sales - not a fit unless cards/achievements change. |
