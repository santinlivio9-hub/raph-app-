import type { GameState, ParticipantIndex } from '../game/types';
import { AnimatedNumber } from './fx';

/** Bandeau du haut : budgets des deux participants, joker, budget max jouable. */
export function BudgetBar({ game, maxPlayable, active }: { game: GameState; maxPlayable?: [number, number]; active?: ParticipantIndex | null }) {
  const isAuction = game.config.mode === 'enchere';
  return (
    <div className="grid grid-cols-2 gap-2">
      {([0, 1] as const).map((p) => {
        const part = game.participants[p];
        const team = game.teams[p];
        const filled = Object.keys(team.lineup).length;
        return (
          <div
            key={p}
            className={`rounded-2xl border bg-night-2 px-3 py-2 transition ${active === p ? 'border-gold' : 'border-line'}`}
            style={{ boxShadow: `inset 3px 0 0 ${part.color}` }}
          >
            <div className="flex items-center justify-between gap-1 text-sm">
              <span className="truncate font-semibold">
                {part.isBot && <span aria-label="bot">🤖 </span>}
                {part.name}
              </span>
              <span className="shrink-0 text-xs text-muted">{filled}/11</span>
            </div>
            {isAuction ? (
              <>
                <div className="font-display text-3xl leading-tight text-gold">
                  <AnimatedNumber value={team.budget} /> <span className="text-lg">M€</span>
                </div>
                <div className="flex items-center justify-between text-[11px] text-muted">
                  <span>{maxPlayable ? `Max jouable ${maxPlayable[p]} M€` : ' '}</span>
                  <span title="Joker" aria-label={team.jokers ? 'Joker disponible' : 'Joker utilisé'} className={team.jokers ? '' : 'opacity-30 grayscale'}>
                    🃏
                  </span>
                </div>
              </>
            ) : (
              <div className="flex items-center justify-between text-xs text-muted">
                <span>Draft</span>
                {game.config.draftReroll && (
                  <span aria-label={team.rerolls ? 'Relance disponible' : 'Relance utilisée'} className={team.rerolls ? '' : 'opacity-30 grayscale'}>
                    🔄 {team.rerolls}
                  </span>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
