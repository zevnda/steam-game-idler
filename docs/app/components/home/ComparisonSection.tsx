'use client'

import { useRef } from 'react'
import { FiCheck, FiX } from 'react-icons/fi'
import { ease } from '@docs/lib/motion'
import { motion, useInView } from 'motion/react'

const rows = [
  { feature: 'Modern GUI', sgi: true, asf: false, sam: true, im: true },
  { feature: 'Trading card farming', sgi: true, asf: true, sam: false, im: true },
  { feature: 'Achievement management', sgi: true, asf: false, sam: true, im: false },
  { feature: 'Automated achievement unlocker', sgi: true, asf: false, sam: false, im: false },
  { feature: 'Inventory & marketplace', sgi: true, asf: false, sam: false, im: false },
  { feature: 'Open source', sgi: true, asf: true, sam: true, im: false },
  { feature: 'Minor configuration', sgi: true, asf: false, sam: true, im: true },
  { feature: 'Active development', sgi: true, asf: true, sam: false, im: false },
]

const tools = [
  { short: 'SGI', full: 'Steam Game Idler', highlight: true },
  { short: 'ASF', full: 'ArchiSteamFarm', highlight: false },
  { short: 'SAM', full: 'Achievement Manager', highlight: false },
  { short: 'IM', full: 'Idle Master', highlight: false },
]

export default function ComparisonSection() {
  const headerRef = useRef<HTMLElement>(null)
  const headerInView = useInView(headerRef, { once: true, margin: '-60px' })

  const tableRef = useRef<HTMLDivElement>(null)
  const tableInView = useInView(tableRef, { once: true, margin: '-60px' })

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
            className='text-3xl sm:text-4xl md:text-5xl font-bold text-text-primary mb-6 leading-tight tracking-tight'
          >
            How we <span className='gradient-text'>compare</span>
          </h2>
          <p className='text-lg text-text-muted leading-relaxed'>
            See how SGI stacks up against the other Steam automation tools.
          </p>
        </motion.header>

        <motion.div
          ref={tableRef}
          className='max-w-5xl mx-auto'
          initial={{ opacity: 0, y: 32 }}
          animate={tableInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, ease }}
        >
          <div
            className='rounded-xl overflow-hidden'
            style={{ border: '1px solid var(--color-border)' }}
          >
            {/* Header row */}
            <div
              className='grid'
              style={{
                gridTemplateColumns: '1fr repeat(4, minmax(0, 1fr))',
                borderBottom: '1px solid var(--color-border)',
                background: 'rgba(255,255,255,0.02)',
              }}
            >
              <div className='px-4 py-4' />
              {tools.map(tool => (
                <div
                  key={tool.short}
                  className='px-3 py-4 text-center'
                  style={
                    tool.highlight
                      ? {
                          background: 'rgba(255,255,255,0.05)',
                          borderBottom: '2px solid rgba(255,255,255,0.2)',
                        }
                      : {}
                  }
                >
                  <div
                    className={`text-sm font-bold tracking-tight ${tool.highlight ? 'text-text-primary' : 'text-text-muted'}`}
                  >
                    {tool.short}
                  </div>
                  <div className='text-xs text-text-muted mt-0.5 hidden sm:block leading-tight'>
                    {tool.full}
                  </div>
                </div>
              ))}
            </div>

            {/* Feature rows */}
            {rows.map((row, i) => (
              <motion.div
                key={`${row.feature}-wrapper`}
                className='grid'
                style={{
                  gridTemplateColumns: '1fr repeat(4, minmax(0, 1fr))',
                  borderBottom: i < rows.length - 1 ? '1px solid var(--color-border)' : undefined,
                  background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)',
                }}
                initial={{ opacity: 0 }}
                animate={tableInView ? { opacity: 1 } : {}}
                transition={{ duration: 0.4, delay: 0.2 + i * 0.05, ease }}
              >
                <div className='px-4 py-3.5 flex items-center'>
                  <span className='text-text-muted'>{row.feature}</span>
                </div>
                {tools.map((tool, j) => {
                  const has = row[tool.short.toLowerCase() as keyof typeof row] as boolean
                  return (
                    <div
                      key={`${row.feature}-${tool.short}`}
                      className='px-3 py-3.5 flex items-center justify-center'
                      style={j === 0 ? { background: 'rgba(255,255,255,0.03)' } : {}}
                    >
                      {has ? (
                        <FiCheck
                          className={`w-4 h-4 ${j === 0 ? 'text-emerald-400' : 'text-emerald-600'}`}
                          aria-label='Supported'
                        />
                      ) : (
                        <FiX className='w-4 h-4 text-text-muted/30' aria-label='Not supported' />
                      )}
                    </div>
                  )
                })}
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  )
}
