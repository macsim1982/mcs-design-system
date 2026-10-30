# Gouvernance

> Statut : validée le 2026-10-30 (v1). Dernière mise à jour : 2026-10-30.
> La gouvernance d'ingénierie (Git, revues, releases) est dans [`docs/engineering/`](../engineering/).
> Ce document traite de la gouvernance du **produit** design system : comment il reste cohérent au fil
> des années et des contributeurs.

## 1. Rôles

| Rôle                      | Responsabilités                                                                          |
| ------------------------- | ---------------------------------------------------------------------------------------- |
| Mainteneurs (équipe cœur) | Architecture, revue d'API, releases, priorisation, CODEOWNERS des zones critiques        |
| Référent accessibilité    | Revue des contrats et des éléments, tests manuels, sévérité des tickets d'accessibilité  |
| Référent design           | Fondations, tokens, cohérence visuelle, synchronisation Figma                            |
| Contributeurs             | Corrections, composants et améliorations, selon [CONTRIBUTING.md](../../CONTRIBUTING.md) |
| Produits consommateurs    | Remontent les besoins, testent les pré-versions, signalent les contournements            |

Une même personne peut tenir plusieurs rôles ; un rôle ne doit jamais rester sans titulaire.

## 2. Décisions

| Type de changement                                                              | Processus                                                                              | Trace                                 |
| ------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- | ------------------------------------- |
| Correction, amélioration interne                                                | Pull request                                                                           | Changeset                             |
| Nouvelle variante, nouveau hook, nouveau token                                  | Pull request avec revue d'API                                                          | Changeset, rapport d'API              |
| Nouveau composant, nouvelle catégorie de tokens, changement d'anatomie          | **RFC** (issue « Proposition ») puis PR                                                | RFC liée, changeset                   |
| Décision d'architecture (couches, outillage, politique navigateurs, dépendance) | **ADR**                                                                                | `docs/architecture/adr/NNNN-titre.md` |
| Breaking change                                                                 | RFC, ADR si structurel, procédure de [GIT_WORKFLOW.md](../engineering/GIT_WORKFLOW.md) | Changeset `major` avec migration      |

Le registre initial des décisions est dans [ARCHITECTURE.md](ARCHITECTURE.md), section 8. Après
validation, chaque nouvelle décision ou révision prend la forme d'un ADR numéroté :

```markdown
# ADR-0019 : <titre>

- Statut : proposée | acceptée | remplacée par ADR-XXXX
- Date : AAAA-MM-JJ
- Décideurs : …

## Contexte

## Décision

## Alternatives considérées

## Conséquences (positives, négatives, risques)

## Vérification (comment l'outillage fait respecter la décision)
```

La section « Vérification » est obligatoire : une décision qui ne peut pas être vérifiée par
l'outillage doit expliquer comment elle le sera en revue.

## 3. Cycle de vie d'un composant

```text
proposé ──► experimental ──► beta ──► stable ──► deprecated ──► supprimé
```

| Statut         | Critères d'entrée                                                                             | Garanties                                                                     |
| -------------- | --------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| `experimental` | RFC acceptée, contrat écrit, prototype                                                        | Aucune : l'API peut changer dans une mineure ; avertissement en développement |
| `beta`         | Definition of Done d'accessibilité complète, tests, documentation, utilisé par un produit     | Changements d'API annoncés, avec migration                                    |
| `stable`       | Deux produits l'utilisent sans contournement pendant une version mineure ; revue d'API finale | Semver strict                                                                 |
| `deprecated`   | Remplaçant disponible, migration documentée                                                   | Fonctionne jusqu'à la prochaine majeure ; avertissement en développement      |

Le statut est déclaré dans le contrat, affiché dans la documentation et reflété dans les types (JSDoc
`@experimental`, `@deprecated`).

## 4. Entrée dans le cœur

Un composant ou une variante entre dans le cœur si :

1. au moins **deux produits** en ont besoin sous la même forme ;
2. il est **générique** (aucune logique métier) ;
3. un pattern d'accessibilité éprouvé existe (APG ou équivalent documenté) ;
4. le design l'a validé dans le système existant ;
5. il passe le test d'admission de [PRINCIPLES.md](PRINCIPLES.md).

Sinon, il vit dans une bibliothèque étendue ou dans l'application, et peut être promu plus tard sans
réécriture (même format de contrat).

## 5. Revue d'API

Toute modification de l'API publique (contrat, tokens, hooks, classes, événements, props) passe une revue
d'API par un mainteneur. Liste de contrôle :

- [ ] Nommage conforme au vocabulaire contrôlé
- [ ] Cohérence avec les composants voisins (mêmes noms pour les mêmes concepts)
- [ ] Plus petite surface possible (test d'admission, question 5)
- [ ] Accessibilité : pattern, clavier, nom accessible
- [ ] Tokens et hooks : nécessaires et nommés selon la grammaire
- [ ] Performance : budget respecté
- [ ] Documentation et fixtures à jour
- [ ] Classification semver correcte et changeset présent

Les rapports d'API (noms de tokens, contrats, types publics) sont générés et versionnés : leur diff en PR
rend chaque changement de surface visible.

## 6. Dépréciation et breaking changes

- Une API est dépréciée pendant **au moins une version mineure** avant sa suppression, avec un
  avertissement en développement, une entrée « Deprecations » dans les notes de release et, si possible,
  un codemod.
- **Au plus une version majeure par an**, annoncée à l'avance, avec guide de migration.
- La version majeure précédente reçoit les correctifs de sécurité et d'accessibilité pendant **douze
  mois** (branche de maintenance, voir [RELEASE_PROCESS.md](../engineering/RELEASE_PROCESS.md)).
- Une anatomie HTML n'est jamais modifiée de façon incompatible dans une mineure : l'ancienne reste
  supportée par le CSS jusqu'à la majeure suivante.

## 7. Cohérence dans le temps

| Risque d'incohérence               | Mécanisme automatique                                          | Mécanisme humain                         |
| ---------------------------------- | -------------------------------------------------------------- | ---------------------------------------- |
| Nommage qui dérive                 | Lint des contrats, règles de motifs Stylelint                  | Revue d'API                              |
| Valeurs en dur                     | Stylelint (tokens obligatoires)                                | —                                        |
| Frontières de couches violées      | dependency-cruiser                                             | Revue d'architecture (CODEOWNERS)        |
| Adapters qui divergent             | Tests de contrat partagés                                      | —                                        |
| Régressions visuelles              | Tests visuels                                                  | Validation design des captures modifiées |
| Tokens qui prolifèrent             | Rapport des noms de tokens, seuil d'alerte (+10 % par mineure) | Revue trimestrielle des tokens           |
| Documentation périmée              | Tables d'API générées, exemples issus des fixtures             | Revue à chaque release                   |
| Dette de plateforme qui s'accumule | Registre des fonctionnalités avec date de retrait des replis   | Revue trimestrielle du registre          |

## 8. Dette de plateforme

Chaque polyfill, repli ou contournement de navigateur est inscrit dans le registre des fonctionnalités
d'[ARCHITECTURE.md](ARCHITECTURE.md), section 6, avec sa condition de retrait. Chaque trimestre, les
mainteneurs vérifient les statuts Baseline et planifient le retrait des replis devenus inutiles. Un
polyfill retiré est un changement `perf` dans les notes de release, et un changement majeur seulement s'il
relève le plancher navigateurs.

## 9. Mesures de santé

| Mesure                                        | Signal                                      |
| --------------------------------------------- | ------------------------------------------- |
| Adoption par produit et par composant         | Ce qui est utilisé, ce qui ne l'est pas     |
| Surcharges CSS dans les applications          | Composants qui ne répondent pas aux besoins |
| Tickets d'accessibilité ouverts, par sévérité | Qualité réelle                              |
| Budgets de performance (tendance)             | Dérive de taille                            |
| Délai de revue et de merge                    | Santé du processus                          |
| Nombre de tokens et de hooks publics          | Maîtrise de la surface d'API                |

## 10. Communication

- Notes de release à chaque publication (obligatoires, voir
  [RELEASE_PROCESS.md](../engineering/RELEASE_PROCESS.md)).
- Feuille de route publique : ce qui est en RFC, en cours, prévu.
- Annonce de chaque version majeure au moins un trimestre à l'avance.
