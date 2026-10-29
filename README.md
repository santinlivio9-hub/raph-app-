# ⚽ Mercato Duel — construis ton 11 de légende

Jeu de foot à deux (ou contre un bot) : chaque participant construit son **4-3-3**, et le onze le plus fort gagne.
Application web mobile-first, installable (PWA), entièrement en français.

## Lancer l'app

```bash
npm install
npm run dev        # serveur de dev → http://localhost:5173
npm test           # tests Vitest de la logique de jeu
npm run build      # typecheck + build de production (dist/)
npm run preview    # sert le build (PWA / service worker actifs)
```

Base joueurs :

```bash
npm run data:build     # régénère src/data/players.json depuis scripts/players-source.ts
npm run data:validate  # vérifie postes, doublons, bornes, raretés
```

## Règles du jeu

### Le principe
Deux participants, un **4-3-3** chacun : 1 GK, 2 DC, DG, DD, 3 MC, AG, AD, BU.
Les postes se remplissent dans l'ordre gardien → défense → milieu → attaque (ou dans un ordre aléatoire, option).

### Mode Enchères
- Chacun démarre avec **1 500 M€** (réglable : 1 000 / 1 500 / 2 000) et **1 joker**.
- Pour chaque poste, une carte joueur est révélée avec son **prix minimum** (= sa valeur marché).
- **Enchères à l'aveugle** (par défaut) : chacun saisit son offre en secret, avec un écran « Passe le téléphone » entre les deux. Une offre doit être ≥ prix minimum ; on peut **passer** (offre 0).
- **Enchère en direct** (option) : boutons +5 / +10 / +50 M€, minuteur (10 s par défaut) relancé à chaque surenchère.
- **Gagnant** : l'offre la plus haute, payée et déduite du budget. Égalité → le plus gros budget restant gagne, puis tirage au sort.
- **Si les deux passent** : la carte est retirée et une nouvelle est révélée.
- **Joueur mystère** : le perdant reçoit **gratuitement** un autre joueur du même poste, tiré **avant** la révélation de la carte (personne ne le connaît, il n'est même pas présent à l'écran), dont la note est à ± 6 de la carte mise aux enchères. Révélation animée par une carte qui se retourne.
- **Joker** (1 par partie) : le perdant peut retirer un nouveau joueur mystère (même poste, même fourchette) — il garde alors obligatoirement le second.
- **Réserve de budget** : une offre est refusée si elle empêche de payer, pour chaque poste restant, le prix minimum le plus bas disponible. Le « budget max jouable » est affiché en permanence et un message clair explique tout refus.

### Mode Draft
- Pas de budget. À chaque tour, le participant actif voit **6 cartes** et en choisit **1** (toucher puis valider, ou glisser la carte vers le haut).
- Option « Poste en cours » (par défaut) : 6 cartes du prochain poste à remplir. Option « Postes libres » : 6 cartes parmi les postes encore libres du onze.
- Ordre **serpent** : J1, J2, J2, J1, J1, J2… Les 5 cartes non choisies retournent dans la pioche.
- Option : **1 relance de pioche** par participant et par partie.

### Score final
**Score = 70 % Note générale + 30 % Collectif (+ bonus budget en Enchères)**

- **Note générale** : moyenne des 11 notes, avec −2 pour un joueur à un poste secondaire et −8 hors poste.
- **Collectif (0–100)** : moyenne des 18 liens entre voisins du 4-3-3
  (GK–DC, DC–DC, DC–latéral, DC–MC axial, latéral–MC, latéral–ailier, MC–MC, MC–ailier, MC–BU, ailier–BU).
  | Lien | Valeur | Affichage sur le terrain |
  |---|---|---|
  | Même club | 100 (fort) | trait plein vert |
  | Même nationalité | 65 (+10 si même ligue aussi) | tirets orange |
  | Même ligue | 40 (faible) | pointillés rouges |
  | Aucun | 10 | pointillés gris très discrets |
- **Bonus budget** (Enchères) : +1 point par tranche de 100 M€ restante, plafonné à +3.
- Égalité au score → la meilleure note générale l'emporte, sinon match nul.

L'écran de fin montre les deux terrains, le détail des scores, le **MVP** de chaque équipe, la **meilleure affaire**, le **plus gros flop**, et une **simulation de match** minute par minute (pour le fun : elle ne change pas le vainqueur officiel). Les deux onzes peuvent être **partagés en PNG**.

### Le bot (mode solo)
- **Facile** : enchères très aléatoires, choisit souvent au hasard.
- **Moyen** : enchérit selon la note, son budget par poste restant et un peu de hasard ; tient un peu compte du collectif.
- **Difficile** : garde 300 M€ pour décrocher le bonus budget maximal, vise les cartes qui créent des liens, utilise son joker quand le mystère est nettement plus faible, relance une pioche décevante.

Le bot ne voit jamais l'offre secrète de l'humain.

## Décisions prises (non précisées dans le cahier des charges)

- **Réserve de budget** : somme, sur les postes restant à pourvoir après celui en cours, du prix minimum le plus bas encore disponible pour chaque poste. Elle reste modeste (quelques dizaines de M€) mais garantit qu'on peut toujours enchérir sur chaque poste.
- **Doubles passes à répétition** : après **3 doubles passes** sur un même poste (ou si le poste n'a plus de cartes), chaque participant reçoit un joueur gratuit de ce poste, pour qu'une partie ne puisse pas tourner en rond.
- **Fourchette du mystère** : ± 6 de la note de la carte ; si aucun joueur ne correspond, la fourchette s'élargit (± 10, puis tout le poste, puis les joueurs ayant ce poste en secondaire).
- **Égalité de budget lors d'une égalité d'offres** : tirage au sort déterministe (graine de la partie).
- **Enchère en direct sur un seul téléphone** : les deux panneaux d'enchère sont affichés en même temps ; personne ne peut surenchérir sur sa propre offre ; si le minuteur expire sans offre, c'est une double passe.
- **Draft « Postes libres »** : une carte peut aussi être proposée pour un poste secondaire libre ; elle y est alors placée avec la pénalité de −2 (affichée avant validation).
- **Meilleure affaire** (Enchères) : plus grande plus-value « valeur marché − prix payé » (un mystère gratuit compte comme une affaire). **Plus gros flop** : le joueur acheté le plus cher par point de note. En Draft, ces deux moments comparent la note au rang du choix (grosse note choisie tard = affaire).
- **Vainqueur en cas d'égalité parfaite** : note générale, sinon match nul.
- **Valeurs et notes** : approximatives, saisies à la main (saison 2025-26), sans scraping. Les 6 stats de chaque joueur sont dérivées de sa note et d'un profil de poste par `scripts/build-players.ts` (déterministe).
- **Pas de photo, logo ni marque** : avatars générés (initiales + silhouette), couleur neutre calculée à partir du nom du club, drapeaux en emoji.

## Architecture

```
src/
  game/              logique pure, sans dépendance UI (testée avec Vitest)
    types.ts         types du jeu (état sérialisable)
    rng.ts           générateur pseudo-aléatoire déterministe (état = un nombre)
    formation.ts     cases du 4-3-3, coordonnées, graphe des liens
    auction.ts       enchères, réserve de budget, égalités, mystère, joker
    draft.ts         ordre serpent, offres de 6 cartes, relance
    game.ts          createGame + gameReducer(state, action) pur
    scoring.ts       note générale, collectif, bonus, vainqueur, moments forts
    bot.ts           décisions du bot (3 niveaux)
    simulation.ts    simulation de match minute par minute
    *.test.ts        tests
  data/              players.json (380 joueurs), drapeaux
  store/             Zustand : partie en cours, réglages, historique (localStorage protégé par try/catch)
  components/        carte joueur, terrain, budget, minuteur, effets
  screens/           accueil, configuration, enchères, mystère, draft, résultat, historique, réglages, tutoriel
scripts/             source de la base joueurs, génération et validation
```

**Prêt pour le multijoueur en ligne** : toute la partie est un état JSON modifié uniquement par des actions sérialisables
(`BID`, `LIVE_BID`, `LIVE_END`, `USE_JOKER`, `CONFIRM_MYSTERY`, `DRAFT_PICK`, `DRAFT_REROLL`) via un reducer pur.
L'aléatoire vient d'une graine stockée dans l'état : rejouer la même suite d'actions redonne exactement la même partie,
ce qui permet de synchroniser deux appareils en échangeant seulement les actions.

## Fonctionnalités

- Modes Enchères (aveugle ou direct) et Draft, à deux sur un téléphone ou en solo contre un bot (3 niveaux)
- Noms d'équipe et couleurs, tutoriel de 4 écrans au premier lancement
- Sauvegarde automatique : on reprend la partie après avoir fermé l'app
- Historique des parties et palmarès local (victoires J1 / J2 / bot, nuls)
- Partage des onzes en image PNG (`html-to-image`, partage natif si disponible, sinon téléchargement)
- Réglages : ordre des postes, type d'enchère, budget, minuteur, cartes proposées en draft, relance, sons, vibrations
- Sons synthétisés (Web Audio, aucun fichier) et vibrations à chaque enchère gagnée et révélation
- PWA installable et jouable hors ligne
