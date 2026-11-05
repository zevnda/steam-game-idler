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
import { rmSync } from 'node:fs'
import { join } from 'node:path'

const rid = process.platform === 'win32' ? 'win-x64' : 'linux-x64'

// Always publish from clean Release intermediates. An incremental trimmed publish can reuse the
// previous run's SteamUtility.deps.json even when the new code needs a framework assembly the old
// trim dropped: the .dll gets copied into src-tauri/libs, but the stale deps.json never lists it,
// so the runtime can't load it (FileNotFoundException -> the daemon's generic internal_error).
// Seen when AppInfoHttpFallback started using Parallel.ForEachAsync (System.Threading.Tasks.Parallel).
// CI never hits this - release.yml always publishes from a fresh checkout - so this keeps local dev
// builds matching what ships. Only Release is cleared; obj/project.assets.json (restore) stays.
const projectDir = join(import.meta.dirname, '..', 'libs', 'SteamUtility')
for (const dir of ['obj/Release', 'bin/Release']) {
  rmSync(join(projectDir, dir), { recursive: true, force: true })
}

execSync(
  `dotnet publish ./libs/SteamUtility/SteamUtility.csproj -c Release -r ${rid} --self-contained true -p:PublishSingleFile=false -p:PublishTrimmed=true -p:DebugType=none -o ./src-tauri/libs/`,
  { stdio: 'inherit' },
)
