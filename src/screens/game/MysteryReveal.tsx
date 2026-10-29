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

export function MysteryReveal({ game, onRevealed }: { game: GameState; onRevealed: (revealed: boolean) => void }) {
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

  // Le budget du perdant ne descend qu'au moment où son mystère (et donc son prix) est révélé.
  useEffect(() => {
    onRevealed(revealed);
    if (!revealed) return;
    sfx.reveal();
    haptics.reveal();
  }, [revealed, r.mysteryId, onRevealed]);

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
          <PlayerCard player={card} mode="enchere" size="sm" />
          <span className="text-xs text-white/80">payé {r.price} M€</span>
        </div>
        <div className="flex flex-col items-center gap-1">
          <span className="text-xs" style={{ color: loser.color }}>
            {loser.name} · {r.jokerUsed ? 'mystère n°2 (joker)' : 'joueur mystère'}
          </span>
          <button className="w-full max-w-[170px]" onClick={() => setRevealed(true)} aria-label="Révéler le joueur mystère" disabled={revealed}>
            <FlipCard key={mystery.id} player={mystery} revealed={revealed} mode="enchere" size="sm" />
          </button>
          <AnimatePresence>
            {revealed && (
              <motion.span
                key={r.mysteryId}
                className="font-display rounded-full bg-alert/90 px-3 text-xl text-white"
                initial={{ y: -10, opacity: 0, scale: 1.4 }}
                animate={{ y: 0, opacity: 1, scale: 1 }}
              >
                −{r.mysteryPrice} M€{r.mysteryPrice < mystery.valeurMarche && <span className="ml-1 text-xs">(bradé)</span>}
              </motion.span>
            )}
          </AnimatePresence>
          {r.jokerUsed && r.firstMysteryPrice !== undefined && (
            <span className="text-[11px] text-neon">Premier mystère remboursé : +{r.firstMysteryPrice} M€</span>
          )}
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
              {loser.name}, pas convaincu ? Ton joker te rembourse ce mystère et en tire un autre du même poste, payé à sa valeur marché —
              prix inconnu jusqu'au tirage, et tu devras le garder.
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
