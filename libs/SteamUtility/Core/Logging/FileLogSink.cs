using System;
using System.Collections.Generic;
using System.IO;

namespace SteamUtility.Core.Logging
{
    // Capped rotating text file, styled after the existing app-wide convention in
    // src-tauri/src/logging.rs (timestamped lines, newest entry first, truncated past a line cap).
    // Deliberately a separate file from Tauri's own log.txt - sharing one file handle safely
    // across processes would need its own locking scheme - but lives in the same cache directory.
    //
    // Note: this always targets the non-portable install location
    // (%AppData%\com.zevnda.steam-game-idler\cache) since this process has no access to Tauri's
    // app_handle to determine portable-vs-installed mode - a known, acceptable limitation.
    internal sealed class FileLogSink
    {
        private const int MaxLines = 500;
        private readonly string _logFilePath;
        private readonly object _lock = new();

        public FileLogSink()
        {
            var appData = Environment.GetFolderPath(Environment.SpecialFolder.ApplicationData);
            var dir = Path.Combine(appData, "com.zevnda.steam-game-idler", "cache");
            Directory.CreateDirectory(dir);
            _logFilePath = Path.Combine(dir, "steamutility.log");
        }

        public void Append(string line)
        {
            lock (_lock)
            {
                try
                {
                    List<string> lines;
                    if (File.Exists(_logFilePath))
                    {
                        lines = new List<string>(File.ReadAllLines(_logFilePath));
                    }
                    else
                    {
                        lines = new List<string>();
                    }

                    lines.Insert(0, line);
                    if (lines.Count > MaxLines)
                    {
                        lines.RemoveRange(MaxLines, lines.Count - MaxLines);
                    }

                    File.WriteAllLines(_logFilePath, lines);
                }
                catch
                {
                    // Logging must never crash the process it's trying to diagnose.
                }
            }
        }
    }
}
