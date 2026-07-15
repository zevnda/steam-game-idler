using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using SteamUtility.Core;
using SteamUtility.Core.Errors;

namespace SteamUtility.Cli.Commands
{
    public sealed class ToggleAchievementCommand : ICliCommand
    {
        private readonly ISteamStatsBackend _backend;

        public ToggleAchievementCommand(ISteamStatsBackend backend)
        {
            _backend = backend;
        }

        public async Task<CliResult> ExecuteAsync(string[] args, CancellationToken ct)
        {
            if (args.Length < 3)
            {
                return CliResult.Failure(
                    "invalid_args",
                    "Usage: SteamUtility.exe toggle_achievement <app_id> <achievement_id>"
                );
            }
            if (!uint.TryParse(args[1], out var appId))
            {
                throw new InvalidAppIdException();
            }

            var achievementId = args[2];
            var (achievements, _) = await _backend.GetAchievementsAndStatsAsync(appId, ct);
            var achievement = achievements.FirstOrDefault(a => a.Id == achievementId);
            if (achievement == null)
            {
                throw new AchievementNotFoundException(achievementId);
            }

            var unlock = !achievement.Achieved;
            await _backend.SetAchievementAsync(appId, achievementId, unlock, ct);
            return CliResult.Success(new { status = unlock ? "unlocked" : "locked" });
        }
    }
}
