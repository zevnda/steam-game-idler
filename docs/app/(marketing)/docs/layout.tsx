import DocsNavActions from './_components/DocsNavActions'
import DocsSheetTree from './_components/DocsSheetTree'
import { toSheetGroups } from './_components/sheetTree'
import { DocsLayout } from 'fumadocs-ui/layouts/docs'
import LandingNav from '@/app/(marketing)/(home)/_components/landing/LandingNav'
import { baseOptions } from '@/lib/layout.shared'
import { source } from '@/lib/source'

interface LayoutProps {
  children: React.ReactNode
}

export default function Layout({ children }: LayoutProps) {
  const base = baseOptions()

  return (
    // The docs sit inside the marketing shell: the same LandingNav pill as every other page. (Not
    // LandingFooter - its column titles are h2s, which would change every doc's heading outline.)
    // `.docs-shell` sets --fd-banner-height to the pill's band, which Fumadocs' grid reads as its
    // first sticky row, so the sidebar and TOC stick just under the pill.
    // `docs-sidebar-cards`: the grouped-card sidebar (see globals.css) - remove it for the plain one
    <div className='docs-shell docs-sidebar-cards landing'>
      {/* opaque strip behind the fixed pill, so docs content doesn't show through around it */}
      <div className='docs-band' aria-hidden='true' />
      <DocsLayout
        {...base}
        tree={source.pageTree}
        themeSwitch={{ enabled: false }}
        // No `links`: Blog, Changelog, GitHub and Discord all live in the LandingNav pill (and its
        // phone menu sheet), so the sidebar's icon-link row only repeated them.
        nav={{
          ...base.nav,
          // The brand lives in the pill now, so the sidebar's title row names the section instead.
          title: <span className='font-semibold tracking-tight'>Documentation</span>,
          url: '/docs',
          // Replaces Fumadocs' own mobile header. On phones the pill carries the docs' search, and
          // its menu sheet - the same one every other page has - lists the docs' sections at the
          // top, so Fumadocs' separate page-tree drawer isn't used there.
          component: (
            <LandingNav
              actions={<DocsNavActions />}
              sheetLead={<DocsSheetTree groups={toSheetGroups(source.pageTree)} />}
            />
          ),
        }}
      >
        {children}
      </DocsLayout>
    </div>
  )
}
