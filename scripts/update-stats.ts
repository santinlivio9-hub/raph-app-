// OPTIONNEL — rafraîchit les performances (`perf`) via API-Football (https://www.api-football.com/),
// une API légale à clé. Désactivé par défaut : sans clé, le script explique quoi faire et s'arrête.
//
//   1. Crée un fichier .env à la racine :  API_FOOTBALL_KEY=ta_cle
//   2. npm run data:update-stats -- --season 2024 --limit 90
//   3. npm run data:build && npm run data:validate
//
// Les résultats vont dans scripts/perf-overrides.json (fusionné par build-players.ts) : on peut relancer
// le script plusieurs jours de suite, il reprend là où il s'est arrêté (offre gratuite ≈ 100 requêtes/jour).
// Note : API-Football ne fournit pas de valeur marché ; `valeurMarche` reste saisie à la main.
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { SOURCE } from './players-source.ts';
import { PERF_OVERRIDES_FILE, parseSource, readPerfOverrides } from './build-players.ts';
import type { Perf, Player } from '../src/game/types.ts';

const API = 'https://v3.football.api-sports.io';

function readEnvKey(): string | null {
  if (process.env.API_FOOTBALL_KEY) return process.env.API_FOOTBALL_KEY;
  const envFile = new URL('../.env', import.meta.url);
  if (!existsSync(envFile)) return null;
  const line = readFileSync(envFile, 'utf8')
    .split('\n')
    .find((l) => l.startsWith('API_FOOTBALL_KEY='));
  return line ? line.slice('API_FOOTBALL_KEY='.length).trim() || null : null;
}

const arg = (name: string, fallback: string) => {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? process.argv[i + 1] : fallback;
};

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

interface ApiStat {
  league: { name: string };
  games: { appearences: number | null; minutes: number | null; rating: string | null };
  goals: { total: number | null; assists: number | null; saves: number | null; conceded: number | null };
  tackles: { total: number | null; interceptions: number | null };
}

async function api<T>(key: string, path: string): Promise<T> {
  const res = await fetch(`${API}${path}`, { headers: { 'x-apisports-key': key } });
  if (!res.ok) throw new Error(`${res.status} sur ${path}`);
  const body = (await res.json()) as { response: T; errors?: unknown };
  if (body.errors && Object.keys(body.errors as object).length) throw new Error(`API : ${JSON.stringify(body.errors)}`);
  return body.response;
}

/** Garde la ligue où le joueur a le plus joué (le championnat, en général). */
function toPerf(stats: ApiStat[], season: string, previous: Perf): Partial<Perf> | null {
  const main = [...stats].sort((a, b) => (b.games.minutes ?? 0) - (a.games.minutes ?? 0))[0];
  if (!main || !main.games.minutes) return null;
  return {
    saison: season,
    matchs: main.games.appearences ?? 0,
    minutes: main.games.minutes ?? 0,
    buts: main.goals.total ?? 0,
    passesD: main.goals.assists ?? 0,
    arrets: main.goals.saves ?? previous.arrets,
    tacles: main.tackles.total ?? previous.tacles,
    interceptions: main.tackles.interceptions ?? previous.interceptions,
    noteMoyenne: main.games.rating ? Math.round(Number(main.games.rating) * 10) / 10 : previous.noteMoyenne,
    // Les clean sheets ne sont pas fournis par joueur : on garde la valeur saisie.
  };
}

async function main() {
  const key = readEnvKey();
  if (!key) {
    console.log('ℹ update-stats est désactivé : aucune clé API_FOOTBALL_KEY (variable d’environnement ou fichier .env).');
    console.log('  Les performances saisies à la main dans scripts/players-source.ts restent utilisées.');
    return;
  }
  const season = arg('season', '2024');
  const limit = Number(arg('limit', '90'));
  const label = `${season}-${String(Number(season) + 1).slice(2)}`;
  const overrides = readPerfOverrides();
  const players: Player[] = parseSource(SOURCE);
  const todo = players.filter((p) => !overrides[p.id] || overrides[p.id].saison !== label);
  let requests = 0;
  for (const p of todo) {
    if (requests + 2 > limit) break;
    try {
      const name = p.prenom ? `${p.prenom.split(' ')[0]} ${p.nom}` : p.nom;
      const found = await api<{ player: { id: number; name: string } }[]>(key, `/players/profiles?search=${encodeURIComponent(p.nom)}`);
      requests++;
      const match = found.find((f) => f.player.name.toLowerCase().includes(p.nom.toLowerCase())) ?? found[0];
      if (!match) {
        console.warn(`  ? ${name} introuvable`);
        continue;
      }
      const res = await api<{ statistics: ApiStat[] }[]>(key, `/players?id=${match.player.id}&season=${season}`);
      requests++;
      const perf = res[0] && toPerf(res[0].statistics, label, p.perf);
      if (perf) {
        overrides[p.id] = { ...perf, saison: label };
        console.log(`  ✔ ${name}`);
      }
      await sleep(400);
    } catch (e) {
      console.error(`  ✘ ${p.id} : ${(e as Error).message}`);
      if (/limit|quota|429/i.test((e as Error).message)) break;
    }
  }
  writeFileSync(PERF_OVERRIDES_FILE, JSON.stringify(overrides, null, 1) + '\n');
  console.log(`✔ ${Object.keys(overrides).length} joueurs à jour dans scripts/perf-overrides.json (${requests} requêtes). Lance ensuite npm run data:build.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
