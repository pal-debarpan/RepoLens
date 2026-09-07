import React, { useEffect, useRef } from 'react';
import { useApp } from '../../context';

interface DoodleItem {
  id: string;
  type: string;
  size: number;
  opacity: number;
  rot: number;
  cx: number;
  cy: number;
}

/* ---------- Icon Library (every icon uses 0 0 100 100 viewBox) ---------- */
const ICONS: Record<string, React.ReactNode> = {
  lens: (
    <>
      <circle cx="40" cy="40" r="26" fill="none" stroke="currentColor" strokeWidth="4" />
      <line x1="59" y1="59" x2="82" y2="82" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
    </>
  ),

  bracket: (
    <path
      d="M60 8 C32 20 32 44 44 50 C32 56 32 80 60 92"
      fill="none"
      stroke="currentColor"
      strokeWidth="5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  ),

  slashcode: (
    <>
      <line x1="30" y1="82" x2="70" y2="18" stroke="currentColor" strokeWidth="5" strokeLinecap="round" />
      <line x1="12" y1="55" x2="24" y2="45" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
      <line x1="76" y1="55" x2="88" y2="45" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
    </>
  ),

  gitbranch: (
    <>
      <circle cx="22" cy="18" r="7" fill="currentColor" />
      <circle cx="22" cy="82" r="7" fill="currentColor" />
      <circle cx="78" cy="50" r="7" fill="currentColor" />
      <line x1="22" y1="25" x2="22" y2="75" stroke="currentColor" strokeWidth="4" />
      <path d="M22 46 C22 56 60 56 78 50" fill="none" stroke="currentColor" strokeWidth="4" />
    </>
  ),

  terminal: (
    <>
      <rect x="8" y="18" width="84" height="64" rx="8" fill="none" stroke="currentColor" strokeWidth="4" />
      <line x1="16" y1="34" x2="84" y2="34" stroke="currentColor" strokeWidth="3" opacity=".6" />
      <path d="M24 52 L40 63 L24 74" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
      <line x1="50" y1="74" x2="72" y2="74" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
    </>
  ),

  blast: (
    <>
      <circle cx="50" cy="50" r="8" fill="none" stroke="currentColor" strokeWidth="3" />
      <circle cx="50" cy="50" r="20" fill="none" stroke="currentColor" strokeWidth="3" opacity=".7" />
      <circle cx="50" cy="50" r="33" fill="none" stroke="currentColor" strokeWidth="3" opacity=".4" />
      <circle cx="50" cy="50" r="46" fill="none" stroke="currentColor" strokeWidth="3" opacity=".2" />
    </>
  ),

  tree: (
    <>
      <circle cx="50" cy="12" r="6" fill="currentColor" />
      <circle cx="20" cy="48" r="6" fill="currentColor" />
      <circle cx="78" cy="48" r="6" fill="currentColor" />
      <circle cx="6" cy="88" r="5" fill="currentColor" />
      <circle cx="34" cy="90" r="5" fill="currentColor" />
      <line x1="50" y1="18" x2="22" y2="43" stroke="currentColor" strokeWidth="3" />
      <line x1="50" y1="18" x2="76" y2="43" stroke="currentColor" strokeWidth="3" />
      <line x1="20" y1="54" x2="8" y2="83" stroke="currentColor" strokeWidth="3" />
      <line x1="20" y1="54" x2="33" y2="85" stroke="currentColor" strokeWidth="3" />
    </>
  ),

  folder: (
    <path
      d="M8 30 h28 l8 10 h48 v46 a6 6 0 0 1-6 6 H14 a6 6 0 0 1-6-6 Z"
      fill="none"
      stroke="currentColor"
      strokeWidth="4"
      strokeLinejoin="round"
    />
  ),

  bug: (
    <>
      <ellipse cx="50" cy="55" rx="20" ry="26" fill="none" stroke="currentColor" strokeWidth="4" />
      <line x1="50" y1="29" x2="50" y2="81" stroke="currentColor" strokeWidth="3" />
      <line x1="22" y1="38" x2="10" y2="26" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      <line x1="78" y1="38" x2="90" y2="26" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      <line x1="18" y1="55" x2="4" y2="55" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      <line x1="82" y1="55" x2="96" y2="55" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      <line x1="22" y1="74" x2="10" y2="86" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      <line x1="78" y1="74" x2="90" y2="86" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      <path d="M34 30 a16 14 0 0 1 32 0" fill="none" stroke="currentColor" strokeWidth="4" />
    </>
  ),

  chip: (
    <>
      <rect x="26" y="26" width="48" height="48" rx="4" fill="none" stroke="currentColor" strokeWidth="4" />
      <rect x="40" y="40" width="20" height="20" rx="2" fill="none" stroke="currentColor" strokeWidth="3" opacity=".7" />
      <line x1="14" y1="38" x2="26" y2="38" stroke="currentColor" strokeWidth="3" />
      <line x1="14" y1="62" x2="26" y2="62" stroke="currentColor" strokeWidth="3" />
      <line x1="74" y1="38" x2="86" y2="38" stroke="currentColor" strokeWidth="3" />
      <line x1="74" y1="62" x2="86" y2="62" stroke="currentColor" strokeWidth="3" />
      <line x1="38" y1="14" x2="38" y2="26" stroke="currentColor" strokeWidth="3" />
      <line x1="62" y1="14" x2="62" y2="26" stroke="currentColor" strokeWidth="3" />
      <line x1="38" y1="74" x2="38" y2="86" stroke="currentColor" strokeWidth="3" />
      <line x1="62" y1="74" x2="62" y2="86" stroke="currentColor" strokeWidth="3" />
    </>
  ),

  hash: (
    <>
      <line x1="30" y1="14" x2="22" y2="86" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
      <line x1="70" y1="14" x2="62" y2="86" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
      <line x1="14" y1="36" x2="86" y2="36" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
      <line x1="10" y1="64" x2="82" y2="64" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
    </>
  ),

  cursorArrow: (
    <path
      d="M20 12 L20 80 L38 64 L48 86 L58 82 L48 60 L74 60 Z"
      fill="currentColor"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinejoin="round"
      opacity=".9"
    />
  ),

  radar: (
    <>
      <circle cx="50" cy="50" r="36" fill="none" stroke="currentColor" strokeWidth="3" opacity=".5" />
      <circle cx="50" cy="50" r="22" fill="none" stroke="currentColor" strokeWidth="2.5" opacity=".35" />
      <g className="doodle-radar-sweep">
        <line x1="50" y1="50" x2="50" y2="14" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      </g>
      <circle cx="50" cy="50" r="3" fill="currentColor" />
    </>
  ),

  cube: (
    <>
      <path d="M50 8 L88 28 V72 L50 92 L12 72 V28 Z" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinejoin="round" />
      <path d="M50 8 V52 M12 28 L50 52 L88 28" fill="none" stroke="currentColor" strokeWidth="3" opacity=".6" />
      <path d="M50 52 V92" stroke="currentColor" strokeWidth="3" opacity=".6" />
    </>
  ),

  dots: (
    <>
      <circle cx="20" cy="20" r="3.5" fill="currentColor" />
      <circle cx="50" cy="20" r="3.5" fill="currentColor" />
      <circle cx="80" cy="20" r="3.5" fill="currentColor" />
      <circle cx="20" cy="50" r="3.5" fill="currentColor" />
      <circle cx="50" cy="50" r="3.5" fill="currentColor" />
      <circle cx="80" cy="50" r="3.5" fill="currentColor" />
      <circle cx="20" cy="80" r="3.5" fill="currentColor" />
      <circle cx="50" cy="80" r="3.5" fill="currentColor" />
      <circle cx="80" cy="80" r="3.5" fill="currentColor" />
    </>
  ),

  plus: (
    <>
      <line x1="50" y1="18" x2="50" y2="82" stroke="currentColor" strokeWidth="5" strokeLinecap="round" />
      <line x1="18" y1="50" x2="82" y2="50" stroke="currentColor" strokeWidth="5" strokeLinecap="round" />
    </>
  ),

  arrowSmall: (
    <>
      <line x1="16" y1="50" x2="76" y2="50" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
      <path d="M58 32 L80 50 L58 68" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
    </>
  ),

  zap: (
    <path
      d="M54 10 L22 54 H48 L44 90 L80 44 H52 Z"
      fill="none"
      stroke="currentColor"
      strokeWidth="4"
      strokeLinejoin="round"
    />
  ),

  database: (
    <>
      <ellipse cx="50" cy="24" rx="34" ry="12" fill="none" stroke="currentColor" strokeWidth="4" />
      <path d="M16 24 V50 C16 57 31 62 50 62 C69 62 84 57 84 50 V24" fill="none" stroke="currentColor" strokeWidth="4" />
      <path d="M16 50 V76 C16 83 31 88 50 88 C69 88 84 83 84 76 V50" fill="none" stroke="currentColor" strokeWidth="4" />
    </>
  ),

  shield: (
    <path
      d="M50 14 L80 26 V52 C80 72 50 88 50 88 C50 88 20 72 20 52 V26 Z"
      fill="none"
      stroke="currentColor"
      strokeWidth="4"
      strokeLinejoin="round"
    />
  ),

  gitpull: (
    <>
      <circle cx="28" cy="24" r="7" fill="currentColor" />
      <circle cx="28" cy="76" r="7" fill="currentColor" />
      <circle cx="72" cy="38" r="7" fill="currentColor" />
      <line x1="28" y1="31" x2="28" y2="69" stroke="currentColor" strokeWidth="4" />
      <path d="M72 45 V60 C72 70 38 72 28 64" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
    </>
  ),

  spark: (
    <path
      d="M50 12 Q50 50 88 50 Q50 50 50 88 Q50 50 12 50 Q50 50 50 12 Z"
      fill="currentColor"
      opacity=".75"
    />
  ),

  pulse: (
    <polyline
      points="12,50 30,50 40,22 52,78 64,40 72,55 88,55"
      fill="none"
      stroke="currentColor"
      strokeWidth="4.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  ),

  network: (
    <>
      <circle cx="24" cy="30" r="8" fill="none" stroke="currentColor" strokeWidth="3.5" />
      <circle cx="76" cy="30" r="8" fill="none" stroke="currentColor" strokeWidth="3.5" />
      <circle cx="50" cy="74" r="8" fill="none" stroke="currentColor" strokeWidth="3.5" />
      <line x1="31" y1="34" x2="69" y2="34" stroke="currentColor" strokeWidth="3" />
      <line x1="28" y1="37" x2="45" y2="68" stroke="currentColor" strokeWidth="3" />
      <line x1="72" y1="37" x2="55" y2="68" stroke="currentColor" strokeWidth="3" />
    </>
  ),

  curlybrace: (
    <>
      <path
        d="M32 18 C22 18 20 28 20 38 C20 45 14 48 10 50 C14 52 20 55 20 62 C20 72 22 82 32 82"
        fill="none"
        stroke="currentColor"
        strokeWidth="4"
        strokeLinecap="round"
      />
      <path
        d="M68 18 C78 18 80 28 80 38 C80 45 86 48 90 50 C86 52 80 55 80 62 C80 72 78 82 68 82"
        fill="none"
        stroke="currentColor"
        strokeWidth="4"
        strokeLinecap="round"
      />
    </>
  ),
};

const FEATURES = [
  'lens',
  'gitbranch',
  'terminal',
  'blast',
  'tree',
  'chip',
  'bug',
  'folder',
  'cube',
  'radar',
  'database',
  'shield',
  'gitpull',
  'network',
  'pulse',
];

const FILLERS = [
  'plus',
  'dots',
  'hash',
  'slashcode',
  'bracket',
  'arrowSmall',
  'cursorArrow',
  'zap',
  'spark',
  'curlybrace',
];

function createPrng(seed: number) {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function buildDoodleField(): DoodleItem[] {
  const prng = createPrng(1337);
  const rand = (min: number, max: number) => prng() * (max - min) + min;
  const pick = <T,>(arr: T[]) => arr[Math.floor(prng() * arr.length)];
  const cols = 11;
  const rows = 8;
  const cellW = 100 / cols;
  const cellH = 100 / rows;
  const items: DoodleItem[] = [];
  let idx = 0;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (prng() < 0.05) continue;

      const isFeature = idx % 2 === 0;
      const type = isFeature ? pick(FEATURES) : pick(FILLERS);
      const size = isFeature ? rand(40, 62) : rand(22, 34);
      const opacity = isFeature ? rand(0.24, 0.44) : rand(0.14, 0.26);
      const rot = rand(-18, 18);

      const cx = cellW * c + cellW / 2 + rand(-cellW * 0.28, cellW * 0.28);
      const cy = cellH * r + cellH / 2 + rand(-cellH * 0.28, cellH * 0.28);

      items.push({
        id: `doodle-${r}-${c}-${idx}`,
        type,
        size,
        opacity,
        rot,
        cx,
        cy,
      });
      idx++;
    }
  }
  return items;
}

const STATIC_DOODLES = buildDoodleField();

export interface DoodleBackdropProps {
  className?: string;
}

/**
 * RepoLens Interactive Doodle Backdrop
 * 
 * Renders technical doodles behind the main dialog card:
 * - Ultra-responsive reaction even on fast cursor sweep (swept-volume segment interpolation)
 * - Zero-rerender direct DOM manipulation for maximum 120 FPS performance
 * - Reactive hover response (scales 1.35x, rotates, glows with signature brand accent)
 * - Cursor-following atmospheric ambient illumination
 * - Automatic dual-theme palette: Electric Lime in Dark Mode, Deep Emerald in Light Mode
 */
export const DoodleBackdrop: React.FC<DoodleBackdropProps> = ({ className = '' }) => {
  const { theme } = useApp();
  const isDark = theme !== 'light';

  const ambientRef = useRef<HTMLDivElement>(null);
  const doodleElsRef = useRef<(HTMLDivElement | null)[]>([]);
  const timeoutsRef = useRef<Map<number, number>>(new Map());
  const prevMouseRef = useRef<{ x: number; y: number } | null>(null);
  const doodles = STATIC_DOODLES;

  // Track cursor coordinates for atmospheric radial aura & fast-sweep reactive doodle wake
  useEffect(() => {
    const ambientEl = ambientRef.current;
    const timeouts = timeoutsRef.current;
    const doodleEls = doodleElsRef.current;

    const ambientColor = isDark
      ? 'rgba(182, 255, 46, 0.09)'
      : 'rgba(4, 106, 56, 0.08)';

    const handleMouseMove = (e: MouseEvent) => {
      const curX = e.clientX;
      const curY = e.clientY;
      const prev = prevMouseRef.current;
      prevMouseRef.current = { x: curX, y: curY };

      const winW = window.innerWidth;
      const winH = window.innerHeight;

      // Update ambient aura directly without triggering React re-renders
      if (ambientEl) {
        const pctX = (curX / winW) * 100;
        const pctY = (curY / winH) * 100;
        ambientEl.style.background = `radial-gradient(520px circle at ${pctX}% ${pctY}%, ${ambientColor}, transparent 70%)`;
      }

      // Segment distance interpolation for fast cursor movements
      const x1 = prev ? prev.x : curX;
      const y1 = prev ? prev.y : curY;
      const x2 = curX;
      const y2 = curY;
      const dx = x2 - x1;
      const dy = y2 - y1;
      const l2 = dx * dx + dy * dy;

      for (let i = 0; i < doodles.length; i++) {
        const el = doodleEls[i];
        if (!el) continue;

        const d = doodles[i];
        const px = (d.cx / 100) * winW;
        const py = (d.cy / 100) * winH;

        let dist: number;
        if (l2 === 0) {
          dist = Math.hypot(px - curX, py - curY);
        } else {
          let t = ((px - x1) * dx + (py - y1) * dy) / l2;
          t = Math.max(0, Math.min(1, t));
          dist = Math.hypot(px - (x1 + t * dx), py - (y1 + t * dy));
        }

        // Generous reaction threshold (radius + 28px buffer)
        const threshold = (d.size / 2) + 28;
        if (dist <= threshold) {
          if (!el.classList.contains('is-lit')) {
            el.classList.add('is-lit');
          }
          const existingTimer = timeouts.get(i);
          if (existingTimer) {
            window.clearTimeout(existingTimer);
          }
          const timer = window.setTimeout(() => {
            el.classList.remove('is-lit');
            timeouts.delete(i);
          }, 450);
          timeouts.set(i, timer);
        }
      }
    };

    const handleMouseLeave = () => {
      prevMouseRef.current = null;
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    window.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseleave', handleMouseLeave);
      timeouts.forEach((timer) => window.clearTimeout(timer));
      timeouts.clear();
    };
  }, [doodles, isDark]);

  return (
    <div className={`repolens-doodle-field ${className}`}>
      {/* Interactive Cursor-Tracking Ambient Glow */}
      <div
        ref={ambientRef}
        className="repolens-doodle-ambient"
        style={{
          background: isDark
            ? 'radial-gradient(520px circle at 50% 50%, rgba(182, 255, 46, 0.09), transparent 70%)'
            : 'radial-gradient(520px circle at 50% 50%, rgba(4, 106, 56, 0.08), transparent 70%)',
        }}
      />

      {/* Field of Interactive Doodles */}
      {doodles.map((d, idx) => (
        <div
          key={d.id}
          ref={(el) => {
            doodleElsRef.current[idx] = el;
          }}
          className="repolens-doodle"
          data-type={d.type}
          style={
            {
              left: `${d.cx}%`,
              top: `${d.cy}%`,
              '--rot': `${d.rot}deg`,
              '--op': d.opacity,
            } as React.CSSProperties
          }
        >
          <svg
            width={d.size}
            height={d.size}
            viewBox="0 0 100 100"
            className="transition-transform duration-300"
          >
            {ICONS[d.type]}
          </svg>
        </div>
      ))}
    </div>
  );
};

