using System.Threading;
using System.Threading.Tasks;
using SteamUtility.Core;
using SteamUtility.Core.Errors;

namespace SteamUtility.Cli.Commands
{
    public sealed class UnlockAchievementCommand : ICliCommand
    {
        private readonly ISteamStatsBackend _backend;

        public UnlockAchievementCommand(ISteamStatsBackend backend)
        {
            _backend = backend;
        }

        public async Task<CliResult> ExecuteAsync(string[] args, CancellationToken ct)
        {
            if (args.Length < 3)
            {
                return CliResult.Failure(
                    "invalid_args",
                    "Usage: SteamUtility.exe unlock_achievement <app_id> <achievement_id>"
                );
            }
            if (!uint.TryParse(args[1], out var appId))
            {
                throw new InvalidAppIdException();
            }

            await _backend.SetAchievementAsync(appId, args[2], unlock: true, ct);
            return CliResult.Success(new { status = "unlocked" });
        }
    }
}
