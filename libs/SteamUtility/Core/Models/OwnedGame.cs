namespace SteamUtility.Core.Models
{
    public sealed class OwnedGame
    {
        public uint AppId { get; init; }

        // Null when the backend has no way to resolve a display name (e.g. the local-client
        // backend's ownership check has no managed-API equivalent of the old raw interop's private
        // GetAppData("name") call - see CheckOwnershipCommand). Callers fall back to enrichment
        // elsewhere (Rust's game_data::merge_and_cache_games_list already does this via the Steam
        // Web API) rather than this project inventing a second name-resolution path.
        public string? Name { get; init; }

        // Null for the local-client (CLI-mode) backend, which has no playtime source of its own -
        // Rust's games::web_api enrichment step fills these in for that backend instead. Non-null
        // for the daemon (agent-mode) backend: OwnershipManager enriches its own PICS-based ownership
        // list with a direct SteamKit2 Player.GetOwnedGames#1 call over the already-authenticated CM
        // session, so agent mode never depends on the Steam Web API (and therefore never depends on
        // Steam Community profile-visibility settings) for playtime data.
        public uint? PlaytimeForeverMinutes { get; init; }
        public uint? RtimeLastPlayed { get; init; }
    }
}
