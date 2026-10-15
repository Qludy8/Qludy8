# Mugigo (무기고) — cartes d’armes à collectionner

Jeu web de cartes à collectionner (dans l’esprit de kyara.games) dont les cartes sont des **armes imaginaires** :
**36 boosters** (dont des boosters de 7 et 10 cartes, par collection, par arme), chacun avec son symbole coréen, **5 100 skins** procéduraux sur 17 armes inventées aux silhouettes réalistes (dont 7 formes de couteaux), monnaie **Mu (무)**, quêtes quotidiennes / hebdomadaires / exploits, usure par **float** (0 → 1, paliers IM / PM / EP / US / RV), **graines de motif** avec graines rares, **centrage** des cartes,
**cartes erreur** ultra-rares, **gradation** façon PSA, marché entre joueurs, **amis & échanges**, collection complète,
classements, missions et vérification de compte par **Discord**.

> Jeu 100 % fictif : aucune monnaie réelle, aucun achat. Tous les noms de modèles, de skins et tous les visuels sont
> inventés et générés procéduralement (aucune marque d’arme réelle, aucun skin sous licence).

## Démarrage

Prérequis : **Node.js ≥ 22.9** (SQLite est intégré à Node, aucune base à installer).

```bash
npm install
cp .env.example .env        # facultatif
npm start                   # http://localhost:3000
npm test                    # 24 tests (taux, tirages, gradation, marché, échanges, invariants du portefeuille)
npm run calibrate           # simulation Monte-Carlo de la valeur espérée de chaque booster
```

Au premier lancement, 16 bots marchands sont créés : ils ouvrent des boosters, alimentent le flux de drops et le marché.

### Vérification Discord
1. Créez une application sur <https://discord.com/developers/applications> → OAuth2.
2. Ajoutez la redirection `PUBLIC_URL/api/discord/callback`.
3. Renseignez `DISCORD_CLIENT_ID`, `DISCORD_CLIENT_SECRET` et `PUBLIC_URL` dans `.env`.

Une fois configurée, la vérification est **obligatoire** pour vendre sur le marché, envoyer des demandes d’ami et échanger
(liste dans `DISCORD.gated`). Un compte Discord doit avoir au moins 7 jours et ne peut être lié qu’à un seul joueur
(+150 ¢ offerts). Sans configuration, ces fonctions restent ouvertes ; `DISCORD_DEV_MOCK=1` affiche un bouton de
vérification simulée pour tester en local.

### Mode admin de test
Un interrupteur **Admin** dans l’en-tête (sans mot de passe) donne des Mu illimités (les dépenses ne débitent plus le solde)
et rend les gradations instantanées. À couper avant l’ouverture au public : `ADMIN_TOGGLE = false` dans `shared/config.js`.

### Langues
Le jeu est en français et en anglais (bouton FR/EN dans l’en-tête, ou Paramètres). Le français sert de clé :
`t('Texte')` dans le code, traductions dans `shared/lang/en-*.js`, champs `en`/`…En` dans les données.
`node scripts/i18n-check.js` liste les textes sans traduction.

## Ce qu’il y a dedans

| Fonction | Détails |
|---|---|
| Styles de skins | Teinte, bicolore, camouflage, motif, fondu, trempe, marbrure, acier damassé, 19 illustrations (dragon, koï, vague, phénix…) |
| Graines de motif | 0–999 par carte ; fondu / trempe / marbrure : 3 graines légendaires, 15 rares, 40 recherchées par modèle (fiche « Motifs ») |
| Boutique | Onglet présent mais verrouillé (`SHOP.enabled = false` dans `shared/config.js`) |
| Raretés | Commun, Peu commun, Rare, Ultra rare, Légendaire, Mythique, **Transcendant** |
| Catalogue | 15 modèles inventés × 300 skins, 10 collections thématiques |
| Illustrations | Cartes et boosters en SVG : silhouettes originales peintes avec le motif du skin, cadre de rareté, holo animé |
| Usure | Float à 6 décimales, 5 états (Immaculée, Peu marquée, Éprouvée, Usée, Ravagée). La peinture s’écaille, se décolore et se tache ; la carte se raye, perd ses couleurs, se plie |
| Centrage | Bordures gauche/droite et haut/bas réellement décalées sur la carte (ex. 58/42) → ×0,85 à ×1,12 sur la valeur |
| Carte erreur | 1/2 000 : deux cartes à moitié sur la même feuille, ×40 |
| Gradation | Économique / Standard / Express ; 4 sous-notes (centrage, coins, bords, surface), note 1–10, slab avec certificat, bonus de faible population, slab cassable |
| Boosters | 35 boosters payants + booster gratuit toutes les 10 min (réserve de 10), taux publics, garanties Ultra rare+ (15), Légendaire+ (90) et Transcendant (150 boosters premium) |
| Ouverture | Déchirure (clic ou glisser), cartes empilées, suspense lumineux avant le retournement des cartes rares, rayons, onde de choc, particules, tremblement, sons |
| Social | Amis (demandes), échanges cartes + crédits (atomiques, invalidés si une carte bouge), profils publics avec vitrine |
| Économie | Marché (frais 5 %), vente au système (55 %), contrats 10 → 1, connexion quotidienne, missions, niveaux |
| Collection | Les 3 600 cartes visibles, progression par modèle et par rareté, fiche skin avec annonces et historique de prix |

### Équilibrage
Tout est dans `shared/config.js`. Les prix des boosters sont **calculés automatiquement** (`shared/packs.js`) pour que la valeur moyenne d’un booster vaille
environ 87 % de son prix : la revente immédiate au système ne rend qu’environ 45–50 %, donc impossible de « farmer »
des crédits en boucle, mais les gros tirages (Mythique, Transcendant, cartes erreur, gradés 10) restent très rentables.
Les sources de revenus réguliers sont les boosters gratuits, la connexion quotidienne, les missions et le commerce.

## Architecture

```
shared/        config.js (équilibrage), catalog.js (catalogue déterministe), rules.js (usure, centrage, valeur)
server/        index.js (Express), api.js (routes), game.js (services), cards.js (tirages crypto), db.js (SQLite),
               auth.js (scrypt + sessions), discord.js (OAuth2), bots.js (marchands)
public/        index.html, css/app.css, js/app.js (routeur), js/opening.js, js/art/ (cartes, armes, motifs, boosters), js/pages/
tests/         node:test
scripts/       calibrate.js
```

Toute la logique aléatoire et économique est côté serveur ; chaque mutation est une transaction SQLite et chaque
mouvement de crédits est journalisé (`solde = somme des transactions`, vérifié par les tests).
