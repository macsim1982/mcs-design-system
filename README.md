# MCS Design System (MCS: Minimal Consistant Solution)

Design system web durable, fondé sur la plateforme : HTML et CSS natifs, tokens au format DTCG,
comportements en custom elements light DOM, adapters de frameworks minces.

> **Statut : phase 2 (pilote) — architecture validée le 2026-10-30.**
> Aucun paquet ni composant n'est encore implémenté. La gouvernance d'ingénierie (hooks, lint, tests,
> CI, release) est en place et opérationnelle.

## En bref

- **Natif d'abord** : `<button class="mcs-button" data-variant="primary">`, pas de `<mcs-button>`.
- **Le CSS est l'implémentation** : zéro runtime, couches `@layer`, thèmes par custom properties.
- **Comportements seulement là où la plateforme ne suffit pas** : `<mcs-tabs>`, `<mcs-menu>`,
  `<mcs-toaster>`, en light DOM.
- **Une seule implémentation**, utilisable en HTML pur comme dans React (`@mcs-ds/react`).
- **Accessibilité WCAG 2.2 AA** comme plancher.

Préfixe `mcs` pour le HTML, le CSS et les événements ; paquets npm sous le scope `@mcs-ds`.

## Documentation

| Pour…                                   | Lire                                                                                    |
| --------------------------------------- | --------------------------------------------------------------------------------------- |
| Comprendre et valider l'architecture    | [docs/architecture/ARCHITECTURE.md](docs/architecture/ARCHITECTURE.md) (point d'entrée) |
| Contribuer                              | [CONTRIBUTING.md](CONTRIBUTING.md)                                                      |
| Workflow Git, revues, quality gates     | [docs/engineering/GIT_WORKFLOW.md](docs/engineering/GIT_WORKFLOW.md)                    |
| Standards de code et outillage          | [docs/engineering/CODING_STANDARDS.md](docs/engineering/CODING_STANDARDS.md)            |
| Tests                                   | [docs/engineering/TESTING_STRATEGY.md](docs/engineering/TESTING_STRATEGY.md)            |
| Versions, releases, hotfix, déploiement | [docs/engineering/RELEASE_PROCESS.md](docs/engineering/RELEASE_PROCESS.md)              |
| Mise en place GitHub, Renovate, npm     | [docs/engineering/REPOSITORY_SETUP.md](docs/engineering/REPOSITORY_SETUP.md)            |
| Changements publiés                     | [CHANGELOG.md](CHANGELOG.md), [docs/releases/](docs/releases/)                          |
| Travailler avec des agents de code      | [CLAUDE.md](CLAUDE.md)                                                                  |
| Sécurité, conduite                      | [SECURITY.md](SECURITY.md), [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md)                    |

## Démarrer

Prérequis : Node.js 24 (`.nvmrc`) et pnpm (version fixée par le champ `packageManager`).

```sh
nvm use
corepack enable        # ou : npm install --global pnpm
pnpm install           # installe aussi les hooks Git
pnpm run verify        # exécute localement les mêmes contrôles que la CI
```
