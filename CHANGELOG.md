[![Downloads](https://img.shields.io/github/downloads/zevnda/steam-game-idler/1.7.9/total?style=for-the-badge&logo=github&color=137eb5)](https://github.com/zevnda/steam-game-idler/releases/download/1.7.9/Steam.Game.Idler_1.7.9_x64_en-US.msi)

## Changelog
- #73: Fixed an issue when storing a cached version of the user's games list
  - Attempting to store large games lists in `sessionStorage` would throw a storage quota exceeded error
  - The users games list and recent games are now stored locally in `.json` files in `C:\Users\<user>\AppData\Roaming\steam-game-idler`