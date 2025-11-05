import type { Manifest } from 'next/dist/lib/metadata/types/manifest-types'

export const dynamic = 'force-static'

export default function manifest(): Manifest {
  return {
    name: 'Steam Game Idler',
    short_name: 'SGI',
    description:
      'The best Steam card farmer and achievement manager. Farm trading cards, manage achievements, and idle games automatically. A great alternative to ArchiSteamFarm, Steam Achievement Manager, and Idle Master.',
    start_url: '/',
    display: 'browser',
    background_color: '#fafafa',
    theme_color: '#101010',
    lang: 'en',
    icons: [
      {
        src: '/favicon.ico',
        sizes: '16x16 32x32 48x48',
        type: 'image/x-icon',
      },
    ],
  }
}
