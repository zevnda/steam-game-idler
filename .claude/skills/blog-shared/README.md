# blog-shared

Not a skill (no `SKILL.md`). Shared state and rules for `/create-blog-post` and `/find-blog-topics`,
kept in `.claude/skills/` so git tracks it and it syncs between machines.

| File | What | Who updates it |
|---|---|---|
| `topic-backlog.md` | Queued, written, published and rejected topics; last sweep date; seasonal calendar | Both skills, at the end of every run |
| `sources.md` | Where to research, with the fetch method that last worked and when | Both skills, whenever a source works, fails or is found |
| `search-engines.md` | What's automatic for Google/Bing/Yandex, what the user does by hand per event, health checks, access status | By hand; update the access table when Bing/Yandex access is set up |
| `scripts/capture.py` | Screenshot part of a public web page (click/crop/hide/blur) | By hand |
| `scripts/render_html.py` | Render local HTML (diagrams) to PNG at an exact size | By hand |
| `scripts/build_cover.py` | Build a cover: fragment + frame -> PNG/WebP | By hand |
| `templates/cover.html` | The shared cover frame (1200x630) with slots; never copied per post | By hand; changes affect every rebuilt cover |
| `covers/` | One fragment per post's cover, plus `README.md`: archetypes, variety rules, registry | Both skills' writer, per new cover |
| `scripts/bing_webmaster.py` | Bing Webmaster Tools reader (traffic, queries, pages, crawl, sitemaps, URL status) | By hand |
| `research/` | Research logs and briefs per post (`seo-blog-research-*`, `seo-blog-brief-*`), plus site-wide GSC baselines and SEO briefs (`seo-baseline*`, `seo-brief*`). Gitignored: local to each machine | `/create-blog-post`, by hand |
| `research-playbook.md` | How to research a topic | By hand, when the process changes |
| `validity-gate.md` | Which topics are allowed (hard stops + scoring) | By hand - both skills must apply the same rules |
