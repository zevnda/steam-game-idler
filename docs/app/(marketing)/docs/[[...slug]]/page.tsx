import { createRelativeLink } from 'fumadocs-ui/mdx'
import { DocsBody, DocsPage } from 'fumadocs-ui/page'
import { notFound } from 'next/navigation'
import AdOverlay from '@/app/(marketing)/(home)/_components/AdOverlay'
import AdOverlayTwo from '@/app/(marketing)/(home)/_components/AdOverlayTwo'
import AdScripts from '@/app/(marketing)/(home)/_components/AdScripts'
import { source } from '@/lib/source'
import { getMDXComponents } from '@/mdx-components'

interface PageProps {
  params: {
    slug: string[]
  }
}

export default async function Page(props: PageProps) {
  const params = await props.params
  const page = source.getPage(params.slug)
  if (!page) notFound()

  const MDX = page.data.body

  return (
    <DocsPage toc={page.data.toc} full={page.data.full} tableOfContent={{ style: 'clerk' }}>
      <AdScripts />
      <DocsBody>
        <AdOverlayTwo />
        {/* eslint-disable-next-line */}
        <MDX
          components={getMDXComponents({
            // this allows you to link to other pages with relative file paths
            a: createRelativeLink(source, page),
          })}
        />
        <AdOverlay slot='3005445709' />
      </DocsBody>
    </DocsPage>
  )
}

export async function generateStaticParams() {
  return source.generateParams()
}

export async function generateMetadata(props: PageProps) {
  const params = await props.params
  const page = source.getPage(params.slug)
  if (!page) notFound()
  const slugPath = (params.slug ?? []).join('/')

  return {
    title: page.data.title,
    description: page.data.description,
    keywords: page.data.keywords,
    openGraph: {
      url: `https://steamgameidler.com/docs/${slugPath}`,
      title: page.data.title,
      description: page.data.description,
      images: 'https://steamgameidler.com/og-image.png',
      type: 'article',
    },
    twitter: {
      title: page.data.title,
      description: page.data.description,
      image: 'https://steamgameidler.com/og-image.png',
    },
    alternates: {
      canonical: `/docs/${slugPath}`,
    },
  }
}
