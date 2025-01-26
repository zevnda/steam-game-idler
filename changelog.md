[![Downloads](https://img.shields.io/github/downloads/zevnda/steam-game-idler/1.7.0-beta.1/total?style=for-the-badge&logo=github&color=137eb5)](https://github.com/zevnda/steam-game-idler/releases/download/1.7.0-beta.1/Steam.Game.Idler_1.7.0.1_x64_en-US.msi)

> [!Important]
> ### This is a beta release
> Consider using the [stable version](https://github.com/zevnda/steam-game-idler/releases/latest) unless you specifically want to test new features.
> The `.msi` installer is not fully compressed, hence the large file size. This is expected for a beta release.
> This release will not receive automatic updates. If a newer beta version becomes available you will need to install it manually.

## Changelog
- Reworked the way `custom lists` are handled (`favorites`, `card farming`, `achievement unlocker`, `auto idle`)
  - Custom lists can now be viewed and managed via the `sidebar`. Each list has its own `sidebar` icon
  - To manage a list, click the appropriate icon in the `sidebar` and click `edit list`. Add and remove games to the list by clicking them in the `edit list modal`
- Moved the `start card farming` and `start achievement unlocker` buttons to their respective list screen
- Reworked the way `card farming` and `achievement unlocker` screens appear to the user
  - Both screens will now be displayed within their respective list screen
  - This changes a couple of things:
    - Users will now be able to continue using SGI for other tasks while either or both of the features is running
    - Allows for the `card farming` and `achievement unlocker` features to be used at the same time
      - Conflicts might come from having the same game in both of these lists and running both features at the same time. This will probably be an unsolvable side effect, and it is up to the user to avoid doing this. If you do have any issues, please open a new issue
  - #57 by @AtifDesign
- Added an idling indicator to `game cards` of currently idling games
  - A pulsing border will now be visible around the `game card` of games that are currently being idled
  - #60 by @GlennDoesGit
- Removed the option to filter the `games list` by `custom lists` in the `dropdown sort menu`
- Removed the option to add/remove games to/from `custom lists` in the `game card menu`
- Removed `minimize to tray` option in `settings > general`
  - SGI will now always be minimized to the system tray when clicking `x` in the `titlebar`
- Other miscellaneous UI improvements

## Issues
If you have any issues while using this beta version, please [open a new issue](https://github.com/zevnda/steam-game-idler/issues/new?template=issue_report.yml)