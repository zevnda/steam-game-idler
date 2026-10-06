'use client'

import { useState } from 'react'
import { FaLinux, FaSteam, FaWindows } from 'react-icons/fa6'
import { FiArrowUpRight } from 'react-icons/fi'
import { TbAward, TbCards, TbCheck, TbDownload, TbPlayerPlay } from 'react-icons/tb'
import { easeBack, easeOut, prog, useElapsed, useInViewPlay } from './art/storyboard'
import SectionHeading from './SectionHeading'
import Image from 'next/image'
import Link from 'next/link'
import { FadeIn } from '@/app/lib/animations'
import { useGlobalStore } from '@/app/lib/globalStore'

// One loop of the pipeline: each step plays in turn and a beam of light carries on to the next.
const LOOP = 11
const STEP_START = [0, 3.4, 7]
const STEP_DONE = [2.9, 6.3, 9.2]
// Where the pipeline rests once its replays run out (and under reduced motion): every step done,
// the beam full, SGI in the tray - the finished picture rather than the blank starting one.
const HOLD = 10.9

type Method = 'steam' | 'legacy'

/**
 * "Get started" as a live pipeline: download -> sign in -> automate, each step a small working
 * scene that plays in sequence while the section is on screen. The sign-in step doubles as the
 * explainer for the two sign-in methods (agent mode = "Steam Sign-in", CLI mode = "Legacy").
 */
export default function GetStarted() {
  const { ref, playing } = useInViewPlay<HTMLDivElement>()
  const t = useElapsed(playing, LOOP, { cycles: 2, hold: HOLD })
  const [method, setMethod] = useState<Method>('steam')
  const active = t <= 0 ? -1 : STEP_START.filter(s => t >= s).length - 1
  // beam progress across the three nodes (0 = first node, 1 = last)
  const beam =
    t <= 0 ? 0 : Math.min(1, prog(t, STEP_DONE[0], 0.5) * 0.5 + prog(t, STEP_DONE[1], 0.5) * 0.5)

  return (
    <section aria-labelledby='start-heading' className='landing-section'>
      <div className='landing-container'>
        <SectionHeading
          id='start-heading'
          eyebrow='Get started'
          title={
            <>
              From download to <span className='gradient-text'>automation.</span>
            </>
          }
          sub='No accounts to create and no config files to edit - three steps and SGI is working for you.'
        />

        <FadeIn className='mt-16'>
          <div ref={ref} className='pipeline'>
            <div className='pipeline__beam' aria-hidden='true'>
              <i style={{ width: `${beam * 100}%` }} />
            </div>
            <Step
              n={1}
              state={stepState(0, active, t)}
              title='Download & install'
              body='One small installer - or a portable zip on Windows; .deb, .rpm or AppImage on Linux.'
              href='/docs/get-started/install'
              visual={<DownloadScene t={t} />}
            />
            <Step
              n={2}
              state={stepState(1, active, t)}
              title='Sign in'
              body={
                method === 'steam'
                  ? 'Sign in with your Steam username and password, or scan a QR code with the Steam mobile app. Your credentials go straight to Steam - no Steam client needed.'
                  : 'Rather not type your credentials anywhere? On Windows, SGI can use the Steam client that’s already running and signed in on your PC.'
              }
              href='/docs/get-started/how-to-sign-in'
              swapKey={method}
              header={
                <div className='seg' role='tablist' aria-label='Sign-in method'>
                  {(
                    [
                      ['steam', 'Steam Sign-in'],
                      ['legacy', 'Legacy Sign-in'],
                    ] as const
                  ).map(([id, label]) => (
                    <button
                      key={id}
                      type='button'
                      role='tab'
                      aria-selected={method === id}
                      onClick={() => setMethod(id)}
                      className={`seg__btn ${method === id ? 'seg__btn--on' : ''}`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              }
              footer={
                <div className='flex items-center gap-2 text-xs text-text-muted'>
                  {method === 'steam' ? (
                    <>
                      <span className='text-emerald-300'>Recommended</span>
                      <span className='w-1 h-1 rounded-full bg-white/25' />
                      <FaWindows /> <FaLinux /> Windows & Linux
                    </>
                  ) : (
                    <>
                      <FaWindows /> Windows only
                    </>
                  )}
                </div>
              }
              visual={method === 'steam' ? <QrScene t={t} /> : <LegacyScene t={t} />}
            />
            <Step
              n={3}
              state={stepState(2, active, t)}
              title='Pick what to automate'
              body='Switch on what you want running, minimise SGI to the tray, and get on with your day.'
              href='/docs'
              visual={<AutomateScene t={t} />}
            />
          </div>
        </FadeIn>
      </div>
    </section>
  )
}

type StepStateValue = 'idle' | 'active' | 'done'

function stepState(i: number, active: number, t: number) {
  let state: StepStateValue = active === i ? 'active' : 'idle'
  if (t > 0 && t >= STEP_DONE[i]) state = 'done'
  return state
}

function Step({
  n,
  state,
  title,
  body,
  href,
  visual,
  header,
  footer,
  swapKey,
}: {
  n: number
  state: StepStateValue
  title: string
  body: string
  href: string
  visual: React.ReactNode
  header?: React.ReactNode
  footer?: React.ReactNode
  /**
   * Changes when the step's content is swapped in place (the sign-in method toggle). Keying the
   * swapped parts on it remounts them, which replays a short crossfade - otherwise the scene and
   * copy changed in a single frame and the toggle read as a glitch rather than a switch.
   */
  swapKey?: string
}) {
  const swap = swapKey ? 'swap-in' : undefined
  return (
    <div className={`pipe-step pipe-step--${state}`}>
      <div className='pipe-step__node' aria-hidden='true'>
        {state === 'done' ? <TbCheck /> : n}
      </div>
      <div className='pipe-step__card'>
        <div className='pipe-step__visual' aria-hidden='true'>
          <div key={swapKey} className={swap}>
            {visual}
          </div>
        </div>
        <div className='p-6 flex flex-col gap-3 flex-1'>
          {header}
          <h3 className='text-lg font-semibold text-text-primary'>{title}</h3>
          <p
            key={`${swapKey}-body`}
            className={`text-[15px] text-text-muted leading-relaxed ${swap ?? ''}`}
          >
            {body}
          </p>
          {footer && (
            <div key={`${swapKey}-footer`} className={swap}>
              {footer}
            </div>
          )}
          <Link
            prefetch={false}
            href={href}
            className='mt-auto pt-1 inline-flex w-fit items-center gap-1 text-sm text-text-muted hover:text-text-primary transition-colors'
          >
            Learn more <FiArrowUpRight className='w-3.5 h-3.5' />
          </Link>
        </div>
      </div>
    </div>
  )
}

// ------------------------------------------------------------------------------------ scenes

const fileName = (url: string, fallback: string) => {
  const last = decodeURIComponent(url.split('/').pop() ?? '')
  return /\.(exe|zip|deb|rpm|AppImage)$/.test(last) ? last : fallback
}

/** An installer downloads, installs, and the app's icon pops in, ready. */
function DownloadScene({ t }: { t: number }) {
  const { downloadUrl, downloadSize, linuxDownloadUrl, linuxDownloadSize, selectedOS } =
    useGlobalStore(s => s)
  // same "fall back to Windows until a real Linux release exists" rule as DownloadHero.tsx
  const linux = selectedOS === 'linux' && Boolean(linuxDownloadUrl)
  const name = linux
    ? fileName(linuxDownloadUrl, 'Linux package (.deb)')
    : fileName(downloadUrl, 'Windows installer (.exe)')
  const size = (linux ? linuxDownloadSize : downloadSize) || ''
  const dl = t > 0 ? easeOut(prog(t, 0.3, 1.9)) : 0
  const installing = t >= 2.2 && t < 2.9
  const ready = t >= 2.9
  const pop = ready ? easeBack(prog(t, 2.9, 0.45)) : 0
  return (
    <div className='scene-dl'>
      <div className='scene-dl__row'>
        <span className='scene-dl__file'>{linux ? <FaLinux /> : <FaWindows />}</span>
        <div className='flex-1 min-w-0'>
          <div className='truncate text-[13px] font-medium text-text-primary'>{name}</div>
          <div className='art-bar'>
            <i
              style={{
                width: `${(ready ? 1 : dl) * 100}%`,
                background: ready ? '#4ade80' : '#3b82f6',
              }}
            />
          </div>
          <div className='mt-1.5 flex justify-between text-[11px] text-text-muted tabular-nums'>
            <span>
              {ready
                ? 'Installed'
                : installing
                  ? 'Installing…'
                  : t > 0
                    ? `${Math.round(dl * 100)}%`
                    : 'Ready to download'}
            </span>
            <span>{size}</span>
          </div>
        </div>
      </div>
      <div
        className='scene-dl__app'
        style={{ transform: `scale(${0.6 + pop * 0.4})`, opacity: ready ? 1 : 0.25 }}
      >
        <Image src='/logo.png' alt='' width={30} height={30} />
        {ready && (
          <span className='scene-dl__badge'>
            <TbCheck />
          </span>
        )}
      </div>
      {t <= 0 && (
        <span className='scene-dl__cta'>
          <TbDownload /> Download
        </span>
      )}
    </div>
  )
}

// a deterministic 21x21 QR-ish pattern (decorative - it encodes nothing)
const QR = Array.from({ length: 21 * 21 }, (_, i) => {
  const x = i % 21
  const y = Math.floor(i / 21)
  const finder = (fx: number, fy: number) => {
    const dx = x - fx
    const dy = y - fy
    if (dx < 0 || dy < 0 || dx > 6 || dy > 6) return null
    return (
      dx === 0 || dy === 0 || dx === 6 || dy === 6 || (dx >= 2 && dx <= 4 && dy >= 2 && dy <= 4)
    )
  }
  const f = finder(0, 0) ?? finder(14, 0) ?? finder(0, 14)
  if (f !== null) return f
  return (
    Math.sin(x * 12.9898 + y * 78.233) * 43758.5453 -
      Math.floor(Math.sin(x * 12.9898 + y * 78.233) * 43758.5453) >
    0.52
  )
})
const QR_CELLS = QR.map((on, i) => ({ id: `q${i}`, on }))

/** Steam Sign-in: the phone scans the QR code, then the account appears. */
function QrScene({ t }: { t: number }) {
  const scan = t > 0 ? prog(t, 3.6, 1.6) : 0
  const signed = t >= 5.3
  const pop = signed ? easeBack(prog(t, 5.3, 0.45)) : 0
  return (
    <div className='scene-qr'>
      <div className={`scene-qr__code ${signed ? 'scene-qr__code--done' : ''}`}>
        {QR_CELLS.map(c => (
          <i key={c.id} style={{ opacity: c.on ? 1 : 0 }} />
        ))}
        {scan > 0 && scan < 1 && (
          <span className='scene-qr__line' style={{ top: `${scan * 100}%` }} />
        )}
      </div>
      <SignedIn pop={pop} visible={signed} />
    </div>
  )
}

/** Legacy Sign-in: SGI finds the running Steam client and picks up its account. */
function LegacyScene({ t }: { t: number }) {
  const found = t >= 4.9
  const pop = found ? easeBack(prog(t, 4.9, 0.45)) : 0
  const searching = t >= 3.5 && !found
  return (
    <div className='scene-qr'>
      <div className={`scene-steam ${searching ? 'scene-steam--search' : ''}`}>
        <FaSteam />
      </div>
      <div className='text-[12px] text-text-muted mt-3'>
        {found ? 'Steam client detected' : searching ? 'Looking for Steam…' : 'Steam client'}
      </div>
      <SignedIn pop={pop} visible={found} />
    </div>
  )
}

function SignedIn({ pop, visible }: { pop: number; visible: boolean }) {
  return (
    <div
      className='scene-signed'
      style={{
        opacity: visible ? 1 : 0,
        transform: `translateY(${(1 - pop) * 10}px) scale(${0.9 + pop * 0.1})`,
      }}
    >
      <span className='scene-signed__avatar'>I</span>
      <span className='text-[13px] text-text-primary font-semibold'>Idler</span>
      <TbCheck className='text-emerald-400' />
    </div>
  )
}

/** Toggles switch on one by one, then SGI settles into the tray. */
function AutomateScene({ t }: { t: number }) {
  const rows: [React.ElementType, string, number][] = [
    [TbCards, 'Card Farming', 7.3],
    [TbAward, 'Achievement Unlocker', 7.8],
    [TbPlayerPlay, 'Playtime Booster', 8.3],
  ]
  const tray = t >= 8.9
  return (
    <div className='scene-auto'>
      {rows.map(([Icon, label, at]) => {
        const on = t > 0 && t >= at
        return (
          <div key={label} className='scene-auto__row'>
            <Icon className={on ? 'text-sky-300' : 'text-text-muted'} />
            <span className='flex-1'>{label}</span>
            <span className={`switch ${on ? 'switch--on' : ''}`} />
          </div>
        )
      })}
      <div className={`scene-auto__tray ${tray ? 'scene-auto__tray--on' : ''}`}>
        <span className='scene-auto__tray-icon'>
          <Image src='/logo.png' alt='' width={14} height={14} />
        </span>
        Running in the background
      </div>
    </div>
  )
}
