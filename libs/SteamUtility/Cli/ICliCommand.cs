using System.Threading;
using System.Threading.Tasks;

namespace SteamUtility.Cli
{
    // Command classes never write to Console themselves - CliDispatcher is the single choke point
    // that serializes exactly one JSON envelope line to stdout per invocation. This fixes a
    // confirmed bug in the pre-merge project: several old command files (e.g. GetAchievementData.cs)
    // wrote multiple JSON lines per invocation (timeout/info/error lines plus the final result),
    // which is fragile for any caller trying to parse "the" result off stdout.
    public interface ICliCommand
    {
        Task<CliResult> ExecuteAsync(string[] args, CancellationToken ct);
    }

    public sealed record CliResult(
        bool Ok,
        object? Result = null,
        string? ErrorCode = null,
        string? ErrorMessage = null
    )
    {
        public static CliResult Success(object? result = null) => new(true, result);

        public static CliResult Failure(string errorCode, string? message = null) =>
            new(false, null, errorCode, message);
    }
}
