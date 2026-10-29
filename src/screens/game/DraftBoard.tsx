import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { PlayerCard } from '../../components/PlayerCard';
import { Button } from '../../components/ui';
import { botDraftAction } from '../../game/bot';
import { displayName, getPlayer } from '../../game/db';
import { canReroll, draftTurn, targetSlot } from '../../game/draft';
import { POSTE_LABEL, SLOT_POSTE } from '../../game/formation';
import { positionPenalty } from '../../game/scoring';
import type { GameState } from '../../game/types';
import { haptics, sfx } from '../../lib/feedback';
import { useGame } from '../../store/game';

export function DraftBoard({ game, onToast }: { game: GameState; onToast: (m: string) => void }) {
  const dispatch = useGame((s) => s.dispatch);
  const p = draftTurn(game);
  const part = game.participants[p];
  const offer = game.draft!.offer;
  const [selected, setSelected] = useState<string | null>(null);
  const pickIndex = game.draft!.pickIndex;

  useEffect(() => setSelected(null), [pickIndex, offer]);

  const pick = (id: string) => {
    sfx.bid();
    haptics.reveal();
    dispatch({ type: 'DRAFT_PICK', playerId: id });
  };

  // Tour du bot.
  useEffect(() => {
    if (!part.isBot) return;
    const t = window.setTimeout(() => {
      const action = botDraftAction(game, part.botLevel ?? 'moyen');
      if (!action) return;
      if (action.type === 'DRAFT_PICK') onToast(`${part.name} recrute ${displayName(getPlayer(action.playerId))}`);
      else onToast(`${part.name} relance la pioche`);
      dispatch(action);
    }, 1100);
    return () => window.clearTimeout(t);
    // Une décision par tirage de cartes.
  }, [pickIndex, offer.join(), part.isBot]);

  const chosen = selected ? getPlayer(selected) : null;
  const chosenSlot = chosen ? targetSlot(game, p, chosen) : null;

  return (
    <div className="flex flex-1 flex-col gap-2">
      <motion.div
        key={pickIndex}
        className="flex items-center justify-between rounded-2xl border px-3 py-2"
        style={{ borderColor: part.color, background: `${part.color}18` }}
        initial={{ x: p === 0 ? -30 : 30, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
      >
        <span className="font-display text-2xl">
          {part.isBot ? '🤖 ' : ''}À {part.name} de choisir
        </span>
        {canReroll(game) && !part.isBot && (
          <Button variant="dark" className="!min-h-[44px] !px-3 text-sm" onClick={() => dispatch({ type: 'DRAFT_REROLL' })}>
            🔄 Relancer
          </Button>
        )}
      </motion.div>

      <p className="text-center text-xs text-muted">
        {part.isBot ? 'Le bot étudie les cartes…' : 'Touche une carte puis valide — ou fais-la glisser vers le haut.'}
      </p>

      <div className="grid grid-cols-2 gap-3 px-2" role="listbox" aria-label="Cartes proposées">
          {offer.map((id, i) => {
            const pl = getPlayer(id);
            return (
              <motion.button
                key={`${pickIndex}-${id}`}
                role="option"
                aria-selected={selected === id}
                disabled={part.isBot}
                className="flex justify-center"
                initial={{ y: 40, opacity: 0, rotate: -4 }}
                animate={{ y: 0, opacity: 1, rotate: 0 }}
                transition={{ delay: i * 0.05 }}
                drag={part.isBot ? false : 'y'}
                dragConstraints={{ top: 0, bottom: 0 }}
                dragElastic={0.6}
                onDragEnd={(_, info) => {
                  if (info.offset.y < -70) pick(id);
                }}
                onClick={() => setSelected(id)}
              >
                <PlayerCard player={pl} size="sm" selected={selected === id} />
              </motion.button>
            );
          })}
      </div>

      <div className="sticky bottom-2 z-10 mt-auto pt-2">
        {chosen && chosenSlot && !part.isBot ? (
          <Button className="w-full text-lg" onClick={() => pick(chosen.id)}>
            Recruter {displayName(chosen)}
            <span className="block text-xs font-normal">
              → {POSTE_LABEL[SLOT_POSTE[chosenSlot]]}
              {positionPenalty(chosen, chosenSlot) > 0 && ` (poste secondaire, −${positionPenalty(chosen, chosenSlot)})`}
            </span>
          </Button>
        ) : (
          <div className="min-h-[52px]" />
        )}
      </div>
    </div>
  );
}
