using System;

namespace SteamUtility.Core.Logging
{
    public enum LogLevel
    {
        Trace = 0,
        Debug = 1,
        Info = 2,
        Warn = 3,
        Error = 4,
    }

    // Small static facade - deliberately not Serilog/NLog/Microsoft.Extensions.Logging. This
    // project publishes as a trimmed self-contained single-file exe, and a reflection-heavy
    // logging framework risks the same silent breakage under PublishTrimmed=true that
    // System.Text.Json's reflection-based serializer already hit once here.
    //
    // Two sinks: stderr (always, for terminal debugging when running the exe directly) and a capped
    // rotating file (see FileLogSink). Nothing outside Cli/CliDispatcher's one result line and
    // Daemon/Ipc/IpcServer's one line per message may ever write to stdout - that channel is
    // reserved exclusively for the JSON envelope.
    public static class Log
    {
        private static LogLevel s_minLevel = LogLevel.Info;
        private static FileLogSink? s_fileSink;

        public static void Initialize()
        {
            var envLevel = Environment.GetEnvironmentVariable("STEAMUTILITY_LOG_LEVEL");
            if (
                envLevel != null
                && Enum.TryParse<LogLevel>(envLevel, ignoreCase: true, out var parsed)
            )
            {
                s_minLevel = parsed;
            }

            s_fileSink = new FileLogSink();
        }

        public static void Trace(string category, string message) =>
            Write(LogLevel.Trace, category, message, null);

        public static void Debug(string category, string message) =>
            Write(LogLevel.Debug, category, message, null);

        public static void Info(string category, string message) =>
            Write(LogLevel.Info, category, message, null);

        public static void Warn(string category, string message, Exception? ex = null) =>
            Write(LogLevel.Warn, category, message, ex);

        public static void Error(string category, string message, Exception? ex = null) =>
            Write(LogLevel.Error, category, message, ex);

        private static void Write(LogLevel level, string category, string message, Exception? ex)
        {
            if (level < s_minLevel)
            {
                return;
            }

            var timestamp = DateTime.Now.ToString("MMM dd HH:mm:ss.fff");
            var line = $"{timestamp} [{level}] [{category}] {message}";
            if (ex != null)
            {
                line +=
                    $" :: {ex.GetType().Name}: {ex.Message}{Environment.NewLine}{ex.StackTrace}";
            }

            Console.Error.WriteLine(line);
            s_fileSink?.Append(line);
        }
    }
}
