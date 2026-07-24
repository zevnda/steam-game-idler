'use client'

import type { ComparisonFeatureRow } from '@/app/(marketing)/alternatives/_data/competitors'
import { useRef } from 'react'
import { FaCheck, FaXmark } from 'react-icons/fa6'
import { motion, useInView } from 'motion/react'
import Link from 'next/link'
import { COMPETITORS } from '@/app/(marketing)/alternatives/_data/competitors'
import { FadeIn } from '@/app/lib/animations'
import { ease } from '@/app/lib/motion'

type SupportValue = boolean | string

interface ComparisonRow {
  feature: string
  sgi: SupportValue
  asf: SupportValue
  sam: SupportValue
  im: SupportValue
}

function flattenFeatures(slug: string) {
  const map = new Map<string, ComparisonFeatureRow>()
  for (const category of COMPETITORS[slug].comparisonData) {
    for (const feature of category.features) {
      map.set(feature.name, feature)
    }
  }
  return map
}

// Derived from the same COMPETITORS data that backs each /alternatives/[slug] page, so this table
// can't silently drift from the detailed per-competitor comparisons. Only features present on all
// three competitors' tables are included here - the rest is a small manually maintained list below
// for concepts (GUI polish, setup friction, project health) that aren't modeled as per-feature rows.
const asfFeatures = flattenFeatures('archisteamfarm')
const imFeatures = flattenFeatures('idle-master')
const samFeatures = flattenFeatures('steam-achievement-manager')

const sharedFeatureRows: ComparisonRow[] = Array.from(asfFeatures.values())
  // Technical-category rows (Setup Complexity, Resource Usage, etc.) share names across all three
  // competitors too, but every tool's value there is a descriptive string, not a boolean - keep
  // only genuinely boolean SGI-supported features so those don't collapse into a false "not
  // supported" row for Steam Game Idler itself.
  .filter(
    feature =>
      feature.steamGameIdler === true &&
      imFeatures.has(feature.name) &&
      samFeatures.has(feature.name),
  )
  .map(feature => ({
    feature: feature.name,
    sgi: feature.steamGameIdler,
    asf: feature.alt,
    im: imFeatures.get(feature.name)!.alt,
    sam: samFeatures.get(feature.name)!.alt,
  }))

const rows: ComparisonRow[] = [
  ...sharedFeatureRows,
  { feature: 'Modern GUI', sgi: true, asf: false, sam: false, im: false },
  { feature: 'Easy Setup', sgi: true, asf: false, sam: true, im: true },
  { feature: 'Public Source Code', sgi: true, asf: true, sam: true, im: true },
  { feature: 'Active Development', sgi: true, asf: true, sam: false, im: false },
]

const tools = [
  { short: 'SGI', full: 'Steam Game Idler', highlight: true, href: null },
  { short: 'ASF', full: 'ArchiSteamFarm', highlight: false, href: '/alternatives/archisteamfarm' },
  {
    short: 'SAM',
    full: 'Achievement Manager',
    highlight: false,
    href: '/alternatives/steam-achievement-manager',
  },
  { short: 'IM', full: 'Idle Master', highlight: false, href: '/alternatives/idle-master' },
]

// Mirrors AlternativeComparisonTable's per-competitor header glow + persistent column tint, using
// the site's general accent blue rather than a competitor-specific hue since this table isn't
// pitted against one single tool.
const sgiHeaderGlowGradient = 'linear-gradient(180deg, #0c4a6e 0%, #1e3a8a 100%)'
const sgiHeaderGlowShadow = '0 0 24px 6px rgba(0, 163, 255, 0.25)'
const sgiHeaderGlowTextColor = '#7dd3fc'
const sgiRowTintGradient = 'linear-gradient(180deg, rgba(0,163,255,0.12), rgba(0,163,255,0.04))'

// Mirrors AlternativeComparisonTable's ComparisonValue: booleans render as a check/X icon, a
// string (e.g. ASF's "Plugin required") renders as its own text instead of collapsing to a plain
// X, so that caveat isn't lost on the condensed home table. Sized down from the detailed
// /alternatives page's text-sm to fit this table's much narrower 5-column layout.
function ComparisonValue({ value, accent }: { value: SupportValue; accent?: string }) {
  if (typeof value === 'boolean') {
    if (!value) {
      return <FaXmark size={16} className='text-white/15' aria-label='Not supported' />
    }
    return (
      <FaCheck
        size={16}
        style={accent ? { color: accent } : undefined}
        className={accent ? undefined : 'text-emerald-400'}
        aria-label='Supported'
      />
    )
  }
  return (
    <span
      className={`text-[11px] font-semibold leading-tight text-center ${accent ? '' : 'text-white/70'}`}
      style={accent ? { color: accent } : undefined}
    >
      {value}
    </span>
  )
}

export default function ComparisonSection() {
  const headerRef = useRef<HTMLElement>(null)
  const headerInView = useInView(headerRef, { once: true, margin: '-60px' })

  return (
    <section className='py-20 sm:py-24 lg:py-32 relative' aria-labelledby='comparison-heading'>
      <div className='container mx-auto px-4 sm:px-6 md:px-8'>
        <motion.header
          ref={headerRef}
          className='max-w-3xl mx-auto text-center mb-16 sm:mb-20'
          initial={{ opacity: 0, y: 24 }}
          animate={headerInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, ease }}
        >
          <h2
            id='comparison-heading'
            className='text-3xl sm:text-4xl md:text-5xl text-text-primary mb-6 leading-tight tracking-tight'
          >
            How we <span className='gradient-text'>compare</span>
          </h2>
          <p className='text-lg text-text-muted leading-relaxed'>
            See how SGI stacks up against the other Steam automation tools.
          </p>
        </motion.header>

        <FadeIn className='max-w-5xl mx-auto'>
          {/* Mobile layout — feature name stacked above icon row */}
          <div className='sm:hidden rounded-3xl overflow-hidden bg-[#101013] border border-white/5'>
            {/* Tool legend */}
            <div
              className='grid grid-cols-4 px-4 py-3 border-b border-white/5'
              style={{ background: 'rgba(255,255,255,0.03)' }}
            >
              {tools.map((tool, i) => (
                <div
                  key={tool.short}
                  className='text-center py-1'
                  style={i === 0 ? { background: 'rgba(0,163,255,0.08)' } : {}}
                >
                  {tool.href ? (
                    <Link
                      prefetch={false}
                      href={tool.href}
                      className='text-xs font-bold hover:opacity-70 transition-opacity duration-150'
                      style={i === 0 ? { color: sgiHeaderGlowTextColor } : undefined}
                    >
                      {tool.short}
                    </Link>
                  ) : (
                    <span
                      className='text-xs font-bold'
                      style={i === 0 ? { color: sgiHeaderGlowTextColor } : undefined}
                    >
                      {tool.short}
                    </span>
                  )}
                </div>
              ))}
            </div>

            {/* Feature rows */}
            {rows.map((row, i) => (
              <div
                key={row.feature}
                className={`px-4 py-3 border-t border-white/5 ${i % 2 === 0 ? '' : 'bg-white/2'}`}
              >
                <span className='block text-sm font-medium text-white mb-2.5'>{row.feature}</span>
                <div className='grid grid-cols-4'>
                  {tools.map((tool, j) => (
                    <div key={tool.short} className='flex justify-center items-center px-1'>
                      <ComparisonValue
                        value={row[tool.short.toLowerCase() as keyof ComparisonRow] as SupportValue}
                        accent={j === 0 ? sgiHeaderGlowTextColor : undefined}
                      />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Desktop layout — full grid table */}
          <div className='hidden sm:block rounded-3xl overflow-hidden bg-[#101013] border border-white/5'>
            {/* Header row */}
            <div
              className='grid border-b border-white/5'
              style={{
                gridTemplateColumns: '1fr repeat(4, minmax(0, 1fr))',
                background: 'rgba(255,255,255,0.03)',
              }}
            >
              <div className='px-4 py-4' />
              {tools.map(tool => {
                const inner = (
                  <>
                    <div
                      className={`text-sm font-bold leading-tight ${tool.highlight ? 'text-white' : 'text-white/40'}`}
                    >
                      {tool.full}
                    </div>
                    <div
                      className='text-xs mt-0.5 tracking-tight'
                      style={tool.highlight ? { color: sgiHeaderGlowTextColor } : undefined}
                    >
                      {tool.short}
                    </div>
                  </>
                )
                return (
                  <div
                    key={tool.short}
                    className='relative px-3 py-4 text-center border-l border-white/10'
                    style={
                      tool.highlight
                        ? { background: sgiHeaderGlowGradient, boxShadow: sgiHeaderGlowShadow }
                        : undefined
                    }
                  >
                    {tool.href ? (
                      <Link
                        prefetch={false}
                        href={tool.href}
                        className='relative z-10 block hover:opacity-70 transition-opacity duration-150'
                      >
                        {inner}
                      </Link>
                    ) : (
                      <div className='relative z-10'>{inner}</div>
                    )}
                  </div>
                )
              })}
            </div>

            {/* Feature rows */}
            {rows.map((row, i) => (
              <div
                key={row.feature}
                className={`grid border-t border-white/5 ${i % 2 === 0 ? '' : 'bg-white/2'}`}
                style={{ gridTemplateColumns: '1fr repeat(4, minmax(0, 1fr))' }}
              >
                <div className='px-4 py-3.5 flex items-center'>
                  <span className='text-sm font-medium text-white'>{row.feature}</span>
                </div>
                {tools.map((tool, j) => (
                  <div
                    key={`${row.feature}-${tool.short}`}
                    className='px-3 py-3.5 flex items-center justify-center border-l border-white/10'
                    style={j === 0 ? { background: sgiRowTintGradient } : undefined}
                  >
                    <ComparisonValue
                      value={row[tool.short.toLowerCase() as keyof ComparisonRow] as SupportValue}
                      accent={j === 0 ? sgiHeaderGlowTextColor : undefined}
                    />
                  </div>
                ))}
              </div>
            ))}
          </div>
        </FadeIn>
      </div>
    </section>
  )
}
