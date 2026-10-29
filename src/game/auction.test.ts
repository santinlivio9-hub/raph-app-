import { describe, expect, it } from 'vitest';
import { MAX_DOUBLE_PASSES, budgetReserve, currentSlot, maxPlayable, validateBid } from './auction';
import { botBlindBid, botLiveBid, botValuation, botWantsJoker } from './bot';
import { getPlayer } from './db';
import { SLOTS, SLOT_POSTE } from './formation';
import { gameReducer } from './game';
import { newGame, seededRand } from './test-utils';
import type { GameState } from './types';

const card = (s: GameState) => getPlayer(s.auction!.cardId);
const value = (id: string) => getPlayer(id).valeurMarche;
const bidBoth = (s: GameState, a: number, b: number) =>
  gameReducer(gameReducer(s, { type: 'BID', p: 0, amount: a }), { type: 'BID', p: 1, amount: b });

describe('révélation et joueurs mystère', () => {
  it('révèle une carte du poste en cours et fixe un mystère secret par participant', () => {
    const s = newGame();
    expect(currentSlot(s)).toBe('GK');
    expect(card(s).poste).toBe('GK');
    const [m0, m1] = s.auction!.mysteries;
    expect(new Set([s.auction!.cardId, m0, m1]).size).toBe(3);
    for (const id of [m0, m1]) {
      expect(getPlayer(id).poste).toBe('GK');
      expect(s.pool).not.toContain(id);
    }
    expect(s.pool).not.toContain(card(s).id);
  });

  it('les mystères ne bougent pas pendant les offres', () => {
    const s = newGame();
    const before = s.auction!.mysteries;
    const after = gameReducer(s, { type: 'BID', p: 0, amount: card(s).valeurMarche });
    expect(after.auction!.mysteries).toEqual(before);
  });

  it('chaque mystère est payable par son participant (réserve respectée)', () => {
    for (let seed = 1; seed <= 40; seed++) {
      const s = newGame({ seed });
      s.auction!.mysteries.forEach((id, p) => {
        expect(value(id)).toBeLessThanOrEqual(s.teams[p].budget - budgetReserve(s));
      });
    }
  });

  it('les mystères varient : bon marché comme chers', () => {
    const prices = new Set<number>();
    for (let seed = 1; seed <= 60; seed++) prices.add(value(newGame({ seed }).auction!.mysteries[0]));
    expect(Math.min(...prices)).toBeLessThan(10);
    expect(Math.max(...prices)).toBeGreaterThanOrEqual(25);
  });

  it('est déterministe pour une même graine', () => {
    expect(newGame().auction).toEqual(newGame().auction);
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

  it('applique la réserve : le moins cher de chaque poste restant doit rester payable', () => {
    const s = newGame();
    const excluded = [s.auction!.cardId, ...s.auction!.mysteries];
    const pool = s.pool.filter((id) => !excluded.includes(id)).map(getPlayer);
    const expected = SLOTS.slice(1).reduce(
      (sum, slot) => sum + Math.min(...pool.filter((p) => p.poste === SLOT_POSTE[slot]).map((p) => p.valeurMarche)),
      0,
    );
    expect(budgetReserve(s)).toBe(expected);
    expect(maxPlayable(s, 0)).toBe(1500 - expected);
    const r = validateBid(s, 0, 1500 - expected + 1);
    expect(r.ok).toBe(false);
    expect(!r.ok && r.reason).toMatch(/Max jouable : \d+ M€/);
    expect(validateBid(s, 0, 1500 - expected).ok).toBe(true);
  });

  it("ignore une offre invalide dans le reducer et n'accepte qu'une offre par participant", () => {
    const s = newGame();
    expect(gameReducer(s, { type: 'BID', p: 0, amount: 1 })).toBe(s);
    const s2 = gameReducer(s, { type: 'BID', p: 0, amount: 0 });
    expect(gameReducer(s2, { type: 'BID', p: 0, amount: 100 })).toBe(s2);
  });
});

describe('résolution des enchères', () => {
  it("le gagnant paie son offre, le perdant reçoit son mystère et paie sa valeur marché", () => {
    const s0 = newGame();
    const min = card(s0).valeurMarche;
    const [, m1] = s0.auction!.mysteries;
    const s = bidBoth(s0, min + 10, min);
    expect(s.phase).toBe('mystere');
    expect(s.teams[0].budget).toBe(1500 - (min + 10));
    expect(s.teams[1].budget).toBe(1500 - value(m1));
    expect(s.teams[0].lineup.GK).toMatchObject({ playerId: s0.auction!.cardId, price: min + 10, via: 'enchere' });
    expect(s.teams[1].lineup.GK).toMatchObject({ playerId: m1, price: value(m1), via: 'mystere' });
    expect(s.auction!.result).toMatchObject({ winner: 0, price: min + 10, mysteryId: m1, mysteryPrice: value(m1), tieBreak: 'aucun' });
    // Le mystère du gagnant retourne dans la pioche.
    expect(s.pool).toContain(s0.auction!.mysteries[0]);
  });

  it('celui qui passe perd contre une offre valide', () => {
    const s0 = newGame();
    expect(bidBoth(s0, 0, card(s0).valeurMarche).auction!.result!.winner).toBe(1);
  });

  it("en cas d'égalité, le plus gros budget restant gagne", () => {
    const s0 = newGame();
    s0.teams[1].budget = 1600;
    const min = card(s0).valeurMarche;
    expect(bidBoth(s0, min, min).auction!.result).toMatchObject({ winner: 1, tieBreak: 'budget' });
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

  it('si les deux passent : carte retirée, nouvelle carte et nouveaux mystères', () => {
    const s0 = newGame();
    const s = bidBoth(s0, 0, 0);
    expect(s.phase).toBe('encheres');
    expect(s.auction!.cardId).not.toBe(s0.auction!.cardId);
    expect(s.auction!.doublePasses).toBe(1);
    expect(s.pool).not.toContain(s0.auction!.cardId);
    expect(s.teams[0].lineup.GK).toBeUndefined();
    expect(s.teams[0].budget).toBe(1500);
  });

  it(`après ${MAX_DOUBLE_PASSES} doubles passes, chacun reçoit (et paie) un mystère d'office`, () => {
    let s = newGame();
    for (let i = 0; i < MAX_DOUBLE_PASSES; i++) s = bidBoth(s, 0, 0);
    for (const p of [0, 1] as const) {
      const pick = s.teams[p].lineup.GK!;
      expect(pick.via).toBe('cadeau');
      expect(s.teams[p].budget).toBe(1500 - pick.price);
    }
    expect(currentSlot(s)).toBe('DCG');
  });
});

describe('joker payant', () => {
  const afterAuction = (seed = 42) => {
    const s0 = newGame({ seed });
    return bidBoth(s0, card(s0).valeurMarche, 0);
  };

  it('rembourse le premier mystère et fait payer le second, du même poste', () => {
    const s = afterAuction();
    const r = s.auction!.result!;
    const budgetBefore = s.teams[1].budget;
    const j = gameReducer(s, { type: 'USE_JOKER' });
    const second = j.teams[1].lineup.GK!;
    expect(second.playerId).not.toBe(r.mysteryId);
    expect(second.via).toBe('joker');
    expect(getPlayer(second.playerId).poste).toBe('GK');
    expect(second.price).toBe(value(second.playerId));
    expect(j.teams[1].budget).toBe(budgetBefore + r.mysteryPrice - second.price);
    expect(j.teams[1].jokers).toBe(0);
    expect(j.auction!.result).toMatchObject({ jokerUsed: true, firstMysteryId: r.mysteryId, firstMysteryPrice: r.mysteryPrice });
    expect(j.pool).toContain(r.mysteryId);
  });

  it("ne s'utilise qu'une fois par partie et seulement par le perdant", () => {
    const s = afterAuction();
    const j = gameReducer(s, { type: 'USE_JOKER' });
    expect(gameReducer(j, { type: 'USE_JOKER' })).toBe(j);
    expect(j.teams[0].jokers).toBe(1);
    let n = gameReducer(j, { type: 'CONFIRM_MYSTERY' });
    n = bidBoth(n, card(n).valeurMarche, 0);
    expect(gameReducer(n, { type: 'USE_JOKER' })).toBe(n);
  });
});

describe('cas limites de budget', () => {
  it("un participant presque à sec reçoit le mystère le moins cher, bradé à ce qu'il peut payer", () => {
    const s0 = newGame();
    s0.teams[1].budget = budgetReserve(s0) + 1; // juste de quoi finir son onze
    const s = bidBoth(s0, card(s0).valeurMarche, 0);
    const pick = s.teams[1].lineup.GK!;
    expect(s.teams[1].budget).toBeGreaterThanOrEqual(0);
    expect(pick.price).toBeLessThanOrEqual(1);
    expect(s.teams[1].budget).toBeGreaterThanOrEqual(budgetReserve(s));
  });

  it("le max jouable vaut 0 quand le budget ne couvre que la réserve, et seule la passe reste possible", () => {
    const s = newGame();
    s.teams[0].budget = budgetReserve(s);
    expect(maxPlayable(s, 0)).toBe(0);
    expect(validateBid(s, 0, card(s).valeurMarche).ok).toBe(false);
    expect(validateBid(s, 0, 0).ok).toBe(true);
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
  });

  it('sans aucune offre à la fin du minuteur, la carte est retirée', () => {
    const s = gameReducer(live(), { type: 'LIVE_END' });
    expect(s.auction!.doublePasses).toBe(1);
  });
});

describe('bots et parties complètes', () => {
  it('le bot respecte toujours le prix minimum et la réserve', () => {
    for (let seed = 1; seed <= 30; seed++) {
      const s = newGame({ seed });
      for (const level of ['facile', 'moyen', 'difficile'] as const) {
        expect(validateBid(s, 1, botBlindBid(s, 1, level, seededRand(seed))).ok).toBe(true);
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

  it('une partie complète bot contre bot se termine avec deux onzes valides et des budgets positifs', () => {
    for (const auctionType of ['aveugle', 'direct'] as const) {
      for (let seed = 1; seed <= 20; seed++) {
        const rand = seededRand(seed);
        let s = newGame({ seed, auctionType, startBudget: seed % 3 === 0 ? 1000 : 1500 });
        let guard = 0;
        while (s.phase !== 'termine' && guard++ < 500) {
          if (s.phase === 'mystere') {
            if (botWantsJoker(s, 'moyen', rand)) s = gameReducer(s, { type: 'USE_JOKER' });
            s = gameReducer(s, { type: 'CONFIRM_MYSTERY' });
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
        expect(new Set(ids).size).toBe(22);
        for (const t of s.teams) {
          expect(t.budget).toBeGreaterThanOrEqual(0);
          const spent = SLOTS.reduce((sum, slot) => sum + t.lineup[slot]!.price, 0);
          expect(spent + t.budget).toBe(s.config.startBudget);
        }
      }
    }
  });
});
