import { useState } from 'react';
import { displayName, getPlayer } from '../game/db';
import { POSTE_LABEL, SLOTS, SLOT_POSTE } from '../game/formation';
import { perfScore } from '../game/performance';
import { computeTeamScore } from '../game/scoring';
import type { GameConfig, Participant, SlotId, TeamState } from '../game/types';
import { LinkLegend, Pitch } from './Pitch';
import { PlayerSheet } from './PlayerSheet';
import { Modal, TeamName } from './ui';

const VIA_LABEL = { enchere: 'Enchère', mystere: 'Mystère', joker: 'Joker', draft: 'Draft', cadeau: "D'office", brade: 'Bradé' } as const;

const fmt = (v: number, d = 1) => v.toFixed(d).replace('.', ',');

export function ScoreLine({ team, config }: { team: TeamState; config: GameConfig }) {
  const sc = computeTeamScore(team, config);
  const auction = config.mode === 'enchere';
  return (
    <dl className="grid grid-cols-3 gap-2 text-center">
      <div className="rounded-xl bg-night-3 py-1">
        <dt className="text-[11px] text-muted">{auction ? 'Perf moyenne' : 'Note générale'}</dt>
        <dd className="font-display text-2xl">{fmt(auction ? sc.perfMoyenne : sc.noteGenerale)}</dd>
      </div>
      <div className="rounded-xl bg-night-3 py-1">
        <dt className="text-[11px] text-muted">Collectif</dt>
        <dd className="font-display text-2xl">{Math.round(sc.collectif)}</dd>
      </div>
      <div className="rounded-xl bg-night-3 py-1">
        <dt className="text-[11px] text-muted">Score</dt>
        <dd className="font-display text-2xl text-gold">{fmt(sc.total)}</dd>
      </div>
    </dl>
  );
}

/** Badge du terrain selon le contexte : prix (enchère en cours), note (draft), perf (révélée). */
export function pitchBadge(config: GameConfig, reveal: boolean) {
  return (pick: { playerId: string; slot: SlotId; price: number }) => {
    if (config.mode === 'draft' && !reveal) return String(getPlayer(pick.playerId).noteGenerale);
    if (reveal) return String(Math.round(perfScore(getPlayer(pick.playerId), pick.slot)));
    return `${pick.price}`;
  };
}

/** Vue terrain d'un participant (fenêtre modale). */
export function TeamSheet({
  open,
  onClose,
  participant,
  team,
  config,
  reveal,
}: {
  open: boolean;
  onClose: () => void;
  participant: Participant;
  team: TeamState;
  config: GameConfig;
  /** Afficher notes et performances (fin de partie, ou Draft). */
  reveal: boolean;
}) {
  const [detail, setDetail] = useState<{ id: string; slot: SlotId } | null>(null);
  const showScores = reveal || config.mode === 'draft';
  const auction = config.mode === 'enchere';
  return (
    <>
      <Modal open={open && !detail} onClose={onClose} label={`Équipe ${participant.name}`}>
        <div className="mb-3 flex items-center justify-between">
          <TeamName name={participant.name} color={participant.color} className="font-display text-3xl" />
          <button onClick={onClose} className="min-h-[48px] px-3 text-muted" aria-label="Fermer">
            ✕
          </button>
        </div>
        <Pitch
          team={team}
          color={participant.color}
          label={`Terrain de ${participant.name}`}
          badge={pitchBadge(config, reveal)}
          onPlayer={(id) => setDetail({ id, slot: SLOTS.find((s) => team.lineup[s]?.playerId === id)! })}
        />
        <div className="my-3">
          <LinkLegend />
        </div>
        {showScores ? (
          <ScoreLine team={team} config={config} />
        ) : (
          <p className="rounded-xl bg-night-3 px-3 py-2 text-center text-sm text-muted">
            Budget restant <span className="font-display text-xl text-gold">{team.budget} M€</span> · les performances seront révélées à la fin
          </p>
        )}
        <ul className="mt-3 divide-y divide-line text-sm">
          {SLOTS.map((slot) => {
            const pick = team.lineup[slot];
            const p = pick && getPlayer(pick.playerId);
            return (
              <li key={slot}>
                <button
                  className="flex min-h-[44px] w-full items-center justify-between gap-2 py-1.5 text-left disabled:cursor-default"
                  disabled={!p}
                  onClick={() => p && setDetail({ id: p.id, slot })}
                >
                  <span className="w-10 shrink-0 font-display text-lg text-muted" title={POSTE_LABEL[SLOT_POSTE[slot]]}>
                    {SLOT_POSTE[slot]}
                  </span>
                  <span className="flex-1 truncate">{p ? displayName(p) : <span className="text-muted">— à pourvoir —</span>}</span>
                  {pick && auction && (
                    <span className="shrink-0 text-xs text-muted">
                      {VIA_LABEL[pick.via]} · {pick.price} M€
                    </span>
                  )}
                  {p && showScores && (
                    <span className="font-display w-9 text-right text-lg text-gold">
                      {auction ? Math.round(perfScore(p, slot)) : p.noteGenerale}
                    </span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </Modal>
      <PlayerSheet
        playerId={detail?.id ?? null}
        slot={detail?.slot}
        mode={config.mode}
        reveal={reveal}
        onClose={() => setDetail(null)}
      />
    </>
  );
}
