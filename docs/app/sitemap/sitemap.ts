import type { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    // Homepage
    {
      url: 'https://steamgameidler.vercel.app',
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    // Legal pages
    {
      url: 'https://steamgameidler.vercel.app/privacy',
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.3,
    },
    {
      url: 'https://steamgameidler.vercel.app/tos',
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.3,
    },
    // Documentation main page
    {
      url: 'https://steamgameidler.vercel.app/docs',
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    // Get started documentation
    {
      url: 'https://steamgameidler.vercel.app/docs/get-started/install',
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    {
      url: 'https://steamgameidler.vercel.app/docs/get-started/how-to-sign-in',
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    {
      url: 'https://steamgameidler.vercel.app/docs/get-started/build-it-yourself',
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.6,
    },
    // Features documentation
    {
      url: 'https://steamgameidler.vercel.app/docs/features/achievement-manager',
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.6,
    },
    {
      url: 'https://steamgameidler.vercel.app/docs/features/achievement-unlocker',
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.6,
    },
    {
      url: 'https://steamgameidler.vercel.app/docs/features/auto-idler',
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.6,
    },
    {
      url: 'https://steamgameidler.vercel.app/docs/features/card-farming',
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.6,
    },
    {
      url: 'https://steamgameidler.vercel.app/docs/features/playtime-booster',
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.6,
    },
    {
      url: 'https://steamgameidler.vercel.app/docs/features/trading-card-manager',
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.6,
    },
    // Settings documentation
    {
      url: 'https://steamgameidler.vercel.app/docs/settings/general',
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.5,
    },
    {
      url: 'https://steamgameidler.vercel.app/docs/settings/achievement-unlocker',
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.5,
    },
    {
      url: 'https://steamgameidler.vercel.app/docs/settings/card-farming',
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.5,
    },
    {
      url: 'https://steamgameidler.vercel.app/docs/settings/game-settings',
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.5,
    },
    {
      url: 'https://steamgameidler.vercel.app/docs/settings/logs',
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.5,
    },
    // Other documentation
    {
      url: 'https://steamgameidler.vercel.app/docs/faq',
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    {
      url: 'https://steamgameidler.vercel.app/docs/steam-credentials',
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.6,
    },
    {
      url: 'https://steamgameidler.vercel.app/docs/troubleshooting',
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.6,
    },
    {
      url: 'https://steamgameidler.vercel.app/docs/performance',
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.4,
    },
    {
      url: 'https://steamgameidler.vercel.app/docs/tech-stack',
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.4,
    },
    {
      url: 'https://steamgameidler.vercel.app/docs/references',
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.4,
    },
    // Alternatives pages
    {
      url: 'https://steamgameidler.vercel.app/alternatives/archisteamfarm',
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: 'https://steamgameidler.vercel.app/alternatives/idle-master',
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: 'https://steamgameidler.vercel.app/alternatives/steam-achievement-manager',
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
  ]
}
