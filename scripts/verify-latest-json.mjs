#!/usr/bin/env node
// Guards the update path: every installed copy of the app trusts latest.json, so a bad entry can stop
// auto-updates for the whole user base. Shared by release.yml's `publish` job and
// publish-r2-manifest.yml, which is what makes merging the version-bump PR the one go-live moment for
// both update endpoints.
//
// Run:
//   node scripts/verify-latest-json.mjs built --latest latest.json --version 6.4.0 \
//     --dist windows-x86_64=dist-windows --dist linux-x86_64=dist-linux
//   node scripts/verify-latest-json.mjs remote --latest latest.json [--version 6.4.0]
//   node scripts/verify-latest-json.mjs r2-manifest --in latest.json --out latest-r2.json
//   node scripts/verify-latest-json.mjs stale-r2-files --current latest-r2.json
//
// `built` checks the local bundles before anything goes public, and `remote` downloads every url in a
// manifest and checks the bytes actually served. A platform left out of `built`'s --dist list only
// gets its manifest entry checked - release.yml's Windows-skipping dry run relies on this, since that
// entry still holds the previous release's signature.
// This is a CLI: its stdout (the check log, stale-r2-files' names) is the whole point
/* eslint-disable no-console */
import { createHash, createPublicKey, randomUUID, verify as verifySignature } from 'node:crypto'
import { appendFileSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { basename, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { parseArgs } from 'node:util'

const TAURI_CONF_PATH = fileURLToPath(new URL('../src-tauri/tauri.conf.json', import.meta.url))

// Deliberately hardcoded rather than only read from tauri.conf.json: every installed copy has these
// values baked in, so a regenerated key or changed endpoint would sign and verify cleanly against
// itself while silently breaking updates for every existing user. Never change these to make this
// check pass - see CLAUDE.md's "The updater - do not break the update path"
const PINNED_PUBKEY =
  'dW50cnVzdGVkIGNvbW1lbnQ6IG1pbmlzaWduIHB1YmxpYyBrZXk6IEQyMTE5REMyMUFGRUYyQzcKUldUSDh2NGF3cDBSMGh6UVk2a1NKNFV0d1BBcnZsRnFFdDkvTTR0KzJQN0hjOTJzSWFpMFhGaysK'
const R2_BASE_URL = 'https://cdn-steamgameidler.com/updater'
const PINNED_ENDPOINTS = [
  'https://raw.githubusercontent.com/zevnda/steam-game-idler/main/latest.json',
  `${R2_BASE_URL}/latest.json`,
]
const GITHUB_DOWNLOAD_BASE_URL = 'https://github.com/zevnda/steam-game-idler/releases/download'

// Only platforms with a self-updating build belong here: Windows portable and Linux .deb/.rpm never
// read latest.json (see platform::is_portable/can_auto_update)
const PLATFORMS = ['windows-x86_64', 'linux-x86_64']

const DOWNLOAD_TIMEOUT_MS = 5 * 60_000
const LIVE_MANIFEST_TIMEOUT_MS = 30_000
const MAX_DOWNLOAD_ATTEMPTS = 4
const RETRY_DELAY_MS = 10_000

class VerifyError extends Error {}

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms))

// Several of this repo's files carry a UTF-8 BOM, which JSON.parse rejects
const readJson = path => JSON.parse(readFileSync(path, 'utf8').replace(/^﻿/, ''))

const urlFilename = url => basename(new URL(url).pathname)

// GitHub rewrites spaces to dots in a release asset's download url, while the bundles on disk keep
// the spaces, so a url's filename and its local file only match after this
const toAssetName = filename => filename.replaceAll(' ', '.')

function assertPinnedUpdaterConfig() {
  const { pubkey, endpoints } = readJson(TAURI_CONF_PATH).plugins.updater
  if (pubkey !== PINNED_PUBKEY) {
    throw new VerifyError(
      "tauri.conf.json's updater pubkey changed - installed copies could never verify this release",
    )
  }
  if (JSON.stringify(endpoints) !== JSON.stringify(PINNED_ENDPOINTS)) {
    throw new VerifyError("tauri.conf.json's updater endpoints changed from the ones users have")
  }
}

function assertManifestShape(manifest, expectedVersion) {
  if (typeof manifest.version !== 'string' || !manifest.version) {
    throw new VerifyError('latest.json has no version')
  }
  if (expectedVersion && manifest.version !== expectedVersion) {
    throw new VerifyError(
      `latest.json says version ${manifest.version}, expected ${expectedVersion}`,
    )
  }
  if (typeof manifest.major !== 'boolean') {
    throw new VerifyError('latest.json major is not a boolean')
  }

  const found = Object.keys(manifest.platforms ?? {}).sort()
  if (JSON.stringify(found) !== JSON.stringify([...PLATFORMS].sort())) {
    throw new VerifyError(
      `latest.json platforms are [${found.join(', ')}], expected [${PLATFORMS.join(', ')}]`,
    )
  }

  for (const platform of PLATFORMS) {
    const { url, signature } = manifest.platforms[platform]
    if (typeof signature !== 'string' || !signature) {
      throw new VerifyError(`${platform} has no signature`)
    }
    const filename = urlFilename(url)
    const allowedUrls = [
      `${GITHUB_DOWNLOAD_BASE_URL}/${manifest.version}/${filename}`,
      `${R2_BASE_URL}/${filename}`,
    ]
    if (!allowedUrls.includes(url)) {
      throw new VerifyError(
        `${platform} url is not a release or R2 download for this version: ${url}`,
      )
    }
  }
}

const decodeBase64Lines = value => Buffer.from(value, 'base64').toString('utf8').split(/\r?\n/)

function loadPinnedPublicKey() {
  const blob = Buffer.from(decodeBase64Lines(PINNED_PUBKEY)[1], 'base64')
  // ASN.1 SPKI prefix for an Ed25519 key, which is how node:crypto takes raw key bytes
  const spki = Buffer.concat([
    Buffer.from('302a300506032b6570032100', 'hex'),
    blob.subarray(10, 42),
  ])
  return {
    keyId: blob.subarray(2, 10),
    key: createPublicKey({ key: spki, format: 'der', type: 'spki' }),
  }
}

// Same checks the updater's own verifier makes on a user's machine, in minisign's format: the
// signature must come from the pinned key and cover these exact bytes (prehashed with BLAKE2b for
// `ED`, which is what Tauri signs with), and the trusted comment must be covered by the global signature.
function assertSignatureMatches({ signature, data, version, filename }) {
  const { keyId, key } = loadPinnedPublicKey()
  const [, signatureLine, trustedLine, globalSignatureLine] = decodeBase64Lines(signature)
  if (!signatureLine || !trustedLine || !globalSignatureLine) {
    throw new VerifyError('signature is not a minisign signature')
  }

  const blob = Buffer.from(signatureLine, 'base64')
  const algorithm = blob.subarray(0, 2).toString()
  if (algorithm !== 'ED' && algorithm !== 'Ed') {
    throw new VerifyError(`unknown signature algorithm ${algorithm}`)
  }
  if (!blob.subarray(2, 10).equals(keyId)) {
    throw new VerifyError('signed with a different key than the one users have')
  }

  const rawSignature = blob.subarray(10, 74)
  const signed = algorithm === 'ED' ? createHash('blake2b512').update(data).digest() : data
  if (!verifySignature(null, signed, key, rawSignature)) {
    throw new VerifyError('signature does not match the file')
  }

  const comment = trustedLine.replace(/^trusted comment: /, '')
  const globalSigned = Buffer.concat([rawSignature, Buffer.from(comment)])
  if (!verifySignature(null, globalSigned, key, Buffer.from(globalSignatureLine, 'base64'))) {
    throw new VerifyError('trusted comment failed verification')
  }

  // Tauri writes these fields but they aren't a documented format, so a missing one is only logged -
  // the signature above is the real proof. A present-but-wrong one means the wrong file was shipped.
  const fields = Object.fromEntries(
    comment
      .split('\t')
      .map(field => [field.slice(0, field.indexOf(':')), field.slice(field.indexOf(':') + 1)]),
  )
  if (fields.version === undefined || fields.file === undefined) {
    console.warn(`  note: signature comment has no version/file fields: ${comment}`)
    return
  }
  if (fields.version !== version) {
    throw new VerifyError(`signed for version ${fields.version}, expected ${version}`)
  }
  if (toAssetName(fields.file) !== toAssetName(filename)) {
    throw new VerifyError(`signed for file ${fields.file}, expected ${filename}`)
  }
}

// Runs every platform even after one fails, so a single run reports everything that's wrong
async function checkPlatforms(platforms, check) {
  const failures = []
  for (const platform of platforms) {
    try {
      const detail = await check(platform)
      console.log(`OK ${platform}: ${detail}`)
    } catch (error) {
      if (!(error instanceof VerifyError)) throw error
      failures.push(`${platform}: ${error.message}`)
    }
  }
  if (failures.length > 0) throw new VerifyError(failures.join('\n'))
}

function parseDistArgs(values = []) {
  return new Map(
    values.map(value => {
      const separator = value.indexOf('=')
      if (separator < 1) throw new VerifyError(`--dist expects platform=directory, got ${value}`)
      return [value.slice(0, separator), value.slice(separator + 1)]
    }),
  )
}

async function runBuilt({ latest, version, dist }) {
  if (!latest || !version) throw new VerifyError('built needs --latest and --version')
  assertPinnedUpdaterConfig()

  const manifest = readJson(latest)
  assertManifestShape(manifest, version)

  const distDirs = parseDistArgs(dist)
  for (const platform of distDirs.keys()) {
    if (!PLATFORMS.includes(platform)) throw new VerifyError(`unknown --dist platform ${platform}`)
  }

  for (const platform of PLATFORMS) {
    const { url } = manifest.platforms[platform]
    if (!url.startsWith(`${GITHUB_DOWNLOAD_BASE_URL}/`)) {
      throw new VerifyError(`${platform} url must be the GitHub release url: ${url}`)
    }
    if (!distDirs.has(platform)) console.log(`SKIPPED ${platform}: no bundle in this run`)
  }

  await checkPlatforms([...distDirs.keys()], platform => {
    const { url, signature } = manifest.platforms[platform]
    const filename = urlFilename(url)
    const dir = distDirs.get(platform)
    const matches = readdirSync(dir).filter(name => toAssetName(name) === filename)
    if (matches.length !== 1) {
      throw new VerifyError(`expected one file for ${filename} in ${dir}, found ${matches.length}`)
    }
    const data = readFileSync(join(dir, matches[0]))
    assertSignatureMatches({ signature, data, version, filename })
    return `${matches[0]} (${data.length} bytes)`
  })
}

async function download(url) {
  // R2 binaries are cached as immutable for a year, and this runs before a release goes live. Giving
  // the check its own cache entry means it can't pin a bad file at the real url, which is what makes
  // re-running a failed release under the same version safe.
  const target = url.startsWith(`${R2_BASE_URL}/`) ? `${url}?sgi_verify=${randomUUID()}` : url

  let lastError
  for (let attempt = 1; attempt <= MAX_DOWNLOAD_ATTEMPTS; attempt++) {
    try {
      const response = await fetch(target, { signal: AbortSignal.timeout(DOWNLOAD_TIMEOUT_MS) })
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      return Buffer.from(await response.arrayBuffer())
    } catch (error) {
      lastError = error
      console.warn(
        `  download attempt ${attempt}/${MAX_DOWNLOAD_ATTEMPTS} failed: ${error.message}`,
      )
      if (attempt < MAX_DOWNLOAD_ATTEMPTS) await sleep(RETRY_DELAY_MS * attempt)
    }
  }
  throw new VerifyError(`could not download ${url}: ${lastError.message}`)
}

async function runRemote({ latest, version }) {
  if (!latest) throw new VerifyError('remote needs --latest')
  assertPinnedUpdaterConfig()

  const manifest = readJson(latest)
  assertManifestShape(manifest, version)

  await checkPlatforms(PLATFORMS, async platform => {
    const { url, signature } = manifest.platforms[platform]
    const data = await download(url)
    assertSignatureMatches({
      signature,
      data,
      version: manifest.version,
      filename: urlFilename(url),
    })
    return `${url} (${data.length} bytes)`
  })
}

// Same manifest with each url pointed at R2. Signatures carry over untouched since minisign signs the
// bytes, which are identical on both hosts. Filenames come from the existing urls rather than a
// hardcoded pattern, since Tauri's bundle naming isn't guaranteed.
function runR2Manifest({ in: input, out }) {
  if (!input || !out) throw new VerifyError('r2-manifest needs --in and --out')

  const manifest = readJson(input)
  assertManifestShape(manifest)

  const names = {}
  for (const platform of PLATFORMS) {
    const filename = urlFilename(manifest.platforms[platform].url)
    manifest.platforms[platform].url = `${R2_BASE_URL}/${filename}`
    names[platform] = filename
  }
  writeFileSync(out, JSON.stringify(manifest, null, 2))

  if (process.env.GITHUB_OUTPUT) {
    appendFileSync(
      process.env.GITHUB_OUTPUT,
      `windows_name=${names['windows-x86_64']}\nlinux_name=${names['linux-x86_64']}\n`,
    )
  }
  console.log(`Wrote ${out} for version ${manifest.version}`)
}

// Prints the binaries R2's live manifest references that the new manifest doesn't, for deletion once
// the new one is live. Read from R2 itself, not the previous git commit, so a version R2 never received
// can't leave the real previous files behind. A file both manifests use must never be listed: a re-run,
// or a merge that doesn't change the version, would otherwise delete the files users are downloading.
// Failing to read only costs a leftover file, so it never fails the workflow.
async function runStaleR2Files({ current }) {
  if (!current) throw new VerifyError('stale-r2-files needs --current')

  const keep = new Set(
    Object.values(readJson(current).platforms).map(({ url }) => urlFilename(url)),
  )

  let live
  try {
    const response = await fetch(`${R2_BASE_URL}/latest.json`, {
      signal: AbortSignal.timeout(LIVE_MANIFEST_TIMEOUT_MS),
    })
    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    live = await response.json()
  } catch (error) {
    console.error(
      `::warning::Could not read R2's live latest.json, nothing will be deleted: ${error.message}`,
    )
    return
  }

  for (const { url } of Object.values(live.platforms ?? {})) {
    const filename = urlFilename(url)
    if (!keep.has(filename) && /^[\w.-]+$/.test(filename) && filename !== 'latest.json') {
      console.log(filename)
    }
  }
}

const COMMANDS = {
  'built': runBuilt,
  'remote': runRemote,
  'r2-manifest': runR2Manifest,
  'stale-r2-files': runStaleR2Files,
}

async function main() {
  const { positionals, values } = parseArgs({
    allowPositionals: true,
    options: {
      latest: { type: 'string' },
      version: { type: 'string' },
      dist: { type: 'string', multiple: true },
      in: { type: 'string' },
      out: { type: 'string' },
      current: { type: 'string' },
    },
  })

  const command = COMMANDS[positionals[0]]
  if (!command) {
    throw new VerifyError(`Expected one of: ${Object.keys(COMMANDS).join(', ')}`)
  }
  await command(values)
}

main().catch(error => {
  if (error instanceof VerifyError) {
    for (const line of error.message.split('\n')) console.error(`::error::${line}`)
  } else {
    console.error(error)
  }
  process.exit(1)
})
