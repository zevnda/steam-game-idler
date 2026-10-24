import { createRelativeLink } from 'fumadocs-ui/mdx'
import { DocsBody, DocsPage } from 'fumadocs-ui/page'
import { notFound } from 'next/navigation'
import TocHead from '@/app/(marketing)/_components/TocHead'
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
    <DocsPage
      toc={page.data.toc}
      full={page.data.full}
      // the footer slot only hosts TocHead's marker, inside #nd-toc - the head itself is CSS
      tableOfContent={{ style: 'clerk', footer: <TocHead /> }}
    >
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

export async function generateMetadata(props: PageProps) {
  const params = await props.params
  const page = source.getPage(params.slug)
  if (!page) notFound()
  // The docs index has no slug, so it must be `/docs`, not `/docs/`: Vercel 308-redirects the
  // trailing-slash form, and a canonical pointing at a redirect makes Google override it.
  const docsPath = ['/docs', ...(params.slug ?? [])].join('/')
  // An explicit search title (frontmatter `seoTitle`) is already complete, so it skips the root
  // layout's "%s | Steam Game Idler" template; otherwise the nav title goes through it as before.
  const { seoTitle } = page.data
  const shareTitle = seoTitle ?? page.data.title

  return {
    title: seoTitle ? { absolute: seoTitle } : page.data.title,
    description: page.data.description,
    keywords: page.data.keywords,
    openGraph: {
      url: `https://steamgameidler.com${docsPath}`,
      title: shareTitle,
      description: page.data.description,
      images: 'https://steamgameidler.com/og-image.png',
      type: 'article',
    },
    twitter: {
      title: shareTitle,
      description: page.data.description,
      image: 'https://steamgameidler.com/og-image.png',
    },
    alternates: {
      canonical: docsPath,
    },
  }
}
