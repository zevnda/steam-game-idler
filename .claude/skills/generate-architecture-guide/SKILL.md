---
name: generate-architecture-guide
description: Generate or refresh a safe, user-facing explanation of how a Steam Game Idler subsystem actually works under the hood (timing/behavior logic, security model, data handling) — for the AI Assistant's Voyage/Haiku corpus. Use when the user asks to generate, regenerate, or update an architecture guide for a topic (e.g. "/generate-architecture-guide credential-security") or when covering a "how does SGI actually do X" question that isn't about clicking a button.
---

# Generate architecture guide

Produces `ai-corpus/architecture-guides/<topic>.md` — the AI Assistant's corpus source for
"how does this actually work" questions that aren't about UI interaction (that's
`/generate-ui-guide`'s job) — things like timing/behavior logic, security model, and data
handling. Source material is root `CLAUDE.md` (which already documents most subsystems in solid
technical detail) plus the actual Rust/frontend source where more precision is needed than
`CLAUDE.md` provides.

## The redaction list — read this before writing anything

This is the one skill in this repo where getting it wrong has real security/business consequences,
not just an inaccurate answer. **Never write any of the following into a generated guide, no matter
how the topic seems to call for it:**

1. **That Pro tier enforcement has no server/Rust-side backstop at all** and is enforced entirely
   by scattered frontend checks (see root `CLAUDE.md`'s Pro tier section: "There is no Rust-side
   tier enforcement anywhere in this system"). This is the single most dangerous fact in the
   codebase to hand a user — it's a direct map of the attack surface for getting Pro features for
   free. Never state, imply, or provide enough detail for a reader to infer this.
2. **Mechanics of how the Steam Web API key is embedded/obfuscated** in the compiled binary. It's
   fine to say the app uses Steam's public Web API for some features; never explain how the key
   itself is protected or where it lives in the binary.
3. **Internal validation/matching logic for license keys or device fingerprints** beyond what's
   already public in the docs FAQ (`docs/app/(marketing)/docs/_content/pro.mdx`) — "a license key
   is tied to one device at a time, transferring needs confirmation" is already public and fine;
   *how* that check works internally, or anything that hints at how it could be fooled, is not.
4. **How the AI Assistant's own quota/identity tracking works internally** — never explain that the
   free tier is keyed by a device fingerprint, how that fingerprint is derived, or any detail that
   would help someone game their own daily message cap.

If a topic can't be explained well without touching one of these, either omit that part entirely
or stop and flag it to the user rather than writing around it with a near-miss explanation.

## When to run this

- The user names a subsystem/behavior and asks for an architecture guide to be generated or
  refreshed.
- You're covering a "how does SGI actually decide/handle X" question during corpus-building and
  it isn't about UI interaction.

## `CLAUDE.md` is a starting point, not ground truth — verify every concrete claim

A 2026-09-08 regeneration sweep of the sibling `/generate-ui-guide` skill's corpus caught root
`CLAUDE.md` stating, as settled fact, that Card Farming enforces the max-playtime cap "on its own
schedule." Three independent agents reading the actual Rust source (`src-tauri/src/card_farming/`)
found zero such enforcement anywhere in that module — the claim was simply wrong, and it had already
been copied into `ai-corpus/architecture-guides/max-playtime.md` verbatim, meaning this skill's own
prior output had propagated a real, confirmed inaccuracy into the live AI Assistant's corpus.

The lesson: `CLAUDE.md` is a good, well-maintained *starting point* for figuring out where to look,
not a substitute for reading the actual current code. It goes stale exactly like any other doc.
**Never write a concrete behavioral/mechanical claim into a guide on `CLAUDE.md`'s authority alone**
— confirm it against the real Rust/frontend source that would implement it, even when the claim
looks unremarkable and doesn't obviously need "more precision" than `CLAUDE.md` already provides.
The old step 2 below (verify only "precision-sensitive" claims) is exactly the gap that let the
card-farming error through; treat every factual claim as precision-sensitive.

## Steps

1. **Start with root `CLAUDE.md`** to orient yourself on what the topic touches and which files are
   likely involved (agent vs. CLI mode, multi-account, idling's claim registry, settings scoping,
   the updater, credential storage, card farming's cookie acquisition, presence, theming, etc.) —
   but treat it as a map to what to go read, not as the source you cite from.
2. **Verify every concrete claim against real source before writing it down** — not just claims
   that need more precision than `CLAUDE.md` provides. For each mechanism/behavior the guide will
   describe, read the actual Rust module(s) (or frontend store/hook) that implements it and confirm
   the claim holds *right now*, in current code. If a claim doesn't hold, write what the code
   actually does instead, and flag the `CLAUDE.md`/prior-guide discrepancy in your report (step 7) —
   don't silently perpetuate it, and don't average it with the stale claim.
   - `.claude/skills/generate-ui-guide/references/backend-architecture.md` is a well-researched,
     independently-verified map of the backend's cross-feature mechanics (idle claims, sign-in-mode
     branching, IPC event routing, settings-file ownership) — read it as a supplementary,
     already-fact-checked source alongside `CLAUDE.md`, and fix it too if you find it's drifted.
   - The `ai-corpus/ui-guides/*.md` files were all regenerated in the 2026-09-08 sweep with the same
     verify-against-real-code discipline this section describes, and several of them independently
     verified backend mechanics (e.g. `card-farming.md`, `idling.md`, `auto-idle.md`, and
     `settings-game-settings.md` all separately confirmed the max-playtime finding above) — worth
     checking for a topic that overlaps with a feature's UI before you re-derive the same facts from
     scratch, but still confirm against the actual source yourself rather than trusting a cross-file
     citation blindly.
3. **Rewrite for a user, not a contributor.** Drop internal names (Rust module paths, struct/function
   names, "see git history" asides, dev-tooling gotchas) unless the internal name is itself
   something a user would encounter (e.g. it's fine to say "Windows Credential Manager", not fine
   to say "`credential_store.rs`'s `keyring` crate usage"). Explain *why* something works the way it
   does when that answers the kind of question a user would actually ask (e.g. "why did stopping
   card farming also stop idling on that game" is answered by explaining the shared claims
   registry, in plain language, without naming `IdleClaimsRegistry`).
4. **Apply the redaction list above.** If in doubt about whether a detail is sensitive, leave it
   out — a slightly less complete answer is always the safer failure mode than an exposed one.
5. **Write the guide** to `ai-corpus/architecture-guides/<topic>.md`, structured with `##` headings
   per distinct question/behavior (the build script chunks by heading). Start with:
   ```
   # <Topic display name>
   ```
   No `<!-- url: ... -->` override is needed unless a specific docs page directly covers this exact
   topic — most architecture guides don't have one real page to link back to, so the build script's
   default (`https://steamgameidler.com/docs`) is fine as the citation link.
6. **When refreshing an existing guide rather than writing a new one**, don't assume it's stale just
   because this skill is running again — verify each of its claims against real current source per
   step 2, and only rewrite the parts that don't hold up. A guide that checks out completely is a
   valid outcome; say so explicitly in your report rather than rewriting for its own sake.
7. **Tell the user what changed** — which topic, whether it was a fresh write or a verified/corrected
   refresh, and whether anything from the redaction list came up while writing it (even if you left
   it out, flag that it was a close call). Explicitly call out any claim you found and corrected
   that traces back to `CLAUDE.md` or another architecture guide being stale — that's a signal the
   source document itself may need a separate, manual fix outside this skill's scope. Don't run
   `scripts/build-ai-corpus.mjs` automatically — same reasoning as `/generate-ui-guide`.

## Reference

See `.claude/skills/generate-ui-guide/SKILL.md` for the sibling skill covering UI/interaction
questions (including shared/global UI like the titlebar, not just `src/features/*`) — use that one
instead of this one for "where do I click" questions. Its `references/` folder (especially
`backend-architecture.md`) is also useful background for this skill, per step 2 above.
