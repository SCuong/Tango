import React from 'react';
import { useAppState } from '../hooks/useAppState';
import meoWorldMobile from '../assets/meo/meo-world-mobile.png';
import meoWorldDesktop from '../assets/meo/meo-world-desktop.png';

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
 * the same background artwork, softened, never behind prompts or answers on phones.
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
 * Meo's World background: the owner's finished artwork, used as-is (src/assets/meo). Phones get
 * the portrait composition, and from `sm` up the wide one; <picture> makes the browser download
 * only the composition it shows, and lazy loading keeps other themes from downloading either.
 * Sizing and placement live in src/index.css (.meo-world); the artwork is never stretched.
 */
const MeoWorldScene: React.FC = () => (
  <div className="ambience-scene ambience-meo">
    <picture className="meo-world">
      <source media="(min-width: 640px)" srcSet={meoWorldDesktop} width={1048} height={594} />
      <img
        src={meoWorldMobile}
        alt=""
        width={483}
        height={845}
        loading="lazy"
        decoding="async"
        draggable={false}
        data-meo-world=""
        className="meo-world-art"
      />
    </picture>
  </div>
);
