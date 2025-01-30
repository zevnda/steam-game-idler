[![Downloads](https://img.shields.io/github/downloads/zevnda/steam-game-idler/1.6.7/total?style=for-the-badge&logo=github&color=137eb5)](https://github.com/zevnda/steam-game-idler/releases/download/1.6.7/Steam.Game.Idler_1.6.7_x64_en-US.msi)

## Changelog
- Reworked the way `custom lists` are handled (`favorites`, `card farming`, `achievement unlocker`, `auto idle`)
  - Custom lists can now be viewed and managed via the `sidebar`. Each list has its own `sidebar` icon
  - To manage a list, click the appropriate icon in the `sidebar` and click `edit list`. Add and remove games to the list by clicking them in the `edit list modal`
- Custom lists now support drag and drop reordering
  - The order of games in the `card farming` and `achievement unlocker` lists determines which game is first in the queue for those features
  - To reorder games in a custom list:
    1. Hover over a game card
    2. Click and hold the card
    3. Drag the card to the desired position
    4. Release the mouse button to drop the card in its new location
  - #56 by @Jesewe
- Reworked the way `card farming` and `achievement unlocker` screens appear to the user
  - Both screens will now be displayed within their respective list screen
  - This changes a couple of things:
    - Users will now be able to continue using SGI for other tasks while either or both of the features is running
    - Allows for the `card farming` and `achievement unlocker` features to be used at the same time
      - Conflicts might come from having the same game in both of these lists and running both features at the same time. This will probably be an unsolvable side effect, and it is up to the user to avoid doing this. If you do have any issues, please open a new issue
  - #57 by @AtifDesign
- Moved the `start card farming` and `start achievement unlocker` buttons to their respective list screen
- The `card farming` and `achievement unlocker` icons in the `sidebar` will now pulse to indicate that that feature is running
- Changed the labels of the options in `settings` for better clarity about what they do
- Improved the rendering of games in the `edit list` modal
  - Significantly increases loading times when the user has a large Steam library
- Improved the rendering of achievements on the `achievement manager` screen
  - Significantly increases loading times when the game has a lot of achievements
- Improved the method for setting and restoring `windowState` between launches
- Improved checks for games with no achievements in `achievement unlocker`
- Fixed an issue with `card farming` where games with drops weren't being fetched if the user had a `steamparental` cookie saved
  - #66 by @Orangecoat42
- Added a `clear data` button to `settings`
  - Clears practically all data that SGI stores and logs the current user out
  - Useful for debugging issues
- Removed the `minimize to tray` option in `settings > general`
  - SGI will now always be minimized to the system tray when clicking `x` in the `titlebar`
- Removed the option to filter the `games list` by `custom lists` in the `dropdown sort menu`
- Removed the option to add/remove games to/from `custom lists` in the `game card menu`
- Switched the `header` logo to a black/white variant
- Other miscellaneous UI improvements