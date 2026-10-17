using System.Collections.Generic;
using System.Linq;
using System.Text.Json.Serialization;

namespace SteamUtility.Core.Models
{
    // One Steam "Achievement Set" (Valve's Oct 2026 beta) - a developer-defined grouping of a
    // game's achievements, parsed from the schema's top-level `groups` section (see
    // SchemaParsing/SchemaWalker.cs's ParseAchievementGroups). Only explicitly defined groups are
    // listed: the implicit base-game set has no schema entry at all, so any achievement whose
    // GroupId is null (or points at an id not in this list) belongs to it.
    //
    // DlcAppId is set when the set's achievements come from a DLC. Steam rejects a StoreStats write
    // that unlocks an achievement from a DLC set the account doesn't own (EResult.InvalidParam,
    // seen live on ETS2), so Owned records whether this account owns that DLC - filled in after
    // parsing by each backend (SteamworksLocalBackend via IsSubscribedApp,
    // OwnershipManager.ApplyDlcOwnershipAsync for the daemon). Null for a non-DLC set, and also
    // when the ownership lookup itself failed - consumers treat null as "owned" (fail open), so a
    // flaky lookup never blocks an unlock that might have worked.
    public sealed record AchievementGroupDto
    {
        [JsonPropertyName("id")]
        public int Id { get; init; }

        [JsonPropertyName("name")]
        public string Name { get; init; } = "";

        [JsonPropertyName("dlcAppId")]
        [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
        public uint? DlcAppId { get; init; }

        [JsonPropertyName("owned")]
        [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
        public bool? Owned { get; init; }

        // Achievement ids whose unlock Steam would reject: everything in a DLC set this account is
        // known not to own. Shared by BulkAchievementSetter (CLI) and Rust's agent-mode equivalent
        // (achievements::AchievementData::unowned_dlc_group_ids mirrors this rule).
        public static HashSet<int> UnownedDlcGroupIds(IEnumerable<AchievementGroupDto> groups) =>
            groups.Where(g => g.DlcAppId != null && g.Owned == false).Select(g => g.Id).ToHashSet();
    }
}
