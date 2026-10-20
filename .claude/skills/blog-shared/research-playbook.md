# Research playbook

Shared by `/create-blog-post` and `/find-blog-topics`. **[sources.md](sources.md) is the list of
where to look**, with the fetch method that last worked for each source. Start there, and update
it as the header of that file describes. This file is *how* to research.

When a fetch method fails or a better one works, record it in sources.md before moving on.

Every stream ends in the research log (`seo-blog-research-{slug}.md`) as entries like:

```md
- **Claim:** Achievement Sets are opt-in per game and in Steam client beta only.
  **Source:** <url> (Valve, official) - accessed 2026-10-20
  **Confidence:** confirmed | single-source | rumour | contradicted by <url>
```

Prefer primary over secondary sources, newer over older, and say when sources disagree.

## Fetch ladder (use in order, don't give up after one failure)

1. `WebFetch` - fast, fine for static pages.
2. `"$SEO/scripts/claude-seo" run fetch_page.py <url> --json` - real browser headers, follows
   redirects, handles some bot checks.
3. `"$SEO/scripts/claude-seo" run render_page.py <url> --json` - Playwright Chromium, runs JS,
   extracts main text and publication date. Use for client-rendered pages. (It does *not* get
   past SteamDB's or Reddit's bot walls - see sources.md for their fallbacks.)
4. `"$SEO/scripts/claude-seo" run capture_screenshot.py <url> --full -o <scratchpad dir>` then
   `Read` the PNG - for pages whose meaning is visual (UI screenshots, charts).
5. Archived copy: `https://web.archive.org/web/2026*/<url>` when a page is gone or changed.

## 1. Primary sources (Valve / Steam)

Use the "Official Steam / Valve" section of sources.md. The Steam news API is the fastest way to
find the announcement and its exact date. Then open the full announcement, any linked FAQ or
Steamworks doc, and the feature's own page (screenshot it for the media plan). Steam Web API docs
(`partner.steamgames.com/doc/webapi`) matter when the change touches an API SGI calls.

## 2. Change tracking

Use the "Change tracking" section of sources.md. SteamTracking commit history dates a client
change and reveals internal feature names. Protobuf changes signal new client messages (possible
SteamKit2/SGI agent-mode impact). SteamDB itself blocks automated fetches, so use its Bluesky
feed or search snippets, and ask the user for a screenshot if a SteamDB page is essential.

## 3. Community reaction

- Use the "Community" section of sources.md. Reddit's unauthenticated endpoints are flaky (RSS
  works intermittently; search JSON needs login), so fall back to WebSearch
  `site:reddit.com/r/<sub> <term>` and open the threads it finds. Note recurring questions (the
  FAQ comes from these) and points of confusion.
- Steam Community discussions: the Steam Client Beta forum, the Trading Cards group,
  achievement-hunting groups.
- SGI's own signal: `gh issue list -R zevnda/steam-game-idler --search "<term>" --state all`
  and `gh search issues "<term>" --repo zevnda/steam-game-idler`.
- Adjacent tools: issues/releases on `JustArchiNET/ArchiSteamFarm`, `gibbed/SteamAchievementManager`
  and Idle Master Extended forks. Their users hit the same Steam changes. Report facts only,
  never disparage them.
- Treat community claims as unconfirmed until a primary source or the code agrees.

## 4. Video

- Find videos: `"$SEO/scripts/claude-seo" run youtube_search.py "<query>" --json` if the Google
  API key allows it, otherwise `yt-dlp "ytsearch15:<query>" --flat-playlist -J`. Sort by
  recency for news topics.
- Metadata and the description's links (often primary sources):
  `yt-dlp -J --skip-download <url>`.
- Transcript: `yt-dlp --skip-download --write-auto-subs --write-subs --sub-langs "en.*"
  --sub-format vtt -o "<scratchpad>/%(id)s" <url>`, then strip the VTT timing lines to read it.
  Keep timestamps for anything you'd cite.
- No captions? Get the audio (`yt-dlp -x --audio-format mp3`) and transcribe it with
  `faster-whisper`, installed in a scratchpad venv (`python -m venv <scratchpad>/whisper &&
  <scratchpad>/whisper/Scripts/pip install faster-whisper`), model `small` or `base`.
- Visual detail (a UI change, a settings screen): grab frames with
  `ffmpeg -ss <hh:mm:ss> -i <file> -frames:v 1 <scratchpad>/frame.png` (download the video
  with `yt-dlp -f "bv*[height<=720]"` first) and `Read` the frame.
- Record for the post: which videos are worth embedding (credit the creator), and whether the
  SERP for the primary keyword shows a video carousel. If it does, recommend an SGI demo video.

## 5. Search demand and the SERP

- **Search Console** (first-party, highest trust):
  `"$SEO/scripts/claude-seo" run gsc_query.py query --days 90 --dimensions query,page --json`
  then filter for the topic's terms. It shows queries the site *already* gets impressions for,
  which are the easiest wins. Also check whether an existing page already ranks for the target
  query (cannibalisation).
- **Autocomplete**:
  `https://suggestqueries.google.com/complete/search?client=firefox&q=<q>` (and with `a`..`z`
  appended) for the real phrasings people use.
- **WebSearch** the primary keyword and 3-5 variants. For each, record the top results: domain,
  page type (news, forum, docs, video, blog), publish/update date, and what they cover or miss.
  Note People Also Ask questions and related searches. Use `extended` mode for fresh news.
- Fetch and read the top 3-5 ranking pages in full. Your post must beat them on accuracy,
  specificity or first-hand angle. Write down how it will.
- `seo-sxo`: does the SERP want a blog/explainer at all? If it's all store pages or official
  docs, a post won't rank - say so at the gate.
- DataForSEO (volume/difficulty) only if its MCP tools are actually loaded.

## 6. SGI impact (code is the source of truth)

Map the topic to the relevant SGI feature and read the code - not just filenames:

| Topic area | Read |
|---|---|
| Achievements, stats, Achievement Sets | `src-tauri/src/achievements/`, `src-tauri/src/achievement_unlocker/`, `libs/SteamUtility/` (CLI `*_achievement*`/`update_stats` and daemon `achievements_get`/`achievement_set*`) |
| Trading cards, drops, badges | `src-tauri/src/card_farming/`, `src-tauri/src/steam_community/` |
| Playtime, idling, concurrent games | `src-tauri/src/idling/`, `src-tauri/src/max_playtime/`, `src-tauri/src/auto_idle/` |
| Free games / licenses | `src-tauri/src/free_games/`, `src-tauri/src/local_steam/` |
| Inventory / market | `src-tauri/src/inventory/` |
| Sign-in, sessions, Steam Guard | `src-tauri/src/steam_agent/`, `libs/SteamUtility/Daemon/` |
| Presence | `src-tauri/src/steam_agent/presence_settings*`, `libs/SteamUtility/` `PresenceManager.cs` |

Also read the matching docs page(s) and `CLAUDE.md`'s capability differences (agent vs. CLI mode,
Windows vs. Linux, Game Coordinator titles). Answer explicitly:

- Does the change alter what SGI does or can do? In which sign-in mode / platform?
- Does SGI already handle it? Point to the code.
- What should an SGI user do differently, if anything?
- Is there a bug risk or feature opportunity? This goes in the report to the user. The post
  never promises unreleased features.

If the answer depends on runtime behaviour the code can't settle, mark it unconfirmed and ask.
