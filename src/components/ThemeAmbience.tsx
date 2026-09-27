import React from 'react';

/**
 * Restrained Japanese ambience behind Home content (see DESIGN_SYSTEM §8.2).
 *
 * All three scenes are rendered; `src/index.css` shows only the one matching the active
 * `data-theme`. Colors come from the per-theme `--ambience-*` tokens and every element stays at
 * very low opacity. Positions are fixed in CSS (deterministic, never random), the few animated
 * elements only translate or fade very slowly, and `prefers-reduced-motion` makes the layer
 * fully static. The layer is decorative: hidden from assistive technology and never interactive.
 */
export const ThemeAmbience: React.FC = () => (
  <div aria-hidden="true" className="tango-ambience">
    {/* Light: Japanese daytime — soft sun, mist bands (kasumi), shoji lattice */}
    <div className="ambience-scene ambience-light">
      <svg className="ambience-sun" viewBox="0 0 240 240" focusable="false">
        <circle cx="120" cy="120" r="112" fill="none" stroke="var(--ambience-line)" strokeWidth="2" opacity="0.06" />
        <circle cx="120" cy="120" r="96" fill="var(--ambience-glow)" opacity="0.55" />
      </svg>
      <svg className="ambience-mist ambience-mist-1 ambience-animated" viewBox="0 0 280 36" focusable="false">
        <rect x="0" y="4" width="280" height="12" rx="6" fill="var(--ambience-accent)" opacity="0.14" />
        <rect x="56" y="22" width="190" height="10" rx="5" fill="var(--ambience-accent)" opacity="0.1" />
      </svg>
      <svg className="ambience-mist ambience-mist-2 ambience-animated" viewBox="0 0 280 36" focusable="false">
        <rect x="40" y="4" width="240" height="12" rx="6" fill="var(--ambience-accent)" opacity="0.12" />
        <rect x="0" y="22" width="170" height="10" rx="5" fill="var(--ambience-accent)" opacity="0.08" />
      </svg>
      <ShojiLattice className="ambience-shoji" />
    </div>

    {/* Dark: Japanese night — moon, a few stars, paper lantern */}
    <div className="ambience-scene ambience-dark">
      <svg className="ambience-moon" viewBox="0 0 240 240" focusable="false">
        <circle cx="120" cy="120" r="104" fill="var(--ambience-glow)" opacity="0.025" />
        <circle cx="120" cy="120" r="64" fill="var(--ambience-glow)" opacity="0.07" />
      </svg>
      <span className="ambience-star ambience-star-1 ambience-animated" />
      <span className="ambience-star ambience-star-2" />
      <span className="ambience-star ambience-star-3 ambience-animated" />
      <span className="ambience-star ambience-star-4" />
      <span className="ambience-star ambience-star-5" />
      <svg className="ambience-lantern" viewBox="0 0 80 120" focusable="false">
        <circle cx="40" cy="62" r="38" fill="var(--ambience-accent)" opacity="0.06" />
        <line x1="40" y1="0" x2="40" y2="14" stroke="var(--ambience-line)" strokeWidth="2" opacity="0.18" />
        <rect x="26" y="14" width="28" height="6" rx="2" fill="var(--ambience-line)" opacity="0.16" />
        <rect x="16" y="20" width="48" height="80" rx="22" fill="var(--ambience-accent)" opacity="0.1" />
        <rect x="16" y="20" width="48" height="80" rx="22" fill="none" stroke="var(--ambience-accent)" strokeWidth="2" opacity="0.22" />
        <path d="M18 44 H62 M17 60 H63 M18 76 H62" stroke="var(--ambience-accent)" strokeWidth="1.5" opacity="0.18" />
        <rect x="26" y="100" width="28" height="6" rx="2" fill="var(--ambience-line)" opacity="0.16" />
      </svg>
    </div>

    {/* Sakura: warm blossom paper — one quiet branch and a few slowly falling petals */}
    <div className="ambience-scene ambience-sakura">
      <svg className="ambience-branch" viewBox="0 0 320 220" focusable="false">
        <path
          d="M0 40 C60 52 110 60 160 92 C196 115 232 122 300 118 M110 62 C122 36 146 22 180 16 M200 112 C214 138 232 156 262 168"
          fill="none"
          stroke="var(--ambience-line)"
          strokeWidth="5"
          strokeLinecap="round"
          opacity="0.1"
        />
        <Blossom x={180} y={16} />
        <Blossom x={236} y={120} />
        <Blossom x={262} y={168} />
        <Blossom x={150} y={84} />
      </svg>
      <Petal className="ambience-petal ambience-petal-1 ambience-animated" />
      <Petal className="ambience-petal ambience-petal-2 ambience-animated" />
      <Petal className="ambience-petal ambience-petal-3 ambience-animated" />
      <Petal className="ambience-petal ambience-petal-4 ambience-animated" />
    </div>
  </div>
);

const ShojiLattice: React.FC<{ className: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 240 300" focusable="false">
    <g fill="none" stroke="var(--ambience-line)" strokeWidth="2" opacity="0.06">
      <rect x="4" y="4" width="232" height="292" rx="4" />
      <path d="M62 4 V296 M120 4 V296 M178 4 V296 M4 62 H236 M4 120 H236 M4 178 H236 M4 236 H236" />
    </g>
  </svg>
);

const Blossom: React.FC<{ x: number; y: number }> = ({ x, y }) => (
  <g transform={`translate(${x} ${y})`} fill="var(--ambience-accent)" opacity="0.28">
    {[0, 72, 144, 216, 288].map((angle) => (
      <ellipse key={angle} cx="0" cy="-6" rx="4" ry="6" transform={`rotate(${angle})`} />
    ))}
  </g>
);

const Petal: React.FC<{ className: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 20 20" focusable="false">
    <path d="M10 2 C15 5 17 11 10 18 C3 11 5 5 10 2 Z" fill="var(--ambience-accent)" opacity="0.4" />
  </svg>
);
