import { motion } from 'framer-motion';
import { Button } from '../components/ui';
import { palmares, useHistory } from '../store/history';
import { useGame } from '../store/game';

export function Logo() {
  return (
    <div className="text-center">
      <motion.div
        className="mx-auto mb-2 grid h-20 w-20 place-items-center rounded-3xl border-2 border-gold/70 bg-night-2 text-4xl shadow-[0_0_40px_-8px_rgba(245,197,66,0.6)]"
        initial={{ rotate: -8, scale: 0.8, opacity: 0 }}
        animate={{ rotate: 0, scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 14 }}
        aria-hidden
      >
        ⚽
      </motion.div>
      <h1 className="font-display text-6xl leading-none text-white">
        MERCATO <span className="text-gold">DUEL</span>
      </h1>
      <p className="mt-1 text-sm text-muted">Construis ton 11 de légende</p>
    </div>
  );
}

export function HomeScreen() {
  const { game, go, openSetup } = useGame();
  const entries = useHistory((s) => s.entries);
  const stats = palmares(entries);
  const inProgress = game && game.phase !== 'termine';

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col px-4 pt-[max(2rem,env(safe-area-inset-top))]">
      <div className="flex flex-1 flex-col justify-center">
        <Logo />
        {entries.length > 0 && (
          <div className="mx-auto mt-6 flex gap-4 text-center text-xs text-muted" aria-label="Palmarès local">
            <div>
              <div className="font-display text-2xl text-white">{stats.j1}</div>Victoires J1
            </div>
            <div>
              <div className="font-display text-2xl text-white">{stats.j2}</div>Victoires J2
            </div>
            <div>
              <div className="font-display text-2xl text-white">{stats.bot}</div>Victoires bot
            </div>
            <div>
              <div className="font-display text-2xl text-white">{stats.nuls}</div>Nuls
            </div>
          </div>
        )}
      </div>

      <nav className="safe-bottom flex flex-col gap-3 pb-4" aria-label="Menu principal">
        {inProgress && (
          <Button variant="neon" onClick={() => go('game')}>
            ▶ Reprendre la partie
          </Button>
        )}
        {game && game.phase === 'termine' && (
          <Button variant="dark" onClick={() => go('result')}>
            Voir le dernier résultat
          </Button>
        )}
        <Button onClick={() => openSetup(false)} className="text-lg">
          Jouer à deux
        </Button>
        <Button variant="dark" onClick={() => openSetup(true)} className="text-lg">
          🤖 Solo contre le bot
        </Button>
        <div className="grid grid-cols-2 gap-3">
          <Button variant="ghost" onClick={() => go('history')}>
            Historique
          </Button>
          <Button variant="ghost" onClick={() => go('settings')}>
            Réglages
          </Button>
          <Button variant="ghost" onClick={() => go('tutorial')}>
            Règles
          </Button>
          <Button variant="ghost" onClick={() => go('credits')}>
            Crédits
          </Button>
        </div>
      </nav>
    </div>
  );
}
