---
paths:
  - 'tools/**'
  - '.github/**'
  - '.husky/**'
  - '.changeset/**'
  - '*.config.js'
  - '*.config.ts'
  - 'package.json'
  - 'pnpm-workspace.yaml'
  - '.dependency-cruiser.cjs'
  - 'knip.json'
---

# Outillage, CI et release

Sources : docs/engineering/CODING_STANDARDS.md, GIT_WORKFLOW.md, RELEASE_PROCESS.md.
Propriétaire : `mcs-tooling`.

- Tout outil nouveau répond à : quelle valeur, quel doublon évité (inventaire de CODING_STANDARDS.md §1).
- `tools/lib/` : logique pure, testée (seuils de `vitest.config.ts`). `tools/bin/` : points d'entrée
  minces. TypeScript effaçable uniquement (Node l'exécute sans transpilation), imports en `.ts`.
- Workflows : permissions minimales par job ; actions épinglées par SHA avec la version en commentaire ;
  données non fiables (titre, corps, branche) passées par `env` ou lues dans le payload ; jamais de
  secret npm (OIDC).
- `ci-ok` et `pr-checks` sont les seuls statuts requis : un nouveau job s'ajoute à leur `needs`.
- Une règle documentée et son automatisation changent dans la même PR.
- devDependencies à la racine seulement ; versions publiées depuis plus de trois jours
  (`minimumReleaseAge`) ; tout script d'installation autorisé explicitement (`allowBuilds`).

Vérifier : `pnpm run verify`.
