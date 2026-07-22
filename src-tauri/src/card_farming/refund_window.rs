//! Pure refund-window eligibility check for `settings::CardFarmingSettings::skip_refundable_games`
//! - kept free of any `AppHandle`/IO/manager state so the threshold logic itself is trivially
//! unit-testable, separate from `manager`'s job of deciding *when* to call it and what to do with
//! the result.

/// Mirrors Steam's own refund policy window.
pub const REFUND_WINDOW_DAYS: i64 = 14;
/// Mirrors Steam's own refund policy playtime ceiling.
pub const REFUND_WINDOW_MAX_PLAYTIME_MINUTES: u64 = 120;

const SECONDS_PER_DAY: i64 = 86_400;

/// Returns `Some(farmable_at_unix_seconds)` if this game is still inside Steam's refund window and
/// farming should skip it; `None` if it's safe to farm - already past the playtime ceiling, the
/// purchase (if any) is older than the window, or no refund-eligible purchase exists at all
/// (gifted/key-redeemed/family-shared/free games fail open here rather than blocking farming over
/// data that genuinely doesn't exist for them).
///
/// `farmable_at` is always purchase-date-based, never playtime-based: a game this reports as
/// "skip" has under [`REFUND_WINDOW_MAX_PLAYTIME_MINUTES`] minutes of playtime by definition, and
/// that playtime stays frozen for as long as it's actually being skipped (not farmed, not played
/// elsewhere), so the purchase-date threshold is the only one that can be predicted in advance.
pub fn farmable_at_if_in_refund_window(
    last_refund_eligible_purchase_unix_seconds: Option<i64>,
    current_playtime_minutes: u64,
    now_unix_seconds: i64,
) -> Option<i64> {
    if current_playtime_minutes >= REFUND_WINDOW_MAX_PLAYTIME_MINUTES {
        return None;
    }

    let purchased_at = last_refund_eligible_purchase_unix_seconds?;
    let window_end = purchased_at.saturating_add(REFUND_WINDOW_DAYS * SECONDS_PER_DAY);

    (now_unix_seconds < window_end).then_some(window_end)
}

#[cfg(test)]
mod tests {
    use super::*;

    const DAY: i64 = SECONDS_PER_DAY;

    #[test]
    fn no_purchase_data_never_skips() {
        assert_eq!(farmable_at_if_in_refund_window(None, 0, 1_000_000), None);
    }

    #[test]
    fn purchase_older_than_window_never_skips() {
        let now = 1_000_000;
        let purchased_at = now - (REFUND_WINDOW_DAYS * DAY) - 1;
        assert_eq!(
            farmable_at_if_in_refund_window(Some(purchased_at), 0, now),
            None
        );
    }

    #[test]
    fn over_playtime_ceiling_never_skips_even_if_purchased_today() {
        let now = 1_000_000;
        assert_eq!(
            farmable_at_if_in_refund_window(
                Some(now),
                REFUND_WINDOW_MAX_PLAYTIME_MINUTES,
                now
            ),
            None
        );
        assert_eq!(
            farmable_at_if_in_refund_window(
                Some(now),
                REFUND_WINDOW_MAX_PLAYTIME_MINUTES + 1,
                now
            ),
            None
        );
    }

    #[test]
    fn recent_purchase_under_playtime_ceiling_skips_and_reports_purchase_plus_window() {
        let now = 1_000_000;
        let purchased_at = now - DAY; // bought yesterday
        let farmable_at = farmable_at_if_in_refund_window(Some(purchased_at), 0, now);
        assert_eq!(
            farmable_at,
            Some(purchased_at + REFUND_WINDOW_DAYS * DAY)
        );
    }

    #[test]
    fn exactly_at_window_boundary_is_no_longer_skipped() {
        let purchased_at = 0;
        let window_end = purchased_at + REFUND_WINDOW_DAYS * DAY;
        assert_eq!(
            farmable_at_if_in_refund_window(Some(purchased_at), 0, window_end),
            None
        );
        assert_eq!(
            farmable_at_if_in_refund_window(Some(purchased_at), 0, window_end - 1),
            Some(window_end)
        );
    }

    #[test]
    fn exactly_at_playtime_boundary_is_no_longer_skipped() {
        let now = 1_000_000;
        assert_eq!(
            farmable_at_if_in_refund_window(
                Some(now),
                REFUND_WINDOW_MAX_PLAYTIME_MINUTES - 1,
                now
            )
            .is_some(),
            true
        );
        assert_eq!(
            farmable_at_if_in_refund_window(
                Some(now),
                REFUND_WINDOW_MAX_PLAYTIME_MINUTES,
                now
            ),
            None
        );
    }
}
