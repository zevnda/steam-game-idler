---
name: generate-ui-guide
description: Generate or refresh a rich, click-by-click UI walkthrough for one Steam Game Idler feature by reading its real component source, for the AI Assistant's Voyage/Haiku corpus. Use when the user asks to generate, regenerate, or update a UI guide for a feature (e.g. "/generate-ui-guide achievement-unlocker") or says a feature's on-disk UI description is stale.
---

# Generate UI guide

Produces `ai-corpus/ui-guides/<feature>.md` — one of the AI Assistant's three corpus sources (see
`scripts/build-ai-corpus.mjs`). This is a deliberate, reviewed, one-shot content-authoring step,
not something regenerated per user question: the goal is a markdown walkthrough precise enough
that Haiku can answer "how do I reorder achievements in the unlocker" with the same granularity a
person who actually looked at the UI would give — exact icon shapes, button positions, modal
names, click targets — grounded in the real component code, not a guess.

## When to run this

- The user names a feature and asks for its UI guide to be generated or refreshed.
- A PR meaningfully changed a feature's layout, icons, modal names, or interaction flow, and its
  existing `ai-corpus/ui-guides/<feature>.md` (if one exists) would now describe something that
  no longer matches the UI.

## Steps

1. **Find the feature's component tree.** Features live under `src/features/<feature>/` (see root
   `CLAUDE.md`'s "Repo layout"). Read every component under `src/features/<feature>/components/`
   that renders visible UI — not just the top-level page, but overlays/modals it opens (check
   `src/shared/components/dashboard/DashboardShell.tsx` for overlays gated behind that feature's
   own zustand store) and any shared components it composes.

2. **Read for the visual/interactive detail, not the business logic.** For each interactive
   element, note:
   - The exact icon component name and library (e.g. `GoGrabber` from `react-icons/go`) — describe
     what it actually looks like (a grabber reads as "six dots in two rows", an X as "a close/remove
     button", etc.) rather than just naming the import.
   - Its literal on-screen label or `aria-label` (pull the actual string from
     `src/i18n/locales/en-US.json`, not a paraphrase) and where it sits relative to other elements
     (e.g. "top-right corner of each game card", "far right of the row").
   - What clicking/dragging it does, and what opens as a result (name the actual modal/overlay
     component's user-facing title).
   - Any tier-gating (`hasCasualAccess`/`hasGamerAccess`, `TierBadge`) — mention it only if it
     changes what the user sees or can click, matching how the gated control actually behaves (see
     root `CLAUDE.md`'s HeroUI/tier-gating gotchas — a gated control stays real and pressable, it's
     not disabled).

3. **Verify against real code, not memory.** Don't describe a button/icon/flow you haven't actually
   read this session — if a detail can't be confirmed by opening the file, leave it out rather than
   guessing. This corpus is the difference between a paid feature giving genuinely precise answers
   and generic filler; an invented detail that turns out wrong is worse than no detail at all.

4. **Write the guide** to `ai-corpus/ui-guides/<feature>.md` in prose, structured with `##`
   headings per distinct task/flow (the build script chunks by heading — one heading per
   retrievable unit of "how do I do X"). Start the file with:
   ```
   <!-- url: https://steamgameidler.com/docs/features/<feature> -->
   # <Feature display name>
   ```
   adjusting the `url` comment if the feature's real docs page lives at a different path (check
   `docs/app/(marketing)/docs/_content/`'s structure) or omitting it if no matching docs page
   exists. Keep a short note at the top (mirroring `ai-corpus/ui-guides/achievement-unlocker.md`)
   that this file is generated corpus content and should be regenerated via this skill when the
   feature's UI changes — not hand-edited to patch small drift.

5. **Tell the user what changed** — which components you read, and whether this is a new guide or
   a refresh (and if a refresh, what actually changed vs. the previous version). Don't run
   `scripts/build-ai-corpus.mjs` automatically; that step needs a `VOYAGE_API_KEY` and re-embeds
   the *entire* corpus, so leave it for the user to run deliberately once they're done reviewing
   the generated markdown.

## Reference example

`ai-corpus/ui-guides/achievement-unlocker.md` was written this way against
`src/features/achievement-unlocker/components/AchievementOrderRow.tsx`,
`AchievementOrderOverlay.tsx`, `AchievementOrderHeader.tsx`, `AchievementUnlockerListCard.tsx`, and
`AchievementUnlockerPage.tsx` — use it as the calibration for level of detail and tone.
