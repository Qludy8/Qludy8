# Haru (하루) — le coréen et le japonais au quotidien

Application web installable (PWA) pour s’entraîner au **coréen** ou au **japonais** sur iPhone et Android, avec une interface en **français** ou en **anglais**. Au premier lancement, on choisit la langue à apprendre ; chaque langue garde sa propre progression.
Elle fonctionne hors connexion. Toutes les données restent sur le téléphone, sans compte ni serveur.

## Contenu

Tout ce qui suit existe pour les deux langues (hangeul pour le coréen, hiragana et katakana pour le japonais, avec furigana au-dessus des kanji).

- **Alphabet** : voyelles, consonnes, lettres composées et doubles, avec la prononciation (voix coréenne du téléphone), des conseils en français, un atelier pour construire des syllabes et des quiz de lecture.
- **Vocabulaire** : plus de 150 mots classés en 6 thèmes. Trois façons de s’entraîner : quiz (coréen → français, français → coréen, écoute), cartes mémoire à glisser, et jeu des paires contre la montre. Une répétition espacée (boîtes de Leitner) fait revenir plus souvent les mots oubliés.
- **Générateur de phrases**, selon cinq critères :
  - le niveau ;
  - le thème ;
  - le temps (présent, passé, futur) ;
  - la politesse (poli -요, formel -니다, familier) ;
  - la forme (affirmative, négative, question, envie -고 싶다).

  Chaque phrase est conjuguée et accordée correctement : particules 은/는, 이/가, 을/를 et 에/에서, irrégularités, négations 안 et -지 않다. Elle est accompagnée de sa traduction française, de sa romanisation et d’une explication grammaticale. Trois modes d’exercice : Lire, Traduire, Reconstituer.
- **Parcours** : une carte de modules de difficulté croissante (10 en coréen, 9 en japonais). Chaque étape renvoie à une leçon, un quiz, des cartes mémoire ou une série de phrases ; les quiz donnent 1 à 3 étoiles et chaque module terminé offre un bonus d’XP. Le contenu se règle dans `js/content/roadmap.js`.
- **Défi du jour** : 3 nouvelles phrases à remettre dans l’ordre chaque jour.
- **Progression** : XP, niveaux, série de jours, objectif quotidien et calendrier d’activité. La progression peut être exportée ou restaurée.

## Organisation du code

- `js/content/concepts.js` : vocabulaire partagé (coréen, japonais, français, anglais).
- `js/generator.js` : plan de phrase + traductions française et anglaise.
- `js/lang/ko.js`, `js/lang/ja.js`, `js/lang/kana.js` : rendu propre à chaque langue (conjugaison, particules, écriture).
- `js/content/strings.js` : textes de l’interface en français et en anglais.
- `js/content/guide*.js` : guides de prononciation et de grammaire.

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

Après une modification, changer `VERSION` dans `sw.js` et `APP_VERSION` dans `js/app.js` (affiché en bas des Réglages) pour que les téléphones récupèrent les nouveaux fichiers.
