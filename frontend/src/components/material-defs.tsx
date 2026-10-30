/**
 * Shared SVG filters for analog materials, rendered once at the root.
 * CSS references them by id (`filter: url(#lp-stamp-ink)`); browsers without
 * HTML filter support simply show clean ink.
 */
export function MaterialDefs() {
  return (
    <svg className="material-defs" width="0" height="0" aria-hidden="true" focusable="false">
      <defs>
        {/* Rubber-stamp impression: wobbly rubber edge, missed specks and uneven pressure. */}
        <filter id="lp-stamp-ink" x="-6%" y="-6%" width="112%" height="112%" colorInterpolationFilters="sRGB">
          <feTurbulence type="fractalNoise" baseFrequency=".06" numOctaves="2" seed="7" result="warp" />
          <feDisplacementMap in="SourceGraphic" in2="warp" scale="2.4" xChannelSelector="R" yChannelSelector="G" result="edge" />
          <feTurbulence type="fractalNoise" baseFrequency=".8" numOctaves="2" seed="13" result="speck" />
          <feColorMatrix in="speck" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  -12 0 0 0 7.6" result="gaps" />
          <feTurbulence type="fractalNoise" baseFrequency=".022" numOctaves="1" seed="3" result="press" />
          <feColorMatrix in="press" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  1.7 0 0 0 .02" result="pressure" />
          <feComposite in="gaps" in2="pressure" operator="arithmetic" k1="1" result="ink" />
          <feComposite in="edge" in2="ink" operator="in" />
        </filter>
        {/* Letterpress ink: a hair of edge wobble so printed artwork is not vector-perfect. */}
        <filter id="lp-print" x="-4%" y="-4%" width="108%" height="108%" colorInterpolationFilters="sRGB">
          <feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="1" seed="21" result="tooth" />
          <feDisplacementMap in="SourceGraphic" in2="tooth" scale=".9" xChannelSelector="R" yChannelSelector="G" />
        </filter>
        {/* Torn paper edge for receipts and tape ends. */}
        <filter id="lp-torn" x="-4%" y="-4%" width="108%" height="108%">
          <feTurbulence type="fractalNoise" baseFrequency=".35" numOctaves="3" seed="9" result="fibre" />
          <feDisplacementMap in="SourceGraphic" in2="fibre" scale="4" xChannelSelector="R" yChannelSelector="G" />
        </filter>
      </defs>
    </svg>
  );
}
