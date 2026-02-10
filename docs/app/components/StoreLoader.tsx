'use client'

import { useEffect } from 'react'
import { useGlobalStore } from '@docs/stores/globalStore'

export default function StoreLoader() {
  const { setDownloadUrl, setLatestVersion, setRepoStars } = useGlobalStore(state => state)

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
          // Find the installer asset and set the download URL
          const installer = data.assets?.find((asset: { name: string }) =>
            asset.name.endsWith('_x64-setup.exe'),
          )
          if (installer) {
            setDownloadUrl(installer.browser_download_url)
          }
        })
    } catch (error) {
      console.error('Error fetching latest version:', error)
    }
  }, [setDownloadUrl, setLatestVersion])

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

  return null
}
