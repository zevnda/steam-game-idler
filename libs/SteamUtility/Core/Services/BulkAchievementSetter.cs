using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

namespace SteamUtility.Core.Services
{
    public sealed record BulkAchievementResult(
        IReadOnlyList<string> Succeeded,
        IReadOnlyList<string> Skipped,
        IReadOnlyList<string> Failed
    );

    // Shared unlock-all/lock-all composition used by both backends: fetch achievements, skip
    // anything already in the desired state or marked protected, and hand everything else to the
    // backend's batched SetAchievementsAsync in one call, rather than looping SetAchievementAsync
    // per achievement - each backend's single-item call is expensive (a full SteamworksSession
    // open/close, or a full GetStats+StoreStats round trip), so composing it 1-by-1 turned "unlock
    // all" on a ~50-achievement game into 10-15s of wall-clock time.
    public static class BulkAchievementSetter
    {
        public static Task<BulkAchievementResult> UnlockAllAsync(
            ISteamStatsBackend backend,
            uint appId,
            CancellationToken ct
        ) => SetAllAsync(backend, appId, unlock: true, ct);

        public static Task<BulkAchievementResult> LockAllAsync(
            ISteamStatsBackend backend,
            uint appId,
            CancellationToken ct
        ) => SetAllAsync(backend, appId, unlock: false, ct);

        private static async Task<BulkAchievementResult> SetAllAsync(
            ISteamStatsBackend backend,
            uint appId,
            bool unlock,
            CancellationToken ct
        )
        {
            var (achievements, _) = await backend.GetAchievementsAndStatsAsync(appId, ct);

            var skipped = new List<string>();
            var toChange = new List<(string Id, bool Unlock)>();

            foreach (var achievement in achievements)
            {
                if (achievement.Achieved == unlock || achievement.ProtectedAchievement)
                {
                    skipped.Add(achievement.Id);
                }
                else
                {
                    toChange.Add((achievement.Id, unlock));
                }
            }

            if (toChange.Count == 0)
            {
                return new BulkAchievementResult(new List<string>(), skipped, new List<string>());
            }

            var (succeeded, failed) = await backend.SetAchievementsAsync(appId, toChange, ct);
            return new BulkAchievementResult(succeeded.ToList(), skipped, failed.ToList());
        }
    }
}
