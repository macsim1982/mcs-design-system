# Architecture des composants

> Statut : validée le 2026-10-30 (v1). Dernière mise à jour : 2026-10-30.
> Ce document définit comment un composant est conçu. Il ne contient aucune implémentation : les
> exemples montrent des API et des anatomies, pas du code de production.

## 1. Philosophie

1. **Partir de l'élément HTML** le plus proche et ne compléter que l'écart.
2. **Un composant = un contrat** : son anatomie, ses attributs, ses valeurs, ses états, ses événements,
   ses hooks CSS et son pattern d'accessibilité sont déclarés avant toute implémentation.
3. **Une seule implémentation** du style (CSS) et du comportement (élément), quel que soit le
   framework consommateur.
4. **Petit et composable** plutôt que configurable : des parties qu'on assemble, pas un objet de
   configuration à cinquante options.

## 2. Taxonomie

| Type                           | Définition                                                                                                                | JavaScript du design system          | Exemples                                         |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------------------- | ------------------------------------ | ------------------------------------------------ |
| **A. Natif stylé**             | Un élément natif fournit sémantique et comportement ; le design system apporte classes et attributs.                      | Aucun (hors polyfills de plateforme) | Button, Checkbox, Dialog, Accordion, Table, Card |
| **B. Natif enrichi**           | Un élément natif reste le propriétaire sémantique ; un élément léger l'enveloppe pour ajouter un comportement. Optionnel. | Petit, optionnel                     | `<mcs-field>` (messages de validation)           |
| **C. Élément de comportement** | Aucun élément natif n'existe : un custom element fournit sémantique (`ElementInternals`) et interactions.                 | Oui                                  | Tabs, Menu, Tooltip, Toaster, Combobox           |

Arbre de décision :

```text
Un élément natif fournit-il la sémantique ET le comportement attendus ?
├── Oui ──► Type A. Styler l'élément natif. Polyfill de plateforme si la fonctionnalité est de niveau B.
└── Non ──► Un élément natif fournit-il au moins la sémantique ?
            ├── Oui ──► Type B. Envelopper sans remplacer ; l'élément natif garde son rôle.
            └── Non ──► Type C. Custom element en light DOM, sémantique via ElementInternals.
```

Règle de lecture pour un développeur : **une balise `mcs-*` signifie un comportement fourni par
JavaScript**. Une classe `mcs-*` sur un élément natif signifie du style seulement.

## 3. Structure d'un composant

```text
packages/web/src/components/<nom>/
├── <nom>.contract.ts        contrat : API publique (données + types)
├── <nom>.css                styles (type A, B, C)
├── <nom>.element.ts         comportement (types B et C uniquement)
├── <nom>.fixtures.ts        exemples de référence (atelier, tests, documentation)
├── <nom>.browser.test.ts    tests de comportement et d'accessibilité en navigateur réel
├── <nom>.visual.test.ts     tests visuels (si le composant a un rendu propre)
└── README.md                notes de conception, décisions locales, limites connues
packages/react/src/<nom>.tsx adapter React (gabarit et bindings)
```

Le générateur `pnpm scaffold:component <nom> --type <A|B|C>` crée ces fichiers à partir des gabarits du
dépôt (`tools/templates/component/`).

## 4. Le contrat

Le contrat est un module TypeScript qui exporte des **données** (`as const`). Les types des adapters en
sont dérivés par inférence, les tables d'API de la documentation et les métadonnées d'IDE en sont
générées, et les tests le parcourent.

### 4.1 Contrat d'un composant de type A

```ts
export const button = defineContract({
  name: 'button',
  type: 'A',
  status: 'experimental',
  since: '0.1.0',
  summary: 'Déclenche une action ou soumet un formulaire.',
  a11y: { pattern: 'button', apg: 'https://www.w3.org/WAI/ARIA/apg/patterns/button/' },
  anatomy: {
    root: {
      class: 'mcs-button',
      elements: ['button', 'a[href]', 'input[type=button|submit|reset]'],
    },
    icon: { class: 'mcs-button__icon', optional: true },
  },
  props: {
    variant: {
      values: ['primary', 'secondary', 'tertiary'],
      default: 'secondary',
      attribute: 'data-variant',
    },
    tone: { values: ['accent', 'neutral', 'danger'], default: 'accent', attribute: 'data-tone' },
    size: { values: ['sm', 'md', 'lg'], default: 'md', attribute: 'data-size' },
  },
  states: {
    disabled: ':disabled, [aria-disabled="true"]',
    busy: '[aria-busy="true"]',
  },
  hooks: {
    '--mcs-button-radius': 'Rayon des coins',
    '--mcs-button-font-weight': 'Graisse du libellé',
  },
} as const);
```

### 4.2 Contrat d'un composant de type C

```ts
export const tabs = defineContract({
  name: 'tabs',
  type: 'C',
  status: 'experimental',
  since: '0.1.0',
  summary: 'Affiche un panneau parmi plusieurs, sélectionné par un onglet.',
  a11y: { pattern: 'tabs', apg: 'https://www.w3.org/WAI/ARIA/apg/patterns/tabs/' },
  anatomy: {
    root: { tag: 'mcs-tabs' },
    list: { tag: 'mcs-tab-list', role: 'tablist', parent: 'root', label: 'required' },
    tab: { tag: 'mcs-tab', role: 'tab', parent: 'list', multiple: true },
    panel: { tag: 'mcs-tab-panel', role: 'tabpanel', parent: 'root', multiple: true },
  },
  props: {
    value: { type: 'string', attribute: 'value', property: 'value' },
    orientation: {
      values: ['horizontal', 'vertical'],
      default: 'horizontal',
      attribute: 'orientation',
    },
    activation: { values: ['automatic', 'manual'], default: 'automatic', attribute: 'activation' },
  },
  states: { 'tab.selected': ':state(selected)', 'panel.selected': ':state(selected)' },
  events: {
    'mcs-change': {
      detail: '{ value: string; previousValue: string | null }',
      react: 'onValueChange',
    },
  },
  keyboard: {
    ArrowRight: 'Onglet suivant (horizontal), avec retour au début',
    ArrowLeft: 'Onglet précédent (horizontal), avec retour à la fin',
    Home: 'Premier onglet',
    End: 'Dernier onglet',
    'Enter, Space': 'Active l’onglet focalisé (activation manuelle)',
  },
  hooks: { '--mcs-tabs-indicator-thickness': 'Épaisseur de l’indicateur' },
} as const);
```

### 4.3 Ce que le contrat permet de vérifier

| Vérification                                                                      | Où                             |
| --------------------------------------------------------------------------------- | ------------------------------ |
| Chaque valeur d'énumération a un sélecteur dans le CSS du composant               | Test du paquet `@mcs-ds/web`   |
| Le rendu sans attribut est identique au rendu avec la valeur par défaut explicite | Test visuel                    |
| Chaque hook déclaré est lu par le CSS, et aucun hook non déclaré n'est lu         | Test du paquet                 |
| Les props de l'adapter React correspondent au contrat                             | Types dérivés et tests de type |
| Chaque touche documentée a un test clavier                                        | Test navigateur généré         |
| Les noms respectent le vocabulaire contrôlé (section 11)                          | Lint des contrats              |

## 5. Règles d'API

### 5.1 Attributs et props

| Concept                | HTML (type A)                       | HTML (type C)              | React                   |
| ---------------------- | ----------------------------------- | -------------------------- | ----------------------- |
| Variante (énumération) | `data-variant="primary"`            | `variant="primary"`        | `variant="primary"`     |
| Taille                 | `data-size="sm"`                    | `size="sm"`                | `size="sm"`             |
| Booléen                | Attribut natif (`disabled`)         | Attribut présent ou absent | `disabled`              |
| Valeur initiale        | Attribut natif (`value`, `checked`) | Attribut `value`           | `defaultValue`          |
| Valeur courante        | Propriété DOM                       | Propriété `value`          | `value` (mode contrôlé) |

Sur un élément natif, les attributs propres au design system sont des `data-*` : un attribut inventé sur
un élément natif est invalide et risque d'entrer en collision avec un futur attribut standard. Sur un
custom element, le design system possède son espace d'attributs.

### 5.2 Variantes, ton et taille

- `variant` exprime l'emphase ou la hiérarchie : `primary`, `secondary`, `tertiary` pour les actions.
  D'autres composants déclarent leurs valeurs dans le vocabulaire contrôlé.
- `tone` exprime l'intention sémantique de couleur : `neutral`, `accent`, `danger`, `warning`,
  `success`, `info`.
- `size` : `sm`, `md`, `lg`. Jamais `small`, `large` ni des nombres.
- Une variante doit être **orthogonale** aux autres : `variant="secondary" tone="danger"` donne une
  action destructive secondaire, sans variante `secondary-danger`.

### 5.3 États

Les états suivent la règle « l'état visuel dérive de l'état sémantique » (P4) : `disabled`,
`aria-disabled`, `aria-busy`, `aria-invalid`, `aria-current`, `aria-expanded`, `:checked`, `:open`,
`:state(selected)`. Un état n'est jamais une classe.

`disabled` contre `aria-disabled` : `disabled` retire l'élément de l'ordre de tabulation et de la
soumission ; `aria-disabled="true"` le garde focalisable (utile pour expliquer pourquoi une action est
indisponible). Le CSS traite les deux de la même façon.

### 5.4 Événements

| Règle                                                                                    | Exemple                                   |
| ---------------------------------------------------------------------------------------- | ----------------------------------------- |
| On utilise d'abord les événements natifs (`click`, `input`, `change`, `toggle`, `close`) | Dialog : `close` natif                    |
| Un événement propre au design system est préfixé `mcs-`, en minuscules et kebab-case     | `mcs-change`, `mcs-action`, `mcs-dismiss` |
| Le verbe reprend la sémantique native la plus proche                                     | `mcs-change` après un changement validé   |
| `bubbles: true`, `composed: false`                                                       | Écoutable par délégation                  |
| `cancelable: true` seulement si documenté, pour une intention                            | Comme `beforetoggle` ou `cancel`          |
| `detail` minimal ; l'état se lit sur la cible                                            | `event.target.value`                      |
| Pas d'événement pour un changement fait par programme                                    | Comme les éléments natifs                 |
| L'adapter React expose `on<Concept>` en camelCase                                        | `mcs-change` devient `onValueChange`      |

Vocabulaire actuel : `mcs-change` (`onValueChange`), `mcs-input` (`onValueInput`), `mcs-action`
(`onAction`), `mcs-dismiss` (`onDismiss`). Les ouvertures et fermetures utilisent les événements natifs
`beforetoggle` et `toggle` (`onOpenChange`).

### 5.5 Composition

- En HTML : par imbrication. L'anatomie dit quels enfants sont attendus.
- Pas de slots : ils n'existent qu'avec le Shadow DOM, que nous n'utilisons pas.
- En React : `children` et des composants composés **exportés à plat** (`Tabs`, `TabList`, `Tab`,
  `TabPanel`). Pas de notation pointée (`Tabs.List`) : elle empêche le tree shaking et ne traverse pas
  la frontière entre composants serveur et client de React.
- Polymorphisme des composants de type A : la racine est remplaçable dans l'adapter (`asChild`) à
  condition de garder un élément valide pour l'anatomie. Pas de prop `as` (typage coûteux, sémantique
  non contrôlée).

## 6. Règles des éléments de comportement (types B et C)

1. **Light DOM.** Pas de Shadow DOM, sauf exception validée par ADR (contenu entièrement possédé par
   l'élément, aucune référence ARIA vers l'extérieur, rendu serveur non requis).
2. **Ne jamais restructurer les enfants fournis par l'auteur.** Un élément ne déplace, n'enveloppe et ne
   supprime pas les nœuds qu'un framework possède. Il pose des propriétés, écoute des événements et gère
   le focus. S'il doit rendre du DOM (liste de toasts), il le fait dans un sous-arbre qu'il possède
   entièrement et qu'aucun framework ne rend.
3. **Sémantique et état vivant par `ElementInternals`** : `internals.role`, `internals.ariaSelected`,
   `internals.states.add('selected')`. Un seul helper met à jour l'état sémantique et l'état visuel
   (`:state()`), qui ne peuvent donc pas diverger. Les attributs ARIA posés par l'auteur restent
   prioritaires.
4. **Attributs = configuration initiale (possédés par l'auteur) ; propriétés = état vivant** : c'est la
   sémantique de `<input value>`. Un élément ne réécrit jamais un attribut que l'auteur ou un framework
   possède.
5. **Initialisation tolérante** : `connectedCallback` peut s'exécuter avant que les enfants soient
   analysés (streaming). L'élément observe l'arrivée de ses parties et s'initialise de façon idempotente.
6. **Nettoyage** : tous les écouteurs passent par un `AbortController` annulé dans
   `disconnectedCallback`. Aucune fuite si un framework démonte et remonte le nœud.
7. **Modules sûrs côté serveur** : aucun accès au DOM à l'import ; la définition est gardée
   (`customElements.get(name)`) et ignorée hors navigateur.
8. **Propriétés posées avant l'upgrade** (par un framework) : récupérées et réappliquées à l'upgrade.
9. **Aucune valeur visuelle en JavaScript** : pas de durée, de couleur ni de taille codée en dur. Le
   JavaScript attend la fin réelle des animations CSS.
10. **Mode développement** : la condition d'export `development` active des avertissements (valeur
    d'attribut invalide, partie manquante, nom accessible absent), retirés de la build de production.
11. **Pas d'héritage public** : les classes d'éléments ne sont pas une API d'extension. On étend par
    composition.
12. **Comportement découpé en contrôleurs internes** (roving focus, typeahead, fermeture) : l'élément est
    une coquille fine qui les assemble. C'est ce qui rend possible le plan B de l'hypothèse H1 (piloter
    les contrôleurs depuis un adapter) sans réécrire le comportement.

## 7. Contrôlé et non contrôlé

| Mode         | HTML                                            | React                                   | Mécanisme                                                                                                                                                               |
| ------------ | ----------------------------------------------- | --------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Non contrôlé | `<mcs-tabs value="billing">` (valeur initiale)  | `<Tabs defaultValue="billing">`         | L'élément gère son état et émet `mcs-change`                                                                                                                            |
| Contrôlé     | Le script pose `tabs.value` à chaque changement | `<Tabs value={v} onValueChange={setV}>` | L'adapter pose la propriété à chaque rendu. Si le framework refuse un changement, il **réaffirme** la valeur avant le rendu suivant, comme React le fait pour `<input>` |

L'élément n'a pas de mode « contrôlé » à connaître : il expose une propriété et un événement, ce que fait
toute plateforme. La logique de réaffirmation est générique et vit une seule fois dans l'adapter.

## 8. Formulaires

- Les contrôles de formulaire sont des **éléments natifs** (`<input>`, `<select>`, `<textarea>`). On
  garde gratuitement l'autofill, les gestionnaires de mots de passe, les claviers mobiles adaptés, l'IME,
  `FormData`, la validation par contraintes et les labels.
- Un composant de type C qui porte une valeur (combobox) enveloppe un `<input>` natif plutôt que de
  devenir lui-même un contrôle de formulaire.
- Les form-associated custom elements (`ElementInternals.setFormValue`) sont une exception, réservée à
  un contrôle sans équivalent natif, validée par ADR.
- Validation : attributs natifs (`required`, `pattern`, `type`), `:user-invalid` pour le style, message
  associé par `aria-describedby` et `aria-invalid` posé au bon moment. En HTML, `<mcs-field>` (type B)
  automatise ce câblage ; en React, l'adapter le rend de façon déclarative à partir de la prop `error`.

## 9. Composants complexes

Data grid, combobox, date picker, éditeur riche : ce sont les composants qui coûtent le plus (React Aria
y consacre une part majeure de son code). Règles :

- RFC et prototype jetable avant tout engagement ;
- point d'entrée séparé, statut `experimental` tant que le comportement n'est pas éprouvé ;
- jamais sur le chemin critique du cœur : leur retard ne bloque pas une version ;
- **natif d'abord** : `<input type="date">` et `<table>` couvrent beaucoup de cas avant d'en arriver à
  un date picker ou à un data grid.

## 10. Catalogue

Analyse architecturale des composants demandés. « Repli » renvoie au registre des fonctionnalités
d'[ARCHITECTURE.md](ARCHITECTURE.md).

| Composant  | Primitive native                                        | Type           | JavaScript du design system           | Décisions et risques                                                                                                        |
| ---------- | ------------------------------------------------------- | -------------- | ------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| Button     | `<button>`, `<a>`                                       | A              | Aucun                                 | État de chargement par `aria-busy` (pas `disabled`, qui ferait perdre le focus)                                             |
| Input      | `<input>`, `<textarea>`, `<label>`                      | A, B optionnel | `<mcs-field>` optionnel               | Anatomie `mcs-field` (label, aide, erreur) ; `field-sizing` en amélioration pour les zones de texte                         |
| Select     | `<select>`                                              | A              | Aucun                                 | `appearance: base-select` en amélioration (Chrome, Safari 27) ; besoin riche, donc combobox                                 |
| Checkbox   | `<input type="checkbox">`                               | A              | Aucun                                 | `appearance: none` et `:checked`, `:indeterminate` ; l'état indéterminé est une propriété DOM native                        |
| Radio      | `<input type="radio">` et `<fieldset>`                  | A              | Aucun                                 | Navigation aux flèches native dans un groupe                                                                                |
| Switch     | `<input type="checkbox" role="switch">`                 | A              | Aucun                                 | Attribut `switch` (Safari) en amélioration                                                                                  |
| Dialog     | `<dialog>`, invoker commands, `closedby`                | A              | Polyfills à la demande                | Modale native (inertie, Échap, top layer) ; verrouillage du scroll par `:has(dialog:modal)` ; binding `open` dans l'adapter |
| Popover    | Attribut `popover`, `popovertarget`, anchor positioning | A              | Repli de positionnement à la demande  | Top layer, light dismiss natifs ; pas de portail                                                                            |
| Tooltip    | `popover="hint"` et `interestfor` (futurs)              | C              | `<mcs-tooltip>`                       | Délais, Échap, `aria-describedby` ; usage limité aux boutons-icônes ; remplacé par le natif quand il sera Baseline          |
| Tabs       | Aucune                                                  | C              | `<mcs-tabs>` et parties               | Roving tabindex, activation automatique ou manuelle, orientation                                                            |
| Accordion  | `<details name>`, `<summary>`                           | A              | Aucun                                 | Exclusivité native par `name` ; recherche dans la page ouvre la section ; limite sur les titres dans `<summary>`            |
| Dropdown   | Terme ambigu                                            | —              | —                                     | Décomposé selon le pattern ARIA : Menu (actions), Select (choix d'une valeur), Combobox (saisie et choix), Disclosure       |
| Menu       | `popover` et `<button>`                                 | C              | `<mcs-menu>`, `<mcs-menu-item>`       | Clavier, typeahead ; pas de `role="menu"` pour une navigation de site                                                       |
| Toast      | `popover="manual"`, live region                         | C              | `<mcs-toaster>` et fonction `toast()` | `ariaNotify()` en amélioration ; pause au survol et au focus ; jamais pour une information critique                         |
| Table      | `<table>`                                               | A              | Aucun                                 | Conteneur défilant focalisable et nommé ; tri piloté par l'application (`aria-sort`) ; un data grid est un autre composant  |
| Card       | `<article>`, `<section>`, `<div>`                       | A              | Aucun                                 | Carte cliquable par lien étendu (pseudo-élément), pas par carte entièrement interactive                                     |
| Navigation | `<nav>`, listes, `aria-current`                         | A              | Aucun                                 | Menus de navigation en disclosure (`popover` ou `<details>`), pas en `role="menu"`                                          |

Bilan : 12 composants de type A, aucun ne demandant de JavaScript propre au design system ; 4 de type C ;
« Dropdown » est décomposé.

## 11. Exemples d'API

### Button

```html
<button class="mcs-button" data-variant="primary">Acheter</button>
<a class="mcs-button" data-variant="tertiary" href="/panier">Voir le panier</a>
<button class="mcs-button" data-variant="secondary" data-tone="danger">Supprimer</button>
```

```tsx
<Button variant="primary">Acheter</Button>
<Button asChild variant="tertiary"><Link href="/panier">Voir le panier</Link></Button>
<Button variant="secondary" tone="danger">Supprimer</Button>
```

### Champ de texte

```html
<mcs-field class="mcs-field">
  <label class="mcs-field__label" for="email">Adresse e-mail</label>
  <input class="mcs-input" id="email" name="email" type="email" autocomplete="email" required />
  <p class="mcs-field__hint">Utilisée uniquement pour la confirmation de commande.</p>
  <p class="mcs-field__error" hidden></p>
</mcs-field>
```

```tsx
<TextField
  label="Adresse e-mail"
  name="email"
  type="email"
  autoComplete="email"
  required
  hint="Utilisée uniquement pour la confirmation de commande."
  error={errors.email}
/>
```

### Dialog

```html
<button class="mcs-button" commandfor="confirm" command="show-modal">Supprimer le compte</button>

<dialog class="mcs-dialog" id="confirm" closedby="any" aria-labelledby="confirm-title">
  <h2 class="mcs-dialog__title" id="confirm-title">Supprimer le compte ?</h2>
  <p>Cette action est définitive.</p>
  <form method="dialog" class="mcs-dialog__actions">
    <button class="mcs-button" value="cancel">Annuler</button>
    <button class="mcs-button" data-variant="primary" data-tone="danger" value="confirm">
      Supprimer
    </button>
  </form>
</dialog>
```

```tsx
<Dialog open={open} onOpenChange={setOpen} title="Supprimer le compte ?">
  <p>Cette action est définitive.</p>…
</Dialog>
```

### Menu

```html
<button class="mcs-button" popovertarget="row-actions" aria-haspopup="menu">Actions</button>
<mcs-menu id="row-actions" popover aria-label="Actions sur la ligne">
  <mcs-menu-item value="rename">Renommer</mcs-menu-item>
  <mcs-menu-item value="delete" tone="danger">Supprimer</mcs-menu-item>
</mcs-menu>
```

```tsx
<Menu label="Actions sur la ligne" trigger={<Button>Actions</Button>} onAction={handleAction}>
  <MenuItem value="rename">Renommer</MenuItem>
  <MenuItem value="delete" tone="danger">
    Supprimer
  </MenuItem>
</Menu>
```

### Toast

```js
import { toast } from '@mcs-ds/web/elements/toaster.js';
toast({ message: 'Adresse enregistrée', tone: 'success' });
```

## 12. Conventions strictes

### 12.1 Nommage

| Élément                    | Convention                                           | Exemple                      |
| -------------------------- | ---------------------------------------------------- | ---------------------------- |
| Nom de composant (contrat) | kebab-case, anglais, nom du pattern ARIA si possible | `tabs`, `menu`, `text-field` |
| Classe racine              | `mcs-<composant>`                                    | `mcs-card`                   |
| Classe de partie           | `mcs-<composant>__<partie>`                          | `mcs-card__header`           |
| Balise d'élément           | `mcs-<composant>[-<partie>]`                         | `mcs-tabs`, `mcs-tab-panel`  |
| Attribut (type A)          | `data-<prop>`                                        | `data-variant`               |
| Attribut (type C)          | kebab-case                                           | `orientation`                |
| Propriété DOM              | camelCase                                            | `value`, `selectedIndex`     |
| Événement                  | `mcs-<verbe>`                                        | `mcs-change`                 |
| État personnalisé          | `:state(<adjectif>)`                                 | `:state(selected)`           |
| Hook CSS                   | `--mcs-<composant>-<propriété>`                      | `--mcs-button-radius`        |
| Token                      | `--mcs-<catégorie>-…`                                | `--mcs-color-text-muted`     |
| Composant React            | PascalCase, sans préfixe                             | `Tabs`, `TabPanel`           |
| Prop React d'événement     | `on<Concept>`                                        | `onValueChange`              |
| Type TypeScript            | PascalCase, suffixe explicite                        | `TabsProps`, `ButtonVariant` |
| Fichier                    | kebab-case, suffixe de rôle                          | `text-field.contract.ts`     |

### 12.2 Vocabulaire contrôlé

| Prop          | Valeurs autorisées                                                                                     |
| ------------- | ------------------------------------------------------------------------------------------------------ |
| `variant`     | Déclarées par composant, depuis la liste du vocabulaire ; actions : `primary`, `secondary`, `tertiary` |
| `tone`        | `neutral`, `accent`, `danger`, `warning`, `success`, `info`                                            |
| `size`        | `sm`, `md`, `lg`                                                                                       |
| `orientation` | `horizontal`, `vertical`                                                                               |
| Booléens      | Adjectifs HTML : `disabled`, `required`, `readonly`, `open`, `checked`, `selected`, `multiple`         |
| Valeurs       | `value` et `defaultValue`, `open` et `defaultOpen`, `checked` et `defaultChecked`                      |

Noms interdits : `color` (ambigu), `type` pour un style (collision avec `<button type>`), `kind`,
`appearance`, `isX` et `hasX`, `show` et `visible`, booléens de taille (`small`), négations (`noBorder`).

### 12.3 ARIA

- Première règle d'ARIA : ne pas en utiliser quand un élément natif suffit ; pas de rôle redondant.
- `aria-label` seulement en l'absence de texte visible ; le nom visible est préféré.
- Les listes d'onglets, menus et régions défilantes ont un nom accessible (requis par le contrat).
- Les identifiants sont fournis par l'auteur ou générés par l'élément, avec le préfixe `mcs-`.
- Les annonces passent par le toaster ou l'utilitaire d'annonce, jamais par des live regions dispersées.

### 12.4 TypeScript

- Contrats en `as const` ; types dérivés, jamais réécrits.
- Pas d'`enum` ni de `namespace` : unions de littéraux et objets `as const`.
- Types exportés pour chaque prop publique (`ButtonVariant`, `TabsProps`).
- Les ensembles extensibles sont des **interfaces** pour permettre l'augmentation :

```ts
export interface ButtonVariants extends Record<
  (typeof button.props.variant.values)[number],
  true
> {}
export type ButtonVariant = keyof ButtonVariants;

// Dans une application qui ajoute une variante :
declare module '@mcs-ds/web/contracts' {
  interface ButtonVariants {
    promo: true;
  }
}
```

## 13. Extensibilité : du cœur à l'application

```text
Cœur (@mcs-ds/*)  ──►  Bibliothèque étendue (@acme/mcs-commerce)  ──►  Composant d'application
API publique        préfixe acme-, layer acme.*, tokens --acme-*      recettes, CSS d'application
```

| Niveau               | Peut                                                                                                                                                                      | Ne doit jamais                                                                                                                |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| Bibliothèque étendue | Composer l'anatomie du cœur ; ajouter des variantes (CSS dans son layer et augmentation de types) ; poser des hooks ; créer ses composants avec le même format de contrat | Dépendre des internes (`--_*`, `internal/`, DOM non documenté) ; utiliser le préfixe `mcs-` ; sous-classer un élément du cœur |
| Application          | Utiliser l'échelle de personnalisation ([DEVELOPER_EXPERIENCE.md](DEVELOPER_EXPERIENCE.md)) ; copier une recette                                                          | Surcharger un token système dans un sous-arbre pour « corriger » un composant                                                 |

Couches CSS pour une bibliothèque étendue :

```css
@layer mcs, acme, app;
```

Chemin de promotion : un composant d'application utilisé par deux produits devient candidat pour la
bibliothèque étendue ; un composant générique éprouvé devient candidat pour le cœur (critères dans
[GOVERNANCE.md](GOVERNANCE.md)). Comme le format de contrat est le même à chaque niveau, la promotion ne
demande pas de réécriture.
