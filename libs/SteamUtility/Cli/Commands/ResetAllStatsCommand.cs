using System.Threading;
using System.Threading.Tasks;
using SteamUtility.Core;
using SteamUtility.Core.Errors;

namespace SteamUtility.Cli.Commands
{
    public sealed class ResetAllStatsCommand : ICliCommand
    {
        private readonly ISteamStatsBackend _backend;

        public ResetAllStatsCommand(ISteamStatsBackend backend)
        {
            _backend = backend;
        }

        public async Task<CliResult> ExecuteAsync(string[] args, CancellationToken ct)
        {
            if (args.Length < 2)
            {
                return CliResult.Failure(
                    "invalid_args",
                    "Usage: SteamUtility.exe reset_all_stats <app_id>"
                );
            }
            if (!uint.TryParse(args[1], out var appId))
            {
                throw new InvalidAppIdException();
            }

            await _backend.ResetAllStatsAsync(appId, ct);
            return CliResult.Success(new { status = "reset" });
        }
    }
}
