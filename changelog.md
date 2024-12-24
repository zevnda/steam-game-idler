[![Downloads](https://img.shields.io/github/downloads/zevnda/steam-game-idler/1.6.0-beta.4/total?style=for-the-badge&logo=github&color=137eb5)](https://github.com/zevnda/steam-game-idler/releases/download/1.6.0-beta.4/Steam.Game.Idler_1.6.0.4_x64_en-US.msi)

> [!Important]
> ### This is a beta release
> Consider using the [stable version](https://github.com/zevnda/steam-game-idler/releases/latest) unless you specifically want to test new features.
> The `.msi` installer is not fully compressed, hence the large file size. This is expected for a beta release.
> This release will not receive automatic updates. If a newer beta version becomes available you will need to install it manually.

## Changelog
- Added `game settings` to the `game card menu` which allows you to set game-specific limits that SGI will follow
   - Hover over a `game card` in the `games list` and click the 3 vertical dots to show the `game card menu`, then click `game settings`
   - **Max idle time (minutes)**: Set the max amount of time (in minutes) this game should be idled for. SGI will stop idling this game when the time limit is reached
     - This only affects games that are idled by `manual idle` or `auto idle`, and does not affect games idled by `card farming` or `achievement unlocker`
   - **Max card drops**: Set the max amount of card drops you want `card farming` to farm before it stops farming that game
     - There are no set times or guarantees on card drop intervals, so even though SGI will try to stay within this limit as best as it can, it may not always be perfect
   - **Max achievement unlocks**: Set the max amount of achievements you want `achievement unlocker` to unlock for you. SGI will stop unlocking achievements for this game and remove it from the `achievement unlocker` list 
- `achievement unlocker` will now delay unlocking the first achievement for 15 seconds
- Added a `remove all` button to the page when the `drop down filter menu` is filtering games by `favorites`, `card farming`, `achievement unlocker`, and `auto idle` which will remove all games from that list
- SGI will now prevent duplicate idling games by checking if the game is already being idled
- Most error toasts will now contain a link to the [FAQ wiki](https://github.com/zevnda/steam-game-idler/wiki/faq) that references the issue and why it might be occurring