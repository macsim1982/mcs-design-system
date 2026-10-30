---
paths:
  - 'packages/react/**'
---

# Adapter React

Source : docs/architecture/FRAMEWORKS.md §4 et §5. Propriétaire : `mcs-react`.

- React 19 et plus. Exports à plat (`Tabs`, `TabList`, `Tab`, `TabPanel`), jamais `Tabs.List`.
- Type A : composant compatible Server Components (pas de hook, pas de `'use client'`) qui rend
  l'anatomie native et mappe les props en `data-*`. `asChild` pour remplacer la racine ; jamais `as`.
- Types B et C : composant client mince qui importe `@mcs-ds/web/elements/<nom>.js` avant le rendu, rend la
  balise et les parties, mappe `mcs-<verbe>` vers `on<Concept>` et réaffirme la valeur contrôlée.
- Autorisé : gabarits, `useId()` pour les identifiants, attributs statiques, mapping props et événements,
  appel d'une méthode native (`showModal()`).
- Interdit : clavier, focus, positionnement, machine à états, calcul de style, import de CSS, import de
  `@mcs-ds/web/src/**` ou d'`internal/`, dépendance à un autre adapter.
- Propriété des attributs : l'adapter ne rend jamais un attribut que l'élément modifie (état vivant,
  `tabindex` itinérant).
- Types des props dérivés du contrat (`@mcs-ds/web/contracts`), jamais réécrits.

Vérifier : `pnpm run typecheck`, `pnpm run check:architecture` ; tests de contrat délégués à `mcs-qa`.
