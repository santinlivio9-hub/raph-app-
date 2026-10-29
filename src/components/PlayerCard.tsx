import { motion } from 'framer-motion';
import { flagOf } from '../data/countries';
import { displayName, initials } from '../game/db';
import type { Player, Rarete, StatsChamp, StatsGardien } from '../game/types';

export const RARITY_LABEL: Record<Rarete, string> = { bronze: 'Bronze', argent: 'Argent', or: 'Or', elite: 'Élite' };

function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

/** Couleur neutre et stable pour un club (aucun logo ni couleur officielle). */
export function clubColor(club: string): string {
  return `hsl(${hash(club) % 360} 32% 34%)`;
}

export function Avatar({ player, size = 64, ring }: { player: Player; size?: number; ring?: string }) {
  const bg = clubColor(player.club);
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      role="img"
      aria-label={`Avatar de ${displayName(player)}`}
      className="shrink-0 rounded-full"
      style={ring ? { boxShadow: `0 0 0 2px ${ring}` } : undefined}
    >
      <circle cx="32" cy="32" r="32" fill={bg} />
      <circle cx="32" cy="24" r="11" fill="rgba(255,255,255,0.16)" />
      <path d="M10 60c2-13 11-20 22-20s20 7 22 20" fill="rgba(255,255,255,0.16)" />
      <text
        x="32"
        y="39"
        textAnchor="middle"
        fontFamily="Bebas Neue, Oswald, Impact, sans-serif"
        fontSize="24"
        fill="#fff"
        style={{ letterSpacing: '0.04em' }}
      >
        {initials(player)}
      </text>
    </svg>
  );
}

const FIELD_STATS: [keyof StatsChamp, string][] = [
  ['vit', 'VIT'],
  ['tir', 'TIR'],
  ['pas', 'PAS'],
  ['dri', 'DRI'],
  ['def', 'DÉF'],
  ['phy', 'PHY'],
];
const GK_STATS: [keyof StatsGardien, string][] = [
  ['plo', 'PLO'],
  ['mai', 'MAI'],
  ['deg', 'DÉG'],
  ['ref', 'RÉF'],
  ['vit', 'VIT'],
  ['pla', 'PLA'],
];

export function statList(p: Player): { key: string; label: string; value: number }[] {
  const s = p.stats as unknown as Record<string, number>;
  return (p.poste === 'GK' ? GK_STATS : FIELD_STATS).map(([key, label]) => ({ key, label, value: s[key] }));
}

type Size = 'sm' | 'md' | 'lg';

const SIZES: Record<Size, { w: string; note: string; avatar: number; name: string; pad: string; stat: string }> = {
  sm: { w: 'w-full max-w-[170px]', note: 'text-[28px]', avatar: 44, name: 'text-[13px]', pad: 'p-2', stat: 'text-sm' },
  md: { w: 'w-[200px]', note: 'text-4xl', avatar: 64, name: 'text-base', pad: 'p-3', stat: 'text-base' },
  lg: { w: 'w-[240px]', note: 'text-5xl', avatar: 80, name: 'text-lg', pad: 'p-3.5', stat: 'text-lg' },
};

export function PlayerCard({ player, size = 'md', selected }: { player: Player; size?: Size; selected?: boolean }) {
  const sz = SIZES[size];
  const sm = size === 'sm';
  const elite = player.rarete === 'elite';
  return (
    <div
      className={`rarity-${player.rarete} ${elite ? 'holo' : ''} relative ${sz.w} ${sm ? 'aspect-[4/5]' : 'aspect-[5/7]'} rounded-[18px] p-[3px] transition`}
      style={{
        background: 'var(--card-edge)',
        boxShadow: selected ? '0 0 0 3px #3DFF8C, 0 10px 40px -8px rgba(61,255,140,0.6)' : '0 12px 32px -10px var(--card-glow)',
      }}
      aria-label={`${displayName(player)}, note ${player.note}, ${player.poste}, ${RARITY_LABEL[player.rarete]}`}
    >
      <div className={`relative flex h-full flex-col overflow-hidden rounded-[15px] bg-gradient-to-b from-night-3 to-night ${sz.pad}`}>
        {elite && <div className="holo-sheen pointer-events-none absolute inset-0" aria-hidden />}
        <div className="flex items-start justify-between gap-1">
          <div className={sm ? 'flex items-center gap-1.5 leading-none' : 'leading-none'}>
            <div className={`font-display leading-none ${sz.note} ${elite || player.rarete === 'or' ? 'text-gold' : 'text-white'}`}>{player.note}</div>
            <div className={sm ? 'flex flex-col items-start' : ''}>
              <div className={`font-display leading-none text-white/90 ${sm ? 'text-sm' : 'text-lg'}`}>{player.poste}</div>
              <div className={`leading-none ${sm ? 'text-sm' : 'mt-1 text-lg'}`} aria-label={player.nationalite} title={player.nationalite}>
                {flagOf(player.nationalite)}
              </div>
            </div>
          </div>
          <span className={`rounded-full bg-black/40 font-bold uppercase tracking-wide text-white/80 ${sm ? 'px-1.5 text-[9px]' : 'px-2 py-0.5 text-[10px]'}`}>
            {RARITY_LABEL[player.rarete]}
          </span>
        </div>
        <div className={`flex justify-center ${sm ? 'mt-1' : '-mt-3'}`}>
          <Avatar player={player} size={sz.avatar} />
        </div>
        <div className={`mt-1 truncate text-center font-bold leading-tight ${sz.name}`}>{displayName(player)}</div>
        <div className="truncate text-center text-[11px] leading-tight text-muted">
          {player.club} · {player.age} ans
        </div>
        <div className="mt-auto grid grid-cols-3 gap-x-1 gap-y-0.5 border-t border-white/10 pt-1">
          {statList(player).map((s) => (
            <div key={s.key} className="flex items-baseline justify-center gap-0.5">
              <span className={`font-display leading-none ${sz.stat}`}>{s.value}</span>
              <span className="text-[8px] font-semibold text-muted">{s.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function CardBack({ size = 'md', label = '?' }: { size?: Size; label?: string }) {
  return (
    <div className={`relative ${SIZES[size].w} ${size === 'sm' ? 'aspect-[4/5]' : 'aspect-[5/7]'} rounded-[18px] p-[3px]`} style={{ background: 'linear-gradient(145deg,#a8791a,#f5c542,#8a6210)' }}>
      <div className="grid h-full place-items-center rounded-[15px] bg-[radial-gradient(circle_at_50%_40%,#1d2a3c,#0b0f14)]">
        <div className="text-center">
          <div className="font-display text-7xl text-gold drop-shadow-[0_0_20px_rgba(245,197,66,0.5)]">{label}</div>
          <div className="font-display text-xl text-white/80">Joueur mystère</div>
        </div>
      </div>
    </div>
  );
}

/** Carte qui se retourne : dos « mystère » puis face joueur. */
export function FlipCard({ player, revealed, size = 'md' }: { player: Player; revealed: boolean; size?: Size }) {
  return (
    <div style={{ perspective: 1200 }}>
      <motion.div
        className="relative"
        style={{ transformStyle: 'preserve-3d' }}
        initial={false}
        animate={{ rotateY: revealed ? 180 : 0 }}
        transition={{ duration: 0.8, ease: [0.2, 0.8, 0.2, 1] }}
      >
        <div style={{ backfaceVisibility: 'hidden' }}>
          <CardBack size={size} />
        </div>
        <div className="absolute inset-0" style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}>
          {revealed && <PlayerCard player={player} size={size} />}
        </div>
      </motion.div>
    </div>
  );
}
