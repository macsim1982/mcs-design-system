---
paths:
  - 'packages/web/src/**/*.element.ts'
  - 'packages/web/src/internal/**'
---

# Éléments de comportement (types B et C)

Source : docs/architecture/COMPONENT_ARCHITECTURE.md §6 à §8. Propriétaire : `mcs-elements`.

- Light DOM. Pas de Shadow DOM sans ADR. Aucune bibliothèque (pas de Lit) ; helpers dans `internal/`.
- Ne jamais déplacer, envelopper ni supprimer un enfant fourni par l'auteur. Un DOM rendu par l'élément
  vit dans un sous-arbre qu'il possède entièrement.
- Rôle, ARIA et état vivant par `ElementInternals` ; état visuel par `internals.states` (`:state()`),
  mis à jour par le même helper que l'ARIA. Les attributs ARIA de l'auteur restent prioritaires.
- Attributs = configuration initiale (jamais réécrits par l'élément) ; propriétés = état vivant.
- `connectedCallback` peut précéder l'arrivée des enfants (streaming) : initialisation idempotente,
  observation des enfants directs seulement.
- Tous les écouteurs via l'`AbortSignal` fourni ; nettoyage dans `disconnectedCallback`.
- Module sûr côté serveur : aucun accès au DOM à l'import ; définition gardée
  (`customElements.get`) ; propriétés posées avant l'upgrade réappliquées.
- Aucune valeur visuelle en JavaScript ; attendre les animations par `getAnimations()`.
- Événements `mcs-<verbe>` : `bubbles: true`, `composed: false`, `detail` minimal ; aucun événement pour
  un changement fait par programme.
- Comportement découpé en contrôleurs internes réutilisables (focus itinérant, typeahead, fermeture).
- Avertissements uniquement sous la condition d'export `development`.
- Clavier : exactement la carte `keyboard` du contrat (pattern APG).
- Aucun import de CSS, de framework, de `tools/` ni d'un autre composant (dependency-cruiser).

Vérifier : `pnpm run typecheck`, `pnpm run check:architecture` ; tests délégués à `mcs-qa`.
