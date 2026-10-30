# Principes

> Statut : validée le 2026-10-30 (v1). Dernière mise à jour : 2026-10-30.

Ce document fixe ce qui guide chaque décision : l'ordre des priorités, les principes, le test qu'une
abstraction doit passer pour exister et les garde-fous contre les dérives connues des design systems.
En cas de doute sur un choix, ce document fait foi après [ARCHITECTURE.md](ARCHITECTURE.md).

## 1. Planchers non négociables

Ces exigences ne s'échangent contre rien. L'ordre de priorité de la section 2 ne s'applique qu'entre des
options qui les respectent toutes.

1. **Accessibilité WCAG 2.2 AA** pour tout composant publié (voir [ACCESSIBILITY.md](ACCESSIBILITY.md)).
2. **Aucun breaking change hors version majeure**, selon la définition de
   [RELEASE_PROCESS.md](../engineering/RELEASE_PROCESS.md).
3. **Aucune régression de sécurité** : pas de HTML injecté sans contrôle, pas de dépendance non auditée,
   pas de secret dans le dépôt.

## 2. Ordre de priorité

Quand deux options respectent les planchers et entrent en conflit, on tranche dans cet ordre :

1. Plateforme web
2. Simplicité
3. Performance
4. Accessibilité (au-delà du plancher : AAA quand c'est possible, confort d'usage)
5. Composabilité
6. Expérience développeur
7. Maintenabilité
8. Extensibilité

Exemple : un sélecteur personnalisé entièrement stylable (meilleure DX et extensibilité) face au
`<select>` natif (plateforme, simplicité, performance). Le natif l'emporte tant que
`appearance: base-select` n'est pas Baseline ; la version riche passe par un combobox, construit
seulement quand un produit en a besoin.

## 3. Principes directeurs

Chaque principe indique comment l'appliquer et comment il est vérifié.

### P1. La plateforme d'abord

Si le navigateur sait le faire correctement, on ne le refait pas, même pour uniformiser une API.

- Appliquer : partir de l'élément HTML et de l'API web la plus proche ; ne compléter que l'écart.
- Vérifier : toute abstraction nouvelle passe le test d'admission (section 4) ; le registre des
  fonctionnalités de plateforme ([ARCHITECTURE.md](ARCHITECTURE.md), section 6) liste ce sur quoi on
  s'appuie.

### P2. Le HTML est l'API, le JavaScript est une amélioration

Un composant doit être compréhensible et, si possible, utilisable avant le chargement du JavaScript.

- Appliquer : les composants de type A n'ont aucun JavaScript ; ceux de type C ont un rendu initial
  lisible, stable et sans décalage de mise en page avant l'upgrade.
- Vérifier : tests visuels de l'état non défini (`:not(:defined)`) et mesure du CLS dans les tests E2E.

### P3. Le CSS est l'implémentation, pas un détail

L'apparence, les variantes, les états visuels, le responsive et les thèmes vivent dans le CSS, sans
runtime.

- Appliquer : aucun style calculé en JavaScript ; aucune variante qui exige du JavaScript.
- Vérifier : Stylelint (spécificité, layers, tokens) et budgets de taille.

### P4. L'état visuel dérive de l'état sémantique

On style ce que l'arbre d'accessibilité voit : `:checked`, `:disabled`, `[aria-current="page"]`,
`[aria-expanded="true"]`, `:popover-open`, `[open]`, `:state(selected)`. Jamais de classe `.is-active`
indépendante.

- Appliquer : si l'état sémantique manque, l'état visuel manque aussi, et le bug se voit.
- Vérifier : revue et tests de contrat (« l'état X produit l'attribut ou la pseudo-classe Y »).

### P5. Une seule source de vérité par décision

| Décision                        | Source unique        |
| ------------------------------- | -------------------- |
| Valeurs de design               | Tokens (DTCG)        |
| API publique d'un composant     | Contrat du composant |
| Apparence                       | CSS du composant     |
| Comportement                    | Élément du composant |
| Exemples (docs, atelier, tests) | Fixtures             |
| Versions et notes de release    | Changesets           |

Tout le reste (types React, tables d'API de la documentation, métadonnées d'IDE) est dérivé.

### P6. Coupler par contrat, pas par import

Styles et comportements ne s'importent pas : ils s'accordent sur une anatomie et des états déclarés dans
le contrat. On peut changer l'un sans toucher l'autre tant que le contrat tient.

### P7. Zéro runtime obligatoire

Ni provider, ni contexte de thème, ni CSS-in-JS, ni framework requis. Un `<link>` suffit pour commencer.

### P8. Composer plutôt qu'hériter

On étend par la cascade, les custom properties, les variantes et la composition d'éléments. On ne
sous-classe pas un élément du design system, et on ne dépend pas de son DOM interne.

### P9. Accessible par construction

L'accessibilité est obtenue par la structure plutôt que vérifiée après coup :

- les paires de couleurs fond/texte sont contraintes en contraste dès les tokens ;
- le focus visible est un `outline`, qui survit au mode forced colors ;
- le mouvement est opt-in (`prefers-reduced-motion: no-preference`) ;
- la sémantique vient des éléments natifs ou d'`ElementInternals`.

### P10. Une API publique petite, explicite et versionnée

Tout ce qui est public est listé : noms de tokens, classes, attributs, balises, événements, hooks CSS,
anatomies, props. Ce qui n'est pas listé est privé et peut changer à tout moment (`--_*`, `internal/`).
Les rapports d'API rendent visible en revue toute modification de cette surface.

### P11. Mesurer avant d'optimiser, budgéter avant de grossir

Chaque artefact a un budget de taille vérifié en CI. Dépasser un budget exige une décision explicite
(ADR), pas un simple commit.

### P12. Chaque abstraction paie un loyer

Une abstraction coûte en octets, en surface d'API, en maintenance, en apprentissage et en migrations
futures. Elle n'existe que si elle rapporte plus qu'elle ne coûte, ce que mesure le test de la
section 4.

## 4. Test d'admission d'une abstraction

Toute nouvelle abstraction (helper partagé, composant, token, hook CSS, prop, outil) répond par écrit à
ces six questions, dans la PR ou dans un ADR :

1. **Le navigateur le fait-il déjà ?** Vérifier Baseline. Si oui : on l'utilise, point.
2. **Le fera-t-il bientôt ?** (Interop, Open UI, intention de livrer.) Si oui : polyfill ciblé et daté
   plutôt qu'abstraction durable.
3. **Combien de consommateurs réels ?** Au moins deux usages concrets ; « ça pourrait servir » ne compte
   pas.
4. **Quel est le coût ?** Octets au runtime, surface d'API publique, code à maintenir, documentation,
   tests.
5. **Existe-t-il une version plus petite ?** (Une custom property plutôt qu'une variante, une variante
   plutôt qu'un composant, une recette plutôt qu'un composant.)
6. **Comment la retire-t-on ?** Plan de sortie : dépréciation, codemod, remplacement natif.

Si la réponse à 1 est oui, ou si la réponse à 3 est inférieure à deux, l'abstraction est refusée.

## 5. Garde-fous contre les dérives

| Dérive à éviter                 | Garde-fou                                                                                           | Automatisé par                                               |
| ------------------------------- | --------------------------------------------------------------------------------------------------- | ------------------------------------------------------------ |
| Usine à gaz, over-engineering   | Test d'admission ; RFC pour toute nouvelle catégorie ; phase pilote avant passage à l'échelle       | Template de PR (section « Décisions techniques »)            |
| Abstractions inutiles           | P1 et test d'admission ; pas de paquet `core` ni `utils`                                            | Revue d'architecture (CODEOWNERS)                            |
| Dépendances excessives          | Zéro dépendance runtime dans `@mcs-ds/web` ; toute dépendance justifiée ; `minimumReleaseAge`       | Knip, dependency-cruiser, `package.json` relu par CODEOWNERS |
| Duplication                     | Contrats et fixtures comme sources uniques ; co-location par composant                              | Tests de contrat                                             |
| Composants monolithiques        | Anatomie en parties ; pas plus d'une responsabilité par élément ; taille de fichier bornée          | ESLint (`max-lines`, `complexity`)                           |
| API incohérentes                | Vocabulaire contrôlé (variant, tone, size…) ; revue d'API                                           | Lint des contrats (phase 2)                                  |
| CSS trop complexe               | Budget de spécificité, profondeur d'imbrication, layers obligatoires                                | Stylelint                                                    |
| Runtime inutile                 | Type A sans JavaScript ; budgets ; pas de CSS-in-JS                                                 | size-limit                                                   |
| Dépendance forte à React        | Le HTML est l'API ; adapters minces ; tests de contrat exécutés sans React                          | dependency-cruiser, tests de contrat                         |
| Dépendance forte à Storybook    | Fixtures neutres consommées par l'atelier, les tests et la documentation                            | Aucun import de Storybook hors `apps/workbench`              |
| Dépendance forte à un bundler   | ESM non bundlé, `exports` standards, CDN utilisable sans build                                      | publint, attw, test d'import Node                            |
| Dépendance forte à un framework | Aucun framework dans `@mcs-ds/web` ni `@mcs-ds/tokens`                                              | dependency-cruiser                                           |
| Tokens incontrôlables           | Deux niveaux publiés, hooks non valorisés par défaut, budget de tokens, critères d'ajout            | Rapport de noms de tokens, revue                             |
| Breaking changes permanents     | Dépréciation d'au moins une mineure avant suppression ; au plus une majeure par an ; rapports d'API | Changesets, CI (changeset `major` = 2 approbations)          |
| Configuration interminable      | Conventions par défaut, zéro configuration pour démarrer, aucun plugin de build requis              | Applications témoins « zéro config » en E2E                  |

## 6. Ce que le design system n'est pas

- **Pas un framework d'application** : pas de routage, de gestion d'état applicatif ni de data fetching.
- **Pas une bibliothèque d'utilitaires CSS** : quelques utilitaires ciblés (typographie, masquage
  accessible) et un pont optionnel vers Tailwind v4, rien de plus.
- **Pas un kit de pages** : les patterns sont des recettes documentées, pas des paquets.
- **Pas une couche d'abstraction des navigateurs** : on s'appuie sur la plateforme et on retire les
  polyfills dès qu'ils deviennent inutiles.
