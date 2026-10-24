// The site's rainbow as SVG paint, for strokes CSS gradients can't reach: the docs and blog TOC's
// active trace (`stroke: url(#sgi-rainbow)`), an SVG path Fumadocs draws. The same hues as
// globals.css's --sgi-rainbow, but deliberately more saturated (on a 2px line the muted rail
// colours read as washed out), starting at cyan/blue at the top of the TOC.
const STOPS = [
  'hsl(190, 90%, 58%)',
  'hsl(225, 90%, 68%)',
  'hsl(270, 95%, 70%)',
  'hsl(310, 90%, 66%)',
  'hsl(345, 90%, 65%)',
  'hsl(25, 95%, 62%)',
  'hsl(48, 95%, 58%)',
  'hsl(140, 75%, 55%)',
  'hsl(190, 90%, 58%)',
]

// One cycle of the hues, in the referencing SVG's units - the TOC's are px down its list, so a
// typical TOC shows a full cycle top to bottom; longer ones repeat (seamlessly - the first and
// last stops match)
const PERIOD = 600

/**
 * Hidden, zero-size SVG holding paint servers referenced by id from CSS. Mounted once in the
 * marketing layout, so every page that might draw with them has them.
 */
export default function RainbowDefs() {
  return (
    <svg width='0' height='0' aria-hidden='true' focusable='false' className='absolute'>
      <defs>
        <linearGradient
          id='sgi-rainbow'
          gradientUnits='userSpaceOnUse'
          x1='0'
          y1='0'
          x2='0'
          y2={PERIOD}
          spreadMethod='repeat'
        >
          {STOPS.map((color, i) => {
            // the offset, not the colour: the first and last stops share one
            const offset = i / (STOPS.length - 1)
            return <stop key={offset} offset={offset} stopColor={color} />
          })}
        </linearGradient>

        {/* A glow in the stroke's own colours (a CSS drop-shadow can only be one colour): the
            path blurred, under the sharp path. Sized in user space, generously - a thin vertical
            line's bounding box is nearly zero wide, so the default region would clip the glow. */}
        <filter
          id='sgi-glow'
          filterUnits='userSpaceOnUse'
          x='-50'
          y='-50'
          width='400'
          height='20000'
        >
          <feGaussianBlur stdDeviation='3' result='blur' />
          <feMerge>
            <feMergeNode in='blur' />
            <feMergeNode in='blur' />
            <feMergeNode in='SourceGraphic' />
          </feMerge>
        </filter>
      </defs>
    </svg>
  )
}
