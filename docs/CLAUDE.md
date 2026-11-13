# CLAUDE.md

The documentation and marketing site for Steam Game Idler: a Next.js + Fumadocs static site,
deployed to Vercel independently of the desktop app. Changes here don't affect the app.

## Stack and layout

- `app/(marketing)/` - the full site: landing page, docs, changelog list, download, Pro, legal
  pages. Doc content is MDX under `app/(marketing)/docs/_content/`.
- `app/(embed)/` - minimal routes loaded inside the desktop app's webview (the single-changelog
  view).
- `changelogs/` - changelog entries.
- `blog/` - blog posts.
- `scripts/` - site tooling (IndexNow submission).

## Commands

From the repo root:

- `pnpm dd` - docs dev server
- `pnpm build:docs` - static export + sitemap
- `pnpm lint:docs` - ESLint

Inside `docs/`: `pnpm types:check` - fumadocs-mdx codegen + `tsc --noEmit`.

@../.claude/docs/PROJECT_OUTLINE.md
