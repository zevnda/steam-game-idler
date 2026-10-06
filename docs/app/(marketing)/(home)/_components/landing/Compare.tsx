'use client'

import type { ComparisonFeatureRow } from '@/app/(marketing)/alternatives/_data/competitors'
import { useState } from 'react'
import { TbCheck, TbMinus } from 'react-icons/tb'
import SectionHeading from './SectionHeading'
import Image from 'next/image'
import Link from 'next/link'
import { COMPETITORS } from '@/app/(marketing)/alternatives/_data/competitors'
import { FadeIn } from '@/app/lib/animations'

type Value = boolean | string
type ToolKey = 'asf' | 'sam' | 'im'

function flatten(slug: string) {
  const map = new Map<string, ComparisonFeatureRow>()
  for (const category of COMPETITORS[slug].comparisonData)
    for (const feature of category.features) map.set(feature.name, feature)
  return map
}

// Derived from the same COMPETITORS data behind each /alternatives/[slug] page, so this table
// can't drift from the detailed comparisons. Only rows present for all three competitors, and only
// genuinely boolean SGI features (the Technical category's descriptive strings would otherwise read
// as a false "not supported" for SGI itself); a few concepts that aren't modelled per feature are
// appended by hand below.
const asf = flatten('archisteamfarm')
const im = flatten('idle-master')
const sam = flatten('steam-achievement-manager')

const ROWS: { feature: string; sgi: Value; asf: Value; sam: Value; im: Value }[] = [
  ...Array.from(asf.values())
    .filter(f => f.steamGameIdler === true && im.has(f.name) && sam.has(f.name))
    .map(f => ({
      feature: f.name,
      sgi: f.steamGameIdler,
      asf: f.alt,
      im: im.get(f.name)!.alt,
      sam: sam.get(f.name)!.alt,
    })),
  { feature: 'Modern GUI', sgi: true, asf: false, sam: false, im: false },
  { feature: 'Easy Setup', sgi: true, asf: false, sam: true, im: true },
  { feature: 'Public Source Code', sgi: true, asf: true, sam: true, im: true },
  { feature: 'Active Development', sgi: true, asf: true, sam: false, im: false },
]

const TOOLS: { key: ToolKey; name: string; href: string }[] = [
  { key: 'asf', name: 'ArchiSteamFarm', href: '/alternatives/archisteamfarm' },
  {
    key: 'sam',
    name: 'Steam Achievement Manager',
    href: '/alternatives/steam-achievement-manager',
  },
  { key: 'im', name: 'Idle Master', href: '/alternatives/idle-master' },
]

/**
 * A tool's name in the section's sub-line, linked to its full comparison page - every tool gets
 * one (same pages as the table's column headers), so no single name stands out as the only link.
 */
function ToolLink({ tool }: { tool: ToolKey }) {
  const t = TOOLS.find(x => x.key === tool)
  if (!t) return null
  return (
    <Link
      prefetch={false}
      href={t.href}
      className='text-text-primary underline underline-offset-4 decoration-white/30 hover:decoration-white'
    >
      {t.name}
    </Link>
  )
}

function Cell({ value, sgi }: { value: Value; sgi?: boolean }) {
  if (typeof value === 'string') {
    return (
      <span className='text-[11px] font-semibold text-text-muted text-center leading-tight'>
        {value}
      </span>
    )
  }
  return value ? (
    <span className={`cmp-yes ${sgi ? 'cmp-yes--sgi' : ''}`} aria-label='Supported'>
      <TbCheck />
    </span>
  ) : (
    <TbMinus className='text-white/15 w-4 h-4' aria-label='Not supported' />
  )
}

export default function Compare() {
  // phones compare SGI against one tool at a time instead of squeezing four columns
  const [focus, setFocus] = useState<ToolKey>('asf')

  return (
    <section id='compare' aria-labelledby='compare-heading' className='landing-section'>
      <div className='landing-container'>
        <SectionHeading
          id='compare-heading'
          eyebrow='Compare'
          title={
            <>
              Everything the others do. <span className='gradient-text'>In one app.</span>
            </>
          }
          sub={
            <>
              Looking for an alternative to <ToolLink tool='im' />, <ToolLink tool='asf' /> or{' '}
              <ToolLink tool='sam' />? Here’s how SGI compares, feature by feature.
            </>
          }
        />

        <FadeIn className='mt-14 max-w-5xl mx-auto'>
          <div
            className='md:hidden flex gap-1 p-1 rounded-full bg-white/5 border border-white/8 mb-4'
            role='tablist'
          >
            {TOOLS.map(t => (
              <button
                key={t.key}
                type='button'
                role='tab'
                aria-selected={focus === t.key}
                onClick={() => setFocus(t.key)}
                className={`flex-1 rounded-full py-2 text-xs font-semibold transition-colors ${
                  focus === t.key ? 'bg-white text-black' : 'text-text-muted'
                }`}
              >
                {t.key.toUpperCase()}
              </button>
            ))}
          </div>

          <div className='cmp'>
            <div className='cmp__row cmp__row--head'>
              <div />
              <div className='cmp__sgi-head'>
                <Image src='/logo.png' alt='' width={20} height={20} />
                <span>Steam Game Idler</span>
              </div>
              {TOOLS.map(t => (
                <Link
                  key={t.key}
                  prefetch={false}
                  href={t.href}
                  className='cmp__tool-head'
                  data-off={focus !== t.key || undefined}
                >
                  <span>{t.name}</span>
                </Link>
              ))}
            </div>
            {ROWS.map(r => (
              <div key={r.feature} className='cmp__row'>
                <div className='cmp__feature'>{r.feature}</div>
                <div className='cmp__sgi'>
                  <Cell value={r.sgi} sgi />
                </div>
                {TOOLS.map(t => (
                  <div key={t.key} className='cmp__cell' data-off={focus !== t.key || undefined}>
                    <Cell value={r[t.key]} />
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
