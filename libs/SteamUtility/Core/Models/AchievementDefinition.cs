namespace SteamUtility.Core.Models
{
    // Purely structural schema metadata for one achievement, parsed from the binary VDF stats
    // schema (see SchemaParsing/SchemaWalker.cs). StatId/BitNumber describe where this achievement's
    // bit lives within a shared stat value - only meaningful to the wire-protocol backend
    // (SteamKitRemoteBackend), which has no higher-level API and must flip bits manually. The
    // local-client backend (SteamworksLocalBackend) only needs Id, since Steamworks.NET's
    // SteamUserStats.GetAchievement/SetAchievement/ClearAchievement already take the achievement id
    // string directly and handle the underlying bit storage internally.
    public sealed class AchievementDefinition
    {
        public string Id { get; init; } = "";
        public uint StatId { get; init; }
        public int BitNumber { get; init; }
        public int Permission { get; init; }
        public string Name { get; init; } = "";
        public string Description { get; init; } = "";
        public string IconNormal { get; init; } = "";
        public string IconLocked { get; init; } = "";
        public bool Hidden { get; init; }
    }
}
