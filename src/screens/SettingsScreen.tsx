import { PoolPicker } from '../components/PoolPicker';
import { Button, Page, Segmented, Toggle } from '../components/ui';
import type { AuctionType, DraftOffer } from '../game/types';
import { useGame } from '../store/game';
import { useSettings } from '../store/settings';

export function SettingsScreen() {
  const go = useGame((s) => s.go);
  const s = useSettings();
  return (
    <Page title="Réglages" onBack={() => go('home')}>
      <p className="mb-3 text-sm text-muted">Valeurs par défaut des nouvelles parties (modifiables à la création).</p>
      <div className="flex flex-col gap-1 rounded-2xl border border-line bg-night-2 px-3 py-2">
        <PoolPicker value={s.pool} onChange={(v) => s.update({ pool: v })} />
        <Toggle label="Mode Expert" hint="Débloque les joueurs de notoriété 2" checked={s.expert} onChange={(v) => s.update({ expert: v })} />
        <Segmented<number>
          label="Score Enchères : performances / collectif"
          value={s.perfWeight}
          onChange={(v) => s.update({ perfWeight: v })}
          options={[0.7, 0.85, 1].map((v) => ({ value: v, label: `${Math.round(v * 100)} / ${Math.round((1 - v) * 100)}` }))}
        />
        <Toggle label="Verdict des potes" hint="Vote avant la révélation des performances" checked={s.verdictDesPotes} onChange={(v) => s.update({ verdictDesPotes: v })} />
        <Toggle label="Ordre des postes aléatoire" hint="Sinon : gardien → défense → milieu → attaque" checked={s.ordreAleatoire} onChange={(v) => s.update({ ordreAleatoire: v })} />
        <Segmented<AuctionType>
          label="Type d'enchère"
          value={s.auctionType}
          onChange={(v) => s.update({ auctionType: v })}
          options={[
            { value: 'aveugle', label: "À l'aveugle" },
            { value: 'direct', label: 'En direct' },
          ]}
        />
        <Segmented<number>
          label="Budget de départ"
          value={s.startBudget}
          onChange={(v) => s.update({ startBudget: v })}
          options={[1000, 1500, 2000].map((v) => ({ value: v, label: `${v} M€` }))}
        />
        <Segmented<number>
          label="Durée du minuteur (enchère en direct)"
          value={s.timerSeconds}
          onChange={(v) => s.update({ timerSeconds: v })}
          options={[6, 10, 15].map((v) => ({ value: v, label: `${v} s` }))}
        />
        <Segmented<DraftOffer>
          label="Draft : cartes proposées"
          value={s.draftOffer}
          onChange={(v) => s.update({ draftOffer: v })}
          options={[
            { value: 'poste', label: 'Poste en cours' },
            { value: 'libre', label: 'Postes libres' },
          ]}
        />
        <Toggle label="Draft : relance de pioche" checked={s.draftReroll} onChange={(v) => s.update({ draftReroll: v })} />
        <Toggle label="Sons" checked={s.sons} onChange={(v) => s.update({ sons: v })} />
        <Toggle label="Vibrations" hint="Sur les téléphones compatibles" checked={s.vibrations} onChange={(v) => s.update({ vibrations: v })} />
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3 pb-6">
        <Button variant="ghost" onClick={() => go('tutorial')}>
          Revoir le tutoriel
        </Button>
        <Button variant="ghost" onClick={s.reset}>
          Réinitialiser
        </Button>
      </div>
    </Page>
  );
}
