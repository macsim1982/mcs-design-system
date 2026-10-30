---
paths:
  - '**/*.contract.ts'
  - 'packages/web/src/contracts.ts'
---

# Contrats de composant

Source : docs/architecture/COMPONENT_ARCHITECTURE.md §4 et §12. Propriétaire : `mcs-architect`.

- Un contrat est un module de **données** `as const` (via `defineContract`) : aucun import hors contrats,
  aucune logique, aucun accès au DOM.
- Champs : `name` (kebab-case, nom du pattern ARIA si possible), `type` (`A`, `B`, `C`), `status`,
  `since`, `summary`, `a11y` (pattern et lien APG), `anatomy`, `props`, `states`, `events`, `keyboard`,
  `hooks`.
- Vocabulaire contrôlé uniquement : `variant` (actions : `primary`, `secondary`, `tertiary`), `tone`
  (`neutral`, `accent`, `danger`, `warning`, `success`, `info`), `size` (`sm`, `md`, `lg`),
  `orientation`, booléens HTML (`disabled`, `open`…), `value`/`defaultValue`, `open`/`defaultOpen`.
- Interdits : `color`, `type` pour un style, `kind`, `appearance`, `isX`, `hasX`, `show`, `visible`,
  booléens de taille, négations.
- Type A : `anatomy.root` liste les éléments natifs valides (ils deviennent le sélecteur gardien du CSS).
  Variantes en `data-*`. Types B et C : balises `mcs-*`, rôles des parties, attributs en kebab-case.
- Événements : natifs d'abord, sinon `mcs-<verbe>` (`mcs-change`, `mcs-input`, `mcs-action`, `mcs-dismiss`)
  avec le nom de la prop React (`onValueChange`…).
- Chaque touche de `keyboard` aura un test ; chaque valeur de `props` aura un sélecteur CSS ; chaque hook
  sera lu par le CSS.
- Modifier un contrat publié = changement d'API : classer en semver (RELEASE_PROCESS.md §2), changeset,
  revue d'API.
