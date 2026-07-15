using System;
using System.Threading;
using SteamUtility.Core.Errors;
using Steamworks;

namespace SteamUtility.Backends
{
    // Extracts the init/request-stats/spin-wait/shutdown lifecycle that used to be copy-pasted
    // near-verbatim across 8 separate command files in the pre-merge SteamUtility project
    // (UnlockAchievement, LockAchievement, ToggleAchievement, UnlockAllAchievements,
    // LockAllAchievements, UpdateStats, ResetAllStats, GetAchievementData). One SteamworksSession is
    // opened per app id per process (Steamworks.NET's SteamAPI_Init() hard-binds one AppID per
    // process - a real native-client constraint, not something this refactor removes).
    public sealed class SteamworksSession : IDisposable
    {
        private bool _initialized;

        public CSteamID SteamId { get; private set; }

        private SteamworksSession() { }

        public static SteamworksSession Open(uint appId, CancellationToken ct = default)
        {
            Environment.SetEnvironmentVariable("SteamAppId", appId.ToString());

            if (!SteamAPI.Init())
            {
                throw new SteamNotRunningException();
            }

            var session = new SteamworksSession { _initialized = true };
            try
            {
                session.RequestUserStats(appId, ct);
                return session;
            }
            catch
            {
                session.Dispose();
                throw;
            }
        }

        private void RequestUserStats(uint appId, CancellationToken ct)
        {
            SteamId = SteamUser.GetSteamID();

            var received = false;
            var result = EResult.k_EResultOK;
            using var callback = Callback<UserStatsReceived_t>.Create(cb =>
            {
                if (cb.m_nGameID == SteamUtils.GetAppID().m_AppId)
                {
                    received = true;
                    result = cb.m_eResult;
                }
            });

            var apiCall = SteamUserStats.RequestUserStats(SteamId);
            if (apiCall == SteamAPICall_t.Invalid)
            {
                throw new StatsRequestFailedException("invalid API call");
            }

            var start = DateTime.UtcNow;
            while (!received)
            {
                ct.ThrowIfCancellationRequested();
                SteamAPI.RunCallbacks();
                if ((DateTime.UtcNow - start).TotalSeconds > 10)
                {
                    throw new SteamApiTimeoutException();
                }
                Thread.Sleep(100);
            }

            // k_EResultFail commonly just means "this game has no achievements/stats" - treat that
            // as a successful (empty) session rather than an error, matching the old behavior.
            if (result != EResult.k_EResultOK && result != EResult.k_EResultFail)
            {
                throw new StatsRequestFailedException(result.ToString());
            }
        }

        // Global achievement rarity percentages are a separate opt-in request from RequestUserStats -
        // GetAchievementAchievedPercent silently returns false (not an error) until this completes,
        // which is what actually caused every achievement to read `percent: 0`/omitted before this
        // was wired in. Best-effort with its own short timeout rather than throwing: a slow/degraded
        // percentage service shouldn't fail the whole achievement/stat fetch, matching the old
        // project's GetAchievementData.cs "continuing without them" behavior.
        public void RequestGlobalAchievementPercentages(CancellationToken ct = default)
        {
            var apiCall = SteamUserStats.RequestGlobalAchievementPercentages();
            if (apiCall == SteamAPICall_t.Invalid)
            {
                return;
            }

            var received = false;
            using var callResult = CallResult<GlobalAchievementPercentagesReady_t>.Create(
                (_, _) => received = true
            );
            callResult.Set(apiCall);

            var start = DateTime.UtcNow;
            while (!received)
            {
                if (ct.IsCancellationRequested)
                {
                    return;
                }
                SteamAPI.RunCallbacks();
                if ((DateTime.UtcNow - start).TotalSeconds > 10)
                {
                    return;
                }
                Thread.Sleep(100);
            }
        }

        public void Dispose()
        {
            if (_initialized)
            {
                SteamAPI.Shutdown();
                _initialized = false;
            }
        }
    }
}
