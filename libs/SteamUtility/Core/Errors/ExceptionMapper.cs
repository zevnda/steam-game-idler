using System;
using SteamUtility.Core.Logging;

namespace SteamUtility.Core.Errors
{
    // Used identically by Cli/CliDispatcher and Daemon/Ipc/IpcServer to turn a caught exception into
    // an envelope error code. Domain errors (SteamUtilityException) surface their stable ErrorCode
    // and are logged at Warn - expected, not a bug. Anything else is a genuine bug: it's logged at
    // Error with full exception detail (type, message, stack trace) to the file sink, but the caller
    // only ever sees the generic "internal_error" code - full diagnostic detail never crosses the
    // stdout boundary.
    public static class ExceptionMapper
    {
        public static (string Code, string? Message) Map(Exception ex, string category)
        {
            if (ex is SteamUtilityException domainEx)
            {
                Log.Warn(category, domainEx.Message);
                return (domainEx.ErrorCode, domainEx.Message);
            }

            Log.Error(category, "Unhandled exception", ex);
            return ("internal_error", "An unexpected error occurred");
        }
    }
}
