// Mirrors `LocalSteamUser` in src-tauri/src/local_steam/vdf.rs (serde `rename_all = "camelCase"`).
export interface LocalSteamUser {
  steamId: string
  personaName: string
  mostRecent: boolean
}

// One player entry from the Steam Web API's `ISteamUser/GetPlayerSummaries` response - both
// `get_user_summary` and `get_user_summary_cache`
// (src-tauri/src/local_steam/steam_web_api.rs) return this shape verbatim (Steam's own field
// casing, not ours).
export interface SteamPlayerSummary {
  steamid: string
  personaname: string
  avatar: string
}

export interface SteamPlayerSummaryResponse {
  response: {
    players?: SteamPlayerSummary[]
  }
}

// The merged shape the UI actually renders - a local account plus whatever Steam Web API data is
// available for it (cached, freshly fetched, or absent entirely if the API call failed).
export interface SteamAccount {
  steamId: string
  personaName: string
  avatarUrl: string | null
  mostRecent: boolean
}
