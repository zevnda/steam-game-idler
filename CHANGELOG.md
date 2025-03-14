[![Downloads](https://img.shields.io/github/downloads/zevnda/steam-game-idler/1.8.1/total?style=for-the-badge&logo=github&color=137eb5)](https://github.com/zevnda/steam-game-idler/releases/download/1.8.1/Steam.Game.Idler_1.8.1_x64-setup.exe)

## Changelog
- Migrate app data directory to be inline with Tauri's v2 format
- The new data directory is `C:\Users\<user>\AppData\Roaming\com.zevnda.steam-game-idler`
- The old data directory was `C:\Users\<user>\AppData\Roaming\steam-game-idler` and should be automatically deleted when launching this version
- The install directory remains the same `C:\Program Files\Steam Game Idler`
- Improved the handling of games lists caches
  - Previously, SGI used a single `games_list.json` file to store games lists caches. The file was deleted when switching between users via the `account selection` screen, causing the games lists to be refetched more than necessary.
  - Games lists caches are now user specific `<steam_id>_games_list.json` and are now preserved until manually deleted via `settings > clear data`
  - Outdated games lists can be updated every 30 minutes by clicking the `refresh` icon at the top of the `games list` screen
    - This forces games lists for that specific user to be deleted and refetched, creating a fresh cache
  - The new cache directory is `C:\Users\<user>\AppData\Roaming\com.zevnda.steam-game-idler\cache`
  - This also reduces the load time when switching accounts