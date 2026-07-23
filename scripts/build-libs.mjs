// Publishes `libs/SteamUtility` for whichever platform this script is running on - win-x64
// (full CLI + agent build) on Windows, linux-x64 (daemon-only build, per the csproj's RID
// conditions) everywhere else. Keeps `pnpm build:libs` a single cross-platform entry point instead
// of two separate scripts the two dev flows would have to remember to call correctly.
//
// PublishSingleFile=false, matching both release.yml CI jobs (#1953 for Windows, mirrored for
// Linux) - a bundled single-file exe was confirmed via VirusTotal testing to trip SecureAge's
// packer-detection heuristic on Windows; kept off here too so a locally-built dev binary matches
// what actually ships, on either platform, instead of silently diverging from CI's output shape.
import { execSync } from 'node:child_process'

const rid = process.platform === 'win32' ? 'win-x64' : 'linux-x64'

execSync(
  `dotnet publish ./libs/SteamUtility/SteamUtility.csproj -c Release -r ${rid} --self-contained true -p:PublishSingleFile=false -p:PublishTrimmed=true -p:DebugType=none -o ./src-tauri/libs/`,
  { stdio: 'inherit' },
)
