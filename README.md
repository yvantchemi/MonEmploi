# MonEmploi — Éducation

Application mobile (Android / iOS) de construction d'emplois du temps avec
**détection automatique des conflits** de salle, d'enseignant et de groupe.

Auteur : TCHEMI EUGENE YVAN ULRICK

Dépôt GitHub public : <https://github.com/yvantchemi/MonEmploi>

## Fonctionnalités

- Gestion des **salles** (nom, type, capacité), **enseignants** (nom, prénom, spécialité, email) et **groupes** (nom, niveau, effectif)
- **Création / modification / suppression de séances** (matière, jour, horaire, salle, enseignant, groupe, notes)
- **Détection des conflits en direct** pendant la saisie : salle occupée, enseignant déjà en cours, groupe déjà en cours, et avertissement de capacité insuffisante
- Suggestion des **salles libres** et assez grandes sur le créneau choisi
- **Vue par enseignant, par groupe et par salle** (semaine complète ou jour par jour, volume horaire hebdomadaire)
- Écran **Conflits** listant tous les chevauchements restants
- **Export PDF** (grille hebdomadaire A4 paysage) et **CSV** (ouvrable dans Excel) partagés via WhatsApp, email, Drive…
- Fonctionne **100 % hors ligne** : base SQLite locale, aucune requête réseau

## Lancer l'application

Prérequis : Node.js 20+ et l'application **Expo Go** sur le téléphone.

```bash
npm install
npx expo start
```

Scannez le QR code avec Expo Go (Android) ou l'appareil photo (iOS).
Sur l'accueil, touchez **« Charger des données d'exemple »** pour tester tout de suite.

## Générer un APK Android

```bash
npx eas-cli@latest login
npx eas-cli@latest build -p android --profile preview
```

## Vérifications

```bash
npm test           # tests unitaires du moteur de conflits et de l'export CSV
npm run typecheck  # TypeScript
npx expo lint      # ESLint
```

La documentation technique complète est dans [`docs/MANUEL_CONCEPTION.md`](docs/MANUEL_CONCEPTION.md).
