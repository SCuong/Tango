import React from 'react';
import { useAppState } from '../hooks/useAppState';
import meoPeekArt from '../assets/meo/meo-peek.webp';
import meoSleepArt from '../assets/meo/meo-sleep.webp';
import meoYarnArt from '../assets/meo/meo-yarn.webp';

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
 * the static mascot cats at the page edges, nothing behind prompts, answers, or dense content.
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
 * Meo's World cat world, built around the three Tango mascot artworks (src/assets/meo): a cat
 * peeking over an edge, a curled sleeping cat, and the yarn-playing cat (the centerpiece, shown
 * whole on Home by MeoHomeStage). Three depth layers:
 *   far        soft organic fur washes with faint tabby bands and whisker curves
 *   midground  hand-drawn paw trail, grass tufts, leaves, tiny flowers, hearts, a butterfly
 *   characters the mascot artworks, at the edges here and whole in the Home stage
 * Images load lazily, so other themes (scene hidden) never download them. Positions and the
 * per-breakpoint composition live in src/index.css (.meo-*).
 */
const MeoWorldScene: React.FC = () => (
  <div className="ambience-scene ambience-meo">
    <MeoWash className="meo-wash meo-wash-1" />
    <MeoWash className="meo-wash meo-wash-2" flip />
    <MeoPawTrail className="meo-trail meo-busy" />
    <MeoGrass className="meo-grass-edge meo-busy" />
    <MeoCat kind="peek" className="meo-cat meo-cat-peek" />
    <MeoCat kind="sleep" className="meo-cat meo-cat-sleep" />
  </div>
);

const MEO_CAT_ART = {
  peek: { src: meoPeekArt, width: 440, height: 349 },
  sleep: { src: meoSleepArt, width: 560, height: 316 },
  yarn: { src: meoYarnArt, width: 520, height: 566 },
} as const;

/** One mascot artwork: decorative, never interactive, intrinsic size kept to avoid layout shift. */
const MeoCat: React.FC<{ kind: keyof typeof MEO_CAT_ART; className: string }> = ({ kind, className }) => {
  const art = MEO_CAT_ART[kind];
  return (
    <img
      src={art.src}
      alt=""
      width={art.width}
      height={art.height}
      loading="lazy"
      decoding="async"
      draggable={false}
      data-meo-cat={kind}
      className={className}
    />
  );
};

/**
 * Home's centerpiece stage (Meo's World only): the yarn-playing cat sits whole in the open canvas
 * below the Vocabulary / Kanji cards, on a soft hill with grass, flowers, hearts, a butterfly, and
 * a loose yarn thread. On phones and tablets the peeking and sleeping cats join it here, so no
 * artwork ever sits behind a card; from 1280px they move to the outer margins instead. It is part
 * of the page flow (never covered by cards), decorative, and hidden from assistive technology.
 */
export const MeoHomeStage: React.FC = () => {
  const { state } = useAppState();
  if (state.preferences.theme !== 'meo') return null;
  return (
    <div aria-hidden="true" className="meo-stage">
      <MeoCat kind="peek" className="meo-stage-peek" />
      <MeoHill className="meo-stage-hill" />
      <MeoYarnThread className="meo-stage-thread" />
      <MeoGrass className="meo-stage-grass meo-stage-grass-1" />
      <MeoGrass className="meo-stage-grass meo-stage-grass-2" flip />
      <MeoFlowers className="meo-stage-flowers" />
      <MeoCat kind="yarn" className="meo-stage-yarn" />
      <MeoCat kind="sleep" className="meo-stage-sleep" />
      <MeoHeart className="meo-stage-heart meo-stage-heart-1 meo-heart-float ambience-animated" />
      <MeoHeart className="meo-stage-heart meo-stage-heart-2" />
      <MeoButterfly className="meo-stage-butterfly meo-butterfly ambience-animated" />
    </div>
  );
};

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

/** Soft rolling ground the stage cats rest on; it also hides the peeking cat's flat lower edge. */
const MeoHill: React.FC<{ className: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 400 60" preserveAspectRatio="none" focusable="false">
    <path d="M0 30 C40 14 86 12 130 22 C170 31 214 30 256 20 C300 10 350 12 400 26 V60 H0 Z" fill="var(--meo-cream)" opacity="0.9" />
    <path d="M0 38 C48 26 92 26 136 34 C178 41 220 40 262 32 C306 24 354 26 400 36" stroke="var(--meo-fur)" strokeWidth="2.5" strokeLinecap="round" fill="none" opacity="0.55" />
  </svg>
);

/** A loose pink yarn thread wandering along the ground from the yarn ball. */
const MeoYarnThread: React.FC<{ className: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 160 40" preserveAspectRatio="none" focusable="false">
    <path d="M4 10 C22 30 44 34 64 22 C82 11 100 12 116 24 C128 33 142 34 156 28" stroke="var(--meo-yarn)" strokeWidth="2.6" strokeLinecap="round" fill="none" opacity="0.8" />
  </svg>
);

/** Midground: a small grass tuft with a leafy sprig, drawn with soft uneven blades. */
const MeoGrass: React.FC<{ className: string; flip?: boolean }> = ({ className, flip = false }) => (
  <svg className={className} viewBox="0 0 60 40" focusable="false">
    <g transform={flip ? 'translate(60 0) scale(-1 1)' : undefined} strokeLinecap="round" fill="none">
      <path d="M14 38 C13 30 10 24 6 20 M20 38 C20 28 22 20 26 14 M27 38 C28 31 32 26 36 23" stroke="var(--meo-leaf)" strokeWidth="2.6" />
      <path d="M40 38 C40 30 42 24 47 19" stroke="var(--meo-leaf-dark)" strokeWidth="2.2" />
      <path d="M47 19 C52 17 55 13 55 9 C50 10 47 14 47 19 Z M43 27 C38 25 35 21 35 17 C40 18 43 22 43 27 Z" fill="var(--meo-leaf)" stroke="var(--meo-leaf-dark)" strokeWidth="1.2" />
    </g>
  </svg>
);

/** Two tiny cream flowers with honey centers. */
const MeoFlowers: React.FC<{ className: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 70 30" focusable="false">
    {[
      [14, 14, 1],
      [50, 18, 0.8],
    ].map(([x, y, s]) => (
      <g key={x} transform={`translate(${x} ${y}) scale(${s})`}>
        <path d="M0 16 V26" stroke="var(--meo-leaf-dark)" strokeWidth="1.8" strokeLinecap="round" />
        <g fill="var(--meo-cream)" stroke="var(--meo-fur)" strokeWidth="1">
          {[0, 72, 144, 216, 288].map((angle) => (
            <ellipse key={angle} cx="0" cy="-5" rx="3.6" ry="5" transform={`rotate(${angle})`} />
          ))}
        </g>
        <circle r="2.8" fill="var(--meo-stripe)" />
      </g>
    ))}
  </svg>
);

/** A small hand-drawn heart. */
const MeoHeart: React.FC<{ className: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 24 22" focusable="false">
    <path
      d="M12 20 C6 15.5 2.5 12 2.5 7.6 C2.5 4.6 4.8 2.5 7.5 2.5 C9.4 2.5 11 3.6 12 5.2 C13 3.6 14.6 2.5 16.5 2.5 C19.2 2.5 21.5 4.6 21.5 7.6 C21.5 12 18 15.5 12 20 Z"
      fill="var(--meo-heart)"
      stroke={OUTLINE}
      strokeWidth="1.4"
      strokeLinejoin="round"
      opacity="0.85"
    />
  </svg>
);

/** A small warm butterfly with rounded wings. */
const MeoButterfly: React.FC<{ className: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 32 26" focusable="false">
    <g stroke={OUTLINE} strokeWidth="1.3" strokeLinejoin="round">
      <path d="M16 13 C12 4 4 2 3 7 C2 12 8 15 16 13 Z" fill="var(--meo-fur)" />
      <path d="M16 13 C20 4 28 2 29 7 C30 12 24 15 16 13 Z" fill="var(--meo-fur)" />
      <path d="M16 13 C12 16 7 21 9 23 C11 25 15 20 16 13 Z" fill="var(--meo-cream)" />
      <path d="M16 13 C20 16 25 21 23 23 C21 25 17 20 16 13 Z" fill="var(--meo-cream)" />
    </g>
    <path d="M16 8 V19" stroke={OUTLINE} strokeWidth="1.8" strokeLinecap="round" />
    <path d="M15.5 8 C14 5 12.5 4 11 4 M16.5 8 C18 5 19.5 4 21 4" stroke={OUTLINE} strokeWidth="1" strokeLinecap="round" fill="none" />
    <circle cx="8" cy="8" r="1.6" fill="var(--meo-stripe)" />
    <circle cx="24" cy="8" r="1.6" fill="var(--meo-stripe)" />
  </svg>
);

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

/** Midground: a short, gentle paw trail. */
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
