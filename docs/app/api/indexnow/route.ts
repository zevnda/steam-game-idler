export async function POST(request: Request) {
  const endpoint = 'https://api.indexnow.org/indexnow'

  const payload = {
    host: 'https://steamgameidler.com',
    key: 'a99bafb2fec849c3abfd6d70326b67fa',
    keyLocation: 'https://steamgameidler.com/a99bafb2fec849c3abfd6d70326b67fa.txt',
    urlList: [
      'https://steamgameidler.com/alternatives/archisteamfarm',
      'https://steamgameidler.com/alternatives/idle-master',
      'https://steamgameidler.com/alternatives/steam-achievement-manager',
      'https://steamgameidler.com/docs/faq',
      'https://steamgameidler.com/docs/features/achievement-manager',
      'https://steamgameidler.com/docs/features/achievement-unlocker',
      'https://steamgameidler.com/docs/features/auto-idler',
      'https://steamgameidler.com/docs/features/card-farming',
      'https://steamgameidler.com/docs/features/playtime-booster',
      'https://steamgameidler.com/docs/features/trading-card-manager',
      'https://steamgameidler.com/docs/get-started/build-it-yourself',
      'https://steamgameidler.com/docs/get-started/how-to-sign-in',
      'https://steamgameidler.com/docs/get-started/install',
      'https://steamgameidler.com/docs',
      'https://steamgameidler.com/docs/performance',
      'https://steamgameidler.com/docs/references',
      'https://steamgameidler.com/docs/settings/achievement-unlocker',
      'https://steamgameidler.com/docs/settings/card-farming',
      'https://steamgameidler.com/docs/settings/game-settings',
      'https://steamgameidler.com/docs/settings/general',
      'https://steamgameidler.com/docs/settings/logs',
      'https://steamgameidler.com/docs/steam-credentials',
      'https://steamgameidler.com/docs/tech-stack',
      'https://steamgameidler.com/docs/troubleshooting',
      'https://steamgameidler.com/privacy',
      'https://steamgameidler.com/tos',
    ],
  }

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
      },
      body: JSON.stringify(payload),
    })

    const data = await response.json().catch(() => ({}))
    return new Response(JSON.stringify(data), {
      status: response.status,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message || 'Unknown error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}

// Allow GET for browser testing (returns a simple message)
export async function GET(request: Request) {
  return POST(request)
}
