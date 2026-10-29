import { MAIN_COMPETITIONS } from '../game/pool';
import { NIGHT_THEME, themeFor } from '../lib/themes';

/** Choix du pool de joueurs : toutes les compétitions, ou une seule (qui donne son thème à la partie). */
export function PoolPicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const options = [{ value: 'toutes', label: 'Toutes', theme: NIGHT_THEME }, ...MAIN_COMPETITIONS.map((c) => ({ value: c, label: c, theme: themeFor(c) }))];
  return (
    <fieldset className="py-2">
      <legend className="mb-2 font-medium">Pool de joueurs</legend>
      <div className="grid grid-cols-3 gap-2">
        {options.map((o) => (
          <button
            key={o.value}
            type="button"
            aria-pressed={o.value === value}
            onClick={() => onChange(o.value)}
            className={`relative min-h-[52px] overflow-hidden rounded-xl border-2 px-2 text-sm font-semibold transition ${
              o.value === value ? 'border-white' : 'border-transparent opacity-80 hover:opacity-100'
            }`}
            style={{ background: o.theme.background }}
          >
            <span className="absolute inset-0 bg-black/35" aria-hidden />
            <span className="relative flex items-center justify-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full" style={{ background: o.theme.accent }} aria-hidden />
              {o.label}
            </span>
          </button>
        ))}
      </div>
    </fieldset>
  );
}
