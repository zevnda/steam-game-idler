using System.Text.Json.Serialization;

namespace SteamUtility.Core.Models
{
    // Canonical wire/output shape for one plain numeric stat, used by both backends.
    public sealed class StatDto
    {
        [JsonPropertyName("id")]
        public string Id { get; init; } = "";

        [JsonPropertyName("name")]
        public string Name { get; init; } = "";

        [JsonPropertyName("stat_type")]
        public string StatType { get; init; } = "";

        [JsonPropertyName("permission")]
        public int Permission { get; init; }

        [JsonPropertyName("value")]
        public object? Value { get; init; }

        [JsonPropertyName("increment_only")]
        public bool IncrementOnly { get; init; }

        [JsonPropertyName("protected_stat")]
        public bool ProtectedStat { get; init; }

        [JsonPropertyName("flags")]
        public string Flags { get; init; } = "";
    }
}
