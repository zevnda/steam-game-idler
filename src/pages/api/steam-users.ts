import fs from 'node:fs/promises'
import path from 'node:path'
import type { NextApiRequest, NextApiResponse } from 'next'

interface SteamUser {
  personaName: string
  steamId: string
  mostRecent: number
}

const steamDirCandidates = () => {
  const home = process.env.HOME || ''
  const envSteamDir = process.env.STEAM_DIR

  return [
    envSteamDir,
    process.env.XDG_DATA_HOME ? path.join(process.env.XDG_DATA_HOME, 'Steam') : null,
    home ? path.join(home, '.steam', 'steam') : null,
    home ? path.join(home, '.steam', 'root') : null,
    home ? path.join(home, '.local', 'share', 'Steam') : null,
    home ? path.join(home, '.var', 'app', 'com.valvesoftware.Steam', '.steam', 'steam') : null,
    home ? path.join(home, '.var', 'app', 'com.valvesoftware.Steam', 'data', 'Steam') : null,
  ].filter(Boolean) as string[]
}

const fileExists = async (filePath: string) => {
  try {
    await fs.access(filePath)
    return true
  } catch {
    return false
  }
}

const findLoginUsersFile = async () => {
  for (const candidate of steamDirCandidates()) {
    const filePath = path.join(candidate, 'config', 'loginusers.vdf')
    if (await fileExists(filePath)) {
      return filePath
    }
  }

  return null
}

const parseLoginUsers = (content: string) => {
  const users = new Map<string, SteamUser>()
  let pendingSteamId: string | null = null
  let currentSteamId = ''
  let currentPersonaName = ''
  let currentMostRecent = 0

  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim()

    const steamIdMatch = trimmed.match(/^"(\d{17})"$/)
    if (steamIdMatch?.[1]) {
      pendingSteamId = steamIdMatch[1]
      continue
    }

    if (trimmed === '{') {
      if (!currentSteamId && pendingSteamId) {
        currentSteamId = pendingSteamId
        pendingSteamId = null
        currentPersonaName = ''
        currentMostRecent = 0
      }
      continue
    }

    const personaMatch = trimmed.match(/^"PersonaName"\s*"([^"]*)"$/i)
    if (personaMatch?.[1]) {
      currentPersonaName = personaMatch[1]
      continue
    }

    const mostRecentMatch = trimmed.match(/^"MostRecent"\s*"(\d+)"$/i)
    if (mostRecentMatch?.[1]) {
      currentMostRecent = Number(mostRecentMatch[1])
      continue
    }

    if (trimmed === '}') {
      if (currentSteamId && currentPersonaName) {
        users.set(currentSteamId, {
          steamId: currentSteamId,
          personaName: currentPersonaName,
          mostRecent: currentMostRecent,
        })
      }
      currentSteamId = ''
      currentPersonaName = ''
      currentMostRecent = 0
    }
  }

  if (currentSteamId && currentPersonaName) {
    users.set(currentSteamId, {
      steamId: currentSteamId,
      personaName: currentPersonaName,
      mostRecent: currentMostRecent,
    })
  }

  return [...users.values()]
}

export default async function handler(_req: NextApiRequest, res: NextApiResponse) {
  const filePath = await findLoginUsersFile()

  if (!filePath) {
    return res.status(200).json({ error: 'No users found', users: [] })
  }

  const users = parseLoginUsers(await fs.readFile(filePath, 'utf8'))

  if (users.length === 0) {
    return res.status(200).json({ error: 'No users found', users: [] })
  }

  return res.status(200).json({ users })
}
