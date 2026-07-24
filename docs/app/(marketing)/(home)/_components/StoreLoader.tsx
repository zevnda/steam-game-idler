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
    setLinuxDownloadUrl,
    setLinuxDownloadSize,
    setLinuxRpmUrl,
    setLinuxAppImageUrl,
    setWindowsPortableUrl,
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
          // Portable zip - secondary link alongside the primary installer (see release.yml's
          // "Prepare portable executable" step for the exact naming convention)
          const portable = data.assets?.find((asset: { name: string }) =>
            asset.name.endsWith('_x64-portable.zip'),
          )
          if (portable) setWindowsPortableUrl(portable.browser_download_url)
          // Linux assets only exist from the first release published after Linux support shipped
          // - these all stay unset (empty string) on any older release, which every Linux-aware
          // consumer (DownloadHero, CTASection, DocsCTA) already treats as "not available yet"
          // and falls back to Windows for, so this needs no feature-flagging of its own.
          const deb = data.assets?.find((asset: { name: string }) => asset.name.endsWith('.deb'))
          if (deb) {
            setLinuxDownloadUrl(deb.browser_download_url)
            setLinuxDownloadSize(formatBytes(deb.size))
          }
          const rpm = data.assets?.find((asset: { name: string }) => asset.name.endsWith('.rpm'))
          if (rpm) setLinuxRpmUrl(rpm.browser_download_url)
          // Not `.AppImage.tar.gz`/`.sig` - the updater's own companion files, not the app itself
          const appImage = data.assets?.find((asset: { name: string }) =>
            asset.name.endsWith('.AppImage'),
          )
          if (appImage) setLinuxAppImageUrl(appImage.browser_download_url)
        })
    } catch (error) {
      console.error('Error fetching latest version:', error)
    }
  }, [
    setDownloadUrl,
    setLatestVersion,
    setDownloadSize,
    setLinuxDownloadUrl,
    setLinuxDownloadSize,
    setLinuxRpmUrl,
    setLinuxAppImageUrl,
    setWindowsPortableUrl,
  ])

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
