---
name: commit-desc
description: >
  Write a Conventional Commits message compressed to intent only, scoped from
  the files actually changed and validated against CONTRIBUTING.md. Use for
  "write a commit", "commit message", or /commit-desc.
---

Write commit messages terse and exact. Conventional Commits format. No fluff. Why over what.

## Process

1. Determine the changed files with `git status --porcelain=v1 -uall` first —
   `git diff` alone never lists untracked (`??`) files, staged or not, so
   skipping this step silently misses new files. From that output:
   - If anything is staged (any non-`??`, non-space status in the first
     column), the changed set is `git diff --staged --name-only` plus any
     `??` untracked files.
   - Otherwise, fall back to the working tree: `git diff --name-only`
     (unstaged tracked changes) plus any `??` untracked files.
   - Say which source(s) you used (staged / unstaged / untracked / a mix).
   Never guess — always run `git status` before falling back to assumptions.
2. Read the actual content, not just the file list — type and summary come
   from what changed, not from filenames alone:
   - Tracked changes: `git diff --staged` or `git diff`.
   - Untracked files: they have no diff to read (`git diff` never shows
     them). Read each one directly with the Read tool — its full content is
     what scopes/types the change. Never run `git add` just to force a diff
     out of them; staging is the user's action, not this skill's.
3. Read `CONTRIBUTING.md` fresh (don't rely on memory of its contents) and
   map the change to its `type`/`scope` tables:
   - **type** from the nature of the change — bug fix → `fix`, new
     capability → `feat`, behavior-preserving restructure → `refactor`,
     formatting/comment-only → `chore`, `/libs/SteamUtility` → `libs`,
     `/docs` or README/CONTRIBUTING/changelog → `docs`, CI workflow → `ci`,
     config file (`tauri.conf.json`, `next.config.js`, `tsconfig.json`) →
     `config`, build system/deps → `build`, measurable perf win → `perf`.
   - **scope** from the path table (e.g. `src/features/card-farming/**` or
     `src-tauri/src/card_farming/**` → `card-farming`). If changed files span
     multiple scopes, pick the scope of the dominant change, or omit scope
     entirely for a genuinely cross-cutting change (scope is optional per
     CONTRIBUTING.md).
4. Output one line: `<type>(<scope>): <summary>` — present tense, not
   capitalized, no trailing period. If the staged/changed files contain
   multiple unrelated changes, try to find a comparison between them and
   generate a broad summary that encompasses all the changes. If you can't
   find a common theme, decide which change is considered the bigger of th
   lot and focus on that for the commit message.

## Rules

- Base type/scope/summary only on files that actually changed — never infer
  from conversation context alone.
- Match CONTRIBUTING.md's allowed `type` and `scope` values exactly; don't
  invent a new one even if it reads better.
- Prefer the most specific applicable scope over a broader one (e.g.
  `card-farming` over `automation` when the change only touches card
  farming).
- Present tense, lowercase after the colon, no trailing period, no fluff.
- Why over what: the summary should say what changed in behavior, not
  narrate the diff.
- If nothing is staged or changed, say so instead of fabricating a message.
- This skill only drafts the message — never run `git commit` yourself; the
  user commits.
