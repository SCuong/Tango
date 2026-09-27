import React from 'react';
import { useAppState } from '../hooks/useAppState';

/**
 * Restrained Japanese ambience behind Home content (see DESIGN_SYSTEM §8.2), plus the Meo's World
 * cat environment (§9.4).
 *
 * All four scenes are rendered; `src/index.css` shows only the one matching the active
 * `data-theme`. Colors come from the per-theme `--ambience-*` tokens (plus `--bg-page` to occlude
 * pattern rings) at low opacity. Positions are fixed in CSS (deterministic, never random), the few
 * animated elements only translate or fade very slowly, and `prefers-reduced-motion` makes the
 * layer fully static. The layer is decorative: hidden from assistive technology and inert.
 */
export const ThemeAmbience: React.FC<{ subtle?: boolean }> = ({ subtle = false }) => (
  <div aria-hidden="true" className={`tango-ambience${subtle ? ' tango-ambience-subtle' : ''}`}>
    {/* Meo's World: Tango the cat takes over the canvas (edges and open areas only) */}
    <MeoWorldScene />

    {/* Light: Japanese daytime — daylight through a shoji window, seigaiha waves, one mist band */}
    <div className="ambience-scene ambience-light">
      <ShojiWindow className="ambience-shoji-window" paperOpacity={0.5} lineOpacity={0.07} />
      <SeigaihaFan className="ambience-seigaiha" patternId="tango-seigaiha-light" opacity={0.42} />
      <svg className="ambience-mist ambience-mist-1 ambience-animated" viewBox="0 0 280 36" focusable="false">
        <rect x="0" y="4" width="280" height="12" rx="6" fill="var(--ambience-accent)" opacity="0.2" />
        <rect x="56" y="22" width="190" height="10" rx="5" fill="var(--ambience-accent)" opacity="0.14" />
      </svg>
    </div>

    {/* Dark: Japanese night — moon, a warmly lit shoji window, a paper lantern, a few fireflies */}
    <div className="ambience-scene ambience-dark">
      <svg className="ambience-moon" viewBox="0 0 240 240" focusable="false">
        <circle cx="120" cy="120" r="104" fill="var(--ambience-glow)" opacity="0.035" />
        <circle cx="120" cy="120" r="64" fill="var(--ambience-glow)" opacity="0.1" />
      </svg>
      <ShojiWindow className="ambience-night-window" paperOpacity={0.07} lineOpacity={0.18} warm />
      <svg className="ambience-lantern" viewBox="0 0 80 120" focusable="false">
        <circle cx="40" cy="62" r="40" fill="var(--ambience-accent)" opacity="0.1" />
        <line x1="40" y1="0" x2="40" y2="14" stroke="var(--ambience-line)" strokeWidth="2" opacity="0.28" />
        <rect x="26" y="14" width="28" height="6" rx="2" fill="var(--ambience-line)" opacity="0.26" />
        <rect x="16" y="20" width="48" height="80" rx="22" fill="var(--ambience-accent)" opacity="0.18" />
        <rect x="16" y="20" width="48" height="80" rx="22" fill="none" stroke="var(--ambience-accent)" strokeWidth="2" opacity="0.36" />
        <path d="M18 44 H62 M17 60 H63 M18 76 H62" stroke="var(--ambience-accent)" strokeWidth="1.5" opacity="0.3" />
        <rect x="26" y="100" width="28" height="6" rx="2" fill="var(--ambience-line)" opacity="0.26" />
      </svg>
      <span className="ambience-firefly ambience-firefly-1 ambience-animated" />
      <span className="ambience-firefly ambience-firefly-2 ambience-animated" />
      <span className="ambience-firefly ambience-firefly-3 ambience-animated" />
      <span className="ambience-firefly ambience-firefly-4 ambience-animated" />
      <span className="ambience-star ambience-star-1" />
      <span className="ambience-star ambience-star-2" />
      <span className="ambience-star ambience-star-3" />
    </div>

    {/* Sakura: blossom paper — one branch, soft kasumi clouds, a few slowly falling petals */}
    <div className="ambience-scene ambience-sakura">
      <svg className="ambience-branch" viewBox="0 0 360 250" focusable="false">
        <path
          d="M0 44 C64 56 118 66 172 100 C210 124 250 132 330 126 M118 66 C132 38 158 22 196 14 M214 120 C230 150 250 170 284 184 M60 52 C70 86 92 112 120 128"
          fill="none"
          stroke="var(--ambience-line)"
          strokeWidth="6"
          strokeLinecap="round"
          opacity="0.16"
        />
        {[
          [196, 14],
          [160, 88],
          [250, 128],
          [284, 184],
          [120, 128],
          [330, 126],
          [92, 58],
        ].map(([x, y]) => (
          <Blossom key={`${x}-${y}`} x={x} y={y} />
        ))}
      </svg>
      <svg className="ambience-kasumi" viewBox="0 0 340 120" focusable="false">
        <g fill="var(--ambience-accent)">
          <rect x="60" y="8" width="280" height="22" rx="11" opacity="0.2" />
          <rect x="0" y="46" width="300" height="22" rx="11" opacity="0.16" />
          <rect x="110" y="84" width="230" height="22" rx="11" opacity="0.12" />
        </g>
      </svg>
      <Petal className="ambience-petal ambience-petal-1 ambience-animated" />
      <Petal className="ambience-petal ambience-petal-2 ambience-animated" />
      <Petal className="ambience-petal ambience-petal-3 ambience-animated" />
      <Petal className="ambience-petal ambience-petal-4 ambience-animated" />
      <Petal className="ambience-petal ambience-petal-5 ambience-animated" />
    </div>
  </div>
);

/** Shoji window: paper panel with a kumiko lattice. `warm` lights it with the lantern accent. */
const ShojiWindow: React.FC<{
  className: string;
  paperOpacity: number;
  lineOpacity: number;
  warm?: boolean;
}> = ({ className, paperOpacity, lineOpacity, warm = false }) => (
  <svg className={className} viewBox="0 0 240 300" focusable="false">
    <rect
      x="4"
      y="4"
      width="232"
      height="292"
      rx="6"
      fill={warm ? 'var(--ambience-accent)' : 'var(--ambience-glow)'}
      opacity={paperOpacity}
    />
    <g fill="none" stroke={warm ? 'var(--ambience-accent)' : 'var(--ambience-line)'} strokeWidth="3" opacity={lineOpacity}>
      <rect x="4" y="4" width="232" height="292" rx="6" />
      <path d="M62 4 V296 M120 4 V296 M178 4 V296 M4 62 H236 M4 120 H236 M4 178 H236 M4 236 H236" />
    </g>
  </svg>
);

/** Seigaiha (blue ocean waves) pattern inside a large quarter fan. Rings occlude with the page color. */
const SeigaihaFan: React.FC<{ className: string; patternId: string; opacity: number }> = ({
  className,
  patternId,
  opacity,
}) => {
  // Draw order matters: lower rows overlap upper rows, as in the traditional pattern.
  const centers: Array<[number, number]> = [
    [0, -10],
    [40, -10],
    [20, 0],
    [0, 10],
    [40, 10],
    [20, 20],
    [0, 30],
    [40, 30],
  ];
  return (
    <svg className={className} viewBox="0 0 320 320" focusable="false">
      <defs>
        <pattern id={patternId} width="40" height="20" patternUnits="userSpaceOnUse">
          {centers.map(([cx, cy]) => (
            <g key={`${cx}-${cy}`} stroke="var(--ambience-accent)" strokeWidth="1.4">
              <circle cx={cx} cy={cy} r="19" fill="var(--bg-page)" />
              <circle cx={cx} cy={cy} r="13" fill="none" />
              <circle cx={cx} cy={cy} r="7" fill="none" />
            </g>
          ))}
        </pattern>
      </defs>
      <circle cx="320" cy="320" r="300" fill={`url(#${patternId})`} opacity={opacity} />
    </svg>
  );
};

const Blossom: React.FC<{ x: number; y: number }> = ({ x, y }) => (
  <g transform={`translate(${x} ${y})`} fill="var(--ambience-accent)" opacity="0.4">
    {[0, 72, 144, 216, 288].map((angle) => (
      <ellipse key={angle} cx="0" cy="-6" rx="4.5" ry="6.5" transform={`rotate(${angle})`} />
    ))}
    <circle r="2" fill="var(--ambience-line)" opacity="0.5" />
  </g>
);

const Petal: React.FC<{ className: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 20 20" focusable="false">
    <path d="M10 2 C15 5 17 11 10 18 C3 11 5 5 10 2 Z" fill="var(--ambience-accent)" opacity="0.5" />
  </svg>
);

/**
 * Meo's World cat environment on screens without a regular ambience (focused flows: Settings,
 * management, import, active quiz, results). Only in Meo's World, and only its quiet edge layer:
 * large static cats at the page edges, nothing behind prompts, answers, or dense content.
 * `wideOnly` (Active Quiz) renders them only on laptop/desktop widths, in the outer margins.
 */
export const MeoEdgeAmbience: React.FC<{ wideOnly?: boolean }> = ({ wideOnly = false }) => {
  const { state } = useAppState();
  if (state.preferences.theme !== 'meo') return null;
  return (
    <div aria-hidden="true" className={`tango-ambience tango-ambience-quiet${wideOnly ? ' tango-ambience-wide-only' : ''}`}>
      <MeoWorldScene />
    </div>
  );
};

/*
 * Meo's World motif language, derived from the Tango wordmark: chunky warm-brown outlines,
 * orange fur with tabby stripes, cream muzzle and paws, blush cheeks, happy closed eyes.
 * Everything sits at the page edges or in open canvas; content surfaces stay readable islands.
 * Positions and the responsive composition live in src/index.css (.meo-*).
 */
const MeoWorldScene: React.FC = () => (
  <div className="ambience-scene ambience-meo">
    <span className="meo-blob meo-blob-1" />
    <span className="meo-blob meo-blob-2" />
    <span className="meo-blob meo-blob-3 meo-busy" />
    <MeoPawTrail className="meo-trail meo-busy" />
    <MeoTail className="meo-tail" />
    <MeoLoaf className="meo-loaf" />
    <MeoPeek className="meo-peek" />
    <MeoFish className="meo-fish meo-busy" />
    <MeoYarn className="meo-yarn meo-busy" />
  </div>
);

const OUTLINE = 'var(--meo-outline)';

/** Chubby cat loaf (front view), resting at the bottom edge with its paws tucked in. */
const MeoLoaf: React.FC<{ className: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 320 220" focusable="false">
    <g stroke={OUTLINE} strokeWidth="6" strokeLinejoin="round" fill="var(--meo-fur)">
      <path d="M68 96 L82 24 L140 66 Z" />
      <path d="M252 96 L238 24 L180 66 Z" />
      <path d="M16 224 C12 150 40 94 98 70 C132 56 188 56 222 70 C280 94 308 150 304 224 Z" />
    </g>
    <path d="M88 46 L93 80 L118 66 Z M232 46 L227 80 L202 66 Z" fill="var(--meo-blush)" opacity="0.8" />
    <path d="M98 224 C98 174 124 144 160 144 C196 144 222 174 222 224 Z" fill="var(--meo-cream)" />
    <ellipse cx="160" cy="134" rx="48" ry="30" fill="var(--meo-cream)" />
    <path
      d="M146 64 L150 86 M160 60 V84 M174 64 L170 86 M38 146 Q56 140 70 152 M32 178 Q50 172 64 184 M282 146 Q264 140 250 152 M288 178 Q270 172 256 184"
      stroke="var(--meo-stripe)"
      strokeWidth="8"
      strokeLinecap="round"
      fill="none"
    />
    <g stroke={OUTLINE} strokeWidth="5" strokeLinecap="round" fill="none">
      <path d="M110 114 Q124 101 138 114 M182 114 Q196 101 210 114" />
      <path d="M150 134 Q155 141 160 134 Q165 141 170 134" />
    </g>
    <path d="M154 125 H166 L160 131 Z" fill={OUTLINE} stroke={OUTLINE} strokeWidth="2" strokeLinejoin="round" />
    <ellipse cx="102" cy="132" rx="12" ry="7" fill="var(--meo-blush)" opacity="0.75" />
    <ellipse cx="218" cy="132" rx="12" ry="7" fill="var(--meo-blush)" opacity="0.75" />
    <path d="M90 126 L56 120 M90 136 L54 138 M230 126 L264 120 M230 136 L266 138" stroke={OUTLINE} strokeWidth="3.5" strokeLinecap="round" />
    <g fill="var(--meo-cream)" stroke={OUTLINE} strokeWidth="5">
      <ellipse cx="124" cy="208" rx="27" ry="18" />
      <ellipse cx="196" cy="208" rx="27" ry="18" />
    </g>
    <path d="M115 202 V212 M130 202 V212 M187 202 V212 M202 202 V212" stroke={OUTLINE} strokeWidth="3" strokeLinecap="round" />
  </svg>
);

/** Cat head peeking over an edge, both paws gripping it (open, curious eyes). */
const MeoPeek: React.FC<{ className: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 240 160" focusable="false">
    <g stroke={OUTLINE} strokeWidth="6" strokeLinejoin="round" fill="var(--meo-fur)">
      <path d="M50 78 L60 16 L106 48 Z" />
      <path d="M190 78 L180 16 L134 48 Z" />
      <path d="M26 164 C26 88 68 44 120 44 C172 44 214 88 214 164 Z" />
    </g>
    <path d="M66 36 L70 66 L92 52 Z M174 36 L170 66 L148 52 Z" fill="var(--meo-blush)" opacity="0.8" />
    <ellipse cx="120" cy="124" rx="44" ry="30" fill="var(--meo-cream)" />
    <path d="M108 52 L111 72 M120 50 V70 M132 52 L129 72" stroke="var(--meo-stripe)" strokeWidth="7" strokeLinecap="round" />
    <circle cx="92" cy="100" r="8" fill={OUTLINE} />
    <circle cx="148" cy="100" r="8" fill={OUTLINE} />
    <circle cx="95" cy="97" r="2.6" fill="var(--meo-cream)" />
    <circle cx="151" cy="97" r="2.6" fill="var(--meo-cream)" />
    <path d="M114 114 H126 L120 120 Z" fill={OUTLINE} stroke={OUTLINE} strokeWidth="2" strokeLinejoin="round" />
    <path d="M110 124 Q115 131 120 124 Q125 131 130 124" stroke={OUTLINE} strokeWidth="4.5" strokeLinecap="round" fill="none" />
    <ellipse cx="72" cy="118" rx="11" ry="6.5" fill="var(--meo-blush)" opacity="0.75" />
    <ellipse cx="168" cy="118" rx="11" ry="6.5" fill="var(--meo-blush)" opacity="0.75" />
    <path d="M62 112 L30 104 M62 122 L28 124 M178 112 L210 104 M178 122 L212 124" stroke={OUTLINE} strokeWidth="3.5" strokeLinecap="round" />
    <g fill="var(--meo-cream)" stroke={OUTLINE} strokeWidth="5">
      <ellipse cx="68" cy="152" rx="26" ry="15" />
      <ellipse cx="172" cy="152" rx="26" ry="15" />
    </g>
    <path d="M60 145 V154 M74 145 V154 M164 145 V154 M178 145 V154" stroke={OUTLINE} strokeWidth="3" strokeLinecap="round" />
  </svg>
);

/** The wordmark's striped, curled tail: outline, orange fur, tabby stripes, cream tip. */
const MeoTail: React.FC<{ className: string }> = ({ className }) => {
  const d = 'M40 262 C40 200 98 182 100 122 C102 62 58 40 42 66 C32 84 52 100 66 88';
  return (
    <svg className={`${className} ambience-animated`} viewBox="0 0 140 264" focusable="false">
      <path d={d} fill="none" stroke={OUTLINE} strokeWidth="34" strokeLinecap="round" />
      <path d={d} fill="none" stroke="var(--meo-fur)" strokeWidth="24" strokeLinecap="round" />
      <path d={d} fill="none" stroke="var(--meo-stripe)" strokeWidth="24" strokeDasharray="14 24" />
      <path d="M42 66 C32 84 52 100 66 88" fill="none" stroke="var(--meo-cream)" strokeWidth="24" strokeLinecap="round" />
    </svg>
  );
};

/** One paw print: main pad and four toe beans. */
export const MeoPaw: React.FC<{ x: number; y: number; angle?: number; scale?: number }> = ({
  x,
  y,
  angle = 0,
  scale = 1,
}) => (
  <g transform={`translate(${x} ${y}) rotate(${angle}) scale(${scale})`}>
    <path d="M-9 8 C-9 -1 -4 -4 0 -4 C4 -4 9 -1 9 8 C9 12 5 13 0 11 C-5 13 -9 12 -9 8 Z" />
    <ellipse cx="-10" cy="-7" rx="3.4" ry="4.2" />
    <ellipse cx="-3.6" cy="-12" rx="3.4" ry="4.2" />
    <ellipse cx="3.6" cy="-12" rx="3.4" ry="4.2" />
    <ellipse cx="10" cy="-7" rx="3.4" ry="4.2" />
  </g>
);

const MeoPawTrail: React.FC<{ className: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 160 300" focusable="false">
    <g fill="var(--meo-outline)">
      {[
        [118, 282, -24],
        [84, 246, -28],
        [110, 196, -22],
        [70, 162, -30],
        [92, 112, -20],
        [52, 78, -26],
        [72, 26, -18],
      ].map(([x, y, angle]) => (
        <MeoPaw key={`${x}-${y}`} x={x} y={y} angle={angle} />
      ))}
    </g>
  </svg>
);

const MeoFish: React.FC<{ className: string }> = ({ className }) => (
  <svg className={`${className} ambience-animated`} viewBox="0 0 64 40" focusable="false">
    <g stroke={OUTLINE} strokeWidth="3.5" strokeLinejoin="round">
      <path d="M48 20 L61 8 L61 32 Z" fill="var(--meo-stripe)" />
      <path d="M4 20 C14 4 40 4 50 20 C40 36 14 36 4 20 Z" fill="var(--meo-cream)" />
    </g>
    <path d="M22 11 Q27 20 22 29 M31 10 Q36 20 31 30" stroke="var(--meo-fur)" strokeWidth="3" fill="none" strokeLinecap="round" />
    <circle cx="13" cy="18" r="2.6" fill={OUTLINE} />
  </svg>
);

const MeoYarn: React.FC<{ className: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 72 60" focusable="false">
    <path d="M44 44 C54 56 64 44 70 56" stroke={OUTLINE} strokeWidth="3" fill="none" strokeLinecap="round" />
    <circle cx="28" cy="28" r="23" fill="var(--meo-stripe)" stroke={OUTLINE} strokeWidth="4" />
    <path
      d="M10 18 C22 22 34 34 38 50 M14 40 C22 30 36 20 50 22 M24 6 C26 20 34 30 50 34"
      stroke="var(--meo-cream)"
      strokeWidth="3"
      fill="none"
      strokeLinecap="round"
      opacity="0.9"
    />
  </svg>
);
