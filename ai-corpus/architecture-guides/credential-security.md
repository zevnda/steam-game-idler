# How SGI keeps your Steam credentials secure

Generated corpus content (see `.claude/skills/generate-architecture-guide/SKILL.md`) — verified
against `src-tauri/src/credential_store.rs`. Regenerate via that skill if this behavior changes;
don't hand-edit to patch small drift.

## Your Steam password is never stored

SGI never stores your Steam password anywhere, on any sign-in method. Steam Sign-in only keeps a
sign-in token issued by Steam after you've successfully authenticated (including passing Steam
Guard) — the same kind of token your web browser or the official Steam app keeps you signed in
with. Legacy Sign-in doesn't need to store any credential at all, since it relies on a Steam client
that's already signed in on your machine.

## Where sign-in tokens and cookies actually live

SGI's regular settings are stored as a plain file on your computer, which is fine for ordinary
preferences but not for anything sensitive. Your Steam Sign-in token, and any Steam Community
session cookies you save (used by Card Farming and Inventory Manager), are instead handed off to
your operating system's own secure credential storage — Windows Credential Manager on Windows, the
equivalent OS-level secure storage on Linux — the same secure storage layer used by many
password-protected apps on your system, not a plain SGI-controlled file.

## Why this matters if you ever copy your SGI data elsewhere

Because your sign-in token and cookies live in your OS's own credential store rather than in SGI's
plain settings file, copying your SGI settings/cache folder to another computer (or backing it up
to the cloud) doesn't hand over anything usable — the credential store entries stay behind, tied to
your specific Windows or Linux user account on that one machine. Signing in again on a new device
is the only way to get a working session there.

## A custom Steam Web API key

If you've entered your own Steam Web API key as an override in Settings, that's stored the same
secure way as your sign-in token and cookies — not in the plain settings file.
