import { describe, expect, it } from 'vitest';
import { PLAYERS } from './db';
import { LINKS, SLOTS, SLOT_POSTE } from './formation';
import { LOW_MINUTES, PERF_PENALTY_OUT_OF_POSITION, PERF_PENALTY_SECONDARY, perfBreakdown, perfScore } from './performance';
import { buildPool, minimumFor } from './pool';
import {
  LINK_VALUE,
  NAT_AND_COMPETITION_BONUS,
  computeTeamScore,
  decideWinner,
  effectiveNote,
  linkBetween,
  positionPenalty,
  teamHighlights,
} from './scoring';
import { simulateMatch } from './simulation';
import type { Player, PickVia, SlotId, TeamState } from './types';

const find = (pred: (p: Player) => boolean) => {
  const p = PLAYERS.find(pred);
  if (!p) throw new Error('joueur introuvable');
  return p;
};
const byId = (id: string) => find((p) => p.id === id);

function teamFrom(
  players: Partial<Record<SlotId, Player>>,
  opts: { budget?: number; prices?: Partial<Record<SlotId, number>>; via?: Partial<Record<SlotId, PickVia>> } = {},
): TeamState {
  const lineup: TeamState['lineup'] = {};
  SLOTS.forEach((slot, i) => {
    const p = players[slot];
    if (p) lineup[slot] = { playerId: p.id, slot, price: opts.prices?.[slot] ?? 0, via: opts.via?.[slot] ?? 'enchere', order: i + 1 };
  });
  return { lineup, budget: opts.budget ?? 0, jokers: 0, rerolls: 0 };
}

/** Onze « naturel » : pour chaque case, un joueur différent du bon poste. */
function naturalEleven(filter: (p: Player) => boolean = () => true): Partial<Record<SlotId, Player>> {
  const used = new Set<string>();
  const out: Partial<Record<SlotId, Player>> = {};
  for (const slot of SLOTS) {
    const p = PLAYERS.find((x) => x.poste === SLOT_POSTE[slot] && !used.has(x.id) && filter(x));
    if (!p) throw new Error(`pas de ${slot}`);
    used.add(p.id);
    out[slot] = p;
  }
  return out;
}

const ENCHERE = { mode: 'enchere' as const, perfWeight: 0.85 };
const DRAFT = { mode: 'draft' as const, perfWeight: 0.85 };

describe('score de performance par poste', () => {
  it('reste entre 0 et 100 pour toute la base', () => {
    for (const p of PLAYERS) {
      const s = perfScore(p);
      expect(s).toBeGreaterThanOrEqual(0);
      expect(s).toBeLessThanOrEqual(100);
    }
  });

  it('récompense les buts d’un buteur (normalisés par 90 min)', () => {
    const scorer = byId('viktor-gyokeres');
    const quiet = byId('rasmus-hojlund');
    expect(perfScore(scorer)).toBeGreaterThan(perfScore(quiet) + 20);
  });

  it('un gardien est jugé sur arrêts, clean sheets et note — pas sur les buts', () => {
    const gk = byId('mile-svilar');
    const comps = perfBreakdown(gk).components.map((c) => c.key);
    expect(comps.sort()).toEqual(['arrets', 'cleanSheets', 'note']);
  });

  it('pénalise un faible temps de jeu (< 900 min)', () => {
    const p = find((x) => x.perf.minutes > 0 && x.perf.minutes < LOW_MINUTES);
    const b = perfBreakdown(p);
    expect(b.minutesFactor).toBeLessThan(1);
    const full = { ...p, perf: { ...p.perf, minutes: LOW_MINUTES } };
    expect(perfScore(full)).toBeGreaterThanOrEqual(0);
    expect(perfBreakdown({ ...p, perf: { ...p.perf, minutes: 0 } }).minutesFactor).toBe(0.5);
  });

  it('pénalise un joueur hors poste ou au poste secondaire', () => {
    const p = find((x) => x.poste === 'DD' && x.postesSecondaires.includes('DC') && perfScore(x) > 40);
    expect(perfScore(p, 'DCG')).toBeCloseTo(perfScore(p, 'DD') - PERF_PENALTY_SECONDARY, 1);
    expect(perfScore(p, 'BU')).toBeCloseTo(perfScore(p, 'DD') - PERF_PENALTY_OUT_OF_POSITION, 1);
  });
});

describe('pénalités de poste (Draft)', () => {
  it('0 au poste naturel, −2 au poste secondaire, −8 hors poste', () => {
    const p = find((x) => x.poste === 'DD' && x.postesSecondaires.includes('DC'));
    expect(positionPenalty(p, 'DD')).toBe(0);
    expect(positionPenalty(p, 'DCG')).toBe(2);
    expect(positionPenalty(p, 'BU')).toBe(8);
    expect(effectiveNote(p, 'BU')).toBe(p.noteGenerale - 8);
  });
});

describe('liens du collectif', () => {
  it('même club = fort, même nationalité = moyen, même compétition = faible', () => {
    const a = find((x) => x.club === 'Arsenal');
    const sameClub = find((x) => x.club === 'Arsenal' && x.id !== a.id);
    expect(linkBetween(a, sameClub)).toEqual({ strength: 'fort', value: LINK_VALUE.fort });

    const fr = find((x) => x.nationalite === 'France' && x.competition === 'Ligue 1');
    const frAbroad = find((x) => x.nationalite === 'France' && x.competition === 'Liga');
    expect(linkBetween(fr, frAbroad)).toEqual({ strength: 'moyen', value: LINK_VALUE.moyen });
    const frSame = find((x) => x.nationalite === 'France' && x.competition === 'Ligue 1' && x.club !== fr.club);
    expect(linkBetween(fr, frSame)).toEqual({ strength: 'moyen', value: LINK_VALUE.moyen + NAT_AND_COMPETITION_BONUS });

    const pl1 = find((x) => x.competition === 'Premier League' && x.nationalite === 'Brésil');
    const pl2 = find((x) => x.competition === 'Premier League' && x.nationalite === 'Angleterre' && x.club !== pl1.club);
    expect(linkBetween(pl1, pl2).strength).toBe('faible');
    const it2 = find((x) => x.competition === 'Serie A' && x.nationalite === 'Italie');
    expect(linkBetween(pl1, it2)).toEqual({ strength: 'aucun', value: LINK_VALUE.aucun });
  });

  it('le graphe 4-3-3 relie chaque case sans doublon', () => {
    expect(new Set(LINKS.flat())).toEqual(new Set(SLOTS));
    expect(new Set(LINKS.map(([a, b]) => [a, b].sort().join('-'))).size).toBe(LINKS.length);
  });
});

describe('score d’équipe', () => {
  it('Enchères : 85 % performances + 15 % collectif (pondération réglable)', () => {
    const team = teamFrom(naturalEleven());
    const sc = computeTeamScore(team, ENCHERE);
    expect(sc.complete).toBe(true);
    expect(sc.total).toBeCloseTo(0.85 * sc.perfMoyenne + 0.15 * sc.collectif, 1);
    const sc70 = computeTeamScore(team, { mode: 'enchere', perfWeight: 0.7 });
    expect(sc70.total).toBeCloseTo(0.7 * sc.perfMoyenne + 0.3 * sc.collectif, 1);
  });

  it('Draft : 70 % note générale + 30 % collectif', () => {
    const sc = computeTeamScore(teamFrom(naturalEleven()), DRAFT);
    expect(sc.total).toBeCloseTo(0.7 * sc.noteGenerale + 0.3 * sc.collectif, 1);
  });

  it('la note générale applique les pénalités de poste', () => {
    const eleven = naturalEleven();
    const base = computeTeamScore(teamFrom(eleven), DRAFT).noteGenerale;
    const pen = computeTeamScore(teamFrom({ ...eleven, GK: eleven.BU, BU: eleven.GK }), DRAFT).noteGenerale;
    expect(pen).toBeCloseTo(base - 16 / 11, 1);
  });

  it('désigne le vainqueur au score, puis à la composante principale, sinon nul', () => {
    const a = { perfMoyenne: 60, noteGenerale: 85, collectif: 40, total: 57, weight: 0.85, links: [], complete: true };
    expect(decideWinner(a, { ...a, total: 50 }, 'enchere').winner).toBe(0);
    expect(decideWinner(a, { ...a, perfMoyenne: 61 }, 'enchere')).toEqual({ winner: 1, reason: 'departage' });
    expect(decideWinner(a, { ...a, noteGenerale: 86 }, 'draft')).toEqual({ winner: 1, reason: 'departage' });
    expect(decideWinner(a, { ...a }, 'enchere')).toEqual({ winner: null, reason: 'nul' });
  });
});

describe('moments forts (Enchères)', () => {
  it('meilleure affaire = meilleure perf par M€, flop = pire, mystère le plus chanceux', () => {
    const eleven = naturalEleven();
    const prices: Partial<Record<SlotId, number>> = Object.fromEntries(SLOTS.map((s) => [s, 40]));
    prices.BU = 2; // affaire évidente
    prices.GK = 150; // flop évident
    const team = teamFrom(eleven, { prices, via: { MCG: 'mystere', MCD: 'joker' } });
    const h = teamHighlights(team, 'enchere');
    expect(h.affaire!.player.id).toBe(eleven.BU!.id);
    expect(h.flop!.player.id).toBe(eleven.GK!.id);
    expect([eleven.MCG!.id, eleven.MCD!.id]).toContain(h.chanceux!.player.id);
    expect(h.mvp).not.toBeNull();
  });
});

describe('pioche', () => {
  it('ne garde que la notoriété ≥ 3, ou ≥ 2 en mode Expert', () => {
    const std = buildPool({ pool: 'toutes', expert: false }).map((id) => byId(id));
    expect(std.every((p) => p.notoriete >= 3)).toBe(true);
    expect(std.length).toBeGreaterThanOrEqual(400);
    const expert = buildPool({ pool: 'toutes', expert: true });
    expect(expert.length).toBeGreaterThan(std.length);
  });

  it('une compétition seule est complétée si un poste manque de joueurs', () => {
    const ids = buildPool({ pool: 'Bundesliga', expert: false });
    const ps = ids.map((id) => byId(id));
    expect(ps.filter((p) => p.competition === 'Bundesliga').length).toBeGreaterThan(0);
    for (const poste of new Set(Object.values(SLOT_POSTE))) {
      expect(ps.filter((p) => p.poste === poste).length).toBeGreaterThanOrEqual(minimumFor(poste));
    }
  });
});

describe('simulation de match', () => {
  it('est déterministe et cohérente avec les buts annoncés', () => {
    const a = teamFrom(naturalEleven());
    const b = teamFrom(naturalEleven((p) => p.noteGenerale < 84));
    const m1 = simulateMatch([a, b], ['A', 'B'], 123, 'enchere');
    expect(simulateMatch([a, b], ['A', 'B'], 123, 'enchere')).toEqual(m1);
    const goals = m1.events.filter((e) => e.kind === 'but');
    expect(goals.filter((g) => g.team === 0)).toHaveLength(m1.score[0]);
    expect(goals.filter((g) => g.team === 1)).toHaveLength(m1.score[1]);
    expect(m1.events[0].text).toMatch(/Coup d'envoi/);
    expect(m1.events.at(-1)!.text).toMatch(/final/);
  });

  it("l'équipe la plus performante gagne plus souvent", () => {
    const strong = teamFrom(naturalEleven((p) => perfScore(p) >= 65));
    const weak = teamFrom(naturalEleven((p) => perfScore(p) <= 50));
    let wins = 0;
    for (let seed = 0; seed < 200; seed++) {
      const m = simulateMatch([strong, weak], ['F', 'f'], seed, 'enchere');
      if (m.score[0] > m.score[1]) wins++;
    }
    expect(wins).toBeGreaterThan(100);
  });
});
