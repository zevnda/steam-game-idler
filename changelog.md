[![Downloads](https://img.shields.io/github/downloads/zevnda/steam-game-idler/1.6.0/total?style=for-the-badge&logo=github&color=137eb5)](https://github.com/zevnda/steam-game-idler/releases/download/1.6.0/Steam.Game.Idler_1.6.0_x64_en-US.msi)

### Merry Christmas to anyone who is celebrating 🎄🎅🎁

## Changelog
- Major refactor of all components
- Some backend improvements to speed things up
- New login screen and login method for getting account information
  - If you have multiple accounts saved on the Steam desktop app, the login screen will now display each account for you to choose from
  - Logging in no longer requires Steam to be running
  - Logging in no longer adds a `Spacewars` game to your recently played games
- Added `game settings` to the `game card menu` which allows you to set game-specific limits that SGI will follow. [Read more here](https://github.com/zevnda/steam-game-idler/wiki/Settings#game-settings)
- The `achievement unlocker` will now delay unlocking the first achievement for 15 seconds
- Added a `remove all` button to the page when the filtering games by `favorites`, `card farming`, `achievement unlocker`, and `auto idle`
- SGI will now prevent duplicate idling games by checking if the game is already being idled
- Most error toasts will now contain a link to the [FAQ wiki](https://github.com/zevnda/steam-game-idler/wiki/faq) that references the issue
- The `achievements` and `statistics` pages no longer lag/freeze while scrolling when there are a lot of achievements or statistics to display
- The search bar for the `games list` is now hidden when not viewing the `games list`
- The search bar for the `achievements list` has moved to the `title bar`
- Replaced the `automate` button with individual buttons for `card farming` and `achievement unlocker`
- Ensure the current SGI user and current Steam user match in certain situations to prevent errors and confusion
- Now shows details about the account used for `card farming` in `settings > card farming` when credentials are validated
- Added a `Reset all` button to the `achievements > statistics` tab
- Ensure data returned from some http requests is using `?l=english`
- Other miscellaneous UI styling
