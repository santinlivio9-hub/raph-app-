// Récupère les photos des joueurs depuis Wikimedia Commons, via Wikidata (propriété P18).
//
// 1. Résout l'identifiant Wikidata de chaque joueur (libellé + métier « footballeur » + année de naissance),
//    stocké dans scripts/wikidata-ids.json (les identifiants déjà connus sont conservés).
// 2. Lit l'image P18, puis interroge l'API Commons pour la vignette 300 px, l'auteur et la licence.
// 3. Écrit src/data/photos.json et régénère players.json avec les identifiants Wikidata.
//
// Usage : npm run data:photos            (ne résout que les joueurs sans identifiant)
//         npm run data:photos -- --all   (tout recalculer)
// Respecte les règles d'usage Wikimedia : User-Agent explicite, requêtes groupées et espacées.
import { writeFileSync } from 'node:fs';
import { SOURCE } from './players-source.ts';
import { WIKIDATA_IDS_FILE, parseSource, readWikidataIds, writePlayers } from './build-players.ts';
import type { Player } from '../src/game/types.ts';


const UA = 'MercatoDuel/2.0 (https://github.com/santinlivio9-hub/raph-app-; jeu open source)';
const SPARQL = 'https://query.wikidata.org/sparql';
const COMMONS = 'https://commons.wikimedia.org/w/api.php';
const FOOTBALLER = 'Q937857';
const LANGS = ['fr', 'en', 'es', 'pt', 'de', 'it'];
const REFERENCE_YEAR = 2026;
const PHOTOS_FILE = new URL('../src/data/photos.json', import.meta.url);

/** Libellés Wikidata différents du nom affiché dans le jeu. */
const LABEL_OVERRIDES: Record<string, string[]> = {
  alisson: ['Alisson Becker'],
  ederson: ['Ederson Moraes', 'Ederson Santana de Moraes'],
  nacho: ['Nacho Fernández', 'Nacho'],
  rodri: ['Rodri', 'Rodrigo Hernández Cascante'],
  danilo: ['Danilo Luiz da Silva', 'Danilo'],
  murillo: ['Murillo Costa dos Santos', 'Murillo'],
  vanderson: ['Vanderson', 'Vanderson de Oliveira Campos'],
  'vinicius-junior': ['Vinícius Júnior', 'Vini Jr.'],
  malcom: ['Malcom', 'Malcom Filipe Silva de Oliveira'],
  antony: ['Antony', 'Antony Matheus dos Santos'],
  'ivan-toney': ['Ivan Toney'],
  'joao-pedro': ['João Pedro', 'João Pedro Junqueira de Jesus'],
  'gabriel-magalhaes': ['Gabriel Magalhães'],
  'emerson-palmieri': ['Emerson Palmieri', 'Emerson'],
  'samu-aghehowa': ['Samu Aghehowa', 'Samu Omorodion'],
  'heung-min-son': ['Son Heung-min'],
  'min-jae-kim': ['Kim Min-jae'],
  'alex-sandro': ['Alex Sandro'],
  'abde-ezzalzouli': ['Abde Ezzalzouli', 'Abdessamad Ezzalzouli'],
  'marc-andre-ter-stegen': ['Marc-André ter Stegen'],
  'david-de-gea': ['David de Gea'],
  'virgil-van-dijk': ['Virgil van Dijk'],
  'stefan-de-vrij': ['Stefan de Vrij'],
  'micky-van-de-ven': ['Micky van de Ven'],
  'matthijs-de-ligt': ['Matthijs de Ligt'],
  'jan-paul-van-hecke': ['Jan Paul van Hecke'],
  'frenkie-de-jong': ['Frenkie de Jong'],
  'harry-maguire': ['Harry Maguire'],
  'ousmane-diomande': ['Ousmane Diomande (footballer, born 2003)', 'Ousmane Diomande'],
  'serge-gnabry': ['Serge Gnabry'],
};

/** Corrections manuelles quand Wikidata se trompe (null = pas de fiche fiable → avatar de repli). */
const PINNED: Record<string, string | null> = {
  'serge-gnabry': 'Q59490', // date de naissance erronée sur sa fiche Wikidata
  'ousmane-diomande': null, // seule fiche trouvée = un homonyme, pas le joueur du Sporting
};

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function getJson(url: string, init: RequestInit = {}, tries = 4): Promise<unknown> {
  for (let i = 0; ; i++) {
    const res = await fetch(url, { ...init, headers: { 'User-Agent': UA, Accept: 'application/json', ...(init.headers ?? {}) } });
    if (res.ok) return res.json();
    if (i >= tries || ![429, 500, 502, 503, 504].includes(res.status)) throw new Error(`${res.status} ${url.slice(0, 120)}`);
    await sleep(2000 * 2 ** i);
  }
}

const display = (p: Player) => (p.prenom ? `${p.prenom} ${p.nom}` : p.nom);
const esc = (s: string) => s.replace(/\\/g, '\\\\').replace(/"/g, '\\"');

interface Candidate {
  item: string;
  label: string;
  sitelinks: number;
  birthYears: number[];
  image: string | null;
}

async function sparqlCandidates(names: string[]): Promise<Candidate[]> {
  const values = names.flatMap((n) => LANGS.map((l) => `"${esc(n)}"@${l}`)).join(' ');
  const query = `SELECT ?item ?name (SAMPLE(?sl) AS ?sitelinks) (GROUP_CONCAT(DISTINCT STR(YEAR(?dob))) AS ?births) (SAMPLE(?img) AS ?image) WHERE {
  VALUES ?name { ${values} }
  ?item rdfs:label|skos:altLabel ?name ; wdt:P106 wd:${FOOTBALLER} .
  OPTIONAL { ?item wikibase:sitelinks ?sl }
  OPTIONAL { ?item wdt:P569 ?dob }
  OPTIONAL { ?item wdt:P18 ?img }
} GROUP BY ?item ?name`;
  const data = (await getJson(SPARQL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded', Accept: 'application/sparql-results+json' },
    body: new URLSearchParams({ query, format: 'json' }),
  })) as { results: { bindings: Record<string, { value: string }>[] } };
  return data.results.bindings.map((b) => ({
    item: b.item.value.split('/').pop()!,
    label: b.name.value,
    sitelinks: Number(b.sitelinks?.value ?? 0),
    birthYears: b.births?.value ? b.births.value.split(' ').map(Number) : [],
    image: b.image ? decodeURIComponent(b.image.value.split('/Special:FilePath/').pop()!) : null,
  }));
}

/** Choisit le bon homonyme : année de naissance cohérente avec l'âge, puis le plus « célèbre » (sitelinks). */
function pick(p: Player, cands: Candidate[]): Candidate | null {
  const names = new Set([display(p), ...(LABEL_OVERRIDES[p.id] ?? [])].map((n) => n.toLowerCase()));
  const mine = cands.filter((c) => names.has(c.label.toLowerCase()));
  const expected = REFERENCE_YEAR - p.age;
  const plausible = mine.filter((c) => !c.birthYears.length || c.birthYears.some((y) => Math.abs(y - expected) <= 1));
  if (!plausible.length) return null;
  return plausible.reduce((a, b) => (b.sitelinks > a.sitelinks ? b : a));
}

/** Repli : passe par le titre de l'article Wikipédia (anglais puis français). */
async function bySitelink(p: Player): Promise<string | null> {
  const titles = [display(p), ...(LABEL_OVERRIDES[p.id] ?? [])];
  for (const title of titles) {
    for (const wiki of ['en', 'fr']) {
      // Même garde-fou que pour les libellés : l'année de naissance doit coller à l'âge.
      const y = REFERENCE_YEAR - p.age;
      const query = `SELECT ?item WHERE { ?article schema:about ?item ; schema:isPartOf <https://${wiki}.wikipedia.org/> ; schema:name "${esc(title)}"@${wiki} . ?item wdt:P106 wd:${FOOTBALLER} ; wdt:P569 ?dob . FILTER(ABS(YEAR(?dob) - ${y}) <= 1) }`;
      const data = (await getJson(`${SPARQL}?${new URLSearchParams({ query, format: 'json' })}`)) as { results: { bindings: { item: { value: string } }[] } };
      const hit = data.results.bindings[0];
      await sleep(600);
      if (hit) return hit.item.value.split('/').pop()!;
      for (const suffix of [' (footballer)', ' (footballeur)']) {
        const q2 = query.replace(`"${esc(title)}"@${wiki}`, `"${esc(title + suffix)}"@${wiki}`);
        const d2 = (await getJson(`${SPARQL}?${new URLSearchParams({ query: q2, format: 'json' })}`)) as { results: { bindings: { item: { value: string } }[] } };
        await sleep(600);
        if (d2.results.bindings[0]) return d2.results.bindings[0].item.value.split('/').pop()!;
      }
    }
  }
  return null;
}

async function imagesOf(items: string[]): Promise<Record<string, string>> {
  const query = `SELECT ?item (SAMPLE(?img) AS ?image) WHERE { VALUES ?item { ${items.map((q) => `wd:${q}`).join(' ')} } ?item wdt:P18 ?img } GROUP BY ?item`;
  const data = (await getJson(SPARQL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded', Accept: 'application/sparql-results+json' },
    body: new URLSearchParams({ query, format: 'json' }),
  })) as { results: { bindings: Record<string, { value: string }>[] } };
  return Object.fromEntries(
    data.results.bindings.map((b) => [b.item.value.split('/').pop()!, decodeURIComponent(b.image.value.split('/Special:FilePath/').pop()!)]),
  );
}

export interface PhotoCredit {
  url: string;
  auteur: string;
  licence: string;
  licenceUrl: string | null;
  source: string;
}

const stripHtml = (s: string) =>
  s
    .replace(/<[^>]*>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();

async function commonsInfo(files: string[]): Promise<Record<string, PhotoCredit>> {
  const params = new URLSearchParams({
    action: 'query',
    format: 'json',
    formatversion: '2',
    prop: 'imageinfo',
    iiprop: 'url|extmetadata',
    iiurlwidth: '300',
    iiextmetadatafilter: 'Artist|LicenseShortName|LicenseUrl|Credit',
    titles: files.map((f) => `File:${f}`).join('|'),
  });
  const data = (await getJson(`${COMMONS}?${params}`)) as {
    query: { normalized?: { from: string; to: string }[]; pages: { title: string; imageinfo?: { thumburl: string; descriptionurl: string; extmetadata: Record<string, { value: string }> }[] }[] };
  };
  const back = new Map((data.query.normalized ?? []).map((n) => [n.to, n.from]));
  const out: Record<string, PhotoCredit> = {};
  for (const page of data.query.pages) {
    const info = page.imageinfo?.[0];
    if (!info) continue;
    const meta = info.extmetadata ?? {};
    const licence = stripHtml(meta.LicenseShortName?.value ?? '');
    // On n'accepte que des licences libres connues.
    if (!/^(CC|Public domain|PD|CC0|GFDL|Attribution)/i.test(licence)) continue;
    const file = (back.get(page.title) ?? page.title).replace(/^File:/, '');
    out[file] = {
      url: info.thumburl.split('?')[0].replace('https://thumb.wikimedia.org/', 'https://upload.wikimedia.org/'),
      auteur: stripHtml(meta.Artist?.value ?? meta.Credit?.value ?? 'Auteur inconnu').slice(0, 120) || 'Auteur inconnu',
      licence,
      licenceUrl: meta.LicenseUrl?.value ?? null,
      source: info.descriptionurl,
    };
  }
  return out;
}

async function main() {
  const all = process.argv.includes('--all');
  const ids = all ? {} : readWikidataIds();
  const players = parseSource(SOURCE, ids);

  // 1. Identifiants Wikidata manquants.
  for (const [pid, q] of Object.entries(PINNED)) {
    if (q) ids[pid] = q;
    else delete ids[pid];
  }
  const missing = players.filter((p) => !ids[p.id] && !(p.id in PINNED));
  console.log(`Résolution Wikidata : ${missing.length} joueur(s) à chercher…`);
  for (let i = 0; i < missing.length; i += 25) {
    const batch = missing.slice(i, i + 25);
    const names = [...new Set(batch.flatMap((p) => [display(p), ...(LABEL_OVERRIDES[p.id] ?? [])]))];
    const cands = await sparqlCandidates(names);
    for (const p of batch) {
      const c = pick(p, cands);
      if (c) ids[p.id] = c.item;
    }
    process.stdout.write(`  ${Math.min(i + 25, missing.length)}/${missing.length}\r`);
    await sleep(1200);
  }
  for (const p of missing.filter((x) => !ids[x.id])) {
    const q = await bySitelink(p);
    if (q) ids[p.id] = q;
  }
  const used = new Map<string, string>();
  for (const [pid, q] of Object.entries(ids)) {
    if (used.has(q)) {
      console.warn(`\n⚠ ${pid} et ${used.get(q)} pointent vers ${q} : identifiant retiré pour ${pid}`);
      delete ids[pid];
    } else used.set(q, pid);
  }
  writeFileSync(WIKIDATA_IDS_FILE, JSON.stringify(Object.fromEntries(Object.entries(ids).sort()), null, 2) + '\n');
  const unresolved = players.filter((p) => !ids[p.id] && !(p.id in PINNED)).map((p) => p.id);
  console.log(`\n✔ ${Object.keys(ids).length}/${players.length} identifiants${unresolved.length ? ` — non trouvés : ${unresolved.join(', ')}` : ''}`);

  // 2. Images P18.
  const qs = Object.values(ids);
  const imageByQ: Record<string, string> = {};
  for (let i = 0; i < qs.length; i += 150) {
    Object.assign(imageByQ, await imagesOf(qs.slice(i, i + 150)));
    await sleep(1200);
  }

  // 3. Vignettes + crédits Commons.
  const files = [...new Set(Object.values(imageByQ))];
  const creditByFile: Record<string, PhotoCredit> = {};
  for (let i = 0; i < files.length; i += 40) {
    Object.assign(creditByFile, await commonsInfo(files.slice(i, i + 40)));
    process.stdout.write(`  Commons ${Math.min(i + 40, files.length)}/${files.length}\r`);
    await sleep(1200);
  }

  const photos: Record<string, PhotoCredit> = {};
  for (const p of players) {
    const q = ids[p.id];
    const file = q && imageByQ[q];
    if (file && creditByFile[file]) photos[p.id] = creditByFile[file];
  }
  writeFileSync(PHOTOS_FILE, JSON.stringify(photos, null, 1) + '\n');
  writePlayers(parseSource(SOURCE, ids));
  console.log(`\n✔ ${Object.keys(photos).length}/${players.length} photos sous licence libre → src/data/photos.json`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
