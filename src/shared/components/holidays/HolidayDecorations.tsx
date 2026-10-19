import type { HolidayKey } from '@/shared/theme/holidays'
import { useEffect, useState } from 'react'
import { cn } from '@heroui/react'
import { useActiveThemeStore } from '@/shared/stores/activeThemeStore'
import { usePlatformStore } from '@/shared/stores/platformStore'
import { isHolidayKey } from '@/shared/theme/holidays'

// Foreground props for the active holiday theme (the animated backdrop itself is the holiday's
// shader in `ThemeAmbient`). Mounted once in `DashboardShell`, above page content but below the
// titlebar/modals (`z-30` vs. their `z-50`).
//
// Must never get in the way of actually using the app:
// - The whole layer is `pointer-events-none` - every click/hover/scroll goes straight through.
// - Props stay small and hug the window edges/corners; anything that crosses the screen (the
//   sleigh, bats) is brief, infrequent and fast.
// - All motion is plain CSS (`src/styles/holidays.css`), paused while the window is unfocused,
//   and turned off - with the crossing props hidden entirely - under reduced motion or
//   `forceReducedMotion`, same as `ThemeAmbient`.
export const HolidayDecorations = () => {
  const preset = useActiveThemeStore(state => state.preset)
  const forceReducedMotion = usePlatformStore(state => state.forceReducedMotion) === true
  const [isFocused, setIsFocused] = useState(true)

  useEffect(() => {
    setIsFocused(document.hasFocus())
    const handleFocus = () => setIsFocused(true)
    const handleBlur = () => setIsFocused(false)
    window.addEventListener('focus', handleFocus)
    window.addEventListener('blur', handleBlur)
    return () => {
      window.removeEventListener('focus', handleFocus)
      window.removeEventListener('blur', handleBlur)
    }
  }, [])

  if (!isHolidayKey(preset)) return null
  const holiday = preset as HolidayKey

  return (
    <div
      aria-hidden='true'
      className={cn(
        'holiday-decorations pointer-events-none fixed inset-0 z-30 overflow-hidden',
        !isFocused && 'holiday-paused',
        forceReducedMotion && 'force-reduced-motion',
      )}
    >
      {holiday === 'christmas' && <Christmas />}
      {holiday === 'halloween' && <Halloween />}
      {holiday === 'valentines' && <Valentines />}
      {holiday === 'lunarNewYear' && <LunarNewYear />}
      {holiday === 'newYearsEve' && <LightString variant='gold' />}
      {holiday === 'easter' && <Easter />}
    </div>
  )
}

const BULB_COLORS = {
  festive: ['#ff4d4d', '#4dd17a', '#ffd34d', '#4da6ff'],
  gold: ['#ffd76a', '#fff1c2', '#f5b942', '#fff1c2'],
}

// A string of blinking bulbs hung just under the titlebar, built from repeated 96px tiles (clipped
// by the layer's overflow) so bulbs keep their shape at any window width instead of stretching.
const LightString = ({ variant }: { variant: keyof typeof BULB_COLORS }) => (
  <div className='absolute top-14 left-0 flex w-max'>
    {Array.from({ length: 40 }, (_, tile) => (
      <svg key={tile} height='24' viewBox='0 0 96 24' width='96'>
        <path d='M0 2 Q48 14 96 2' fill='none' stroke='#2b2b2b' strokeWidth='1.5' />
        {[
          [16, 5.3],
          [48, 8],
          [80, 5.3],
        ].map(([x, y], bulb) => {
          const index = tile * 3 + bulb
          return (
            <g key={x}>
              <rect fill='#555' height='3' width='4' x={x - 2} y={y} />
              <ellipse
                className='holiday-bulb'
                cx={x}
                cy={y + 8}
                fill={BULB_COLORS[variant][index % 4]}
                rx='3.5'
                ry='5'
                style={{ animationDelay: `${(index % 5) * 0.37}s` }}
              />
            </g>
          )
        })}
      </svg>
    ))}
  </div>
)

const Christmas = () => (
  <>
    <LightString variant='festive' />
    <svg
      className='holiday-sleigh absolute top-24 left-0'
      height='44'
      viewBox='0 0 160 44'
      width='160'
    >
      <g fill='#f4f1ea' opacity='0.9'>
        {/* Two reindeer pulling the sleigh, the lead one with a red nose. */}
        {[72, 106].map(x => (
          <g key={x} transform={`translate(${x} 14)`}>
            <ellipse cx='12' cy='12' rx='10' ry='5' />
            <rect height='9' width='1.6' x='5' y='15' />
            <rect height='9' width='1.6' x='17' y='15' />
            <circle cx='23' cy='6' r='3.5' />
            <path
              d='M22 3 l-2 -6 M24 3 l3 -6 M20 -1 l-3 -1 M26 -1 l3 -2'
              stroke='#f4f1ea'
              strokeWidth='1.2'
            />
          </g>
        ))}
        <circle cx='132.5' cy='20' fill='#ff4d4d' r='1.8' />
        <path d='M62 18 L76 26 M96 26 L110 26' stroke='#f4f1ea' strokeWidth='0.8' />
        <path d='M10 22 h46 q6 0 6 -8 v-6 h-8 v6 h-36 q-8 0 -8 8 Z' />
        <path d='M6 34 h56 q6 0 8 -6' fill='none' stroke='#f4f1ea' strokeWidth='2' />
        <circle cx='38' cy='6' fill='#ff4d4d' r='6' />
      </g>
    </svg>
    <svg
      className='holiday-snowman absolute right-6 bottom-4'
      height='84'
      viewBox='0 0 64 84'
      width='64'
    >
      <g fill='#f4f7fb' stroke='#c9d6e3' strokeWidth='1'>
        <circle cx='32' cy='64' r='18' />
        <circle cx='32' cy='38' r='13' />
        <circle cx='32' cy='18' r='10' />
      </g>
      <rect fill='#2b2b2b' height='3' rx='1' width='24' x='20' y='7' />
      <rect fill='#2b2b2b' height='12' rx='2' width='14' x='25' y='-4' />
      <circle cx='28' cy='16' fill='#2b2b2b' r='1.4' />
      <circle cx='36' cy='16' fill='#2b2b2b' r='1.4' />
      <path d='M32 19 l9 2 l-9 2 Z' fill='#ff8c2b' />
      <path d='M21 27 h22 v4 h-22 Z M37 30 h5 v9 h-5 Z' fill='#e23b3b' />
      <circle cx='32' cy='36' fill='#2b2b2b' r='1.3' />
      <circle cx='32' cy='42' fill='#2b2b2b' r='1.3' />
    </svg>
  </>
)

const Bat = ({ className }: { className: string }) => (
  <svg className={cn('absolute left-0', className)} height='16' viewBox='0 0 32 16' width='32'>
    <path
      className='holiday-bat-wings'
      d='M16 6 C12 0 6 0 0 4 C4 5 6 8 8 10 C10 7 13 8 16 11 C19 8 22 7 24 10 C26 8 28 5 32 4 C26 0 20 0 16 6 Z'
      fill='#1a1220'
    />
  </svg>
)

const Halloween = () => (
  <>
    <Bat className='holiday-bat holiday-bat-1 top-32' />
    <Bat className='holiday-bat holiday-bat-2 top-56' />
    <Bat className='holiday-bat holiday-bat-3 top-44' />
    {/* Web anchored in the bottom-right corner (not the top - page headers keep their controls
        up there), a spider resting on it, pumpkins beside it. */}
    <svg className='absolute right-0 bottom-0' height='130' viewBox='0 0 130 130' width='130'>
      <g fill='none' opacity='0.4' stroke='#e8e4f0' strokeWidth='0.8'>
        {[0, 18, 36, 54, 72, 90].map(angle => {
          const rad = (angle * Math.PI) / 180
          return (
            <line
              key={angle}
              x1='130'
              x2={130 - Math.cos(rad) * 130}
              y1='130'
              y2={130 - Math.sin(rad) * 130}
            />
          )
        })}
        {[24, 46, 70, 96].map(r => (
          <path key={r} d={`M${130 - r} 130 Q${130 - r * 0.8} ${130 - r * 0.8} 130 ${130 - r}`} />
        ))}
      </g>
    </svg>
    <svg
      className='holiday-spider absolute right-10 bottom-14'
      height='18'
      viewBox='0 0 20 18'
      width='20'
    >
      <g stroke='#1a1220' strokeWidth='1.2'>
        <path d='M10 8 l-8 -4 M10 10 l-9 1 M10 12 l-8 5 M10 8 l8 -4 M10 10 l9 1 M10 12 l8 5' />
      </g>
      <circle cx='10' cy='10' fill='#1a1220' r='4' />
      <circle cx='10' cy='5' fill='#1a1220' r='2.6' />
    </svg>
    <div className='absolute right-36 bottom-3 flex items-end gap-1'>
      <Pumpkin size={38} />
      <Pumpkin size={50} />
    </div>
  </>
)

const Pumpkin = ({ size }: { size: number }) => (
  <svg height={size * 0.875} viewBox='0 0 48 42' width={size}>
    <path d='M23 6 q1 -6 5 -6' fill='none' stroke='#3f6b2a' strokeWidth='3' />
    <ellipse cx='14' cy='24' fill='#d9661c' rx='12' ry='16' />
    <ellipse cx='34' cy='24' fill='#d9661c' rx='12' ry='16' />
    <ellipse cx='24' cy='24' fill='#f07a24' rx='12' ry='17' />
    <g className='holiday-pumpkin-glow' fill='#ffd24a'>
      <path d='M14 18 l5 6 h-10 Z M34 18 l5 6 h-10 Z' />
      <path d='M12 30 q12 8 24 0 l-3 4 l-3 -2 l-3 3 l-3 -3 l-3 3 l-3 -3 l-3 2 Z' />
    </g>
  </svg>
)

const Valentines = () => (
  <>
    {[0, 1, 2, 3, 4].map(i => (
      <svg
        key={i}
        className='holiday-float-heart absolute bottom-0'
        height='16'
        style={{ right: `${16 + i * 22}px`, animationDelay: `${i * 2.3}s` }}
        viewBox='0 0 18 16'
        width='18'
      >
        <path d='M9 15 C-4 6 2 -3 9 3 C16 -3 22 6 9 15 Z' fill={i % 2 ? '#ff6b8f' : '#ff9ab3'} />
      </svg>
    ))}
  </>
)

const Lantern = ({ delay }: { delay: string }) => (
  <svg
    className='holiday-lantern'
    height='78'
    style={{ animationDelay: delay }}
    viewBox='0 0 36 78'
    width='36'
  >
    <line stroke='#c9a24a' strokeWidth='1' x1='18' x2='18' y1='0' y2='14' />
    <rect fill='#e8b84a' height='4' rx='1' width='16' x='10' y='14' />
    <ellipse cx='18' cy='34' fill='#d62b2b' rx='16' ry='16' />
    <path
      d='M8 22 q10 12 0 24 M28 22 q-10 12 0 24 M18 18 v32'
      fill='none'
      stroke='#a51d1d'
      strokeWidth='1'
    />
    <rect fill='#e8b84a' height='4' rx='1' width='16' x='10' y='50' />
    <path d='M14 54 v20 M18 54 v22 M22 54 v20' stroke='#e8b84a' strokeWidth='1.2' />
  </svg>
)

// Bottom-right, not hung from the top - page headers keep their controls in the top-right.
const LunarNewYear = () => (
  <div className='absolute right-8 bottom-2 flex items-end gap-4'>
    <Lantern delay='0s' />
    <Lantern delay='-1.4s' />
  </div>
)

const Easter = () => (
  <div className='absolute right-5 bottom-0'>
    <svg
      className='holiday-bunny absolute bottom-6 left-12'
      height='60'
      viewBox='0 0 50 60'
      width='50'
    >
      <ellipse cx='17' cy='14' fill='#f6eef2' rx='5' ry='14' />
      <ellipse cx='33' cy='14' fill='#f6eef2' rx='5' ry='14' />
      <ellipse cx='17' cy='15' fill='#f5b8c8' rx='2.4' ry='10' />
      <ellipse cx='33' cy='15' fill='#f5b8c8' rx='2.4' ry='10' />
      <circle cx='25' cy='40' fill='#f6eef2' r='16' />
      <circle cx='19' cy='37' fill='#3a2b33' r='1.8' />
      <circle cx='31' cy='37' fill='#3a2b33' r='1.8' />
      <ellipse cx='25' cy='43' fill='#f08aa6' rx='2.2' ry='1.6' />
    </svg>
    <svg className='relative' height='50' viewBox='0 0 110 50' width='110'>
      <ellipse cx='26' cy='32' fill='#a8d8f0' rx='13' ry='17' />
      <path d='M13 30 q13 -6 26 0 M14 36 q12 5 24 0' fill='none' stroke='#fff' strokeWidth='2' />
      <ellipse cx='55' cy='34' fill='#f7c6da' rx='12' ry='16' />
      <path d='M44 30 l4 -3 l4 3 l4 -3 l4 3 l4 -3' fill='none' stroke='#fff' strokeWidth='2' />
      <ellipse cx='83' cy='33' fill='#fde7a0' rx='13' ry='17' />
      <circle cx='78' cy='28' fill='#c9b6f2' r='2.5' />
      <circle cx='88' cy='34' fill='#c9b6f2' r='2.5' />
      <circle cx='80' cy='40' fill='#c9b6f2' r='2.5' />
      <path
        d='M0 50 l4 -12 l3 12 l4 -14 l3 14 l4 -10 l3 10 l4 -13 l3 13 l4 -11 l3 11 l4 -14 l3 14 l4 -12 l3 12 l4 -10 l3 10 l4 -13 l3 13 l4 -11 l3 11 l4 -14 l3 14 l4 -12 l3 12 l4 -10 l3 10 l4 -13 l3 13 l4 -11 l3 11 l4 -12 l3 12 Z'
        fill='#7cc46a'
      />
    </svg>
  </div>
)
