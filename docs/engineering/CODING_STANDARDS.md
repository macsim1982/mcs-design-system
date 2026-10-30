# Standards de code

> Statut : en vigueur dès la phase 1. Dernière mise à jour : 2026-10-30.
> Philosophie : **strict mais sans friction**. Tout ce qui peut être corrigé automatiquement l'est
> (`--fix`, Prettier) ; chaque règle bloquante a une raison écrite ; chaque exception est justifiée dans
> le code.

## 1. Inventaire de l'outillage

Chaque outil a été retenu parce qu'il apporte une valeur qu'aucun autre outil de la chaîne n'apporte.

| Outil                               | Rôle                                                          | Exécuté dans          | Ne duplique pas                                                             |
| ----------------------------------- | ------------------------------------------------------------- | --------------------- | --------------------------------------------------------------------------- |
| pnpm 12                             | Paquets, workspaces, sécurité de la supply chain              | Partout               | —                                                                           |
| TypeScript 6.0                      | Typage, contrôle des types                                    | IDE, `pre-push`, CI   | —                                                                           |
| ESLint 10, typescript-eslint        | Erreurs de logique, règles typées, complexité                 | IDE, `pre-commit`, CI | Prettier (aucune règle de formatage activée)                                |
| Prettier                            | Formatage de tous les fichiers texte                          | IDE, `pre-commit`, CI | ESLint et Stylelint (qui ne formatent pas)                                  |
| Stylelint 17 et deux plugins        | Règles CSS d'architecture, Baseline, tokens obligatoires      | IDE, `pre-commit`, CI | Prettier (Stylelint 17 n'a plus de règles stylistiques)                     |
| commitlint                          | Messages de commit et titres de PR                            | `commit-msg`, CI      | —                                                                           |
| Husky, lint-staged                  | Exécution des contrôles sur les fichiers indexés              | Hooks Git             | —                                                                           |
| secretlint                          | Détection de secrets                                          | `pre-commit`, CI      | Protection côté GitHub (complémentaire, pas toujours disponible en privé)   |
| Vitest 5                            | Tests unitaires (Node) et de composants (navigateurs réels)   | `pre-push`, CI        | Playwright Test (réservé à l'E2E et aux tests visuels)                      |
| Playwright                          | Navigateurs pour Vitest, tests visuels, E2E                   | CI                    | —                                                                           |
| axe-core                            | Règles d'accessibilité automatiques                           | Tests navigateur, E2E | —                                                                           |
| dependency-cruiser                  | Frontières de couches, cycles, dépendances non déclarées      | CI                    | `import/no-cycle` d'ESLint (non activé : plus lent, sans règles de couches) |
| Knip                                | Fichiers, exports et dépendances inutilisés                   | CI                    | `no-unused-vars` (portée locale seulement)                                  |
| Changesets 3                        | Intentions de version, versions, publication                  | PR, `release.yml`     | semantic-release et release-please (non retenus, voir RELEASE_PROCESS)      |
| actionlint                          | Validation des workflows GitHub Actions                       | CI                    | —                                                                           |
| Renovate                            | Mises à jour de dépendances et des SHA d'actions              | GitHub (application)  | Dependabot (support incomplet de pnpm 11 et 12)                             |
| publint, attw, size-limit (phase 2) | Validité des paquets, résolution des types, budgets de taille | CI                    | —                                                                           |

Évalués et non retenus :

| Outil                     | Raison                                                                                                                         |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| JSLint                    | Règles figées et non configurables, pas de support TypeScript ni de règles typées, écosystème marginal                         |
| Biome                     | Rapide, mais sans l'équivalent des règles typées de typescript-eslint (promesses flottantes, `any` implicites dans les appels) |
| Oxlint                    | Même limite pour les règles typées à ce jour ; candidat à réévaluer comme accélérateur d'ESLint                                |
| `@eslint/css`             | Moins de règles que Stylelint (spécificité, motifs de nommage)                                                                 |
| eslint-config-prettier    | Inutile : aucune règle de formatage n'est activée                                                                              |
| Sass                      | Voir section 6.1                                                                                                               |
| Jest                      | Vitest couvre le même besoin, avec des tests en navigateur réel                                                                |
| Testing Library           | Les locators de Vitest (`page.getByRole`) couvrent les requêtes par rôle avec de vrais événements                              |
| Storybook Test, Chromatic | Redondants avec Vitest et les tests visuels Playwright ; Argos ou Chromatic restent une option pour l'interface de revue       |
| Turborepo, Nx             | Inutiles pour trois paquets (voir ARCHITECTURE.md, section 5)                                                                  |
| TypeScript 7 (natif)      | Sorti en juillet 2026, mais typescript-eslint exige TypeScript `< 6.1` ; migration dès que l'API de TS 7 sera supportée        |

## 2. Langues et fichiers

| Élément                                                  | Langue   |
| -------------------------------------------------------- | -------- |
| Code, identifiants, commentaires de code                 | Anglais  |
| Messages de commit, titres de PR, changesets             | Anglais  |
| Changelog et notes de release (artefacts publiés)        | Anglais  |
| Documentation d'architecture et d'ingénierie, issues, PR | Français |

- Fichiers en kebab-case, avec un suffixe de rôle : `.contract.ts`, `.element.ts`, `.fixtures.ts`,
  `.test.ts`, `.browser.test.ts`, `.visual.test.ts`, `.e2e.test.ts`, `.test-d.ts`.
- ESM partout (`"type": "module"`). Imports relatifs avec extension `.ts`, réécrite au build
  (`rewriteRelativeImportExtensions`).
- L'outillage (`tools/`) est en TypeScript exécuté **directement par Node 24** (suppression des types),
  sans étape de build. D'où l'option `erasableSyntaxOnly` : pas d'`enum`, de `namespace` ni de propriétés
  de paramètres.

## 3. TypeScript

Configuration partagée : [`tsconfig.base.json`](../../tsconfig.base.json).

| Option                                                                  | Raison                                                                        |
| ----------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| `strict`                                                                | Base non négociable                                                           |
| `noUncheckedIndexedAccess`                                              | Un accès par index peut renvoyer `undefined`                                  |
| `exactOptionalPropertyTypes`                                            | Distingue « absent » de « `undefined` » : important pour les props publiques  |
| `noImplicitOverride`, `noImplicitReturns`, `noFallthroughCasesInSwitch` | Erreurs de logique courantes                                                  |
| `noPropertyAccessFromIndexSignature`                                    | Rend visibles les accès non vérifiés                                          |
| `verbatimModuleSyntax`                                                  | Imports de types explicites, tree shaking sûr                                 |
| `erasableSyntaxOnly`                                                    | Code exécutable par Node sans transpilation                                   |
| `isolatedDeclarations` (paquets publiés)                                | Types de retour explicites sur l'API publique ; génération rapide des `.d.ts` |
| `module` et `moduleResolution` : `nodenext`                             | Le code publié fonctionne dans Node (SSR) sans bundler                        |

Règles de typage :

- `any` interdit. `unknown` puis rétrécissement. Une exception exige un commentaire de désactivation
  avec justification (règle `eslint-comments/require-description`).
- Pas d'`enum` ni de `namespace` : unions de littéraux et objets `as const` (contrats).
- `satisfies` pour vérifier une forme sans perdre l'inférence.
- Les données publiques sont `readonly`.
- Pas d'assertion non nulle (`!`) ni de cast (`as`) pour contourner une erreur réelle.

## 4. ESLint

Configuration centralisée : [`eslint.config.js`](../../eslint.config.js), un seul fichier pour tout le
monorepo (une configuration par paquet finit toujours par diverger). Bases : `@eslint/js` recommandé,
`typescript-eslint` `strictTypeChecked` et `stylisticTypeChecked`, commentaires ESLint.

| Règle                                                                 | Seuil ou réglage                       | Raison                                              |
| --------------------------------------------------------------------- | -------------------------------------- | --------------------------------------------------- |
| `complexity`                                                          | 12                                     | Au-delà, une fonction mérite d'être découpée        |
| `max-depth`                                                           | 3                                      | L'imbrication profonde cache la logique             |
| `max-params`                                                          | 4                                      | Au-delà, un objet d'options                         |
| `max-lines-per-function`                                              | 60 (hors tests)                        | Lisibilité, testabilité                             |
| `max-lines`                                                           | 400                                    | Un fichier = une responsabilité                     |
| `@typescript-eslint/no-floating-promises`, `no-misused-promises`      | Erreur                                 | Les promesses oubliées sont des bugs silencieux     |
| `@typescript-eslint/only-throw-error`, `prefer-promise-reject-errors` | Erreur                                 | Toujours des objets `Error`, avec une pile d'appels |
| `@typescript-eslint/consistent-type-imports`                          | Erreur                                 | Imports de types explicites                         |
| `no-restricted-syntax` (`TSEnumDeclaration`, `TSModuleDeclaration`)   | Erreur                                 | Pas d'`enum` ni de `namespace`                      |
| `no-restricted-exports` (export par défaut)                           | Erreur, sauf fichiers de configuration | Exports nommés : renommage et tree shaking fiables  |
| `eqeqeq`, `no-console` (hors `tools/`), `prefer-const`                | Erreur                                 | Classiques                                          |
| `eslint-comments/require-description`                                 | Erreur                                 | Toute exception est justifiée                       |
| Directives de désactivation inutilisées                               | Erreur                                 | Pas d'exception fantôme                             |

Conventions vérifiées hors ESLint :

- **Dépendances circulaires et couches** : dependency-cruiser (section 8).
- **Code mort** : Knip.
- **Nommage** : conventions de [COMPONENT_ARCHITECTURE.md](../architecture/COMPONENT_ARCHITECTURE.md),
  section 12. Pas de règle `naming-convention` générale : elle produit beaucoup de bruit pour peu de
  gain. Pas de préfixe `is` imposé aux booléens, car l'API publique reprend les noms HTML (`disabled`,
  `open`).

Gestion des erreurs :

- Dans les éléments : jamais d'exception dans les callbacks de cycle de vie. Un usage invalide produit un
  avertissement en développement et un comportement dégradé sûr.
- Dans l'outillage : échec immédiat avec un message actionnable et un code de sortie non nul.

## 5. Formatage

Prettier formate tous les fichiers texte (`prettier.config.js`), avec `printWidth: 100` et des
apostrophes simples. Le reste est laissé aux valeurs par défaut : pas de débat de style.
`.editorconfig` aligne les éditeurs (LF, UTF-8, deux espaces).

## 6. CSS

L'architecture CSS est décrite dans
[CSS_ARCHITECTURE.md](../architecture/CSS_ARCHITECTURE.md). Ce chapitre liste les règles et leur outil.

### 6.1 Pas de SCSS

Toutes les fonctions utiles de Sass ont un équivalent natif (custom properties, nesting, `calc()` et
`color-mix()`, `@import` regroupés au build). Sass ajouterait un langage, un compilateur et une étape
obligatoire. Le CSS publié est du CSS standard, lisible et utilisable sans build. Critère de réexamen :
un besoin récurrent de mixins que ni les variables privées ni `:where()` ne couvrent.

### 6.2 Règles Stylelint

Configuration : [`stylelint.config.js`](../../stylelint.config.js), sur la base de
`stylelint-config-standard`.

| Règle                                        | Réglage                                              | Raison                                                                                           |
| -------------------------------------------- | ---------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| `selector-class-pattern`                     | `mcs-<bloc>[__<partie>]`, kebab-case                 | Nommage BEM allégé                                                                               |
| `custom-property-pattern`                    | `--mcs-*` (public) ou `--_*` (privé)                 | Frontière publique et privée visible                                                             |
| `selector-max-specificity`                   | `0,3,0`                                              | Pas de guerre de spécificité                                                                     |
| `selector-max-id`                            | 0                                                    | Idem                                                                                             |
| `selector-disallowed-list`                   | Type qualifiant une classe `mcs-` hors `:where()`    | Sélecteurs gardiens sans spécificité ; `selector-no-qualifying-type` ne distingue pas `:where()` |
| `selector-max-compound-selectors`            | 3                                                    | Sélecteurs courts                                                                                |
| `max-nesting-depth`                          | 2                                                    | Lisibilité, spécificité                                                                          |
| `declaration-no-important`                   | Activé                                               | Les layers remplacent `!important`                                                               |
| `property-disallowed-list`                   | Propriétés physiques (`margin-left`…)                | Propriétés logiques, droite à gauche                                                             |
| `declaration-property-value-disallowed-list` | `text-align: left/right`, `float: left/right`        | Idem                                                                                             |
| `media-feature-name-disallowed-list`         | `prefers-color-scheme`                               | Le mode sombre vit dans les tokens                                                               |
| `plugin/use-baseline`                        | Baseline widely available, liste blanche du niveau B | Politique navigateurs                                                                            |
| `scale-unlimited/declaration-strict-value`   | Couleurs, ombres, polices, z-index                   | Valeurs de design par tokens uniquement                                                          |

### 6.3 Imbrication, mixins, fonctions, variables

- Imbrication : variantes, états et at-rules uniquement ; profondeur 2 ; pas de parties imbriquées.
- Mixins : aucun. Factorisation par variables privées et `:is()` ou `:where()`.
- Fonctions : natives (`calc()`, `clamp()`, `min()`, `max()`, `color-mix()`).
- Variables : un token système si la valeur est une décision de design partagée ; un hook si un thème
  doit pouvoir la changer pour ce composant ; une variable privée `--_*` sinon.

### 6.4 Responsive

Container queries pour les composants, media queries de viewport pour les primitives de mise en page,
syntaxe d'intervalle, seuils en `rem`, valeurs fluides par `clamp()`.

## 7. Dépendances

- **Zéro dépendance runtime** dans `@mcs-ds/web` et `@mcs-ds/tokens`. Toute exception passe par un ADR.
- Les devDependencies sont déclarées **à la racine** du monorepo : une seule version par outil, et les
  mises à jour d'outillage ne déclenchent pas de version des paquets.
- `minimumReleaseAge` (pnpm) : une version publiée depuis moins de trois jours n'est pas installée.
  Exception ponctuelle par `minimumReleaseAgeExclude`, avec justification en PR (correctif de sécurité).
- `allowBuilds` (pnpm) : aucune dépendance n'exécute de script d'installation sans être listée
  explicitement.
- Ajouter une dépendance : justifier en PR (taille, maintenance, licence, alternatives natives).

## 8. Architecture as code

Les règles de dépendance d'[ARCHITECTURE.md](../architecture/ARCHITECTURE.md) (section 4.3) sont
encodées dans [`.dependency-cruiser.cjs`](../../.dependency-cruiser.cjs) :

| Règle dependency-cruiser                                      | Règle d'architecture |
| ------------------------------------------------------------- | -------------------- |
| `no-circular`                                                 | R1                   |
| `tokens-are-a-leaf`, `contracts-are-a-leaf`                   | R2                   |
| `elements-stay-framework-free`, `behaviors-do-not-import-css` | R5                   |
| `internal-is-private`                                         | R6                   |
| `nothing-depends-on-adapters`, `adapters-are-independent`     | R7                   |
| `adapters-use-public-entry-points`                            | R8 (partiel)         |
| `no-undeclared-deps-in-published-code`                        | R9                   |
| `production-code-ignores-tooling`                             | R10                  |
| `no-unresolvable`                                             | Hygiène              |

`pnpm run check:architecture` exécute ces règles sur `tools/`, `packages/` et `apps/` dès qu'ils
existent. Leur efficacité a été vérifiée en plantant six violations dans une structure de paquets
temporaire : toutes ont été détectées.

R3 et R4 (valeurs en dur, sélecteurs d'un autre composant) sont vérifiées par Stylelint.

## 9. Exceptions

Une règle peut être désactivée localement, jamais globalement, avec :

```ts
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- l'API de X n'est pas typée (ticket #123)
```

La justification est obligatoire (règle bloquante). Une exception récurrente est le signe qu'une règle
est mal réglée : on la rediscute plutôt que de multiplier les exceptions.
