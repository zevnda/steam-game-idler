#!/usr/bin/env node
// Posts a release's changelog (docs/changelogs/<version>.mdx) to the Discord server as one or more
// Components V2 panels through a webhook, posted back to back so a long changelog still reads as one
// post. Shared by release.yml's send_discord_notification job and the manual re-send in discord.yml.
//
// The parsing, markdown conversion, splitting and panel layout are a dependency-free port of the
// approved panels in the SGI Discord bot (sgi-discord-bot: modules/changelog.ts, docs-markdown.ts,
// troubleshooting.ts's mdxToMarkdown, panel-layout.ts). Keep the two in step when the look changes.
//
// Run:
//   node scripts/discord-changelog.mjs --version 6.3.0 [--ping] [--dry-run]
//   node scripts/discord-changelog.mjs --version latest --dry-run
//   node scripts/discord-changelog.mjs --version 9.9.9 --file path/to/test.mdx --dry-run
// The webhook URL comes from the DISCORD_WEBHOOK env var (not needed for --dry-run). --dry-run prints
// every panel's JSON plus its character/component counts and posts nothing.
// This is a CLI: its stdout (the --dry-run payloads, the post log) is the whole point
/* eslint-disable no-console */
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { parseArgs } from 'node:util'

const REPO = 'zevnda/steam-game-idler'
const CHANGELOG_DIR = fileURLToPath(new URL('../docs/changelogs/', import.meta.url))
const changelogPageUrl = version => `https://steamgameidler.com/changelog/${version}`
const releaseUrl = version => `https://github.com/${REPO}/releases/tag/${version}`

// The server's own :sgi: emoji. A webhook only renders a custom emoji the channel's @everyone role
// could use, so this needs "Use External Emojis" for @everyone in the release channel - without it
// Discord shows plain `:sgi:` text instead of failing the post, so it can't break a release
const TITLE_EMOJI = '<:sgi:1563578292026609745>'
const RELEASE_ROLE_ID = '1447060344056053841'
const SUBTITLE = "-# A new version of SGI just released, here's what's new, improved and fixed"
const FOOTER = '-# Updates are installed automatically. Portable builds need to be downloaded again'

// Discord allows 4000 characters across all text displays and 40 components (counted recursively,
// buttons included) per message. Sections are split well under the text limit so any one of them
// fits in a panel of its own, and a chunk's component count is capped so one chunk plus a panel's
// header or footer always stays under 40 too
const MAX_PANEL_TEXT = 4000
const MAX_PANEL_COMPONENTS = 40
const MAX_SECTION_TEXT = 3500
const MAX_UNIT_COMPONENTS = 30

const IS_COMPONENTS_V2 = 1 << 15
const ComponentType = {
  ActionRow: 1,
  Button: 2,
  TextDisplay: 10,
  MediaGallery: 12,
  Separator: 14,
  Container: 17,
}
const ButtonStyle = { Link: 5 }
const SeparatorSpacing = { Small: 1, Large: 2 }

// Webhooks allow roughly 5 requests per 2 seconds, so panels go out one at a time with a short gap
const PANEL_GAP_MS = 1000
const REQUEST_TIMEOUT_MS = 15_000
const MAX_ATTEMPTS = 5
const BASE_RETRY_DELAY_MS = 1000
const MAX_RETRY_DELAY_MS = 30_000

class NotifyError extends Error {}

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms))

// ---------------------------------------------------------------------------------------------
// MDX -> markdown (port of troubleshooting.ts's mdxToMarkdown)
// ---------------------------------------------------------------------------------------------

// Text shown on the docs' <MockButton> chips (docs/app/(marketing)/docs/_components/MockButton.tsx).
// Types with a `content` prop show that instead, and unknown types fall back to their title-cased name
const MOCK_BUTTON_LABELS = {
  'lock': 'Lock',
  'unlock': 'Unlock',
  'lock-all': 'Lock All',
  'unlock-all': 'Unlock All',
  'remove-all': 'Remove listings',
  'all-games': 'All Games',
  'card-farming': 'Card Farming',
  'card-farming-action': 'Start',
  'achievement-unlocker': 'Achievement Unlocker',
  'achievement-unlocker-action': 'Start',
  'achievement-manager': 'Achievement Manager',
  'list-card': 'List card',
  'list-selected': 'Sell Selected',
  'list-all': 'Sell All',
  'save': 'Save',
  'save-alt': 'Save',
  'save-changes': 'Save Changes',
  'context-add': 'Add',
  'context-cog': 'Settings',
  'refresh': 'Refresh',
  'your-games': 'Games',
  'inventory-manager': 'Inventory Manager',
  'idling-games': 'Idling',
  'auto-idle': 'Automatic Idler',
  'free-games': 'Free Games',
  'unlock-order': 'Unlock order',
  'grabber': 'Drag handle',
  'favorites': 'Favorites',
  'start-idle': 'Start idling',
  'steam': 'Steam',
  'start-manually': 'Start',
  'import-timings': 'Import Timings',
  'checkbox': '✓',
  'sell-dupes': 'Sell Dupes',
  'steam-sign-in': 'Steam Sign-in',
  'local-sign-in': 'Local Sign-in',
  'qr-sign-in': 'Or sign in with QR',
  'continue': 'Continue',
  'account-switcher': 'Account switcher',
  'add-account': 'Add another account',
  'blacklist': 'Blacklist',
  'sign-out': 'Sign out',
  'manage-subscription': 'Manage subscription',
  'upgrade': 'Upgrade',
  'activate': 'Activate',
  'copy': 'Copy',
  'clear': 'Clear',
  'view-log-file': 'View log file',
  'open-settings-file': 'Open settings file',
  'export-settings': 'Export settings',
  'clear-logs': 'Clear logs',
  'reset-settings': 'Reset settings',
  'clear-data': 'Clear data',
  'stop': 'Stop',
  'stop-all': 'Stop all',
  'go-pro': 'Go Pro',
  'pay-stripe': 'Stripe',
  'pay-paypal': 'PayPal',
  'manual-add': 'Add manually',
}

const CALLOUT_ICONS = {
  info: 'ℹ️',
  warn: '⚠️',
  warning: '⚠️',
  error: '🚫',
  success: '✅',
  idea: '💡',
}

const ATTRIBUTE_PATTERN = /(\w+)=(?:"([^"]*)"|'([^']*)'|\{`([^`]*)`\}|\{"([^"]*)"\}|\{'([^']*)'\})/g
const ATTRIBUTES = String.raw`(?:\s+\w+=(?:"[^"]*"|'[^']*'|\{${'`'}[^${'`'}]*${'`'}\}|\{"[^"]*"\}|\{'[^']*'\}))*`
const BLOCK_TAG_PATTERN = new RegExp(String.raw`^<([A-Z]\w*)(${ATTRIBUTES})\s*(/?)>$`)
const MOCK_BUTTON_PATTERN = new RegExp(String.raw`<MockButton(${ATTRIBUTES})\s*/>`, 'g')
const INLINE_CALLOUT_PATTERN = new RegExp(String.raw`<Callout(${ATTRIBUTES})\s*>(.*?)</Callout>`)
const FENCE_PATTERN = /^(\s*)(`{3,}|~{3,})/

function parseAttributes(source) {
  const attributes = {}
  for (const match of source.matchAll(ATTRIBUTE_PATTERN)) {
    attributes[match[1]] = match.slice(2).find(value => value !== undefined) ?? ''
  }
  return attributes
}

const indentOf = line => line.length - line.trimStart().length
const calloutIcon = type => CALLOUT_ICONS[type ?? 'info'] ?? CALLOUT_ICONS.info
const closesFence = (match, marker) =>
  match && match[2][0] === marker[0] && match[2].length >= marker.length

function mockButtonLabel(attributes) {
  if (attributes.content) return attributes.content
  const type = attributes.type ?? ''
  return (
    MOCK_BUTTON_LABELS[type] ?? type.replace(/-/g, ' ').replace(/^\w/, char => char.toUpperCase())
  )
}

// Turns docs JSX (Steps, Callout, MockButton) into plain markdown, mirroring how the docs render them.
// Each open tag is a container on a stack; its content's indentation (JSX bodies are usually
// indented) is stripped so the markdown inside isn't read as an indented code block
function mdxToMarkdown(lines) {
  const stack = [{ tag: 'root', contentIndent: null, stepCount: 0 }]
  const output = []
  let fence = null

  const innermost = () => stack[stack.length - 1]
  const calloutDepth = () => stack.filter(container => container.tag === 'Callout').length
  const emit = line => {
    const depth = calloutDepth()
    output.push(depth > 0 ? `${'> '.repeat(depth)}${line}`.trimEnd() : line)
  }
  const strip = line => {
    const container = innermost()
    if (line.trim() && container.contentIndent === null) container.contentIndent = indentOf(line)
    return line.slice(Math.min(indentOf(line), container.contentIndent ?? 0))
  }

  for (const rawLine of lines) {
    if (fence) {
      emit(strip(rawLine))
      if (closesFence(FENCE_PATTERN.exec(rawLine), fence)) fence = null
      continue
    }

    const trimmed = rawLine.trim()
    const closing = /^<\/([A-Z]\w*)>$/.exec(trimmed)
    if (closing) {
      const index = stack.map(container => container.tag).lastIndexOf(closing[1])
      if (index > 0) stack.length = index
      emit('')
      continue
    }

    const opening = BLOCK_TAG_PATTERN.exec(trimmed)
    if (opening && opening[1] !== 'MockButton') {
      strip(rawLine)
      const [, tag, attributeSource, selfClosing] = opening
      if (selfClosing) continue

      const attributes = parseAttributes(attributeSource)
      const container = { tag, contentIndent: null, stepCount: 0 }
      if (tag === 'Step') {
        const steps = [...stack].reverse().find(parent => parent.tag === 'Steps')
        container.stepNumber = steps ? ++steps.stepCount : 1
        container.stepLabelled = false
      } else if (tag === 'Callout') {
        const icon = calloutIcon(attributes.type)
        container.calloutLead = attributes.title ? `${icon} **${attributes.title}**\n` : `${icon} `
      }
      stack.push(container)
      continue
    }

    let line = strip(rawLine)
      .replace(
        MOCK_BUTTON_PATTERN,
        (_, attributeSource) => `\`${mockButtonLabel(parseAttributes(attributeSource))}\``,
      )
      // Single-line callouts, e.g. <Callout type="info">Text</Callout>
      .replace(INLINE_CALLOUT_PATTERN, (_, attributeSource, text) => {
        return `> ${calloutIcon(parseAttributes(attributeSource).type)} ${text.trim()}`
      })

    const fenceMatch = FENCE_PATTERN.exec(line)
    if (fenceMatch) fence = fenceMatch[2]

    if (line.trim()) {
      const step = [...stack].reverse().find(container => container.tag === 'Step')
      if (step && !step.stepLabelled) {
        step.stepLabelled = true
        const heading = /^#{1,6}\s+(.+?)\s*#*$/.exec(line.trim())
        line = heading ? `### ${step.stepNumber}. ${heading[1]}` : `**${step.stepNumber}.** ${line}`
      }

      // The callout's icon (and title, on a line of its own) leads its first line of text
      const callout = innermost().tag === 'Callout' ? innermost() : null
      if (callout?.calloutLead) {
        const leadLines = `${callout.calloutLead}${line}`.split('\n')
        callout.calloutLead = undefined
        leadLines.forEach(emit)
        continue
      }
    }
    emit(line)
  }

  return output
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

// ---------------------------------------------------------------------------------------------
// Markdown -> Discord markdown (port of docs-markdown.ts)
// ---------------------------------------------------------------------------------------------

// The href is either bare (balanced parentheses allowed) or wrapped in <>, the only way markdown
// allows spaces in it
const LINK_PATTERN =
  /(!?)\[((?:[^[\]\\]|\\.)*)\]\(\s*(?:<([^<>\n]+)>|((?:[^()\s<>]|\([^()\s]*\))+))(?:\s+(?:"[^"]*"|'[^']*'|\([^)]*\)))?\s*\)/g
const CODE_SPAN_PATTERN = /(`+)(.+?)\1(?!`)/g
const TABLE_DIVIDER_PATTERN = /^\s*\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)*\|?\s*$/
const HORIZONTAL_RULE_PATTERN = /^\s*([-*_])(\s*\1){2,}\s*$/

// Discord masked links break on raw parentheses and spaces in the URL
const discordSafeUrl = url => url.replace(/\(/g, '%28').replace(/\)/g, '%29').replace(/ /g, '%20')

function resolveHref(href, pageUrl) {
  try {
    return discordSafeUrl(new URL(href, pageUrl).href)
  } catch {
    return href
  }
}

// Links are wrapped in <> so Discord doesn't add a preview embed for each one
function suppressBareUrls(prose) {
  return prose.replace(/(?<![<\w])https?:\/\/[^\s<>]+/g, url => {
    // Trailing punctuation usually ends the sentence rather than the URL
    const trailing = /[.,;:!?)\]'"*_]+$/.exec(url)?.[0] ?? ''
    return `<${url.slice(0, url.length - trailing.length)}>${trailing}`
  })
}

// Rewrites links and pulls images out of the parts of a line that aren't inline code. Returns
// strings and { type: 'image' } pieces in the order they appear
function convertInline(text, pageUrl) {
  const pieces = []
  let buffer = ''

  const handleProse = prose => {
    prose = prose.replace(/<br\s*\/?>/gi, '\n').replace(/<kbd>(.*?)<\/kbd>/gi, '`$1`')
    let lastLink = 0
    for (const match of prose.matchAll(LINK_PATTERN)) {
      const [whole, bang, label, bracketedHref, bareHref] = match
      const href = bracketedHref ?? bareHref
      buffer += suppressBareUrls(prose.slice(lastLink, match.index))
      lastLink = match.index + whole.length

      const resolved = resolveHref(href, pageUrl)
      if (bang) {
        if (buffer.trim()) pieces.push(buffer)
        buffer = ''
        pieces.push({ type: 'image', url: resolved, alt: label.replace(/\\(.)/g, '$1') })
      } else if (/^https?:\/\/\S+$/.test(label.trim())) {
        // Discord refuses masked links whose text is a URL, so show the target directly
        buffer += `<${resolved}>`
      } else {
        buffer += `[${label}](<${resolved}>)`
      }
    }
    buffer += suppressBareUrls(prose.slice(lastLink))
  }

  let last = 0
  for (const match of text.matchAll(CODE_SPAN_PATTERN)) {
    handleProse(text.slice(last, match.index))
    buffer += match[0]
    last = match.index + match[0].length
  }
  handleProse(text.slice(last))

  if (buffer) pieces.push(buffer)
  return pieces
}

function splitTableRow(line) {
  return line
    .trim()
    .replace(/^\||\|$/g, '')
    .split(/(?<!\\)\|/)
    .map(cell => cell.trim().replace(/\\\|/g, '|'))
}

// Discord has no tables, so render them as an aligned code block
function renderTable(lines) {
  const rows = lines.filter(line => !TABLE_DIVIDER_PATTERN.test(line)).map(splitTableRow)
  const widths = rows[0].map((_, column) =>
    Math.max(...rows.map(row => (row[column] ?? '').length)),
  )
  const format = row => widths.map((width, column) => (row[column] ?? '').padEnd(width)).join(' | ')
  const divider = widths.map(width => '-'.repeat(width)).join('-|-')
  return ['```', format(rows[0]), divider, ...rows.slice(1).map(format), '```'].join('\n')
}

// Converts one section's markdown into text and image blocks, in order
function convertMarkdown(markdown, pageUrl) {
  const lines = markdown.split('\n')
  const blocks = []
  let text = ''
  const flushText = () => {
    const content = text.replace(/\n{3,}/g, '\n\n').trim()
    if (content) blocks.push({ type: 'text', content })
    text = ''
  }

  // Discord only renders code fences at the start of a line, so indented ones (e.g. inside a list)
  // are dedented, along with their content by the same amount
  let fence = null
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const fenceMatch = FENCE_PATTERN.exec(line)

    if (fence) {
      text += `${line.slice(Math.min(indentOf(line), fence.indent))}\n`
      if (closesFence(fenceMatch, fence.marker)) fence = null
      continue
    }
    if (fenceMatch) {
      fence = { marker: fenceMatch[2], indent: fenceMatch[1].length }
      text += `${line.trimStart()}\n`
      continue
    }

    if (line.includes('|') && TABLE_DIVIDER_PATTERN.test(lines[i + 1] ?? '')) {
      const tableLines = []
      while (i < lines.length && lines[i].includes('|')) tableLines.push(lines[i++])
      i--
      text += `${renderTable(tableLines)}\n`
      continue
    }

    // Horizontal rules don't render in Discord
    if (HORIZONTAL_RULE_PATTERN.test(line)) {
      text += '\n'
      continue
    }

    const normalized = line
      // Discord only supports three heading levels
      .replace(/^\s*#{4,6}\s+(.+?)\s*#*\s*$/, '**$1**')
      .replace(/^(\s*)[*+] (?=\S)/, '$1- ')

    for (const piece of convertInline(normalized, pageUrl)) {
      if (typeof piece === 'string') text += piece
      else {
        flushText()
        blocks.push(piece)
      }
    }
    text += '\n'
  }
  flushText()
  return blocks
}

// Splits text into chunks of at most `max` characters at line boundaries, keeping code fences
// balanced: a fence open at a chunk's end is closed there and reopened (same language) in the next
function splitText(text, max) {
  const chunks = []
  let current = ''
  // The opening fence line (with its language) and its marker, while inside a code block
  let fence = null

  const closing = () => (fence ? `\n${fence.marker}` : '')
  const push = () => {
    if (current.trim() && current.trim() !== fence?.line)
      chunks.push(current.replace(/\n+$/, '') + closing())
    current = fence ? `${fence.line}\n` : ''
  }

  // Leave room for a reopened fence and its closer, and hard split lines with no break points
  const lineLimit = Math.floor(max / 2)
  const lines = text
    .split('\n')
    .flatMap(line => line.match(new RegExp(`[\\s\\S]{1,${lineLimit}}`, 'g')) ?? [''])

  for (const line of lines) {
    if (current.length + line.length + 1 + closing().length > max) push()
    current += `${line}\n`

    const fenceMatch = FENCE_PATTERN.exec(line)
    if (!fenceMatch) continue
    if (!fence) fence = { line: line.trim(), marker: fenceMatch[2] }
    else if (closesFence(fenceMatch, fence.marker)) fence = null
  }
  push()
  return chunks
}

// ---------------------------------------------------------------------------------------------
// Changelog -> sections (port of changelog.ts's parseChangelog)
// ---------------------------------------------------------------------------------------------

// A trailing emoji, including variation selector (U+FE0F) and ZWJ (U+200D) sequences. Spelled as
// code points so no invisible characters sit in the source
const VARIATION_SELECTOR = String.fromCodePoint(0xfe0f)
const ZERO_WIDTH_JOINER = String.fromCodePoint(0x200d)
const EMOJI = String.raw`\p{Extended_Pictographic}${VARIATION_SELECTOR}?`
const TRAILING_EMOJI_PATTERN = new RegExp(
  String.raw`^(.+?)\s+(${EMOJI}(?:${ZERO_WIDTH_JOINER}${EMOJI})*)$`,
  'u',
)
const BYTE_ORDER_MARK = String.fromCodePoint(0xfeff)

// "New 🎉" reads better as "🎉 New" in a panel heading
function emojiFirst(heading) {
  const match = TRAILING_EMOJI_PATTERN.exec(heading)
  return match ? `${match[2]} ${match[1]}` : heading
}

// Splits the changelog at its `#`-`###` headings (`##` ones render as `###` like the rest). Text
// above the first heading becomes a section with no heading
function parseChangelog(version, source) {
  const lines = source
    .replace(new RegExp(`^${BYTE_ORDER_MARK}`), '')
    .replace(/\r\n/g, '\n')
    .replace(/^---\n[\s\S]*?\n---\n/, '')
    .split('\n')
    .filter(line => !/^import\s/.test(line))

  const sections = []
  let current = { heading: null, markdown: '' }
  let fence = false

  for (const line of mdxToMarkdown(lines).split('\n')) {
    if (FENCE_PATTERN.test(line)) fence = !fence
    const heading = fence ? null : /^#{1,3}\s+(.+?)\s*#*$/.exec(line)
    if (heading) {
      if (current.heading || current.markdown.trim()) sections.push(current)
      current = { heading: emojiFirst(heading[1]), markdown: '' }
    } else {
      current.markdown += `${line}\n`
    }
  }
  if (current.heading || current.markdown.trim()) sections.push(current)

  if (sections.length === 0) throw new NotifyError(`The changelog for v${version} is empty`)
  return { version, sections }
}

// ---------------------------------------------------------------------------------------------
// Sections -> panels (port of changelog.ts's buildChangelogPanels + panel-layout.ts)
// ---------------------------------------------------------------------------------------------

const textDisplay = content => ({ type: ComponentType.TextDisplay, content })
const sectionText = (heading, body) =>
  textDisplay(body ? `### ${heading}\n${body}` : `### ${heading}`)
const divider = () => ({
  type: ComponentType.Separator,
  divider: true,
  spacing: SeparatorSpacing.Large,
})
// Empty space with no line, e.g. between the footer text and its buttons
const spacer = () => ({
  type: ComponentType.Separator,
  divider: false,
  spacing: SeparatorSpacing.Small,
})
const linkButton = (label, url) => ({
  type: ComponentType.Button,
  style: ButtonStyle.Link,
  label,
  url,
})

function mediaGallery(url, alt) {
  const item = { media: { url } }
  if (alt) item.description = alt.slice(0, 1024)
  return { type: ComponentType.MediaGallery, items: [item] }
}

// Every character Discord counts toward the 4000 limit, and every component toward the 40 limit
function countText(component) {
  return (
    (component.content?.length ?? 0) +
    (component.components ?? []).reduce((sum, c) => sum + countText(c), 0)
  )
}
function countComponents(component) {
  return 1 + (component.components ?? []).reduce((sum, c) => sum + countComponents(c), 0)
}
const sumText = components => components.reduce((sum, c) => sum + countText(c), 0)
const sumComponents = components => components.reduce((sum, c) => sum + countComponents(c), 0)

// Splits a section into units: runs of components that stay together in one panel. A section only
// becomes more than one unit when it's too long for a panel on its own, and every unit after the
// first starts with "### {heading} (continued)" so the next panel still makes sense on its own
function sectionUnits(section, pageUrl) {
  const units = []
  let current = []
  let textLength = 0

  const pushUnit = () => {
    if (current.length > 0) units.push(current)
    current = []
    textLength = 0
  }
  const unitHeading = () =>
    section.heading ? `${section.heading}${units.length > 0 ? ' (continued)' : ''}` : null

  const addText = content => {
    if (
      current.length > 0 &&
      (textLength + content.length > MAX_SECTION_TEXT || current.length >= MAX_UNIT_COMPONENTS)
    ) {
      pushUnit()
    }
    // The heading shares the unit's first text display
    const heading = current.length === 0 ? unitHeading() : null
    const component = heading ? sectionText(heading, content) : textDisplay(content)
    current.push(component)
    textLength += component.content.length
  }
  const addGallery = gallery => {
    if (current.length >= MAX_UNIT_COMPONENTS) pushUnit()
    // A unit that would start with an image still gets its heading above it
    if (current.length === 0 && section.heading) addText('')
    current.push(gallery)
  }

  for (const block of convertMarkdown(section.markdown, pageUrl)) {
    if (block.type === 'text') {
      for (const chunk of splitText(block.content, MAX_SECTION_TEXT - 100)) addText(chunk)
    } else {
      addGallery(mediaGallery(block.url, block.alt))
    }
  }
  // A heading with nothing under it still shows
  if (units.length === 0 && current.length === 0 && section.heading) addText('')
  pushUnit()
  return units
}

// Builds every panel's message payload. `ping` adds the release role mention to the last panel,
// right after the changelog body and above the footer's divider, and is the only thing any panel
// is allowed to mention
function buildPanels(changelog, { ping }) {
  const { version } = changelog
  const pageUrl = changelogPageUrl(version)

  const header = [
    textDisplay(`# ${TITLE_EMOJI} Steam Game Idler v${version}`),
    textDisplay(SUBTITLE),
  ]
  const footer = [
    ...(ping ? [textDisplay(`<@&${RELEASE_ROLE_ID}>`)] : []),
    divider(),
    textDisplay(FOOTER),
    spacer(),
    {
      type: ComponentType.ActionRow,
      components: [
        linkButton('View on GitHub', releaseUrl(version)),
        linkButton('Download', 'https://steamgameidler.com/download'),
        linkButton('Full Changelog', pageUrl),
      ],
    },
  ]

  // Each panel tracks the container (1 component) plus a divider before each unit except a
  // continuation panel's first one, which starts straight with its content
  const newPanel = withHeader => ({
    withHeader,
    units: [],
    textLength: withHeader ? sumText(header) : 0,
    componentCount: 1 + (withHeader ? sumComponents(header) : 0),
  })
  const unitCost = (panel, unit) => ({
    textLength: sumText(unit),
    componentCount: sumComponents(unit) + (panel.withHeader || panel.units.length > 0 ? 1 : 0),
  })
  const fits = (panel, cost) =>
    panel.textLength + cost.textLength <= MAX_PANEL_TEXT &&
    panel.componentCount + cost.componentCount <= MAX_PANEL_COMPONENTS
  const add = (panel, unit) => {
    const cost = unitCost(panel, unit)
    panel.units.push(unit)
    panel.textLength += cost.textLength
    panel.componentCount += cost.componentCount
  }

  const panels = [newPanel(true)]
  for (const unit of changelog.sections.flatMap(section => sectionUnits(section, pageUrl))) {
    let last = panels[panels.length - 1]
    if (last.units.length > 0 && !fits(last, unitCost(last, unit))) {
      last = newPanel(false)
      panels.push(last)
    }
    add(last, unit)
  }

  // The footer, buttons and ping always share the last panel with at least one section. If they
  // don't fit, the last section moves into a new panel with them rather than leaving them alone
  const footerCost = { textLength: sumText(footer), componentCount: sumComponents(footer) }
  const last = panels[panels.length - 1]
  if (!fits(last, footerCost)) {
    if (last.units.length < 2) {
      throw new NotifyError(
        `The last section of v${version}'s changelog doesn't fit in a panel together with the footer`,
      )
    }
    const moved = last.units.pop()
    const overflow = newPanel(false)
    add(overflow, moved)
    panels.push(overflow)
  }

  return panels.map((panel, index) => {
    const isLast = index === panels.length - 1
    const components = panel.withHeader ? [...header] : []
    panel.units.forEach((unit, unitIndex) => {
      if (panel.withHeader || unitIndex > 0) components.push(divider())
      components.push(...unit)
    })
    if (isLast) components.push(...footer)

    return {
      flags: IS_COMPONENTS_V2,
      components: [{ type: ComponentType.Container, components }],
      // Mentions inside text displays notify, so every panel explicitly allows nothing except the
      // release role on the one panel that carries its ping
      allowed_mentions: isLast && ping ? { parse: [], roles: [RELEASE_ROLE_ID] } : { parse: [] },
    }
  })
}

// Checks every payload against Discord's limits before anything is posted, so a changelog is never
// left half-posted
function validatePanels(payloads) {
  return payloads.map((payload, index) => {
    const textLength = sumText(payload.components)
    const componentCount = sumComponents(payload.components)
    const problems = []
    if (textLength > MAX_PANEL_TEXT) problems.push(`${textLength}/${MAX_PANEL_TEXT} characters`)
    if (componentCount > MAX_PANEL_COMPONENTS)
      problems.push(`${componentCount}/${MAX_PANEL_COMPONENTS} components`)
    if (problems.length > 0) {
      throw new NotifyError(
        `Panel ${index + 1} of ${payloads.length} is over Discord's limits (${problems.join(', ')})`,
      )
    }
    return { textLength, componentCount }
  })
}

// ---------------------------------------------------------------------------------------------
// Sending
// ---------------------------------------------------------------------------------------------

const describeError = error =>
  error?.cause ? `${error.message} (${error.cause.message ?? error.cause})` : error.message

function retryBackoff(attempt) {
  const backoff = Math.min(MAX_RETRY_DELAY_MS, BASE_RETRY_DELAY_MS * 2 ** (attempt - 1))
  return backoff / 2 + Math.random() * (backoff / 2)
}

// How long a 429 asks us to wait, from the JSON body's retry_after or the Retry-After header (seconds)
function rateLimitDelay(response, body) {
  let seconds = Number(response.headers.get('retry-after'))
  try {
    const parsed = JSON.parse(body)
    if (typeof parsed.retry_after === 'number') seconds = parsed.retry_after
  } catch {
    // Not JSON, e.g. a Cloudflare page - fall back to the header
  }
  return Number.isFinite(seconds) && seconds > 0 ? seconds * 1000 + 250 : null
}

// Posts one panel, waiting out 429s and retrying 5xx/network failures with backoff. Any other 4xx is
// a payload problem a retry won't fix, so it fails with Discord's error body. A 5xx retry could in
// rare cases repeat a message Discord did create, which beats silently dropping a panel mid-post
async function postPanel(url, payload, label) {
  for (let attempt = 1; ; attempt++) {
    let response
    let body
    try {
      response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      })
      body = await response.text()
    } catch (error) {
      if (attempt >= MAX_ATTEMPTS)
        throw new NotifyError(`${label} failed after ${attempt} attempts: ${describeError(error)}`)
      const delay = retryBackoff(attempt)
      console.warn(
        `${label}: network error (attempt ${attempt}/${MAX_ATTEMPTS}), retrying in ${Math.round(delay)}ms: ${describeError(error)}`,
      )
      await sleep(delay)
      continue
    }

    if (response.ok) {
      // Wait out the webhook's bucket if this request emptied it
      if (response.headers.get('x-ratelimit-remaining') === '0') {
        const resetAfter = Number(response.headers.get('x-ratelimit-reset-after'))
        if (Number.isFinite(resetAfter) && resetAfter > 0) await sleep(resetAfter * 1000)
      }
      return JSON.parse(body)
    }

    const retryable = response.status === 429 || response.status >= 500
    if (!retryable || attempt >= MAX_ATTEMPTS) {
      throw new NotifyError(
        `${label}: Discord returned ${response.status} (attempt ${attempt}/${MAX_ATTEMPTS}): ${body}`,
      )
    }
    const delay =
      (response.status === 429 && rateLimitDelay(response, body)) || retryBackoff(attempt)
    console.warn(
      `${label}: Discord returned ${response.status} (attempt ${attempt}/${MAX_ATTEMPTS}), retrying in ${Math.round(delay)}ms`,
    )
    await sleep(delay)
  }
}

// Logs what kind of webhook we're posting through. A channel-settings webhook (type 1 with no
// application_id) can send Components V2, but only non-interactive ones - link buttons qualify.
// Purely informational, so a failure here never stops the post
async function describeWebhook(webhookUrl) {
  try {
    const response = await fetch(webhookUrl, { signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) })
    if (!response.ok) return console.warn(`Couldn't look up the webhook (HTTP ${response.status})`)
    const webhook = await response.json()
    const owner = webhook.application_id
      ? `owned by application ${webhook.application_id}`
      : 'not owned by an application'
    console.log(
      `Webhook "${webhook.name}" (type ${webhook.type}, ${owner}) posts to channel ${webhook.channel_id}`,
    )
  } catch (error) {
    console.warn(`Couldn't look up the webhook: ${describeError(error)}`)
  }
}

async function sendPanels(webhook, payloads) {
  const base = new URL(webhook)
  await describeWebhook(base.href)

  // wait=true returns the created message (or an error body) so panels are confirmed in order, and
  // with_components=true is required for a webhook to send components at all
  const url = new URL(base)
  url.searchParams.set('wait', 'true')
  url.searchParams.set('with_components', 'true')

  for (const [index, payload] of payloads.entries()) {
    if (index > 0) await sleep(PANEL_GAP_MS)
    const label = `Panel ${index + 1}/${payloads.length}`
    const message = await postPanel(url.href, payload, label)
    console.log(`${label} posted (message ${message.id})`)
  }
}

// ---------------------------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------------------------

async function fetchLatestVersion() {
  const headers = { Accept: 'application/vnd.github+json' }
  if (process.env.GITHUB_TOKEN) headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`
  const response = await fetch(`https://api.github.com/repos/${REPO}/releases/latest`, {
    headers,
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  })
  if (!response.ok)
    throw new NotifyError(`GitHub returned ${response.status} when looking up the latest release`)
  return (await response.json()).tag_name
}

// `file` overrides the docs/changelogs lookup, for previewing a test changelog with --dry-run
function readChangelog(version, file) {
  const path = file ?? `${CHANGELOG_DIR}${version}.mdx`
  try {
    return readFileSync(path, 'utf8')
  } catch (error) {
    if (error.code === 'ENOENT')
      throw new NotifyError(`Changelog file not found: ${file ?? `docs/changelogs/${version}.mdx`}`)
    throw error
  }
}

async function main() {
  const { values } = parseArgs({
    options: {
      'version': { type: 'string', default: 'latest' },
      'file': { type: 'string' },
      'ping': { type: 'boolean', default: false },
      'dry-run': { type: 'boolean', default: false },
    },
  })

  const requested = values.version.trim() || 'latest'
  const version = (requested === 'latest' ? await fetchLatestVersion() : requested).replace(
    /^v/,
    '',
  )
  if (!/^\d+\.\d+\.\d+$/.test(version))
    throw new NotifyError(`"${version}" isn't a version like 6.3.0`)

  const payloads = buildPanels(parseChangelog(version, readChangelog(version, values.file)), {
    ping: values.ping,
  })
  const counts = validatePanels(payloads)
  console.log(`v${version}: ${payloads.length} panel(s), role ping ${values.ping ? 'on' : 'off'}`)

  if (values['dry-run']) {
    payloads.forEach((payload, index) => {
      const { textLength, componentCount } = counts[index]
      console.log(
        `\n--- Panel ${index + 1}/${payloads.length}: ${textLength}/${MAX_PANEL_TEXT} characters, ` +
          `${componentCount}/${MAX_PANEL_COMPONENTS} components ---`,
      )
      console.log(JSON.stringify(payload, null, 2))
    })
    return
  }

  const webhook = process.env.DISCORD_WEBHOOK?.trim()
  if (!webhook) throw new NotifyError('DISCORD_WEBHOOK is not set')
  await sendPanels(webhook, payloads)
}

main().catch(error => {
  const message = error instanceof NotifyError ? error.message : (error.stack ?? String(error))
  console.error(process.env.GITHUB_ACTIONS ? `::error::${message}` : message)
  process.exitCode = 1
})
