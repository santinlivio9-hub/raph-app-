import { animate, motion } from 'framer-motion';
import { useEffect, useMemo, useRef, useState } from 'react';

/** Nombre qui défile jusqu'à sa nouvelle valeur (compteur de budget). */
export function AnimatedNumber({ value, suffix = '', className = '' }: { value: number; suffix?: string; className?: string }) {
  const [display, setDisplay] = useState(value);
  const prev = useRef(value);
  useEffect(() => {
    const controls = animate(prev.current, value, {
      duration: 0.9,
      ease: 'easeOut',
      onUpdate: (v) => setDisplay(Math.round(v)),
    });
    prev.current = value;
    return () => controls.stop();
  }, [value]);
  return (
    <span className={className} aria-live="polite">
      {display}
      {suffix}
    </span>
  );
}

/** Minuteur circulaire. */
export function Timer({ remaining, total }: { remaining: number; total: number }) {
  const r = 26;
  const c = 2 * Math.PI * r;
  const ratio = Math.max(0, Math.min(1, remaining / total));
  const urgent = remaining <= 3;
  return (
    <div className="relative grid h-16 w-16 place-items-center" role="timer" aria-label={`${Math.ceil(remaining)} secondes restantes`}>
      <svg viewBox="0 0 64 64" className="absolute inset-0 -rotate-90">
        <circle cx="32" cy="32" r={r} fill="none" stroke="#263142" strokeWidth="6" />
        <circle
          cx="32"
          cy="32"
          r={r}
          fill="none"
          stroke={urgent ? '#FF4D5E' : '#F5C542'}
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - ratio)}
          style={{ transition: 'stroke-dashoffset 0.1s linear' }}
        />
      </svg>
      <span className={`font-display text-2xl ${urgent ? 'text-alert' : 'text-white'}`}>{Math.ceil(remaining)}</span>
    </div>
  );
}

/** Tampon « ADJUGÉ ! » avec le marteau. */
export function GavelStamp({ text = 'ADJUGÉ !' }: { text?: string }) {
  return (
    <div className="relative flex items-center justify-center gap-3" aria-live="assertive">
      <motion.span
        className="text-5xl"
        aria-hidden
        initial={{ rotate: -60, y: -10 }}
        animate={{ rotate: [-60, 20, 0], y: [-10, 4, 0] }}
        transition={{ duration: 0.45, times: [0, 0.7, 1] }}
        style={{ originX: 0.8, originY: 0.8 }}
      >
        🔨
      </motion.span>
      <motion.span
        className="font-display rounded-xl border-4 border-gold px-4 py-1 text-5xl text-gold"
        initial={{ scale: 2.6, opacity: 0, rotate: -12 }}
        animate={{ scale: 1, opacity: 1, rotate: -6 }}
        transition={{ type: 'spring', stiffness: 380, damping: 16, delay: 0.25 }}
      >
        {text}
      </motion.span>
    </div>
  );
}

const CONFETTI_COLORS = ['#F5C542', '#3DFF8C', '#FF4D5E', '#7AD7FF', '#FF7AD9', '#ffffff'];

export function Confetti({ count = 70 }: { count?: number }) {
  const pieces = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        delay: Math.random() * 0.6,
        duration: 2.2 + Math.random() * 1.8,
        drift: (Math.random() - 0.5) * 160,
        rotate: Math.random() * 720,
        color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
        w: 6 + Math.random() * 6,
      })),
    [count],
  );
  return (
    <div className="pointer-events-none fixed inset-0 z-40 overflow-hidden" aria-hidden>
      {pieces.map((p) => (
        <motion.span
          key={p.id}
          className="absolute top-0 block rounded-sm"
          style={{ left: `${p.x}%`, width: p.w, height: p.w * 0.45, background: p.color }}
          initial={{ y: -20, x: 0, rotate: 0, opacity: 1 }}
          animate={{ y: '105vh', x: p.drift, rotate: p.rotate, opacity: [1, 1, 0.8] }}
          transition={{ duration: p.duration, delay: p.delay, ease: 'easeIn' }}
        />
      ))}
    </div>
  );
}
