---
name: generate-ui-guide
description: Generate or refresh a rich, click-by-click UI walkthrough for one Steam Game Idler feature by reading its real component source, its full docs subtree, and its cross-feature connections, for the AI Assistant's Voyage/Haiku corpus. Use when the user asks to generate, regenerate, or update a UI guide for a feature (e.g. "/generate-ui-guide achievement-unlocker") or says a feature's on-disk UI description is stale.
---

# Generate UI guide

Produces `ai-corpus/ui-guides/<feature>.md` — one of the AI Assistant's corpus sources (see
`scripts/build-ai-corpus.mjs`). This is a deliberate, reviewed, one-shot content-authoring step,
not something regenerated per user question. **The AI Assistant is a paid feature.** The bar is:
Haiku answers any "how do I do X," "why isn't X happening," or "what does the X button next to Y
do" question about this feature with the precision of someone who actually read every relevant
file — from this one generated file alone, with no room to misinterpret it. A vague, generic, or
incomplete description is a failure of this skill, not an acceptable output.

**This file becomes the single source of truth the AI corpus uses for this feature.** Once
generated, `scripts/build-ai-corpus.mjs` excludes every docs page this guide supersedes (step 5)
from the corpus entirely — anything left out of this file that only existed in a docs page is now
gone from what the AI can answer from. Err toward including a fact, never toward brevity.

**A feature is never just its own folder.** This app is a single long-running dashboard shell with
shared stores, shared overlays, a shared idle-claims registry, and a shared tier-gating pattern —
most features touch several of these. Treat "full coverage" as covering the feature's own UI *and*
every point where it connects to something else, not just what's under `src/features/<feature>/`.

## When to run this

- The user names a feature and asks for its UI guide to be generated or refreshed.
- A PR meaningfully changed a feature's layout, icons, modal names, interaction flow, or settings,
  and its existing `ai-corpus/ui-guides/<feature>.md` (if one exists) would now describe something
  that no longer matches the UI.
- A docs page under that feature's subtree changed (new restriction, new fee, new setting) and the
  guide needs the same update folded in.

## The redaction list — read this before writing anything

This skill's step 3 requires verifying every tier-gated control against the real code that
enforces it — and that verification step is exactly what can surface a fact that must never end up
in this file. A 2026-09-08 regeneration sweep found several freshly-generated ui-guides had done
exactly this: explicitly stated that a tier gate has no Rust-side/backend enforcement at all,
because that's genuinely what reading the code shows. That fact is real, but it's also a direct map
of the attack surface for getting Pro features for free — see `generate-architecture-guide`'s own
redaction list for why this specific fact is treated as the most sensitive one in the codebase.

**Never write any of the following into a generated ui-guide, no matter how naturally the
verification step surfaces it:**

1. **That a tier/Pro gate has no server/Rust-side backstop.** It's fine, expected, and often
   necessary to describe a gated control's *user-visible* behavior in detail (which tier unlocks
   it, that it stays a real clickable element with a `TierBadge` instead of `isDisabled`, that it
   reroutes to `openWithTier(tier)`) — that's exactly what this skill asks for. It is never fine to
   also state *how* that gate is enforced under the hood, or that it isn't enforced outside the
   frontend at all. If your verification pass confirms a gate is frontend-only, describe the UI
   behavior and stop there — don't narrate the enforcement mechanism.
2. **Steam Web API key embedding/obfuscation mechanics** — e.g. that a missing/invalid key
   "decodes" or is otherwise processed at runtime. Describe the resulting user-visible error only
   ("the app's built-in Steam Web API key couldn't be resolved"), never the mechanism.
3. **How a license key or device fingerprint is derived or validated internally** — e.g. naming the
   crate/library/algorithm behind `get_device_fingerprint` or similar. "A license key is tied to one
   device, transferring needs confirmation" is fine (already public); how that check works, or
   anything that could help someone spoof it, is not.
4. **How the AI Assistant's own quota/identity tracking works** — never state that it identifies a
   caller by device fingerprint, how that's derived, or anything that would help someone game their
   daily message cap. It's fine to describe the visible quota UI (a counter, a "limit reached"
   state) without explaining what's behind it.

If a topic can't be described well without touching one of these, describe the UI-visible behavior
and stop — a less complete answer is always the safer failure mode than an exposed one. If you're
unsure whether a detail crosses this line, leave it out.

## Steps

### 1. Read the reference files first

Read all four files in this skill's `references/` folder before touching the feature itself:

- `references/frontend-architecture.md` — shared stores, DashboardShell overlays, shared UI
  components, the idle-claims frontend pattern, multi-account mechanics, tier-gating pattern,
  sidebar registration.
- `references/backend-architecture.md` — backend module map, the idle-claims registry, sign-in-mode
  branching, IPC event routing, settings-file ownership.
- `references/docs-site-map.md` — the full docs page tree, which docs subtree backs which
  `src/features/` folder (not always 1:1 by name — check it), and the site's content conventions
  (Callout types, Steps nesting, tier-gating prose, DocsCTA placement).
- `references/mockbutton-catalog.md` — every `<MockButton type='...' />` value and exactly what it
  renders as.

These are a checklist and a map, not a substitute for reading the feature's actual current files —
they tell you *where to look and what to check*, not what to write. If anything in them turns out
stale when you check it against real code/docs this run, fix that reference file too and mention it
in your report (step 8).

### 2. Find the full component tree — not just the top-level page

Most features live under `src/features/<feature>/` (see root `CLAUDE.md`'s "Repo layout"). Read
**every** component under `src/features/<feature>/components/` that renders visible UI — not just
the top-level page, but every overlay/modal it opens (cross-check against
`frontend-architecture.md`'s DashboardShell overlay table — a feature can trigger an overlay it
doesn't own, e.g. any `GameCard` opens achievement-manager), any shared components it composes, and
its own Settings tab component if one exists (settings are part of "how do I use this feature," not
a separate concern).

**Global/shared UI that isn't tied to one feature** (titlebar, sidebar, notifications, account
switcher chrome) doesn't live under `src/features/` — target `src/shared/components/<area>/`
instead (e.g. `/generate-ui-guide titlebar` → `src/shared/components/titlebar/`). Same process
either way; only the source folder differs.

### 3. Trace every cross-feature connection this feature actually has

Using `frontend-architecture.md` and `backend-architecture.md` as your checklist, verify — by
actually reading the real code, not by assuming the reference file is still accurate — which of
these apply to this feature, and write each one you confirm into the guide as its own point, not a
passing aside:

- **Shared stores**: which cross-feature stores (`sessionStore`, `settingsModalStore`,
  `searchStore`, `sortPreferencesStore`, `proModalStore`, `subscriptionStore`, `steamCookiesStore`,
  etc.) does this feature read or write, and what does that actually change about what the user
  sees? If this feature owns a `Record<AccountKey,T>` store, which *other* features/chrome read it
  (e.g. Sidebar's pulse dot, account-switcher's per-row indicator)?
- **Overlays**: does this feature open an overlay it doesn't own (achievement-manager from a
  `GameCard`), or does another feature/context-menu open an overlay this feature owns?
- **Idle claims**: if this feature idles games, which owner constant does it claim under, does its
  own backend loop re-claim on a tick (meaning its Idling-page "Stop" must dispatch its own stop
  command, not the generic one), and what happens to a game claimed by more than one owner?
- **Tier-gating**: every gated control in this feature stays a real, clickable, non-`isDisabled`
  element with a `TierBadge`, rerouted to `openWithTier(tier)` — verify this is actually how each
  gated control here behaves (read the component), and name the exact tier each one requires.
- **Sign-in-mode differences**: does this feature's backend command branch on `GamesAccount`
  (agent vs. CLI/local)? If so, does that change what the user can click, or only what happens
  invisibly behind a click? Only mention a difference you've actually confirmed by reading the
  command's match arms — don't assume one exists just because the app supports two sign-in modes.
- **Settings**: which settings file(s) back this feature's Settings tab, and is any setting here
  actually a cross-feature one (e.g. `max_playtime_settings.json`, read by four different
  automation features, not owned by any single one)?

If a check above genuinely doesn't apply to this feature, that's fine — don't force a connection
that isn't real. The point is checking all of them, not finding a use for all of them.

### 4. Find and read the ENTIRE docs subtree — not just index.mdx

Docs pages are a second, independent source of real content — some of it (exact domain/behavioral
facts like Steam's card-drop rules, refund windows, fees) doesn't exist anywhere in the codebase at
all, so skipping it silently drops real knowledge from what the AI can answer. Use
`docs-site-map.md`'s "which docs subtree backs which feature" table to find the right subtree (it's
not always name-matched — e.g. manual idling's docs page is `playtime-booster.mdx`, not
`idling.mdx`), then:

1. Read `meta.json` in that folder if one exists — its `pages` array lists every sub-page. Read
   **all of them in full**, not just `index.mdx` (e.g. card-farming's subtree is `index.mdx`,
   `how-it-works.mdx`, `blacklisting-games.mdx`, `card-drop-times.mdx` — all four matter).
2. Read the feature's matching `docs/.../settings/<feature>.mdx` page if one exists — it usually
   carries framing/rationale for each setting the component code alone doesn't (numeric thresholds,
   tier requirements, why a setting exists).
3. Skim any page those subpages directly link to that's load-bearing for understanding the feature
   (e.g. `steam-credentials.mdx` if the feature needs a Steam Community cookie connection,
   `how-to-sign-in.mdx` if behavior differs by sign-in mode) — you don't need to fold the entire
   linked page in, just don't miss something the feature's own docs assume the reader knows.
4. Check `ai-corpus/architecture-guides/` for a file already covering this feature's "how it works
   under the hood" content. If one exists and is comprehensive for that angle, don't duplicate it —
   reference it by name in your report instead. If deep behavioral knowledge exists only in a docs
   page and nowhere in an architecture guide (e.g. card-farming's phase system in
   `how-it-works.mdx`, or card-drop-times.mdx's troubleshooting list), fold it into this ui-guide —
   it needs to live *somewhere* in the corpus, and this is the only other place it fits.
5. Every time you read a docs page, cross-check its `<MockButton type='...' />` usages against
   `mockbutton-catalog.md` — the rendered label there is the button's real name; a section heading
   or surrounding prose is not. (This is exactly the bug this skill's docs-merging step exists to
   catch: a docs page's `### Farm All Games With Drops Remaining` heading was once misread as a
   button label, when the actual button renders "Start.")

### 5. Resolve conflicts: code wins on UI facts, docs win on domain facts

These two sources disagree sometimes — that's exactly the drift this skill exists to catch, not
something to average together or repeat both versions of.

- **For anything about the literal interface** (button labels, icon shapes, click paths, what tab
  something lives on, what state gates what, what happens when you click something) — the
  component source is ground truth. If a docs page describes a step, button, or flow that doesn't
  match what you actually read in the components, the docs page is stale: write what the code
  actually does, and record the mismatch for your report in step 8. Do not describe a step that
  isn't backed by a real component you read.
- **For domain/behavioral facts that don't exist in the codebase at all** (Steam's own drop-time
  rules, refund-window lengths, marketplace fees, what "Limited Account" means) — the docs page is
  the only source; carry it over faithfully, don't paraphrase numbers or thresholds loosely.
- **For settings**: the component (`*SettingsTab.tsx`) is ground truth for what control exists and
  how it behaves (toggle, mutually-exclusive pair, tier-gated); the docs settings page is ground
  truth for *why* it exists / what threshold to recommend, if the docs page adds that and the code
  doesn't.

### 6. Read for the visual/interactive detail, not the business logic

For each interactive element, note:

- The exact icon component name and library (e.g. `GoGrabber` from `react-icons/go`) — describe
  what it actually looks like (a grabber reads as "six dots in two rows", an X as "a close/remove
  button", etc.) rather than just naming the import.
- Its literal on-screen label or `aria-label` (pull the actual string from
  `src/i18n/locales/en-US.json`, not a paraphrase) and where it sits relative to other elements
  (e.g. "top-right corner of each game card", "far right of the row").
- What clicking/dragging it does, and what opens as a result (name the actual modal/overlay
  component's user-facing title).
- Every distinct state a screen/control can be in: empty state, loading state, error state,
  pending/in-flight state, and what each one actually shows (exact copy, not "an error message").
- Any tier-gating — mention it only if it changes what the user sees or can click, matching the
  real gated-control pattern (see step 3).

### 7. Verify against real files, not memory

Don't describe a button/icon/flow/fact/cross-feature connection you haven't actually read this
session — if a detail can't be confirmed by opening the file (component, docs page, or reference
file), leave it out rather than guessing. An invented detail that turns out wrong is worse than no
detail at all.

### 8. Write the merged guide to `ai-corpus/ui-guides/<feature>.md`

Prose, structured with `##` headings per distinct task/flow/sub-feature/cross-feature connection
(the build script chunks by heading — **one heading is one independently-retrieved unit**, so each
`##` section must be self-contained: restate whatever context it needs rather than relying on an
earlier section — "as mentioned above" is a bug in this file, not a style choice, since the AI may
only ever see that one section for a given question). Cover every sub-feature and every confirmed
cross-feature connection from steps 2-3 as its own section.

Start the file with:
```
<!-- url: https://steamgameidler.com/docs/features/<feature> -->
<!-- supersedes: https://steamgameidler.com/docs/features/<feature>/how-it-works, https://steamgameidler.com/docs/features/<feature>/other-subpage -->
# <Feature display name>
```
- `url` is the single canonical link shown to the end user when the AI Assistant cites this source
  — always the feature's main docs page (check `docs-site-map.md`'s subtree table for the real
  path — it isn't always name-matched), or omitted if no matching docs page exists at all.
- `supersedes` (omit the line entirely if there's nothing to list) is every *other* docs URL whose
  content you folded into this file in step 4 — every subpage and settings page you read and
  incorporated, besides the one already named in `url`. `scripts/build-ai-corpus.mjs` drops these
  pages from the corpus entirely once listed here, so only list a URL once you're confident this
  file actually carries everything from it worth knowing — don't list a subpage you skimmed but
  didn't really fold in.

Keep a short note at the top (mirroring `ai-corpus/ui-guides/achievement-unlocker.md`) that this
file is generated corpus content, is the single merged source for this feature (UI + docs + its
cross-feature connections), and should be regenerated via this skill when any of those change — not
hand-edited to patch small drift.

### 9. Tell the user what changed

Report:
- Which components you read, and whether this is a new guide or a refresh (and if a refresh, what
  actually changed vs. the previous version).
- Which docs pages you read and folded in (i.e. what you put in `supersedes`), and which linked
  pages you only skimmed for context without folding in.
- Which cross-feature connections (shared stores, overlays, idle claims, tier-gating, sign-in-mode
  differences) you confirmed and included.
- Any mismatch you found between what a docs page said and what the code actually does, or between
  a reference file and reality (and whether you fixed the reference file) — call these out
  explicitly, since the live public docs page still needs a separate, manual fix; this skill only
  fixes the AI's corpus, not the published site.

Don't run `scripts/build-ai-corpus.mjs` automatically; that step needs a `VOYAGE_API_KEY` and
re-embeds the *entire* corpus, so leave it for the user to run deliberately once they're done
reviewing the generated markdown.

## Reference example

`ai-corpus/ui-guides/achievement-unlocker.md` was written this way against
`src/features/achievement-unlocker/components/AchievementOrderRow.tsx`,
`AchievementOrderOverlay.tsx`, `AchievementOrderHeader.tsx`, `AchievementUnlockerListCard.tsx`, and
`AchievementUnlockerPage.tsx` — use it as the calibration for level of detail and tone on the
UI-description side (it predates the docs-merging and cross-feature-connection steps above, so
don't treat it as a calibration for those — only for how precisely a single UI interaction should
be described).
