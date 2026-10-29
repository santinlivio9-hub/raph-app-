import { describe, expect, it } from 'vitest';
import { MAX_DOUBLE_PASSES, MYSTERY_RANGE, budgetReserve, currentSlot, maxPlayable, validateBid } from './auction';
import { botBlindBid, botLiveBid, botValuation, botWantsJoker } from './bot';
import { PLAYERS, getPlayer } from './db';
import { SLOTS, SLOT_POSTE } from './formation';
import { gameReducer } from './game';
import { newGame, seededRand } from './test-utils';
import type { GameState } from './types';

const card = (s: GameState) => getPlayer(s.auction!.cardId);
const bidBoth = (s: GameState, a: number, b: number) =>
  gameReducer(gameReducer(s, { type: 'BID', p: 0, amount: a }), { type: 'BID', p: 1, amount: b });

describe('révélation et joueur mystère', () => {
  it('révèle une carte du poste en cours et fixe le mystère dès la révélation', () => {
    const s = newGame();
    expect(currentSlot(s)).toBe('GK');
    expect(card(s).poste).toBe('GK');
    const mystery = getPlayer(s.auction!.mysteryId);
    expect(mystery.poste).toBe('GK');
    expect(mystery.id).not.toBe(card(s).id);
    expect(Math.abs(mystery.note - card(s).note)).toBeLessThanOrEqual(MYSTERY_RANGE);
    // Ni la carte ni le mystère ne peuvent être retirés à nouveau.
    expect(s.pool).not.toContain(card(s).id);
    expect(s.pool).not.toContain(mystery.id);
  });

  it("ne modifie pas le mystère pendant les offres", () => {
    const s = newGame();
    const before = s.auction!.mysteryId;
    const after = gameReducer(s, { type: 'BID', p: 0, amount: card(s).valeurMarche });
    expect(after.auction!.mysteryId).toBe(before);
  });

  it('est déterministe pour une même graine', () => {
    expect(newGame().auction).toEqual(newGame().auction);
    expect(newGame({ seed: 7 }).auction!.cardId).not.toBe(newGame({ seed: 8 }).auction!.cardId);
  });
});

describe('validation des offres', () => {
  it('refuse une offre sous le prix minimum', () => {
    const s = newGame();
    const r = validateBid(s, 0, card(s).valeurMarche - 1);
    expect(r.ok).toBe(false);
    expect(!r.ok && r.reason).toMatch(/prix minimum/);
  });

  it('accepte de passer (offre 0) et une offre au prix minimum', () => {
    const s = newGame();
    expect(validateBid(s, 0, 0).ok).toBe(true);
    expect(validateBid(s, 0, card(s).valeurMarche).ok).toBe(true);
  });

  it('refuse les offres non entières', () => {
    const s = newGame();
    expect(validateBid(s, 0, card(s).valeurMarche + 0.5).ok).toBe(false);
    expect(validateBid(s, 0, Number.NaN).ok).toBe(false);
  });

  it('applique la réserve de budget et affiche le budget max jouable', () => {
    const s = newGame();
    const reserve = budgetReserve(s);
    // 10 postes restent après le gardien : la réserve est la somme des prix minimums les plus bas.
    const expected = SLOTS.slice(1).reduce((sum, slot) => {
      const prices = s.pool.map(getPlayer).filter((p) => p.poste === SLOT_POSTE[slot]).map((p) => p.valeurMarche);
      return sum + Math.min(...prices);
    }, 0);
    expect(reserve).toBe(expected);
    expect(maxPlayable(s, 0)).toBe(1500 - reserve);
    const r = validateBid(s, 0, 1500 - reserve + 1);
    expect(r.ok).toBe(false);
    expect(!r.ok && r.reason).toMatch(/Budget max jouable : \d+ M€/);
    expect(validateBid(s, 0, 1500 - reserve).ok).toBe(true);
  });

  it("ignore une offre invalide dans le reducer", () => {
    const s = newGame();
    expect(gameReducer(s, { type: 'BID', p: 0, amount: 1 })).toBe(s);
  });

  it("n'accepte pas deux offres du même participant", () => {
    const s = gameReducer(newGame(), { type: 'BID', p: 0, amount: 0 });
    expect(gameReducer(s, { type: 'BID', p: 0, amount: 100 })).toBe(s);
  });
});

describe('résolution des enchères', () => {
  it("l'offre la plus haute gagne, paie, et le perdant reçoit le mystère gratuitement", () => {
    const s0 = newGame();
    const min = card(s0).valeurMarche;
    const mystery = s0.auction!.mysteryId;
    const s = bidBoth(s0, min + 10, min);
    expect(s.phase).toBe('mystere');
    expect(s.teams[0].budget).toBe(1500 - (min + 10));
    expect(s.teams[1].budget).toBe(1500);
    expect(s.teams[0].lineup.GK).toMatchObject({ playerId: s0.auction!.cardId, price: min + 10, via: 'enchere' });
    expect(s.teams[1].lineup.GK).toMatchObject({ playerId: mystery, price: 0, via: 'mystere' });
    expect(s.auction!.result).toMatchObject({ winner: 0, price: min + 10, tieBreak: 'aucun' });
  });

  it('celui qui passe perd contre une offre valide', () => {
    const s0 = newGame();
    const s = bidBoth(s0, 0, card(s0).valeurMarche);
    expect(s.auction!.result!.winner).toBe(1);
  });

  it("en cas d'égalité, le plus gros budget restant gagne", () => {
    const s0 = newGame();
    s0.teams[1].budget = 1600;
    const min = card(s0).valeurMarche;
    const s = bidBoth(s0, min, min);
    expect(s.auction!.result).toMatchObject({ winner: 1, tieBreak: 'budget' });
  });

  it("à budgets égaux, l'égalité se règle au tirage au sort (déterministe par graine)", () => {
    const winners = new Set<number>();
    for (let seed = 1; seed <= 20; seed++) {
      const s0 = newGame({ seed });
      const min = card(s0).valeurMarche;
      const s = bidBoth(s0, min, min);
      expect(s.auction!.result!.tieBreak).toBe('tirage');
      expect(bidBoth(newGame({ seed }), min, min).auction!.result!.winner).toBe(s.auction!.result!.winner);
      winners.add(s.auction!.result!.winner);
    }
    expect(winners).toEqual(new Set([0, 1]));
  });

  it('si les deux passent, la carte est retirée et une nouvelle est révélée', () => {
    const s0 = newGame();
    const firstCard = s0.auction!.cardId;
    const firstMystery = s0.auction!.mysteryId;
    const s = bidBoth(s0, 0, 0);
    expect(s.phase).toBe('encheres');
    expect(s.auction!.cardId).not.toBe(firstCard);
    expect(s.auction!.doublePasses).toBe(1);
    expect(s.pool).not.toContain(firstCard);
    expect(s.pool.includes(firstMystery) || s.auction!.mysteryId === firstMystery).toBe(true);
    expect(s.teams[0].lineup.GK).toBeUndefined();
  });

  it(`après ${MAX_DOUBLE_PASSES} doubles passes, chacun reçoit un joueur offert et on avance`, () => {
    let s = newGame();
    for (let i = 0; i < MAX_DOUBLE_PASSES; i++) s = bidBoth(s, 0, 0);
    expect(s.teams[0].lineup.GK?.via).toBe('cadeau');
    expect(s.teams[1].lineup.GK?.via).toBe('cadeau');
    expect(currentSlot(s)).toBe('DCG');
    expect(s.phase).toBe('encheres');
  });
});

describe('joker', () => {
  const afterAuction = () => {
    const s0 = newGame();
    return bidBoth(s0, card(s0).valeurMarche, 0);
  };

  it('remplace le mystère par un nouveau tirage du même poste, que le perdant garde', () => {
    const s = afterAuction();
    const first = s.auction!.result!.mysteryId;
    const j = gameReducer(s, { type: 'USE_JOKER' });
    const second = j.teams[1].lineup.GK!;
    expect(second.playerId).not.toBe(first);
    expect(second.via).toBe('joker');
    expect(second.price).toBe(0);
    expect(getPlayer(second.playerId).poste).toBe('GK');
    expect(Math.abs(getPlayer(second.playerId).note - card(s).note)).toBeLessThanOrEqual(MYSTERY_RANGE);
    expect(j.teams[1].jokers).toBe(0);
    expect(j.auction!.result).toMatchObject({ jokerUsed: true, firstMysteryId: first });
  });

  it("ne s'utilise qu'une fois par manche et qu'une fois par partie", () => {
    const s = afterAuction();
    const j = gameReducer(s, { type: 'USE_JOKER' });
    expect(gameReducer(j, { type: 'USE_JOKER' })).toEqual(j);
    // Manche suivante : le même participant perd encore, plus de joker.
    let n = gameReducer(j, { type: 'CONFIRM_MYSTERY' });
    n = bidBoth(n, getPlayer(n.auction!.cardId).valeurMarche, 0);
    expect(n.teams[1].jokers).toBe(0);
    const again = gameReducer(n, { type: 'USE_JOKER' });
    expect(again.teams[1].lineup.DCG!.via).toBe('mystere');
  });

  it('le gagnant ne peut pas utiliser le joker (seul le perdant en a l’usage)', () => {
    const s = afterAuction();
    const j = gameReducer(s, { type: 'USE_JOKER' });
    expect(j.teams[0].jokers).toBe(1);
  });
});

describe('enchère en direct', () => {
  const live = () => newGame({ auctionType: 'direct' });

  it('chaque surenchère doit dépasser la précédente, sans se surenchérir soi-même', () => {
    let s = live();
    const min = card(s).valeurMarche;
    expect(gameReducer(s, { type: 'BID', p: 0, amount: min })).toBe(s);
    s = gameReducer(s, { type: 'LIVE_BID', p: 0, amount: min });
    expect(s.auction!.live).toEqual({ high: min, bidder: 0 });
    expect(gameReducer(s, { type: 'LIVE_BID', p: 0, amount: min + 5 })).toBe(s);
    expect(gameReducer(s, { type: 'LIVE_BID', p: 1, amount: min })).toBe(s);
    s = gameReducer(s, { type: 'LIVE_BID', p: 1, amount: min + 5 });
    s = gameReducer(s, { type: 'LIVE_END' });
    expect(s.auction!.result).toMatchObject({ winner: 1, price: min + 5 });
    expect(s.teams[1].budget).toBe(1500 - min - 5);
  });

  it('sans aucune offre à la fin du minuteur, la carte est retirée', () => {
    const s = gameReducer(live(), { type: 'LIVE_END' });
    expect(s.phase).toBe('encheres');
    expect(s.auction!.doublePasses).toBe(1);
  });
});

describe('bots', () => {
  it('le bot ne dépasse jamais son budget max jouable et respecte le prix minimum', () => {
    for (let seed = 1; seed <= 30; seed++) {
      const s = newGame({ seed });
      for (const level of ['facile', 'moyen', 'difficile'] as const) {
        const bid = botBlindBid(s, 1, level, seededRand(seed));
        expect(validateBid(s, 1, bid).ok).toBe(true);
      }
    }
  });

  it('le bot surenchérit en direct tant que sa valorisation le permet', () => {
    const s = newGame({ auctionType: 'direct' });
    const min = card(s).valeurMarche;
    expect(botLiveBid(s, 1, min - 1)).toBeNull();
    expect(botLiveBid(s, 1, min + 20)).toBe(min);
    const s2 = gameReducer(s, { type: 'LIVE_BID', p: 0, amount: min });
    expect(botLiveBid(s2, 1, min + 20)).toBe(min + 5);
    expect(botLiveBid(s2, 0, min + 20)).toBeNull();
  });

  it('le bot utilise son joker quand le mystère est nettement plus faible', () => {
    const s0 = newGame();
    const s = bidBoth(s0, card(s0).valeurMarche, 0);
    const weak = PLAYERS.find((p) => p.poste === 'GK' && p.note <= card(s0).note - 5);
    if (!weak) return;
    s.auction!.result!.mysteryId = weak.id;
    expect(botWantsJoker(s, 'difficile')).toBe(true);
    s.auction!.result!.mysteryId = s.auction!.cardId;
    expect(botWantsJoker(s, 'moyen')).toBe(false);
  });

  it('une partie complète bot contre bot se termine avec deux onzes valides', () => {
    for (const auctionType of ['aveugle', 'direct'] as const) {
      for (let seed = 1; seed <= 15; seed++) {
        const rand = seededRand(seed);
        let s = newGame({ seed, auctionType });
        let guard = 0;
        while (s.phase !== 'termine' && guard++ < 500) {
          if (s.phase === 'mystere') {
            s = botWantsJoker(s, 'moyen', rand) ? gameReducer(s, { type: 'USE_JOKER' }) : gameReducer(s, { type: 'CONFIRM_MYSTERY' });
            if (s.phase === 'mystere') s = gameReducer(s, { type: 'CONFIRM_MYSTERY' });
          } else if (auctionType === 'aveugle') {
            s = bidBoth(s, botBlindBid(s, 0, 'difficile', rand), botBlindBid(s, 1, 'facile', rand));
          } else {
            const vals = [botValuation(s, 0, 'moyen', rand), botValuation(s, 1, 'difficile', rand)];
            for (let i = 0; i < 200; i++) {
              const p = (i % 2) as 0 | 1;
              const bid = botLiveBid(s, p, vals[p]);
              if (bid === null && botLiveBid(s, (1 - p) as 0 | 1, vals[1 - p]) === null) break;
              if (bid !== null) s = gameReducer(s, { type: 'LIVE_BID', p, amount: bid });
            }
            s = gameReducer(s, { type: 'LIVE_END' });
          }
        }
        expect(s.phase).toBe('termine');
        const ids = s.teams.flatMap((t) => SLOTS.map((slot) => t.lineup[slot]!.playerId));
        expect(ids).toHaveLength(22);
        expect(new Set(ids).size).toBe(22);
        for (const t of s.teams) {
          expect(t.budget).toBeGreaterThanOrEqual(0);
          for (const slot of SLOTS) expect(t.lineup[slot]).toBeDefined();
        }
      }
    }
  });
});
