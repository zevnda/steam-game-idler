using System.Text.Json.Serialization;

namespace SteamUtility.Core.Models
{
    // Canonical wire/output shape for one achievement, used by both backends. Field names match
    // what was already in production via the daemon path (protected_achievement, not the old local
    // CLI's inconsistent "protected" used only in its now-removed single-item lookup branch - see
    // the Phase 1 plan's field-naming fix).
    public sealed class AchievementDto
    {
        [JsonPropertyName("id")]
        public string Id { get; init; } = "";

        [JsonPropertyName("name")]
        public string Name { get; init; } = "";

        [JsonPropertyName("description")]
        public string Description { get; init; } = "";

        [JsonPropertyName("iconNormal")]
        public string IconNormal { get; init; } = "";

        [JsonPropertyName("iconLocked")]
        public string IconLocked { get; init; } = "";

        [JsonPropertyName("permission")]
        public int Permission { get; init; }

        [JsonPropertyName("hidden")]
        public bool Hidden { get; init; }

        [JsonPropertyName("achieved")]
        public bool Achieved { get; init; }

        // Global "rarity" percentage - only ever populated directly by the local-client backend
        // (GetAchievementAchievedPercent). SteamKit2 has no wire-protocol equivalent, so the daemon
        // backend leaves this null and it's omitted from the JSON entirely, rather than faked as 0.
        // Not a permanent gap for the daemon path: this data is public and session-independent
        // (Steam's GetGlobalAchievementPercentagesForApp Web API), so Rust's
        // achievements::commands::backfill_global_percentages fills it in after the fact for
        // whichever achievements come back without one.
        [JsonPropertyName("percent")]
        [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
        public float? Percent { get; init; }

        [JsonPropertyName("protected_achievement")]
        public bool ProtectedAchievement { get; init; }

        [JsonPropertyName("flags")]
        public string Flags { get; init; } = "";
    }
}
