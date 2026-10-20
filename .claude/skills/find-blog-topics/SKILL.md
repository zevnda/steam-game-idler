---
name: find-blog-topics
argument-hint: "[focus]"
description: >
  Discover, research and vet blog topics for steamgameidler.com/blog when there's
  no topic in mind. Sweeps Steam news and client changes, Search Console demand
  gaps, autocomplete/People Also Ask, community questions (SGI GitHub issues,
  Steam Community, Reddit), YouTube coverage and the seasonal calendar, then runs
  every candidate through the same validity gate as /create-blog-post and queues
  only topics that would strengthen the site's SEO. Use for "/find-blog-topics",
  "what should I blog about", "find blog topics", or "content ideas". Optional
  focus, e.g. "achievements", "card farming", "seasonal".
---

# /find-blog-topics

You find the next posts worth writing for the Steam Game Idler blog. The output is a short,
ranked, evidence-backed queue in the shared backlog, not a list of brainstormed titles. Every
queued topic must be one `/create-blog-post` would accept. **An empty result is a valid result:**
if nothing passes this week, say so and don't lower the bar. Thin or off-topic posts hurt the
whole domain, and one great post beats four filler ones.

Optional focus: `$ARGUMENTS` (a theme like "achievements", a timeframe, or "seasonal"). With no
focus, sweep everything.

## Shared files (read first, update last)

All in `.claude/skills/blog-shared/`:

- [topic-backlog.md](../blog-shared/topic-backlog.md) - last sweep date, queued, written,
  published and rejected topics, the seasonal calendar.
- [sources.md](../blog-shared/sources.md) - where to look and the fetch method that works.
- [research-playbook.md](../blog-shared/research-playbook.md) - how to research (fetch ladder,
  video, SERP, SGI code mapping).
- [validity-gate.md](../blog-shared/validity-gate.md) - the hard stops and scoring. Identical
  rules to `/create-blog-post`.
- [search-engines.md](../blog-shared/search-engines.md) - what's automatic for Google/Bing/Yandex,
  what the user must do by hand, and the health checks to run.

## Non-negotiables

- Never commit, stage or push, and never offer to.
- Every candidate's evidence is a source you opened, with its date. No "this is probably
  trending".
- Don't write posts here. This skill ends at a vetted queue; writing is `/create-blog-post`'s job.
- Never re-queue a Rejected topic unless its "Revisit only if" condition is now met. Say which
  evidence met it.

## Process

### Phase 0: Ground yourself

1. Read the four shared files above, then `docs/CLAUDE.md`, `.agents/product-marketing.md`, and
   any `seo-baseline*.md` / `seo-brief*.md` at the repo root.
2. Inventory what the site already covers: every `docs/blog/*.mdx` (title, keywords) and every
   docs page title/description under `docs/app/(marketing)/docs/_content/`, plus
   `/alternatives/*`. Candidates are judged against this.
3. Set the **sweep window**: from the backlog's "Last discovery sweep" date (or the last 30
   days if never), to today. Seasonal look-ahead: the next 6 weeks.
4. Load the SEO toolchain: invoke `claude-seo:seo` (the hub) and read it. Also load
   `claude-seo:seo-plan` (content strategy), `claude-seo:seo-cluster` (hub-and-spoke gaps),
   `claude-seo:seo-sxo` (page-type fit) and `claude-seo:seo-google` (Search Console). With
   `$SEO` = `~/.claude/plugins/marketplaces/AgriciDaniel-claude-seo`, check the plugin runtime
   (`"$SEO/scripts/claude-seo" doctor --json`, run `setup` if not ready) and the Google tier, as
   in `/create-blog-post` Phase 1.

### Phase 0.5: Health of what's already published

A sweep is also the blog's regular check-up. Before looking for new topics:

1. **Reconcile the backlog.** Any *Written - awaiting merge* post whose live URL now returns 200
   has been published. Move it to *Published* (publish date = its `date:`, plus a revisit date),
   and give the user the "new post went live" checklist from search-engines.md if they may not
   have done it yet. One still not live after ~2 weeks: remind the user it's waiting on a merge
   (and that its `date:` should be bumped when it goes in).
2. **Run search-engines.md's health checks** on every published post: URL Inspection for each,
   and sitemap status. Collect anything that needs the user (not indexed after ~2 weeks, wrong
   canonical, crawl older than the last substantial update).
3. **Revisits due.** Published posts whose revisit date has passed, or whose beta/news subject
   has since changed (check the same sources you used), become **update** candidates. Rank them
   in Phase 4 alongside new topics; refreshing a post that already ranks often beats a new one.

### Phase 1: Discovery - seven streams

Collect raw candidates with their evidence in the scratchpad. The streams are independent, so
for a full sweep you may run them as parallel `general-purpose` subagents. Give each one the
sources.md section to use, the sweep window, and the instruction to return candidates with
dated source links (and any source that failed or a new one that worked).

1. **Steam news & changes** - Steam news API + client beta notes + Steamworks announcements in
   the window; SteamTracking and Protobufs commit messages for unannounced features; SteamDB's
   Bluesky feed; SteamKit2/ASF releases. Keep only changes touching accounts, libraries,
   idling/playtime, cards/badges/XP, achievements/stats, inventory/market, free licences, or the
   Steam client SGI integrates with.
2. **Search Console demand gaps** - pull 90 days of `query,page`
   (`gsc_query.py query --days 90 --dimensions query,page --limit 5000 --json`) and the previous
   90 days for comparison. Look for:
   - queries with real impressions where the ranking page doesn't match the intent (e.g. a
     "why/how/does" question landing on a feature docs page at position 8-30). A post could
     answer it *and* link to that docs page, but watch cannibalisation;
   - question queries and long-tail with impressions but no page that answers them;
   - rising queries (impressions up sharply vs the previous period).
   Bing's query data (`bing_webmaster.py queries`) can corroborate a candidate, but Google's
   numbers decide.
3. **Autocomplete & People Also Ask** - expand sources.md's seed terms (plus `$ARGUMENTS`)
   through autocomplete with `a`..`z` and `how/why/can/does/is` prefixes. WebSearch the
   strongest phrasings to collect People Also Ask and related searches.
4. **Community questions** - SGI GitHub issues and discussions in the window (recurring
   confusion = evergreen how-to/explainer topics), Steam Community groups, Reddit via
   `site:reddit.com` search. Repeated questions matter more than single loud threads.
5. **Video coverage** - YouTube uploads in the window for the seed terms. A topic several
   creators covered recently has proven interest; check whether written coverage is weak.
6. **Evergreen pillar gaps** - with `seo-cluster`, map the site's core themes (card farming,
   achievements, playtime/hours, inventory & market, free games, accounts & safety) into
   hub-and-spoke. A missing spoke that a docs page can't naturally hold (a "how Steam X works"
   explainer, a comparison, a misconception) is a candidate. A spoke that *belongs* in docs is a
   docs-update suggestion, not a post.
7. **Seasonal** - events in the next 6 weeks from the backlog's calendar, with dates confirmed
   from Steamworks' upcoming-events page. Pitch only if the event genuinely touches this site's
   themes (verify what the event awards before claiming cards/badges).

### Phase 2: Merge and pre-filter

- Merge duplicates into one candidate per **search intent**, not per phrasing. Note the best
  primary keyword candidate.
- Drop on sight anything already Published, Queued (unless the new evidence strengthens it -
  then update that entry instead), or Rejected without its revisit condition met.
- Drop anything plainly failing a hard stop (off-topic, harmful, templated). Log it briefly as
  rejected - it still saves the next sweep time.

### Phase 3: Vet each surviving candidate

Run [validity-gate.md](../blog-shared/validity-gate.md) on each. Do enough research to score
honestly; a gate scored on assumption is worthless:

- Confirm a **primary source** exists for any news claim (H2).
- **Check the SERP** for the likely primary keyword: top results, page types, freshness, gaps
  (H6, H7, S3), and `seo-sxo` page-type fit.
- **Check cannibalisation** with GSC's `page` dimension and the site inventory (H5).
- **Check the SGI tie** in the code area from the playbook's mapping table (S2). Note it as
  "direct/indirect/none"; full code reading happens in `/create-blog-post`.
- Try the gate's **reframes** before rejecting a candidate with real demand.

Results: **QUEUE** (passes), **QUEUE AS DOCS UPDATE** (the intent belongs on an existing docs
page; suggest the page and the missing section), or **REJECT** (with gate, evidence and a
"Revisit only if").

### Phase 4: Prioritise

Rank the queued topics by, in order:

1. **Time sensitivity** - news decays fast. A passing news topic with a closing window goes
   first; give it a "write by" date.
2. **Gate score** (demand × SGI relevance × competitiveness).
3. **Site leverage** - topics that link naturally to pages already in striking distance
   (position 5-20 in GSC) or to the money pages (`/download`, core feature docs).
4. **Portfolio balance** - mix news and evergreen. Don't stack the queue with one theme, and
   build toward complete clusters rather than scattered one-offs.

Cap the queue at about **8 open topics** in total, counting what's already there. A long stale
queue is noise. Prune queued items whose window closed (move them to Rejected: "news window
passed").

### Phase 5: Record and report

1. **Update topic-backlog.md**: add queued topics (newest first, using the comment template),
   add rejections with revisit conditions, prune expired items, refresh confirmed seasonal
   dates, and set **Last discovery sweep** to today.
2. **Update sources.md**: verified dates, failures + fallbacks, new sources that proved useful,
   new productive seed terms.
3. **Report** to the user, concisely:
   - A ranked table: working title, primary keyword, type (news/evergreen/seasonal), score,
     write-by, and a one-line "why" with the strongest piece of evidence.
   - Docs-update suggestions, if any (page + the missing section).
   - Notable rejections in one line each - only those the user might have expected to see.
   - If nothing passed: say so, and give the closest near-miss and what would make it pass.
   - **Search engine actions**: everything from Phase 0.5 the user must do by hand (exact URLs
     and which Search Console / Bing screen to use), per search-engines.md. If there's nothing,
     say "None needed" in one line.
4. Ask which topic to write now with `AskUserQuestion`: the top 3 queued topics as options
   (recommended first), plus "Queue only, don't write now". If they pick one, invoke the
   `create-blog-post` skill with that topic. It will pick up the queue entry's evidence.
