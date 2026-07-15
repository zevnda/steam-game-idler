using System.Threading;
using System.Threading.Tasks;
using SteamUtility.Core;
using SteamUtility.Core.Errors;
using SteamUtility.Core.Services;

namespace SteamUtility.Cli.Commands
{
    public sealed class UnlockAllAchievementsCommand : ICliCommand
    {
        private readonly ISteamStatsBackend _backend;

        public UnlockAllAchievementsCommand(ISteamStatsBackend backend)
        {
            _backend = backend;
        }

        public async Task<CliResult> ExecuteAsync(string[] args, CancellationToken ct)
        {
            if (args.Length < 2)
            {
                return CliResult.Failure(
                    "invalid_args",
                    "Usage: SteamUtility.exe unlock_all_achievements <app_id>"
                );
            }
            if (!uint.TryParse(args[1], out var appId))
            {
                throw new InvalidAppIdException();
            }

            var result = await BulkAchievementSetter.UnlockAllAsync(_backend, appId, ct);
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
