# Tabiji Frontend

Frontend de **Tabiji**, une application web collaborative de gestion de voyages. Cette interface permet aux utilisateurs de planifier un voyage a plusieurs, de gérer leurs collaborateurs et de construire un canvas de souvenirs synchronisé en temps réel.

Le backend de l'application est exposé dans un dépôt séparé.

## Fonctionnalites principales

- authentification et inscription utilisateur
- dashboard personnel et liste des voyages
- création et édition d'un voyage
- gestion des collaborateurs et partage par lien
- organisation des lieux, tâches et planning jour par jour
- canvas de souvenirs collaboratif en temps réel
- espace administrateur

## Stack technique

- **Next.js 15**
- **React 19**
- **TypeScript**
- **Tailwind CSS**
- **Socket.IO client**
- **Leaflet / React Leaflet**
- **Jest** et **React Testing Library**

## Dependance au backend

Ce frontend consomme l'API Tabiji via :

- `NEXT_PUBLIC_API_URL`
- `NEXT_PUBLIC_API_URL_FALLBACK`

En local, l'API tourne generalement sur `http://localhost:4000`.

## Installation

```bash
yarn install
```

## Configuration

Cree un fichier `.env.local` a la racine du projet :

```env
NEXT_PUBLIC_API_URL=http://localhost:4000
NEXT_PUBLIC_API_URL_FALLBACK=http://localhost:4000
```

## Scripts disponibles

```bash
# Developpement
yarn dev

# Developpement avec Turbopack
yarn dev:turbo

# Build de production
yarn build

# Lancer le build
yarn start

# Lint
yarn lint

# Tous les tests
yarn test

# Tests unitaires
yarn test:unit

# Tests d'integration
yarn test:integration

# Couverture
yarn test:coverage
```

## Parcours principaux

L'application contient notamment les pages suivantes :

- `/` : page d'accueil
- `/user/login` : connexion
- `/user/signup` : inscription
- `/dashboard` : tableau de bord utilisateur
- `/trips` : liste des voyages
- `/trips/[id]` : détail d'un voyage
- `/trips/[id]/memories` : canvas souvenirs
- `/shared/[token]` : page d'invitation via lien de partage
- `/admin` : backoffice administrateur

## Structure du projet

```text
frontend/
├── src/
│   ├── app/           # pages Next.js App Router
│   ├── components/    # composants UI et metier
│   ├── contexts/      # etat partage (auth, favoris, voyage)
│   ├── hooks/         # hooks personnalises
│   ├── types/         # types TypeScript
│   ├── utils/         # fonctions utilitaires
│   └── __tests__/     # tests unitaires et integration
├── public/            # assets statiques
└── package.json
```

## Tests

Les tests couvrent :

- les composants d'interface
- les contextes React
- certains hooks personnalisés
- les parcours d'authentification, de voyages et de partage

Le frontend teste ses intégrations avec des appels API mockés, en cohérence avec le backend testé séparement.

## Accessibilite

Le projet prend en compte plusieurs principes d'accessibilite :

- déclaration de la langue du document (`lang="fr"`)
- police principale lisible
- textes alternatifs sur les images significatives
- `aria-label` sur plusieurs actions interactives

Cette prise en compte reste partielle et n'équivaut pas a un audit RGAA complet.

## Deploiement

Le frontend est déployé sur **Vercel**.

En production, l'URL du backend est fournie via les variables d'environnement publiques de la plateforme.

## Contexte

Ce projet a été réalisé dans le cadre du titre professionnel **RNCP Concepteur Developpeur d'Applications**.
