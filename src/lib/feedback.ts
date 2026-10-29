import { useSettings } from '../store/settings';

/** Vibration courte (si le réglage est activé et l'appareil compatible). */
export function vibrate(pattern: number | number[]): void {
  if (!useSettings.getState().vibrations) return;
  try {
    navigator.vibrate?.(pattern);
  } catch {
    /* non supporté */
  }
}

let ctx: AudioContext | null = null;

function audio(): AudioContext | null {
  if (!useSettings.getState().sons) return null;
  try {
    ctx ??= new AudioContext();
    if (ctx.state === 'suspended') void ctx.resume();
    return ctx;
  } catch {
    return null;
  }
}

function tone(freq: number, start: number, duration: number, type: OscillatorType = 'sine', gain = 0.15): void {
  const a = audio();
  if (!a) return;
  const osc = a.createOscillator();
  const g = a.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  const t = a.currentTime + start;
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(gain, t + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, t + duration);
  osc.connect(g).connect(a.destination);
  osc.start(t);
  osc.stop(t + duration + 0.02);
}

/** Petits sons synthétisés (aucun fichier audio). */
export const sfx = {
  tap: () => tone(660, 0, 0.06, 'triangle', 0.08),
  bid: () => tone(880, 0, 0.08, 'square', 0.06),
  tick: () => tone(1200, 0, 0.03, 'square', 0.04),
  gavel: () => {
    tone(180, 0, 0.18, 'square', 0.2);
    tone(120, 0.05, 0.25, 'sawtooth', 0.12);
  },
  reveal: () => {
    tone(523, 0, 0.12);
    tone(659, 0.1, 0.12);
    tone(784, 0.2, 0.25);
  },
  error: () => tone(200, 0, 0.2, 'sawtooth', 0.08),
  win: () => [523, 659, 784, 1047].forEach((f, i) => tone(f, i * 0.12, 0.3, 'triangle', 0.15)),
  goal: () => [784, 988, 1175].forEach((f, i) => tone(f, i * 0.08, 0.2, 'triangle', 0.12)),
};

export const haptics = {
  won: () => vibrate([30, 40, 80]),
  reveal: () => vibrate(60),
  error: () => vibrate([20, 30, 20]),
};
