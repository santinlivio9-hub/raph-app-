import { AnimatePresence, motion } from 'framer-motion';
import { useState } from 'react';
import { LinkLegend, Pitch } from '../components/Pitch';
import { CardBack, PlayerCard } from '../components/PlayerCard';
import { Button } from '../components/ui';
import { PLAYERS } from '../game/db';
import { SLOTS } from '../game/formation';
import type { TeamState } from '../game/types';
import { useGame } from '../store/game';
import { useSettings } from '../store/settings';

const sample = PLAYERS.find((p) => p.rarete === 'elite' && p.poste === 'BU') ?? PLAYERS[0];

// Petit onze de démonstration (mêmes clubs côte à côte pour montrer les liens).
const demoTeam: TeamState = (() => {
  const lineup: TeamState['lineup'] = {};
  const used = new Set<string>();
  const byClub = ['Arsenal', 'Liverpool', 'Paris Saint-Germain', 'Real Madrid'];
  SLOTS.forEach((slot, i) => {
    const club = byClub[Math.floor(i / 3) % byClub.length];
    const pos = slot.startsWith('DC') ? 'DC' : slot.startsWith('MC') ? 'MC' : slot;
    const p = PLAYERS.find((x) => x.poste === pos && !used.has(x.id) && x.club === club) ?? PLAYERS.find((x) => x.poste === pos && !used.has(x.id))!;
    used.add(p.id);
    lineup[slot] = { playerId: p.id, slot, price: 0, via: 'draft', order: i + 1 };
  });
  return { lineup, budget: 0, jokers: 0, rerolls: 0 };
})();

const STEPS = [
  {
    title: 'Construis ton onze',
    body: 'Deux participants, un 4-3-3 chacun : 1 gardien, 4 défenseurs, 3 milieux, 3 attaquants. À la fin, le onze le plus fort gagne.',
    visual: (
      <div className="mx-auto w-56">
        <Pitch team={{ lineup: {}, budget: 0, jokers: 0, rerolls: 0 }} color="#F5C542" highlight="BU" showLinks={false} />
      </div>
    ),
  },
  {
    title: 'Mode Enchères',
    body: "1 500 M€ chacun. Une carte est révélée avec son prix minimum : faites vos offres en secret. La plus haute l'emporte. Le perdant reçoit gratuitement un joueur mystère du même poste… et peut le changer une fois avec son joker 🃏.",
    visual: (
      <div className="flex items-center justify-center gap-3">
        <PlayerCard player={sample} size="sm" />
        <span className="font-display text-3xl text-muted">VS</span>
        <div className="w-full max-w-[150px]">
          <CardBack size="sm" />
        </div>
      </div>
    ),
  },
  {
    title: 'Mode Draft',
    body: "Pas de budget : à ton tour, choisis 1 carte parmi 6. L'ordre est en serpent (J1, J2, J2, J1…) pour que ce soit équitable. Une relance de pioche par partie.",
    visual: (
      <div className="mx-auto grid w-60 grid-cols-3 gap-2">
        {PLAYERS.filter((p) => p.poste === 'MC')
          .slice(0, 6)
          .map((p, i) => (
            <motion.div key={p.id} initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: i * 0.08 }}>
              <div className={`grid aspect-[5/7] place-items-center rounded-xl border-2 ${i === 1 ? 'border-neon bg-neon/10' : 'border-line bg-night-3'}`}>
                <span className="font-display text-2xl text-gold">{p.note}</span>
              </div>
            </motion.div>
          ))}
      </div>
    ),
  },
  {
    title: 'Le score final',
    body: '70 % note générale (pénalité si un joueur est hors poste) + 30 % collectif : des voisins du même club, de la même nationalité ou de la même ligue créent des liens. En Enchères, le budget gardé rapporte jusqu’à +3.',
    visual: (
      <div className="mx-auto w-56">
        <Pitch team={demoTeam} color="#4FA3FF" mini />
        <div className="mt-2">
          <LinkLegend />
        </div>
      </div>
    ),
  },
];

export function TutorialScreen() {
  const go = useGame((s) => s.go);
  const update = useSettings((s) => s.update);
  const [i, setI] = useState(0);
  const finish = () => {
    update({ tutorialSeen: true });
    go('home');
  };
  const next = () => (i < STEPS.length - 1 ? setI(i + 1) : finish());
  const step = STEPS[i];

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col px-4 pt-[max(1rem,env(safe-area-inset-top))]">
      <div className="flex justify-end">
        <button onClick={finish} className="min-h-[48px] px-3 text-muted underline-offset-4 hover:underline">
          Passer
        </button>
      </div>
      <AnimatePresence mode="wait">
        <motion.section
          key={i}
          className="flex flex-1 flex-col justify-center gap-6"
          initial={{ x: 60, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: -60, opacity: 0 }}
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          onDragEnd={(_, info) => {
            if (info.offset.x < -60) next();
            else if (info.offset.x > 60 && i > 0) setI(i - 1);
          }}
          aria-roledescription="diapositive"
          aria-label={`${i + 1} sur ${STEPS.length}`}
        >
          {step.visual}
          <div>
            <h2 className="font-display text-4xl text-gold">{step.title}</h2>
            <p className="mt-2 text-base leading-relaxed text-white/90">{step.body}</p>
          </div>
        </motion.section>
      </AnimatePresence>
      <div className="safe-bottom flex flex-col gap-4 pt-4">
        <div className="flex justify-center gap-2" aria-hidden>
          {STEPS.map((_, k) => (
            <span key={k} className={`h-2 rounded-full transition-all ${k === i ? 'w-6 bg-gold' : 'w-2 bg-line'}`} />
          ))}
        </div>
        <div className="grid grid-cols-[auto_1fr] gap-3">
          <Button variant="ghost" disabled={i === 0} onClick={() => setI(i - 1)} aria-label="Écran précédent">
            ←
          </Button>
          <Button onClick={next}>{i < STEPS.length - 1 ? 'Suivant' : "J'ai compris !"}</Button>
        </div>
      </div>
    </div>
  );
}
