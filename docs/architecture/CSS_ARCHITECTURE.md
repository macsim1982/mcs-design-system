# Architecture CSS

> Statut : validée le 2026-10-30 (v1). Dernière mise à jour : 2026-10-30.
> Règles outillées : [CODING_STANDARDS.md](../engineering/CODING_STANDARDS.md) et `stylelint.config.js`.

## 1. Objectifs

- Le CSS est l'implémentation principale de l'apparence : variantes, états, responsive, thèmes.
- Aucun runtime, aucun CSS-in-JS, aucun préprocesseur obligatoire.
- Pas de guerre de spécificité : **l'application gagne toujours**, sans `!important`.
- Des styles robustes dans un environnement hostile (resets globaux, frameworks CSS tiers).
- Une CSS lisible par un humain dans les DevTools : ce qu'on écrit est ce qui est livré.

## 2. Où vit le CSS

| Contenu                              | Emplacement                                   | Publié dans                                         |
| ------------------------------------ | --------------------------------------------- | --------------------------------------------------- |
| Tokens (thèmes, modes)               | Généré depuis DTCG                            | `@mcs-ds/tokens/css/*.css`                          |
| Ordre des layers                     | `packages/web/src/foundations/layers.css`     | En tête de chaque point d'entrée                    |
| Reset (optionnel)                    | `packages/web/src/foundations/reset.css`      | `@mcs-ds/web/css/reset.css`                         |
| Base (typographie par défaut, focus) | `packages/web/src/foundations/base.css`       | Inclus dans `mcs.css`                               |
| Primitives de mise en page           | `packages/web/src/foundations/layout.css`     | Inclus dans `mcs.css`                               |
| Un composant                         | `packages/web/src/components/<nom>/<nom>.css` | `@mcs-ds/web/css/components/<nom>.css` et `mcs.css` |
| Utilitaires                          | `packages/web/src/foundations/utilities.css`  | Inclus dans `mcs.css`                               |

Le JavaScript n'importe jamais de CSS : charger les styles est la responsabilité de l'application (une
balise `<link>`, ou un import CSS à la racine d'une application qui utilise un bundler).

## 3. Couches de cascade

```css
@layer mcs.reset, mcs.tokens, mcs.deprecated, mcs.theme, mcs.base, mcs.layout, mcs.components, mcs.utilities;
```

| Layer            | Contenu                                                                                  |
| ---------------- | ---------------------------------------------------------------------------------------- |
| `mcs.reset`      | Reset minimal, optionnel                                                                 |
| `mcs.tokens`     | Tokens système générés                                                                   |
| `mcs.deprecated` | Alias des tokens dépréciés (une version majeure)                                         |
| `mcs.theme`      | Valeurs de hooks fournies par un thème                                                   |
| `mcs.base`       | Styles des éléments nus (typographie, liens, focus visible)                              |
| `mcs.layout`     | Primitives de mise en page (`mcs-stack`, `mcs-cluster`, `mcs-grid`)                      |
| `mcs.components` | Composants                                                                               |
| `mcs.utilities`  | Utilitaires (`mcs-visually-hidden`, `mcs-text-*`), qui doivent gagner sur les composants |

Tout le CSS du design system est dans `mcs.*`. Conséquences :

- les styles **non layerés** de l'application l'emportent toujours sur ceux du design system, quelle
  que soit la spécificité ;
- une application qui utilise ses propres layers place `mcs` où elle veut.

### Intégration côté consommateur

```css
/* Application sans layers : rien à faire, ses styles gagnent. */

/* Application avec layers : déclarer l'ordre une fois, en premier. */
@layer reset, mcs, app;

/* Tailwind CSS v4 : les utilitaires Tailwind gagnent sur les composants du design system. */
@layer theme, base, mcs, components, utilities;
```

Point d'attention documenté : un reset global **non layeré** de l'application (par exemple
`button { all: unset }`) gagne sur le design system. La documentation recommande de le placer dans un
layer avant `mcs`.

## 4. Spécificité

| Règle                                                                         | Vérification                       |
| ----------------------------------------------------------------------------- | ---------------------------------- |
| Spécificité maximale (0,3,0)                                                  | `selector-max-specificity`         |
| Aucun sélecteur d'identifiant                                                 | `selector-max-id: 0`               |
| Pas de `!important`, sauf exceptions listées et commentées                    | `declaration-no-important`         |
| Pas de type qualifiant une classe (`button.mcs-button`), sauf dans `:where()` | `selector-disallowed-list` (motif) |
| Trois sélecteurs composés au plus                                             | `selector-max-compound-selectors`  |
| `:where()` pour les parties d'un sélecteur qui ne doivent pas peser           | Revue                              |

Exceptions à `!important`, chacune justifiée dans le fichier par un commentaire de désactivation
Stylelint : `[hidden] { display: none !important }` dans le reset, pour que l'attribut `hidden` ne soit
jamais battu par un `display` de composant.

## 5. Nommage : BEM allégé et attributs

| Concept                  | Forme                                    | Exemple                                                  |
| ------------------------ | ---------------------------------------- | -------------------------------------------------------- |
| Composant (bloc)         | `.mcs-<composant>`                       | `.mcs-card`                                              |
| Partie (élément)         | `.mcs-<composant>__<partie>`             | `.mcs-card__header`                                      |
| Variante (énumération)   | `data-<prop>="<valeur>"`                 | `data-variant="primary"`, `data-size="sm"`               |
| État                     | Pseudo-classe native, ARIA ou `:state()` | `:disabled`, `[aria-current='page']`, `:state(selected)` |
| Modificateur global      | `data-mcs-<dimension>`                   | `data-mcs-color-scheme="dark"`                           |
| Utilitaire               | `.mcs-<nom>`                             | `.mcs-visually-hidden`, `.mcs-text-body-md`              |
| Custom property publique | `--mcs-*`                                | `--mcs-button-radius`                                    |
| Custom property privée   | `--_*`                                   | `--_bg`                                                  |

Pourquoi des attributs pour les variantes plutôt que des classes modificatrices : une énumération ne
peut avoir qu'une valeur à la fois. `data-variant` rend impossible l'état incohérent
`mcs-button--primary mcs-button--secondary`, se mappe directement depuis une prop de framework et se lit
facilement dans les DevTools.

Pourquoi garder `__` pour les parties : la frontière entre bloc et partie reste non ambiguë
(`mcs-card__header` contre un composant `mcs-card-header`), ce qui simplifie les règles de lint et la
génération de documentation.

## 6. Sélecteurs gardiens

Un composant interactif n'est stylé que sur un élément sémantiquement valide. Un mauvais usage
**paraît** cassé, il ne se contente pas d'être inaccessible :

```css
@layer mcs.components {
  :where(
    button,
    a[href],
    input[type='button'],
    input[type='submit'],
    input[type='reset']
  ).mcs-button {
    /* styles du bouton */
  }
}
```

`:where()` n'ajoute aucune spécificité : le sélecteur pèse (0,1,0). `<div class="mcs-button">` ne reçoit
aucun style, et la feuille de débogage le signale (voir
[DEVELOPER_EXPERIENCE.md](DEVELOPER_EXPERIENCE.md)).

## 7. Custom properties

- **Publiques** (`--mcs-*`) : tokens système et hooks déclarés dans le contrat du composant. Elles font
  partie de l'API, sous semver.
- **Privées** (`--_*`) : variables internes d'un composant, par exemple pour factoriser des variantes.
  Elles ne sont ni documentées ni stables.
- Un composant **lit** des hooks (`var(--mcs-button-radius, …)`) mais ne les **déclare** jamais : seuls
  un thème ou une application le font.
- Les hooks sont hérités ; posés sur un conteneur, ils s'appliquent aux composants descendants. C'est
  voulu pour l'adaptation contextuelle, et documenté pour éviter les surprises dans les composants
  imbriqués.
- Pas de longues chaînes de `var()` : une indirection privée et un repli au plus.

Motif de variante par variables privées :

```css
@layer mcs.components {
  :where(button, a[href]).mcs-button {
    --_bg: var(--mcs-color-neutral-subtle-bg);
    --_fg: var(--mcs-color-neutral-subtle-fg);
    --_border: var(--mcs-color-border-strong);

    min-block-size: var(--mcs-size-control-md);
    padding-inline: var(--mcs-space-4);
    border: var(--mcs-border-width-default) solid var(--_border);
    border-radius: var(--mcs-button-radius, var(--mcs-radius-control));
    background: var(--_bg);
    color: var(--_fg);

    &[data-variant='primary'] {
      --_bg: var(--mcs-color-accent-strong-bg);
      --_fg: var(--mcs-color-accent-strong-fg);
      --_border: transparent;
    }
  }
}
```

Le `<button>` sans attribut prend la variante par défaut déclarée dans le contrat (`secondary`). Un test
vérifie que le rendu sans attribut est identique au rendu avec la valeur par défaut explicite.

## 8. Imbrication

- CSS nesting natif (Baseline widely available depuis juin 2026), aplati au build seulement si la cible
  navigateurs l'exige.
- Profondeur maximale de 2 (`max-nesting-depth`).
- Imbrication autorisée pour : variantes (`&[data-variant=…]`), états (`&:hover`, `&:state(open)`),
  at-rules (`@media`, `@container`, `@supports`).
- Pas d'imbrication des parties : `.mcs-card__header` s'écrit à plat. Imbriquer les parties fait monter la
  spécificité et cache la structure.

## 9. Responsive

| Règle                                                                           | Pourquoi                                                              |
| ------------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| Les composants s'adaptent à leur **conteneur** (`@container`), pas à la fenêtre | Un composant ne connaît pas la page dans laquelle il est placé        |
| Les media queries de viewport sont réservées aux primitives de mise en page     | La mise en page de la page est l'affaire de l'application             |
| Syntaxe d'intervalle (`width >= 48rem`) et seuils en `rem`                      | Lisible ; respecte le zoom et la taille de police                     |
| Valeurs fluides (`clamp()`) plutôt que des paliers                              | Moins de règles, pas de saut visuel                                   |
| Propriétés logiques uniquement (`margin-inline`, `inset-inline-start`)          | Support de la droite à gauche sans code dédié ; vérifié par Stylelint |
| `container-type` seulement sur des enveloppes dédiées                           | Le confinement de taille a des effets de bord sur la mise en page     |

## 10. États

| État                    | Sélecteur                                                                           |
| ----------------------- | ----------------------------------------------------------------------------------- |
| Survol                  | `:hover`, dans `@media (hover: hover)` pour éviter le survol « collant » au tactile |
| Focus clavier           | `:focus-visible`, par `outline`                                                     |
| Désactivé               | `:disabled`, `[aria-disabled='true']`                                               |
| Coché, indéterminé      | `:checked`, `:indeterminate`                                                        |
| Invalide                | `:user-invalid` (après interaction), `[aria-invalid='true']`                        |
| Ouvert                  | `[open]`, `:popover-open`, `:modal`                                                 |
| Page ou élément courant | `[aria-current]`                                                                    |
| État d'un élément       | `:state(<nom>)`                                                                     |
| Avant upgrade           | `:not(:defined)`                                                                    |

## 11. Mouvement

Le mouvement est **opt-in** : le CSS de base ne déplace rien, et les transformations ne sont ajoutées que
lorsque l'utilisateur n'a pas demandé de réduction.

```css
@layer mcs.components {
  .mcs-dialog {
    transition: opacity var(--mcs-motion-duration-moderate) var(--mcs-motion-easing-standard);
  }
  @media (prefers-reduced-motion: no-preference) {
    .mcs-dialog {
      transition-property: opacity, translate;
    }
  }
}
```

Les animations d'entrée et de sortie des overlays utilisent `@starting-style` et
`transition-behavior: allow-discrete`, en amélioration pure : sans support, l'élément apparaît sans
animation. Le JavaScript n'attend jamais une durée codée en dur : il attend la fin réelle des animations
(`element.getAnimations()`).

## 12. Contraste élevé et forced colors

- Focus par `outline` (couleur `--mcs-color-focus-ring`, épaisseur et décalage par tokens). Jamais par
  `box-shadow` seul : le mode forced colors le supprime.
- Tout état exprimé par un fond seul reçoit une alternative (bordure, soulignement, indicateur) dans
  `@media (forced-colors: active)`.
- Icônes en `currentColor`.
- `forced-color-adjust: none` est interdit sauf cas documenté (aperçu d'une couleur choisie par
  l'utilisateur, par exemple).

## 13. Reset et normalisation

- Le reset est **optionnel** et publié à part (`@mcs-ds/web/css/reset.css`). Un design system intégré dans
  une application existante ne doit pas imposer un reset global.
- Les composants ne dépendent pas du reset : chacun déclare ce dont il a besoin (`box-sizing`, marges,
  police héritée sur les contrôles).
- Le reset est minimal : `box-sizing`, marges, médias responsives, police héritée sur les contrôles,
  `[hidden]`. Il se place dans `mcs.reset`, donc il perd contre tout le reste.

## 14. Shadow DOM, light DOM, `@scope`

- Les composants sont en light DOM : pas de `::part`, pas de `:host`.
- Si un jour une intégration exige une isolation (widget dans une page tierce), la même feuille de style
  peut être adoptée dans un shadow root (constructable stylesheets, Baseline widely available). Le CSS
  ne suppose donc jamais d'être dans le document principal.
- `@scope` (Baseline newly available depuis mars 2026) n'est pas nécessaire : préfixe, `__` et layers
  évitent déjà les collisions. Il reste une option pour l'isolation si l'hypothèse H3 échoue.

## 15. Build et outillage

- Sources en CSS standard ; **pas de SCSS** (décision D-11) :

| Besoin couvert par Sass | Équivalent natif                                                             |
| ----------------------- | ---------------------------------------------------------------------------- |
| Variables               | Custom properties (dynamiques, héritées, modifiables au runtime)             |
| Imbrication             | CSS nesting                                                                  |
| Fonctions               | `calc()`, `clamp()`, `min()`, `max()`, `color-mix()`                         |
| Mixins                  | Rarement nécessaires : variables privées, `:is()` et `:where()`, utilitaires |
| Boucles (génération)    | Le build des tokens génère ce qui doit l'être                                |
| `@import` et partials   | `@import` regroupés au build par Lightning CSS                               |
| Breakpoints nommés      | `@custom-media` (spécification en cours), résolu au build                    |

Sass reviendrait à ajouter un langage, un compilateur et une étape obligatoire pour un gain nul.
Critère de réexamen : un besoin récurrent de mixins que les variables et `:where()` ne couvrent pas.

- **Lightning CSS** : regroupement des `@import`, aplatissement du nesting selon la cible `browserslist`,
  résolution de `@custom-media`, minification, source maps.
- Sorties : `mcs.css` (complet), un fichier par composant, `reset.css`. Le CSS publié est standard et
  lisible ; aucune étape de build n'est exigée du consommateur.
- Lint : Stylelint (configuration standard et règles d'architecture), `stylelint-plugin-use-baseline`
  pour la politique navigateurs, `stylelint-declaration-strict-value` pour imposer les tokens.

## 16. Anti-patterns

| Anti-pattern                                            | Alternative                                             |
| ------------------------------------------------------- | ------------------------------------------------------- |
| `.mcs-card .mcs-button { … }`                           | Le parent pose `--mcs-button-*`                         |
| `.is-active`, `.selected`                               | L'état sémantique (`aria-*`, pseudo-classe, `:state()`) |
| Couleur ou ombre en dur                                 | Token système                                           |
| `margin-left`, `text-align: left`                       | `margin-inline-start`, `text-align: start`              |
| `@media (prefers-color-scheme: dark)` dans un composant | `light-dark()` dans les tokens                          |
| `z-index: 9999`                                         | Top layer (`popover`, `<dialog>`)                       |
| Animation déclenchée sans condition                     | `@media (prefers-reduced-motion: no-preference)`        |
| `!important` pour gagner une bataille de spécificité    | Layers                                                  |
