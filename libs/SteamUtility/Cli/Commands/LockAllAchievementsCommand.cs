using System.Threading;
using System.Threading.Tasks;
using SteamUtility.Core;
using SteamUtility.Core.Errors;
using SteamUtility.Core.Services;

namespace SteamUtility.Cli.Commands
{
    // Fixes the confirmed pre-merge bug: the old LockAllAchievements.cs called
    // SteamUserStats.ResetAllStats(true), which wipes numeric stats too, not just achievements.
    // Routes through the same safe per-achievement loop (BulkAchievementSetter) that
    // UnlockAllAchievements already used correctly, instead of a blanket reset.
    public sealed class LockAllAchievementsCommand : ICliCommand
    {
        private readonly ISteamStatsBackend _backend;

        public LockAllAchievementsCommand(ISteamStatsBackend backend)
        {
            _backend = backend;
        }

        public async Task<CliResult> ExecuteAsync(string[] args, CancellationToken ct)
        {
            if (args.Length < 2)
            {
                return CliResult.Failure(
                    "invalid_args",
                    "Usage: SteamUtility.exe lock_all_achievements <app_id>"
                );
            }
            if (!uint.TryParse(args[1], out var appId))
            {
                throw new InvalidAppIdException();
            }

            var result = await BulkAchievementSetter.LockAllAsync(_backend, appId, ct);
            return CliResult.Success(
                new
                {
                    succeeded = result.Succeeded,
                    skipped = result.Skipped,
                    failed = result.Failed,
                }
            );
        }
    }
}
