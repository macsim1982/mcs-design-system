---
paths:
  - '**/*.css'
---

# CSS

Source : docs/architecture/CSS_ARCHITECTURE.md. Propriétaire : `mcs-css` (`mcs-tokens` pour le CSS généré).

- Tout le CSS du design system dans un layer : `@layer mcs.components { … }` (ou `mcs.base`, `mcs.layout`,
  `mcs.utilities`, `mcs.reset`).
- Nommage : `.mcs-<bloc>`, `.mcs-<bloc>__<partie>` ; variantes `&[data-<prop>='<valeur>']` (type A) ou
  `&[<prop>='<valeur>']` (type C) ; états par pseudo-classes natives, ARIA ou `:state()`. Jamais de
  classe d'état.
- Sélecteur gardien des composants interactifs : `:where(button, a[href]).mcs-button`, avec les éléments
  de `anatomy.root.elements` du contrat. Jamais `button.mcs-button`.
- Valeurs : tokens système (`var(--mcs-…)`) uniquement ; hooks lus avec repli
  (`var(--mcs-button-radius, var(--mcs-radius-control))`) mais jamais déclarés ; variables privées `--_*`.
- Survol et pression dérivés : `color-mix(in oklab, var(--_bg), var(--_fg) var(--mcs-state-hover))`,
  survol dans `@media (hover: hover)`.
- Propriétés logiques uniquement ; spécificité ≤ (0,3,0) ; imbrication ≤ 2 (variantes, états,
  at-rules) ; pas de partie imbriquée ; pas de `!important` ; pas d'identifiant.
- Pas de `prefers-color-scheme` (le mode sombre vit dans les tokens) ; pas de `z-index` hors token ;
  container queries pour les composants.
- Mouvement opt-in : déplacements dans `@media (prefers-reduced-motion: no-preference)`.
- Focus : `:focus-visible` et `outline`, jamais `box-shadow` seul ; bloc `@media (forced-colors: active)`
  pour tout état exprimé par un fond.
- Fonctionnalités non Baseline : dans `@supports`, sauf liste blanche de `stylelint.config.js`.
- Type C : styles `:not(:defined)` lisibles et sans décalage de mise en page.

Vérifier : `pnpm run lint:css`.
