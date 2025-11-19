import { getVersion } from '@tauri-apps/api/app'

import { useEffect, useState } from 'react'

import { useUpdateContext } from '@/components/contexts/UpdateContext'
import { logEvent } from '@/utils/tasks'

interface ChangelogResult {
  changelog: string
  version: string
}

function preprocessChangelog(markdown: string): string {
  // Convert @username to [@username](link)
  markdown = markdown.replace(
    /(^|[^\w`])@([a-zA-Z0-9](?:[a-zA-Z0-9-]{0,38}[a-zA-Z0-9])?)(?![\/a-zA-Z0-9_-])/g,
    (match, prefix, username) => `${prefix}[@${username}](https://github.com/${username})`,
  )

  // Convert PR links to [#123](link)
  markdown = markdown.replace(
    /https:\/\/github\.com\/zevnda\/steam-game-idler\/pull\/(\d+)/g,
    (match, pr) => `[#${pr}](${match})`,
  )

  // Convert Issue links to [#123](link)
  markdown = markdown.replace(
    /https:\/\/github\.com\/zevnda\/steam-game-idler\/issues\/(\d+)/g,
    (match, issue) => `[#${issue}](${match})`,
  )

  return markdown
}

export default function useChangelog(): ChangelogResult {
  const { showChangelog } = useUpdateContext()
  const [changelog, setChangelog] = useState('')
  const [version, setVersion] = useState('')

  useEffect(() => {
    const fetchData = async (): Promise<void> => {
      if (!showChangelog) return
      const currentVersion = await getVersion()
      setVersion(currentVersion)
      try {
        const res = await fetch(`https://api.github.com/repos/zevnda/steam-game-idler/releases/tags/${currentVersion}`)
        if (res.ok) {
          const data = await res.json()
          setChangelog(preprocessChangelog(data.body || 'No changelog available for this version.'))
          return
        }
        setChangelog('No changelog available for this version.')
      } catch (error) {
        setChangelog('No changelog available for this version.')
        logEvent(`[Error] Failed to fetch changelog: ${error}`)
      }
    }
    fetchData()
  }, [showChangelog])

  return { changelog, version }
}
