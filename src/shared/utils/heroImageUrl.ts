// Steam's hero art CDN path (`cdn.cloudflare.steamstatic.com`, not main's `cdn.steamstatic.com`) -
// `library_hero.jpg` first (a wide capsule-art crop), falling back to the smaller `header.jpg`
// GameThumbnail.tsx already relies on if an app has no hero art (common for older/DLC-less apps).
// Shared by AchievementManagerOverlay and AchievementUnlockerProgressView - both render a
// full-bleed background banner for a single game.
export const heroImageUrl = (appId: number, useFallback: boolean) =>
  `https://cdn.cloudflare.steamstatic.com/steam/apps/${appId}/${useFallback ? 'header' : 'library_hero'}.jpg`
