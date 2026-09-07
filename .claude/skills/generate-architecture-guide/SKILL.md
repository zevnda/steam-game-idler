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

## Steps

1. **Start with root `CLAUDE.md`.** It already documents most subsystems (agent vs. CLI mode,
   multi-account, idling's claim registry, settings scoping, the updater, credential storage, card
   farming's cookie acquisition, presence, theming, etc.) in real technical detail — this is your
   primary source, not something to duplicate research for.
2. **Verify precision-sensitive claims against real source** before writing them down — if the
   guide needs to state something more specific than what `CLAUDE.md` already says (an exact
   behavior, a specific condition), read the actual Rust/frontend file rather than guessing or
   extrapolating from the `CLAUDE.md` prose.
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
6. **Tell the user what changed** — which topic, and whether anything from the redaction list came
   up while writing it (even if you left it out, flag that it was a close call). Don't run
   `scripts/build-ai-corpus.mjs` automatically — same reasoning as `/generate-ui-guide`.

## Reference

See `.claude/skills/generate-ui-guide/SKILL.md` for the sibling skill covering UI/interaction
questions (including shared/global UI like the titlebar, not just `src/features/*`) — use that one
instead of this one for "where do I click" questions.
