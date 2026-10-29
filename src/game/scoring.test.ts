import { describe, expect, it } from 'vitest';
import { PLAYERS } from './db';
import { LINKS, SLOTS, SLOT_POSTE } from './formation';
import {
  LINK_VALUE,
  NAT_AND_LEAGUE_BONUS,
  budgetBonus,
  computeTeamScore,
  decideWinner,
  effectiveNote,
  linkBetween,
  positionPenalty,
  teamHighlights,
} from './scoring';
import { simulateMatch } from './simulation';
import type { Player, SlotId, TeamState } from './types';

const find = (pred: (p: Player) => boolean) => {
  const p = PLAYERS.find(pred);
  if (!p) throw new Error('joueur introuvable');
  return p;
};

function teamFrom(players: Partial<Record<SlotId, Player>>, budget = 0, prices: Partial<Record<SlotId, number>> = {}): TeamState {
  const lineup: TeamState['lineup'] = {};
  SLOTS.forEach((slot, i) => {
    const p = players[slot];
    if (p) lineup[slot] = { playerId: p.id, slot, price: prices[slot] ?? 0, via: prices[slot] ? 'enchere' : 'mystere', order: i + 1 };
  });
  return { lineup, budget, jokers: 0, rerolls: 0 };
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

describe('pénalités de poste', () => {
  it('0 au poste naturel, −2 au poste secondaire, −8 hors poste', () => {
    const p = find((x) => x.poste === 'DD' && x.postesSecondaires.includes('DC'));
    expect(positionPenalty(p, 'DD')).toBe(0);
    expect(positionPenalty(p, 'DCG')).toBe(2);
    expect(positionPenalty(p, 'BU')).toBe(8);
    expect(effectiveNote(p, 'BU')).toBe(p.note - 8);
  });
});

describe('liens du collectif', () => {
  it('même club = fort, même nationalité = moyen, même ligue = faible', () => {
    const a = find((x) => x.club === 'Arsenal');
    const sameClub = find((x) => x.club === 'Arsenal' && x.id !== a.id);
    expect(linkBetween(a, sameClub)).toEqual({ strength: 'fort', value: LINK_VALUE.fort });

    const fr = find((x) => x.nationalite === 'France' && x.ligue === 'Ligue 1');
    const frAbroad = find((x) => x.nationalite === 'France' && x.ligue === 'LaLiga');
    expect(linkBetween(fr, frAbroad)).toEqual({ strength: 'moyen', value: LINK_VALUE.moyen });
    const frSameLeague = find((x) => x.nationalite === 'France' && x.ligue === 'Ligue 1' && x.club !== fr.club);
    expect(linkBetween(fr, frSameLeague)).toEqual({ strength: 'moyen', value: LINK_VALUE.moyen + NAT_AND_LEAGUE_BONUS });

    const pl1 = find((x) => x.ligue === 'Premier League' && x.nationalite === 'Brésil');
    const pl2 = find((x) => x.ligue === 'Premier League' && x.nationalite === 'Angleterre' && x.club !== pl1.club);
    expect(linkBetween(pl1, pl2).strength).toBe('faible');

    const none = find((x) => x.ligue === 'Serie A' && x.nationalite === 'Italie');
    expect(linkBetween(pl1, none)).toEqual({ strength: 'aucun', value: LINK_VALUE.aucun });
  });

  it('le graphe 4-3-3 relie chaque case et ne contient pas de doublon', () => {
    const covered = new Set(LINKS.flat());
    expect(covered).toEqual(new Set(SLOTS));
    const keys = LINKS.map(([a, b]) => [a, b].sort().join('-'));
    expect(new Set(keys).size).toBe(LINKS.length);
  });
});

describe('score final', () => {
  it('bonus budget : +1 par tranche de 100 M€, plafonné à +3', () => {
    expect(budgetBonus(0)).toBe(0);
    expect(budgetBonus(99)).toBe(0);
    expect(budgetBonus(100)).toBe(1);
    expect(budgetBonus(250)).toBe(2);
    expect(budgetBonus(1200)).toBe(3);
  });

  it('score = 70 % note générale + 30 % collectif + bonus budget (Enchères)', () => {
    const team = teamFrom(naturalEleven(), 260);
    const sc = computeTeamScore(team, 'enchere');
    expect(sc.complete).toBe(true);
    expect(sc.links).toHaveLength(LINKS.length);
    expect(sc.bonusBudget).toBe(2);
    expect(sc.total).toBeCloseTo(0.7 * sc.noteGenerale + 0.3 * sc.collectif + 2, 1);
    expect(computeTeamScore(team, 'draft').bonusBudget).toBe(0);
  });

  it('un onze d’un seul club atteint un collectif de 100', () => {
    const team = teamFrom(naturalEleven((p) => p.club === 'Real Madrid' || p.poste === 'GK'));
    // Tous Real Madrid sauf éventuellement des gardiens : on force un gardien du Real.
    team.lineup.GK!.playerId = find((p) => p.club === 'Real Madrid' && p.poste === 'GK').id;
    const covered = SLOTS.every((s) => {
      const id = team.lineup[s]!.playerId;
      return PLAYERS.find((p) => p.id === id)!.club === 'Real Madrid';
    });
    if (covered) expect(computeTeamScore(team, 'draft').collectif).toBe(100);
  });

  it('la note générale applique les pénalités de poste', () => {
    const eleven = naturalEleven();
    const base = computeTeamScore(teamFrom(eleven), 'draft').noteGenerale;
    const swapped = { ...eleven, GK: eleven.BU, BU: eleven.GK };
    const pen = computeTeamScore(teamFrom(swapped), 'draft').noteGenerale;
    expect(pen).toBeCloseTo(base - 16 / 11, 2);
  });

  it('désigne le vainqueur au score, puis à la note générale, sinon nul', () => {
    const a = { noteGenerale: 85, collectif: 40, bonusBudget: 0, total: 71.5, links: [], complete: true };
    expect(decideWinner(a, { ...a, total: 70 }).winner).toBe(0);
    expect(decideWinner(a, { ...a, noteGenerale: 86 })).toEqual({ winner: 1, reason: 'note' });
    expect(decideWinner(a, { ...a })).toEqual({ winner: null, reason: 'nul' });
  });
});

describe('moments forts', () => {
  it('meilleure affaire et plus gros flop en mode Enchères', () => {
    const eleven = naturalEleven();
    const prices: Partial<Record<SlotId, number>> = { GK: eleven.GK!.valeurMarche + 150, BU: eleven.BU!.valeurMarche };
    const h = teamHighlights(teamFrom(eleven, 0, prices), 'enchere');
    expect(h.mvp).not.toBeNull();
    expect(h.flop!.player.id).toBe(eleven.GK!.id);
    expect(h.affaire!.pick.price).toBe(0);
  });
});

describe('simulation de match', () => {
  it('est déterministe et cohérente avec les buts annoncés', () => {
    const a = teamFrom(naturalEleven());
    const b = teamFrom(naturalEleven((p) => p.note < 84));
    const m1 = simulateMatch([a, b], ['A', 'B'], 123);
    const m2 = simulateMatch([a, b], ['A', 'B'], 123);
    expect(m1).toEqual(m2);
    const goals = m1.events.filter((e) => e.kind === 'but');
    expect(goals.filter((g) => g.team === 0)).toHaveLength(m1.score[0]);
    expect(goals.filter((g) => g.team === 1)).toHaveLength(m1.score[1]);
    expect(m1.events[0].text).toMatch(/Coup d'envoi/);
    expect(m1.events.at(-1)!.text).toMatch(/final/);
    const minutes = m1.events.map((e) => e.minute);
    expect([...minutes].sort((x, y) => x - y)).toEqual(minutes);
  });

  it("l'équipe plus forte gagne plus souvent", () => {
    const strong = teamFrom(naturalEleven((p) => p.note >= 85));
    const weak = teamFrom(naturalEleven((p) => p.note <= 80));
    let wins = 0;
    for (let seed = 0; seed < 200; seed++) {
      const m = simulateMatch([strong, weak], ['F', 'f'], seed);
      if (m.score[0] > m.score[1]) wins++;
    }
    expect(wins).toBeGreaterThan(100);
  });
});
