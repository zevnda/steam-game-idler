//! CLI-mode achievement/stat data and actions: one-shot `SteamUtility.exe` spawns via
//! `steam_utility_exe::run_and_parse`, same envelope-parsing convention `ownership.rs` uses.
//! Requires a real, running, signed-in local Steam client (Steamworks.NET-backed).
//!
//! Ported from `main`'s `achievement_manager.rs`: a process-wide semaphore caps concurrent
//! `SteamUtility.exe` spawns for achievement/stat operations, so a burst of individual toggles
//! (e.g. a future multi-select unlock in the achievement-manager UI) can't spawn unbounded
//! processes at once.

use std::sync::LazyLock;

use tokio::sync::Semaphore;

use crate::achievements::{AchievementData, BulkAchievementResult, StatUpdate};
use crate::error::AppResult;
use crate::steam_utility_exe;

static ACHIEVEMENT_PROCESS_LIMIT: LazyLock<Semaphore> = LazyLock::new(|| Semaphore::new(6));

async fn run<T: serde::de::DeserializeOwned>(args: &[&str]) -> AppResult<T> {
    let _permit = ACHIEVEMENT_PROCESS_LIMIT
        .acquire()
        .await
        .expect("semaphore is never closed");
    steam_utility_exe::run_and_parse(args).await
}

pub async fn get_achievement_data(app_id: u32) -> AppResult<AchievementData> {
    run(&["get_achievement_data", &app_id.to_string()]).await
}

/// Unlocks or locks a single achievement - dispatches to the CLI's `unlock_achievement`/
/// `lock_achievement` verb based on `unlock` (no separate toggle verb needed here; the caller
/// already knows the achievement's current state from a prior `get_achievement_data`).
pub async fn set_achievement(app_id: u32, achievement_id: &str, unlock: bool) -> AppResult<()> {
    let cmd = if unlock {
        "unlock_achievement"
    } else {
        "lock_achievement"
    };
    let _: serde_json::Value = run(&[cmd, &app_id.to_string(), achievement_id]).await?;
    Ok(())
}

pub async fn unlock_all_achievements(app_id: u32) -> AppResult<BulkAchievementResult> {
    run(&["unlock_all_achievements", &app_id.to_string()]).await
}

pub async fn lock_all_achievements(app_id: u32) -> AppResult<BulkAchievementResult> {
    run(&["lock_all_achievements", &app_id.to_string()]).await
}

/// JSON-encodes `stats` as a single CLI arg, matching `UpdateStatsCommand`'s
/// `string.Join(" ", args.Skip(2))` parsing (it re-joins every arg after `app_id` with spaces
/// before deserializing, so passing the whole array as one already-valid-JSON arg round-trips
/// correctly either way).
pub async fn update_stats(app_id: u32, stats: &[StatUpdate]) -> AppResult<()> {
    let stats_json = serde_json::to_string(stats)?;
    let _: serde_json::Value = run(&["update_stats", &app_id.to_string(), &stats_json]).await?;
    Ok(())
}

pub async fn reset_all_stats(app_id: u32) -> AppResult<()> {
    let _: serde_json::Value = run(&["reset_all_stats", &app_id.to_string()]).await?;
    Ok(())
}
