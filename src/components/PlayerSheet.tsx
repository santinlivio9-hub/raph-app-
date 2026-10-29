import { flagOf } from '../data/countries';
import { displayName, getPlayer } from '../game/db';
import { COMPONENT_LABEL, perfBreakdown } from '../game/performance';
import type { SlotId } from '../game/types';
import { photoOf } from '../lib/photos';
import { type CardMode, PlayerCard } from './PlayerCard';
import { Modal } from './ui';

export function PhotoCredit({ playerId, className = '' }: { playerId: string; className?: string }) {
  const photo = photoOf(playerId);
  if (!photo) return <p className={`text-[11px] text-muted ${className}`}>Pas de photo libre disponible : avatar généré.</p>;
  return (
    <p className={`text-[11px] leading-snug text-muted ${className}`}>
      Photo : {photo.auteur} —{' '}
      {photo.licenceUrl ? (
        <a href={photo.licenceUrl} target="_blank" rel="noreferrer" className="underline">
          {photo.licence}
        </a>
      ) : (
        photo.licence
      )}
      , via{' '}
      <a href={photo.source} target="_blank" rel="noreferrer" className="underline">
        Wikimedia Commons
      </a>
    </p>
  );
}

/**
 * Fiche détaillée d'un joueur. `reveal` = on peut montrer la note et les performances
 * (Draft, ou fin de partie Enchères). Pendant une enchère, on reste à l'instinct.
 */
export function PlayerSheet({
  playerId,
  slot,
  mode,
  reveal,
  onClose,
}: {
  playerId: string | null;
  slot?: SlotId;
  mode: CardMode;
  reveal: boolean;
  onClose: () => void;
}) {
  const p = playerId ? getPlayer(playerId) : null;
  return (
    <Modal open={!!p} onClose={onClose} label={p ? `Fiche de ${displayName(p)}` : 'Fiche joueur'}>
      {p && (
        <div className="flex flex-col items-center gap-3">
          <div className="flex w-full justify-end">
            <button onClick={onClose} className="min-h-[48px] px-3 text-muted" aria-label="Fermer">
              ✕
            </button>
          </div>
          <PlayerCard player={p} mode={mode} size="lg" />
          <dl className="grid w-full grid-cols-2 gap-2 text-sm">
            {[
              ['Club', p.club],
              ['Compétition', p.competition],
              ['Nationalité', `${flagOf(p.nationalite)} ${p.nationalite}`],
              ['Âge', `${p.age} ans`],
              ['Valeur marché', `${p.valeurMarche} M€`],
              ['Postes', [p.poste, ...p.postesSecondaires].join(' · ')],
            ].map(([k, v]) => (
              <div key={k} className="rounded-xl bg-night-3 px-3 py-2">
                <dt className="text-[11px] text-muted">{k}</dt>
                <dd className="truncate font-semibold">{v}</dd>
              </div>
            ))}
          </dl>
          {reveal ? <PerfTable playerId={p.id} slot={slot} /> : <p className="text-center text-sm text-muted">Performances révélées à la fin de la partie.</p>}
          <PhotoCredit playerId={p.id} className="w-full" />
        </div>
      )}
    </Modal>
  );
}

export function PerfTable({ playerId, slot }: { playerId: string; slot?: SlotId }) {
  const p = getPlayer(playerId);
  const f = p.perf;
  const b = perfBreakdown(p, slot);
  const stats: [string, number | string][] = [
    ['Matchs', f.matchs],
    ['Minutes', f.minutes],
    ['Buts', f.buts],
    ['Passes D.', f.passesD],
    ...(p.poste === 'GK' ? ([['Arrêts', f.arrets]] as [string, number][]) : ([['Tacles', f.tacles], ['Interc.', f.interceptions]] as [string, number][])),
    ...(['GK', 'DC', 'DG', 'DD'].includes(p.poste) ? ([['Clean sheets', f.cleanSheets]] as [string, number][]) : []),
    ['Note moy.', f.noteMoyenne.toFixed(1).replace('.', ',')],
  ];
  return (
    <section className="w-full rounded-2xl border border-line bg-night-2 p-3" aria-label="Performances">
      <div className="mb-2 flex items-baseline justify-between">
        <h3 className="font-display text-xl">Saison {f.saison}</h3>
        <span className="font-display text-3xl text-neon">{b.score.toFixed(1).replace('.', ',')}</span>
      </div>
      <div className="grid grid-cols-4 gap-1 text-center">
        {stats.map(([k, v]) => (
          <div key={k} className="rounded-lg bg-night-3 py-1">
            <div className="font-display text-xl leading-none">{v}</div>
            <div className="text-[10px] text-muted">{k}</div>
          </div>
        ))}
      </div>
      <ul className="mt-2 space-y-1 text-xs">
        {b.components.map((c) => (
          <li key={c.key} className="flex items-center gap-2">
            <span className="w-28 shrink-0 text-muted">
              {COMPONENT_LABEL[c.key]} ({Math.round(c.weight * 100)} %)
            </span>
            <span className="h-2 flex-1 overflow-hidden rounded-full bg-night-3">
              <span className="block h-full rounded-full bg-neon" style={{ width: `${c.value * 100}%` }} />
            </span>
          </li>
        ))}
      </ul>
      {(b.minutesFactor < 1 || b.positionPenalty > 0) && (
        <p className="mt-2 text-[11px] text-[#ffb3ba]">
          {b.minutesFactor < 1 && `Temps de jeu faible : ×${b.minutesFactor.toFixed(2).replace('.', ',')}. `}
          {b.positionPenalty > 0 && `Hors poste : −${b.positionPenalty}.`}
        </p>
      )}
      <p className="mt-2 text-[10px] text-muted">Statistiques de championnat approximatives (voir README).</p>
    </section>
  );
}
