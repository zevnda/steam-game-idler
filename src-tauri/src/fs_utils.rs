//! Small filesystem helpers shared across features - currently just the atomic-write pattern used
//! anywhere JSON state is persisted to disk (`settings.json`, `user_summaries.json`), so a crash or
//! power loss mid-write can never leave a truncated/corrupt file behind.

use std::path::Path;
use std::sync::atomic::{AtomicU64, Ordering};

use serde::Serialize;

static ATOMIC_WRITE_COUNTER: AtomicU64 = AtomicU64::new(0);

/// Writes JSON to `path` via a temp-file-then-rename so a crash or power loss mid-write can never
/// leave a truncated/corrupt file behind - `rename` on the same filesystem is atomic. The temp
/// filename combines the process id with a monotonic counter, not just the pid: two writes from
/// the same process share one pid, so the counter is what actually prevents them from colliding on
/// the same temp path.
pub fn atomic_write_json<T: Serialize + ?Sized>(path: &Path, value: &T) -> std::io::Result<()> {
    let json = serde_json::to_string_pretty(value).map_err(std::io::Error::other)?;
    let unique = ATOMIC_WRITE_COUNTER.fetch_add(1, Ordering::Relaxed);
    let tmp_path = path.with_extension(format!("{}-{}.tmp", std::process::id(), unique));
    std::fs::write(&tmp_path, &json)?;
    std::fs::rename(&tmp_path, path)?;
    Ok(())
}
