//! "Max playtime" - a cross-cutting auto-stop/auto-exclude cap on a game's total playtime
//! (`games::OwnedGame::playtime_forever_minutes`), unlike `idling::settings`/
//! `card_farming::settings`'s own caps, which are each owned by exactly one feature. This one
//! applies across all four ways a game can be running: manual idling, auto-idle, the achievement
//! unlocker, and card farming.
//!
//! Two effects, both driven by [`settings::is_over_cap`]:
//! 1. **Exclude/skip already-over-cap games from automatic queues** - `auto_idle`,
//!    `achievement_unlocker`, and `card_farming`'s own queue/candidate-building code each call
//!    `settings::is_over_cap` directly (see each module's queue-building function) and drop a game
//!    that's already at or over its cap, same as any other "not eligible" filter they already
//!    apply. `idling::commands::toggle_manual_idle`'s manual start path calls it too, returning
//!    `AppError::MaxPlaytimeCapReached` instead of starting.
//! 2. **Stop a game the instant it crosses the cap while already running** - split across two
//!    mechanisms rather than one, because achievement-unlocker/card-farming each keep their own
//!    active-game bookkeeping outside `idling::claims::IdleClaimsRegistry` (see
//!    [`enforcement`]'s module doc comment for the full reasoning):
//!    - [`enforcement`]'s standalone poll loop (spawned once at app startup, see `lib.rs`'s
//!      `.setup()`) covers manual idling and auto-idle, the two owners with no bookkeeping of
//!      their own beyond the claims registry.
//!    - `card_farming::manager::poll_active`'s `StopReason::MaxPlaytimeReached` and
//!      `achievement_unlocker::manager::run_scan_phase`'s over-cap pre-check cover the other two,
//!      natively inside their own loops so their local active-game state stays in sync.

pub mod commands;
pub mod enforcement;
pub mod settings;
