import {
  defineCollections,
  defineConfig,
  defineDocs,
  frontmatterSchema,
  metaSchema,
} from 'fumadocs-mdx/config'
import { z } from 'zod'

// You can customise Zod schemas for frontmatter and `meta.json` here
// see https://fumadocs.dev/docs/mdx/collections
export const docs = defineDocs({
  dir: 'app/(marketing)/docs/_content',
  docs: {
    schema: frontmatterSchema.extend({
      keywords: z.array(z.string()).optional(),
      // Search-results title, used as-is (no " | Steam Game Idler" template suffix) for <title>,
      // OG and Twitter. Optional: `title` alone also drives the sidebar/breadcrumb label, so this
      // lets a page target a search query ("Steam Achievement Unlocker...") without renaming its
      // nav entry. Keep it under 60 characters. See docs/[[...slug]]/page.tsx's generateMetadata.
      seoTitle: z.string().optional(),
    }),
    postprocess: {
      includeProcessedMarkdown: true,
    },
  },
  meta: {
    schema: metaSchema,
  },
})

export default defineConfig({
  mdxOptions: {
    // MDX options
  },
})

// Release notes (`changelogs/{version}.mdx`). Named `changelog`, not `blog`: the real blog is the
// `posts` collection below.
export const changelog = defineCollections({
  type: 'doc',
  dir: 'changelogs',
  schema: frontmatterSchema.extend({
    date: z.iso.date().or(z.date()),
    tags: z.array(z.string()).optional(),
  }),
  postprocess: {
    includeProcessedMarkdown: true,
  },
  async: true,
})

// Blog posts (`blog/{slug}.mdx`, served at `/blog/{slug}`). Written by the `/create-blog-post`
// skill (`.claude/skills/create-blog-post/`), which documents what each field is for - keep the
// two in sync. Not `async`: there are few posts, and the listing page needs every post's text up
// front for reading time.
export const posts = defineCollections({
  type: 'doc',
  dir: 'blog',
  schema: frontmatterSchema.extend({
    // Required: the listing card, meta description and RSS summary all use it.
    description: z.string(),
    date: z.iso.date(),
    // Set only on a substantive revision, never on a typo fix: it drives `dateModified` and the
    // sitemap's `lastmod`, and Google stops trusting dates that change without real edits.
    updated: z.iso.date().optional(),
    // Search-results title, used as-is for <title>/OG/Twitter (no template suffix). `title` stays
    // the on-page H1. Keep it under 60 characters.
    seoTitle: z.string().optional(),
    category: z.enum(['Steam News', 'Guides', 'Explainers', 'Updates']),
    tags: z.array(z.string()).default([]),
    keywords: z.array(z.string()).optional(),
    // Cover image, root-relative (`/blog/{slug}/cover.webp`) or absolute. 1200x630 so it doubles
    // as the OG image; without one the site-wide OG image is used and the card shows a gradient.
    image: z.string().optional(),
    imageAlt: z.string().optional(),
    author: z.string().default('zevnda'),
    // Drafts render in `next dev` but are left out of production builds, the RSS feed and the
    // sitemap entirely.
    draft: z.boolean().default(false),
  }),
  postprocess: {
    includeProcessedMarkdown: true,
  },
})
