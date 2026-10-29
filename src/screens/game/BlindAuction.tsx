import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { PlayerCard } from '../../components/PlayerCard';
import { Button } from '../../components/ui';
import { budgetReserve, maxPlayable, minPrice, validateBid } from '../../game/auction';
import { botBlindBid } from '../../game/bot';
import { getPlayer } from '../../game/db';
import type { GameState, ParticipantIndex } from '../../game/types';
import { haptics, sfx } from '../../lib/feedback';
import { useGame } from '../../store/game';

type Step = { kind: 'card' } | { kind: 'handoff'; p: ParticipantIndex } | { kind: 'entry'; p: ParticipantIndex };

export function AuctionCard({ game, compact = false }: { game: GameState; compact?: boolean }) {
  const card = getPlayer(game.auction!.cardId);
  return (
    <div className="flex flex-col items-center gap-2">
      <motion.div
        initial={{ rotateY: 90, scale: 0.8, opacity: 0 }}
        animate={{ rotateY: 0, scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 160, damping: 18 }}
      >
        <PlayerCard player={card} size={compact ? 'sm' : 'lg'} />
      </motion.div>
      <div className="flex items-center gap-2 rounded-full border border-gold/50 bg-gold/10 px-4 py-1">
        <span className="text-sm text-muted">Prix minimum</span>
        <span className="font-display text-2xl text-gold">{card.valeurMarche} M€</span>
      </div>
    </div>
  );
}

/** Écran « passe le téléphone » : masque tout entre deux offres secrètes. */
export function PassPhone({ name, color, onReady }: { name: string; color: string; onReady: () => void }) {
  return (
    <motion.div
      className="fixed inset-0 z-30 flex flex-col items-center justify-center gap-6 bg-night px-6 text-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      role="dialog"
      aria-label={`Passe le téléphone à ${name}`}
    >
      <motion.div className="text-7xl" animate={{ rotate: [0, -10, 10, 0] }} transition={{ repeat: Infinity, duration: 1.6 }} aria-hidden>
        📱
      </motion.div>
      <div>
        <p className="text-muted">Offre secrète — ne regarde pas l’écran de l’autre !</p>
        <h2 className="font-display mt-2 text-5xl">
          Passe le téléphone à <span style={{ color }}>{name}</span>
        </h2>
      </div>
      <Button className="w-full max-w-xs text-lg" onClick={onReady}>
        C’est moi, {name} : afficher
      </Button>
    </motion.div>
  );
}

function BidPad({ game, p, onDone }: { game: GameState; p: ParticipantIndex; onDone: () => void }) {
  const dispatch = useGame((s) => s.dispatch);
  const min = minPrice(game);
  const max = maxPlayable(game, p);
  const canBid = max >= min;
  const [amount, setAmount] = useState(Math.min(min, max));
  const [error, setError] = useState<string | null>(canBid ? null : `Budget max jouable : ${max} M€ — inférieur au prix minimum. Tu ne peux que passer.`);
  const part = game.participants[p];

  const submit = (value: number) => {
    const check = validateBid(game, p, value);
    if (!check.ok) {
      setError(check.reason);
      sfx.error();
      haptics.error();
      return;
    }
    sfx.bid();
    dispatch({ type: 'BID', p, amount: value });
    onDone();
  };

  const bump = (d: number) => {
    setError(null);
    setAmount((a) => Math.max(0, a + d));
  };

  return (
    <div className="flex flex-col gap-3 rounded-3xl border border-line bg-night-2 p-4" style={{ boxShadow: `inset 0 3px 0 ${part.color}` }}>
      <div className="flex items-baseline justify-between">
        <span className="font-semibold">Offre secrète de {part.name}</span>
        <span className="text-xs text-muted">Max jouable {max} M€</span>
      </div>
      <label className="flex items-center justify-center gap-2">
        <span className="sr-only">Montant de l’offre en millions d’euros</span>
        <input
          inputMode="numeric"
          pattern="[0-9]*"
          value={amount}
          onChange={(e) => {
            setError(null);
            setAmount(Number(e.target.value.replace(/\D/g, '')) || 0);
          }}
          className="font-display w-40 rounded-xl border border-line bg-night text-center text-5xl text-gold outline-none focus:border-gold"
          disabled={!canBid}
        />
        <span className="font-display text-3xl text-muted">M€</span>
      </label>
      <div className="grid grid-cols-5 gap-2">
        {[-10, 1, 5, 10, 50].map((d) => (
          <Button key={d} variant="dark" className="!min-h-[48px] !px-0 text-sm" disabled={!canBid} onClick={() => bump(d)}>
            {d > 0 ? `+${d}` : d}
          </Button>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Button variant="ghost" className="text-sm" disabled={!canBid} onClick={() => (setError(null), setAmount(min))}>
          Prix min ({min})
        </Button>
        <Button variant="ghost" className="text-sm" disabled={!canBid} onClick={() => (setError(null), setAmount(max))}>
          Tapis ({max})
        </Button>
      </div>
      <AnimatePresence>
        {error && (
          <motion.p role="alert" className="rounded-xl bg-alert/15 px-3 py-2 text-sm text-[#ffb3ba]" initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}>
            ⚠️ {error}
          </motion.p>
        )}
      </AnimatePresence>
      <p className="text-center text-[11px] text-muted">Réserve obligatoire pour les postes restants : {budgetReserve(game)} M€</p>
      <div className="grid grid-cols-[1fr_2fr] gap-2">
        <Button variant="ghost" onClick={() => submit(0)}>
          Passer
        </Button>
        <Button disabled={!canBid} onClick={() => submit(amount)}>
          Valider {canBid ? `${amount} M€` : ''}
        </Button>
      </div>
    </div>
  );
}

export function BlindAuction({ game }: { game: GameState }) {
  const dispatch = useGame((s) => s.dispatch);
  const humans = ([0, 1] as const).filter((p) => !game.participants[p].isBot);
  const twoHumans = humans.length === 2;
  const [step, setStep] = useState<Step>({ kind: 'card' });
  const bids = game.auction!.bids;

  useEffect(() => {
    haptics.reveal();
    sfx.reveal();
  }, []);

  // Le bot fait son offre secrète dès la révélation, sans connaître celle de l’humain.
  useEffect(() => {
    const bot = ([0, 1] as const).find((p) => game.participants[p].isBot);
    if (bot === undefined || bids[bot] !== null) return;
    const t = window.setTimeout(() => {
      const level = game.participants[bot].botLevel ?? 'moyen';
      dispatch({ type: 'BID', p: bot, amount: botBlindBid(game, bot, level) });
    }, 500);
    return () => window.clearTimeout(t);
  }, [game.auction!.cardId]); // une seule offre par carte

  const nextHuman = (after?: ParticipantIndex) => humans.find((p) => p !== after && bids[p] === null);

  const begin = () => {
    const first = nextHuman();
    if (first === undefined) return;
    setStep(twoHumans ? { kind: 'handoff', p: first } : { kind: 'entry', p: first });
  };

  const afterBid = (p: ParticipantIndex) => {
    const n = humans.find((h) => h !== p && game.auction!.bids[h] === null);
    if (n !== undefined && twoHumans) setStep({ kind: 'handoff', p: n });
    else setStep({ kind: 'card' });
  };

  const waiting = humans.every((p) => bids[p] !== null);

  return (
    <div className="flex flex-1 flex-col gap-3">
      <AnimatePresence>
        {step.kind === 'handoff' && (
          <PassPhone name={game.participants[step.p].name} color={game.participants[step.p].color} onReady={() => setStep({ kind: 'entry', p: step.p })} />
        )}
      </AnimatePresence>

      {step.kind === 'entry' ? (
        <>
          <AuctionCard game={game} compact />
          <BidPad game={game} p={step.p} onDone={() => afterBid(step.p)} />
        </>
      ) : (
        <>
          <div className="flex flex-1 items-center justify-center py-2">
            <AuctionCard game={game} />
          </div>
          <div className="grid grid-cols-2 gap-2 text-center text-xs text-muted">
            {([0, 1] as const).map((p) => (
              <div key={p} className="rounded-xl border border-line py-1.5">
                {game.participants[p].name} : {bids[p] === null ? 'en attente…' : '✓ offre déposée'}
              </div>
            ))}
          </div>
          {waiting ? (
            <p className="py-3 text-center text-muted">Le bot réfléchit…</p>
          ) : (
            <Button className="text-lg" onClick={begin}>
              {twoHumans ? 'Faire les offres secrètes' : 'Faire mon offre'}
            </Button>
          )}
        </>
      )}
    </div>
  );
}
