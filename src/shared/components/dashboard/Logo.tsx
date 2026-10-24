interface LogoProps {
  width?: number
  height?: number
  className?: string
}

// Plain inline SVG (no asset file, no next/image) so `fill-current` follows the current theme
// color the same way every react-icons glyph elsewhere in this app already does. `className` is
// merged onto the default so other call sites can override color (e.g. a fixed `text-white`/
// `text-black` on a light/dark-only surface) or size without needing a second component.
// The website carries copies of this path (docs/app/(marketing)/_components/Logo.tsx and the
// landing showcase's mockApp.ts `LOGO_PATH`) - keep them in step if the mark changes.
export const Logo = ({ width = 20, height = 20, className = '' }: LogoProps) => {
  return (
    <svg
      className={`pointer-events-none shrink-0 fill-current text-foreground ${className}`}
      data-tauri-drag-region
      height={height}
      viewBox='0 0 256 256'
      width={width}
      xmlns='http://www.w3.org/2000/svg'
    >
      <path d='M206.3 57.21Q228.46 70.21 228.46 96V160Q228.46 186 205.94 199L150.52 231Q128 244 105.48 231L83.69 218.42L165.26 171.33Q175.65 165.33 175.65 153.33V138.07Q175.65 132.07 173.05 130.57Q170.45 129.07 165.26 132.07L145 143.77V92.6L206.3 57.21ZM150.52 25 172.31 37.58 90.74 84.67Q80.35 90.67 80.35 102.67V117.93Q80.35 123.93 82.95 125.43Q85.55 126.93 90.74 123.93L111 112.23V163.4L49.7 198.79Q27.54 185.79 27.54 160V96Q27.54 70 50.06 57L105.48 25Q128 12 150.52 25Z' />
    </svg>
  )
}
