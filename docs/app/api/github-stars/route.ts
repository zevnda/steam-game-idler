import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const response = await fetch('https://api.github.com/repos/zevnda/steam-game-idler', {
      headers: {
        'User-Agent': 'steam-game-idler-docs',
      },
    })

    if (!response.ok) {
      throw new Error('Failed to fetch repository data')
    }

    const data = await response.json()

    return NextResponse.json(
      { stars: data.stargazers_count },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=43200',
        },
      },
    )
  } catch (error) {
    console.error('Error fetching GitHub stars:', error)
    return NextResponse.json(
      { stars: 160 },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=43200',
        },
      },
    )
  }
}
