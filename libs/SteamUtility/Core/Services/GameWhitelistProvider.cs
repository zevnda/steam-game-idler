using System.Collections.Generic;
using System.Net.Http;
using System.Text.Json;
using System.Threading.Tasks;

namespace SteamUtility.Core.Services
{
    // Fetches the curated "is this a real game" whitelist (filters out DLC/tools/soundtracks/demos)
    // used by ownership checks in both backends. Single implementation, replacing what used to be
    // two independent fetches of the same URL (the pre-merge SteamUtility's CheckOwnership.cs via
    // WebClient+Newtonsoft, and SteamAgent's OwnershipManager.cs via HttpClient+System.Text.Json).
    public sealed class GameWhitelistProvider
    {
        private const string GamesDatabaseUrl =
            "https://raw.githubusercontent.com/zevnda/steam-game-database/refs/heads/main/games.json";

        private static readonly HttpClient s_httpClient = new();

        private HashSet<uint>? _cached;

        // Cached in-process for the daemon's long lifetime; each CLI invocation is a short-lived
        // process anyway, so a fresh fetch per invocation is acceptable there and keeps this class
        // simple - an on-disk TTL cache shared across CLI invocations would be a reasonable future
        // addition, not required now.
        public async Task<HashSet<uint>> GetWhitelistAsync()
        {
            if (_cached != null)
            {
                return _cached;
            }

            var json = await s_httpClient.GetStringAsync(GamesDatabaseUrl);
            var ids = JsonSerializer.Deserialize<List<uint>>(json) ?? new List<uint>();
            _cached = new HashSet<uint>(ids);
            return _cached;
        }
    }
}
