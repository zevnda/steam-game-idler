import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import type { Game } from '@/shared/types'
import type { NextApiRequest, NextApiResponse } from 'next'

interface SteamOwnedGamesResponse {
  response?: {
    games?: Game[]
  }
}

interface SteamRecentGamesResponse {
  response?: {
    games?: Game[]
  }
}

const decryptApiKey = (value: string) => {
  const parts = value.split(':')
  if (parts.length !== 3) return value

  try {
    const iv = Buffer.from(parts[0], 'hex')
    const authTag = Buffer.from(parts[1], 'hex')
    const encrypted = parts[2]
    const decipher = crypto.createDecipheriv('aes-256-gcm', '7k9m2n8q4r6t1u3w5y7z9a2c4e6g8h0j', iv)
    decipher.setAuthTag(authTag)
    let decrypted = decipher.update(encrypted, 'hex', 'utf8')
    decrypted += decipher.final('utf8')
    return decrypted
  } catch {
    return value
  }
}

const toGameList = (games?: Game[]) =>
  (games || []).map(game => ({
    appid: game.appid,
    name: game.name,
    playtime_forever: game.playtime_forever ?? 0,
  }))

const LEGACY_ENV_FILES = ['.env.prod', '.env.dev'] as const

let cachedLegacyEnvKey: string | null | undefined

const getLegacyEnvApiKey = () => {
  if (cachedLegacyEnvKey !== undefined) return cachedLegacyEnvKey

  for (const fileName of LEGACY_ENV_FILES) {
    const filePath = path.join(process.cwd(), fileName)
    if (!fs.existsSync(filePath)) continue

    const content = fs.readFileSync(filePath, 'utf8')
    const lines = content.split(/\r?\n/)

    for (const line of lines) {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith('#')) continue

      const separator = trimmed.indexOf('=')
      if (separator <= 0) continue

      const key = trimmed.slice(0, separator).trim()
      if (key !== 'STEAM_API_KEY' && key !== 'KEY') continue

      let value = trimmed.slice(separator + 1).trim()
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1)
      }

      if (value) {
        cachedLegacyEnvKey = value
        return cachedLegacyEnvKey
      }
    }
  }

  cachedLegacyEnvKey = null
  return cachedLegacyEnvKey
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const steamId = String(req.query.steamId || '').trim()
  const encryptedApiKey = String(req.query.apiKey || '').trim()

  if (!steamId) {
    return res.status(400).json({ error: 'Missing steamId', games_list: [], recent_games: [] })
  }

  const apiKey =
    decryptApiKey(encryptedApiKey || '') ||
    process.env.STEAM_API_KEY ||
    process.env.KEY ||
    getLegacyEnvApiKey() ||
    ''
  if (!apiKey) {
    return res.status(400).json({ error: 'Missing apiKey', games_list: [], recent_games: [] })
  }

  try {
    const [ownedResponse, recentResponse] = await Promise.all([
      fetch(
        `https://api.steampowered.com/IPlayerService/GetOwnedGames/v1/?key=${encodeURIComponent(apiKey)}&steamid=${encodeURIComponent(steamId)}&include_appinfo=true&include_played_free_games=true&include_free_sub=true&skip_unvetted_apps=false&include_extended_appinfo=false`,
      ),
      fetch(
        `https://api.steampowered.com/IPlayerService/GetRecentlyPlayedGames/v1/?key=${encodeURIComponent(apiKey)}&steamid=${encodeURIComponent(steamId)}`,
      ),
    ])

    if (!ownedResponse.ok || !recentResponse.ok) {
      return res
        .status(502)
        .json({ error: 'Steam API request failed', games_list: [], recent_games: [] })
    }

    const owned = (await ownedResponse.json()) as SteamOwnedGamesResponse
    const recent = (await recentResponse.json()) as SteamRecentGamesResponse

    return res.status(200).json({
      games_list: toGameList(owned.response?.games),
      recent_games: toGameList(recent.response?.games),
    })
  } catch {
    return res
      .status(500)
      .json({ error: 'Failed to fetch Steam games', games_list: [], recent_games: [] })
  }
}
