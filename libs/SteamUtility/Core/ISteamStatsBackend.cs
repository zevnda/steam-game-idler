using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using SteamUtility.Core.Models;

namespace SteamUtility.Core
{
    // Shared contract implemented separately by Backends/SteamworksLocalBackend.cs (Steamworks.NET,
    // requires a real local running/logged-in Steam client) and Backends/SteamKitRemoteBackend.cs
    // (SteamKit2, network login, no local client needed). New features should implement against
    // this interface so both paths automatically get them, unless a feature is genuinely
    // backend-specific (see the capability divergences documented on the concrete backends).
    //
    // Idling is deliberately NOT part of this interface - the two mechanisms are architecturally
    // different (one process per game vs. one in-connection announcement for up to 32 games), so
    // forcing them into one method here would hide a real difference instead of documenting it.
    public interface ISteamStatsBackend
    {
        Task<(
            IReadOnlyList<AchievementDto> Achievements,
            IReadOnlyList<StatDto> Stats
        )> GetAchievementsAndStatsAsync(uint appId, CancellationToken ct);

        Task SetAchievementAsync(
            uint appId,
            string achievementId,
            bool unlock,
            CancellationToken ct
        );

        // Batched form of SetAchievementAsync for Core/Services/BulkAchievementSetter.cs -
        // implementations must open one session/do one underlying write for the whole `changes`
        // list, not compose SetAchievementAsync in a loop (see BulkAchievementSetter's doc comment
        // for why). A per-item failure (unknown id, protected) is reported via the returned Failed
        // list, not an exception - only a whole-batch failure throws.
        Task<(IReadOnlyList<string> Succeeded, IReadOnlyList<string> Failed)> SetAchievementsAsync(
            uint appId,
            IReadOnlyList<(string Id, bool Unlock)> changes,
            CancellationToken ct
        );

        Task UpdateStatsAsync(
            uint appId,
            IReadOnlyList<StatUpdateRequest> updates,
            CancellationToken ct
        );

        Task ResetAllStatsAsync(uint appId, CancellationToken ct);

        Task<IReadOnlyList<OwnedGame>> CheckOwnershipAsync(
            IReadOnlyList<uint>? candidateAppIds,
            CancellationToken ct
        );
    }
}
