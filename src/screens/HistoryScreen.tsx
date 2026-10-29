import { useState } from 'react';
import { Button, Page, TeamName } from '../components/ui';
import { palmares, useHistory } from '../store/history';
import { useGame } from '../store/game';

const fmtDate = (t: number) =>
  new Date(t).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });

export function HistoryScreen() {
  const go = useGame((s) => s.go);
  const { entries, clear } = useHistory();
  const [confirm, setConfirm] = useState(false);
  const p = palmares(entries);

  return (
    <Page title="Historique" onBack={() => go('home')}>
      <section aria-label="Palmarès" className="mb-4 grid grid-cols-4 gap-2 text-center">
        {[
          ['Victoires J1', p.j1],
          ['Victoires J2', p.j2],
          ['Victoires bot', p.bot],
          ['Nuls', p.nuls],
        ].map(([label, v]) => (
          <div key={label} className="rounded-2xl border border-line bg-night-2 py-2">
            <div className="font-display text-3xl text-gold">{v}</div>
            <div className="text-[11px] text-muted">{label}</div>
          </div>
        ))}
      </section>

      {entries.length === 0 ? (
        <p className="mt-10 text-center text-muted">Aucune partie terminée pour l'instant.</p>
      ) : (
        <ul className="flex flex-col gap-2 pb-4">
          {entries.map((e) => (
            <li key={e.id} className="rounded-2xl border border-line bg-night-2 p-3">
              <div className="mb-1 flex justify-between text-xs text-muted">
                <span>
                  {e.mode === 'enchere' ? '🔨 Enchères' : '🃏 Draft'}
                  {e.vsBot && ' · vs bot'}
                </span>
                <span>{fmtDate(e.date)}</span>
              </div>
              {([0, 1] as const).map((i) => (
                <div key={i} className="flex items-center justify-between gap-2">
                  <TeamName name={e.names[i]} color={e.colors[i]} className={e.winner === i ? 'font-bold' : 'text-muted'} />
                  <span className={`font-display text-2xl ${e.winner === i ? 'text-neon' : 'text-white/70'}`}>
                    {e.scores[i].toFixed(1)}
                    {e.winner === i && <span className="sr-only"> (vainqueur)</span>}
                    {e.winner === i && ' 🏆'}
                  </span>
                </div>
              ))}
              {e.winner === null && <div className="text-xs text-gold">Match nul</div>}
            </li>
          ))}
        </ul>
      )}

      {entries.length > 0 && (
        <div className="safe-bottom mt-auto">
          {confirm ? (
            <div className="grid grid-cols-2 gap-3">
              <Button variant="danger" onClick={() => (clear(), setConfirm(false))}>
                Oui, tout effacer
              </Button>
              <Button variant="ghost" onClick={() => setConfirm(false)}>
                Annuler
              </Button>
            </div>
          ) : (
            <Button variant="ghost" className="w-full" onClick={() => setConfirm(true)}>
              Effacer l'historique
            </Button>
          )}
        </div>
      )}
    </Page>
  );
}
