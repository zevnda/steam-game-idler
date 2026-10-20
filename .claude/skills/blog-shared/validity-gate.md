# Validity gate

Decide *after* research and *before* writing. Record each gate's result and its evidence in the
brief. Google's helpful-content signals are site-wide: a run of weak, off-topic or scaled posts
can drag down the docs and home page that currently rank well. So when in doubt, refuse or
reframe.

## Hard stops - any one means REFUSE

| # | Gate | Fails when |
|---|---|---|
| H1 | **Topical fit** | The topic has no genuine connection to what this site is an authority on: Steam accounts and libraries, idling/playtime, trading cards/badges/XP, achievements/stats, the Steam inventory and market, free-game licences, and Steam client/platform changes that touch these. General gaming news, game reviews, hardware, unrelated platforms (Epic, consoles) or generic "productivity" topics fail. The connection to SGI must be real, not bolted on. |
| H2 | **Verifiability** | The core claim rests on rumour, a single unconfirmed source, datamined strings with no corroboration, or sources that contradict each other with no way to settle it. (Exception: a clearly-labelled explainer of an *officially announced* beta is fine.) |
| H3 | **Harm / policy** | It would promote or instruct cheating/VAC bypass, piracy or key reselling, account selling/sharing, gambling/skin betting, market manipulation, phishing-adjacent "free items" content, evading Steam bans/restrictions, or anything that could put readers' accounts at risk beyond SGI's documented, honest risk statements. Also: anything disparaging a named competitor or person. |
| H4 | **Scaled / templated** | It's one of a set of near-identical pages ("How to idle {Game}" ×50), duplicates what `/alternatives/*` already covers, or exists only to target a keyword variant. (The site had per-game "Idle {Game}" landing pages under `/supported-games/*`; they were removed on 2026-10-20 for exactly this reason - never recreate that pattern as posts.) |
| H5 | **Cannibalisation** | An existing docs page or post already targets the same primary keyword/intent (check GSC for which URL ranks). Recommend updating that page instead - that's a PROCEED WITH CHANGES that redirects the work, or a REFUSE if the existing page already covers it well. |
| H6 | **No possible information gain** | The top results already cover it thoroughly and accurately, *and* SGI has no first-hand, code-verified or data-backed angle to add. A rewrite of what ranks is scaled content by another name. |
| H7 | **Wrong page type** | `seo-sxo` shows the SERP is entirely transactional/navigational (store pages, official docs, a single tool's homepage) with no editorial results, so a blog post can't satisfy the intent. |
| H8 | **Financial / YMYL claims** | The angle depends on promising earnings (card-selling profit, market "investing") or other money outcomes that can't be stated honestly and conservatively. |

## Scored gates - judge the rest

Score each 0-2. A total under 6, or any 0 on S1 or S2, means **REFUSE** unless a reframe fixes it
(then PROCEED WITH CHANGES).

| # | Gate | 0 | 1 | 2 |
|---|---|---|---|---|
| S1 | **Demand** | No GSC impressions, no autocomplete, no community discussion | Some discussion or a few related queries | Clear query demand (GSC/autocomplete/PAA) or a fresh news spike |
| S2 | **SGI relevance** | SGI unaffected and readers gain nothing SGI-related | Indirect: context for SGI users | Direct: changes what SGI does or what SGI users should do |
| S3 | **Competitiveness** | Top 10 is all high-authority sites with complete answers | Mixed; some weak or outdated results | Thin, outdated, forum-only or no good answer ranking |
| S4 | **Freshness fit** | Old news with nothing new to say | Evergreen-ish, moderate interest | Timely (new/changing) or genuinely evergreen with lasting demand |
| S5 | **Depth available** | Can't support ~600 useful words without padding | Enough for a focused short post | Rich enough for a definitive piece |

## Reframing before refusing

Often a weak topic hides a strong one. Before refusing, try:

- Narrower: "Steam news this week" → the one change that affects cards/achievements.
- SGI-anchored: a generic Steam feature → "what it means for idling/card farming/achievements".
- Evergreen: a dated news item → "how X works" with the news as the hook (and `updated:` later).
- Different target: a post idea → an update to an existing docs page (better for the site when
  intent matches docs).

## Refusal message

When refusing, tell the user in a few lines:

1. **Verdict: REFUSE** - the gate(s) that failed.
2. The evidence (e.g. "top 8 results are Valve/PCGamer with complete answers; GSC shows 0
   impressions for any related query; SGI's achievement code isn't affected").
3. Why publishing anyway would hurt (thin/off-topic signals are site-wide).
4. One to three alternative topics or a docs update that *would* pass, each with its reason.
