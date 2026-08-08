using System;
using System.Collections.Generic;
using System.IO;
using SteamUtility.Core.SchemaParsing;

namespace SteamUtility.Core.AppInfoParsing
{
    public sealed class AppInfoLookupResult
    {
        public required string ResolvedName { get; init; }
        public required string EnglishName { get; init; }
        public required IReadOnlyDictionary<string, string> NameLocalized { get; init; }
    }

    // Reads the local Steam client's appinfo.vdf cache (<Steam install>/appcache/appinfo.vdf) to
    // resolve an app's `common.name_localized` field - the same per-language name data the real
    // Steam client's own Library page uses to show a translated title for some apps (populated only
    // for apps whose publisher entered localized names via Steamworks; empty for most). No
    // Steamworks.NET/interop call exposes this (GetAppData has no localized-name key, and the
    // GetOwnedGames Web API has no language parameter), so this reads the client's local cache file
    // directly instead - the same thing the real client itself does.
    //
    // Format confirmed against SteamDatabase/SteamAppInfo (MIT, https://github.com/SteamDatabase/SteamAppInfo)
    // and its ValveKeyValue-based reference reader (a 4-byte magic+version header - magic 0x075644
    // in the upper 24 bits, version 39-41 in the low byte - an optional string-table block for
    // version 41+, then a sequence of per-app entries (AppID/Size/InfoState/LastUpdated/PICSToken/
    // 20-byte SHA1/ChangeNumber/[20-byte BinaryDataHash if v40+]) each wrapping an embedded
    // binary-VDF KeyValues tree, terminated by an AppID of 0). ValveKeyValue itself is not used here
    // - every published version on NuGet only targets net10.0, incompatible with this project's
    // net8.0 - so AppInfoKeyValueReader is a small hand-rolled reader instead, built the same way
    // SchemaParsing/KeyValue.cs already hand-rolls the (simpler, no-string-table) schema-blob format.
    public static class AppInfoReader
    {
        private const uint MagicPrefix = 0x075644;

        // A full owned-games library scan needs every owned app's name in one pass rather than
        // reopening/rescanning the whole file per game (appinfo.vdf caches every app the client
        // has ever seen, so it can be very large). Scans entries sequentially, resolving each
        // requested app id as it's encountered and stopping early once every id in `targetAppIds`
        // has either been found or the file's AppID-0 footer is reached.
        public static IReadOnlyDictionary<uint, AppInfoLookupResult> FindAppNames(
            string appInfoPath,
            IReadOnlyCollection<uint> targetAppIds,
            string preferredLanguage
        )
        {
            var results = new Dictionary<uint, AppInfoLookupResult>();
            var remaining = new HashSet<uint>(targetAppIds);
            if (remaining.Count == 0)
            {
                return results;
            }

            using var stream = File.OpenRead(appInfoPath);
            using var reader = new BinaryReader(stream);

            var header = reader.ReadUInt32();
            var version = header & 0xFF;
            var magic = header >> 8;
            if (magic != MagicPrefix || version < 39 || version > 41)
            {
                throw new InvalidDataException(
                    $"Unsupported appinfo.vdf header (magic=0x{magic:X}, version={version})."
                );
            }

            reader.ReadUInt32(); // universe - irrelevant for name resolution

            List<string>? stringTable = null;
            if (version >= 41)
            {
                var stringTableOffset = reader.ReadInt64();
                var resumePosition = stream.Position;

                stream.Position = stringTableOffset;
                var stringCount = reader.ReadUInt32();
                stringTable = new List<string>((int)stringCount);
                for (var i = 0; i < stringCount; i++)
                {
                    stringTable.Add(AppInfoKeyValueReader.ReadInlineString(stream));
                }

                stream.Position = resumePosition;
            }

            while (remaining.Count > 0)
            {
                var appId = reader.ReadUInt32();
                if (appId == 0)
                {
                    break; // footer reached - anything still in `remaining` isn't cached locally
                }

                var size = reader.ReadUInt32();
                var entryEnd = stream.Position + size;

                if (!remaining.Remove(appId))
                {
                    // Skip the header sub-fields and the embedded KV tree together without decoding
                    // either - not one of the ids we're looking for.
                    stream.Position = entryEnd;
                    continue;
                }

                reader.ReadUInt32(); // InfoState
                reader.ReadUInt32(); // LastUpdated
                reader.ReadUInt64(); // PICSToken
                reader.ReadBytes(20); // SHA-1 hash
                reader.ReadUInt32(); // ChangeNumber
                if (version >= 40)
                {
                    reader.ReadBytes(20); // BinaryDataHash
                }

                var root = AppInfoKeyValueReader.ReadNode(stream, stringTable);

                if (stream.Position != entryEnd)
                {
                    throw new InvalidDataException(
                        $"App {appId}'s appinfo.vdf entry did not parse to its declared size."
                    );
                }

                results[appId] = BuildResult(root, preferredLanguage);
            }

            return results;
        }

        private static AppInfoLookupResult BuildResult(KeyValue root, string preferredLanguage)
        {
            // The embedded KV tree's single top-level child is a wrapper node named "appinfo" -
            // "common" (and its siblings "extended"/"config"/"depots") live one level under that,
            // not at the tree root directly. Confirmed empirically against a real appinfo.vdf
            // (10 Second Ninja X, app 435790) - the wrapper level isn't documented by
            // SteamDatabase/SteamAppInfo's own README/reference reader (which only shows
            // `app.Data["common"]`), but is real in the actual on-disk binary format.
            var common = root["appinfo"]["common"];
            var englishName = common["name"].AsString("");

            var localizedNode = common["name_localized"];
            var nameLocalized = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);
            if (localizedNode.Valid && localizedNode.Children != null)
            {
                foreach (var child in localizedNode.Children)
                {
                    if (child.Valid && child.Type == KeyValueType.String)
                    {
                        nameLocalized[child.Name] = child.AsString("");
                    }
                }
            }

            // Deliberately NOT SchemaWalker.ResolveLocalizedString here, despite the shape looking
            // identical to achievement display/name resolution - its "first available" fallback
            // tier is wrong for this case. That tier makes sense for achievement text, which has no
            // separate always-present field to fall back to; here, common.name (englishName) IS
            // that reliable fallback, so falling through to "whichever other language happens to be
            // in name_localized" instead (e.g. returning a Chinese name when English was requested,
            // just because Chinese was the only language a publisher happened to localize) would be
            // actively wrong, not just imprecise. Confirmed via real testing against app 435790,
            // which only has a "schinese" entry - requesting "english" must resolve to the flat
            // common.name, not fall through to the Chinese one.
            var resolvedName =
                nameLocalized.TryGetValue(preferredLanguage, out var preferred)
                && !string.IsNullOrEmpty(preferred)
                    ? preferred
                    : englishName;

            return new AppInfoLookupResult
            {
                ResolvedName = resolvedName,
                EnglishName = englishName,
                NameLocalized = nameLocalized,
            };
        }
    }
}
