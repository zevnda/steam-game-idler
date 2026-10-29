# Research sources registry

Shared by `/create-blog-post` and `/find-blog-topics`. **Start every research pass here** instead of
re-discovering where to look, and **keep it current**:

- A source that worked → bump its `Verified` date if it's older than ~30 days.
- A source that failed → note the failure and the working fallback; mark it `blocked` or `dead`
  after two consecutive failures on different days.
- A genuinely useful new source → add it to the right section, with the method that worked.
- Never add a source you haven't actually fetched.

`Method` = what worked last time: `curl` (plain HTTP, also fine via WebFetch), `api` (JSON
endpoint), `rss`, `gh` (GitHub CLI/API), `render` (`$SEO/scripts/claude-seo run render_page.py`),
`search` (WebSearch with the given operator), `manual` (only the user can get it). `$SEO` is
`~/.claude/plugins/marketplaces/AgriciDaniel-claude-seo`.

## Official Steam / Valve (primary - cite these)

| Source | URL | Good for | Method | Verified |
|---|---|---|---|---|
| Steam news API (Steam itself = app 593110) | `https://api.steampowered.com/ISteamNews/GetNewsForApp/v2/?appid=593110&count=20&maxlength=300` | **Best single feed.** Steam blog posts, client updates, beta announcements, as JSON with dates. Swap `appid` for any game's news. Use `maxlength=0` for the **full announcement text** (and `enddate=<unix>` + `count=200` to grep old posts by keyword, e.g. the 2018 privacy and 2024 Families posts) (BBCode), and `count=2000&enddate=<unix>` to reach old posts (e.g. Valve's 2017 "Changes to Trading Cards") - the steamcommunity.com announcement pages render their body client-side, so WebFetch returns only the title. | api | 2026-10-20 |
| Steam news hub | `https://store.steampowered.com/news/collection/steam/` | Human-readable Steam announcements | curl | 2026-10-20 |
| Steam announcements (community) | `https://steamcommunity.com/games/593110/announcements` | Announcement list + comments (reaction). Individual announcement bodies are JS-rendered: get the text from the news API (`maxlength=0`) instead. | curl (list) | 2026-10-20 |
| Steam news RSS | `https://store.steampowered.com/feeds/news/app/593110/` | Same as API, RSS form | rss | 2026-10-20 |
| Steam client beta notes | `https://store.steampowered.com/oldnews/?feed=steam_client_beta` | Exact client beta changelogs, dated | curl | 2026-10-20 |
| Steamworks announcements | `https://steamcommunity.com/groups/steamworks/announcements` | Developer-facing changes (often before users see them) | curl | 2026-10-20 |
| Steamworks docs: achievements | `https://partner.steamgames.com/doc/features/achievements` | How achievements/stats work technically | curl | 2026-10-20 |
| Steamworks docs: upcoming events | `https://partner.steamgames.com/doc/marketing/upcoming_events` | **Official sale/festival dates** - the seasonal calendar. WebFetch extracts the full date tables cleanly. Doesn't list sales that already started (e.g. Autumn Sale 2026) - check the news API for those. | curl | 2026-10-20 |
| Steamworks docs: sales & events | `https://partner.steamgames.com/doc/marketing/sales_and_events` | Sale rules, event types | curl | 2026-10-20 |
| Steam trading cards FAQ | `https://steamcommunity.com/tradingcards/faq` | Official card/badge/drop rules | curl | 2026-10-20 |
| Steam Support FAQ (example: account limits) | `https://help.steampowered.com/en/faqs/view/2CFF-A2A6-1A9E-4BAA` | Official policy wording; search `help.steampowered.com` per topic | curl | 2026-10-20 |
| Steam Support FAQ article bodies | any `help.steampowered.com/en/faqs/view/...` (e.g. Limited User Accounts `71D3-35C2-AD96-AA3A`, Client Beta `276C-85A0-C531-AFA3`, Community Market `61F0-72B7-9A18-C70B`) | Body is JS-rendered: WebFetch and `render_page.py`'s extractor both return only the footer. Use a short Playwright script with `page.inner_text('body')` (the claude-seo venv's python has Playwright). Collapsed Q&As are in the DOM, so inner_text includes the answers. | render (inner_text) | 2026-10-20 |
| Steam Subscriber Agreement | `https://store.steampowered.com/subscriber_agreement/english/` (+ Wayback `https://archive.org/wayback/available?url=...&timestamp=YYYYMMDD`, fetch with `id_` and `curl --compressed`) | Exact terms and **when a clause changed** - compare snapshots' "last updated" dates. Section 4.C "Automation" exists since the 2025-09-18 revision. | render / curl | 2026-10-20 |
| Steam's new achievements page (Achievement Sets) | `https://steamcommunity.com/achievements/<appid>` | Public, no sign-in: per-set lists, "N from base game across X sets / N from DLC across Y sets", Global Stats toggle. Great for screenshots (`capture.py --click "All Sets (N)"`). Never reaches `networkidle` - wait for load + 6s. | render | 2026-10-20 |
| Steam Points Shop pages | `https://store.steampowered.com/points/shop/c/steambadge`, `https://store.steampowered.com/points/howitworks?cc=us` | Seasonal Badge levels + Valve's points FAQ. JS-rendered: Playwright `inner_text`. Add `?cc=us` for the USD rate ("100 points for every $1.00"), otherwise it shows the visitor's currency. The badge page shows **running totals**, not per-level prices. | render (inner_text) | 2026-10-20 |
| Points Shop reward API | `https://api.steampowered.com/ILoyaltyRewardsService/QueryRewardItems/v1/?community_item_classes%5B0%5D=1&count=100` | Public, no key: Seasonal Badge definitions with `point_cost` (per level) and `badge_data` (level count) | api | 2026-10-20 |
| Steam badge/XP data | `IPlayerService/GetBadges/v1/?steamid=<id>&key=<KEY from repo .env>` (public profiles only) | Verifying XP rules (`player_xp`, per-badge `xp`/`level`). Research only - never publish anyone's profile data. badgeid 1 = Years of Service, 2 = Community, 13 = Game Collector, 64/66/68/69 = Steam Replay 2022-25 | api | 2026-10-20 |
| Steam Support: Private Games / Profile Privacy | `help.steampowered.com/en/faqs/view/1150-C06F-4D62-4966`, `.../588C-C67D-0251-C276` | What "Mark private" hides (incl. no card drops); privacy settings path | render (inner_text) | 2026-10-20 |
| Steamworks docs: achievements (console) | `https://partner.steamgames.com/doc/features/achievements` | `achievement_clear` / `reset_all_stats` console commands, "Set by" (protected), account-tied storage | curl | 2026-10-20 |
| Steamworks docs: ISteamUserStats | `https://partner.steamgames.com/doc/api/ISteamUserStats` | Valve's definitions of global achievement percentages, stats calls | curl | 2026-10-29 |
| Global achievement % API | `https://api.steampowered.com/ISteamUserStats/GetGlobalAchievementPercentagesForApp/v0002/?gameid=<appid>` | Public, no key: per-achievement global %, one-decimal strings. Pair with `GetSchemaForGame` (repo `.env` `KEY`) for names | api | 2026-10-29 |
| Steam's "(N rare)" count | `https://steamcommunity.com/achievements/<appid>` (Playwright inner_text) | Steam counts an achievement as rare when the API value is under 10% (verified on 4 games 2026-10-29). "Show Global Stats" is a switch: click right of the label text, not the label. | render | 2026-10-29 |
| Steam Support: Offline Mode / Steam Families | `help.steampowered.com/en/faqs/view/0E18-319B-E34B-B2C8`, `.../054C-3167-DD7F-49D4` | Offline Mode (doesn't mention playtime); Families playtime limits/reports | render (inner_text) | 2026-10-29 |
| Steam player protobufs | `gh api repos/SteamTracking/Protobufs/contents/steam/steammessages_player.steamclient.proto --jq .content \| base64 -d` | Playtime field names (`playtime_forever`, `_2weeks`, per-platform, `playtime_disconnected`). Public GetOwnedGames only returned `playtime_forever`/`_2weeks` on sampled accounts. | gh | 2026-10-29 |
| Steam Community Market search | `https://steamcommunity.com/market/search?appid=753&...` | Card prices/listings | **blocked for anonymous capture**: "You've made too many requests recently" on the first request (2026-10-20). Use a marker, or ask the user. | - | 2026-10-20 |
| Steam Next Fest / sale pages | `https://store.steampowered.com/sale/steamnextfest` | Live event pages | curl | 2026-10-20 |

## Change tracking (what changed, precisely)

| Source | URL | Good for | Method | Verified |
|---|---|---|---|---|
| SteamTracking (client file diffs) | `gh api "repos/SteamTracking/SteamTracking/commits?per_page=30"` | Dating client changes; new strings/feature names before announcements. Moved from `SteamDatabase/SteamTracking`. | gh | 2026-10-20 |
| SteamTracking Protobufs | `gh api "repos/SteamTracking/Protobufs/commits?per_page=30"` | New client messages - signals SteamKit2/SGI agent-mode impact. `gh api repos/SteamTracking/Protobufs/commits/<sha> --jq '.files[]\|.patch'` shows the field-level diff. | gh | 2026-10-21 |
| SteamKit2 releases | `gh api "repos/SteamRE/SteamKit/releases?per_page=5"` | Library SGI's agent mode is built on | gh | 2026-10-20 |
| SteamDB (site) | `https://steamdb.info/` | Patchnotes, sale history | **blocked** - Cloudflare 403 for curl *and* headless Playwright | 2026-10-20 |
| SteamDB on Bluesky (fallback for the above) | `https://public.api.bsky.app/xrpc/app.bsky.feed.getAuthorFeed?actor=steamdb.info&limit=30` | SteamDB's own news posts (sales starting, notable changes) as JSON | api | 2026-10-20 |
| SteamDB via search (fallback) | WebSearch `site:steamdb.info <term>` | Snippets/titles of SteamDB pages; ask the user for a screenshot if a page is essential | search | 2026-10-20 |

## Community (demand + confusion = topics and FAQ questions)

| Source | URL | Good for | Method | Verified |
|---|---|---|---|---|
| Reddit subreddit feeds | `https://www.reddit.com/r/<sub>/new/.rss` (also `/top/.rss?t=week`) for `Steam`, `pcgaming`, `SteamDeck`, `Steam_Achievements`, `gaming` | Hot questions and complaints | rss - **flaky**: works intermittently, then rate-limited (empty body). Use a browser UA; don't hammer. | 2026-10-20 |
| Reddit JSON | `https://old.reddit.com/r/<sub>/new.json` | Same, structured | api - worked once, then rate-limited; **search.json now redirects to login** | 2026-10-20 |
| Reddit search (fallback) | WebSearch `site:reddit.com/r/Steam <term>` | Topic-specific threads | search | 2026-10-20 |
| Steam Community general discussions | `https://steamcommunity.com/discussions/forum/0/` | General Steam user questions | curl | 2026-10-20 |
| Steam Client Beta group | `https://steamcommunity.com/groups/SteamClientBeta/discussions` | Beta bugs/reactions | curl | 2026-10-20 |
| Steam Trading Cards group | `https://steamcommunity.com/groups/tradingcards/discussions` | Card/badge questions (SGI's core audience). The user also has promo threads here - see memory. | curl | 2026-10-20 |
| SGI GitHub issues | `gh issue list -R zevnda/steam-game-idler --state all --limit 100 --search "<term>"` | Real SGI user problems = evergreen how-to topics | gh | 2026-10-20 |
| SGI GitHub discussions | `gh api repos/zevnda/steam-game-idler/discussions` | User questions | gh | 2026-10-20 |
| ArchiSteamFarm releases/issues | `gh api "repos/JustArchiNET/ArchiSteamFarm/releases?per_page=5"` / `gh issue list -R JustArchiNET/ArchiSteamFarm --search "<term>"` | Steam changes that hit card farmers | gh | 2026-10-20 |
| Steam Achievement Manager issues | `gh issue list -R gibbed/SteamAchievementManager --search "<term>"` | Achievement-tool breakage | gh | 2026-10-20 |
| Steam Trading Cards wiki (fandom) | `https://steamtradingcards.fandom.com/wiki/Points_Shop` | Secondary badge history | **blocked**: HTTP 402 to WebFetch (2026-10-20). Use Valve's Points Shop API instead. | - | 2026-10-20 |
| Steam Card Exchange | `https://www.steamcardexchange.net/` | Card/badge community data (cite carefully, secondary) | curl | 2026-10-20 |

## Coverage / news outlets (secondary - for SERP context, not as primary citations)

| Source | URL | Good for | Method | Verified |
|---|---|---|---|---|
| GamingOnLinux | `https://www.gamingonlinux.com/` | Steam client news, Linux angle (SGI ships on Linux) | curl | 2026-10-20 |
| PC Gamer / The Verge / Eurogamer etc. | WebSearch `<topic> steam` with `extended` mode | Who has covered a story and how deeply | search | 2026-10-20 |

## Search demand

| Source | How | Good for | Method | Verified |
|---|---|---|---|---|
| Search Console (first-party) | `"$SEO/scripts/claude-seo" run gsc_query.py query --days 90 --dimensions query,page --limit 5000 --json` (property `sc-domain:steamgameidler.com` is the default) | Queries the site already gets impressions for, and which page gets them. Data lags ~3 days (a 2026-10-21 pull ended 2026-10-18), so a sweep a day after the last one adds no new demand data - don't re-pull for that. A 2026-10-29 pull ended 2026-10-26. `--start-date/--end-date` work for period comparisons (two 14-day windows give a quick riser list). | api | 2026-10-29 |
| Google autocomplete | `https://suggestqueries.google.com/complete/search?client=firefox&q=<seed>` (append ` a`..` z`, and prefixes `how`, `why`, `can`, `does`) | Real phrasings and long-tail | api | 2026-10-20 |
| YouTube | `yt-dlp "ytsearch20:<query>" --flat-playlist --print "%(id)s %(title)s"` (`-J` for full metadata incl. upload date) | What's being covered on video; video-intent queries | cli | 2026-10-20 |
| Bing Webmaster (secondary) | `python .claude/skills/blog-shared/scripts/bing_webmaster.py queries --days 90 --filter <term>` | Bing's query data - a second opinion on demand; much smaller volume than Google, so never the deciding signal | api | 2026-10-20 |
| Captured GSC baselines | repo-root `seo-baseline*.md` | Previously captured query data (date-stamped) | file | - |

## Seed terms (for autocomplete / GSC filtering)

`steam idle`, `steam idler`, `steam card`, `steam trading cards`, `steam card drops`, `steam badge`,
`steam level`, `steam xp`, `steam achievement`, `steam achievements`, `steam achievement sets`,
`steam playtime`, `steam hours`, `steam hour boost`, `steam free games`, `steam free licenses`,
`steam inventory`, `steam market`, `steam market fees`, `steam points`, `steam sale cards`,
`steam account limited`, `steam limited account`, `steam guard`, `steam family sharing`,
`archisteamfarm`, `idle master`, `steam achievement manager`, `how to level up on steam`,
`steam protected achievement` (its suggestions surface remove/hide/reset intents). `does steam count`, `steam playtime` + `can/does/is` prefixes (2026-10-29: ~40 playtime-mechanics phrasings - idle/offline/invisible/sleep/accuracy/reset), `steam awards badge`. Add terms that prove productive.
