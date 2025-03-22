[![Downloads](https://img.shields.io/github/downloads/zevnda/steam-game-idler/1.9.0/total?style=for-the-badge&logo=github&color=137eb5)](https://github.com/zevnda/steam-game-idler/releases/download/1.9.0/Steam.Game.Idler_1.9.0_x64-setup.exe)

## Changelog
- Added an idling timer to `game cards` to track how long each game has been idling
  - Removed the pulsing border animation from `game cards`
- Added stricter checks of Steam client status
  - The Steam client must be running to select an account on the `account selection` screen
  - If the Steam client closes while using SGI, the following will occur
    - All idling games will be stopped
    - `card farming` and `achievement unlocker` features will be stopped
    - A modal will appear asking you to start the Steam client to continue
- The `account selection` screen will now show which account you are currently signed in to Steam client with
  - You will see an account mismatch warning if you select a different account then you are currently signed in to the Steam client with. You can proceed to use SGI with an account mismatch, but most features will not work
  - If you switch accounts in the Steam client you will need to press `refresh` to update the `account selection` user list