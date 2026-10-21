using System;
using System.Collections.Generic;
using System.Globalization;
using System.Linq;
using SteamUtility.Core.Models;

namespace SteamUtility.Core.SchemaParsing
{
    // Walks the binary VDF stats/achievement schema - the same format used both by the local Steam
    // client's cached UserGameStatsSchema_<appid>.bin files and by the schema bytes returned over
    // the wire in a ClientGetUserStatsResponse. Purely structural: builds AchievementDefinition/
    // StatDefinition lists from the schema shape only, with no live Steam calls. Each backend joins
    // these definitions with live values on its own (SteamworksLocalBackend via
    // SteamUserStats.GetStat/GetAchievement, SteamKitRemoteBackend via the wire-fetched
    // stat_id -> stat_value map), which is what lets both backends share one walker.
    public static class SchemaWalker
    {
        public static List<AchievementDefinition> ParseAchievementDefinitions(
            uint appId,
            byte[] schemaBytes,
            string language = "english"
        )
        {
            var result = new List<AchievementDefinition>();

            var kv = KeyValue.LoadFromBytes(schemaBytes);
            if (kv == null)
            {
                return result;
            }

            var stats = kv[appId.ToString(CultureInfo.InvariantCulture)]["stats"];
            if (!stats.Valid || stats.Children == null)
            {
                return result;
            }

            var archivedGroupIds = ArchivedGroupIds(
                kv[appId.ToString(CultureInfo.InvariantCulture)]["groups"]
            );

            foreach (var stat in stats.Children)
            {
                if (!stat.Valid || !uint.TryParse(stat.Name, out var statId))
                {
                    continue;
                }

                var rawType = DetermineStatType(stat);
                if ((rawType != 4 && rawType != 5) || stat.Children == null)
                {
                    continue;
                }

                foreach (
                    var bitsNode in stat.Children.Where(c =>
                        string.Equals(c.Name, "bits", StringComparison.OrdinalIgnoreCase)
                    )
                )
                {
                    if (!bitsNode.Valid || bitsNode.Children == null)
                    {
                        continue;
                    }

                    foreach (var bit in bitsNode.Children)
                    {
                        if (!bit.Valid || !int.TryParse(bit.Name, out var bitNumber))
                        {
                            continue;
                        }

                        int? groupId = bit["groupid"].Valid ? bit["groupid"].AsInteger(0) : null;
                        result.Add(
                            new AchievementDefinition
                            {
                                Id = bit["name"].AsString(""),
                                StatId = statId,
                                BitNumber = bitNumber,
                                Permission = bit["permission"].AsInteger(0),
                                Name = ResolveLocalizedString(bit["display"]["name"], language),
                                Description = ResolveLocalizedString(bit["display"]["desc"], language),
                                IconNormal = bit["display"]["icon"].AsString(""),
                                IconLocked = bit["display"]["icon_gray"].AsString(""),
                                Hidden = bit["display"]["hidden"].AsBoolean(false),
                                GroupId = groupId,
                                // Per-achievement `archived` is an int32 `1` on the bit itself
                                // (confirmed in TF2's 440 schema: its four Replay "YouTube views"
                                // achievements). An archived *set* marks every achievement in it
                                // too - see ArchivedGroupIds for that half's caveat.
                                Archived =
                                    bit["archived"].AsBoolean(false)
                                    || (groupId is int id && archivedGroupIds.Contains(id)),
                            }
                        );
                    }
                }
            }

            return result;
        }

        // Steam "Achievement Sets" (Oct 2026 beta): a top-level `groups` section next to `stats`,
        // keyed by group id, each with a localized `name` and - for a DLC set - a `dlcappid`. Each
        // achievement bit then carries a `groupid` (see ParseAchievementDefinitions). Purely
        // additive to the older schema shape - a schema without sets simply has no `groups` key,
        // which returns an empty list here. Shape confirmed against a freshly downloaded ETS2
        // (227300) schema; the implicit base-game set (id 0) is never listed.
        public static List<AchievementGroupDto> ParseAchievementGroups(
            uint appId,
            byte[] schemaBytes,
            string language = "english"
        )
        {
            var result = new List<AchievementGroupDto>();

            var kv = KeyValue.LoadFromBytes(schemaBytes);
            if (kv == null)
            {
                return result;
            }

            var groups = kv[appId.ToString(CultureInfo.InvariantCulture)]["groups"];
            if (!groups.Valid || groups.Children == null)
            {
                return result;
            }

            foreach (var group in groups.Children)
            {
                if (!group.Valid || !int.TryParse(group.Name, out var groupId))
                {
                    continue;
                }

                var dlcAppId = group["dlcappid"].AsInteger(0);
                result.Add(
                    new AchievementGroupDto
                    {
                        Id = groupId,
                        Name = ResolveLocalizedString(group["name"], language),
                        DlcAppId = dlcAppId > 0 ? (uint)dlcAppId : null,
                        Archived = group["archived"].AsBoolean(false),
                    }
                );
            }

            return result;
        }

        // Ids of the Achievement Sets the developer archived as a whole. TODO: the `archived` key
        // name on a *group* is assumed, not yet seen live - no cached schema had an archived set
        // as of 2026-10-21 (only per-achievement `archived`, see ParseAchievementDefinitions). It
        // mirrors the per-bit key and Steamworks' `archived` definitions-CSV column, and a missing
        // key just reads as "not archived", so a wrong guess only means sets aren't flagged as a
        // whole; recheck against the first real archived set's schema.
        private static HashSet<int> ArchivedGroupIds(KeyValue groups)
        {
            var result = new HashSet<int>();
            if (!groups.Valid || groups.Children == null)
            {
                return result;
            }

            foreach (var group in groups.Children)
            {
                if (
                    group.Valid
                    && int.TryParse(group.Name, out var groupId)
                    && group["archived"].AsBoolean(false)
                )
                {
                    result.Add(groupId);
                }
            }

            return result;
        }

        public static List<StatDefinition> ParseStatDefinitions(
            uint appId,
            byte[] schemaBytes,
            string language = "english"
        )
        {
            var result = new List<StatDefinition>();

            var kv = KeyValue.LoadFromBytes(schemaBytes);
            if (kv == null)
            {
                return result;
            }

            var stats = kv[appId.ToString(CultureInfo.InvariantCulture)]["stats"];
            if (!stats.Valid || stats.Children == null)
            {
                return result;
            }

            foreach (var stat in stats.Children)
            {
                if (!stat.Valid || !uint.TryParse(stat.Name, out var statId))
                {
                    continue;
                }

                var rawType = DetermineStatType(stat);
                if (rawType != 1 && rawType != 2 && rawType != 3)
                {
                    continue;
                }

                var id = stat["name"].AsString("");
                var displayName = ResolveLocalizedString(stat["display"]["name"], language);
                var isInteger = rawType == 1;

                result.Add(
                    new StatDefinition
                    {
                        Id = id,
                        StatId = statId,
                        DisplayName = string.IsNullOrEmpty(displayName) ? id : displayName,
                        Type =
                            rawType == 1 ? "integer"
                            : rawType == 2 ? "float"
                            : "avgrate",
                        Permission = stat["permission"].AsInteger(0),
                        IncrementOnly = stat["incrementonly"].AsBoolean(false),
                        // The (object) casts matter: without them each ternary's int/float
                        // branches are promoted to float, boxing a float even for integer stats,
                        // and the daemon's ResetAllStatsAsync `(int)` unbox then throws
                        // InvalidCastException (seen live on Scribble It! 1088150).
                        MinValue = isInteger
                            ? (object)stat["min"].AsInteger(int.MinValue)
                            : stat["min"].AsFloat(float.MinValue),
                        MaxValue = isInteger
                            ? (object)stat["max"].AsInteger(int.MaxValue)
                            : stat["max"].AsFloat(float.MaxValue),
                        DefaultValue = isInteger
                            ? (object)stat["default"].AsInteger(0)
                            : stat["default"].AsFloat(0f),
                    }
                );
            }

            return result;
        }

        // Newer schemas dropped the explicit type_int field in favor of either a "type" string
        // (INT/FLOAT/AVGRATE/ACHIEVEMENT) or, failing that, structural detection (bits child =>
        // achievement, else infer int/float/avgrate from the min/max/default value types and
        // presence of a "window" field). Returns: 1 = int, 2 = float, 3 = avgrate,
        // 4/5 = achievement/group achievement.
        private static int DetermineStatType(KeyValue stat)
        {
            if (stat["type_int"].Valid)
            {
                return stat["type_int"].AsInteger(0);
            }

            if (stat["type"].Valid)
            {
                if (stat["type"].Type == KeyValueType.String)
                {
                    var typeStr = stat["type"].AsString("");
                    if (typeStr.Equals("INT", StringComparison.OrdinalIgnoreCase))
                    {
                        return 1;
                    }
                    if (typeStr.Equals("FLOAT", StringComparison.OrdinalIgnoreCase))
                    {
                        return 2;
                    }
                    if (typeStr.Equals("AVGRATE", StringComparison.OrdinalIgnoreCase))
                    {
                        return 3;
                    }
                    if (
                        typeStr.Equals("ACHIEVEMENT", StringComparison.OrdinalIgnoreCase)
                        || typeStr.Equals("ACHIEVEMENTS", StringComparison.OrdinalIgnoreCase)
                    )
                    {
                        return 4;
                    }
                    return 0;
                }
                return stat["type"].AsInteger(0);
            }

            var hasBits =
                stat.Children != null
                && stat.Children.Any(c =>
                    string.Equals(c.Name, "bits", StringComparison.OrdinalIgnoreCase)
                );
            if (hasBits)
            {
                return 4;
            }

            var hasFloatValue =
                (stat["min"].Valid && stat["min"].Type == KeyValueType.Float32)
                || (stat["max"].Valid && stat["max"].Type == KeyValueType.Float32)
                || (stat["default"].Valid && stat["default"].Type == KeyValueType.Float32);

            var hasWindow = stat["window"].Valid;

            if (hasWindow)
            {
                return 3;
            }

            return hasFloatValue ? 2 : 1;
        }

        // display/name and display/desc are per-language dictionaries (english, german, schinese,
        // ...), unlike display/icon or display/hidden which are flat values, and every language
        // arrives together in the same schema blob regardless of which one is requested. The real
        // Steam client resolves these via SteamUserStats.GetAchievementDisplayAttribute using its
        // own configured language; the local-client backend still prefers that live call and only
        // reaches this fallback when it returns empty, so it's fine for that path to keep using the
        // "english" default rather than threading a language through. The daemon/agent-mode backend
        // has no live Steam session and no equivalent call, so it depends entirely on `preferredLanguage`
        // here - see AchievementHandler.GetAchievementsAndStatsAsync.
        public static string ResolveLocalizedString(KeyValue node, string preferredLanguage = "english")
        {
            if (node.Valid && node.Type == KeyValueType.String)
            {
                return node.AsString("");
            }

            if (node.Children == null)
            {
                return "";
            }

            var preferred = node.Children.FirstOrDefault(c =>
                string.Equals(c.Name, preferredLanguage, StringComparison.OrdinalIgnoreCase)
            );
            if (preferred is { Valid: true })
            {
                return preferred.AsString("");
            }

            var english = node.Children.FirstOrDefault(c =>
                string.Equals(c.Name, "english", StringComparison.OrdinalIgnoreCase)
            );
            if (english is { Valid: true })
            {
                return english.AsString("");
            }

            // Skips `token` - Achievement Sets' group names carry one (e.g. "GROUP_6_NAME") alongside
            // the real per-language strings, and it's a localization key, never display text.
            var first = node.Children.FirstOrDefault(c =>
                c.Valid
                && c.Type == KeyValueType.String
                && !string.Equals(c.Name, "token", StringComparison.OrdinalIgnoreCase)
            );
            return first?.AsString("") ?? "";
        }
    }
}
