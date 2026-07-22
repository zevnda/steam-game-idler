using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using SteamUtility.Core;
using SteamUtility.Core.Errors;
using SteamUtility.Core.Models;
using SteamUtility.Daemon.Bot;

namespace SteamUtility.Backends
{
    // Thin adapter over the existing Daemon/Bot/AchievementHandler and OwnershipManager, so the
    // signed-in (SteamKit2) path conforms to the same ISteamStatsBackend contract as
    // SteamworksLocalBackend. Not yet wired into DaemonHost's IPC dispatch (which still talks to
    // AchievementHandler/OwnershipManager directly, preserving today's exact wire protocol for the
    // current Rust integration) - this exists so the later Tauri/Next.js rewrite has one consistent
    // interface to consume regardless of which backend is active, instead of two divergent shapes.
    public sealed class SteamKitRemoteBackend : ISteamStatsBackend
    {
        private readonly SteamBot _bot;
        private readonly AchievementHandler _achievementHandler;
        private readonly OwnershipManager _ownershipManager;

        public SteamKitRemoteBackend(
            SteamBot bot,
            AchievementHandler achievementHandler,
            OwnershipManager ownershipManager
        )
        {
            _bot = bot;
            _achievementHandler = achievementHandler;
            _ownershipManager = ownershipManager;
        }

        private SteamKit2.SteamID RequireSteamId() =>
            _bot.SteamID ?? throw new NotLoggedOnException();

        public async Task<(
            IReadOnlyList<AchievementDto> Achievements,
            IReadOnlyList<StatDto> Stats
        )> GetAchievementsAndStatsAsync(uint appId, CancellationToken ct)
        {
            return await _achievementHandler.GetAchievementsAndStatsAsync(appId, RequireSteamId());
        }

        public Task SetAchievementAsync(
            uint appId,
            string achievementId,
            bool unlock,
            CancellationToken ct
        ) =>
            _achievementHandler.SetAchievementAsync(appId, RequireSteamId(), achievementId, unlock);

        public Task<(IReadOnlyList<string> Succeeded, IReadOnlyList<string> Failed)> SetAchievementsAsync(
            uint appId,
            IReadOnlyList<(string Id, bool Unlock)> changes,
            CancellationToken ct
        ) => _achievementHandler.SetAchievementsBulkAsync(appId, RequireSteamId(), changes);

        public Task UpdateStatsAsync(
            uint appId,
            IReadOnlyList<StatUpdateRequest> updates,
            CancellationToken ct
        ) => _achievementHandler.UpdateStatsAsync(appId, RequireSteamId(), updates);

        public Task ResetAllStatsAsync(uint appId, CancellationToken ct) =>
            _achievementHandler.ResetAllStatsAsync(appId, RequireSteamId());

        public async Task<IReadOnlyList<OwnedGame>> CheckOwnershipAsync(
            IReadOnlyList<uint>? candidateAppIds,
            CancellationToken ct
        )
        {
            // PICS-based ownership resolves the account's full owned library itself - it has no
            // concept of "checking a candidate list", unlike the local-client backend's
            // BIsSubscribedApp loop. candidateAppIds is accepted for interface parity but ignored;
            // gamesOnly: true asks GetOwnedGamesAsync to apply the same whitelist filter
            // SteamworksLocalBackend's own candidate list uses, so this backend's ownership scope
            // matches it exactly.
            var games = await _ownershipManager.GetOwnedGamesAsync(_bot, gamesOnly: true);
            return games.ToList();
        }
    }
}
