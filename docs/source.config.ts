import { defineCollections, defineConfig, defineDocs, frontmatterSchema, metaSchema } from 'fumadocs-mdx/config'
import { z } from 'zod'

// You can customise Zod schemas for frontmatter and `meta.json` here
// see https://fumadocs.dev/docs/mdx/collections
export const docs = defineDocs({
  dir: 'content/docs',
  docs: {
    schema: frontmatterSchema,
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
  dir: 'content/changelog',
  schema: frontmatterSchema.extend({
    date: z.iso.date().or(z.date()),
    tags: z.array(z.string()).optional(),
  }),
  postprocess: {
    includeProcessedMarkdown: true,
  },
  async: true,
})
