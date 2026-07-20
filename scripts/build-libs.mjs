// Publishes `libs/SteamUtility` for whichever platform this script is running on - win-x64
// (full CLI + agent build) on Windows, linux-x64 (daemon-only build, per the csproj's RID
// conditions) everywhere else. Keeps `pnpm build:libs` a single cross-platform entry point instead
// of two separate scripts the two dev flows would have to remember to call correctly.
import { execSync } from 'node:child_process'

const rid = process.platform === 'win32' ? 'win-x64' : 'linux-x64'

execSync(
  `dotnet publish ./libs/SteamUtility/SteamUtility.csproj -c Release -r ${rid} --self-contained true -p:PublishSingleFile=true -p:PublishTrimmed=true -p:DebugType=none -o ./src-tauri/libs/`,
  { stdio: 'inherit' },
)
