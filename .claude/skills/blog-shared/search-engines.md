# Search engine actions

What happens automatically for Google, Bing and Yandex, what only the user can do, and exactly
when to tell them. Both blog skills end every run with a **"Search engine actions"** section
built from this file. If nothing is needed, say "None needed" in one line rather than padding.

**Ground rule: Google comes first.** Search Console traffic is the site's main source and is
doing well. Never recommend a change that helps Bing or Yandex at Google's expense (different
titles per engine, `bingbot`-specific robots rules, extra markup Google treats as spam, URL
changes for Bing). IndexNow is fine because Google ignores it completely.

## What's automatic (nothing for the user to do)

| What | How | Covers |
|---|---|---|
| Sitemap | `next-sitemap` regenerates `sitemap.xml` on every docs deploy, with real `lastmod` for posts | Google (submitted in Search Console, re-read on its own), Bing and Yandex (both read the `Sitemap:` line in `robots.txt`) |
| IndexNow | `.github/workflows/docs-deploy.yml` (`indexnow` job) runs `docs/scripts/indexnow.mjs` after each successful **production** Vercel deploy and submits only the URLs whose source changed | Bing, Yandex, Seznam, Naver, Yep (not Google) |
| RSS | `/blog/rss.xml` updates on deploy | Feed readers, aggregators |

Posts go live when their PR merges; nothing to tell search engines before that.

## What only the user can do (no API exists)

- **Google "Request indexing"** - Search Console → URL Inspection → paste URL → *Request
  indexing*. There's no API for normal pages: Google's Indexing API is only for job-posting and
  livestream pages, so **never use `indexing_notify.py` for posts**. Google ignores IndexNow, and
  the old sitemap "ping" endpoint was retired in 2023.
- **Removals** - Search Console → Removals. Only for urgent cases (something sensitive
  published by mistake). It hides a URL for about 6 months; it does not deindex it permanently.

## Checklists - include the matching one in the skill's report

### A new post went live

1. **Google:** URL Inspection → Request indexing for `https://steamgameidler.com/blog/{slug}`.
   For the blog's **first** post, also request `https://steamgameidler.com/blog` (it was
   `noindex` while empty).
2. **Bing / Yandex:** nothing - IndexNow submits the post and `/blog` on deploy. To confirm, the
   repo's *Actions → IndexNow* run for that deploy should list both URLs and say "accepted".
   If it failed, run `node scripts/indexnow.mjs --urls blog/{slug} blog` from `docs/`.
3. **Optional, Bing:** *Bing Webmaster → URL Inspection* shows when Bing picks it up.
4. **Follow-up (skill does this later):** after ~3-7 days, the skill checks Google's index
   status for the post (below) and tells the user if anything's wrong.

### A post was substantially updated (`updated:` changed)

1. **Google:** Request indexing for the post URL (the sitemap `lastmod` changes too, but a
   request is faster for time-sensitive corrections).
2. **Bing / Yandex:** automatic via IndexNow.

### A post's URL must change, or a post is deleted

Avoid both. Slugs are permanent. If it truly must happen:

1. Add a permanent redirect in `docs/vercel.json` (`"redirects": [{ "source": "/blog/old",
   "destination": "/blog/new", "permanent": true }]`). Without it the old URL's rankings and
   links are simply lost. A deleted post with no replacement should redirect to the closest
   relevant page, or `/blog`.
2. **Google:** Request indexing for the *new* URL. Don't use Removals for a redirected URL;
   Google follows the 301 and moves the signals over.
3. **Bing / Yandex:** IndexNow submits the changed paths on deploy. Also submit the old URL by
   hand (`--urls blog/old-slug`) so they recrawl and see the redirect.

### Typo/minor fix

Nothing. Don't change `updated:`, and don't request indexing. Engines pick it up on their next
crawl.

## Health checks the skills run themselves

With claude-seo (`$SEO` = `~/.claude/plugins/marketplaces/AgriciDaniel-claude-seo`):

- **Google index status of published posts**:
  `"$SEO/scripts/claude-seo" run gsc_inspect.py <post-url> --json`. Look at `coverage_state`,
  `google_canonical` (must equal the post URL) and `last_crawl_time`. Flag to the user:
  - "Discovered/Crawled - currently not indexed" more than ~2 weeks after publishing → usually a
    quality/duplication signal. Recommend improving the post, not resubmitting it repeatedly.
  - A canonical that isn't the post's own URL → a duplication problem to fix.
  - `last_crawl_time` older than the post's `updated:` → request indexing.
- **Sitemap health**: `"$SEO/scripts/claude-seo" run gsc_query.py sitemaps --json` - errors or
  warnings → tell the user.
- **Bing** (`python .claude/skills/blog-shared/scripts/bing_webmaster.py <command>`, stdlib
  only, key read from claude-seo's config and never printed):
  - `url <post-url>`: `known_to_bing: false` a week after publishing → check that the IndexNow
    run for that deploy succeeded, then suggest *Bing Webmaster → URL Submission* for that URL.
  - `crawl --days 30`: a jump in `Code4xx`/`Code5xx`/`CrawlErrors` vs the usual level, or a
    sitemap whose `status` isn't `Success` → tell the user.
  - `summary --days 28`: traffic vs the previous period, for the report's one-line health note.
  Bing data is context, not a target. Never act on a Bing finding in a way that changes what
  Google sees, unless it's a genuine site fault that hurts both.

## Access setup status

| Engine | Access for Claude | Status |
|---|---|---|
| Google Search Console | claude-seo service account, `~/.config/claude-seo/google-api.json`, property `sc-domain:steamgameidler.com` | Working (tier 1: Search Analytics, URL Inspection, Sitemaps) |
| Bing Webmaster Tools | API key in `~/.config/claude-seo/backlinks-api.json` (`C:/Users/proba/.config/claude-seo/backlinks-api.json`) as `bing_api_key` | Working (verified 2026-10-20). Search performance, crawl stats, sitemaps, URL info via `scripts/bing_webmaster.py`; backlinks via claude-seo's own `bing_webmaster.py`. The key also sees the user's other Bing sites - only ever query steamgameidler.com. |
| Yandex Webmaster | OAuth token (Yandex Webmaster API) | **Deliberately skipped** (user decision, 2026-10-20): IndexNow already notifies Yandex, and its traffic is too small to justify maintaining an OAuth token. Don't suggest it again unless Yandex traffic grows meaningfully. |
| IndexNow | Public key file `docs/public/a99bafb2fec849c3abfd6d70326b67fa.txt` | Working (verified 2026-10-20, HTTP 200). Never rename or delete that file. |
