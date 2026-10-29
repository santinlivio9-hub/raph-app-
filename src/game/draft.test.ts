import { describe, expect, it } from 'vitest';
import { botDraftAction } from './bot';
import { getPlayer } from './db';
import { OFFER_SIZE, TOTAL_PICKS, draftTurn, snakeTurn } from './draft';
import { SLOTS, SLOT_POSTE } from './formation';
import { gameReducer } from './game';
import { newGame, seededRand } from './test-utils';

const draft = (o = {}) => newGame({ mode: 'draft', ...o });

describe('ordre serpent', () => {
  it('alterne J1, J2, J2, J1, J1, J2…', () => {
    expect(Array.from({ length: 8 }, (_, i) => snakeTurn(i))).toEqual([0, 1, 1, 0, 0, 1, 1, 0]);
  });

  it('donne 11 choix à chacun sur 22', () => {
    const counts = [0, 0];
    for (let i = 0; i < TOTAL_PICKS; i++) counts[snakeTurn(i)]++;
    expect(counts).toEqual([11, 11]);
  });
});

describe('draft par poste', () => {
  it('propose 6 cartes du poste en cours', () => {
    const s = draft();
    expect(s.draft!.offer).toHaveLength(OFFER_SIZE);
    expect(new Set(s.draft!.offer).size).toBe(OFFER_SIZE);
    for (const id of s.draft!.offer) expect(getPlayer(id).poste).toBe('GK');
    expect(s.teams[0].budget).toBe(0);
  });

  it('place la carte choisie, renvoie les 5 autres dans la pioche et passe la main', () => {
    const s = draft();
    const [chosen, ...rest] = s.draft!.offer;
    const n = gameReducer(s, { type: 'DRAFT_PICK', playerId: chosen });
    expect(n.teams[0].lineup.GK).toMatchObject({ playerId: chosen, via: 'draft', price: 0, order: 1 });
    expect(n.pool).not.toContain(chosen);
    for (const id of rest) expect(n.pool).toContain(id);
    expect(draftTurn(n)).toBe(1);
    expect(n.draft!.offer.every((id) => getPlayer(id).poste === 'GK')).toBe(true);
  });

  it('ignore un choix hors des 6 cartes proposées', () => {
    const s = draft();
    const outside = s.pool.find((id) => !s.draft!.offer.includes(id))!;
    expect(gameReducer(s, { type: 'DRAFT_PICK', playerId: outside })).toBe(s);
  });

  it('permet une seule relance de pioche par participant', () => {
    const s = draft();
    const r = gameReducer(s, { type: 'DRAFT_REROLL' });
    expect(r.teams[0].rerolls).toBe(0);
    expect(r.draft!.offer).not.toEqual(s.draft!.offer);
    expect(r.draft!.offer.some((id) => s.draft!.offer.includes(id))).toBe(false);
    expect(gameReducer(r, { type: 'DRAFT_REROLL' })).toBe(r);
  });

  it("n'autorise pas de relance si l'option est désactivée", () => {
    const s = draft({ draftReroll: false });
    expect(gameReducer(s, { type: 'DRAFT_REROLL' })).toBe(s);
  });
});

describe('draft libre', () => {
  it('propose des cartes de postes encore libres et place chaque joueur sur une case compatible', () => {
    let s = draft({ draftOffer: 'libre' });
    const rand = seededRand(3);
    while (s.phase !== 'termine') {
      const p = draftTurn(s);
      const free = new Set(SLOTS.filter((slot) => !s.teams[p].lineup[slot]).map((slot) => SLOT_POSTE[slot]));
      for (const id of s.draft!.offer) {
        const pl = getPlayer(id);
        expect(free.has(pl.poste) || pl.postesSecondaires.some((x) => free.has(x))).toBe(true);
      }
      s = gameReducer(s, botDraftAction(s, 'moyen', rand)!);
    }
    for (const t of s.teams) {
      for (const slot of SLOTS) {
        const pl = getPlayer(t.lineup[slot]!.playerId);
        expect(pl.poste === SLOT_POSTE[slot] || pl.postesSecondaires.includes(SLOT_POSTE[slot])).toBe(true);
      }
    }
  });
});

describe('partie complète', () => {
  it('se termine quand les deux onzes sont complets', () => {
    for (const level of ['facile', 'moyen', 'difficile'] as const) {
      let s = draft({ seed: 99 });
      const rand = seededRand(1);
      let guard = 0;
      while (s.phase !== 'termine' && guard++ < 100) s = gameReducer(s, botDraftAction(s, level, rand)!);
      expect(s.phase).toBe('termine');
      expect(s.draft!.pickIndex).toBe(TOTAL_PICKS);
      const ids = s.teams.flatMap((t) => SLOTS.map((slot) => t.lineup[slot]!.playerId));
      expect(new Set(ids).size).toBe(22);
    }
  });
});
