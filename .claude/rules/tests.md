---
paths:
  - '**/*.test.ts'
  - '**/*.test.tsx'
  - '**/*.test-d.ts'
  - '**/*.fixtures.ts'
  - 'apps/consumers/**'
---

# Tests et fixtures

Source : docs/engineering/TESTING_STRATEGY.md. Propriétaire : `mcs-qa`.

- Tester le comportement public et le contrat, pas l'implémentation ; un comportement est testé une seule
  fois, au niveau le moins coûteux qui le prouve.
- `*.test.ts` : Node (logique pure). `*.browser.test.ts(x)` : vrais navigateurs (Vitest et Playwright),
  avec `page.getByRole`. `*.visual.test.ts` : Playwright dans Docker. `*.e2e.test.ts` : applications
  témoins sur les tarballs. `*.test-d.ts` : types.
- Jamais jsdom ni happy-dom pour l'interface.
- Nommage : `describe('<composant>')` › domaine › `it('<comportement en une phrase>')`.
- Chaque touche de `keyboard` du contrat a un test ; axe-core dans chaque état ; restauration du focus ;
  forced colors et mouvement réduit par émulation.
- Fixtures : fonctions qui renvoient le HTML exact d'un consommateur ; source unique pour l'atelier, les
  tests et la documentation ; couvrent tous les états du contrat.
- Pas de dépendance au temps, au réseau ni à une animation en cours ; test instable en quarantaine sous un
  jour avec un ticket.
- Seuils de couverture dans `vitest.config.ts` ; ne pas viser 100 %.

Vérifier : `pnpm run test:unit` (ou la commande du niveau concerné), résumé seulement dans le rapport.
