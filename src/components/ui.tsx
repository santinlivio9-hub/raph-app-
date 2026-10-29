import { AnimatePresence, motion } from 'framer-motion';
import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { sfx } from '../lib/feedback';

type Variant = 'gold' | 'neon' | 'danger' | 'ghost' | 'dark';

const VARIANTS: Record<Variant, string> = {
  gold: 'bg-gold text-night shadow-[0_6px_24px_-6px_rgba(245,197,66,0.6)] hover:brightness-110',
  neon: 'bg-neon text-night shadow-[0_6px_24px_-6px_rgba(61,255,140,0.55)] hover:brightness-110',
  danger: 'bg-alert text-white hover:brightness-110',
  ghost: 'bg-transparent text-white border border-line hover:bg-white/5',
  dark: 'bg-night-3 text-white border border-line hover:bg-night-2',
};

export function Button({
  variant = 'gold',
  className = '',
  children,
  onClick,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return (
    <button
      {...rest}
      onClick={(e) => {
        sfx.tap();
        onClick?.(e);
      }}
      className={`min-h-[52px] rounded-2xl px-5 font-semibold transition active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-40 disabled:active:scale-100 ${VARIANTS[variant]} ${className}`}
    >
      {children}
    </button>
  );
}

export function IconButton({ label, children, onClick }: { label: string; children: ReactNode; onClick: () => void }) {
  return (
    <button
      aria-label={label}
      title={label}
      onClick={onClick}
      className="grid h-12 w-12 place-items-center rounded-full border border-line bg-night-2 text-xl hover:bg-night-3 active:scale-95"
    >
      {children}
    </button>
  );
}

export function Page({ title, onBack, right, children }: { title?: string; onBack?: () => void; right?: ReactNode; children: ReactNode }) {
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col px-4 pt-[max(0.75rem,env(safe-area-inset-top))]">
      {(title || onBack) && (
        <header className="mb-3 flex items-center gap-3">
          {onBack && (
            <IconButton label="Retour" onClick={onBack}>
              ←
            </IconButton>
          )}
          <h1 className="font-display flex-1 truncate text-3xl text-white">{title}</h1>
          {right}
        </header>
      )}
      {children}
    </div>
  );
}

export function Toggle({ label, hint, checked, onChange }: { label: string; hint?: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex min-h-[52px] cursor-pointer items-center justify-between gap-4 py-2">
      <span>
        <span className="block font-medium">{label}</span>
        {hint && <span className="block text-sm text-muted">{hint}</span>}
      </span>
      <span className="relative inline-flex shrink-0 items-center">
        <input type="checkbox" className="peer sr-only" checked={checked} onChange={(e) => onChange(e.target.checked)} />
        <span className="h-8 w-14 rounded-full bg-night-3 ring-1 ring-line transition peer-checked:bg-neon/80" />
        <span className="absolute left-1 h-6 w-6 rounded-full bg-white transition peer-checked:translate-x-6" />
        <span className="sr-only">{checked ? 'activé' : 'désactivé'}</span>
      </span>
    </label>
  );
}

export function Segmented<T extends string | number>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
}) {
  return (
    <fieldset className="py-2">
      <legend className="mb-2 font-medium">{label}</legend>
      <div className="grid gap-1 rounded-2xl bg-night-3 p-1" style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}>
        {options.map((o) => (
          <button
            key={String(o.value)}
            type="button"
            aria-pressed={o.value === value}
            onClick={() => onChange(o.value)}
            className={`min-h-[44px] rounded-xl px-2 text-sm font-semibold transition ${
              o.value === value ? 'bg-gold text-night' : 'text-muted hover:text-white'
            }`}
          >
            {o.label}
          </button>
        ))}
      </div>
    </fieldset>
  );
}

export function Modal({ open, onClose, children, label }: { open: boolean; onClose: () => void; children: ReactNode; label: string }) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 backdrop-blur-sm sm:items-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          role="dialog"
          aria-modal="true"
          aria-label={label}
        >
          <motion.div
            className="safe-bottom max-h-[92dvh] w-full max-w-md overflow-y-auto rounded-t-3xl border border-line bg-night-2 p-4 sm:rounded-3xl"
            initial={{ y: 60 }}
            animate={{ y: 0 }}
            exit={{ y: 60 }}
            onClick={(e) => e.stopPropagation()}
          >
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function TeamName({ name, color, className = '' }: { name: string; color: string; className?: string }) {
  return (
    <span className={`inline-flex min-w-0 items-center gap-2 ${className}`}>
      <span className="h-3 w-3 shrink-0 rounded-full ring-2 ring-white/20" style={{ background: color }} aria-hidden />
      <span className="truncate">{name}</span>
    </span>
  );
}

export function Toast({ message }: { message: string | null }) {
  return (
    <AnimatePresence>
      {message && (
        <motion.div
          role="status"
          className="fixed left-1/2 top-4 z-50 w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 rounded-2xl border border-gold/40 bg-night-3 px-4 py-3 text-center font-semibold shadow-xl"
          initial={{ y: -40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -40, opacity: 0 }}
        >
          {message}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
