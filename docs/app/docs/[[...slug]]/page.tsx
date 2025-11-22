import type { Metadata } from 'next'

import { getMDXComponents } from '../../..//mdx-components'
import { getPageImage, source } from '../../../lib/source'
import { createRelativeLink } from 'fumadocs-ui/mdx'
import { DocsBody, DocsPage } from 'fumadocs-ui/page'
import { notFound } from 'next/navigation'

export default async function Page(props: PageProps<'/docs/[[...slug]]'>) {
  const params = await props.params
  const page = source.getPage(params.slug)
  if (!page) notFound()

  const MDX = page.data.body

  return (
    <DocsPage toc={page.data.toc} full={page.data.full} tableOfContent={{ style: 'clerk' }}>
      <DocsBody>
        {/* eslint-disable-next-line */}
        <MDX
          components={getMDXComponents({
            // this allows you to link to other pages with relative file paths
            a: createRelativeLink(source, page),
          })}
        />
      </DocsBody>
    </DocsPage>
  )
}

export async function generateStaticParams() {
  return source.generateParams()
}

export async function generateMetadata(props: PageProps<'/docs/[[...slug]]'>): Promise<Metadata> {
  const params = await props.params
  const page = source.getPage(params.slug)
  if (!page) notFound()

  return {
    title: page.data.title,
    description: page.data.description,
    openGraph: {
      images: getPageImage(page).url,
    },
  }
}
