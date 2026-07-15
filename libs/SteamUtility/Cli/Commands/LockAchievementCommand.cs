using System.Threading;
using System.Threading.Tasks;
using SteamUtility.Core;
using SteamUtility.Core.Errors;

namespace SteamUtility.Cli.Commands
{
    public sealed class LockAchievementCommand : ICliCommand
    {
        private readonly ISteamStatsBackend _backend;

        public LockAchievementCommand(ISteamStatsBackend backend)
        {
            _backend = backend;
        }

        public async Task<CliResult> ExecuteAsync(string[] args, CancellationToken ct)
        {
            if (args.Length < 3)
            {
                return CliResult.Failure(
                    "invalid_args",
                    "Usage: SteamUtility.exe lock_achievement <app_id> <achievement_id>"
                );
            }
            if (!uint.TryParse(args[1], out var appId))
            {
                throw new InvalidAppIdException();
            }

            await _backend.SetAchievementAsync(appId, args[2], unlock: false, ct);
            return CliResult.Success(new { status = "locked" });
        }
    }
}
