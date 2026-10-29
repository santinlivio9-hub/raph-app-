import { motion } from 'framer-motion';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Timer } from '../../components/fx';
import { Button } from '../../components/ui';
import { LIVE_INCREMENTS, maxPlayable, minPrice, validateLiveBid } from '../../game/auction';
import { botLiveBid, botValuation } from '../../game/bot';
import type { GameState, ParticipantIndex } from '../../game/types';
import { haptics, sfx } from '../../lib/feedback';
import { useGame } from '../../store/game';
import { AuctionCard } from './BlindAuction';

function BidderPanel({ game, p, onError }: { game: GameState; p: ParticipantIndex; onError: (m: string) => void }) {
  const dispatch = useGame((s) => s.dispatch);
  const part = game.participants[p];
  const live = game.auction!.live;
  const leading = live.bidder === p;
  const min = minPrice(game);
  const amounts = live.bidder === null ? [min] : LIVE_INCREMENTS.map((inc) => live.high + inc);

  const bid = (amount: number) => {
    const check = validateLiveBid(game, p, amount);
    if (!check.ok) {
      onError(check.reason);
      sfx.error();
      haptics.error();
      return;
    }
    sfx.bid();
    dispatch({ type: 'LIVE_BID', p, amount });
  };

  return (
    <div
      className={`rounded-2xl border-2 p-2 transition ${leading ? 'border-neon bg-neon/10' : 'border-line bg-night-2'}`}
      style={{ boxShadow: `inset 4px 0 0 ${part.color}` }}
    >
      <div className="mb-1 flex items-center justify-between px-1 text-sm">
        <span className="truncate font-semibold">
          {part.isBot && '🤖 '}
          {part.name}
        </span>
        <span className="text-xs text-muted">{leading ? '✓ Meilleure offre' : `Max ${maxPlayable(game, p)} M€`}</span>
      </div>
      {part.isBot ? (
        <p className="py-3 text-center text-sm text-muted">{leading ? 'Le bot mène…' : 'Le bot observe…'}</p>
      ) : (
        <div className={`grid gap-2 ${amounts.length === 1 ? 'grid-cols-1' : 'grid-cols-3'}`}>
          {amounts.map((a, i) => (
            <Button
              key={i}
              variant={leading ? 'dark' : 'gold'}
              disabled={leading || !validateLiveBid(game, p, a).ok}
              className="!px-1 text-sm"
              onClick={() => bid(a)}
              aria-label={`Enchérir ${a} millions`}
            >
              {live.bidder === null ? `Je prends à ${a} M€` : `+${LIVE_INCREMENTS[i]} → ${a}`}
            </Button>
          ))}
        </div>
      )}
    </div>
  );
}

export function LiveAuction({ game }: { game: GameState }) {
  const dispatch = useGame((s) => s.dispatch);
  const total = game.config.timerSeconds * 1000;
  const [started, setStarted] = useState(false);
  const [deadline, setDeadline] = useState(0);
  const [now, setNow] = useState(() => Date.now());
  const [error, setError] = useState<string | null>(null);
  const ended = useRef(false);
  const live = game.auction!.live;

  useEffect(() => {
    haptics.reveal();
    sfx.reveal();
  }, []);

  // Valorisation secrète du bot pour cette carte.
  const botIndex = ([0, 1] as const).find((p) => game.participants[p].isBot);
  const valuation = useMemo(
    () => (botIndex === undefined ? 0 : botValuation(game, botIndex, game.participants[botIndex].botLevel ?? 'moyen')),
    [game.auction!.cardId],
  );

  // Chaque surenchère relance le minuteur.
  useEffect(() => {
    if (started) setDeadline(Date.now() + total);
  }, [started, live.high, live.bidder, total]);

  useEffect(() => {
    if (!started) return;
    const id = window.setInterval(() => setNow(Date.now()), 100);
    return () => window.clearInterval(id);
  }, [started]);

  const remaining = started ? Math.max(0, (deadline - now) / 1000) : game.config.timerSeconds;

  const lastTick = useRef(0);
  useEffect(() => {
    const sec = Math.ceil(remaining);
    if (started && sec <= 3 && sec > 0 && sec !== lastTick.current) sfx.tick();
    lastTick.current = sec;
  }, [remaining, started]);

  useEffect(() => {
    if (started && deadline && remaining <= 0 && !ended.current) {
      ended.current = true;
      dispatch({ type: 'LIVE_END' });
    }
  }, [started, deadline, remaining, dispatch]);

  // Le bot surenchérit avec un petit temps de réaction.
  useEffect(() => {
    if (!started || botIndex === undefined) return;
    const next = botLiveBid(game, botIndex, valuation);
    if (next === null) return;
    const t = window.setTimeout(() => dispatch({ type: 'LIVE_BID', p: botIndex, amount: next }), 700 + Math.random() * 1600);
    return () => window.clearTimeout(t);
  }, [started, live.high, live.bidder]); // réagit à chaque nouvelle offre

  const showError = (m: string) => {
    setError(m);
    window.setTimeout(() => setError(null), 2500);
  };

  const leader = live.bidder === null ? null : game.participants[live.bidder];

  return (
    <div className="flex flex-1 flex-col gap-3">
      {started && <BidderPanel game={game} p={1} onError={showError} />}
      <div className="flex items-center justify-center gap-3">
        <AuctionCard game={game} compact />
        <div className="flex flex-col items-center gap-2">
          <Timer remaining={remaining} total={game.config.timerSeconds} />
          <motion.div key={live.high} initial={{ scale: 1.4 }} animate={{ scale: 1 }} className="text-center">
            <div className="text-[11px] text-muted">Offre actuelle</div>
            <div className="font-display text-3xl text-gold">{live.bidder === null ? '—' : `${live.high} M€`}</div>
            {leader && <div className="max-w-[110px] truncate text-xs" style={{ color: leader.color }}>{leader.name}</div>}
          </motion.div>
        </div>
      </div>
      {error && (
        <p role="alert" className="rounded-xl bg-alert/15 px-3 py-2 text-center text-sm text-[#ffb3ba]">
          ⚠️ {error}
        </p>
      )}
      {started ? (
        <BidderPanel game={game} p={0} onError={showError} />
      ) : (
        <Button className="text-lg" onClick={() => setStarted(true)}>
          Lancer l’enchère ({game.config.timerSeconds} s)
        </Button>
      )}
    </div>
  );
}
