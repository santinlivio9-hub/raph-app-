import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { GavelStamp } from '../../components/fx';
import { FlipCard, PlayerCard } from '../../components/PlayerCard';
import { Button } from '../../components/ui';
import { canUseJoker, other } from '../../game/auction';
import { botWantsJoker } from '../../game/bot';
import { displayName, getPlayer } from '../../game/db';
import type { GameState } from '../../game/types';
import { haptics, sfx } from '../../lib/feedback';
import { useGame } from '../../store/game';

const TIE_TEXT = { aucun: '', budget: 'Égalité : départagée au budget restant', tirage: 'Égalité parfaite : tirage au sort !' } as const;

export function MysteryReveal({ game }: { game: GameState }) {
  const dispatch = useGame((s) => s.dispatch);
  const r = game.auction!.result!;
  const winner = game.participants[r.winner];
  const loserIdx = other(r.winner);
  const loser = game.participants[loserIdx];
  const card = getPlayer(r.cardId);
  const mystery = getPlayer(r.mysteryId);
  const [revealed, setRevealed] = useState(false);
  const [botMsg, setBotMsg] = useState<string | null>(null);

  useEffect(() => {
    sfx.gavel();
    if (!winner.isBot) haptics.won();
  }, [winner.isBot]);

  // Le joueur mystère se retourne tout seul après le coup de marteau (ou au toucher).
  useEffect(() => {
    setRevealed(false);
    const t = window.setTimeout(() => setRevealed(true), 1500);
    return () => window.clearTimeout(t);
  }, [r.mysteryId]);

  useEffect(() => {
    if (!revealed) return;
    sfx.reveal();
    haptics.reveal();
  }, [revealed, r.mysteryId]);

  // Le bot perdant décide seul d'utiliser (ou non) son joker.
  useEffect(() => {
    if (!loser.isBot || !revealed || r.jokerUsed) return;
    const t = window.setTimeout(() => {
      if (canUseJoker(game) && botWantsJoker(game, loser.botLevel ?? 'moyen')) {
        setBotMsg(`${loser.name} utilise son joker !`);
        dispatch({ type: 'USE_JOKER' });
      } else {
        setBotMsg(`${loser.name} garde son joueur mystère.`);
      }
    }, 1100);
    return () => window.clearTimeout(t);
  }, [loser, revealed, r.jokerUsed, game, dispatch]);

  const humanLoserCanJoker = !loser.isBot && canUseJoker(game);

  return (
    <div className="flex flex-1 flex-col gap-3">
      <div className="pt-1">
        <GavelStamp />
        <motion.p className="mt-2 text-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>
          <strong>{displayName(card)}</strong> rejoint <strong style={{ color: winner.color }}>{winner.name}</strong> pour{' '}
          <span className="font-display text-2xl text-gold">{r.price} M€</span>
        </motion.p>
        <p className="text-center text-xs text-muted">
          Offres : {game.participants[0].name} {r.bids[0] ? `${r.bids[0]} M€` : 'passe'} · {game.participants[1].name}{' '}
          {r.bids[1] ? `${r.bids[1]} M€` : 'passe'}
          {r.tieBreak !== 'aucun' && <span className="block text-gold">{TIE_TEXT[r.tieBreak]}</span>}
        </p>
      </div>

      <div className="grid grid-cols-2 items-start gap-3">
        <div className="flex flex-col items-center gap-1">
          <span className="text-xs text-muted" style={{ color: winner.color }}>
            {winner.name} · acheté
          </span>
          <PlayerCard player={card} size="sm" />
        </div>
        <div className="flex flex-col items-center gap-1">
          <span className="text-xs" style={{ color: loser.color }}>
            {loser.name} · {r.jokerUsed ? 'mystère n°2 (joker)' : 'mystère gratuit'}
          </span>
          <button className="w-full max-w-[150px]" onClick={() => setRevealed(true)} aria-label="Révéler le joueur mystère" disabled={revealed}>
            <FlipCard key={mystery.id} player={mystery} revealed={revealed} size="sm" />
          </button>
        </div>
      </div>

      <AnimatePresence>
        {botMsg && (
          <motion.p className="text-center font-semibold text-gold" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
            {botMsg}
          </motion.p>
        )}
      </AnimatePresence>

      <div className="mt-auto flex flex-col gap-2 pt-2">
        {revealed && humanLoserCanJoker && (
          <>
            <p className="text-center text-sm text-muted">
              {loser.name}, ce joueur ne te plaît pas ? Ton joker retire un autre mystère du même poste — tu devras garder le second.
            </p>
            <Button variant="dark" onClick={() => dispatch({ type: 'USE_JOKER' })}>
              🃏 Utiliser mon joker
            </Button>
          </>
        )}
        <Button disabled={!revealed} onClick={() => dispatch({ type: 'CONFIRM_MYSTERY' })}>
          {humanLoserCanJoker ? 'Je le garde — continuer' : 'Continuer'}
        </Button>
      </div>
    </div>
  );
}
