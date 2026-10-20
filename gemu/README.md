# Gēmu (ゲーム) — boosters de cartes de jeux vidéo

Jeu web de cartes à collectionner dans l’esprit de **kyara.games**, mais sur le thème du jeu vidéo :
**7 114 jeux réels**, classés de **Commune** à **Mythique** selon leur popularité et la qualité de leurs avis.
Chaque carte montre une image qui vient **du jeu lui-même** : son affiche officielle (capsule 600×900 de sa page Steam)
ou, pour les jeux absents de Steam, la jaquette officielle de son article Wikipédia. Aucune image n’est créée ni retouchée.

> Projet de fan non officiel, gratuit, sans argent réel ni achat. Les jeux, noms et visuels appartiennent à leurs éditeurs.

## Démarrage

Prérequis : **Node.js ≥ 22.9** (SQLite est intégré à Node).

```bash
cd gemu
npm install
npm start            # http://localhost:4848 (l’adresse pour un téléphone sur le même Wi-Fi s’affiche aussi)
npm test             # 16 tests : catalogue, tirages, garanties, recyclage, marché, échanges, missions, portefeuille
```

Variables facultatives (fichier `.env`, voir `.env.example`) : `PORT`, `DB_FILE`, `BOTS=0` pour couper les collectionneurs automatiques.

## Ce qu’on retrouve de kyara

| Kyara | Gēmu |
|---|---|
| Cartes 5/7 : nom, gemme de rareté, image, numéro `#0006/6736`, univers, POW / AURA | Nom du jeu, gemme, affiche du jeu, numéro `#0006/7114`, univers (série ou studio), **POP** (popularité) / **NOTE** (% d’avis positifs) |
| Raretés Commune → Mythique : top 3 % Mythique, 3–10 % Légendaire, 10–25 % Épique, 25–50 % Rare, 50–75 % Peu commune | Identique, sur le classement des jeux (nombre d’avis × qualité) |
| Cadres : gris mat, vert à filet lumineux, bleu à halo, violet holo, or brossé, **arc-en-ciel animé** pour la Mythique | Identique : stries holographiques, paillettes, reflet qui suit le doigt, cadre conique tournant pour la Mythique |
| « Bouge la souris ou le doigt pour l’incliner · touche la carte pour la retourner » | Inclinaison souris / doigt / gyroscope, verso = fiche du jeu (capture en jeu, studio, année, stats) |
| Taux par carte 62 / 25 / 11,4 / 1,4 / 0,15 / 0,025 %, 5 cartes par booster | Identique |
| Boosters gratuits : 1 toutes les 10 min, stock de 10 | Identique, + boosters bonus (série de connexion, missions) |
| Booster doré (Épique+), booster divin (Mythique garantie), pitié Mythique à 250 | Identique (doré 1 sur 10, divin 1 sur 800) |
| Pack du jour gratuit, thème du jour, Épique garantie | Identique (thème = un genre différent chaque jour) |
| Ouverture : déchirer le haut du sachet, cartes empilées, suspense lumineux, rayons, retournement, « Tout révéler », passer à la prochaine Épique, espace / maintenir | Identique, avec sons synthétisés, particules, onde de choc, vibrations |
| Collection : Univers / Tous, Cartes / Possédées, Tri, emplacements grisés, albums par univers | Identique (+ Manquantes, Doublons, Envies, Verrouillées, filtre de genre) |
| Recyclage des doublons en chakra (1/1/3/10/40/150), on garde 1 exemplaire | Recyclage en **jetons ◆**, mêmes valeurs |
| Wiki des personnages débloqué à l’obtention | Fiche du jeu débloquée à l’obtention : présentation, captures en jeu, tags, lien Steam / Wikipédia |
| Marché, tableau des échanges, envies, cartes verrouillées, vitrine, classement, missions jour / semaine, succès, série de connexion, notifications, application installable | Tout est là |

Non repris : amis et messagerie, guildes, parrainage, enchères et ordres d’achat, abonnement.

## Boosters

* **Gratuits** (stock gratuit, sinon 100 ◆) : Standard, Rétro (avant 2006), 2006–2015, Nouvelle génération (2020+),
  et un booster par genre : Action, Aventure, RPG, Tir & FPS, Stratégie, Simulation & gestion, Horreur, Indé, Plateforme,
  Course & sport, Survie & craft, Roguelike, Combat, Multijoueur, Anime, Casse-tête.
* **Boutique** (jetons) : Consoles Nintendo, Exclus PlayStation, Arcade & cartouches, Mobile & free-to-play, Grandes sagas,
  Édition prestige (Rare ou mieux partout).
* **Du jour** : pack du jour gratuit.

## Le catalogue

`catalog/games.json` (une ligne par jeu) et `catalog/details.json` (descriptions, captures, tags) sont produits par
`scripts/build-catalog.py` :

1. **SteamSpy** donne les ~10 000 jeux Steam les plus possédés et leurs avis.
2. L’**API publique du magasin Steam** donne pour chacun : l’affiche officielle, les captures d’écran en jeu, le studio,
   la série, la date de sortie, les tags et le nombre d’avis. Les contenus pour adultes, outils, démos et serveurs sont écartés,
   et les rééditions (GOTY, Definitive, Remastered, VR…) ne comptent qu’une fois.
3. **`scripts/hors-steam.txt`** liste ~350 grands jeux absents de Steam (Zelda, Mario, Pokémon, Halo, Bloodborne, Minecraft,
   League of Legends, Fortnite, jeux d’arcade et mobiles…) avec une audience estimée ; leur jaquette vient de leur article Wikipédia.
   Quand Wikipédia limite les requêtes pendant la construction, c’est le navigateur du joueur qui récupère la jaquette depuis l’article.
4. Score = 2 × log₁₀(avis) + (pourcentage d’avis positifs lissé − 80) / 7 → classement `#0001…` → rareté par tranches.

```bash
npm run catalog                       # télécharge ce qui manque (cache dans .cache/) puis reconstruit
python3 scripts/build-catalog.py      # reconstruit depuis le cache seulement   (Windows : py scripts\build-catalog.py)
```

Les collections sont enregistrées par identifiant de jeu (appid Steam), pas par numéro : reconstruire le catalogue
ne fait perdre aucune carte aux joueurs.

## Architecture

```
shared/    config.js (raretés, taux, boosters, missions), pools.js (réserves des boosters), rules.js (cote, jours de Paris)
server/    index.js (Express), api.js (routes), game.js (boosters, collection, marché, échanges, missions), catalog.js,
           db.js (SQLite), auth.js (invité + pseudo/mot de passe, scrypt), bots.js (collectionneurs automatiques)
public/    index.html, css/app.css, js/main.js (routeur), card.js (cartes, holo, inclinaison, inspection), opening.js (ouverture),
           pack.js (sachets), fx.js (particules, sons), pages/ (accueil, boosters, collection, fiche, marché, missions, classement, profil, raretés)
catalog/   games.json, details.json
scripts/   build-catalog.py, hors-steam.txt
tests/     node:test
```

Tout le hasard et toute l’économie sont côté serveur (tirages par `crypto.randomInt`), chaque action est une transaction
SQLite et chaque mouvement de jetons est inscrit au registre (`solde = somme du registre`, vérifié par les tests).
Au premier lancement, 16 collectionneurs automatiques ouvrent des boosters, alimentent le fil « En direct », le marché et les échanges.
