using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Text.Json;
using System.Threading.Tasks;
using SteamUtility.Core.Errors;
using SteamUtility.Core.Logging;

namespace SteamUtility.Core.Services
{
    // Fetches the curated "is this a real game" whitelist (filters out DLC/tools/soundtracks/demos)
    // used by CLI mode's ownership check (SteamworksLocalBackend.CheckOwnershipAsync) - the only
    // consumer, since Steamworks' IsSubscribedApp only answers yes/no for an app id you already have,
    // so CLI mode needs this as its candidate-id source, not just a filter. Agent mode resolves
    // ownership straight from PICS and never calls this (see OwnershipManager.cs's own comment on
    // why it deliberately doesn't use this list).
    //
    // Backed by an on-disk TTL cache (see below) - each CLI invocation is a fresh process, so the
    // old in-memory-only version re-fetched from GitHub on literally every `check_ownership` call,
    // including the frontend's background games-list poll (every 1-5 minutes per signed-in CLI
    // account - see useAutoUpdateGamesListStatus.ts). That call volume, aggregated across this app's
    // whole user base, is the most likely cause of hitting raw.githubusercontent.com's rate limit at
    // all; the disk cache exists to fix that at the source, not just to survive it.
    public sealed class GameWhitelistProvider
    {
        private const string GamesDatabaseUrl =
            "https://raw.githubusercontent.com/zevnda/steam-game-database/refs/heads/main/games.json";

        private static readonly TimeSpan FreshnessTtl = TimeSpan.FromHours(3.5);

        private const int MaxFetchAttempts = 3;
        private static readonly TimeSpan RetryBaseDelay = TimeSpan.FromSeconds(1);

        private static readonly HttpClient s_httpClient = new()
        {
            Timeout = TimeSpan.FromSeconds(15),
        };

        private static readonly string s_cacheFilePath = BuildCacheFilePath();

        private HashSet<uint>? _cached;

        public async Task<HashSet<uint>> GetWhitelistAsync()
        {
            if (_cached != null)
            {
                return _cached;
            }

            var onDisk = ReadDiskCache();
            if (onDisk != null && DateTime.UtcNow - onDisk.Value.FetchedAtUtc < FreshnessTtl)
            {
                _cached = onDisk.Value.AppIds;
                return _cached;
            }

            try
            {
                var fetched = await FetchWithRetryAsync();
                WriteDiskCache(fetched);
                _cached = fetched;
                return _cached;
            }
            catch (Exception ex)
            {
                if (onDisk != null)
                {
                    Log.Warn(
                        "GameWhitelistProvider",
                        $"Whitelist refresh failed ({ex.Message}), using cached copy from {onDisk.Value.FetchedAtUtc:u}"
                    );
                    _cached = onDisk.Value.AppIds;
                    return _cached;
                }

                if (ex is HttpRequestException { StatusCode: HttpStatusCode.TooManyRequests })
                {
                    throw new GameWhitelistRateLimitedException();
                }

                throw new GameWhitelistUnavailableException(ex.Message);
            }
        }

        private static async Task<HashSet<uint>> FetchWithRetryAsync()
        {
            for (var attempt = 1; ; attempt++)
            {
                try
                {
                    var json = await s_httpClient.GetStringAsync(GamesDatabaseUrl);
                    var ids = JsonSerializer.Deserialize<List<uint>>(json) ?? new List<uint>();
                    return new HashSet<uint>(ids);
                }
                catch (HttpRequestException ex)
                    when (ex.StatusCode == HttpStatusCode.TooManyRequests)
                {
                    throw;
                }
                catch (Exception ex) when (attempt < MaxFetchAttempts && IsTransient(ex))
                {
                    Log.Warn(
                        "GameWhitelistProvider",
                        $"Whitelist fetch attempt {attempt} failed ({ex.Message}), retrying"
                    );
                    await Task.Delay(RetryBaseDelay * attempt);
                }
            }
        }

        private static bool IsTransient(Exception ex) =>
            ex is HttpRequestException or TaskCanceledException or TimeoutException;

        private static string BuildCacheFilePath()
        {
            var appData = Environment.GetFolderPath(Environment.SpecialFolder.ApplicationData);
            var dir = Path.Combine(appData, "com.zevnda.steam-game-idler", "cache");
            Directory.CreateDirectory(dir);
            return Path.Combine(dir, "game-whitelist.json");
        }

        private readonly record struct WhitelistCacheEntry(
            DateTime FetchedAtUtc,
            HashSet<uint> AppIds
        );

        private sealed class WhitelistCacheDto
        {
            public DateTime FetchedAtUtc { get; set; }
            public List<uint> AppIds { get; set; } = new();
        }

        private static WhitelistCacheEntry? ReadDiskCache()
        {
            try
            {
                if (!File.Exists(s_cacheFilePath))
                {
                    return null;
                }

                var json = File.ReadAllText(s_cacheFilePath);
                var dto = JsonSerializer.Deserialize<WhitelistCacheDto>(json);
                if (dto == null || dto.AppIds.Count == 0)
                {
                    return null;
                }

                return new WhitelistCacheEntry(dto.FetchedAtUtc, new HashSet<uint>(dto.AppIds));
            }
            catch (Exception ex)
            {
                Log.Warn(
                    "GameWhitelistProvider",
                    $"Whitelist cache read failed, ignoring: {ex.Message}"
                );
                return null;
            }
        }

        private static void WriteDiskCache(HashSet<uint> appIds)
        {
            try
            {
                var dto = new WhitelistCacheDto
                {
                    FetchedAtUtc = DateTime.UtcNow,
                    AppIds = appIds.ToList(),
                };
                File.WriteAllText(s_cacheFilePath, JsonSerializer.Serialize(dto));
            }
            catch (Exception ex)
            {
                Log.Warn("GameWhitelistProvider", $"Whitelist cache write failed: {ex.Message}");
            }
        }
    }
}
