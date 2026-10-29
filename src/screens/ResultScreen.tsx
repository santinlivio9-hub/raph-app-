import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Confetti } from '../components/fx';
import { Pitch } from '../components/Pitch';
import { Avatar } from '../components/PlayerCard';
import { TeamSheet } from '../components/TeamSheet';
import { Button, Page, TeamName, Toast } from '../components/ui';
import { displayName } from '../game/db';
import { DEFAULT_ORDER } from '../game/formation';
import { buildSlotOrder } from '../game/game';
import { newSeed } from '../game/rng';
import { type Highlight, type TeamScore, computeTeamScore, decideWinner, teamHighlights } from '../game/scoring';
import { simulateMatch } from '../game/simulation';
import type { GameState, ParticipantIndex } from '../game/types';
import { sfx } from '../lib/feedback';
import { shareNodeAsPng } from '../lib/share';
import { useGame } from '../store/game';
import { useHistory } from '../store/history';

function HighlightRow({ icon, label, h }: { icon: string; label: string; h: Highlight | null }) {
  if (!h) return null;
  return (
    <li className="flex items-center gap-2 py-1.5">
      <Avatar player={h.player} size={34} />
      <div className="min-w-0 flex-1">
        <div className="text-[11px] uppercase tracking-wide text-muted">
          <span aria-hidden>{icon}</span> {label}
        </div>
        <div className="truncate text-sm font-semibold">{displayName(h.player)}</div>
        <div className="truncate text-[11px] text-muted">{h.detail}</div>
      </div>
    </li>
  );
}

function Breakdown({ scores, game }: { scores: [TeamScore, TeamScore]; game: GameState }) {
  const rows: { label: string; get: (s: TeamScore) => string }[] = [
    { label: 'Note générale (×0,7)', get: (s) => s.noteGenerale.toFixed(1) },
    { label: 'Collectif (×0,3)', get: (s) => Math.round(s.collectif).toString() },
    ...(game.config.mode === 'enchere' ? [{ label: 'Bonus budget', get: (s: TeamScore) => `+${s.bonusBudget}` }] : []),
    { label: 'Score final', get: (s) => s.total.toFixed(2) },
  ];
  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="text-muted">
          <th className="py-1 text-left font-normal">Détail</th>
          {game.participants.map((p, i) => (
            <th key={i} className="w-24 py-1 text-right font-semibold" style={{ color: p.color }}>
              <span className="block truncate">{p.name}</span>
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((r, k) => (
          <tr key={r.label} className={`border-t border-line ${k === rows.length - 1 ? 'font-display text-2xl text-gold' : ''}`}>
            <td className={`py-1.5 ${k === rows.length - 1 ? 'font-sans text-sm text-white' : ''}`}>{r.label}</td>
            <td className="py-1.5 text-right">{r.get(scores[0])}</td>
            <td className="py-1.5 text-right">{r.get(scores[1])}</td>
          </tr>
        ))}
        {game.config.mode === 'enchere' && (
          <tr className="border-t border-line text-xs text-muted">
            <td className="py-1.5">Budget restant</td>
            <td className="py-1.5 text-right">{game.teams[0].budget} M€</td>
            <td className="py-1.5 text-right">{game.teams[1].budget} M€</td>
          </tr>
        )}
      </tbody>
    </table>
  );
}

function MatchSim({ game }: { game: GameState }) {
  const match = useMemo(
    () => simulateMatch(game.teams, [game.participants[0].name, game.participants[1].name], game.config.seed),
    [game],
  );
  const [shown, setShown] = useState(0);
  const [running, setRunning] = useState(false);
  const feed = useRef<HTMLOListElement>(null);

  useEffect(() => {
    if (!running || shown >= match.events.length) return;
    const t = window.setTimeout(() => {
      const ev = match.events[shown];
      if (ev.kind === 'but') sfx.goal();
      setShown((n) => n + 1);
    }, shown === 0 ? 200 : 900);
    return () => window.clearTimeout(t);
  }, [running, shown, match.events]);

  useEffect(() => {
    feed.current?.scrollTo({ top: feed.current.scrollHeight, behavior: 'smooth' });
  }, [shown]);

  const current = shown ? match.events[shown - 1] : null;
  const score = current?.score ?? [0, 0];
  const done = shown >= match.events.length;

  return (
    <section className="rounded-2xl border border-line bg-night-2 p-3" aria-label="Simulation de match">
      <div className="mb-2 flex items-center justify-between">
        <h2 className="font-display text-2xl">Le match</h2>
        <span className="text-xs text-muted">pour le fun — ne change pas le vainqueur</span>
      </div>
      <div className="mb-2 grid grid-cols-[1fr_auto_1fr] items-center gap-2 rounded-xl bg-night px-3 py-2">
        <TeamName name={game.participants[0].name} color={game.participants[0].color} className="text-sm" />
        <motion.span key={`${score[0]}-${score[1]}`} initial={{ scale: 1.5 }} animate={{ scale: 1 }} className="font-display text-4xl text-gold" aria-live="polite">
          {score[0]} – {score[1]}
        </motion.span>
        <TeamName name={game.participants[1].name} color={game.participants[1].color} className="justify-end text-sm" />
      </div>
      <div className="mb-2 h-1 overflow-hidden rounded-full bg-night-3">
        <div className="h-full bg-neon transition-all" style={{ width: `${((current?.minute ?? 0) / 90) * 100}%` }} />
      </div>
      {shown > 0 && (
        <ol ref={feed} className="no-scrollbar mb-2 max-h-56 space-y-1 overflow-y-auto">
          <AnimatePresence initial={false}>
            {match.events.slice(0, shown).map((e, i) => (
              <motion.li
                key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className={`flex gap-2 rounded-lg px-2 py-1 text-sm ${e.kind === 'but' ? 'bg-neon/15 font-semibold' : ''}`}
              >
                <span className="font-display w-8 shrink-0 text-gold">{e.minute}'</span>
                {e.team !== null && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full" style={{ background: game.participants[e.team].color }} aria-hidden />}
                <span>{e.text}</span>
              </motion.li>
            ))}
          </AnimatePresence>
        </ol>
      )}
      {!running ? (
        <Button variant="neon" className="w-full" onClick={() => setRunning(true)}>
          ⚽ Coup d’envoi
        </Button>
      ) : (
        !done && (
          <Button variant="ghost" className="w-full" onClick={() => setShown(match.events.length)}>
            Voir le score final
          </Button>
        )
      )}
    </section>
  );
}

export function ResultScreen({ game }: { game: GameState }) {
  const { go, start, quit } = useGame();
  const record = useHistory((s) => s.record);
  const [sheet, setSheet] = useState<ParticipantIndex | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [sharing, setSharing] = useState(false);
  const shareRef = useRef<HTMLDivElement>(null);

  const scores = useMemo(() => [computeTeamScore(game.teams[0], game.config.mode), computeTeamScore(game.teams[1], game.config.mode)] as [TeamScore, TeamScore], [game]);
  const outcome = decideWinner(scores[0], scores[1]);
  const highlights = useMemo(() => [teamHighlights(game.teams[0], game.config.mode), teamHighlights(game.teams[1], game.config.mode)], [game]);
  const winner = outcome.winner === null ? null : game.participants[outcome.winner];

  useEffect(() => {
    record({
      id: game.id,
      date: Date.now(),
      mode: game.config.mode,
      names: [game.participants[0].name, game.participants[1].name],
      colors: [game.participants[0].color, game.participants[1].color],
      scores: [scores[0].total, scores[1].total],
      winner: outcome.winner,
      vsBot: game.participants.some((p) => p.isBot),
    });
    sfx.win();
  }, [game, scores, outcome.winner, record]);

  const rematch = () => {
    const seed = newSeed();
    const random = game.config.slotOrder.join() !== DEFAULT_ORDER.join();
    start({ ...game.config, seed, slotOrder: buildSlotOrder(random, seed) }, game.participants);
  };

  const share = async () => {
    if (!shareRef.current) return;
    setSharing(true);
    try {
      const how = await shareNodeAsPng(shareRef.current, 'mercato-duel.png', 'Mercato Duel');
      setToast(how === 'telecharge' ? 'Image téléchargée !' : 'Image prête à partager !');
    } catch {
      setToast("Impossible de créer l'image sur cet appareil.");
    } finally {
      setSharing(false);
      window.setTimeout(() => setToast(null), 2500);
    }
  };

  return (
    <Page title="Résultat" onBack={() => go('home')}>
      <Toast message={toast} />
      {winner && <Confetti />}
      <div className="flex flex-col gap-4 pb-6">
        <motion.div
          className="text-center"
          initial={{ scale: 0.6, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 220, damping: 14 }}
        >
          <div className="text-5xl" aria-hidden>
            {winner ? '🏆' : '🤝'}
          </div>
          <h2 className="font-display text-4xl leading-tight">
            {winner ? (
              <>
                <span style={{ color: winner.color }}>{winner.name}</span> remporte le duel !
              </>
            ) : (
              'Match nul parfait !'
            )}
          </h2>
          {outcome.reason === 'note' && <p className="text-sm text-muted">Égalité au score : départagés à la note générale.</p>}
        </motion.div>

        <div ref={shareRef} className="rounded-2xl bg-night p-2">
          <div className="grid grid-cols-2 gap-2">
            {([0, 1] as const).map((p) => (
              <button key={p} onClick={() => setSheet(p)} className="text-left" aria-label={`Voir le onze de ${game.participants[p].name}`}>
                <div className="mb-1 flex items-center justify-between gap-1">
                  <TeamName name={game.participants[p].name} color={game.participants[p].color} className="text-sm font-semibold" />
                  <span className={`font-display text-2xl ${outcome.winner === p ? 'text-neon' : 'text-white/80'}`}>{scores[p].total.toFixed(1)}</span>
                </div>
                <Pitch team={game.teams[p]} color={game.participants[p].color} mini />
              </button>
            ))}
          </div>
          <div className="font-display mt-1 text-center text-sm text-muted">
            MERCATO <span className="text-gold">DUEL</span> · {game.config.mode === 'enchere' ? 'Enchères' : 'Draft'}
          </div>
        </div>
        <p className="-mt-2 text-center text-xs text-muted">Touche un terrain pour voir le onze en grand.</p>

        <section className="rounded-2xl border border-line bg-night-2 p-3">
          <Breakdown scores={scores} game={game} />
        </section>

        <section className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {([0, 1] as const).map((p) => (
            <div key={p} className="rounded-2xl border border-line bg-night-2 p-3" style={{ boxShadow: `inset 3px 0 0 ${game.participants[p].color}` }}>
              <TeamName name={game.participants[p].name} color={game.participants[p].color} className="font-semibold" />
              <ul className="mt-1 divide-y divide-line">
                <HighlightRow icon="⭐" label="MVP" h={highlights[p].mvp} />
                <HighlightRow icon="💰" label="Meilleure affaire" h={highlights[p].affaire} />
                <HighlightRow icon="📉" label="Plus gros flop" h={highlights[p].flop} />
              </ul>
            </div>
          ))}
        </section>

        <MatchSim game={game} />

        <div className="safe-bottom flex flex-col gap-3">
          <Button variant="dark" onClick={share} disabled={sharing}>
            {sharing ? 'Création de l’image…' : '📤 Partager les onzes (PNG)'}
          </Button>
          <div className="grid grid-cols-2 gap-3">
            <Button onClick={rematch}>Revanche</Button>
            <Button variant="ghost" onClick={quit}>
              Accueil
            </Button>
          </div>
        </div>
      </div>

      {sheet !== null && (
        <TeamSheet open onClose={() => setSheet(null)} participant={game.participants[sheet]} team={game.teams[sheet]} mode={game.config.mode} />
      )}
    </Page>
  );
}
