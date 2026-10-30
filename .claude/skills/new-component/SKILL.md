---
name: new-component
description: Orchestration multi-agents pour créer un composant du design system, du contrat à la documentation. À utiliser quand l'utilisateur demande un nouveau composant, ou de reprendre un composant en cours.
---

# Nouveau composant

Prérequis : architecture validée (garde de phase de `CLAUDE.md`) et `packages/web` existant. Sinon,
s'arrêter et le dire.

## 0. Cadrage (session principale)

- Nom en kebab-case anglais, de préférence le nom du pattern ARIA.
- Le composant existe-t-il déjà, ou un composant voisin suffit-il ? (`ls packages/web/src/components`)
- Au moins deux consommateurs réels (GOVERNANCE.md §4) ; sinon, proposer une recette.

## 1. Contrat (`mcs-architect`)

1. `pnpm scaffold:component <nom> --type <A|B|C>` (le type est confirmé par l'architecte).
2. Ordre à `mcs-architect` : remplir le contrat et le README (décisions locales).
3. Revue du contrat par `mcs-a11y` (pattern, clavier, noms accessibles). Les corrections reviennent à
   `mcs-architect`.
4. Noter le commit du contrat : il sert de référence à tous les ordres suivants.

## 2. Implémentation (en parallèle si le type le permet)

| Type | Agents                                                                               |
| ---- | ------------------------------------------------------------------------------------ |
| A    | `mcs-css`                                                                            |
| B, C | `mcs-css` et `mcs-elements` en parallèle                                             |
| Tous | `mcs-tokens` d'abord, seulement si l'architecte a validé un token ou un hook nouveau |

Chaque ordre précise : contrat (chemin et commit), fichiers autorisés, critères d'acceptation, hors
périmètre. Une demande de changement de contrat suspend la branche concernée et retourne à l'étape 1.

## 3. Adapter (`mcs-react`)

Après le rapport de `mcs-elements` pour les types B et C (événements et propriétés effectifs).

## 4. Qualité (`mcs-qa`, puis `mcs-a11y`)

1. `mcs-qa` : fixtures de chaque état, tests composant et de contrat, exécution et résumé.
2. `mcs-a11y` : revue d'implémentation, Definition of Done d'accessibilité (ACCESSIBILITY.md §5).
3. Chaque échec est renvoyé à son agent propriétaire, avec le test qui échoue.

## 5. Documentation (`mcs-docs`)

Page du composant à partir du contrat et des fixtures.

## 6. Livraison

Skill `ship-change` : changeset `feat(<nom>): add <nom> component`, statut `experimental`, PR.

## Sortie à l'utilisateur

État par étape (fait, en cours, bloqué), décisions prises, questions ouvertes. Pas de récit détaillé.
