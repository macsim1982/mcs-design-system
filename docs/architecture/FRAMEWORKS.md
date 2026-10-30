# Stratégie framework

> Statut : validée le 2026-10-30 (v1). Dernière mise à jour : 2026-10-30.

## 1. La question

Jusqu'où le système peut-il être indépendant des frameworks, sans maintenir deux implémentations
métier et sans dégrader le rendu serveur, l'accessibilité ou l'expérience de développement dans React ?

## 2. Options comparées

- **A. Web Components au cœur** : chaque composant est un custom element en Shadow DOM (Lit ou
  équivalent), utilisé directement par tous les frameworks. Exemples : Material Web, Web Awesome.
- **B. Core TypeScript et composants par framework** : machines à états indépendantes, puis une
  implémentation de rendu par framework. Exemples : Zag.js et Ark UI, React Aria.
- **C. Web Components et adapters générés** : option A, plus des wrappers générés par framework.
  Exemples : Carbon, Spectrum Web Components, Ionic (Stencil).
- **D. Contrat HTML/CSS, comportements en light DOM et adapters minces** : le cœur est un contrat de
  balisage et de styles ; les comportements manquants sont des custom elements sans Shadow DOM ; les
  adapters rendent l'anatomie. Précédents partiels : GOV.UK Frontend, SLDS (blueprints), éléments de
  GitHub.
- **E. Compilation multi-framework** : une source compilée vers chaque framework (type Mitosis).

| Critère                   | A. WC au cœur                                                                                                               | B. Core TS par framework                   | C. WC et adapters                | **D. Contrat HTML/CSS et comportements light DOM**                            | E. Compilation                                    |
| ------------------------- | --------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------ | -------------------------------- | ----------------------------------------------------------------------------- | ------------------------------------------------- |
| Implémentations           | Une                                                                                                                         | Une logique, N rendus                      | Une, plus N wrappers générés     | **Une** (CSS et élément), plus N gabarits minces                              | Une source, N sorties générées                    |
| Rendu serveur             | Nécessite Declarative Shadow DOM et une intégration par méta-framework (`@lit-labs/nextjs` encore expérimental)             | Excellent dans chaque framework            | Comme A                          | **Trivial** : c'est du HTML                                                   | Dépend du générateur                              |
| Hydratation               | Upgrade ; contenu non stylé ou absent sans DSD                                                                              | Hydratation complète du framework          | Comme A, plus celle du wrapper   | **Type A : aucune.** Type C : upgrade de l'élément, sans hydratation propre   | Celle du framework cible                          |
| Accessibilité             | Références ARIA impossibles à travers les shadow roots (`referenceTarget` : Chrome seulement) ; labels et autofill fragiles | Excellente si bien faite (React Aria)      | Comme A                          | **Native** : un seul arbre, éléments natifs                                   | Plus petit dénominateur commun                    |
| Formulaires               | Réimplémentés via `ElementInternals`                                                                                        | Natifs dans chaque framework               | Comme A                          | **Natifs**                                                                    | Variable                                          |
| Taille du bundle          | Bibliothèque (Lit) et composants                                                                                            | Machines à états et rendus, par framework  | Comme A, plus les wrappers       | **Zéro JavaScript pour le type A** ; quelques Ko par élément de type C        | Variable                                          |
| Performance               | Un shadow root par instance (style recalc, mémoire)                                                                         | Bonne                                      | Comme A                          | **Meilleure** : pas de shadow roots, pas d'hydratation pour le type A         | Variable                                          |
| Personnalisation          | Limitée à `::part` et aux custom properties                                                                                 | Totale                                     | Comme A                          | **Totale par la cascade** (layers), avec les hooks comme API stable           | Variable                                          |
| DX dans React             | Correcte en React 19, typage à fournir                                                                                      | Idiomatique                                | Bonne                            | **Idiomatique** grâce aux gabarits                                            | Idiomatique mais code généré difficile à déboguer |
| Utilisable sans framework | Oui                                                                                                                         | Non, ou par une liaison vanilla            | Oui                              | **Oui, y compris sans JavaScript**                                            | Si une cible vanilla existe                       |
| Maintenance               | Moyenne ; dépendance à Lit                                                                                                  | Élevée : N rendus à maintenir et à aligner | Moyenne ; parité des wrappers    | **Faible** : un CSS, un élément, des gabarits fins                            | Élevée ; générateur de niche, risque d'abandon    |
| Compatibilité future      | Bonne (standards), mais le Shadow DOM reste le point dur                                                                    | Liée aux frameworks                        | Bonne                            | **Très bonne** : HTML et CSS ; les éléments se retirent quand le natif arrive | Faible                                            |
| Risque principal          | SSR et ARIA                                                                                                                 | Coût de maintenance                        | SSR, ARIA et dérive des wrappers | Encapsulation faible ; anatomie HTML exposée                                  | Abandon de l'outil                                |

**Recommandation : D.** Elle maximise les trois premières priorités (plateforme, simplicité,
performance), garde une seule implémentation et donne la meilleure base d'accessibilité. Ses risques
(encapsulation, anatomie exposée, intégration aux frameworks) sont traités par les hypothèses H1 à H3 du
pilote, avec un plan B pour chacune (voir [ARCHITECTURE.md](ARCHITECTURE.md), section 10).

## 3. Ce qui est indépendant du framework, et ce qui ne l'est pas

| Indépendant du framework (écrit une fois)          | Spécifique au framework (adapter)                                            |
| -------------------------------------------------- | ---------------------------------------------------------------------------- |
| Tokens et thèmes                                   | Gabarits d'anatomie (JSX, templates Vue…)                                    |
| CSS de tous les composants                         | Identifiants stables entre serveur et client (`useId`)                       |
| Contrats (API, anatomie, états, événements)        | Réaffirmation de la valeur en mode contrôlé                                  |
| Comportements (custom elements et contrôleurs)     | Correspondance événements DOM vers props (`mcs-change` vers `onValueChange`) |
| Fixtures, tests de contrat, documentation de l'API | Types idiomatiques (props, refs, `asChild`)                                  |

## 4. Le contrat d'adapter

Un adapter **peut** :

- rendre l'anatomie déclarée par le contrat, avec ses attributs ARIA statiques et ses identifiants ;
- importer la définition des éléments dont il a besoin (effet de bord, un module par élément) ;
- traduire les props en attributs ou propriétés, et les événements DOM en callbacks ;
- réaffirmer une valeur contrôlée ;
- appeler une méthode impérative native en réponse à une prop (`showModal()` quand `open` passe à
  `true`).

Un adapter **ne peut pas** :

- gérer le clavier, le focus, le positionnement ou une machine à états ;
- calculer un style ou injecter du CSS ;
- importer un helper interne de `@mcs-ds/web` ;
- dépendre d'un autre adapter.

Signal d'alerte en revue : un `useEffect` qui fait autre chose que synchroniser une propriété ou appeler
une méthode native.

## 5. React

### 5.1 Version supportée

**React 19 et plus** (décision D-17). React 19 (décembre 2024) passe les tests de Custom Elements
Everywhere : propriétés posées si l'élément les expose, événements personnalisés supportés. React 18 ne
le fait pas. Avec React 18, les composants de type A restent utilisables directement en JSX ; les
composants de type C nécessiteraient des refs manuelles.

Détails vérifiés dans le code de React (`setValueForPropertyOnCustomComponent`) :

- une prop d'événement sur un custom element écoute `prop.slice(2)`, sans conversion de casse. Pour
  `mcs-change`, la prop brute est `onds-change`. Les adapters exposent `onValueChange` ;
- une prop non événementielle est posée comme propriété si `name in element`, sinon comme attribut. Si
  l'élément n'est pas encore défini, un objet serait sérialisé en attribut : l'adapter importe donc la
  définition de l'élément **avant** le rendu.

### 5.2 Composants serveur et client

| Type | Composant React                                                        | JavaScript envoyé au client                        |
| ---- | ---------------------------------------------------------------------- | -------------------------------------------------- |
| A    | **Composant serveur compatible** (pas de hooks, pas de `'use client'`) | Aucun                                              |
| B, C | Composant client (`'use client'`) fin                                  | L'adapter (moins d'1 Ko) et le module de l'élément |

`'use client'` est une directive ignorée hors React Server Components : l'adapter ne dépend pas de
Next.js.

### 5.3 Exemples

```tsx
// Type A : rendu serveur, aucun JavaScript client.
export function Button({ variant, tone, size, asChild, ...rest }: ButtonProps) {
  // rend <button class="mcs-button" data-variant=… data-tone=… data-size=…>
}

// Type C, non contrôlé
<Tabs defaultValue="billing">…</Tabs>;

// Type C, contrôlé
const [tab, setTab] = useState('billing');
<Tabs value={tab} onValueChange={setTab}>
  …
</Tabs>;
```

### 5.4 Propriété des attributs

C'est la règle qui évite les conflits entre React et les éléments (et les avertissements d'hydratation).

| Information                               | Propriétaire                                        | Exemple                               |
| ----------------------------------------- | --------------------------------------------------- | ------------------------------------- |
| Configuration initiale                    | Auteur ou adapter (attribut)                        | `value="billing"`, `orientation`      |
| Relations statiques                       | Auteur ou adapter (attribut)                        | `aria-label`, `aria-labelledby`, `id` |
| État vivant (sélection, ouverture, focus) | Élément (`ElementInternals`, `:state()`, propriété) | onglet sélectionné                    |
| `tabindex` des parties à focus itinérant  | Élément                                             | roving tabindex                       |

Un attribut a un seul propriétaire. L'adapter ne rend jamais un attribut que l'élément modifie, et
l'élément ne réécrit jamais un attribut rendu par l'adapter.

### 5.5 Identifiants

L'adapter génère les identifiants avec `useId()`, stables entre le serveur et le client. Le HTML rendu
côté serveur est donc complet et accessible avant tout JavaScript. En HTML écrit à la main, l'élément
complète les identifiants manquants lors de l'upgrade.

### 5.6 Typage des éléments bruts

Pour qui utilise directement `<mcs-tabs>` en JSX, les déclarations `JSX.IntrinsicElements` sont dérivées
des contrats et publiées par `@mcs-ds/react`.

## 6. SSR, SSG, hydratation, streaming, islands

| Mode                           | Type A                      | Types B et C                                                                                                                       |
| ------------------------------ | --------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| SSR et SSG                     | HTML final                  | HTML de l'anatomie ; l'élément s'active au chargement de son module                                                                |
| Avant JavaScript               | Pleinement fonctionnel      | Rendu lisible et stable (`:not(:defined)`) ; interactions disponibles après l'upgrade                                              |
| Hydratation React              | Aucune (composants serveur) | Celle de l'adapter client ; l'élément ne modifie aucun attribut possédé par React (section 5.4)                                    |
| Hydratation partielle, islands | Rien à faire                | Naturel : chaque élément est son propre îlot, activé quand son module est chargé (au chargement, à la visibilité, à l'interaction) |
| Streaming                      | Rien à faire                | Initialisation tolérante à l'arrivée tardive des enfants (règle 5 des éléments)                                                    |
| Declarative Shadow DOM         | Non utilisé                 | Non utilisé ; exigé pour toute exception Shadow DOM future                                                                         |

## 7. Autres frameworks

| Framework        | Usage direct des éléments                                                                | Adapter                             |
| ---------------- | ---------------------------------------------------------------------------------------- | ----------------------------------- |
| Vue 3            | Supporté (`compilerOptions.isCustomElement`), propriétés DOM et événements `@mcs-change` | À la demande d'un consommateur réel |
| Svelte 5         | Supporté nativement                                                                      | À la demande                        |
| Angular          | `CUSTOM_ELEMENTS_SCHEMA`                                                                 | À la demande                        |
| Solid            | Supporté (`prop:`, `on:`)                                                                | À la demande                        |
| Astro, 11ty, CMS | HTML et modules d'éléments ; islands natifs                                              | Inutile                             |

Pour tous ces frameworks, les types sont dérivés des contrats et les composants de type A sont du simple
HTML. Créer un adapter suit le contrat de la section 4 et réutilise les tests de contrat partagés.

## 8. Tests de contrat entre adapters

Une même spécification de comportement (clavier, états, événements, accessibilité) est exécutée sur :

1. la fixture HTML (élément seul) ;
2. le rendu de l'adapter React (et des adapters futurs).

Un adapter qui dérive du contrat échoue à ces tests. Voir
[TESTING_STRATEGY.md](../engineering/TESTING_STRATEGY.md).

## 9. Risques et réponses

| Risque                                                      | Réponse                                                                                           |
| ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| Conflit d'attributs entre React et un élément               | Règle de propriété (section 5.4), `ElementInternals`, tests E2E Next.js avec console vide         |
| Interaction avant l'hydratation                             | L'élément fonctionne dès son upgrade, indépendamment de React ; l'adapter se synchronise ensuite  |
| Deux copies de `@mcs-ds/web` dans une application           | `@mcs-ds/web` en peerDependency ; garde de définition ; avertissement de version en développement |
| Évolution de React (compilateur, nouvelles API)             | L'adapter est mince : peu de surface exposée aux changements de React                             |
| Demande d'un adapter Vue avant qu'un consommateur l'utilise | Refusée : types et usage direct suffisent (test d'admission, question 3)                          |
