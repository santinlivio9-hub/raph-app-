// Générateur pseudo-aléatoire déterministe (mulberry32). L'état est un simple nombre,
// stocké dans GameState : une partie est rejouable et sérialisable.

export function nextRandom(state: number): [value: number, nextState: number] {
  const s = (state + 0x6d2b79f5) >>> 0;
  let t = s;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return [((t ^ (t >>> 14)) >>> 0) / 4294967296, s];
}

export class Rng {
  constructor(public state: number) {}

  next(): number {
    const [v, s] = nextRandom(this.state);
    this.state = s;
    return v;
  }

  int(maxExclusive: number): number {
    return Math.floor(this.next() * maxExclusive);
  }

  pick<T>(items: readonly T[]): T {
    if (items.length === 0) throw new Error('Rng.pick sur une liste vide');
    return items[this.int(items.length)];
  }

  shuffle<T>(items: readonly T[]): T[] {
    const a = [...items];
    for (let i = a.length - 1; i > 0; i--) {
      const j = this.int(i + 1);
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  /** Tire `n` éléments distincts. */
  sample<T>(items: readonly T[], n: number): T[] {
    return this.shuffle(items).slice(0, n);
  }
}

export function newSeed(): number {
  return Math.floor(Math.random() * 2 ** 32) >>> 0;
}
