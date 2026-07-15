//! Small async helpers shared by long-running background-task features. Extracted from
//! `card_farming::manager` once `achievement_unlocker::manager` became a second real consumer of
//! [`wait_ticking`], not built speculatively ahead of that second use.

use std::sync::atomic::{AtomicBool, Ordering};
use std::time::Duration;

/// How often [`wait_ticking`] re-checks `stopped` - keeps a `stop`/`stop_*` call responsive
/// instead of blocking on the full `total` duration.
const STOP_CHECK_INTERVAL: Duration = Duration::from_secs(1);

/// Sleeps for `total`, checking `stopped` every [`STOP_CHECK_INTERVAL`] - returns `true` if a stop
/// was detected before `total` elapsed.
pub async fn wait_ticking(total: Duration, stopped: &AtomicBool) -> bool {
    let mut waited = Duration::ZERO;
    while waited < total {
        if stopped.load(Ordering::SeqCst) {
            return true;
        }
        let tick = STOP_CHECK_INTERVAL.min(total - waited);
        tokio::time::sleep(tick).await;
        waited += tick;
    }
    stopped.load(Ordering::SeqCst)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn returns_true_immediately_when_already_stopped() {
        let stopped = AtomicBool::new(true);
        let start = std::time::Instant::now();
        assert!(wait_ticking(Duration::from_secs(60), &stopped).await);
        assert!(start.elapsed() < Duration::from_millis(100));
    }

    #[tokio::test]
    async fn returns_false_once_the_full_duration_elapses_untouched() {
        let stopped = AtomicBool::new(false);
        assert!(!wait_ticking(Duration::from_millis(30), &stopped).await);
    }

    #[tokio::test]
    async fn detects_a_stop_requested_after_waiting_has_already_begun() {
        let stopped = std::sync::Arc::new(AtomicBool::new(false));
        let waiter_flag = stopped.clone();
        let handle =
            tokio::spawn(async move { wait_ticking(Duration::from_secs(10), &waiter_flag).await });

        tokio::time::sleep(Duration::from_millis(50)).await;
        stopped.store(true, Ordering::SeqCst);

        // STOP_CHECK_INTERVAL is 1s, so this should resolve well within 2s - not anywhere near the
        // full 10s `total`, which is the whole point of ticking rather than one long sleep.
        let result = tokio::time::timeout(Duration::from_secs(2), handle)
            .await
            .expect("wait_ticking did not notice the stop flag promptly")
            .expect("wait_ticking task panicked");
        assert!(result);
    }
}
