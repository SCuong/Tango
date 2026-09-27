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
 * Meo's World cat world, drawn in the Tango mascot's own family style: chubby rounded shapes,
 * warm dark-brown outlines with round joins, orange tabby stripes, cream muzzle and belly, soft
 * blush, sleepy happy eyes. A small illustrated scene instead of scattered stickers, in three
 * depth layers:
 *   far        soft organic fur washes with faint tabby bands and whisker curves (very low contrast)
 *   midground  one curled tail entering from an edge, a small paw trail, a yarn ball
 *   characters one sleeping Tango cat and one cat peeking from behind the page edge, both whole
 *              faces, small, at the edges and never under the bottom navigation labels
 * Positions and the per-breakpoint composition live in src/index.css (.meo-*).
 */
const MeoWorldScene: React.FC = () => (
  <div className="ambience-scene ambience-meo">
    <MeoWash className="meo-wash meo-wash-1" />
    <MeoWash className="meo-wash meo-wash-2" flip />
    <MeoTail className="meo-tail" />
    <MeoPawTrail className="meo-trail meo-busy" />
    <MeoPeek className="meo-peek" />
    <MeoYarn className="meo-yarn" />
    <MeoSleeper className="meo-sleeper" />
  </div>
);

const OUTLINE = 'var(--meo-outline)';

/** Far layer: an organic fur-colored wash with a few faint tabby bands and whisker curves. */
const MeoWash: React.FC<{ className: string; flip?: boolean }> = ({ className, flip = false }) => (
  <svg className={className} viewBox="0 0 260 220" focusable="false">
    <g transform={flip ? 'translate(260 0) scale(-1 1)' : undefined}>
      <path
        d="M18 118 C8 76 36 34 86 22 C130 12 176 20 208 48 C240 76 252 122 232 158 C212 194 162 208 114 204 C64 200 28 164 18 118 Z"
        fill="var(--meo-fur)"
        opacity="0.2"
      />
      <path
        d="M70 40 C82 60 84 80 76 100 M112 30 C124 54 126 80 116 104 M154 34 C166 58 166 84 156 108"
        stroke="var(--meo-stripe)"
        strokeWidth="14"
        strokeLinecap="round"
        fill="none"
        opacity="0.07"
      />
      <path
        d="M150 150 C176 144 200 146 222 154 M146 164 C172 164 196 170 214 180"
        stroke={OUTLINE}
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
        opacity="0.1"
      />
    </g>
  </svg>
);

/**
 * Character: a chubby Tango cat asleep on its paws, tail wrapped around its front, with a
 * couple of tiny "z"s. It breathes very slowly (CSS) and is fully static under reduced motion.
 */
const MeoSleeper: React.FC<{ className: string }> = ({ className }) => (
  <svg className={`${className} ambience-animated`} viewBox="0 0 200 124" focusable="false">
    <ellipse cx="102" cy="116" rx="86" ry="6" fill={OUTLINE} opacity="0.08" />
    <g stroke={OUTLINE} strokeWidth="3.4" strokeLinejoin="round" strokeLinecap="round">
      {/* Body */}
      <path
        d="M30 104 C16 100 14 82 22 68 C32 50 58 38 88 37 C118 36 140 44 152 58 C160 68 162 82 158 94 C154 104 144 108 132 108 L46 108 C38 108 33 106 30 104 Z"
        fill="var(--meo-fur)"
      />
      {/* Ears */}
      <path d="M118 62 C114 50 115 40 120 34 C128 38 135 45 139 53" fill="var(--meo-fur)" />
      <path d="M156 54 C161 45 168 40 175 38 C178 46 177 56 173 64" fill="var(--meo-fur)" />
    </g>
    {/* Back highlight and tabby stripes */}
    <path d="M44 56 C60 45 82 41 104 42" stroke="var(--meo-cream)" strokeWidth="3" strokeLinecap="round" fill="none" opacity="0.55" />
    <path
      d="M58 46 C63 56 63 66 58 74 M78 41 C84 52 84 64 79 73 M98 41 C103 51 103 62 99 70"
      stroke="var(--meo-stripe)"
      strokeWidth="5"
      strokeLinecap="round"
      fill="none"
      opacity="0.85"
    />
    <path d="M123 41 L130 51 Z M170 43 L167 55 Z" stroke="var(--meo-blush)" strokeWidth="5" strokeLinecap="round" opacity="0.8" />
    {/* Head */}
    <path
      d="M110 86 C108 68 122 54 144 53 C166 52 182 64 182 82 C182 98 168 108 146 108 C124 108 111 100 110 86 Z"
      fill="var(--meo-fur)"
      stroke={OUTLINE}
      strokeWidth="3.4"
      strokeLinejoin="round"
    />
    <path d="M136 57 C138 62 138 67 136 71 M146 55 V67 M156 57 C154 62 154 67 156 71" stroke="var(--meo-stripe)" strokeWidth="3.4" strokeLinecap="round" fill="none" />
    {/* Cream muzzle */}
    <path d="M128 94 C129 86 138 83 146 87 C154 83 163 86 164 94 C163 102 154 105 146 102 C138 105 129 102 128 94 Z" fill="var(--meo-cream)" />
    {/* Sleepy face */}
    <g stroke={OUTLINE} strokeWidth="2.6" strokeLinecap="round" fill="none">
      <path d="M125 80 Q131 84.5 137 80 M155 80 Q161 84.5 167 80" />
      <path d="M141.5 93 Q143.8 95.6 146 93 Q148.2 95.6 150.5 93" strokeWidth="2" />
    </g>
    <path d="M143 88.5 H149 L146 91.5 Z" fill={OUTLINE} stroke={OUTLINE} strokeWidth="1.4" strokeLinejoin="round" />
    <ellipse cx="124" cy="90" rx="6" ry="3.4" fill="var(--meo-blush)" opacity="0.65" />
    <ellipse cx="168" cy="90" rx="6" ry="3.4" fill="var(--meo-blush)" opacity="0.65" />
    {/* Tail wrapped around the front, with its cream tip */}
    <path d="M32 104 C26 116 58 120 92 117 C106 116 114 113 112 108" stroke={OUTLINE} strokeWidth="13" strokeLinecap="round" fill="none" />
    <path d="M32 104 C26 116 58 120 92 117 C106 116 114 113 112 108" stroke="var(--meo-fur)" strokeWidth="7.6" strokeLinecap="round" fill="none" />
    <path d="M40 113 C50 118 70 119 88 117" stroke="var(--meo-stripe)" strokeWidth="7.6" strokeDasharray="6 9" fill="none" />
    <path d="M100 116 C108 115 113 112 112 108" stroke="var(--meo-cream)" strokeWidth="7.6" strokeLinecap="round" fill="none" />
    {/* Front paws tucked under the chin */}
    <g fill="var(--meo-cream)" stroke={OUTLINE} strokeWidth="2.8">
      <path d="M118 108 C118 102 124 99 130 100 C136 101 138 105 137 108 Z" />
      <path d="M152 108 C152 102 158 99 164 100 C170 101 172 105 171 108 Z" />
    </g>
    {/* Zz */}
    <path d="M178 26 H186 L178 35 H186 M190 12 H196 L190 19 H196" stroke={OUTLINE} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" opacity="0.45" />
  </svg>
);

/**
 * Character: a Tango cat peeking from behind the left page edge. The edge cuts the back of the
 * head only; the whole face, both ears, and one gripping paw stay visible.
 */
const MeoPeek: React.FC<{ className: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 110 100" focusable="false">
    <g stroke={OUTLINE} strokeWidth="3.4" strokeLinejoin="round" strokeLinecap="round" fill="var(--meo-fur)">
      <path d="M22 34 C19 22 21 12 27 8 C35 13 41 19 44 26" />
      <path d="M64 25 C70 16 78 11 85 11 C88 19 88 30 85 38" />
      <path d="M-12 62 C-12 38 12 22 46 22 C78 22 98 40 98 62 C98 84 78 96 46 96 C12 96 -12 84 -12 62 Z" />
    </g>
    <path d="M28 14 C32 18 35 22 37 27 L28 30 Z M80 17 C82 23 82 29 81 34 L73 28 Z" fill="var(--meo-blush)" opacity="0.8" />
    <path d="M41 29 C43 35 43 40 41 45 M51 27 V39 M61 29 C59 35 59 40 61 45" stroke="var(--meo-stripe)" strokeWidth="3.4" strokeLinecap="round" fill="none" />
    <path d="M40 77 C40 67 50 63 58 65 C66 63 78 67 78 77 C78 86 66 90 58 87 C50 90 40 86 40 77 Z" fill="var(--meo-cream)" />
    <circle cx="45" cy="60" r="4.3" fill={OUTLINE} />
    <circle cx="72" cy="60" r="4.3" fill={OUTLINE} />
    <circle cx="46.6" cy="58.4" r="1.5" fill="var(--meo-cream)" />
    <circle cx="73.6" cy="58.4" r="1.5" fill="var(--meo-cream)" />
    <path d="M55.5 70 H61.5 L58.5 73.2 Z" fill={OUTLINE} stroke={OUTLINE} strokeWidth="1.4" strokeLinejoin="round" />
    <path d="M53.5 76 Q56 78.8 58.5 76 Q61 78.8 63.5 76" stroke={OUTLINE} strokeWidth="2" strokeLinecap="round" fill="none" />
    <ellipse cx="37" cy="72" rx="5.4" ry="3" fill="var(--meo-blush)" opacity="0.65" />
    <ellipse cx="81" cy="70" rx="5.4" ry="3" fill="var(--meo-blush)" opacity="0.65" />
    <path d="M86 67 C92 65 97 64 103 64 M86 72 C92 72 97 73 102 75" stroke={OUTLINE} strokeWidth="1.6" strokeLinecap="round" fill="none" opacity="0.75" />
    <path d="M2 94 C2 86 9 82 16 83 C23 84 26 89 25 94 C24 98 18 99 13 98 C8 99 2 98 2 94 Z" fill="var(--meo-cream)" stroke={OUTLINE} strokeWidth="2.8" strokeLinejoin="round" />
    <path d="M10 89 V94 M17 89 V94" stroke={OUTLINE} strokeWidth="1.8" strokeLinecap="round" />
  </svg>
);

/** Midground: the wordmark's striped tail with its cream tip, curling in from the right edge. */
const MeoTail: React.FC<{ className: string }> = ({ className }) => {
  const d = 'M74 152 C54 136 38 116 38 92 C38 66 56 54 52 34 C49 20 34 18 30 28 C27 36 34 42 41 37';
  return (
    <svg className={`${className} ambience-animated`} viewBox="0 0 74 152" focusable="false">
      <path d={d} fill="none" stroke={OUTLINE} strokeWidth="17" strokeLinecap="round" strokeLinejoin="round" />
      <path d={d} fill="none" stroke="var(--meo-fur)" strokeWidth="11" strokeLinecap="round" strokeLinejoin="round" />
      <path d={d} fill="none" stroke="var(--meo-stripe)" strokeWidth="11" strokeDasharray="8 13" strokeDashoffset="4" />
      <path d="M37 21 C31 22 28 30 32 36 C35 39 39 39 41 37" fill="none" stroke="var(--meo-cream)" strokeWidth="11" strokeLinecap="round" />
      <path d="M60 128 C48 114 42 100 42 88" fill="none" stroke="var(--meo-cream)" strokeWidth="2.4" strokeLinecap="round" opacity="0.45" />
    </svg>
  );
};

/** One small paw print: main pad and four toe beans. */
const MeoPaw: React.FC<{ x: number; y: number; angle: number }> = ({ x, y, angle }) => (
  <g transform={`translate(${x} ${y}) rotate(${angle}) scale(0.62)`}>
    <path d="M-9 8 C-9 -1 -4 -4 0 -4 C4 -4 9 -1 9 8 C9 12 5 13 0 11 C-5 13 -9 12 -9 8 Z" />
    <ellipse cx="-10" cy="-7" rx="3.4" ry="4.2" />
    <ellipse cx="-3.6" cy="-12" rx="3.4" ry="4.2" />
    <ellipse cx="3.6" cy="-12" rx="3.4" ry="4.2" />
    <ellipse cx="10" cy="-7" rx="3.4" ry="4.2" />
  </g>
);

/** Midground: a short, gentle paw trail that leads toward the sleeping cat. */
const MeoPawTrail: React.FC<{ className: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 170 60" focusable="false">
    <g fill={OUTLINE}>
      {[
        [12, 46, 70],
        [36, 34, 84],
        [62, 42, 78],
        [88, 28, 90],
        [114, 34, 84],
        [140, 22, 96],
      ].map(([x, y, angle]) => (
        <MeoPaw key={`${x}-${y}`} x={x} y={y} angle={angle} />
      ))}
    </g>
  </svg>
);

/** Midground: the sleeping cat's yarn ball, its loose thread trailing away. */
const MeoYarn: React.FC<{ className: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 60 44" focusable="false">
    <path d="M36 34 C44 42 52 34 58 40" stroke={OUTLINE} strokeWidth="1.8" fill="none" strokeLinecap="round" opacity="0.7" />
    <path
      d="M4 24 C4 13 12 5 22 5 C33 5 40 13 40 23 C40 34 32 41 21 41 C11 41 4 34 4 24 Z"
      fill="var(--meo-blush)"
      stroke={OUTLINE}
      strokeWidth="2.6"
      strokeLinejoin="round"
    />
    <path
      d="M9 15 C18 17 28 26 31 38 M8 30 C15 22 26 14 37 16 M18 6 C19 16 26 24 39 27"
      stroke="var(--meo-cream)"
      strokeWidth="2"
      fill="none"
      strokeLinecap="round"
      opacity="0.9"
    />
  </svg>
);
