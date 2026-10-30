# Changesets

Un changeset décrit l'effet d'une PR sur les paquets publiés : niveau de version et texte destiné aux
consommateurs. Il est relu en PR comme le code.

```sh
pnpm changeset          # changement publié
pnpm changeset --empty  # PR sans effet pour les consommateurs (refactoring, tests, outillage)
```

Format (vérifié par `pnpm check:changesets`) :

```markdown
---
'@mcs-ds/web': minor
---

feat(button): add loading state

API: New `loading` prop on `<Button>`.
Tokens: Added the `--mcs-button-spinner-size` hook.
```

- Première ligne : `type(portée)!: description` ; types `feat`, `improve`, `fix`, `perf`, `deprecate`,
  `revert`, `docs`.
- Lignes facultatives : `API:`, `Tokens:`, `Known issue:` ; `Migration:` est obligatoire pour une
  rupture (`!` et niveau `major`, ou `minor` avant 1.0).

Référence : [docs/engineering/RELEASE_PROCESS.md](../docs/engineering/RELEASE_PROCESS.md), section 4.
