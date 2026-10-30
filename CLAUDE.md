# Design system — instructions pour les agents

Monorepo d'un design system web : HTML et CSS natifs, tokens DTCG, comportements en custom elements
light DOM, adapters de frameworks minces. Les documents de `docs/` font foi ; ce fichier n'en est que
l'index opérationnel.

## Garde de phase (bloquante)

- **Phase 2 : pilote.** Architecture validée le 2026-10-30 ; aucun paquet ni composant n'existe encore.
- Autorisé : les fondations minimales (`@mcs-ds/tokens`, CSS de base de `@mcs-ds/web`, `@mcs-ds/react`)
  et les **cinq composants pilotes** : Button, champ de texte, Dialog, Tabs, Menu
  (ARCHITECTURE.md §10).
- Interdit avant le bilan du pilote (hypothèses H1 à H8 validées ou plan B consigné en ADR) : tout autre
  composant. `pnpm scaffold:component` refuse tant que `packages/web` n'existe pas.

## Économie de contexte (obligatoire)

1. Ne jamais relire un document d'architecture en entier : `grep -n "^## " <doc>`, puis lire la seule
   section utile. Les règles de domaine (`.claude/rules/`) se chargent seules quand un fichier du domaine
   est touché : elles suffisent pour implémenter.
2. Pour un composant, la seule lecture nécessaire est son **contrat** (`*.contract.ts`) et son
   `README.md`.
3. Le boilerplate est **généré** (`pnpm scaffold:component <nom> --type A|B|C`), jamais écrit à la main.
4. Modifier par édition ciblée ; ne pas réécrire un fichier entier ; ne pas coller de longues sorties
   (filtrer avec `tail` ou `grep`).
5. Déléguer les exécutions longues (suites de tests, lint complet) à l'agent `mcs-qa`, qui ne renvoie
   qu'un résumé.
6. Rapports de fin de tâche : 15 lignes au plus, au format « Rapport » ci-dessous.

## Invariants (ne jamais enfreindre)

1. Natif d'abord : pas de custom element pour un élément que la plateforme fournit (pas de `<mcs-button>`).
2. Le CSS est l'implémentation : zéro runtime, tout dans `@layer mcs.*`, valeurs par tokens uniquement.
3. Comportements en light DOM, sans framework ni bibliothèque ; état vivant par `ElementInternals` et
   `:state()` ; jamais de restructuration des enfants fournis par l'auteur.
4. Le **contrat** est la source unique de l'API. Seul `mcs-architect` le modifie.
5. Tokens : niveau système public, références jamais émises en CSS, hooks non valorisés par défaut.
6. Adapters : gabarits et bindings uniquement, aucune logique de comportement.
7. WCAG 2.2 AA est un plancher non négociable.
8. Aucune dépendance runtime dans `@mcs-ds/web` et `@mcs-ds/tokens`.
9. Préfixe `mcs` (classes, balises, événements, custom properties, layers) et scope npm `@mcs-ds`
   (décision D-13).

## Carte

| Chemin                         | Contenu                                                        |
| ------------------------------ | -------------------------------------------------------------- |
| `docs/architecture/`           | Architecture normative (point d'entrée : `ARCHITECTURE.md`)    |
| `docs/engineering/`            | Git, standards de code, tests, releases                        |
| `packages/{tokens,web,react}/` | Paquets publiés (phase 2)                                      |
| `tools/lib/`, `tools/bin/`     | Outillage testé (TypeScript exécuté par Node), points d'entrée |
| `tools/templates/component/`   | Gabarits du générateur de composants                           |
| `.claude/`                     | Règles de domaine, agents, skills                              |

## Commandes

| But                       | Commande                                                    |
| ------------------------- | ----------------------------------------------------------- |
| Tout vérifier comme la CI | `pnpm run verify`                                           |
| Lint, types, tests        | `pnpm run lint`, `pnpm run typecheck`, `pnpm run test:unit` |
| Architecture, code mort   | `pnpm run check:architecture`, `pnpm run check:deadcode`    |
| Changesets                | `pnpm changeset`, `pnpm run check:changesets`               |
| Générer un composant      | `pnpm scaffold:component <nom> --type <A\|B\|C>`            |

Node 24 (`.nvmrc`) et pnpm (champ `packageManager`) sont requis.

## Agents et routage

Chaque chemin a **un seul agent propriétaire en écriture**. Hors de son domaine, un agent n'édite pas :
il le signale dans son rapport.

| Agent           | Domaine                                      | Écrit dans                                                                                            |
| --------------- | -------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| `mcs-architect` | Décisions, contrats, ADR, cohérence          | `**/*.contract.ts`, `packages/web/src/contracts.ts`, `docs/architecture/`                             |
| `mcs-tokens`    | Tokens, thèmes, pipeline de tokens           | `packages/tokens/`                                                                                    |
| `mcs-css`       | Styles des composants et fondations          | `packages/web/src/**/*.css`                                                                           |
| `mcs-elements`  | Comportements, helpers internes              | `packages/web/src/**/*.element.ts`, `packages/web/src/internal/`                                      |
| `mcs-react`     | Adapter React                                | `packages/react/src/` (hors tests)                                                                    |
| `mcs-a11y`      | Revue et tests d'accessibilité               | Résultats d'audit dans `components/*/README.md` (section lecteurs d'écran)                            |
| `mcs-qa`        | Tests, fixtures, exécution des contrôles     | `**/*.test.*`, `**/*.fixtures.ts`, `apps/consumers/`                                                  |
| `mcs-docs`      | Documentation consommateur, notes de release | `apps/workbench/`, `docs/releases/`, `components/*/README.md` (hors audit)                            |
| `mcs-tooling`   | CI, release, configurations, outillage       | `tools/`, `.github/`, `.husky/`, `.changeset/config.json`, configurations racine, `docs/engineering/` |

Les procédures multi-agents sont des skills : `new-component`, `token-change`, `ship-change`, `hotfix`.

## Protocole de synchronisation

- **Le contrat est le point de synchronisation.** Les agents travaillent à partir d'une version du
  contrat ; toute divergence est une demande de changement adressée à `mcs-architect`, jamais une édition
  locale.
- **Ordre** pour un composant : `mcs-architect` (contrat), puis `mcs-tokens` si besoin, puis `mcs-css` et
  `mcs-elements` en parallèle, puis `mcs-react`, puis `mcs-qa` et `mcs-a11y`, puis `mcs-docs`, enfin un
  changeset.
- **L'état partagé vit dans les fichiers** (contrat, README du composant, changesets), jamais dans la
  conversation : une session suivante doit pouvoir reprendre sans historique.
- **Ambiguïté** : ne jamais deviner. Signaler dans le rapport et escalader vers `mcs-architect` ; une
  décision structurante devient un ADR.
- **Fin de tâche** : les contrôles du domaine sont verts (commandes listées dans la règle du domaine).

### Format d'un ordre de travail

```text
ORDRE <agent> · <composant> · contrat <chemin> (commit <sha court>)
But : …
Fichiers autorisés : …
Critères d'acceptation : …
Hors périmètre : …
```

### Format d'un rapport

```text
RAPPORT <agent> · <composant> · terminé | partiel | bloqué
Fichiers : …
Contrat : inchangé | demande : <champ> → <proposition> (motif)
Vérifications : <commande> → <résultat>
Suite : <agent suivant> : …
Questions : …
```

## Langue et Git

- Documentation, issues et PR en français ; code, commits, changesets et notes de release en anglais.
- Commits Conventional Commits ; branches `feature|fix|hotfix|chore|docs/<kebab>` ; un changeset par
  PR qui touche un paquet publié. Détails : skill `ship-change`.
- Ne jamais committer, pousser ou publier sans demande explicite de l'utilisateur.
