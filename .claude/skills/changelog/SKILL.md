---
name: changelog
argument-hint: version
description: >
  Write or update an end-user-facing changelog entry in docs/changelogs from
  the files actually changed in the desktop app (src-tauri/, src/,
  libs/SteamUtility/ only — never docs/ or repo-level config/tooling),
  matching this project's existing changelog voice and structure. Use for
  "/changelog <semver>", e.g. "/changelog 6.2.7". The version argument is
  required.
---

Write changelog entries for real end users, not developers. Laymen language over technical
accuracy. Why it matters to the user over how it was implemented.

## Process

1. **Require `$version`.** If it's missing or not a valid `MAJOR.MINOR.PATCH` semver
   (e.g. `6.2.7`), stop and ask for it — never guess a version.
2. **Determine the target file**: `docs/changelogs/$version.mdx`.
   - If it exists, this is an **update** — read it in full first.
   - If it doesn't exist, this is a **new** changelog — read 3-4 of the most recent
     `docs/changelogs/*.mdx` files (highest version numbers) to recalibrate on current voice
     before writing anything.
3. **Determine the changed files**: start with `git status --porcelain` so both tracked and
   untracked files are visible (`git diff` alone silently omits untracked new files). Prefer
   staged changes (`git diff --staged --name-only`) if anything is staged; otherwise fall back
   to the full working tree (tracked modifications + untracked files) and say which you used.
   Then read the actual content:
   - Tracked, staged: `git diff --staged`.
   - Tracked, unstaged: `git diff`.
   - Untracked (`??` in `git status --porcelain`): no baseline to diff against — read the file
     directly to see what it adds.
   The entry is written from real behavior change, not filenames or commit intentions.
4. **Scope to the actual desktop app only** — `src-tauri/` (Rust/Tauri backend), `src/`
   (Next.js frontend), and `libs/SteamUtility/` (the C# Steam helper). Drop everything else
   from consideration before even reaching the relevance filter below, regardless of how
   substantial the diff looks there:
   - `docs/` — an independently deployed marketing/docs site (own `package.json`); it never
     ships inside the app, so nothing there is a changelog entry, including changes that
     happen to touch `docs/changelogs/*.mdx` itself.
   - Root/repo-level config and tooling: `.github/`, `.claude/`, CI workflow files, root
     `package.json`/lockfiles/`tsconfig`/lint config, `CONTRIBUTING.md`, `README.md`,
     `.gitignore`, and similar — these affect contributors and infra, not the shipped app.
   - If the only changes present are outside this scope, say so explicitly instead of writing
     an entry from them.
5. **Filter for end-user relevance** (within the in-scope files from step 4). Not every
   changed file belongs in a changelog. Skip silently:
   - Pure internal changes with no user-visible effect: refactors, internal renames, test
     changes, build/config/dep bumps, logging/comment changes, `chore`-type work per
     CONTRIBUTING.md.
   - If genuinely nothing changed is user-visible, say so instead of fabricating an entry.
   Include:
   - Anything a user would notice: new features, behavior changes, UI/UX changes, bug fixes,
     performance improvements a user would feel, new language/platform support.
6. **Classify each remaining change into exactly one category** — `New`, `Improved`, or
   `Fixed` (this project uses no other categories; check all existing files' `tags:`
   frontmatter if unsure). Roughly: new capability → New, behavior/UX/performance change to
   something existing → Improved, bug fix → Fixed.
7. **Write bullets matching the established structure exactly**:
   - Sections always appear in this fixed order, only when they have content:
     `### New 🎉`, `### Improved 🚀`, `### Fixed 🐛`.
   - One bullet per distinct change, present tense (`Added`, `Fixed`, `Improved`, not
     `Adds`/`Add`).
   - **Bold** the feature/page/setting name exactly as it appears in the app UI (e.g.
     `**Card Farming**`, `**Settings → General**`).
   - No internal file names, function names, code terms, or implementation detail — describe
     the effect the user sees/gets, not the mechanism.
   - Use a nested sub-bullet list under one bullet when a change has distinct behavior for
     different modes/platforms (see `6.2.3.mdx`'s Steam Sign-in vs Legacy Sign-in split).
   - For one exceptionally large/overhaul-level change only, a `##` prose heading + 1-2
     sentence summary paragraph above the `###` sections is acceptable (see `6.2.0.mdx`'s
     "Card Farming Feature Overhaul") — don't reach for this for an ordinary release.
8. **Frontmatter**:
   - `title:` is the bare version string, matching the filename.
   - `date:` — always today's date (`YYYY-MM-DD`), for both a new file and an update to an
     existing one. On an update, overwrite the existing date with today's, since the entry now
     reflects changes made today. Run `date +%F` if today's date isn't already known from
     context, rather than guessing or reusing the old value.
   - `tags:` — the list of categories actually present in the body, in `New`/`Improved`/`Fixed`
     order, e.g. `['Improved', 'Fixed']`. When updating an existing file, merge in any new
     category rather than dropping what was already there.
9. **When updating an existing file**, append new bullets to the matching `###` section
   (creating a section that doesn't exist yet, in the correct order, if needed) rather than
   rewriting or reordering existing bullets.

## Rules

- End-user language always — no jargon, no internal names, no "refactored"/"optimized
  internals" unless the user would actually feel it (then describe the felt effect, e.g.
  "improves performance when selling large stacks of items", not "reduced redundant API
  calls").
- Base content only on files that actually changed — never invent an entry from conversation
  context alone.
- Match existing tone: bullets read like short release-note prose, not a commit log.
- This skill only drafts/edits the `.mdx` file — never runs `git commit` or touches
  `package.json`/`Cargo.toml`/`tauri.conf.json` version fields.
