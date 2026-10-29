import { useEffect, useRef, useState } from 'react';
import { BudgetBar } from '../components/BudgetBar';
import { Pitch } from '../components/Pitch';
import { TeamSheet } from '../components/TeamSheet';
import { Button, IconButton, Modal, Toast } from '../components/ui';
import { currentSlot, maxPlayable } from '../game/auction';
import { draftTurn, freeSlots } from '../game/draft';
import { POSTE_LABEL, SLOT_POSTE } from '../game/formation';
import type { GameState, ParticipantIndex } from '../game/types';
import { useGame } from '../store/game';
import { BlindAuction } from './game/BlindAuction';
import { DraftBoard } from './game/DraftBoard';
import { LiveAuction } from './game/LiveAuction';
import { MysteryReveal } from './game/MysteryReveal';

function useToast(): [string | null, (m: string) => void] {
  const [msg, setMsg] = useState<string | null>(null);
  const timer = useRef<number | undefined>(undefined);
  const show = (m: string) => {
    setMsg(m);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setMsg(null), 2600);
  };
  useEffect(() => () => window.clearTimeout(timer.current), []);
  return [msg, show];
}

export function GameScreen({ game }: { game: GameState }) {
  const { go, quit } = useGame();
  const [sheet, setSheet] = useState<ParticipantIndex | null>(null);
  const [menu, setMenu] = useState(false);
  const [toast, showToast] = useToast();
  const isAuction = game.config.mode === 'enchere';

  // Annonce les doubles passes (carte retirée).
  const lastDouble = useRef(game.auction?.doublePasses ?? 0);
  useEffect(() => {
    const d = game.auction?.doublePasses ?? 0;
    if (d > lastDouble.current) showToast('Personne n’a enchéri : carte retirée, nouvelle carte !');
    lastDouble.current = d;
  });

  // Annonce les joueurs offerts (cas limite des doubles passes).
  const lastLog = useRef(game.log.length);
  useEffect(() => {
    const fresh = game.log.slice(lastLog.current);
    lastLog.current = game.log.length;
    const gift = fresh.find((l) => l.kind === 'cadeau');
    if (gift) showToast(gift.text);
  });

  let title: string;
  let subtitle: string;
  if (isAuction) {
    const slot = currentSlot(game);
    title = `Poste ${game.slotIndex + 1}/11`;
    subtitle = POSTE_LABEL[SLOT_POSTE[slot]];
  } else {
    const p = draftTurn(game);
    const pickNo = (game.draft?.pickIndex ?? 0) + 1;
    title = `Choix ${pickNo}/22`;
    subtitle = game.config.draftOffer === 'poste' ? POSTE_LABEL[SLOT_POSTE[freeSlots(game, p)[0]]] : 'Postes libres';
  }

  const highlight = (p: ParticipantIndex) => {
    if (isAuction) return game.phase === 'encheres' ? currentSlot(game) : null;
    return draftTurn(game) === p && game.config.draftOffer === 'poste' ? freeSlots(game, p)[0] : null;
  };

  const max: [number, number] | undefined = isAuction && game.phase === 'encheres' ? [maxPlayable(game, 0), maxPlayable(game, 1)] : undefined;

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col gap-3 px-3 pt-[max(0.5rem,env(safe-area-inset-top))]">
      <Toast message={toast} />
      <header className="flex items-center gap-3">
        <IconButton label="Menu de la partie" onClick={() => setMenu(true)}>
          ☰
        </IconButton>
        <div className="min-w-0 flex-1">
          <div className="font-display text-2xl leading-none">{title}</div>
          <div className="truncate text-sm text-gold">{subtitle}</div>
        </div>
        <span className="rounded-full border border-line px-3 py-1 text-xs text-muted">{isAuction ? '🔨 Enchères' : '🃏 Draft'}</span>
      </header>

      <BudgetBar game={game} maxPlayable={max} active={isAuction ? null : draftTurn(game)} />

      <main className="flex flex-1 flex-col">
        {game.phase === 'encheres' &&
          game.auction &&
          (game.config.auctionType === 'aveugle' ? (
            <BlindAuction key={game.auction.cardId} game={game} />
          ) : (
            <LiveAuction key={game.auction.cardId} game={game} />
          ))}
        {game.phase === 'mystere' && game.auction?.result && <MysteryReveal key={game.auction.result.cardId} game={game} />}
        {game.phase === 'draft' && <DraftBoard game={game} onToast={showToast} />}
      </main>

      <footer className="safe-bottom grid grid-cols-2 gap-2" aria-label="Mini-terrains">
        {([0, 1] as const).map((p) => (
          <button key={p} onClick={() => setSheet(p)} className="text-left" aria-label={`Voir l'équipe de ${game.participants[p].name}`}>
            <div className="mb-1 flex items-center gap-1 text-xs">
              <span className="h-2 w-2 rounded-full" style={{ background: game.participants[p].color }} />
              <span className="truncate text-muted">{game.participants[p].name}</span>
              <span className="ml-auto text-muted">🔍</span>
            </div>
            <Pitch team={game.teams[p]} color={game.participants[p].color} mini highlight={highlight(p)} />
          </button>
        ))}
      </footer>

      {sheet !== null && (
        <TeamSheet open onClose={() => setSheet(null)} participant={game.participants[sheet]} team={game.teams[sheet]} mode={game.config.mode} />
      )}

      <Modal open={menu} onClose={() => setMenu(false)} label="Menu de la partie">
        <h2 className="font-display mb-1 text-3xl">Pause</h2>
        <p className="mb-4 text-sm text-muted">La partie est sauvegardée automatiquement : tu pourras la reprendre depuis l’accueil.</p>
        {game.log.length > 0 && (
          <div className="mb-4 max-h-40 overflow-y-auto rounded-xl bg-night-3 p-2 text-xs text-muted">
            {[...game.log]
              .slice(-12)
              .reverse()
              .map((l, i) => (
                <div key={i}>• {l.text}</div>
              ))}
          </div>
        )}
        <div className="flex flex-col gap-3">
          <Button onClick={() => setMenu(false)}>Reprendre</Button>
          <Button variant="dark" onClick={() => go('home')}>
            Accueil (partie sauvegardée)
          </Button>
          <Button variant="danger" onClick={quit}>
            Abandonner la partie
          </Button>
        </div>
      </Modal>
    </div>
  );
}
