import type { Metadata } from 'next'

import React from 'react'
import { useMDXComponents } from '@docs/mdx-components'
import { generateStaticParamsFor, importPage } from 'nextra/pages'

export const generateStaticParams = generateStaticParamsFor('mdxPath')

interface PageParams {
  params: {
    mdxPath: string[]
  }
}

export async function generateMetadata(props: PageParams): Promise<Metadata> {
  // Explicitly await the params to satisfy Next.js
  const params = await Promise.resolve(props.params)
  const mdxPath = Array.isArray(params.mdxPath) ? params.mdxPath : []
  const { metadata } = await importPage(mdxPath)
  return metadata as Metadata
}

// eslint-disable-next-line react-hooks/rules-of-hooks
const mdxComponents = useMDXComponents()
const Wrapper = mdxComponents.wrapper || React.Fragment

export default async function Page(props: PageParams): Promise<React.ReactElement> {
  // Explicitly await the params to satisfy Next.js
  const params = await Promise.resolve(props.params)
  const mdxPath = Array.isArray(params.mdxPath) ? params.mdxPath : []
  const result = await importPage(mdxPath)
  const { default: MDXContent, toc, metadata } = result

  return (
    <Wrapper toc={toc} metadata={metadata}>
      <MDXContent params={params} />
    </Wrapper>
  )
}
