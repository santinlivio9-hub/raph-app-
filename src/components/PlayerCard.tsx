import { motion } from 'framer-motion';
import { useState } from 'react';
import { flagOf } from '../data/countries';
import { displayName, initials } from '../game/db';
import type { Player, Rarete, StatsChamp, StatsGardien } from '../game/types';
import { photoOf } from '../lib/photos';
import { themeFor } from '../lib/themes';

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

/** Avatar de repli : initiales + silhouette aux couleurs (neutres) du club. */
export function Avatar({ player, size = 64, ring }: { player: Player; size?: number; ring?: string }) {
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
      <circle cx="32" cy="32" r="32" fill={clubColor(player.club)} />
      <circle cx="32" cy="24" r="11" fill="rgba(255,255,255,0.16)" />
      <path d="M10 60c2-13 11-20 22-20s20 7 22 20" fill="rgba(255,255,255,0.16)" />
      <text x="32" y="39" textAnchor="middle" fontFamily="Bebas Neue, Oswald, Impact, sans-serif" fontSize="24" fill="#fff">
        {initials(player)}
      </text>
    </svg>
  );
}

/** Photo ronde (terrain, listes) ; avatar si pas de photo ou si l'image ne charge pas. */
export function PlayerFace({ player, size = 44, ring }: { player: Player; size?: number; ring?: string }) {
  const photo = photoOf(player.id);
  const [failed, setFailed] = useState(false);
  if (!photo || failed) return <Avatar player={player} size={size} ring={ring} />;
  return (
    <img
      src={photo.url}
      alt={displayName(player)}
      width={size}
      height={size}
      loading="lazy"
      crossOrigin="anonymous"
      onError={() => setFailed(true)}
      className="shrink-0 rounded-full object-cover object-top"
      style={{ width: size, height: size, boxShadow: ring ? `0 0 0 2px ${ring}` : undefined, background: clubColor(player.club) }}
    />
  );
}

/** Grande photo de carte, détourée en bas par un masque dégradé. */
function CardPhoto({ player, avatarSize }: { player: Player; avatarSize: number }) {
  const photo = photoOf(player.id);
  const [failed, setFailed] = useState(false);
  if (!photo || failed) {
    return (
      <div className="grid h-full w-full place-items-center" style={{ background: `radial-gradient(circle at 50% 40%, ${clubColor(player.club)}, transparent 72%)` }}>
        <Avatar player={player} size={avatarSize} />
      </div>
    );
  }
  return (
    <img
      src={photo.url}
      alt={displayName(player)}
      loading="lazy"
      crossOrigin="anonymous"
      onError={() => setFailed(true)}
      className="h-full w-full object-cover object-top"
      style={{
        maskImage: 'linear-gradient(to bottom, black 62%, transparent 100%)',
        WebkitMaskImage: 'linear-gradient(to bottom, black 62%, transparent 100%)',
      }}
    />
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
export type CardMode = 'enchere' | 'draft';

const SIZES: Record<Size, { w: string; avatar: number; name: string; big: string; stat: string }> = {
  sm: { w: 'w-full max-w-[170px]', avatar: 56, name: 'text-[13px]', big: 'text-3xl', stat: 'text-sm' },
  md: { w: 'w-[210px]', avatar: 80, name: 'text-base', big: 'text-4xl', stat: 'text-base' },
  lg: { w: 'w-[240px]', avatar: 96, name: 'text-lg', big: 'text-5xl', stat: 'text-lg' },
};

/**
 * Carte joueur. En Enchères : photo, identité et valeur marché — jamais la note ni les stats.
 * En Draft : note générale, rareté et 6 stats.
 */
export function PlayerCard({ player, mode, size = 'md', selected }: { player: Player; mode: CardMode; size?: Size; selected?: boolean }) {
  const sz = SIZES[size];
  const theme = themeFor(player.competition);
  const elite = mode === 'draft' && player.rarete === 'elite';
  const label =
    mode === 'enchere'
      ? `${displayName(player)}, ${player.poste}, ${player.club}, valeur ${player.valeurMarche} millions`
      : `${displayName(player)}, note ${player.noteGenerale}, ${player.poste}, ${RARITY_LABEL[player.rarete]}`;
  return (
    <div
      className={`${elite ? 'rarity-elite holo' : ''} relative ${sz.w} aspect-[5/7] rounded-[18px] p-[3px] transition`}
      style={{
        background: elite ? 'var(--card-edge)' : `linear-gradient(150deg, ${theme.accent}, ${theme.accent}55 45%, ${theme.accent})`,
        boxShadow: selected ? '0 0 0 3px #3DFF8C, 0 10px 40px -8px rgba(61,255,140,0.6)' : `0 12px 30px -12px ${theme.accent}99`,
      }}
      aria-label={label}
      role="img"
    >
      <div className="relative flex h-full flex-col overflow-hidden rounded-[15px] bg-gradient-to-b from-night-3 to-night">
        {elite && <div className="holo-sheen pointer-events-none absolute inset-0 z-10" aria-hidden />}
        <div className="relative min-h-0 flex-1">
          <CardPhoto player={player} avatarSize={sz.avatar} />
          <div className="absolute left-2 top-1.5 flex flex-col items-start leading-none drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]">
            {mode === 'draft' && (
              <span className={`font-display ${sz.big} ${player.rarete === 'elite' || player.rarete === 'or' ? 'text-gold' : 'text-white'}`}>
                {player.noteGenerale}
              </span>
            )}
            <span className="font-display rounded px-1 text-base leading-tight" style={{ background: theme.accent, color: theme.onAccent }}>
              {player.poste}
            </span>
          </div>
          <span className="absolute right-2 top-1.5 text-xl drop-shadow" title={player.nationalite} aria-label={player.nationalite}>
            {flagOf(player.nationalite)}
          </span>
          {mode === 'draft' && (
            <span className="absolute bottom-1 right-2 rounded-full bg-black/60 px-1.5 text-[9px] font-bold uppercase tracking-wide text-white/85">
              {RARITY_LABEL[player.rarete]}
            </span>
          )}
        </div>
        <div className="px-2 pb-1.5 pt-0.5">
          <div className={`truncate text-center font-bold leading-tight ${sz.name}`}>{displayName(player)}</div>
          <div className="truncate text-center text-[11px] leading-tight text-muted">
            {player.club} · {player.age} ans
          </div>
          {mode === 'enchere' ? (
            <div className="mt-1 flex items-baseline justify-center gap-1 border-t border-white/10 pt-1">
              <span className={`font-display leading-none text-gold ${sz.big}`}>{player.valeurMarche}</span>
              <span className="font-display text-lg leading-none text-gold/80">M€</span>
            </div>
          ) : (
            <div className="mt-1 grid grid-cols-3 gap-x-1 border-t border-white/10 pt-1">
              {statList(player).map((s) => (
                <div key={s.key} className="flex items-baseline justify-center gap-0.5">
                  <span className={`font-display leading-none ${sz.stat}`}>{s.value}</span>
                  <span className="text-[8px] font-semibold text-muted">{s.label}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function CardBack({ size = 'md', label = '?' }: { size?: Size; label?: string }) {
  return (
    <div className={`relative ${SIZES[size].w} aspect-[5/7] rounded-[18px] p-[3px]`} style={{ background: 'linear-gradient(145deg,#a8791a,#f5c542,#8a6210)' }}>
      <div className="grid h-full place-items-center rounded-[15px] bg-[radial-gradient(circle_at_50%_40%,#1d2a3c,#0b0f14)]">
        <div className="text-center">
          <div className="font-display text-7xl text-gold drop-shadow-[0_0_20px_rgba(245,197,66,0.5)]">{label}</div>
          <div className="font-display text-xl text-white/80">Joueur mystère</div>
        </div>
      </div>
    </div>
  );
}

/** Carte qui se retourne : dos « mystère » puis face joueur (montée seulement une fois révélée). */
export function FlipCard({ player, revealed, mode, size = 'md' }: { player: Player; revealed: boolean; mode: CardMode; size?: Size }) {
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
          {revealed && <PlayerCard player={player} mode={mode} size={size} />}
        </div>
      </motion.div>
    </div>
  );
}
