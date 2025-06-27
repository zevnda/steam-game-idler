import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Steam Game Idler',
    short_name: 'SGI',
    description:
      'The best Steam card farmer and achievement manager. Farm trading cards, manage achievements, and idle games automatically. A great alternative to ArchiSteamFarm, Steam Achievement Manager, and Idle Master.',
    start_url: '/',
    display: 'standalone',
    background_color: '#fafafa',
    theme_color: '#101010',
    lang: 'en',
    icons: [
      {
        src: '/favicon.ico',
        sizes: '16x16 32x32 48x48',
        type: 'image/x-icon',
      },
      {
        src: '/logo.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/logo.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  }
}
