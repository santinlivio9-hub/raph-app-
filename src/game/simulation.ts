import { displayName, getPlayer } from './db';
import { SLOT_POSTE } from './formation';
import { Rng } from './rng';
import { effectiveNote } from './scoring';
import type { Player, SlotId, StatsChamp, StatsGardien, TeamState } from './types';

export interface MatchEvent {
  minute: number;
  team: 0 | 1 | null;
  kind: 'info' | 'but' | 'occasion' | 'arret' | 'carton';
  text: string;
  score: [number, number];
}

export interface MatchResult {
  events: MatchEvent[];
  score: [number, number];
  strength: [{ attaque: number; defense: number }, { attaque: number; defense: number }];
}

const avg = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 50);

function entries(team: TeamState): { slot: SlotId; player: Player }[] {
  return (Object.keys(team.lineup) as SlotId[]).map((slot) => ({ slot, player: getPlayer(team.lineup[slot]!.playerId) }));
}

/** Forces d'attaque et de défense (0–100) dérivées des stats, pénalités de poste incluses. */
export function teamStrength(team: TeamState): { attaque: number; defense: number } {
  const es = entries(team);
  const adj = (slot: SlotId, p: Player, v: number) => v - (p.note - effectiveNote(p, slot));
  const field = (p: Player) => p.stats as StatsChamp;
  const att = es
    .filter((e) => ['AG', 'AD', 'BU'].includes(SLOT_POSTE[e.slot]))
    .map((e) => {
      const st = field(e.player);
      return adj(e.slot, e.player, st.tir * 0.4 + st.dri * 0.3 + st.vit * 0.3);
    });
  const mid = es
    .filter((e) => SLOT_POSTE[e.slot] === 'MC')
    .map((e) => {
      const st = field(e.player);
      return adj(e.slot, e.player, st.pas * 0.6 + st.dri * 0.4);
    });
  const def = es
    .filter((e) => ['DC', 'DG', 'DD'].includes(SLOT_POSTE[e.slot]))
    .map((e) => {
      const st = field(e.player);
      return adj(e.slot, e.player, st.def * 0.6 + st.phy * 0.4);
    });
  const gk = es
    .filter((e) => e.slot === 'GK')
    .map((e) => {
      if (e.player.poste !== 'GK') return effectiveNote(e.player, e.slot);
      const st = e.player.stats as StatsGardien;
      return (st.plo + st.ref + st.pla) / 3;
    });
  return {
    attaque: Math.round(avg(att) * 0.7 + avg(mid) * 0.3),
    defense: Math.round(avg(def) * 0.75 + avg(gk) * 0.25),
  };
}

const weighted = <T>(rng: Rng, items: { item: T; w: number }[]): T => {
  const total = items.reduce((s, i) => s + i.w, 0);
  let r = rng.next() * total;
  for (const i of items) {
    r -= i.w;
    if (r <= 0) return i.item;
  }
  return items[items.length - 1].item;
};

const SHOOT_WEIGHT: Partial<Record<string, number>> = { BU: 5, AG: 3, AD: 3, MC: 1.5, DG: 0.4, DD: 0.4, DC: 0.3 };

const GOAL_TEXTS = [
  (s: string, a: string | null) => (a ? `BUUUT ! ${s} conclut un superbe service de ${a} !` : `BUUUT ! ${s} trouve la lucarne !`),
  (s: string, a: string | null) => (a ? `${a} lance ${s} qui ne tremble pas : BUT !` : `${s} déclenche une frappe du gauche… GOAL !`),
  (s: string) => `${s} s'arrache dans la surface et marque !`,
];
const SAVE_TEXTS = [
  (s: string, g: string) => `Arrêt décisif de ${g} devant ${s} !`,
  (s: string, g: string) => `${g} s'envole et sort la frappe de ${s} !`,
];
const MISS_TEXTS = [(s: string) => `${s} frappe au-dessus.`, (s: string) => `Poteau pour ${s} ! Si proche…`, (s: string) => `${s} manque le cadre de peu.`];

/** Simulation courte et déterministe (graine) : le score ne change pas le vainqueur officiel. */
export function simulateMatch(teams: [TeamState, TeamState], names: [string, string], seed: number): MatchResult {
  const rng = new Rng(seed ^ 0x5bd1e995);
  const strength = [teamStrength(teams[0]), teamStrength(teams[1])] as MatchResult['strength'];
  const score: [number, number] = [0, 0];
  const raw: Omit<MatchEvent, 'score'>[] = [];

  for (const t of [0, 1] as const) {
    const me = strength[t];
    const opp = strength[1 - t];
    const diff = me.attaque - opp.defense;
    const chances = Math.max(2, Math.min(9, 4 + Math.round(diff / 6) + rng.int(4)));
    const es = entries(teams[t]);
    const keeper = entries(teams[1 - t]).find((e) => e.slot === 'GK');
    const keeperName = keeper ? displayName(keeper.player) : 'le gardien';
    for (let i = 0; i < chances; i++) {
      const minute = 1 + rng.int(90);
      const shooter = weighted(rng, es.map((e) => ({ item: e, w: SHOOT_WEIGHT[SLOT_POSTE[e.slot]] ?? 0 })));
      const others = es.filter((e) => e !== shooter && e.slot !== 'GK');
      const assist = rng.next() < 0.65 && others.length ? rng.pick(others) : null;
      const pGoal = Math.max(0.08, Math.min(0.5, 0.24 + diff / 120));
      const roll = rng.next();
      const sName = displayName(shooter.player);
      if (roll < pGoal) {
        raw.push({ minute, team: t, kind: 'but', text: rng.pick(GOAL_TEXTS)(sName, assist ? displayName(assist.player) : null) });
      } else if (roll < pGoal + 0.35) {
        raw.push({ minute, team: t, kind: 'arret', text: rng.pick(SAVE_TEXTS)(sName, keeperName) });
      } else {
        raw.push({ minute, team: t, kind: 'occasion', text: rng.pick(MISS_TEXTS)(sName) });
      }
    }
    if (rng.next() < 0.5) {
      const fouler = rng.pick(es);
      raw.push({ minute: 1 + rng.int(90), team: t, kind: 'carton', text: `Carton jaune pour ${displayName(fouler.player)}.` });
    }
  }

  raw.push({ minute: 0, team: null, kind: 'info', text: `Coup d'envoi : ${names[0]} – ${names[1]} !` });
  raw.push({ minute: 45, team: null, kind: 'info', text: 'Mi-temps.' });
  raw.push({ minute: 90, team: null, kind: 'info', text: 'Coup de sifflet final !' });
  const key = (e: Omit<MatchEvent, 'score'>) => e.minute * 10 + (e.team !== null ? 5 : e.minute === 0 ? 0 : 9);
  raw.sort((a, b) => key(a) - key(b));

  const events = raw.map((e) => {
    if (e.kind === 'but' && e.team !== null) score[e.team]++;
    return { ...e, score: [score[0], score[1]] as [number, number] };
  });
  return { events, score, strength };
}
