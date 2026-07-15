using System;

namespace SteamUtility.Core.Errors
{
    // Base for every expected/domain error either backend can raise. ErrorCode is the stable string
    // surfaced to callers (Rust today, whatever replaces it later) - preserves the exact string
    // codes already in use today (e.g. "achievement_protected", "unsupported_game_coordinator") so
    // existing string-matching call sites keep working. Anything that ISN'T a SteamUtilityException
    // is treated as a genuine bug, not a domain error - see ExceptionMapper.
    public abstract class SteamUtilityException : Exception
    {
        public string ErrorCode { get; }

        protected SteamUtilityException(string errorCode, string? message = null)
            : base(message ?? errorCode)
        {
            ErrorCode = errorCode;
        }
    }

    public sealed class NotLoggedOnException : SteamUtilityException
    {
        public NotLoggedOnException()
            : base("not_logged_on") { }
    }

    public sealed class NoRefreshTokenException : SteamUtilityException
    {
        public NoRefreshTokenException()
            : base(
                "no_refresh_token",
                "This session has no refresh token to derive a web session from"
            ) { }
    }

    public sealed class SteamNotRunningException : SteamUtilityException
    {
        public SteamNotRunningException()
            : base(
                "steam_not_running",
                "Failed to initialize Steam API. The Steam client must be running"
            ) { }
    }

    public sealed class SteamApiTimeoutException : SteamUtilityException
    {
        public SteamApiTimeoutException()
            : base("stats_request_timeout", "Callback timed out") { }
    }

    public sealed class StatsRequestFailedException : SteamUtilityException
    {
        public StatsRequestFailedException(string reason)
            : base("stats_request_failed", $"Failed to request stats from Steam: {reason}") { }
    }

    public sealed class AchievementNotFoundException : SteamUtilityException
    {
        public AchievementNotFoundException(string achievementId)
            : base("achievement_not_found", $"Achievement not found: {achievementId}") { }
    }

    public sealed class AchievementProtectedException : SteamUtilityException
    {
        public AchievementProtectedException(string achievementId)
            : base("achievement_protected", $"Achievement is protected: {achievementId}") { }
    }

    public sealed class StatNotFoundException : SteamUtilityException
    {
        public StatNotFoundException(string statName)
            : base("stat_not_found", $"Stat not found: {statName}") { }
    }

    public sealed class StatProtectedException : SteamUtilityException
    {
        public StatProtectedException(string statName)
            : base("stat_protected", $"Stat is protected: {statName}") { }
    }

    public sealed class GameCoordinatorUnsupportedException : SteamUtilityException
    {
        public GameCoordinatorUnsupportedException()
            : base(
                "unsupported_game_coordinator",
                "This game routes achievements/stats through Valve's Game Coordinator, which isn't supported"
            ) { }
    }

    public sealed class StoreStatsFailedException : SteamUtilityException
    {
        public StoreStatsFailedException(string reason)
            : base("store_stats_failed", reason) { }
    }

    public sealed class InvalidAppIdException : SteamUtilityException
    {
        public InvalidAppIdException()
            : base("invalid_app_id", "Invalid app_id") { }
    }

    // Wraps Interop.ClientInitializeException's FailureReason (raw steamclient64.dll bootstrap
    // failures - install path, library load, pipe/user connection) with a stable code and a
    // user-facing suggestion, mirroring the friendly messages the pre-merge project's
    // CheckOwnership.cs produced for the same failure modes.
    public sealed class SteamClientInteropException : SteamUtilityException
    {
        public string Suggestion { get; }

        public SteamClientInteropException(string errorCode, string message, string suggestion)
            : base(errorCode, message)
        {
            Suggestion = suggestion;
        }
    }
}
