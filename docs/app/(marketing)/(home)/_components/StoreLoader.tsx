'use client'

import { useEffect } from 'react'
import { formatBytes } from '@/app/lib/format'
import { useGlobalStore } from '@/app/lib/globalStore'

export default function StoreLoader() {
  const {
    setDownloadUrl,
    setLatestVersion,
    setDownloadSize,
    setRepoStars,
    setTotalDownloads,
    setTotalDownloadsRaw,
    setTotalGames,
  } = useGlobalStore(state => state)

  // Fetch the latest release information from the GitHub API
  useEffect(() => {
    try {
      fetch('https://api.github.com/repos/zevnda/steam-game-idler/releases/latest')
        .then(response => response.json())
        .then(data => {
          // Set the latest version from the tag name
          if (data.tag_name) {
            setLatestVersion(data.tag_name)
          }
          // Find the installer asset and set the download URL + size
          const installer = data.assets?.find((asset: { name: string }) =>
            asset.name.endsWith('_x64-setup.exe'),
          )
          if (installer) {
            setDownloadUrl(installer.browser_download_url)
            setDownloadSize(formatBytes(installer.size))
          }
        })
    } catch (error) {
      console.error('Error fetching latest version:', error)
    }
  }, [setDownloadUrl, setLatestVersion, setDownloadSize])

  // Fetch the number of stars from the GitHub API
  useEffect(() => {
    try {
      fetch('https://api.github.com/repos/zevnda/steam-game-idler')
        .then(response => response.json())
        .then(data => {
          if (typeof data.stargazers_count === 'number') {
            setRepoStars(data.stargazers_count)
          }
        })
    } catch (error) {
      console.error('Error fetching GitHub stars:', error)
    }
  }, [setRepoStars])

  // Fetch the total download count across all releases
  useEffect(() => {
    try {
      fetch('https://apibase.vercel.app/api/gh-downloads?user=zevnda&repo=steam-game-idler')
        .then(response => response.json())
        .then(data => {
          if (typeof data.results?.grandTotal === 'string') {
            setTotalDownloads(data.results.grandTotal)
          }
          if (typeof data.results?.grandTotalRaw === 'number') {
            setTotalDownloadsRaw(data.results.grandTotalRaw)
          }
        })
    } catch (error) {
      console.error('Error fetching download count:', error)
    }
  }, [setTotalDownloads, setTotalDownloadsRaw])

  // Fetch the total number of supported games from the steam-game-database metadata
  useEffect(() => {
    try {
      fetch(
        'https://raw.githubusercontent.com/zevnda/steam-game-database/refs/heads/main/metadata.json',
      )
        .then(response => response.json())
        .then(data => {
          if (typeof data.totalGames === 'number') {
            setTotalGames(data.totalGames)
          }
        })
    } catch (error) {
      console.error('Error fetching total games count:', error)
    }
  }, [setTotalGames])

  return null
}
