import { useState } from 'react';
import { PoolPicker } from '../components/PoolPicker';
import { Button, Page, Segmented, Toggle } from '../components/ui';
import { buildSlotOrder } from '../game/game';
import { newSeed } from '../game/rng';
import type { AuctionType, BotLevel, DraftOffer, GameMode, Participant } from '../game/types';
import { useGame } from '../store/game';
import { useSettings } from '../store/settings';

export const TEAM_COLORS = [
  { value: '#4FA3FF', label: 'Bleu' },
  { value: '#FF6B6B', label: 'Rouge' },
  { value: '#F5C542', label: 'Or' },
  { value: '#3DFF8C', label: 'Vert' },
  { value: '#B57BFF', label: 'Violet' },
  { value: '#FF9F43', label: 'Orange' },
  { value: '#2DD4BF', label: 'Turquoise' },
  { value: '#F472B6', label: 'Rose' },
];

const BOT_NAMES: Record<BotLevel, string> = { facile: 'Bot Amateur', moyen: 'Bot Recruteur', difficile: 'Bot Agent Star' };

function ColorPicker({ value, taken, onChange, label }: { value: string; taken: string; onChange: (c: string) => void; label: string }) {
  return (
    <div role="radiogroup" aria-label={label} className="flex flex-wrap gap-2">
      {TEAM_COLORS.map((c) => (
        <button
          key={c.value}
          type="button"
          role="radio"
          aria-checked={value === c.value}
          aria-label={c.label}
          disabled={taken === c.value}
          onClick={() => onChange(c.value)}
          className={`grid h-11 w-11 place-items-center rounded-full transition disabled:opacity-20 ${
            value === c.value ? 'ring-4 ring-white' : 'ring-1 ring-white/20'
          }`}
          style={{ background: c.value }}
        >
          {value === c.value && <span className="text-lg font-black text-night">✓</span>}
        </button>
      ))}
    </div>
  );
}

function ModeCard({ active, title, desc, icon, onClick }: { active: boolean; title: string; desc: string; icon: string; onClick: () => void }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={`rounded-2xl border-2 p-3 text-left transition ${active ? 'border-gold bg-gold/10' : 'border-line bg-night-2'}`}
    >
      <div className="text-2xl" aria-hidden>
        {icon}
      </div>
      <div className="font-display text-2xl">{title}</div>
      <div className="text-xs text-muted">{desc}</div>
    </button>
  );
}

export function SetupScreen() {
  const { setupSolo: solo, go, start } = useGame();
  const settings = useSettings();
  const [mode, setMode] = useState<GameMode>('enchere');
  const [names, setNames] = useState<[string, string]>(['Joueur 1', solo ? BOT_NAMES.moyen : 'Joueur 2']);
  const [colors, setColors] = useState<[string, string]>([TEAM_COLORS[0].value, TEAM_COLORS[1].value]);
  const [botLevel, setBotLevel] = useState<BotLevel>('moyen');
  const [auctionType, setAuctionType] = useState<AuctionType>(settings.auctionType);
  const [startBudget, setStartBudget] = useState(settings.startBudget);
  const [timerSeconds, setTimerSeconds] = useState(settings.timerSeconds);
  const [ordreAleatoire, setOrdreAleatoire] = useState(settings.ordreAleatoire);
  const [draftOffer, setDraftOffer] = useState<DraftOffer>(settings.draftOffer);
  const [draftReroll, setDraftReroll] = useState(settings.draftReroll);
  const [pool, setPool] = useState(settings.pool);
  const [expert, setExpert] = useState(settings.expert);
  const [verdict, setVerdict] = useState(settings.verdictDesPotes);

  const setName = (i: 0 | 1, v: string) => setNames((n) => (i === 0 ? [v, n[1]] : [n[0], v]));
  const setColor = (i: 0 | 1, v: string) => setColors((c) => (i === 0 ? [v, c[1]] : [c[0], v]));

  const launch = () => {
    const seed = newSeed();
    const participants: [Participant, Participant] = [
      { name: names[0].trim() || 'Joueur 1', color: colors[0], isBot: false },
      solo
        ? { name: names[1].trim() || BOT_NAMES[botLevel], color: colors[1], isBot: true, botLevel }
        : { name: names[1].trim() || 'Joueur 2', color: colors[1], isBot: false },
    ];
    start(
      {
        mode,
        startBudget,
        slotOrder: buildSlotOrder(ordreAleatoire, seed),
        auctionType,
        draftOffer,
        draftReroll,
        timerSeconds,
        pool,
        expert,
        perfWeight: settings.perfWeight,
        verdictDesPotes: verdict,
        seed,
      },
      participants,
    );
  };

  return (
    <Page title={solo ? 'Solo contre le bot' : 'Nouvelle partie'} onBack={() => go('home')}>
      <div className="flex flex-col gap-5 pb-28">
        <section aria-label="Mode de jeu" className="grid grid-cols-2 gap-3">
          <ModeCard active={mode === 'enchere'} icon="🔨" title="Enchères" desc="À l'instinct : aucune note. Le vainqueur ? Les vraies perfs." onClick={() => setMode('enchere')} />
          <ModeCard active={mode === 'draft'} icon="🃏" title="Draft" desc="Sans budget : 1 carte notée parmi 6, ordre serpent." onClick={() => setMode('draft')} />
        </section>

        {([0, 1] as const).map((i) => (
          <section key={i} className="rounded-2xl border border-line bg-night-2 p-3">
            <label className="mb-1 block text-sm text-muted" htmlFor={`name-${i}`}>
              {i === 1 && solo ? 'Nom du bot' : `Nom d'équipe — Joueur ${i + 1}`}
            </label>
            <input
              id={`name-${i}`}
              value={names[i]}
              maxLength={18}
              onChange={(e) => setName(i, e.target.value)}
              className="mb-3 min-h-[48px] w-full rounded-xl border border-line bg-night px-3 text-lg font-semibold outline-none focus:border-gold"
            />
            <ColorPicker label={`Couleur de ${names[i]}`} value={colors[i]} taken={colors[1 - i]} onChange={(c) => setColor(i, c)} />
          </section>
        ))}

        {solo && (
          <Segmented<BotLevel>
            label="Niveau du bot"
            value={botLevel}
            onChange={(v) => {
              if (names[1] === BOT_NAMES[botLevel]) setName(1, BOT_NAMES[v]);
              setBotLevel(v);
            }}
            options={[
              { value: 'facile', label: 'Facile' },
              { value: 'moyen', label: 'Moyen' },
              { value: 'difficile', label: 'Difficile' },
            ]}
          />
        )}

        <section className="rounded-2xl border border-line bg-night-2 px-3 py-1">
          <PoolPicker value={pool} onChange={setPool} />
          <Toggle label="Mode Expert" hint="Ajoute des joueurs moins connus (notoriété 2)" checked={expert} onChange={setExpert} />
        </section>

        <section className="rounded-2xl border border-line bg-night-2 px-3 py-1">
          {mode === 'enchere' ? (
            <>
              <Segmented<AuctionType>
                label="Type d'enchère"
                value={auctionType}
                onChange={setAuctionType}
                options={[
                  { value: 'aveugle', label: "À l'aveugle" },
                  { value: 'direct', label: 'En direct ⏱' },
                ]}
              />
              <Segmented<number>
                label="Budget de départ"
                value={startBudget}
                onChange={setStartBudget}
                options={[1000, 1500, 2000].map((v) => ({ value: v, label: `${v} M€` }))}
              />
              {auctionType === 'direct' && (
                <Segmented<number>
                  label="Minuteur"
                  value={timerSeconds}
                  onChange={setTimerSeconds}
                  options={[6, 10, 15].map((v) => ({ value: v, label: `${v} s` }))}
                />
              )}
              <Toggle label="Verdict des potes" hint="Chacun vote pour le meilleur onze avant la révélation des stats" checked={verdict} onChange={setVerdict} />
            </>
          ) : (
            <>
              <Segmented<DraftOffer>
                label="Cartes proposées"
                value={draftOffer}
                onChange={setDraftOffer}
                options={[
                  { value: 'poste', label: 'Poste en cours' },
                  { value: 'libre', label: 'Postes libres' },
                ]}
              />
              <Toggle label="Relance de pioche" hint="1 relance des 6 cartes par joueur" checked={draftReroll} onChange={setDraftReroll} />
            </>
          )}
          <Toggle label="Ordre des postes aléatoire" hint="Sinon : gardien → défense → milieu → attaque" checked={ordreAleatoire} onChange={setOrdreAleatoire} />
        </section>
      </div>

      <div className="safe-bottom fixed inset-x-0 bottom-0 bg-gradient-to-t from-night via-night/95 to-transparent px-4 pt-6">
        <div className="mx-auto max-w-md">
          <Button className="w-full text-xl" onClick={launch}>
            C'est parti !
          </Button>
        </div>
      </div>
    </Page>
  );
}
