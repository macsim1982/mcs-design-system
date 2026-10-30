---
paths:
  - 'docs/**'
  - '*.md'
---

# Documentation

Propriétaires : `mcs-architect` (`docs/architecture/`), `mcs-tooling` (`docs/engineering/`), `mcs-docs`
(documentation consommateur, `docs/releases/`).

- Français, phrases complètes, faits datés quand ils peuvent vieillir (support navigateur, versions).
- Une information vit à un seul endroit : lier plutôt que recopier.
- En-tête de statut (`Statut : …`, `Dernière mise à jour : AAAA-MM-JJ`) sur les documents normatifs.
- Une nouvelle décision d'architecture validée prend la forme d'un ADR (GOVERNANCE.md §2) et met à jour le
  registre d'ARCHITECTURE.md §8.
- Le registre des fonctionnalités de plateforme (ARCHITECTURE.md §6) et la liste blanche de
  `stylelint.config.js` changent ensemble.
- `docs/releases/v*.md` et `CHANGELOG.md` sont générés : on les complète dans la PR de version, on ne les
  crée pas à la main.

Vérifier : `pnpm run lint:format`.
