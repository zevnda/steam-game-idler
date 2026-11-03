using System;
using System.Threading.Tasks;
using SteamUtility.Core.Logging;

namespace SteamUtility.Core.Errors
{
    // Used identically by Cli/CliDispatcher and Daemon/Ipc/IpcServer to turn a caught exception into
    // an envelope error code. Domain errors (SteamUtilityException) surface their stable ErrorCode
    // and are logged at Warn - expected, not a bug. Anything else is a genuine bug: it's logged at
    // Error with full exception detail (type, message, stack trace) to the file sink, but the caller
    // only ever sees the generic "internal_error" code - full diagnostic detail never crosses the
    // stdout boundary. The one exception is SteamKit2 cancelling a job whose response never came:
    // Steam being slow or throttling us is expected rather than a bug, and reporting it as
    // internal_error made these failures impossible to tell apart from real ones in a user's log.
    public static class ExceptionMapper
    {
        public static (string Code, string? Message) Map(Exception ex, string category)
        {
            if (ex is SteamUtilityException domainEx)
            {
                Log.Warn(category, domainEx.Message);
                return (domainEx.ErrorCode, domainEx.Message);
            }

            if (ex is TaskCanceledException)
            {
                Log.Warn(category, $"Steam did not respond in time: {ex.Message}");
                return ("steam_request_timeout", "Steam did not respond in time");
            }

            Log.Error(category, "Unhandled exception", ex);
            return ("internal_error", "An unexpected error occurred");
        }
    }
}
