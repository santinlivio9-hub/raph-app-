# ⚽ Mercato Duel — construis ton 11

Jeu de foot à deux (ou contre un bot) : chaque participant construit son **4-3-3**.
En **Enchères**, on achète à l'instinct, sans aucune note : le vainqueur est désigné à la fin par les
**performances réelles** des joueurs. En **Draft**, on choisit des cartes notées.
Application web mobile-first, installable (PWA), entièrement en français.

**Jouer en ligne : https://santinlivio9-hub.github.io/raph-app-/** (mis à jour à chaque push sur `main`).

## Lancer l'app

```bash
npm install
npm run dev        # serveur de dev → http://localhost:5173
npm test           # tests Vitest de la logique de jeu
npm run build      # typecheck + build de production (dist/)
npm run preview    # sert le build (PWA / service worker actifs)
```

Données :

```bash
npm run data:build         # régénère src/data/players.json depuis scripts/players-source.ts
npm run data:validate      # postes, doublons, bornes, notoriété, perf, répartition des prix
npm run data:photos        # identifiants Wikidata + photos Commons (auteur, licence) → src/data/photos.json
npm run data:update-stats  # OPTIONNEL : perf via API-Football (clé API_FOOTBALL_KEY dans .env)
```

## Règles du jeu

### Le principe
Deux participants, un **4-3-3** chacun : 1 GK, 2 DC, DG, DD, 3 MC, AG, AD, BU.
Postes remplis dans l'ordre gardien → défense → milieu → attaque (ou aléatoire, en option).

**Pool de joueurs** (au lancement) : toutes les compétitions, ou une seule (Ligue 1, Premier League, Liga,
Serie A, Bundesliga) — toute la partie prend alors le thème visuel de cette compétition.
Seuls des **joueurs connus** sont en jeu : tous ceux qu'un fan de foot reconnaît (notoriété ≥ 4 sur 5).

### Mode Enchères
- Chacun démarre avec **1 500 M€** (réglable) et **1 joker**.
- Les cartes montrent photo, nom, poste, club, compétition, nationalité, âge et **valeur marché (= prix minimum)**.
  **Jamais de note ni de stats** pendant l'enchère.
- Pour chaque poste :
  1. **Tirage secret des joueurs mystère** du même poste, *avant* la révélation (personne ne les connaît).
  2. **Révélation** de la carte mise aux enchères.
  3. **Offres à l'aveugle** (écran « Passe le téléphone » entre les deux), ou **en direct** en option
     (+5 / +10 / +50 M€, minuteur de 10 s relancé à chaque surenchère). Offre ≥ prix minimum, ou passer.
     Gagnant = offre la plus haute. Égalité → plus gros budget restant, puis tirage au sort.
     Les deux passent → carte retirée, nouvelle carte et nouveaux mystères.
  4. **Mystère payant** : le perdant reçoit son joueur mystère et **paie sa valeur marché**, révélée au
     retournement de la carte (le compteur de budget descend à ce moment-là).
  5. **Joker payant** (1 par partie) : le perdant est **remboursé** du premier mystère, en tire un autre du même
     poste et **paie sa valeur** (prix inconnu jusqu'au tirage). Il garde obligatoirement le second.
- **Réserve de budget** : une offre est refusée si, après paiement, on ne peut plus payer chaque poste restant au
  prix du joueur le moins cher disponible. Le **max jouable** est affiché en permanence, avec un message clair.
- **Mystère abordable** : il est tiré parmi les joueurs dont le prix laisse de quoi compléter son onze —
  ça peut être une affaire comme un joueur cher.
- **Cas limite** : si plus rien n'est abordable, on reçoit le joueur le moins cher du poste, **bradé** au montant
  encore payable.

### Verdict des Enchères : les performances
- **Score de performance (0–100)** par joueur, sur la saison de référence, normalisé par 90 minutes :
  | Poste | Composantes (pondération) |
  |---|---|
  | BU | buts 45 %, passes D. 20 %, note moyenne 35 % |
  | AG / AD | buts 30 %, passes D. 30 %, note 40 % |
  | MC | passes D. 20 %, buts 15 %, tacles + interceptions 25 %, note 40 % |
  | DC | tacles + interceptions 35 %, clean sheets 25 %, note 40 % |
  | DG / DD | tacles + interceptions 25 %, clean sheets 20 %, passes D. 15 %, note 40 % |
  | GK | arrêts 25 %, clean sheets 35 %, note 40 % |

  Chaque composante est comparée à une « référence élite » (ex. 0,8 but/90 pour un buteur) et plafonnée.
  Pénalités : temps de jeu < 900 min (jusqu'à ×0,5), poste secondaire −4, hors poste −15.
- **Score d'équipe = 85 % performances + 15 % collectif** (pondération réglable : 70/30, 85/15, 100/0).
- **Cérémonie** : les performances sont dévoilées poste par poste en alternant les deux équipes, jauges qui montent,
  puis le vainqueur et les confettis.
- **Verdict des potes** (option) : avant la révélation, chacun vote pour le onze qu'il trouve le meilleur ;
  affiché à côté du verdict des stats.
- Récap : MVP, **meilleure affaire** (meilleure perf par M€), **plus gros flop** (pire perf par M€, joueurs ≥ 5 M€),
  **mystère le plus chanceux**, détail des scores, simulation de match (pour le fun), partage PNG.

### Mode Draft
- Pas de budget ; les cartes montrent photo, **note générale**, poste, club et 6 stats.
- À chaque tour : **6 cartes** du poste en cours (ou des postes libres), on en **choisit 1**. Ordre **serpent**.
  Option : 1 relance de pioche par participant.
- Score : **70 % note générale moyenne + 30 % collectif** (−2 poste secondaire, −8 hors poste).
  L'écran de fin peut aussi afficher les performances réelles.

### Collectif (les deux modes)
Moyenne des 18 liens entre voisins du 4-3-3 : même club = **fort** (100, trait plein vert), même nationalité =
**moyen** (65, +10 si même compétition, tirets orange), même compétition = **faible** (40, pointillés rouges),
aucun = 10.

### Le bot (solo)
- Enchères : il estime la **performance cachée** avec un bruit qui dépend du niveau (±25 facile, ±12 moyen,
  ±5 difficile), la compare au prix et à son budget par poste restant ; il tente le joker si son mystère lui
  paraît faible pour son prix. Il ne voit jamais l'offre de l'humain.
- Draft : meilleure carte pondérée par le collectif (bruit en facile, relance d'une pioche faible en difficile).

## Données et photos

### Joueurs — `src/data/players.json`
- **296 joueurs, tous connus** (notoriété 4 ou 5 sur 5) : de 28 à 68 par poste (GK 29, DC 41, DG 29, DD 28, MC 68,
  AG 31, AD 28, BU 42). Les joueurs moins connus ont été retirés de la base, et le mode Expert supprimé.
- Champs : `id, nom, prenom, poste, postesSecondaires, club, competition, nationalite, age, valeurMarche,
  noteGenerale, notoriete, wikidataId, stats, rarete, perf {saison, matchs, minutes, buts, passesD, cleanSheets,
  arrets, tacles, interceptions, noteMoyenne}`.
- Source unique : `scripts/players-source.ts` (une ligne par joueur), saisie à la main, **sans scraping**.
- ⚠️ **Valeurs approximatives.** Clubs et valeurs marché ≈ saison 2025-26 (ordre de grandeur Transfermarkt).
  Performances = **saison 2024-25, championnat, saisies de mémoire** : matchs, minutes, buts, passes, clean sheets
  et note moyenne sont des estimations ; **tacles, interceptions et arrêts sont calculés** à partir du poste, du
  niveau et du temps de jeu. Pour des chiffres officiels : `npm run data:update-stats` (API-Football).
- Répartition des prix : **11 % ≥ 80 M€**, **52 % entre 20 et 80 M€**, **37 % < 20 M€**.
  Le cahier des charges visait ~20/40/40, mais il n'existe qu'une quarantaine de joueurs réellement estimés
  80 M€ ou plus : on a préféré rester fidèle aux vraies valeurs plutôt que de les gonfler.

### Photos — `src/data/photos.json`
- **Wikimedia Commons via Wikidata** (propriété P18), licences libres uniquement (CC BY, CC BY-SA, CC0,
  domaine public) : **294 joueurs sur 296** ont une photo ; les autres ont un avatar (initiales, couleur neutre du club).
- `scripts/fetch-photos.ts` : identifiant Wikidata par libellé + métier « footballeur » + année de naissance cohérente
  (repli : titre de l'article Wikipédia), puis vignette 330 px, **auteur et licence** via l'API Commons.
  Corrections manuelles documentées dans le script (Gnabry : date de naissance erronée sur Wikidata ;
  Ousmane Diomande : seule fiche trouvée = un homonyme → avatar).
- Crédit affiché dans la fiche de chaque joueur et dans l'écran **Crédits**. Images mises en cache par le service worker.
- Aucune image Getty, de site de club, ni carte EA FC/FIFA ; aucun logo de club ou de compétition.

### Thèmes de compétition
Dégradés + motifs générés en CSS/SVG (aucune image) : Ligue 1 bleu nuit / vert lime, Premier League violet /
magenta, Liga rouge brique / orange, Serie A bleu marine / turquoise, Bundesliga rouge / blanc cassé, autres
anthracite / or. Le fond change avec la compétition du joueur en jeu (fondu + léger zoom), sous un voile sombre
pour garantir le contraste.

## Décisions prises

- **Un mystère par participant**, tiré avant la révélation : chacun est garanti payable par « son » perdant
  potentiel ; seul celui du perdant sert, l'autre retourne discrètement dans la pioche.
- **Réserve** = somme, pour chaque poste restant après celui en cours, du prix du joueur le moins cher disponible.
- **3 doubles passes** sur un même poste → chacun reçoit (et paie) un mystère d'office, pour éviter de tourner en rond.
- **Pool d'une seule compétition** : si un poste manque de joueurs, il est complété par les joueurs les plus
  connus des autres championnats (minimum 4 par case + 2).
- **Égalité de score** : la meilleure perf moyenne (Enchères) ou note générale (Draft) l'emporte, sinon nul.
- Le **bonus budget** de la v1 est supprimé : en v2, l'argent sert à acheter les mystères.
- Une partie v1 sauvegardée n'est pas reprise après la mise à jour (règles différentes).

## Architecture

```
src/
  game/              logique pure, sans dépendance UI (testée avec Vitest)
    auction.ts       enchères, réserve, mystères payants, joker remboursé, cas limites
    draft.ts         ordre serpent, offres de 6 cartes, relance
    performance.ts   score de performance 0–100 par poste
    scoring.ts       collectif, scores d'équipe, vainqueur, moments forts
    pool.ts          pioche (compétition choisie, complément si un poste manque)
    bot.ts           décisions du bot (3 niveaux)
    simulation.ts    simulation de match
    game.ts          createGame + gameReducer(state, action) pur
  data/              players.json, photos.json, drapeaux
  lib/               thèmes, photos, sons/vibrations, partage, stockage protégé
  components/        carte, terrain, fiches, fond de compétition, effets
  screens/           accueil, configuration, enchères, mystère, draft, cérémonie/résultat, historique, réglages, tutoriel, crédits
scripts/             source joueurs, génération, validation, photos, mise à jour des stats
```

**Prêt pour le multijoueur en ligne** : toute la partie est un état JSON modifié par des actions sérialisables
(`BID`, `LIVE_BID`, `LIVE_END`, `USE_JOKER`, `CONFIRM_MYSTERY`, `DRAFT_PICK`, `DRAFT_REROLL`, `VOTE`) via un
reducer pur ; l'aléatoire vient d'une graine stockée dans l'état.
