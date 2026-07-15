using System;

namespace SteamUtility.Core.Logging
{
    // Rust's existing log.txt masks a handful of hardcoded known-sensitive substrings (see
    // src-tauri/src/logging.rs) - that only works because those specific values are known ahead of
    // time. Here, actual Steam passwords/refresh tokens/guard codes flow through this process, so
    // masking must be parameterized by the actual secret value at the call site rather than guessed
    // by fixed substring. Prefer simply never passing a secret to Log at all; use this only when a
    // message might incidentally contain one (e.g. an upstream exception message).
    public static class SensitiveDataMasking
    {
        public static string Redact(string message, params string?[] secrets)
        {
            foreach (var secret in secrets)
            {
                if (!string.IsNullOrEmpty(secret))
                {
                    message = message.Replace(secret, "***REDACTED***", StringComparison.Ordinal);
                }
            }
            return message;
        }
    }
}
