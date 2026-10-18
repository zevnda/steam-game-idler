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

export const blog = defineCollections({
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
