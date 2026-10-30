---
name: ship-change
description: Préparer une modification pour la revue — branche, commits Conventional Commits, changeset, PR conforme au template et vérifications locales. À utiliser avant de proposer une pull request, ou quand l'utilisateur demande de committer ou de créer une PR.
---

# Livrer une modification

Ne jamais committer, pousser ni ouvrir de PR sans demande explicite de l'utilisateur.

## 1. Branche

`<type>/<description-kebab>` avec `feature`, `fix`, `hotfix`, `chore`, `docs`
(`node tools/bin/branch-name.ts <nom>` pour vérifier). Jamais de travail direct sur `main` ou
`release/*`.

## 2. Changeset

- Un paquet publié change : `pnpm changeset`. Aucun effet pour les consommateurs :
  `pnpm changeset --empty`.
- Première ligne `type(portée)!: description` (types `feat`, `improve`, `fix`, `perf`, `deprecate`,
  `revert`, `docs`), en anglais, en minuscule, sans point final.
- Lignes `API:`, `Tokens:`, `Known issue:` si utiles ; `Migration:` obligatoire pour une rupture (`!` et
  `major`, ou `minor` avant 1.0).
- `pnpm run check:changesets`.

## 3. Commits

Conventional Commits (`feat(button): add loading state`). Une rupture : `!` et footer
`BREAKING CHANGE: …`. Un changement visuel est un `feat` ou un `fix`, jamais un `style`.

## 4. Vérifications

`pnpm run verify` (ou déléguer à `mcs-qa` et ne garder que le résumé).

## 5. Pull request

Titre = futur message de commit (Conventional Commits). Remplir toutes les sections obligatoires du
template : contexte et objectif, description, impact sur l'API publique (une case cochée), tests réalisés,
risques identifiés. Une rupture demande deux approbations.
