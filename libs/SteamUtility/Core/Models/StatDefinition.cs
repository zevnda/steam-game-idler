namespace SteamUtility.Core.Models
{
    // Purely structural schema metadata for one plain numeric stat (as opposed to an achievement,
    // which is a single bit within a shared stat_id). "avgrate" is treated identically to "float" on
    // the wire - both are transmitted as the stat_value's raw IEEE-754 bit pattern, never as a plain
    // integer cast.
    public sealed class StatDefinition
    {
        public string Id { get; init; } = "";
        public uint StatId { get; init; }
        public string DisplayName { get; init; } = "";
        public string Type { get; init; } = "integer";
        public int Permission { get; init; }
        public bool IncrementOnly { get; init; }

        // Local-client backend reads MinValue/MaxValue too (Steamworks.NET's local schema exposes
        // them); the wire protocol never sends them, so they're optional and only ever populated by
        // SchemaWalker when parsing a local schema, left null for the daemon path.
        public object? MinValue { get; init; }
        public object? MaxValue { get; init; }
        public object DefaultValue { get; init; } = 0;
    }
}
