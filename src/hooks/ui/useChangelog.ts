import { getVersion } from '@tauri-apps/api/app'

import { useEffect, useState } from 'react'

import { useUpdateContext } from '@/components/contexts/UpdateContext'

interface ChangelogResult {
  changelog: string
  version: string
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
      const res = await fetch('https://raw.githubusercontent.com/zevnda/steam-game-idler/refs/heads/main/CHANGELOG.md')
      const data = await res.text()

      // Find the current versions changelog
      const versionPattern = new RegExp(`<!-- ${currentVersion} -->([\\s\\S]*?)(?=<!--|$)`, 'i')
      const versionMatch = versionPattern.exec(data)

      if (versionMatch && versionMatch[1]) {
        setChangelog(versionMatch[1].trim().replace(`### Changes in v${currentVersion}`, ''))
      } else {
        setChangelog('No changelog available for this version.')
      }
    }
    fetchData()
  }, [showChangelog])

  return { changelog, version }
}

export const transformIssueReferences = (text: string): string => {
  const issueRegex = /(#\d{2,3})\b/g
  let result = text

  let match
  while ((match = issueRegex.exec(text)) !== null) {
    const issueNumber = match[1]
    const issueLink = `https://github.com/zevnda/steam-game-idler/issues/${issueNumber.substring(1)}`
    const link = `<a href='${issueLink}' target='_blank'>${match[0]}</a>`
    result = result.replace(match[0], link)
  }

  return result
}

export const transformMentions = (text: string): string => {
  const userRegex = /@([a-zA-Z0-9_-]+)/g
  let result = text

  let match
  while ((match = userRegex.exec(text)) !== null) {
    const username = match[1]
    const userLink = `https://github.com/${username}`
    const link = `<a href='${userLink}' target='_blank' rel='noopener noreferrer'>${match[0]}</a>`
    result = result.replace(match[0], link)
  }

  return result
}

export const transformLinks = (text: string): string => {
  const linkRegex = /\[(.*?)\]\((https?:\/\/.*?)\)/g
  let result = text

  let match
  while ((match = linkRegex.exec(text)) !== null) {
    const linkText = match[1]
    const linkUrl = match[2]
    const newLink = `<a href='${linkUrl}' target='_blank' rel='noopener noreferrer'>${linkText}</a>`
    result = result.replace(match[0], newLink)
  }

  return result
}
