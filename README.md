<div align="center">
  <img src="./assets/logo.png" width='80' alt='Click for larger image' />
  <h1 align="center">Steam Game Idler - CLI + WebUI</h1>
  <p align="center">Idle any game in your Steam library on windows, linux and macos.</p>
<p align="center">
  <img src="https://img.shields.io/github/downloads/probablyraging/steam-game-idler/total?style=for-the-badge&logo=github&color=137eb5" alt="Downloads" />
  <img src="https://img.shields.io/github/issues/probablyraging/steam-game-idler?style=for-the-badge&logo=github&color=137eb5" alt="Issues" />
  <img src="https://img.shields.io/github/issues-pr/probablyraging/steam-game-idler?style=for-the-badge&logo=github&color=137eb5" alt="Issues" />
  <img src="https://img.shields.io/github/contributors/probablyraging/steam-game-idler?style=for-the-badge&logo=github&color=137eb5" alt="GitHub Contributors" />
</p>
</div>
<div align="center" style="margin-top: 10px;">
  <img src="./assets/example1.png" width='400' alt='Click for larger image' />
  <img src="./assets/example2.png" width='400' alt='Click for larger image' />
</div>

# Prerequisites
- Node.js v18.0.0+
- npm 10.5.1+
- Should run on most versions of linux, macos and windows

# Build it yourself
1. **Clone**: `git clone -b cli-webui https://github.com/ProbablyRaging/steam-game-idler.git`
2. **Install deps for CLI**: `cd ./steam-game-idler` & `npm install`
3. **Install deps for web server**: `cd ./steam-game-idler/src` & `npm install`
4. **Run the CLI**: `node ./index.js`
5. Follow the steps in the terminal to choose between either running the CLI or web UI

# Run on Android devices with Termux
1. **Download Termux**: [termux-v0.118.1-arm64-v8a,apk](https://github.com/termux/termux-app/releases/tag/v0.118.1)
2. **Install Nodejs and Git**: `pkg update` & `pkg install nodejs` & `pkg install git`
3. **Build SGI**: Follow the steps in [Build it yourself](https://github.com/zevnda/steam-game-idler/edit/cli-webui/README.md#build-it-yourself)

*To prevent the SGI process from being put to sleep by Android's low-power mode, you will need to enable wake lock in Termux*

# Using Steam Guard
If your account is protected by Steam Guard, a 5-digit Steam Guard code will be required
### Web UI
- On the login page of the Web UI when logging in
- In the command/terminal window when attempting to idle games *(if you don't see the `started idling [game name]` message after entering your code you will need to stop and start idling your game(s) again)*
### CLI
- In the command/terminal window when logging in

# Updates
SGI will check for updates at runtime, if one is available you will be notified. When an update is available
1. **Pull updates and install deps**: `git pull` & `npm install`
2. **Delete outdated config**: `rm -r ./config.json`
3. **Rebuild web server**: `node ./index.js --rebuild`

# License
All versions of SGI are licensed under the **[GPL-3.0 License](./LICENSE)**
