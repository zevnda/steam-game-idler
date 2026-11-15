// Steam only ever gives achievement icons as a bare filename (see
// libs/SteamUtility/Core/SchemaParsing/SchemaWalker.cs's `icon`/`icon_gray` fields) - this turns one
// into a real image URL.
//
// `community_assets` is the path Steam's own achievement pages use. The older
// `steamcdn-a.akamaihd.net/steamcommunity/public/images/apps/` path only has icons for older games:
// newer games (and achievements added since) 404 there, so their icons showed as broken images.
const ACHIEVEMENT_ICON_BASE_URL =
  'https://shared.fastly.steamstatic.com/community_assets/images/apps'

export const achievementIconUrl = (appId: number, icon: string) =>
  `${ACHIEVEMENT_ICON_BASE_URL}/${appId}/${icon}`
