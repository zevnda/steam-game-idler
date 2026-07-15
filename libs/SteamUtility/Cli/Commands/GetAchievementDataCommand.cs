using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using SteamUtility.Core;
using SteamUtility.Core.Errors;

namespace SteamUtility.Cli.Commands
{
    // Stdout-only (matches the daemon path's achievements_get shape) - the pre-merge project's file
    // write side effect and its (confirmed unused by the current Rust call site) cache-dir argument
    // are both dropped rather than carried forward, per the Phase 1 plan's output-behavior decision.
    public sealed class GetAchievementDataCommand : ICliCommand
    {
        private readonly ISteamStatsBackend _backend;

        public GetAchievementDataCommand(ISteamStatsBackend backend)
        {
            _backend = backend;
        }

        public async Task<CliResult> ExecuteAsync(string[] args, CancellationToken ct)
        {
            if (args.Length < 2)
            {
                return CliResult.Failure(
                    "invalid_args",
                    "Usage: SteamUtility.exe get_achievement_data <app_id> [specific_id]"
                );
            }
            if (!uint.TryParse(args[1], out var appId))
            {
                throw new InvalidAppIdException();
            }

            var (achievements, stats) = await _backend.GetAchievementsAndStatsAsync(appId, ct);

            if (args.Length >= 3)
            {
                var specificId = args[2];

                var achievement = achievements.FirstOrDefault(a => a.Id == specificId);
                if (achievement != null)
                {
                    return CliResult.Success(new { type = "achievement", achievement });
                }

                var stat = stats.FirstOrDefault(s => s.Id == specificId);
                if (stat != null)
                {
                    return CliResult.Success(new { type = "stat", stat });
                }

                return CliResult.Failure("not_found", "ID not found");
            }

            return CliResult.Success(new { achievements, stats });
        }
    }
}
