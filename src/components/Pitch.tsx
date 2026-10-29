import { AnimatePresence, motion } from 'framer-motion';
import { displayName, getPlayer } from '../game/db';
import { SLOTS, SLOT_COORDS, SLOT_POSTE } from '../game/formation';
import { type LinkStrength, positionPenalty, teamLinks } from '../game/scoring';
import type { SlotId, TeamState } from '../game/types';
import { Avatar } from './PlayerCard';

export const LINK_STYLE: Record<LinkStrength, { color: string; dash?: string; width: number; label: string }> = {
  fort: { color: '#3DFF8C', width: 4, label: 'Même club (lien fort)' },
  moyen: { color: '#FF9F43', dash: '8 5', width: 3, label: 'Même nationalité (lien moyen)' },
  faible: { color: '#FF4D5E', dash: '2 6', width: 2.5, label: 'Même ligue (lien faible)' },
  aucun: { color: 'rgba(255,255,255,0.22)', dash: '1 7', width: 1.5, label: 'Aucun lien' },
};

function PitchLines() {
  return (
    <svg viewBox="0 0 100 140" preserveAspectRatio="none" className="absolute inset-0 h-full w-full" aria-hidden>
      <g fill="none" stroke="rgba(255,255,255,0.28)" strokeWidth="0.5">
        <rect x="3" y="3" width="94" height="134" rx="1" />
        <line x1="3" y1="70" x2="97" y2="70" />
        <circle cx="50" cy="70" r="11" />
        <rect x="24" y="3" width="52" height="20" />
        <rect x="37" y="3" width="26" height="7" />
        <rect x="24" y="117" width="52" height="20" />
        <rect x="37" y="130" width="26" height="7" />
        <path d="M40 23 a11 11 0 0 0 20 0" />
        <path d="M40 117 a11 11 0 0 1 20 0" />
      </g>
    </svg>
  );
}

export function Pitch({
  team,
  color,
  mini = false,
  showLinks = true,
  highlight,
  label,
}: {
  team: TeamState;
  color: string;
  mini?: boolean;
  showLinks?: boolean;
  highlight?: SlotId | null;
  label?: string;
}) {
  const links = showLinks ? teamLinks(team.lineup) : [];
  const token = mini ? 'h-6 w-6' : 'h-11 w-11';
  return (
    <div
      className={`turf relative w-full overflow-hidden rounded-2xl border border-white/10 ${mini ? 'aspect-[100/120]' : 'aspect-[100/135]'}`}
      role="img"
      aria-label={label ?? 'Terrain 4-3-3'}
    >
      <PitchLines />
      {showLinks && (
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 h-full w-full" aria-hidden>
          {links.map((l) => {
            const a = SLOT_COORDS[l.a];
            const b = SLOT_COORDS[l.b];
            const st = LINK_STYLE[l.strength];
            return (
              <motion.line
                key={`${l.a}-${l.b}`}
                x1={a.x}
                y1={a.y}
                x2={b.x}
                y2={b.y}
                stroke={st.color}
                strokeWidth={mini ? Math.max(1, st.width / 2) : st.width}
                strokeDasharray={mini ? st.dash?.replace(/\d+/g, (n) => String(Math.ceil(+n / 2))) : st.dash}
                strokeLinecap="round"
                vectorEffect="non-scaling-stroke"
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.95 }}
              />
            );
          })}
        </svg>
      )}
      {SLOTS.map((slot) => {
        const pick = team.lineup[slot];
        const c = SLOT_COORDS[slot];
        const isHi = highlight === slot;
        return (
          <div
            key={slot}
            className="absolute flex -translate-x-1/2 -translate-y-1/2 flex-col items-center"
            style={{ left: `${c.x}%`, top: `${c.y}%`, width: mini ? '22%' : '24%' }}
          >
            <AnimatePresence mode="popLayout">
              {pick ? (
                <motion.div
                  key={pick.playerId}
                  className="flex w-full flex-col items-center"
                  initial={{ opacity: 0, y: -30, scale: 0.6 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ type: 'spring', stiffness: 260, damping: 20 }}
                >
                  <PlayerToken slot={slot} playerId={pick.playerId} color={color} mini={mini} />
                </motion.div>
              ) : (
                <motion.div
                  key="empty"
                  className={`${token} grid place-items-center rounded-full border-2 border-dashed ${
                    isHi ? 'border-gold bg-gold/20' : 'border-white/45 bg-black/20'
                  }`}
                  animate={isHi ? { scale: [1, 1.12, 1] } : { scale: 1 }}
                  transition={isHi ? { repeat: Infinity, duration: 1.4 } : undefined}
                >
                  <span className={`font-display ${mini ? 'text-[9px]' : 'text-sm'} text-white/80`}>{SLOT_POSTE[slot]}</span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}

function PlayerToken({ slot, playerId, color, mini }: { slot: SlotId; playerId: string; color: string; mini: boolean }) {
  const p = getPlayer(playerId);
  const penalty = positionPenalty(p, slot);
  if (mini) {
    return (
      <div className="relative">
        <Avatar player={p} size={24} ring={color} />
        <span className="font-display absolute -bottom-1 -right-2 rounded bg-night px-0.5 text-[9px] leading-tight text-gold">{p.note}</span>
      </div>
    );
  }
  return (
    <>
      <div className="relative">
        <Avatar player={p} size={44} ring={color} />
        <span className="font-display absolute -right-3 -top-1 rounded-md bg-night px-1 text-sm leading-tight text-gold ring-1 ring-gold/40">
          {p.note}
        </span>
        {penalty > 0 && (
          <span className="absolute -bottom-1 -left-3 rounded bg-alert px-1 text-[10px] font-bold" title="Pénalité de poste">
            −{penalty}
          </span>
        )}
      </div>
      <span className="mt-0.5 max-w-full truncate rounded bg-black/55 px-1 text-[11px] font-semibold leading-tight">{displayName(p).split(' ').slice(-1)[0]}</span>
    </>
  );
}

export function LinkLegend() {
  return (
    <ul className="grid grid-cols-1 gap-1 text-xs text-muted sm:grid-cols-2">
      {(['fort', 'moyen', 'faible'] as const).map((k) => (
        <li key={k} className="flex items-center gap-2">
          <svg width="34" height="8" aria-hidden>
            <line x1="2" y1="4" x2="32" y2="4" stroke={LINK_STYLE[k].color} strokeWidth="3" strokeDasharray={LINK_STYLE[k].dash} strokeLinecap="round" />
          </svg>
          {LINK_STYLE[k].label}
        </li>
      ))}
    </ul>
  );
}
