import { getLLMText, source } from '../../lib/source'

export const revalidate = false

// Per-page structured counterpart to llms-full.txt/route.ts's joined plain-text dump - the AI
// Assistant corpus build (scripts/build-ai-corpus.mjs, steam-game-idler root) needs each page's own
// url/title alongside its text for source citations, which the joined llms-full.txt output can't
// provide. Reuses the exact same getLLMText/source.getPages() extraction so both routes stay
// consistent with whatever Fumadocs actually renders - no separate MDX parser.
//
// Runs through Next's own server/build pipeline (like llms-full.txt), so getLLMText's
// `fumadocs-mdx:collections/server` virtual-module import resolves correctly here in a way it
// would not from a plain standalone Node script - fetch this route's output rather than trying to
// import lib/source.ts directly from build-ai-corpus.mjs.
export async function GET() {
  const pages = source.getPages()
  const entries = await Promise.all(
    pages.map(async page => ({
      url: `https://steamgameidler.com${page.url}`,
      title: page.data.title,
      text: await getLLMText(page),
    })),
  )

  return Response.json(entries)
}
