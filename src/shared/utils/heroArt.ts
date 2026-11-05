const CDN_BASE = 'https://cdn.cloudflare.steamstatic.com/steam/apps'

export interface HeroArt {
  hero: string
  // Steam's transparent title artwork. About 98% of games with hero art have one at this path, and
  // the store API doesn't report it, so it can only be found by trying it. `null` shows the name
  // as text instead.
  logo: string | null
}

// Every game whose wide hero art has been checked this session, shared by the Games page's
// Recommended banner and the Card Farming / Achievement Unlocker running screens, so a game checked
// by one is instant on the other. `null` means the game has no usable hero art (callers fall back
// to its header image).
export const checkedHeroArt = new Map<number, HeroArt | null>()

export const headerImageUrl = (appId: number) => `${CDN_BASE}/${appId}/header.jpg`

const imageLoads = (url: string) =>
  new Promise<boolean>(resolve => {
    const image = new window.Image()
    image.onload = () => resolve(true)
    image.onerror = () => resolve(false)
    image.src = url
  })

// Actually loads the images rather than trusting that a URL exists, since a banner with broken art
// must never be shown. This also means the images are already in the browser's cache by the time
// they're shown, so a crossfade never reveals a half-loaded image.
export const checkHeroArt = async (appId: number, resolvedHero: string | null) => {
  // The plain path is still worth trying after the store's: it works for many games the store API
  // has no data on, and in testing it found art for slightly more games overall.
  const heroes = [resolvedHero, `${CDN_BASE}/${appId}/library_hero.jpg`]
  let hero: string | null = null
  for (const url of heroes) {
    if (url && (await imageLoads(url))) {
      hero = url
      break
    }
  }
  if (!hero) return null

  const logo = `${CDN_BASE}/${appId}/logo.png`
  return { hero, logo: (await imageLoads(logo)) ? logo : null }
}
