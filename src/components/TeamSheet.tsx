import { displayName, getPlayer } from '../game/db';
import { POSTE_LABEL, SLOTS, SLOT_POSTE } from '../game/formation';
import { computeTeamScore } from '../game/scoring';
import type { GameMode, Participant, TeamState } from '../game/types';
import { LinkLegend, Pitch } from './Pitch';
import { Modal, TeamName } from './ui';

const VIA_LABEL = { enchere: 'Enchère', mystere: 'Mystère', joker: 'Joker', draft: 'Draft', cadeau: 'Offert' } as const;

export function ScoreLine({ team, mode }: { team: TeamState; mode: GameMode }) {
  const sc = computeTeamScore(team, mode);
  return (
    <dl className="grid grid-cols-3 gap-2 text-center">
      <div className="rounded-xl bg-night-3 py-1">
        <dt className="text-[11px] text-muted">Note générale</dt>
        <dd className="font-display text-2xl">{sc.noteGenerale.toFixed(1)}</dd>
      </div>
      <div className="rounded-xl bg-night-3 py-1">
        <dt className="text-[11px] text-muted">Collectif</dt>
        <dd className="font-display text-2xl">{Math.round(sc.collectif)}</dd>
      </div>
      <div className="rounded-xl bg-night-3 py-1">
        <dt className="text-[11px] text-muted">Score</dt>
        <dd className="font-display text-2xl text-gold">{sc.total.toFixed(1)}</dd>
      </div>
    </dl>
  );
}

/** Vue terrain d'un participant (fenêtre modale). */
export function TeamSheet({
  open,
  onClose,
  participant,
  team,
  mode,
}: {
  open: boolean;
  onClose: () => void;
  participant: Participant;
  team: TeamState;
  mode: GameMode;
}) {
  return (
    <Modal open={open} onClose={onClose} label={`Équipe ${participant.name}`}>
      <div className="mb-3 flex items-center justify-between">
        <TeamName name={participant.name} color={participant.color} className="font-display text-3xl" />
        <button onClick={onClose} className="min-h-[48px] px-3 text-muted" aria-label="Fermer">
          ✕
        </button>
      </div>
      <Pitch team={team} color={participant.color} label={`Terrain de ${participant.name}`} />
      <div className="my-3">
        <LinkLegend />
      </div>
      <ScoreLine team={team} mode={mode} />
      <ul className="mt-3 divide-y divide-line text-sm">
        {SLOTS.map((slot) => {
          const pick = team.lineup[slot];
          const p = pick && getPlayer(pick.playerId);
          return (
            <li key={slot} className="flex items-center justify-between gap-2 py-1.5">
              <span className="w-10 shrink-0 font-display text-lg text-muted" title={POSTE_LABEL[SLOT_POSTE[slot]]}>
                {SLOT_POSTE[slot]}
              </span>
              <span className="flex-1 truncate">{p ? displayName(p) : <span className="text-muted">— à pourvoir —</span>}</span>
              {pick && p && (
                <span className="shrink-0 text-xs text-muted">
                  {VIA_LABEL[pick.via]}
                  {pick.price > 0 && ` · ${pick.price} M€`}
                </span>
              )}
              {p && <span className="font-display w-7 text-right text-lg text-gold">{p.note}</span>}
            </li>
          );
        })}
      </ul>
    </Modal>
  );
}
