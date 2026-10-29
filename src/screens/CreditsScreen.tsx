import { useMemo, useState } from 'react';
import { PlayerFace } from '../components/PlayerCard';
import { Page } from '../components/ui';
import { PERF_SEASON_LABEL, displayName, getPlayer } from '../game/db';
import { allPhotoCredits } from '../lib/photos';
import { useGame } from '../store/game';

export function CreditsScreen() {
  const go = useGame((s) => s.go);
  const [query, setQuery] = useState('');
  const credits = useMemo(
    () =>
      allPhotoCredits()
        .map(([id, c]) => ({ player: getPlayer(id), c }))
        .sort((a, b) => a.player.nom.localeCompare(b.player.nom, 'fr')),
    [],
  );
  const q = query.trim().toLowerCase();
  const shown = q ? credits.filter(({ player, c }) => `${displayName(player)} ${c.auteur}`.toLowerCase().includes(q)) : credits;

  return (
    <Page title="Crédits" onBack={() => go('home')}>
      <section className="mb-4 space-y-2 rounded-2xl border border-line bg-night-2 p-3 text-sm leading-relaxed">
        <p>
          <strong>Photos</strong> : Wikimedia Commons, via Wikidata, sous licences libres (CC BY, CC BY-SA, CC0, domaine public). Auteur et
          licence de chaque photo ci-dessous. Les joueurs sans photo libre ont un avatar généré.
        </p>
        <p>
          <strong>Données</strong> : valeurs marché et performances ({PERF_SEASON_LABEL}) saisies à la main, approximatives — aucune donnée
          officielle ni scraping. Aucun logo de club ou de compétition, aucune carte EA FC/FIFA.
        </p>
        <p className="text-muted">Polices : Bebas Neue et Inter (Google Fonts, licence OFL).</p>
      </section>
      <label className="mb-3 block">
        <span className="sr-only">Rechercher un joueur ou un auteur</span>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={`Rechercher parmi ${credits.length} photos…`}
          className="min-h-[48px] w-full rounded-xl border border-line bg-night px-3 outline-none focus:border-gold"
        />
      </label>
      <ul className="divide-y divide-line pb-6">
        {shown.map(({ player, c }) => (
          <li key={player.id} className="flex items-center gap-3 py-2">
            <PlayerFace player={player} size={40} />
            <div className="min-w-0 flex-1 text-sm">
              <div className="truncate font-semibold">{displayName(player)}</div>
              <div className="truncate text-xs text-muted">
                {c.auteur} ·{' '}
                {c.licenceUrl ? (
                  <a className="underline" href={c.licenceUrl} target="_blank" rel="noreferrer">
                    {c.licence}
                  </a>
                ) : (
                  c.licence
                )}{' '}
                ·{' '}
                <a className="underline" href={c.source} target="_blank" rel="noreferrer">
                  source
                </a>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </Page>
  );
}
