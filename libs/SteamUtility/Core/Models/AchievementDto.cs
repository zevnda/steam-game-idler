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

        // Which AchievementGroupDto this achievement belongs to; null (omitted from JSON) for the
        // implicit base-game set and for every game that doesn't use Achievement Sets at all.
        [JsonPropertyName("groupId")]
        [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
        public int? GroupId { get; init; }

        // Archived by the developer, individually or via its whole Achievement Set (see
        // AchievementDefinition.Archived). Steam refuses to unlock anything in an archived set, and
        // Valve tells developers to stop awarding individually archived ones - so every unlock path
        // skips an archived achievement the account hasn't already earned. One that *is* earned
        // stays on the profile as normal. Omitted from JSON when false (the common case).
        [JsonPropertyName("archived")]
        [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingDefault)]
        public bool Archived { get; init; }
    }
}
