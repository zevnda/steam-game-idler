using System.Runtime.Versioning;
using Microsoft.Win32;

namespace SteamUtility.Core.Services
{
    // Local-client-backend-only, same as SteamPathHelper - the Steam client's configured UI display
    // language is a per-machine registry value (HKCU\Software\Valve\Steam\language, e.g. "english",
    // "schinese"), not exposed by any Steamworks.NET/interop call. CLI-mode achievement text doesn't
    // need this (the SDK resolves it internally via GetAchievementDisplayAttribute - see
    // SchemaWalker.ResolveLocalizedString's doc comment), but appinfo.vdf-based name resolution
    // (AppInfoReader) bypasses the SDK entirely, so it has to read this explicitly.
    [SupportedOSPlatform("windows")]
    public static class SteamLanguageHelper
    {
        public static string? GetConfiguredLanguage()
        {
            return (string?)
                Registry.GetValue(@"HKEY_CURRENT_USER\Software\Valve\Steam", "language", null);
        }
    }
}
