# Haru (하루) — le coréen au quotidien

Application web installable (PWA) pour s’entraîner au coréen sur iPhone et Android.
Elle fonctionne hors connexion. Toutes les données restent sur le téléphone, sans compte ni serveur.

## Contenu

- **Alphabet** : voyelles, consonnes, lettres composées et doubles, avec la prononciation (voix coréenne du téléphone), des conseils en français, un atelier pour construire des syllabes et des quiz de lecture.
- **Vocabulaire** : environ 180 mots classés en 6 thèmes. Trois façons de s’entraîner : quiz (coréen → français, français → coréen, écoute), cartes mémoire à glisser, et jeu des paires contre la montre. Une répétition espacée (boîtes de Leitner) fait revenir plus souvent les mots oubliés.
- **Générateur de phrases**, selon cinq critères :
  - le niveau ;
  - le thème ;
  - le temps (présent, passé, futur) ;
  - la politesse (poli -요, formel -니다, familier) ;
  - la forme (affirmative, négative, question, envie -고 싶다).

  Chaque phrase est conjuguée et accordée correctement : particules 은/는, 이/가, 을/를 et 에/에서, irrégularités, négations 안 et -지 않다. Elle est accompagnée de sa traduction française, de sa romanisation et d’une explication grammaticale. Trois modes d’exercice : Lire, Traduire, Reconstituer.
- **Défi du jour** : 3 nouvelles phrases à remettre dans l’ordre chaque jour.
- **Progression** : XP, niveaux, série de jours, objectif quotidien et calendrier d’activité. La progression peut être exportée ou restaurée.

## Tester sur un ordinateur

```bash
cd coreen
python3 -m http.server 8080      # puis ouvrir http://localhost:8080
node --test tests/*.test.js      # tests du moteur coréen
```

## Mettre l’application en ligne (gratuit, GitHub Pages)

1. Sur GitHub : **Settings → Pages → Source : « GitHub Actions »**.
2. Pousser sur la branche : le workflow `.github/workflows/haru-pages.yml` lance les tests puis publie le dossier `coreen/`. Il est aussi possible de le lancer à la main dans l’onglet **Actions**.
3. L’adresse s’affiche dans le résultat du workflow, par exemple `https://<utilisateur>.github.io/<dépôt>/`.

## Installer sur le téléphone

- **iPhone (Safari)** : ouvrir l’adresse → bouton Partager → « Sur l’écran d’accueil ».
- **Android (Chrome)** : ouvrir l’adresse → menu ⋮ → « Installer l’application ».

Pour la voix : si aucune voix coréenne n’est installée, en ajouter une dans les réglages de synthèse vocale du téléphone (iPhone : Accessibilité → Contenu énoncé → Voix).

## Mise à jour

Après une modification, changer `VERSION` dans `sw.js` pour que les téléphones récupèrent les nouveaux fichiers.
