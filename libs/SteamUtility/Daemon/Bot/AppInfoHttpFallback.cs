using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.IO;
using System.IO.Compression;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Text;
using System.Threading;
using System.Threading.Tasks;
using SteamKit2;
using SteamUtility.Core.Logging;

namespace SteamUtility.Daemon.Bot
{
    // Steam can leave an app's details out of a PICS response, sending only its change number and
    // SHA hash, and expect the client to download them over HTTP instead. Seen in November 2026 for
    // ~99% of one heavily-used test account's library while another account on the same machine got
    // full inline details, so it looks like per-account throttling of repeated full-library fetches
    // (the same symptom in another client: https://github.com/utkarshdalal/GameNative/pull/2301).
    // The response is meant to name the server in http_host (SteamKit2 then builds HttpUri and sets
    // UseHttp), but it didn't, so SteamKit2 handed back empty KeyValues with no way to fetch them.
    // This downloads them from Steam's own fallback host, and keeps what it downloads so the same
    // details are never fetched twice.
    internal static class AppInfoHttpFallback
    {
        // The host the Steam client itself uses when a response names none.
        private const string FallbackHost = "clientconfig.akamai.steamstatic.com";

        // Each download is mostly waiting on the CDN (~0.1s when Akamai has the file, ~0.7s when it
        // has to fetch it from Steam), so throughput scales with how many run at once. Bounded so a
        // whole library doesn't open thousands of connections.
        private const int Concurrency = 48;

        // Set by the Rust side at spawn (steam_agent::process) to platform::cache_dir, so this lands
        // in the same place as every other cache file, including inside a portable install's own
        // folder. Unset (e.g. running the daemon by hand), only the in-memory cache is used.
        private const string CacheDirEnvVar = "STEAMUTILITY_CACHE_DIR";

        private static readonly HttpClient s_httpClient = new(
            new HttpClientHandler { AutomaticDecompression = DecompressionMethods.GZip }
        )
        {
            Timeout = TimeSpan.FromSeconds(15),
        };

        // Only `common` is kept, since it's all ownership reads, and the full appinfo (depots,
        // branches) is far larger. Keyed by app id and SHA hash: the hash identifies the exact
        // content, so an entry can never go stale, and a changed app simply misses under its new hash.
        private static readonly ConcurrentDictionary<(uint AppId, string Sha), KeyValue> s_memoryCache = new();

        private static readonly string? s_diskCacheDir = ResolveDiskCacheDir();

        public readonly record struct LoadResult(int Downloaded, int Failed);

        // Fills each app's empty KeyValues in place with its `common` section, from memory, disk or a
        // download, so callers read it exactly like an inline response (KeyValues has no public
        // setter, but its children list is mutable). Apps that fail stay blank, so one bad download
        // only drops that app rather than failing the whole library. Failures are logged once per
        // call, not per app, so an unreachable server doesn't write a line for every game.
        public static async Task<LoadResult> LoadAsync(
            IReadOnlyList<SteamApps.PICSProductInfoCallback.PICSProductInfo> apps
        )
        {
            if (apps.Count == 0)
            {
                return new LoadResult(0, 0);
            }

            int downloaded = 0, failed = 0;
            string? firstError = null;
            await Parallel.ForEachAsync(
                apps,
                new ParallelOptions { MaxDegreeOfParallelism = Concurrency },
                async (info, cancellationToken) =>
                {
                    var sha = Convert.ToHexString(info.SHAHash ?? Array.Empty<byte>()).ToLowerInvariant();
                    try
                    {
                        var key = (info.ID, sha);
                        if (!s_memoryCache.TryGetValue(key, out var common))
                        {
                            common = ReadDiskCache(info.ID, sha);
                            if (common == null)
                            {
                                common = await DownloadAsync(info, sha, cancellationToken);
                                Interlocked.Increment(ref downloaded);
                                WriteDiskCache(info.ID, sha, common);
                            }
                            s_memoryCache[key] = common;
                        }
                        info.KeyValues.Children.Add(common);
                    }
                    catch (Exception ex)
                    {
                        Interlocked.Increment(ref failed);
                        Interlocked.CompareExchange(ref firstError, $"app {info.ID}: {ex.Message}", null);
                    }
                }
            );

            if (failed > 0)
            {
                Log.Warn(
                    "OwnershipManager",
                    $"Failed to load app details over HTTP: failed={failed} of={apps.Count} first={firstError}"
                );
            }

            return new LoadResult(downloaded, failed);
        }

        private static async Task<KeyValue> DownloadAsync(
            SteamApps.PICSProductInfoCallback.PICSProductInfo info,
            string sha,
            CancellationToken cancellationToken
        )
        {
            var uri = info.HttpUri ?? new Uri($"https://{FallbackHost}/appinfo/{info.ID}/sha/{sha}.txt.gz");
            var bytes = await s_httpClient.GetByteArrayAsync(uri, cancellationToken);
            var common = KeyValue.LoadFromString(Decode(bytes))?["common"];
            if (common == null || common.Children.Count == 0)
            {
                throw new InvalidDataException("response had no common section");
            }
            return common;
        }

        // The file is gzipped text appinfo with a trailing NUL. Whether it arrives still gzipped
        // depends on how the server labels it (AutomaticDecompression only covers a gzip
        // Content-Encoding), so check the bytes.
        private static string Decode(byte[] bytes)
        {
            string text;
            if (bytes.Length >= 2 && bytes[0] == 0x1f && bytes[1] == 0x8b)
            {
                using var gzip = new GZipStream(new MemoryStream(bytes), CompressionMode.Decompress);
                using var reader = new StreamReader(gzip, Encoding.UTF8);
                text = reader.ReadToEnd();
            }
            else
            {
                text = Encoding.UTF8.GetString(bytes);
            }

            return text.TrimEnd('\0');
        }

        private static string? ResolveDiskCacheDir()
        {
            var root = Environment.GetEnvironmentVariable(CacheDirEnvVar);
            return string.IsNullOrEmpty(root) ? null : Path.Combine(root, "appinfo");
        }

        private static string CacheFilePath(string dir, uint appId, string sha) =>
            Path.Combine(dir, $"{appId}_{sha}.vdf");

        // Any problem reading just means downloading it again, so it's never an error.
        private static KeyValue? ReadDiskCache(uint appId, string sha)
        {
            if (s_diskCacheDir == null)
            {
                return null;
            }

            try
            {
                var path = CacheFilePath(s_diskCacheDir, appId, sha);
                if (!File.Exists(path))
                {
                    return null;
                }

                var common = KeyValue.LoadAsText(path);
                return common is { Children.Count: > 0 } ? common : null;
            }
            catch (Exception ex)
            {
                Log.Warn("OwnershipManager", $"App details cache read failed for app {appId}: {ex.Message}");
                return null;
            }
        }

        // Written to a temp file and moved into place, so a crash or another account's daemon (one
        // per signed-in account, all sharing this folder) never sees a half-written file. Two daemons
        // writing the same app write identical content, so whichever move lands last is fine. Older
        // hashes for the same app are deleted, so the folder holds one file per app rather than
        // growing with every update Steam ships.
        private static void WriteDiskCache(uint appId, string sha, KeyValue common)
        {
            if (s_diskCacheDir == null)
            {
                return;
            }

            try
            {
                Directory.CreateDirectory(s_diskCacheDir);
                var path = CacheFilePath(s_diskCacheDir, appId, sha);
                var tempPath = $"{path}.{Environment.ProcessId}.tmp";
                common.SaveToFile(tempPath, asBinary: false);
                File.Move(tempPath, path, overwrite: true);

                foreach (var stale in Directory.EnumerateFiles(s_diskCacheDir, $"{appId}_*.vdf"))
                {
                    if (!string.Equals(stale, path, StringComparison.OrdinalIgnoreCase))
                    {
                        File.Delete(stale);
                    }
                }
            }
            catch (Exception ex)
            {
                Log.Warn("OwnershipManager", $"App details cache write failed for app {appId}: {ex.Message}");
            }
        }
    }
}
