# Architecture du design system

> **Statut : validée le 2026-10-30 (v1).** Phase 2 (pilote) ouverte : fondations minimales et cinq
> composants pilotes (section 10). Aucun composant n'est encore implémenté.
> Dernière mise à jour : 2026-10-30. Les données datées (support navigateur, versions d'outils, état
> des projets cités) ont été vérifiées à cette date.

Ce document est le point d'entrée de l'architecture. Il présente l'architecture retenue, ses couches et
leurs règles de dépendance, la structure du dépôt, la politique navigateurs, le registre des décisions,
la contre-expertise qui a produit cette version et le plan de validation. Les sujets détaillés sont
traités dans les documents spécialisés.

## Carte des documents

| Document                                               | Contenu                                                                                  |
| ------------------------------------------------------ | ---------------------------------------------------------------------------------------- |
| [PRINCIPLES.md](PRINCIPLES.md)                         | Priorités, principes directeurs, test d'admission des abstractions, garde-fous           |
| [PRIOR_ART.md](PRIOR_ART.md)                           | Analyse critique de Material 3, Radix, shadcn/ui, Chakra, Carbon, SLDS, Fluent, Spectrum |
| [TOKENS.md](TOKENS.md)                                 | Architecture des tokens (DTCG 2025.10), nomenclature, catégories, pipeline               |
| [THEMING.md](THEMING.md)                               | Clair et sombre, marques, marque blanche, contraste élevé, thèmes imbriqués              |
| [CSS_ARCHITECTURE.md](CSS_ARCHITECTURE.md)             | Couches de cascade, spécificité, nommage, responsive, états, mouvement                   |
| [COMPONENT_ARCHITECTURE.md](COMPONENT_ARCHITECTURE.md) | Taxonomie, contrats, API, conventions, catalogue, extensibilité                          |
| [FRAMEWORKS.md](FRAMEWORKS.md)                         | Options A à E, stratégie React, SSR et hydratation, autres frameworks                    |
| [ACCESSIBILITY.md](ACCESSIBILITY.md)                   | Cible WCAG 2.2 AA, mécanismes architecturaux, tests, Definition of Done                  |
| [PERFORMANCE.md](PERFORMANCE.md)                       | Modèle de coût, budgets, abstractions coûteuses, mesure                                  |
| [DEVELOPER_EXPERIENCE.md](DEVELOPER_EXPERIENCE.md)     | Découvrabilité, personnalisation, stratégie de documentation                             |
| [GOVERNANCE.md](GOVERNANCE.md)                         | Décisions, cycle de vie, contributions, cohérence dans le temps                          |
| [../engineering/](../engineering/)                     | Workflow Git, standards de code, stratégie de tests, releases et déploiement             |
| [../../CLAUDE.md](../../CLAUDE.md)                     | Agents de code : garde de phase, invariants, agents spécialisés, synchronisation         |

## 1. En une page

Le design system est une **plateforme de conventions HTML et CSS**, alimentée par des **tokens** et
complétée par des **comportements** là où la plateforme web ne suffit pas. Les frameworks sont des
consommateurs, pas des fondations.

Dix décisions structurantes :

1. **Natif d'abord.** Un composant qui a un équivalent HTML (`<button>`, `<dialog>`, `<details>`,
   `<input>`, `popover`…) est un élément natif stylé, pas un custom element. Il n'existe pas de
   `<mcs-button>` : on écrit `<button class="mcs-button" data-variant="primary">`.
2. **Le CSS est l'implémentation principale**, sans runtime : couches `@layer`, custom properties,
   aucun CSS-in-JS, aucun préprocesseur.
3. **Les comportements manquants sont des custom elements en light DOM** (`<mcs-tabs>`, `<mcs-menu>`,
   `<mcs-toaster>`…), sans Shadow DOM par défaut, sans framework, avec une sémantique portée par
   `ElementInternals`.
4. **Un contrat par composant** (anatomie, attributs, valeurs, états, événements, hooks CSS, pattern
   ARIA) est la source unique de l'API. Styles, comportements, adapters, documentation et tests s'y
   réfèrent.
5. **Tokens au format DTCG 2025.10**, sur deux niveaux (référence interne puis système public) et des
   hooks de composant optionnels. Le clair et le sombre passent par `color-scheme` et `light-dark()`.
6. **Le theming est 100 % CSS** : des attributs posés sur n'importe quel élément, aucun provider
   JavaScript, et un changement de thème sans rebuild.
7. **Les adapters (React d'abord) sont des gabarits typés**, jamais une seconde implémentation : ils
   rendent l'anatomie et branchent les événements, rien de plus.
8. **Trois paquets publiés**, `@mcs-ds/tokens`, `@mcs-ds/web` et `@mcs-ds/react`, versionnés ensemble.
9. **Une politique navigateurs fondée sur Baseline**, avec amélioration progressive et des polyfills
   chargés à la demande, datés et retirés dès que possible.
10. **Architecture as code** : les règles de ce document sont vérifiées par l'outillage
    (dependency-cruiser, ESLint, Stylelint, tests de contrat, CI), pas seulement par la relecture.

> Préfixe définitif (décision D-13) : `mcs` pour les classes, balises, événements, custom properties
> et layers ; scope npm `@mcs-ds` (le scope `@mcs` est déjà pris sur npm). Le préfixe est une API
> permanente : le changer serait un breaking change total.

## 2. Contexte et contraintes

| Contexte de consommation             | Ce que cela impose à l'architecture                                                                         |
| ------------------------------------ | ----------------------------------------------------------------------------------------------------------- |
| Petit site, CMS, site institutionnel | Utilisable sans build ni framework (`<link>`, `<script type="module">`), HTML écrit à la main ou par un CMS |
| E-commerce                           | Core Web Vitals, SSR, SEO, appareils anciens, accessibilité exigée par l'European Accessibility Act         |
| Application web, SaaS                | Composants riches, React et Next.js, thèmes multiples, marque blanche, densité                              |
| Projet à grande échelle              | Plusieurs équipes et frameworks, versions coexistantes, gouvernance                                         |

Ordre de priorité en cas de conflit : plateforme web, simplicité, performance, accessibilité,
composabilité, DX, maintenabilité, extensibilité. Une nuance est assumée : **l'accessibilité n'est pas
arbitrable en dessous de WCAG 2.2 AA**. C'est un plancher, pas un critère qu'on échange contre de la
performance ou de la simplicité ; l'ordre de priorité départage des options qui respectent toutes ce
plancher (voir [PRINCIPLES.md](PRINCIPLES.md)).

Horizon : cinq ans et plus. On parie donc sur les standards, qui ne cassent pas, plutôt que sur des
abstractions propriétaires qui se réécrivent tous les trois ans (Chakra v2 vers v3, Fluent v8 vers v9,
Material Web passé en maintenance en 2024 ; voir [PRIOR_ART.md](PRIOR_ART.md)).

## 3. L'architecture initialement envisagée, challengée

Pile proposée au départ : Plateforme, puis Fondations, Tokens, Core, Web Components, Adapters,
Frameworks.

| Élément de la pile initiale                     | Verdict                                  | Raison                                                                                                                                                                                                                                                                                                          |
| ----------------------------------------------- | ---------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Fondations et Tokens en couches distinctes      | **Fusionnées** : une source, deux formes | Les fondations sont des décisions de design (échelles, rôles, règles) ; les tokens en sont l'encodage machine. Deux couches, ce sont deux sources qui divergent. Les fondations restent un chapitre de documentation adossé aux tokens.                                                                         |
| Un « Core » JavaScript sous les composants      | **Réduit à un module interne**           | La plateforme fournit désormais le top layer, `inert`, la modale native, le light dismiss, la restauration du focus et la validation de formulaire. Ce qui manque (roving tabindex, typeahead, quelques polyfills) tient en quelques helpers non publiés. Un paquet « core » public deviendrait un fourre-tout. |
| Web Components au cœur de _tous_ les composants | **Remplacés par HTML + CSS comme cœur**  | Un custom element qui remplace un élément natif (`<mcs-button>`) n'a aucune sémantique avant son upgrade, doit réimplémenter soumission de formulaire, autofill, labels et focus, et ne se rend pas en SSR sans Declarative Shadow DOM. Le cœur durable, ce sont les conventions HTML et CSS.                   |
| Pile linéaire                                   | **Deux couches parallèles**              | Styles et comportements ne dépendent pas l'un de l'autre : ils se coordonnent par un contrat (anatomie et états). On peut utiliser les styles sans les comportements.                                                                                                                                           |
| Couche CSS implicite                            | **Ajoutée, au centre**                   | 12 des 17 composants étudiés n'ont besoin d'aucun JavaScript propre au design system (voir [COMPONENT_ARCHITECTURE.md](COMPONENT_ARCHITECTURE.md)).                                                                                                                                                             |
| Pas de contrats d'API                           | **Ajoutés**                              | Sans source unique, les variantes divergent entre CSS, types React, documentation et Figma.                                                                                                                                                                                                                     |
| Adapters minces                                 | **Conservés et durcis**                  | Un contrat d'adapter explicite les limite aux gabarits d'anatomie et aux bindings.                                                                                                                                                                                                                              |

Les options d'architecture sont comparées en détail dans [FRAMEWORKS.md](FRAMEWORKS.md) :

- A : Web Components au cœur ;
- B : core TypeScript et composants réimplémentés par framework ;
- C : Web Components et adapters générés ;
- D : contrat HTML/CSS, comportements en light DOM et adapters minces ;
- E : compilation multi-framework (type Mitosis).

**Recommandation : D.** Elle garde l'ambition de l'option C (une seule implémentation, utilisable
partout) sans en payer les coûts (SSR du Shadow DOM, ARIA à travers les shadow roots, formulaires
réimplémentés).

## 4. Architecture finale

### 4.1 Vue d'ensemble

```text
 CONSOMMATEURS   HTML statique, CMS   ·   React, Next.js   ·   Vue, Svelte, Astro…
        │                                   │                      │
        │                     L5 ADAPTERS   @mcs-ds/react       (@mcs-ds/vue… à la demande)
        │                                   │  gabarits d'anatomie + bindings
        ▼                                   ▼
┌─ @mcs-ds/web ────────────────────────────────────────────────────────────────────┐
│ L4a STYLES (CSS, zéro JS)                     L4b COMPORTEMENTS              │
│ @layer mcs.* · reset · base ·   ◄── contrat ──► custom elements en light DOM ·│
│ layout · composants ·            d'anatomie    ElementInternals · :state() · │
│ utilitaires                      et d'états    helpers internes              │
│            ▲                                             ▲                   │
│            └────────── L3 CONTRATS (données + types) ────┘                   │
│              anatomie, attributs, valeurs, états, événements,                │
│              hooks CSS, pattern ARIA, statut                                 │
└──────────────────────────────────────────────────────────────────────────────┘
                                       │ var(--mcs-*) uniquement
┌─ @mcs-ds/tokens ─────────────────────────────────────────────────────────────────┐
│ L2 TOKENS   sources DTCG 2025.10  →  CSS (thèmes, modes) · JSON · TypeScript │
└──────────────────────────────────────────────────────────────────────────────┘
                                       ▲ encode
 L1 FONDATIONS   principes, échelles, rôles de couleur, règles (documentation)
                                       ▲
 L0 PLATEFORME   HTML · CSS · DOM · ARIA · ElementInternals · dialog · popover
```

Une couche logique n'est pas forcément un paquet. Les paquets sont des **unités de livraison** (ce
qu'on installe et versionne) ; les couches sont des **frontières de dépendance** (ce qui a le droit
d'importer quoi). Styles, comportements et contrats d'un même composant changent ensemble : ils sont
donc livrés ensemble dans `@mcs-ds/web` et co-localisés par composant, tandis que leurs frontières sont
vérifiées par l'outillage.

### 4.2 Les couches

| Couche                  | Rôle                                                           | Livrée dans                    | Peut dépendre de                                            | Ne doit jamais dépendre de                                            |
| ----------------------- | -------------------------------------------------------------- | ------------------------------ | ----------------------------------------------------------- | --------------------------------------------------------------------- |
| L0 Plateforme           | HTML, CSS, DOM, ARIA, APIs du navigateur                       | (navigateur)                   | —                                                           | —                                                                     |
| L1 Fondations           | Principes, échelles, rôles, règles de design                   | Documentation et sources DTCG  | —                                                           | —                                                                     |
| L2 Tokens               | Valeurs de design nommées, thèmes et modes                     | `@mcs-ds/tokens`               | Rien (données)                                              | Tout le reste                                                         |
| L3 Contrats             | API publique déclarative de chaque composant                   | `@mcs-ds/web/contracts`        | Rien (données et types)                                     | Styles, comportements, adapters, DOM                                  |
| L4a Styles              | Apparence, états visuels, responsive, thèmes appliqués         | `@mcs-ds/web` (`*.css`)        | Tokens via `var()`                                          | JavaScript, valeurs en dur, sélecteurs d'un autre composant           |
| L4b Comportements       | Sémantique et interactions absentes de la plateforme           | `@mcs-ds/web` (`*.element.ts`) | Contrats, helpers internes, plateforme                      | CSS, tokens en JavaScript, frameworks, internes d'un autre composant  |
| L5 Adapters             | Gabarits d'anatomie, bindings d'événements, types idiomatiques | `@mcs-ds/react`, futurs        | Contrats (types), comportements (enregistrement), framework | CSS, helpers internes, autres adapters, toute logique de comportement |
| L6 Recettes et patterns | Compositions documentées (formulaires, en-têtes, états vides…) | Documentation (non publiée)    | Toute l'API publique                                        | Toute API interne                                                     |
| Transverse              | Outillage, atelier, applications témoins, tests                | `tools/`, `apps/`              | Tout (en tant que consommateur ou vérificateur)             | Rien ne dépend d'eux à l'exécution                                    |

Pourquoi les patterns ne sont pas un paquet : ils dépendent du contexte produit et évoluent vite. Les
publier crée un couplage fort et une surface d'API énorme pour une valeur faible. Ils sont documentés
comme des recettes copiables (le modèle « code que vous possédez » de shadcn/ui, appliqué là où il est
pertinent) et promus en composants seulement si au moins deux produits en ont besoin sous la même forme.

### 4.3 Règles de dépendance

| Règle | Énoncé                                                                                                                                    | Vérifiée par                                                      |
| ----- | ----------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------- |
| R1    | Aucun cycle, entre paquets comme entre modules.                                                                                           | dependency-cruiser (`no-circular`)                                |
| R2    | `@mcs-ds/tokens` ne dépend de rien ; les contrats ne dépendent de rien.                                                                   | dependency-cruiser, `package.json`                                |
| R3    | Le CSS ne contient aucune valeur de design en dur : couleurs, ombres, polices et z-index passent par des tokens.                          | Stylelint (`declaration-strict-value`)                            |
| R4    | Un fichier CSS de composant ne cible jamais les classes d'un autre composant ; l'adaptation contextuelle passe par des custom properties. | Stylelint (motif de sélecteurs), revue                            |
| R5    | Les comportements n'importent ni CSS, ni framework, ni internes d'un autre composant.                                                     | dependency-cruiser                                                |
| R6    | Les helpers `internal/` ne sont importables que depuis `@mcs-ds/web` ; ils ne sont pas exportés.                                          | `exports` de `package.json`, dependency-cruiser                   |
| R7    | Aucun paquet ne dépend d'un adapter ; un adapter ne dépend jamais d'un autre adapter.                                                     | dependency-cruiser                                                |
| R8    | Un adapter ne contient aucune logique de comportement (clavier, focus, positionnement, machine à états).                                  | Revue, tests de contrat partagés, règle ESLint dédiée (phase 2)   |
| R9    | Les sources publiées n'importent pas de devDependencies et ne contiennent aucune dépendance runtime non justifiée.                        | dependency-cruiser (`no-undeclared-deps-in-published-code`), Knip |
| R10   | Le code de production ne dépend jamais de `tools/`, des fixtures ni des tests.                                                            | dependency-cruiser                                                |

Ces règles sont encodées dans [`.dependency-cruiser.cjs`](../../.dependency-cruiser.cjs) et exécutées en
CI. Une règle qui n'est pas automatisable est signalée comme telle et vérifiée en revue.

### 4.4 Graphe des paquets

```text
@mcs-ds/react ──peerDependency──► @mcs-ds/web ──dependency──► @mcs-ds/tokens
    │                            │
    └──peerDependency──► react (>= 19)

apps/workbench, apps/consumers/*  (privés)  ──► @mcs-ds/react, @mcs-ds/web, @mcs-ds/tokens
```

- `@mcs-ds/web` dépend de `@mcs-ds/tokens` en version exacte : ses styles supposent l'existence des custom
  properties d'une version donnée.
- `@mcs-ds/react` déclare `@mcs-ds/web` en **peerDependency** pour garantir une seule copie des custom elements
  dans l'application. Deux copies tenteraient de définir deux fois `mcs-tabs`, ce que le registre global
  des custom elements interdit.
- Les trois paquets sont versionnés ensemble (groupe `fixed` de Changesets). Une application installe
  `@mcs-ds/*@1.4.0`, jamais un mélange de versions. Voir
  [RELEASE_PROCESS.md](../engineering/RELEASE_PROCESS.md).

### 4.5 Modèle d'exécution

Trois niveaux d'usage, cumulatifs :

**1. HTML et CSS seulement (zéro JavaScript).** Suffit pour 12 des 17 composants étudiés.

```html
<link rel="stylesheet" href="https://cdn.example/@mcs-ds/tokens@1/css/default.css" />
<link rel="stylesheet" href="https://cdn.example/@mcs-ds/web@1/css/mcs.css" />

<button class="mcs-button" data-variant="primary">Acheter</button>
```

**2. Avec comportements.** Chaque élément est un module ES indépendant, chargé seulement s'il est
utilisé, ou via un chargeur automatique optionnel.

```html
<script type="module" src="https://cdn.example/@mcs-ds/web@1/elements/tabs.js"></script>

<mcs-tabs value="billing">
  <mcs-tab-list aria-label="Paramètres du compte">
    <mcs-tab value="profile">Profil</mcs-tab>
    <mcs-tab value="billing">Facturation</mcs-tab>
  </mcs-tab-list>
  <mcs-tab-panel value="profile">…</mcs-tab-panel>
  <mcs-tab-panel value="billing">…</mcs-tab-panel>
</mcs-tabs>
```

**3. Avec un framework.** L'adapter rend la même anatomie, enregistre les éléments dont il a besoin et
expose des props idiomatiques.

```tsx
import '@mcs-ds/tokens/css/default.css';
import '@mcs-ds/web/css/mcs.css';
import { Button, Tabs, TabList, Tab, TabPanel } from '@mcs-ds/react';

<Button variant="primary">Acheter</Button>;

<Tabs value={tab} onValueChange={setTab}>
  <TabList aria-label="Paramètres du compte">
    <Tab value="profile">Profil</Tab>
    <Tab value="billing">Facturation</Tab>
  </TabList>
  <TabPanel value="profile">…</TabPanel>
  <TabPanel value="billing">…</TabPanel>
</Tabs>;
```

`<Button variant="primary">` rend `<button class="mcs-button" data-variant="primary">`. Ce composant est
compatible React Server Components et n'envoie aucun JavaScript au navigateur.

## 5. Structure du dépôt

```text
mcs-design-system/
├── packages/                    créés en phase 2, après validation
│   ├── tokens/                  @mcs-ds/tokens
│   │   ├── src/                 sources DTCG (*.tokens.json) et mcs.resolver.json
│   │   └── build/               configuration de génération (CSS, JSON, TypeScript)
│   ├── web/                     @mcs-ds/web
│   │   └── src/
│   │       ├── foundations/     layers.css, reset.css, base.css, layout.css, utilities.css
│   │       ├── components/
│   │       │   ├── button/      button.css · button.contract.ts · button.fixtures.ts · button.browser.test.ts
│   │       │   └── tabs/        tabs.css · tabs.contract.ts · tabs.element.ts · tabs.fixtures.ts · tabs.browser.test.ts
│   │       ├── internal/        helpers de comportement (non exportés)
│   │       ├── contracts.ts     point d'entrée public des contrats
│   │       └── index.css        point d'entrée CSS complet
│   └── react/                   @mcs-ds/react
│       └── src/                 button.tsx · tabs.tsx · …
├── apps/                        privés, jamais publiés
│   ├── workbench/               Storybook : développement, revue visuelle, documentation interne
│   └── consumers/               applications témoins pour l'E2E : HTML statique, Next.js, Vite
├── docs/
│   ├── architecture/            documents d'architecture (normatifs)
│   ├── engineering/             workflow Git, standards, tests, releases
│   └── releases/                notes de release versionnées (générées)
├── tools/                       outillage en TypeScript exécuté directement par Node, testé
├── .github/                     workflows, action composite, templates, CODEOWNERS, rulesets
├── .changeset/                  intentions de version
└── .husky/                      hooks Git
```

Choix de structure et ce qui a été écarté :

- **Co-location par composant** : CSS, contrat, comportement, fixtures, tests et notes d'un composant
  vivent dans un même dossier. Un composant est une unité de changement : une évolution touche un
  dossier et produit un changeset, pas trois paquets.
- **Pas de paquet `utils`** : un paquet fourre-tout attire du code sans propriétaire et crée des
  dépendances transverses. Les helpers vivent au plus près de leurs consommateurs.
- **Pas de paquet `core` public** : voir section 3. Le jour où des primitives de comportement seront
  stables et demandées par des équipes tierces, elles pourront être exposées sous un point d'entrée
  dédié, avec un statut expérimental.
- **Pas de séparation `components` et `web`, ni de paquet `themes`** : un thème est une donnée (des
  tokens), pas du code ; les thèmes intégrés vivent dans `@mcs-ds/tokens`.
- **`apps/` nommés par rôle, pas par outil** (`workbench`, pas `storybook`) : l'outil peut changer, le
  rôle reste.
- **Pas d'orchestrateur de monorepo (Turborepo, Nx) au départ** : `pnpm -r` et ses filtres
  (`--filter "...[origin/main]"`) suffisent pour trois paquets. Critère d'adoption : une CI au-delà de
  dix minutes malgré la parallélisation.

## 6. Politique navigateurs

La politique s'appuie sur [Baseline](https://web.dev/baseline) : une fonctionnalité est _newly
available_ quand elle est supportée par tous les navigateurs principaux, et _widely available_ trente
mois plus tard.

| Niveau                   | Règle                                                                                                                     | Exemple                                              |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------- |
| **A. Requis**            | Fonctionnalités _widely available_ à la date de sortie de la version majeure. Utilisées sans repli.                       | Cascade layers, `:has()`, nesting, container queries |
| **B. Avec repli**        | Fonctionnalités _newly available_. Autorisées si l'expérience sans elles reste fonctionnelle et accessible ; repli testé. | `popover`, invoker commands, `<details name>`        |
| **C. Amélioration pure** | Fonctionnalités non Baseline. Uniquement derrière `@supports` ou une détection, jamais requises.                          | Anchor positioning, `closedby`, `popover="hint"`     |

Chaque version majeure déclare sa cible. Relever le plancher est un changement majeur ; l'abaisser est
toujours possible.

### Registre des fonctionnalités de plateforme

Source : jeu de données `web-features` 3.44.0, interrogé le 2026-10-30. « Widely » indique la date de
passage à _widely available_, réelle ou projetée.

| Fonctionnalité                             | Statut Baseline                           | Usage dans le design system                | Niveau | Repli                                                          |
| ------------------------------------------ | ----------------------------------------- | ------------------------------------------ | ------ | -------------------------------------------------------------- |
| Cascade layers                             | Widely depuis 2024-09                     | Toute la CSS                               | A      | —                                                              |
| CSS nesting                                | Widely depuis 2026-06                     | Sources CSS                                | A      | Aplati au build si la cible l'exige                            |
| `:has()`                                   | Widely depuis 2026-06                     | États de champ, verrouillage du scroll     | A      | —                                                              |
| Container queries (taille)                 | Widely depuis 2025-08                     | Composants adaptatifs                      | A      | —                                                              |
| `color-mix()`, `oklch()`                   | Widely depuis 2025-11                     | États dérivés, tokens                      | A      | —                                                              |
| `:user-valid`, `:user-invalid`             | Widely depuis 2026-05                     | Validation de formulaire                   | A      | —                                                              |
| `<dialog>`, `inert`                        | Widely                                    | Modales                                    | A      | —                                                              |
| Form-associated custom elements            | Widely depuis 2025-09                     | Exception (voir COMPONENT_ARCHITECTURE)    | A      | —                                                              |
| Réflexion des attributs ARIA               | Widely depuis 2026-04                     | Sémantique via `ElementInternals`          | A      | —                                                              |
| `:dir()`, propriétés logiques              | Widely                                    | Écriture de droite à gauche                | A      | —                                                              |
| `popover`                                  | Newly depuis 2025-01, widely vers 2027-07 | Menus, toasts, popovers, navigation        | B      | Polyfill chargé à la demande                                   |
| `light-dark()`                             | Newly depuis 2024-05, widely vers 2026-11 | Modes clair et sombre                      | B      | Thème clair seul (bloc `@supports` généré, optionnel)          |
| `:state()`                                 | Newly depuis 2024-05, widely vers 2026-11 | États visuels des custom elements          | B      | Dégradé : contenu accessible, style d'état absent              |
| `<details name>`                           | Newly depuis 2024-09, widely vers 2027-03 | Accordéon exclusif                         | B      | Accordéon non exclusif                                         |
| Invoker commands (`command`, `commandfor`) | Newly depuis 2025-12, widely vers 2028-06 | Ouverture déclarative de dialog et popover | B      | Polyfill chargé à la demande                                   |
| `@starting-style`, `transition-behavior`   | Newly depuis 2024-08                      | Animations d'entrée et de sortie           | C      | Pas d'animation                                                |
| `@property`                                | Newly depuis 2024-07                      | Animations de valeurs (optionnel)          | C      | Valeur finale sans transition                                  |
| `contrast-color()`                         | Newly depuis 2026-04                      | Thèmes runtime (option future)             | C      | Couleur calculée par le compilateur de thème                   |
| `ariaNotify()`                             | Newly depuis 2026-09                      | Annonces des toasts                        | C      | Live region                                                    |
| `@scope`                                   | Newly depuis 2026-03                      | Non utilisé : préfixes et layers suffisent | —      | —                                                              |
| Anchor positioning                         | Non Baseline (Interop 2026)               | Popovers, tooltips, menus                  | C      | Positionnement de repli, module JavaScript chargé à la demande |
| `<dialog closedby>`                        | Non Baseline (Interop 2026)               | Fermeture par clic extérieur               | C      | Petit gestionnaire de clic, chargé à la demande                |
| `popover="hint"`                           | Non Baseline (Interop 2026)               | Tooltips                                   | C      | `popover="manual"`                                             |
| Interest invokers (`interestfor`)          | Chrome seulement                          | Tooltips (futur)                           | C      | Élément `<mcs-tooltip>`                                        |
| Customizable select (`base-select`)        | Chrome et Safari 27                       | Select entièrement stylable                | C      | `<select>` natif stylé                                         |
| Scoped custom element registries           | Chrome 146 et Safari 26 (Interop 2026)    | Coexistence de versions                    | C      | Garde de définition, une version par page                      |
| `@function`, `if()`, mixins CSS            | Chrome seulement, ou non implémentés      | Non utilisés                               | —      | —                                                              |

Ce que l'outillage fait respecter :

- la cible `browserslist` (`baseline widely available`) pilote les transformations de Lightning CSS ;
- `stylelint-plugin-use-baseline` refuse toute fonctionnalité CSS non Baseline hors `@supports`, à
  l'exception de la liste blanche du niveau B, qui reproduit ce registre ;
- chaque polyfill a une condition de retrait (« widely available »). Le registre est revu chaque
  trimestre (voir [GOVERNANCE.md](GOVERNANCE.md), dette de plateforme).

## 7. Outillage

Résumé des choix. L'inventaire complet, avec ce que chaque outil apporte et ce qu'il ne duplique pas,
est dans [CODING_STANDARDS.md](../engineering/CODING_STANDARDS.md).

| Besoin                   | Outil retenu                                                | Raison principale                                                                                          |
| ------------------------ | ----------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| Gestion des paquets      | pnpm 12 (workspaces)                                        | Isolation stricte des dépendances ; `minimumReleaseAge` et `allowBuilds` contre les attaques supply chain  |
| Langage                  | TypeScript 6.0                                              | TypeScript 7 (natif) est sorti en juillet 2026, mais typescript-eslint ne le supporte pas encore (`< 6.1`) |
| Build JavaScript         | `tsc` (ESM non bundlé, un fichier par module)               | Aucune dépendance à un bundler pour les consommateurs ; tree shaking naturel                               |
| Build CSS                | Lightning CSS                                               | Transformations pilotées par la cible Baseline, bundling des `@import`, minification                       |
| Tokens                   | Terrazzo et un plugin de sortie maison                      | Supporte le module Resolver de DTCG 2025.10, ce que Style Dictionary ne fait pas encore (octobre 2026)     |
| Lint et format           | ESLint 10, typescript-eslint, Stylelint 17, Prettier        | Règles typées, règles CSS d'architecture, formatage sans débat                                             |
| Tests                    | Vitest 5 (Node et navigateur réel), Playwright, axe-core    | Tests de composants dans de vrais moteurs (Chromium, Firefox, WebKit), VRT, E2E                            |
| Architecture as code     | dependency-cruiser, Knip                                    | Frontières de couches, cycles, code mort                                                                   |
| Versions et releases     | Changesets 3, GitHub Actions, trusted publishing npm (OIDC) | Intentions de version relues en PR, publication sans secret stocké                                         |
| Mises à jour             | Renovate                                                    | Support pnpm 11 et 12 plus complet que Dependabot ; alignement sur `minimumReleaseAge`                     |
| Atelier et documentation | Storybook 10 en phase 2, site public en phase 3             | Atelier immédiat ; le site public arrive quand des consommateurs externes existent                         |

## 8. Registre des décisions

Toutes les décisions ont été **acceptées** le 2026-10-30. Toute évolution passe désormais par un ADR (voir [GOVERNANCE.md](GOVERNANCE.md)).

| ID   | Décision                                                                                                                                                    | Alternatives écartées                                                     | Détail                                                                              |
| ---- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| D-01 | Natif d'abord : aucun custom element pour un élément que la plateforme fournit                                                                              | `<mcs-button>` et équivalents ; customized built-ins (refusés par WebKit) | [COMPONENT_ARCHITECTURE.md](COMPONENT_ARCHITECTURE.md)                              |
| D-02 | Le CSS est l'implémentation principale : zéro runtime, `@layer mcs.*`                                                                                       | CSS-in-JS runtime, CSS atomique compilé, utilitaires imposés              | [CSS_ARCHITECTURE.md](CSS_ARCHITECTURE.md)                                          |
| D-03 | Comportements en custom elements light DOM, sans bibliothèque, sémantique via `ElementInternals`                                                            | Lit et Shadow DOM, Stencil, FAST, machines à états par framework          | [COMPONENT_ARCHITECTURE.md](COMPONENT_ARCHITECTURE.md)                              |
| D-04 | Pas de Shadow DOM par défaut ; exceptions encadrées                                                                                                         | Shadow DOM systématique                                                   | [COMPONENT_ARCHITECTURE.md](COMPONENT_ARCHITECTURE.md)                              |
| D-05 | Contrat par composant (données et types), source unique de l'API                                                                                            | Types écrits à la main par cible ; génération obligatoire                 | [COMPONENT_ARCHITECTURE.md](COMPONENT_ARCHITECTURE.md)                              |
| D-06 | Tokens DTCG 2025.10 : référence (interne), système (public), hooks de composant non valorisés par défaut                                                    | Trois niveaux publiés (modèle Material 3)                                 | [TOKENS.md](TOKENS.md)                                                              |
| D-07 | Theming 100 % CSS : `color-scheme`, `light-dark()`, attributs `data-mcs-*`, aucun provider                                                                  | Provider JavaScript, objets de thème, rebuild par thème                   | [THEMING.md](THEMING.md)                                                            |
| D-08 | Adapters : gabarits et bindings uniquement ; React d'abord, les autres à la demande                                                                         | Réimplémentation par framework ; adapters pour tous dès le départ         | [FRAMEWORKS.md](FRAMEWORKS.md)                                                      |
| D-09 | Trois paquets publiés (`tokens`, `web`, `react`), versions fixes communes                                                                                   | Cinq paquets (`tokens`, `css`, `contracts`, `elements`, `react`)          | Section 9                                                                           |
| D-10 | Politique navigateurs Baseline à trois niveaux ; polyfills à la demande et datés                                                                            | « Deux dernières versions » ; polyfills globaux                           | Section 6                                                                           |
| D-11 | Pas de SCSS ni de préprocesseur                                                                                                                             | Sass                                                                      | [CSS_ARCHITECTURE.md](CSS_ARCHITECTURE.md)                                          |
| D-12 | Chaîne d'outillage de la section 7                                                                                                                          | Biome, Oxlint, Jest, Turborepo, semantic-release, Dependabot              | [CODING_STANDARDS.md](../engineering/CODING_STANDARDS.md)                           |
| D-13 | Préfixe `mcs` (classes, balises, événements, custom properties, layers) ; scope npm `@mcs-ds`, `@mcs` étant déjà pris sur npm                               | —                                                                         | Section 11                                                                          |
| D-14 | Accessibilité : WCAG 2.2 AA comme plancher non arbitrable                                                                                                   | WCAG 2.1 AA                                                               | [ACCESSIBILITY.md](ACCESSIBILITY.md)                                                |
| D-15 | Trunk-based development, branches de maintenance à la demande, squash merge                                                                                 | GitFlow, branche `develop`                                                | [GIT_WORKFLOW.md](../engineering/GIT_WORKFLOW.md)                                   |
| D-16 | Fixtures neutres comme source des exemples ; Storybook comme atelier remplaçable                                                                            | Stories comme source de vérité ; documentation dans Storybook seul        | [DEVELOPER_EXPERIENCE.md](DEVELOPER_EXPERIENCE.md)                                  |
| D-17 | Adapter React pour React 19 et plus                                                                                                                         | Support de React 18                                                       | [FRAMEWORKS.md](FRAMEWORKS.md)                                                      |
| D-18 | Phase pilote (squelette marchant) avant tout passage à l'échelle, avec critères d'abandon                                                                   | Construire le catalogue directement                                       | Section 10                                                                          |
| D-19 | Couche agents : digests de règles par domaine, agents à périmètre exclusif, contrats comme point de synchronisation, génération déterministe du boilerplate | Un seul agent généraliste qui relit toute la documentation                | [CLAUDE.md](../../CLAUDE.md), [DEVELOPER_EXPERIENCE.md](DEVELOPER_EXPERIENCE.md) §7 |

## 9. Contre-expertise

Après avoir écrit une première version (v0), je l'ai attaquée comme le ferait un autre architecte chargé
de la refuser. Chaque attaque est suivie d'un verdict et, le cas échéant, de l'amendement intégré dans
la v1 présentée ci-dessus.

### 9.1 Choix discutables

- **« Refuser `<mcs-button>` contredit l'exemple de départ et rend l'API hétérogène : classes ici,
  balises là. »** Verdict : l'hétérogénéité est réelle mais gouvernée par une règle unique, « une balise
  `mcs-*` signifie un comportement fourni par JavaScript ». Le principe directeur du projet tranche : on
  ne recrée pas en JavaScript ce que le navigateur fait déjà. Amendement : les adapters rendent la
  différence invisible (`<Button>` et `<Tabs>` ont la même ergonomie), et des **sélecteurs gardiens**
  font paraître cassé un usage sur un mauvais élément, par exemple `.mcs-button` sur un `<div>` (voir
  [CSS_ARCHITECTURE.md](CSS_ARCHITECTURE.md)).
- **« Le light DOM n'offre aucune encapsulation : une CSS globale de l'application cassera les
  composants. »** Verdict : risque réel, accepté. L'encapsulation du Shadow DOM coûte plus (SSR, ARIA,
  formulaires, personnalisation) qu'elle ne rapporte pour un design system interne. Amendements : le
  CSS de composant déclare explicitement les propriétés dont il dépend, le reset est optionnel, une
  fixture « CSS hostile » (preflight Tailwind, normalize, styles globaux) fait partie des tests visuels,
  et un conteneur d'isolation optionnel est prévu pour les intégrations dans des pages tierces.
- **« Un paquet de contrats de plus, c'est une abstraction de plus. »** Verdict : fondé pour un paquet,
  pas pour le concept. Amendement : les contrats deviennent un point d'entrée de `@mcs-ds/web` (données et
  types, aucune génération obligatoire) au lieu d'un paquet.

### 9.2 Risques

- **Fonctionnalités de plateforme en mouvement** (anchor positioning, invokers, `closedby`,
  customizable select). Amendement : registre des fonctionnalités, trois niveaux, polyfills à la
  demande avec date de retrait.
- **Collision du registre global des custom elements** (micro-frontends, deux versions dans une page).
  Amendements : garde de définition, détection de version en mode développement, politique « une
  version majeure par page », registres scopés en amélioration quand ils seront Baseline.
- **Conflits de propriété entre un framework et un custom element** qui modifient les mêmes attributs
  (cause classique d'avertissements d'hydratation). Amendement majeur : l'état vivant des comportements
  passe par `ElementInternals` (rôle, ARIA) et `:state()`. Les attributs restent des valeurs initiales
  possédées par l'auteur ; le framework et l'élément ne se disputent jamais un attribut.
- **Bus factor et outillage maison** (plugin de tokens, scripts de release). Amendement : chaque script
  est en TypeScript lisible, testé, documenté ; les formats sont standard (DTCG, Changesets) et donc
  remplaçables.

### 9.3 Coûts cachés

- **Double chemin de code** (fonctionnalité native et repli) : chaque niveau B double certains tests.
  Amendement : le repli est forcé par un attribut de test (`data-mcs-force-fallback`) et testé
  explicitement ; les replis sont retirés à la date prévue.
- **Explosion combinatoire des tests visuels** (états, thèmes, modes, forced colors, navigateurs).
  Amendement : échantillonnage décrit dans [TESTING_STRATEGY.md](../engineering/TESTING_STRATEGY.md),
  matrice complète réservée à la branche principale et aux releases.
- **Documentation en double** (exemples HTML et React). Amendement : l'exemple HTML affiché est
  produit par le rendu serveur de l'adapter React, donc identique par construction.
- **Tests manuels avec lecteurs d'écran** : coût récurrent assumé, planifié à chaque version mineure.

### 9.4 Maintenance

- **L'anatomie HTML devient une API publique** : la modifier casse les utilisateurs qui écrivent du
  HTML, et le contenu d'un CMS ne se migre pas par codemod. Amendement : l'anatomie est versionnée dans
  le contrat ; les changements sont additifs. Une ancienne anatomie reste supportée par le CSS pendant
  toute une version majeure.
- **Dérive des adapters par rapport aux éléments.** Amendement : tests de contrat partagés, exécutés sur
  le rendu HTML et sur le rendu React.

### 9.5 Performance

- **Le CSS complet charge des composants inutilisés.** Amendement : entrées par composant et budget sur
  le bundle complet.
- **Coûts cachés** de `:has()` large, de longues chaînes de `var()`, des `MutationObserver` par instance
  et d'un chargeur automatique qui observe tout le document. Amendement : liste des abstractions
  coûteuses et règles associées dans [PERFORMANCE.md](PERFORMANCE.md).

### 9.6 DX

- **Anatomie verbeuse en HTML pur pour les composants à comportement.** Accepté : c'est le prix d'un
  rendu serveur trivial et d'une accessibilité native. Atténuation : les adapters, les snippets d'IDE et
  les éléments qui complètent eux-mêmes les identifiants et attributs manquants.
- **Deux conventions d'événements** (`mcs-change` en DOM, `onValueChange` en React). Accepté : chacune est
  idiomatique dans son monde. La correspondance est générée depuis le contrat.
- **Les erreurs d'usage du CSS seul sont silencieuses.** Amendement : feuille de débogage, règles
  html-validate générées depuis les contrats, avertissements en mode développement pour les éléments.

### 9.7 SSR

- **Contenu « mort » avant l'upgrade des éléments.** Accepté et encadré : les composants de type A
  fonctionnent avant tout JavaScript. Pour les autres, des styles `:not(:defined)` garantissent un rendu
  initial lisible et sans décalage de mise en page.
- **Avertissements d'hydratation.** Traités par l'amendement `ElementInternals` (9.2).

### 9.8 Accessibilité

- **La sémantique via `ElementInternals` n'est pas restituée de la même façon par toutes les
  technologies d'assistance.** Hypothèse H2 du pilote ; repli défini (attributs ARIA sur les parties).
- **Les tooltips sont intrinsèquement problématiques** (survol, tactile). Amendement : usage restreint
  au nom accessible des boutons-icônes, contenu non interactif.
- **`<details>` ne restitue pas toujours un titre dans `<summary>`.** Documenté dans
  [ACCESSIBILITY.md](ACCESSIBILITY.md), avec une variante à titres explicites prévue si un produit en a
  besoin.

### 9.9 Web Components

- **React 18 ne transmet ni propriétés ni événements aux custom elements.** Amendement : l'adapter cible
  React 19 et plus (D-17) ; en React 18, les composants de type A restent utilisables.
- **Ordre d'upgrade et streaming** : `connectedCallback` peut s'exécuter avant que les enfants ne soient
  analysés. Amendement : règle d'initialisation tolérante (observation des enfants), testée avec un
  rendu en streaming.
- **Le nom d'une balise est une API permanente.** Amendement : revue de nommage obligatoire (vocabulaire
  contrôlé dans [COMPONENT_ARCHITECTURE.md](COMPONENT_ARCHITECTURE.md)).

### 9.10 Complexité excessive

La v0 contenait des éléments qu'aucun besoin démontré ne justifiait. Ils sont retirés ou différés :

| v0                                                               | v1                                                                                                             |
| ---------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| Cinq paquets (`tokens`, `css`, `contracts`, `elements`, `react`) | Trois paquets ; les contrats sont un point d'entrée de `@mcs-ds/web`                                           |
| Adapters React, Vue et Svelte                                    | React seul ; les autres sur demande d'un consommateur réel                                                     |
| Trois niveaux de tokens publiés                                  | Deux niveaux publiés et des hooks de composant non valorisés par défaut                                        |
| Compilateur de thèmes exécuté au runtime                         | Thèmes compilés au build ; compilation à la demande seulement si la marque blanche multi-tenant est confirmée  |
| Storybook et site public dès le départ                           | Storybook seul en phase 2                                                                                      |
| Shadow DOM par composant                                         | Aucun par défaut ; conteneur d'isolation optionnel                                                             |
| Polyfills globaux                                                | Polyfills chargés à la demande, datés                                                                          |
| Génération de code (wrappers, types) dès le départ               | Types dérivés des contrats par inférence TypeScript ; génération seulement si la duplication devient mesurable |
| Mode densité                                                     | Différé jusqu'à un besoin produit                                                                              |

### 9.11 Risques résiduels acceptés

- Pas d'encapsulation stricte des styles en light DOM.
- Verbosité HTML des composants à comportement.
- Dépendance à des fonctionnalités de niveau B jusqu'à leur passage en _widely available_.
- Coût récurrent des tests manuels d'accessibilité.

## 10. Feuille de route et plan de validation

| Phase                          | Contenu                                                                                                                                                       | Condition de sortie                                              |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------- |
| **1. Architecture** (terminée) | Documents d'architecture, gouvernance d'ingénierie opérationnelle (hooks, lint, CI, release)                                                                  | Validation explicite de cette architecture                       |
| **2. Pilote** (en cours)       | Squelette marchant : pipeline de tokens minimal, CSS de fondation, cinq composants pilotes, adapter React, workbench, applications témoins, CI complète       | Hypothèses H1 à H8 validées ou plan B déclenché ; ADR mis à jour |
| **3. Fondations et cœur**      | Tokens et thèmes complets (clair, sombre, contraste élevé, une marque), environ quinze composants, site de documentation, versions 0.x avec un produit pilote | Adoption par le produit pilote sans contournement majeur         |
| **4. Version 1.0**             | Gel de l'API du cœur, gouvernance en vigueur, politique de maintenance (LTS)                                                                                  | Critères de stabilité de [GOVERNANCE.md](GOVERNANCE.md)          |
| **Ensuite**                    | Adapters supplémentaires, marque blanche multi-tenant, data grid, date picker, icônes, primitives de comportement publiques                                   | Besoin démontré par au moins deux consommateurs                  |

### Composants pilotes

Ils sont choisis pour les risques qu'ils exercent, pas pour leur popularité :

| Composant      | Type                        | Risques exercés                                                                                    |
| -------------- | --------------------------- | -------------------------------------------------------------------------------------------------- |
| Button         | A (natif stylé)             | Sélecteurs gardiens, layers face à une CSS hostile, variantes, rendu serveur                       |
| Champ de texte | A et B (natif enrichi)      | Formulaires, validation, messages d'erreur, autofill                                               |
| Dialog         | A (natif) et polyfill       | Modale native, invokers, `closedby`, binding `open` côté React, verrouillage du scroll, animations |
| Tabs           | C (élément de comportement) | `ElementInternals`, `:state()`, roving tabindex, mode contrôlé React, SSR, hydratation, streaming  |
| Menu           | C, sur `popover`            | Top layer, anchor positioning et repli, typeahead, light dismiss                                   |

### Hypothèses à valider

| ID  | Hypothèse                                                                                                                | Mesure                                                | Si elle échoue                                                                                                          |
| --- | ------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| H1  | Les éléments light DOM s'intègrent à React 19 et Next.js (SSR, hydratation, mode contrôlé) sans avertissement ni conflit | E2E sur l'application témoin Next.js, console vide    | Plan B : l'adapter pilote directement les contrôleurs internes via une ref ; le comportement reste écrit une seule fois |
| H2  | La sémantique via `ElementInternals` est correctement restituée par NVDA, JAWS, VoiceOver (macOS, iOS) et TalkBack       | Matrice de tests manuels                              | Attributs ARIA posés sur les parties, avec une table de propriété des attributs                                         |
| H3  | Les composants de type A résistent à une CSS hôte hostile grâce aux layers                                               | Fixture « CSS hostile » et tests visuels              | Conteneur d'isolation, ou `@scope` quand il sera Baseline widely                                                        |
| H4  | Les thèmes `light-dark()` s'imbriquent correctement et toutes les paires de couleurs passent les contrastes              | Tests de contraste, tests visuels de thèmes imbriqués | Blocs par mode générés à la place de `light-dark()`                                                                     |
| H5  | Les budgets de performance tiennent, sans décalage de mise en page à l'upgrade                                           | size-limit, mesure de CLS dans l'E2E                  | Revue des abstractions coûteuses, découpage plus fin                                                                    |
| H6  | Le repli de l'anchor positioning offre une expérience acceptable                                                         | Tests en mode repli forcé, revue design               | Repli JavaScript (Floating UI) chargé à la demande                                                                      |
| H7  | Un développeur trouve props, variantes et tokens depuis son IDE sans ouvrir la documentation                             | Test d'utilisabilité avec trois développeurs          | Renforcer la génération de métadonnées d'IDE                                                                            |
| H8  | La chaîne de publication (Changesets, OIDC, notes de release, tags) fonctionne de bout en bout                           | Pré-version publiée sur un paquet sentinelle          | Correction de la chaîne avant tout paquet réel                                                                          |

## 11. Questions ouvertes

Chaque question a une réponse par défaut, appliquée si rien n'est décidé.

| ID  | Question                                                         | Réponse par défaut                                                                     |
| --- | ---------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| Q1  | Nom et préfixe définitifs ?                                      | **Tranché** : préfixe `mcs`, scope npm `@mcs-ds` (D-13)                                |
| Q2  | Quelles stacks consomment le système en priorité ?               | HTML et React/Next.js ; les autres adapters attendent un consommateur réel             |
| Q3  | Quelle matrice navigateurs réelle (analytics des sites cibles) ? | Baseline widely available à la sortie de chaque majeure                                |
| Q4  | Où vit la source de vérité du design (Figma, équipe design) ?    | Les tokens du dépôt font foi ; Figma est synchronisé depuis le dépôt                   |
| Q5  | La marque blanche multi-tenant au runtime est-elle un besoin ?   | Non : thèmes compilés au build                                                         |
| Q6  | Open source ou privé ?                                           | Prêt pour l'open source (licence à choisir) ; publication npm publique avec provenance |
| Q7  | Taille de l'équipe et modèle de gouvernance ?                    | Équipe cœur restreinte et contributions fédérées                                       |
| Q8  | Un mode densité (compact) est-il nécessaire ?                    | Non jusqu'à une demande produit                                                        |
| Q9  | Quel jeu d'icônes ?                                              | À décider avec le design ; paquet `@mcs-ds/icons` séparé, SVG uniquement               |
| Q10 | Langue des artefacts publiés (changelog, notes de release) ?     | Anglais, comme les messages de commit ; documentation en français                      |
