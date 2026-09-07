#!/usr/bin/env node
// Builds ai-corpus/embeddings.json, the AI Assistant's RAG corpus - combines the docs site's own
// content, hand-reviewed UI walkthrough guides (see the /generate-ui-guide skill), and curated
// platform/environment facts, chunks each by markdown heading, and embeds every chunk with Voyage.
// apibase's /api/ai-chat fetches the resulting file from this repo's raw GitHub content at
// runtime (see apibase's lib/ai-corpus.ts) - this script only needs to run locally whenever docs
// content or a UI guide changes, then the result gets committed.
//
// Run: VOYAGE_API_KEY=... node scripts/build-ai-corpus.mjs
// Plain Node ESM, no extra devDependency (tsx/dotenv) - matches this repo's existing
// scripts/check-i18n.mjs convention rather than jobseekerrights' tsx-based equivalent.
import { readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const CORPUS_DIR = fileURLToPath(new URL('../ai-corpus', import.meta.url))
const OUTPUT_PATH = fileURLToPath(new URL('../ai-corpus/embeddings.json', import.meta.url))
const VOYAGE_MODEL = 'voyage-4-lite'
const EMBEDDING_DIMENSION = 1024

// The docs site's own per-page plain-text export (docs/app/llm-content.json/route.ts) - reusing
// Fumadocs' own MDX-to-text extraction rather than re-parsing MDX here. Override via env var to
// point at a local `next dev` docs server instead of the deployed site.
const DOCS_CONTENT_URL =
  process.env.DOCS_CONTENT_URL ?? 'https://steamgameidler.com/llm-content.json'

/**
 * Splits markdown into one chunk per heading (any level, "#" through "######"), plus a leading
 * chunk for anything before the first heading. Deliberately flat (not hierarchy-aware) - good
 * enough for retrieval-sized chunks, and works across both the docs site's heading levels (# page
 * title, ### sub-sections) and the UI guides' own (# title, ## sections) without needing to know
 * which convention a given source uses.
 */
function splitByHeading(markdown) {
  const sections = [{ heading: null, lines: [] }]
  for (const line of markdown.split('\n')) {
    const match = /^#{1,6}\s+(.*)/.exec(line)
    if (match) {
      sections.push({ heading: match[1].trim(), lines: [] })
    } else {
      sections[sections.length - 1].lines.push(line)
    }
  }
  return sections.filter(s => s.heading !== null || s.lines.some(l => l.trim().length > 0))
}

// An optional `<!-- url: https://... -->` first line overrides the default best-guess URL for a
// local markdown source file (ui-guides/UI docs don't have a real page of their own the way a docs
// site page does) - see ai-corpus/platform-facts.md and ai-corpus/ui-guides/*.md for examples.
function extractUrlOverride(markdown) {
  const match = /^<!--\s*url:\s*(\S+)\s*-->/.exec(markdown.trimStart())
  return match ? match[1] : null
}

function chunksFromMarkdown({ id, type, defaultUrl, pageTitle, markdown }) {
  const url = extractUrlOverride(markdown) ?? defaultUrl
  const sections = splitByHeading(markdown.replace(/^<!--.*-->\n?/, ''))

  return sections.map((section, i) => {
    const title = section.heading ? `${pageTitle} — ${section.heading}` : pageTitle
    const text = [section.heading, section.lines.join('\n')].filter(Boolean).join('\n\n').trim()
    return { id: `${id}:${i}`, type, title, url, text }
  })
}

async function loadDocsChunks() {
  const res = await fetch(DOCS_CONTENT_URL)
  if (!res.ok) throw new Error(`Failed to fetch docs content: ${res.status} ${await res.text()}`)
  const pages = await res.json()

  return pages.flatMap(page =>
    chunksFromMarkdown({
      id: `docs:${page.url}`,
      type: 'docs',
      defaultUrl: page.url,
      pageTitle: page.title,
      markdown: page.text,
    }),
  )
}

function loadLocalMarkdownChunks(type, dirOrFile) {
  const files = dirOrFile.isDirectory
    ? readdirSync(dirOrFile.path).filter(f => f.endsWith('.md'))
    : [dirOrFile.path]

  return files.flatMap(file => {
    const fullPath = dirOrFile.isDirectory ? `${dirOrFile.path}/${file}` : file
    const markdown = readFileSync(fullPath, 'utf8')
    const titleMatch = /^#\s+(.*)/m.exec(markdown)
    const pageTitle = titleMatch ? titleMatch[1].trim() : file
    const slug = file.replace(/\.md$/, '')

    return chunksFromMarkdown({
      id: `${type}:${slug}`,
      type,
      defaultUrl: 'https://steamgameidler.com/docs',
      pageTitle,
      markdown,
    })
  })
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/** Rough token estimate (chars/4) - good enough to stay comfortably under Voyage's rate limit. */
function estimateTokens(text) {
  return Math.ceil(text.length / 4)
}

// Groups chunks into batches under both a token budget and an item-count cap - a Voyage account
// with no payment method on file is throttled to 3 requests/minute and 10K tokens/minute (same
// constraint jobseekerrights' build-embeddings.ts documents), so this paces requests the same way.
function batchByTokenBudget(chunks, maxTokens, maxItems) {
  const batches = []
  let current = []
  let currentTokens = 0

  for (const chunk of chunks) {
    const tokens = estimateTokens(chunk.text)
    if (current.length > 0 && (currentTokens + tokens > maxTokens || current.length >= maxItems)) {
      batches.push(current)
      current = []
      currentTokens = 0
    }
    current.push(chunk)
    currentTokens += tokens
  }
  if (current.length > 0) batches.push(current)
  return batches
}

async function embedTexts(texts, apiKey) {
  const MAX_RETRIES = 6

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    const res = await fetch('https://api.voyageai.com/v1/embeddings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
      body: JSON.stringify({
        input: texts,
        model: VOYAGE_MODEL,
        input_type: 'document',
        output_dimension: EMBEDDING_DIMENSION,
      }),
    })

    if (res.status === 429 && attempt < MAX_RETRIES) {
      const retryAfter = Number(res.headers.get('retry-after'))
      const waitMs =
        Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter * 1000 : 30_000 * (attempt + 1)
      console.warn(`[voyage] 429 rate limited, retrying in ${waitMs / 1000}s...`)
      await sleep(waitMs)
      continue
    }

    if (!res.ok) throw new Error(`Voyage API error ${res.status}: ${await res.text()}`)

    const json = await res.json()
    return json.data.sort((a, b) => a.index - b.index).map(d => d.embedding)
  }

  throw new Error('Voyage API error: exceeded max retries after repeated 429 rate limiting')
}

async function embedAll(chunks, apiKey) {
  const MAX_BATCH_TOKENS = 9000
  const MAX_BATCH_ITEMS = 25
  const MIN_DELAY_MS = 21_000

  const batches = batchByTokenBudget(chunks, MAX_BATCH_TOKENS, MAX_BATCH_ITEMS)
  const records = []
  let processed = 0

  for (const [i, batch] of batches.entries()) {
    console.warn(
      `Embedding batch ${i + 1}/${batches.length} (${processed + 1}-${processed + batch.length} of ${chunks.length})...`,
    )
    const vectors = await embedTexts(
      batch.map(c => c.text),
      apiKey,
    )
    batch.forEach((chunk, j) => records.push({ ...chunk, embedding: vectors[j] }))
    processed += batch.length

    if (i < batches.length - 1) await sleep(MIN_DELAY_MS)
  }
  return records
}

async function main() {
  const apiKey = process.env.VOYAGE_API_KEY
  if (!apiKey) {
    console.error('VOYAGE_API_KEY is not set')
    process.exit(1)
  }

  console.warn(`Fetching docs content from ${DOCS_CONTENT_URL}...`)
  const docsChunks = await loadDocsChunks()
  const uiGuideChunks = loadLocalMarkdownChunks('ui-guide', {
    isDirectory: true,
    path: `${CORPUS_DIR}/ui-guides`,
  })
  const platformFactsChunks = loadLocalMarkdownChunks('platform-facts', {
    isDirectory: false,
    path: `${CORPUS_DIR}/platform-facts.md`,
  })

  const allChunks = [...docsChunks, ...uiGuideChunks, ...platformFactsChunks]
  console.warn(
    `Parsed ${docsChunks.length} docs chunks, ${uiGuideChunks.length} UI guide chunks, ${platformFactsChunks.length} platform-facts chunks.`,
  )

  const records = await embedAll(allChunks, apiKey)

  const output = {
    model: VOYAGE_MODEL,
    dimension: EMBEDDING_DIMENSION,
    generatedAt: new Date().toISOString(),
    chunks: records,
  }

  writeFileSync(OUTPUT_PATH, JSON.stringify(output, null, 2))
  console.warn(`Wrote ${records.length} records to ${OUTPUT_PATH}`)
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
