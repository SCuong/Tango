import React, { useId } from 'react';

export interface IllustrationProps {
  className?: string;
}

interface StudyCardIllustrationProps extends IllustrationProps {
  /** Japanese glyph printed on the front study card. */
  glyph: string;
  /** Prefix that keeps SVG filter ids unique per illustration type. */
  idPrefix: string;
}

/**
 * Shared artwork for the Home category illustrations: a tilted study card with a Japanese
 * glyph over a soft tinted backplate. All accent color comes from `currentColor`, so the
 * caller sets it with a text color class; the front card uses the theme surface color.
 * Decorative only: hidden from assistive technology and never focusable.
 */
export const StudyCardIllustration: React.FC<StudyCardIllustrationProps> = ({
  glyph,
  idPrefix,
  className = '',
}) => {
  // useId keeps filter ids unique even if the same illustration renders more than once;
  // strip characters that are awkward inside url(#...) references.
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, '');
  const shadowId = `${idPrefix}-shadow-${uid}`;
  const softShadowId = `${idPrefix}-soft-shadow-${uid}`;

  // The artwork is drawn on a 512x512 canvas. The square viewBox is cropped around the
  // drawing so it reads at small sizes; shadows may bleed past it (overflow visible).
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="66 55 380 380"
      overflow="visible"
      fill="none"
      aria-hidden="true"
      focusable="false"
      className={className}
    >
      <defs>
        <filter id={shadowId} x="-35%" y="-35%" width="180%" height="190%">
          <feDropShadow dx="0" dy="14" stdDeviation="15" floodColor="currentColor" floodOpacity="0.16" />
        </filter>
        <filter id={softShadowId} x="-30%" y="-30%" width="170%" height="180%">
          <feDropShadow dx="0" dy="9" stdDeviation="11" floodColor="currentColor" floodOpacity="0.13" />
        </filter>
      </defs>

      {/* Spark accents */}
      <g stroke="currentColor" strokeWidth="11" strokeLinecap="round" opacity="0.48">
        <line x1="137" y1="135" x2="116" y2="116" />
        <line x1="166" y1="111" x2="154" y2="82" />
        <line x1="202" y1="102" x2="200" y2="68" />
      </g>

      {/* Soft colored backplate */}
      <g transform="rotate(12 272 274)" filter={`url(#${softShadowId})`}>
        <rect x="151" y="132" width="246" height="286" rx="48" fill="currentColor" fillOpacity="0.30" />
        <rect x="163" y="144" width="222" height="262" rx="40" fill="currentColor" fillOpacity="0.12" />
      </g>

      {/* Front study card */}
      <g transform="rotate(14 246 275)" filter={`url(#${shadowId})`}>
        <rect x="125" y="137" width="242" height="286" rx="48" className="fill-surface" />

        {/* Very subtle clay tint */}
        <rect x="135" y="147" width="222" height="266" rx="40" fill="currentColor" fillOpacity="0.025" />

        {/* Top-left soft highlight */}
        <path
          d="M166 160 C149 168 143 183 143 204"
          className="stroke-surface"
          strokeWidth="11"
          strokeLinecap="round"
          opacity="0.95"
        />

        {/* Main glyph */}
        <text
          x="246"
          y="287"
          textAnchor="middle"
          dominantBaseline="middle"
          fill="currentColor"
          fontSize="132"
          fontWeight="700"
          fontFamily="'Noto Sans JP','Yu Gothic','Hiragino Sans',sans-serif"
          lang="ja"
        >
          {glyph}
        </text>
      </g>
    </svg>
  );
};
