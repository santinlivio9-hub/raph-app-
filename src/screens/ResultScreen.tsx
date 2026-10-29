import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useMemo, useRef, useState } from 'react';
import { CompetitionBackground } from '../components/CompetitionBackground';
import { AnimatedNumber, Confetti } from '../components/fx';
import { LinkLegend, Pitch } from '../components/Pitch';
import { PlayerFace } from '../components/PlayerCard';
import { TeamSheet, pitchBadge } from '../components/TeamSheet';
import { Button, Page, TeamName, Toast } from '../components/ui';
import { botVote } from '../game/bot';
import { displayName, getPlayer } from '../game/db';
import { DEFAULT_ORDER, SLOTS, SLOT_POSTE } from '../game/formation';
import { buildSlotOrder } from '../game/game';
import { perfScore } from '../game/performance';
import { newSeed } from '../game/rng';
import { type Highlight, type TeamScore, computeTeamScore, decideWinner, teamHighlights } from '../game/scoring';
import { simulateMatch } from '../game/simulation';
import type { GameState, ParticipantIndex, SlotId } from '../game/types';
import { haptics, sfx } from '../lib/feedback';
import { shareNodeAsPng } from '../lib/share';
import { NIGHT_THEME, themeFor } from '../lib/themes';
import { useGame } from '../store/game';
import { useHistory } from '../store/history';

const fmt = (v: number, d = 1) => v.toFixed(d).replace('.', ',');
const both = [0, 1] as const;

// ───────────────────────── Verdict des potes ─────────────────────────

function VoteStage({ game }: { game: GameState }) {
  const dispatch = useGame((s) => s.dispatch);
  const voter = both.find((p) => game.votes[p] === null && !game.participants[p].isBot);

  // Le bot vote tout seul.
  useEffect(() => {
    for (const p of both) {
      const part = game.participants[p];
      if (part.isBot && game.votes[p] === null) dispatch({ type: 'VOTE', p, forTeam: botVote(game, p, part.botLevel ?? 'moyen') });
    }
  }, [game, dispatch]);

  if (voter === undefined) return null;
  const who = game.participants[voter];
  return (
    <div className="flex flex-col gap-4">
      <div className="text-center">
        <div className="text-4xl" aria-hidden>
          🗳️
        </div>
        <h2 className="font-display text-4xl">Verdict des potes</h2>
        <p className="text-sm text-white/80">
          Avant de voir les vraies stats : <strong style={{ color: who.color }}>{who.name}</strong>, quel onze est le meilleur ?
        </p>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {both.map((p) => (
          <button
            key={p}
            onClick={() => {
              sfx.bid();
              dispatch({ type: 'VOTE', p: voter, forTeam: p });
            }}
            className="rounded-2xl border-2 border-line bg-night-2/80 p-2 text-left transition hover:border-gold active:scale-[0.98]"
            aria-label={`Voter pour ${game.participants[p].name}`}
          >
            <TeamName name={game.participants[p].name} color={game.participants[p].color} className="mb-1 text-sm font-semibold" />
            <Pitch team={game.teams[p]} color={game.participants[p].color} mini badge={pitchBadge(game.config, false)} />
            <div className="mt-2 rounded-xl bg-gold py-2 text-center font-semibold text-night">Je vote !</div>
          </button>
        ))}
      </div>
      <p className="text-center text-xs text-muted">Le vote est pour le fun : seul le verdict des performances désigne le vainqueur.</p>
    </div>
  );
}

// ───────────────────────── Cérémonie de révélation ─────────────────────────

interface Reveal {
  team: ParticipantIndex;
  slot: SlotId;
}

function Gauge({ value, color, label }: { value: number; color: string; label: string }) {
  return (
    <div>
      <div className="mb-1 flex items-baseline justify-between text-sm">
        <span className="truncate font-semibold">{label}</span>
        <span className="font-display text-3xl text-gold">
          <AnimatedNumber value={Math.round(value)} />
        </span>
      </div>
      <div className="h-3 overflow-hidden rounded-full bg-night-3" role="progressbar" aria-valuenow={Math.round(value)} aria-valuemin={0} aria-valuemax={100} aria-label={label}>
        <motion.div className="h-full rounded-full" style={{ background: color }} animate={{ width: `${Math.min(100, value)}%` }} transition={{ duration: 0.6 }} />
      </div>
    </div>
  );
}

function Ceremony({ game, onDone }: { game: GameState; onDone: () => void }) {
  // Poste par poste, en alternant les deux équipes.
  const steps = useMemo<Reveal[]>(() => SLOTS.flatMap((slot) => both.map((team) => ({ team, slot }))), []);
  const [shown, setShown] = useState(0);
  const done = shown >= steps.length;

  useEffect(() => {
    if (done) {
      const t = window.setTimeout(onDone, 1400);
      return () => window.clearTimeout(t);
    }
    const t = window.setTimeout(() => setShown((n) => n + 1), shown === 0 ? 600 : 1100);
    return () => window.clearTimeout(t);
  }, [shown, done, onDone]);

  useEffect(() => {
    if (shown > 0 && !done) {
      sfx.tap();
      haptics.reveal();
    }
  }, [shown, done]);

  const revealed = steps.slice(0, shown);
  const avgFor = (team: ParticipantIndex) => {
    const xs = revealed.filter((r) => r.team === team).map((r) => perfScore(getPlayer(game.teams[team].lineup[r.slot]!.playerId), r.slot));
    return xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0;
  };
  const last = revealed.at(-1);
  const lastPick = last ? game.teams[last.team].lineup[last.slot]! : null;
  const lastPlayer = lastPick ? getPlayer(lastPick.playerId) : null;

  return (
    <div className="flex flex-col gap-4">
      <div className="text-center">
        <h2 className="font-display text-4xl">La révélation</h2>
        <p className="text-sm text-white/80">Performances réelles, saison {getPlayer(game.teams[0].lineup.GK!.playerId).perf.saison}</p>
      </div>
      <div className="space-y-3 rounded-2xl border border-line bg-night-2/85 p-3 backdrop-blur">
        {both.map((p) => (
          <Gauge key={p} value={avgFor(p)} color={game.participants[p].color} label={game.participants[p].name} />
        ))}
        <p className="text-center text-[11px] text-muted">Perf moyenne des joueurs révélés (sur 100)</p>
      </div>
      <div className="grid min-h-[170px] place-items-center">
        <AnimatePresence mode="wait">
          {last && lastPlayer && lastPick && (
            <motion.div
              key={`${last.team}-${last.slot}`}
              className="flex flex-col items-center gap-1 text-center"
              initial={{ opacity: 0, y: 20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: game.participants[last.team].color }}>
                {game.participants[last.team].name} · {SLOT_POSTE[last.slot]}
              </span>
              <PlayerFace player={lastPlayer} size={84} ring={game.participants[last.team].color} />
              <span className="font-semibold">{displayName(lastPlayer)}</span>
              <span className="font-display text-5xl text-neon">
                <AnimatedNumber value={Math.round(perfScore(lastPlayer, last.slot))} />
              </span>
              <span className="text-xs text-muted">
                {lastPlayer.perf.buts} buts · {lastPlayer.perf.passesD} passes · note {fmt(lastPlayer.perf.noteMoyenne)} · payé {lastPick.price} M€
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {both.map((p) => {
          const visible = new Set(revealed.filter((r) => r.team === p).map((r) => r.slot));
          return (
            <Pitch
              key={p}
              team={game.teams[p]}
              color={game.participants[p].color}
              mini
              showLinks={done}
              badge={(pick) => (visible.has(pick.slot) ? String(Math.round(perfScore(getPlayer(pick.playerId), pick.slot))) : '?')}
            />
          );
        })}
      </div>
      <Button variant="ghost" onClick={onDone}>
        Passer la cérémonie
      </Button>
    </div>
  );
}

// ───────────────────────── Résultat final ─────────────────────────

function HighlightRow({ icon, label, h }: { icon: string; label: string; h: Highlight | null }) {
  if (!h) return null;
  return (
    <li className="flex items-center gap-2 py-1.5">
      <PlayerFace player={h.player} size={36} />
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

function Breakdown({ scores, game, showPerf }: { scores: [TeamScore, TeamScore]; game: GameState; showPerf: boolean }) {
  const auction = game.config.mode === 'enchere';
  const w = scores[0].weight;
  const pct = (v: number) => fmt(v * 100, 0).replace(',0', '');
  const rows: { label: string; get: (s: TeamScore) => string; total?: boolean }[] = auction
    ? [
        { label: `Perf moyenne (×${pct(w)} %)`, get: (s) => fmt(s.perfMoyenne) },
        { label: `Collectif (×${pct(1 - w)} %)`, get: (s) => String(Math.round(s.collectif)) },
        { label: 'Score final', get: (s) => fmt(s.total, 2), total: true },
      ]
    : [
        { label: 'Note générale (×70 %)', get: (s) => fmt(s.noteGenerale) },
        { label: 'Collectif (×30 %)', get: (s) => String(Math.round(s.collectif)) },
        ...(showPerf ? [{ label: 'Perf réelle (pour info)', get: (s: TeamScore) => fmt(s.perfMoyenne) }] : []),
        { label: 'Score final', get: (s) => fmt(s.total, 2), total: true },
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
        {rows.map((r) => (
          <tr key={r.label} className={`border-t border-line ${r.total ? 'font-display text-2xl text-gold' : ''}`}>
            <td className={`py-1.5 ${r.total ? 'font-sans text-sm text-white' : ''}`}>{r.label}</td>
            <td className="py-1.5 text-right">{r.get(scores[0])}</td>
            <td className="py-1.5 text-right">{r.get(scores[1])}</td>
          </tr>
        ))}
        {auction && (
          <tr className="border-t border-line text-xs text-muted">
            <td className="py-1.5">Dépensé / restant</td>
            {both.map((p) => (
              <td key={p} className="py-1.5 text-right">
                {game.config.startBudget - game.teams[p].budget} / {game.teams[p].budget} M€
              </td>
            ))}
          </tr>
        )}
      </tbody>
    </table>
  );
}

function MatchSim({ game }: { game: GameState }) {
  const match = useMemo(
    () => simulateMatch(game.teams, [game.participants[0].name, game.participants[1].name], game.config.seed, game.config.mode),
    [game],
  );
  const [shown, setShown] = useState(0);
  const [running, setRunning] = useState(false);
  const feed = useRef<HTMLOListElement>(null);

  useEffect(() => {
    if (!running || shown >= match.events.length) return;
    const t = window.setTimeout(() => {
      if (match.events[shown].kind === 'but') sfx.goal();
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
    <section className="rounded-2xl border border-line bg-night-2/90 p-3" aria-label="Simulation de match">
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

function FinalStage({ game, scores }: { game: GameState; scores: [TeamScore, TeamScore] }) {
  const { start, quit } = useGame();
  const record = useHistory((s) => s.record);
  const [sheet, setSheet] = useState<ParticipantIndex | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [sharing, setSharing] = useState(false);
  const [showPerf, setShowPerf] = useState(false);
  const shareRef = useRef<HTMLDivElement>(null);
  const auction = game.config.mode === 'enchere';
  const reveal = auction || showPerf;

  const outcome = decideWinner(scores[0], scores[1], game.config.mode);
  const highlights = useMemo(() => both.map((p) => teamHighlights(game.teams[p], game.config.mode)), [game]);
  const winner = outcome.winner === null ? null : game.participants[outcome.winner];
  const votesDone = game.config.verdictDesPotes && auction && game.votes.every((v) => v !== null);
  const theme = game.config.pool !== 'toutes' ? themeFor(game.config.pool) : NIGHT_THEME;

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
    <div className="flex flex-col gap-4 pb-6">
      <Toast message={toast} />
      {winner && <Confetti />}
      <motion.div className="text-center" initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', stiffness: 220, damping: 14 }}>
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
        {outcome.reason === 'departage' && (
          <p className="text-sm text-muted">Égalité au score : départagés {auction ? 'aux performances' : 'à la note générale'}.</p>
        )}
      </motion.div>

      {votesDone && (
        <section className="grid grid-cols-2 gap-2 text-center" aria-label="Verdict des potes contre verdict des stats">
          <div className="rounded-2xl border border-line bg-night-2/90 p-2">
            <div className="text-[11px] uppercase tracking-wide text-muted">🗳️ Verdict des potes</div>
            {both.map((p) => (
              <div key={p} className="truncate text-sm">
                {game.participants[p].name} → <strong style={{ color: game.participants[game.votes[p]!].color }}>{game.participants[game.votes[p]!].name}</strong>
              </div>
            ))}
          </div>
          <div className="rounded-2xl border border-line bg-night-2/90 p-2">
            <div className="text-[11px] uppercase tracking-wide text-muted">📊 Verdict des stats</div>
            <div className="font-display text-2xl" style={{ color: winner?.color }}>
              {winner ? winner.name : 'Égalité'}
            </div>
            <div className="text-[11px] text-muted">
              {game.votes.filter((v) => v === outcome.winner).length}/2 potes avaient vu juste
            </div>
          </div>
        </section>
      )}

      <div ref={shareRef} className="relative overflow-hidden rounded-2xl p-2" style={{ background: theme.background }}>
        <div className="absolute inset-0 bg-black/35" aria-hidden />
        <div className="relative grid grid-cols-2 gap-2">
          {both.map((p) => (
            <button key={p} onClick={() => setSheet(p)} className="text-left" aria-label={`Voir le onze de ${game.participants[p].name}`}>
              <div className="mb-1 flex items-center justify-between gap-1">
                <TeamName name={game.participants[p].name} color={game.participants[p].color} className="text-sm font-semibold" />
                <span className={`font-display text-2xl ${outcome.winner === p ? 'text-neon' : 'text-white/80'}`}>{fmt(scores[p].total)}</span>
              </div>
              <Pitch team={game.teams[p]} color={game.participants[p].color} mini badge={pitchBadge(game.config, reveal)} />
            </button>
          ))}
        </div>
        <div className="font-display relative mt-1 text-center text-sm text-white/80">
          MERCATO <span className="text-gold">DUEL</span> · {auction ? 'Enchères' : 'Draft'}
          {game.config.pool !== 'toutes' && ` · ${game.config.pool}`}
        </div>
      </div>
      <p className="-mt-2 text-center text-xs text-muted">Touche un terrain pour voir le onze et la fiche de chaque joueur.</p>

      <section className="rounded-2xl border border-line bg-night-2/90 p-3">
        <Breakdown scores={scores} game={game} showPerf={showPerf} />
        {!auction && (
          <button className="mt-2 min-h-[44px] w-full text-sm text-gold underline-offset-4 hover:underline" onClick={() => setShowPerf((v) => !v)}>
            {showPerf ? 'Masquer les performances réelles' : 'Afficher aussi les performances réelles'}
          </button>
        )}
        <div className="mt-2">
          <LinkLegend />
        </div>
      </section>

      <section className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {both.map((p) => (
          <div key={p} className="rounded-2xl border border-line bg-night-2/90 p-3" style={{ boxShadow: `inset 3px 0 0 ${game.participants[p].color}` }}>
            <TeamName name={game.participants[p].name} color={game.participants[p].color} className="font-semibold" />
            <ul className="mt-1 divide-y divide-line">
              <HighlightRow icon="⭐" label="MVP" h={highlights[p].mvp} />
              <HighlightRow icon="💰" label="Meilleure affaire" h={highlights[p].affaire} />
              <HighlightRow icon="📉" label="Plus gros flop" h={highlights[p].flop} />
              <HighlightRow icon="🍀" label="Mystère le plus chanceux" h={highlights[p].chanceux} />
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

      {sheet !== null && (
        <TeamSheet open onClose={() => setSheet(null)} participant={game.participants[sheet]} team={game.teams[sheet]} config={game.config} reveal={reveal} />
      )}
    </div>
  );
}

type Stage = 'vote' | 'ceremonie' | 'final';

export function ResultScreen({ game }: { game: GameState }) {
  const go = useGame((s) => s.go);
  const alreadySeen = useHistory((s) => s.entries.some((e) => e.id === game.id));
  const scores = useMemo(() => both.map((p) => computeTeamScore(game.teams[p], game.config)) as [TeamScore, TeamScore], [game]);
  const auction = game.config.mode === 'enchere';
  const votesPending = auction && game.config.verdictDesPotes && game.votes.some((v) => v === null);
  const [stage, setStage] = useState<Stage>(() => (alreadySeen || !auction ? 'final' : votesPending ? 'vote' : 'ceremonie'));

  useEffect(() => {
    if (stage === 'vote' && !votesPending) setStage('ceremonie');
  }, [stage, votesPending]);

  const theme = game.config.pool !== 'toutes' ? themeFor(game.config.pool) : NIGHT_THEME;
  const title = stage === 'vote' ? 'Avant le verdict' : stage === 'ceremonie' ? 'Cérémonie' : 'Résultat';

  return (
    <Page title={title} onBack={() => go('home')}>
      <CompetitionBackground theme={theme} />
      {stage === 'vote' && <VoteStage game={game} />}
      {stage === 'ceremonie' && <Ceremony game={game} onDone={() => setStage('final')} />}
      {stage === 'final' && <FinalStage game={game} scores={scores} />}
    </Page>
  );
}
