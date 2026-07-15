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
            byte[] schemaBytes
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

                        result.Add(
                            new AchievementDefinition
                            {
                                Id = bit["name"].AsString(""),
                                StatId = statId,
                                BitNumber = bitNumber,
                                Permission = bit["permission"].AsInteger(0),
                                Name = ResolveLocalizedString(bit["display"]["name"]),
                                Description = ResolveLocalizedString(bit["display"]["desc"]),
                                IconNormal = bit["display"]["icon"].AsString(""),
                                IconLocked = bit["display"]["icon_gray"].AsString(""),
                                Hidden = bit["display"]["hidden"].AsBoolean(false),
                            }
                        );
                    }
                }
            }

            return result;
        }

        public static List<StatDefinition> ParseStatDefinitions(uint appId, byte[] schemaBytes)
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
                var displayName = ResolveLocalizedString(stat["display"]["name"]);
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
                        MinValue = isInteger
                            ? stat["min"].AsInteger(int.MinValue)
                            : stat["min"].AsFloat(float.MinValue),
                        MaxValue = isInteger
                            ? stat["max"].AsInteger(int.MaxValue)
                            : stat["max"].AsFloat(float.MaxValue),
                        DefaultValue = isInteger
                            ? stat["default"].AsInteger(0)
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
        // ...), unlike display/icon or display/hidden which are flat values. The real Steam client
        // resolves these via SteamUserStats.GetAchievementDisplayAttribute using its own configured
        // language; that API isn't usable here (SchemaWalker has no live Steam session), so both
        // backends default to English and fall back to the raw schema string when a live
        // localized-attribute lookup fails or isn't available.
        public static string ResolveLocalizedString(KeyValue node)
        {
            if (node.Valid && node.Type == KeyValueType.String)
            {
                return node.AsString("");
            }

            if (node.Children == null)
            {
                return "";
            }

            var english = node.Children.FirstOrDefault(c =>
                string.Equals(c.Name, "english", StringComparison.OrdinalIgnoreCase)
            );
            if (english is { Valid: true })
            {
                return english.AsString("");
            }

            var first = node.Children.FirstOrDefault(c => c.Valid && c.Type == KeyValueType.String);
            return first?.AsString("") ?? "";
        }
    }
}
