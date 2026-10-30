# Architecture des tokens

> Statut : validée le 2026-10-30 (v1). Dernière mise à jour : 2026-10-30.
> Format de référence : Design Tokens Community Group, modules Format, Color et Resolver **2025.10**
> (première version stable, publiée le 28 octobre 2025).

## 1. Objectifs et non-objectifs

Les tokens nomment les décisions de design pour qu'elles soient partagées entre le design (Figma), le
code (CSS, JavaScript) et la documentation, et pour qu'elles puissent évoluer sans casser les
applications.

Objectifs :

- une **API publique petite et stable** : les consommateurs n'utilisent que des tokens système ;
- des **thèmes et modes sans rebuild applicatif** : clair, sombre, contraste élevé, marques ;
- un **contraste garanti par construction** et vérifié en CI pour chaque thème ;
- un **format standard** (DTCG) pour que l'outillage reste remplaçable.

Non-objectifs :

- tokeniser chaque valeur : une valeur locale à un composant reste une custom property privée (`--_*`) ;
- un token par état (survol, pression) : les états sont calculés ;
- des tokens de composant publiés par défaut.

## 2. Trois niveaux, deux publiés

```text
Référence (ref)          Système (sys)                    Hooks de composant
interne, non émise   →   API publique (custom props)  →   optionnels, non valorisés par défaut
color.blue.600           color.accent.strong.bg           --mcs-button-radius
```

| Niveau        | Rôle                                                               | Émis en CSS ?                     | Utilisable par les applications ?        |
| ------------- | ------------------------------------------------------------------ | --------------------------------- | ---------------------------------------- |
| **Référence** | Palettes et échelles brutes, sans intention (`color.blue.600`)     | Non                               | Non (JSON et TypeScript pour les outils) |
| **Système**   | Intentions (`color.accent.strong.bg`, `space.4`, `radius.control`) | Oui                               | Oui : c'est l'API de theming             |
| **Hook**      | Point de personnalisation d'un composant (`--mcs-button-radius`)   | Seulement si un thème le valorise | Oui, avec parcimonie                     |

Pourquoi ne pas publier les références : une application qui utilise `blue-600` directement ne suit
plus le mode sombre ni les changements de marque. C'est la première cause de thèmes cassés dans les
design systems qui exposent leurs palettes.

Pourquoi les hooks ne sont pas des tokens système : publier un token par propriété de composant
(modèle Material 3) produit des milliers de noms, chacun étant une API à maintenir. SLDS 2 a justement
abandonné ses hooks de niveau composant au profit de hooks globaux. Ici, un hook est déclaré par le
**contrat** du composant, lu par son CSS avec un repli sur un token système, et n'existe dans le CSS
généré que si un thème lui donne une valeur.

```css
/* CSS du composant : le hook est lu, jamais déclaré */
.mcs-button {
  border-radius: var(--mcs-button-radius, var(--mcs-radius-control));
}
```

Règle d'ajout d'un hook : au moins un thème réel doit faire varier cette propriété indépendamment du
niveau système. Un composant expose au plus une huitaine de hooks.

## 3. Nomenclature

### 3.1 Grammaire

```text
chemin DTCG   :  <catégorie>.<rôle>[.<variante>][.<propriété>]
custom prop   :  --mcs-<catégorie>-<rôle>[-<variante>][-<propriété>]
hook          :  --mcs-<composant>-<propriété>[-<variante>]
privée        :  --_<nom>            (jamais documentée, peut changer à tout moment)
```

- Segments en minuscules, en kebab-case, en anglais.
- Du général au particulier : catégorie, rôle ou intention, emphase, propriété.
- Pas d'état dans les noms (`-hover`, `-pressed`) : les états sont dérivés (section 5.4).
- Pas de valeur dans les noms (`blue` est interdit au niveau système, `16` aussi).
- Les échelles numériques sont réservées aux catégories où le rang est le sens (`space.4`).

### 3.2 Exemples

| Chemin DTCG                | Custom property                  | Sens                                         |
| -------------------------- | -------------------------------- | -------------------------------------------- |
| `color.surface.raised`     | `--mcs-color-surface-raised`     | Fond des surfaces surélevées (cartes, menus) |
| `color.text.muted`         | `--mcs-color-text-muted`         | Texte secondaire                             |
| `color.accent.strong.bg`   | `--mcs-color-accent-strong-bg`   | Fond d'aplat de l'accent (bouton principal)  |
| `color.accent.strong.fg`   | `--mcs-color-accent-strong-fg`   | Texte sur ce fond, contraste garanti         |
| `color.danger.text`        | `--mcs-color-danger-text`        | Texte d'erreur sur une surface               |
| `space.4`                  | `--mcs-space-4`                  | 1rem                                         |
| `radius.control`           | `--mcs-radius-control`           | Rayon des contrôles interactifs              |
| `motion.duration.moderate` | `--mcs-motion-duration-moderate` | Durée de transition standard                 |

## 4. Catégories : ce qui est un token et ce qui n'en est pas un

| Catégorie                      | Token ?           | Niveau public                                    | Justification                                                                                                                                         |
| ------------------------------ | ----------------- | ------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| Couleur                        | Oui               | Rôles système                                    | Cœur du theming ; varie selon le mode, le contraste et la marque.                                                                                     |
| Typographie                    | Oui               | Styles composites (`text.body.md`…) et familles  | Hiérarchie cohérente ; tailles fluides ; varie selon la marque.                                                                                       |
| Espacement                     | Oui               | Échelle (`space.0` à `space.16`)                 | Le rang dans l'échelle est le sens. Pas d'alias sémantiques (`space.inset.card`) : ils multiplient les noms sans gain mesurable.                      |
| Tailles                        | Oui               | `size.control.*`, `size.icon.*`, `size.target.*` | Hauteurs de contrôle et cibles tactiles (WCAG 2.5.8).                                                                                                 |
| Rayons                         | Oui               | Par rôle (`radius.control`, `radius.container`…) | Levier principal de personnalité d'une marque ; un rôle change sans toucher les autres.                                                               |
| Bordures                       | Partiellement     | Épaisseurs (`border.width.*`)                    | Les couleurs de bordure sont des tokens de couleur ; les styles (`solid`) ne varient pas et n'ont pas besoin de nom.                                  |
| Élévation et ombres            | Oui               | Niveaux (`elevation.raised`, `overlay`, `modal`) | Trois ou quatre niveaux suffisent ; les ombres diffèrent en mode sombre.                                                                              |
| Mouvement                      | Oui               | Durées et courbes par intention                  | Cohérence ; la réduction du mouvement est traitée dans le CSS (opt-in), pas par des tokens à zéro.                                                    |
| Focus                          | Oui               | `focus.ring.width`, `focus.ring.offset`, couleur | Invariant d'accessibilité partagé par tous les composants.                                                                                            |
| Opacité                        | Très peu          | `state.hover`, `state.active` (pourcentages)     | Les états désactivés utilisent des couleurs dédiées, pas une opacité qui dégrade le contraste.                                                        |
| Z-index                        | Presque plus      | `z.sticky` seulement                             | Le top layer (`<dialog>`, `popover`) rend les échelles de z-index obsolètes pour les overlays.                                                        |
| Breakpoints                    | **Non** (runtime) | Constantes de build (`@custom-media`) et JSON    | Une custom property ne peut pas être utilisée dans une media query. Les composants réagissent à leur conteneur (container queries), pas à la fenêtre. |
| « Tokens responsive »          | **Non**           | —                                                | Les valeurs fluides (`clamp()`) remplacent les tokens par breakpoint.                                                                                 |
| Valeurs propres à un composant | **Non**           | Custom property privée `--_*`                    | Une valeur utilisée par un seul composant n'est pas une décision de design partagée.                                                                  |

## 5. Couleur

### 5.1 Rôles

| Groupe            | Tokens                                                                                      | Usage                                                    |
| ----------------- | ------------------------------------------------------------------------------------------- | -------------------------------------------------------- |
| Surfaces          | `color.surface.{base, raised, sunken, overlay, inverse}`                                    | Fonds de page, cartes, puits, menus et modales, tooltips |
| Texte             | `color.text.{default, muted, subtle, disabled, inverse}`                                    | Texte sur les surfaces                                   |
| Bordures          | `color.border.{subtle, default, strong}`                                                    | `strong` atteint 3:1 : obligatoire pour les contrôles    |
| Intentions        | `color.{neutral, accent, danger, warning, success, info}.{subtle, strong}.{bg, fg, border}` | Aplats et fonds teintés, avec leur texte et leur bordure |
| Texte d'intention | `color.{intention}.text`                                                                    | Liens (`accent`), messages d'erreur (`danger`)…          |
| Focus             | `color.focus.ring`                                                                          | Anneau de focus                                          |
| Voile             | `color.scrim`                                                                               | Fond des modales                                         |

Environ soixante tokens de couleur système au total (Primer en compte plus de deux cents). Une palette
catégorielle pour la visualisation de données sera ajoutée seulement sur besoin.

### 5.2 Paires à contraste garanti

Chaque fond (`bg`) a son premier plan (`fg`). La paire porte une contrainte vérifiée au build, pour
chaque thème et chaque mode :

```json
{
  "color": {
    "accent": {
      "strong": {
        "bg": { "$type": "color", "$value": "{color.blue.600}" },
        "fg": {
          "$type": "color",
          "$value": "{color.neutral.0}",
          "$extensions": {
            "mcs.contrast": { "against": "{color.accent.strong.bg}", "min": 4.5 }
          }
        }
      }
    }
  }
}
```

Seuils (WCAG 2.2) : 4.5:1 pour le texte, 3:1 pour le grand texte et les éléments non textuels (bordures
de contrôle, icônes porteuses de sens, anneau de focus). APCA est calculé à titre informatif tant que
WCAG 3 n'est pas finalisé.

### 5.3 Palettes

Les palettes de référence sont définies en **OKLCH** (espace perceptuel, Baseline widely available
depuis novembre 2025). La génération d'une palette de marque à partir d'une couleur source vise des
ratios de contraste cibles (approche Leonardo) plutôt que des crans arbitraires.

```json
{
  "color": {
    "$type": "color",
    "blue": {
      "600": {
        "$value": { "colorSpace": "oklch", "components": [0.52, 0.19, 259], "hex": "#2459d6" }
      }
    }
  }
}
```

Le champ `hex` est la valeur de repli prévue par le format, utile aux outils qui ne gèrent pas OKLCH.

### 5.4 États dérivés plutôt que tokenisés

Survol et pression sont obtenus en mélangeant le premier plan dans le fond. Le principe est celui des
« state layers » de Material, mais il est appliqué par le navigateur :

```css
.mcs-button[data-variant='primary'] {
  --_bg: var(--mcs-color-accent-strong-bg);
  --_fg: var(--mcs-color-accent-strong-fg);
  background: var(--_bg);
  color: var(--_fg);
}
@media (hover: hover) {
  .mcs-button:hover {
    background: color-mix(in oklab, var(--_bg), var(--_fg) var(--mcs-state-hover));
  }
}
.mcs-button:active {
  background: color-mix(in oklab, var(--_bg), var(--_fg) var(--mcs-state-active));
}
```

Conséquences :

- un rebrand ne touche que les tokens de base, et les états suivent ;
- une couleur de marque fournie au runtime obtient des états corrects sans compilation ;
- en contrepartie, Figma ne calcule pas `color-mix()`. Le build exporte donc les couleurs d'état
  calculées dans le JSON destiné aux outils de design, sans les publier comme tokens.

### 5.5 Mode sombre

Le clair et le sombre sont deux contextes du resolver (section 8). La sortie CSS les combine avec
`light-dark()`, résolu par le navigateur selon la propriété `color-scheme` de l'élément qui utilise la
couleur (voir [THEMING.md](THEMING.md)) :

```css
--mcs-color-surface-base: light-dark(oklch(0.99 0 0), oklch(0.19 0.01 260));
```

## 6. Typographie

- Familles : `font.family.{sans, serif, mono}`. Par défaut, piles système : zéro octet téléchargé.
- Graisses : `font.weight.{regular, medium, semibold, bold}`.
- Styles composites (type DTCG `typography`) : `text.{display, heading, body, label, code}.{sm, md, lg}`,
  quinze styles au plus.
- Tailles en `rem` pour respecter le réglage de taille de police de l'utilisateur ; interlignage sans
  unité.
- Tailles fluides pour `display` et `heading` : le format DTCG ne sait pas exprimer `clamp()`, donc la
  plage est déclarée dans `$extensions` et le build émet `clamp()`.

```json
{
  "text": {
    "heading": {
      "lg": {
        "$type": "typography",
        "$value": {
          "fontFamily": "{font.family.sans}",
          "fontSize": { "value": 2, "unit": "rem" },
          "fontWeight": "{font.weight.semibold}",
          "letterSpacing": { "value": -0.01, "unit": "rem" },
          "lineHeight": 1.2
        },
        "$extensions": {
          "mcs.fluid": {
            "min": { "value": 1.5, "unit": "rem" },
            "max": { "value": 2, "unit": "rem" }
          }
        }
      }
    }
  }
}
```

Sortie : une custom property pour la règle `font` raccourcie, une pour l'interlettrage, et une classe
utilitaire (`.mcs-text-heading-lg`) pour le HTML écrit à la main.

## 7. Espacement, tailles, rayons, mouvement, élévation

| Groupe     | Tokens système                                                                    | Valeurs indicatives (à valider avec le design)         |
| ---------- | --------------------------------------------------------------------------------- | ------------------------------------------------------ |
| Espacement | `space.{0, 1, 2, 3, 4, 5, 6, 8, 10, 12, 16}`                                      | Multiples de 0.25rem                                   |
| Contrôles  | `size.control.{sm, md, lg}`                                                       | 2rem, 2.5rem, 3rem                                     |
| Cibles     | `size.target.{min, touch}`                                                        | 1.5rem (24 px, minimum WCAG 2.5.8 AA), 2.75rem (44 px) |
| Rayons     | `radius.{control, container, overlay, full}`                                      | Les marques jouent surtout sur ces rôles               |
| Bordures   | `border.width.{default, strong}`                                                  | 1px, 2px                                               |
| Focus      | `focus.ring.{width, offset}`                                                      | 2px, 2px                                               |
| Mouvement  | `motion.duration.{fast, moderate, slow}`, `motion.easing.{standard, enter, exit}` | 100 ms, 200 ms, 300 ms ; courbes de Bézier             |
| Élévation  | `elevation.{raised, overlay, modal}`                                              | Ombres composites ; couleurs d'ombre en `light-dark()` |
| États      | `state.{hover, active}`                                                           | 8 %, 12 %                                              |
| Empilement | `z.sticky`                                                                        | Seul z-index nécessaire hors top layer                 |

## 8. Thèmes et modes : le resolver

Le module Resolver de DTCG 2025.10 combine des **ensembles** (toujours appliqués) et des
**modificateurs** (un contexte actif à la fois). C'est le standard qui remplace les « modes »
propriétaires.

```json
{
  "$schema": "https://www.designtokens.org/schemas/2025.10/resolver.json",
  "name": "mcs",
  "version": "2025.10",
  "sets": {
    "reference": {
      "sources": [{ "$ref": "ref/color.tokens.json" }, { "$ref": "ref/dimension.tokens.json" }]
    },
    "system": {
      "sources": [{ "$ref": "sys/color.tokens.json" }, { "$ref": "sys/layout.tokens.json" }]
    }
  },
  "modifiers": {
    "brand": {
      "contexts": { "default": [], "acme": [{ "$ref": "brands/acme.tokens.json" }] },
      "default": "default"
    },
    "colorScheme": {
      "contexts": { "light": [], "dark": [{ "$ref": "sys/color.dark.tokens.json" }] },
      "default": "light"
    },
    "contrast": {
      "contexts": { "standard": [], "more": [{ "$ref": "sys/color.contrast-more.tokens.json" }] },
      "default": "standard"
    }
  },
  "resolutionOrder": [
    { "$ref": "#/sets/reference" },
    { "$ref": "#/sets/system" },
    { "$ref": "#/modifiers/brand" },
    { "$ref": "#/modifiers/colorScheme" },
    { "$ref": "#/modifiers/contrast" }
  ]
}
```

- Une **marque** surcharge surtout les palettes de référence et quelques tokens système (rayons,
  familles de police). Les alias système suivent automatiquement.
- Le **mode** surcharge le mapping système vers les références.
- Le **contraste** renforce bordures, textes atténués et anneau de focus.

## 9. Références, héritage et repli

- **Alias** : `"{color.blue.600}"` cible un token complet ; `$ref` (JSON Pointer) cible une partie d'une
  valeur. Les alias sont résolus **au build** : la sortie CSS du niveau système contient des valeurs
  littérales, pas de chaînes de `var()`.
- **Héritage de groupe** : `$type` déclaré au niveau du groupe ; `$extends` pour dériver un groupe d'un
  autre (une marque étend la marque par défaut).
- **Repli** : uniquement pour les hooks (`var(--mcs-button-radius, var(--mcs-radius-control))`). Les tokens
  système n'ont pas de repli : leur absence est un bug détecté par les tests.

### Le piège des alias résolus à la racine

Si la CSS générée contenait `:root { --mcs-color-accent-strong-bg: var(--mcs-ref-blue-600); }`, la
référence serait **résolue sur `:root`**. Une section qui redéfinit `--mcs-ref-blue-600` plus bas dans
l'arbre ne changerait pas `--mcs-color-accent-strong-bg` pour ses descendants : la valeur héritée est
déjà calculée. C'est la cause classique des thèmes imbriqués qui « ne marchent qu'à moitié ».

D'où trois règles :

1. Les tokens système sont émis avec des **valeurs littérales**, redéclarées dans chaque portée de thème.
2. Les modes passent par `light-dark()`, évalué à l'endroit où la couleur est **utilisée**.
3. Les tokens de couleur ne sont **jamais enregistrés avec `@property`** : une propriété enregistrée de
   syntaxe `<color>` est calculée là où elle est déclarée, ce qui figerait `light-dark()` à la racine.

## 10. Sorties générées

| Sortie                                        | Contenu                                                                                | Consommateurs                                 |
| --------------------------------------------- | -------------------------------------------------------------------------------------- | --------------------------------------------- |
| `@mcs-ds/tokens/css/default.css`              | Tokens système du thème par défaut (clair, sombre, contraste) dans `@layer mcs.tokens` | Toutes les applications                       |
| `@mcs-ds/tokens/css/themes/<marque>.css`      | Un fichier par marque, à la racine ou dans une portée `[data-mcs-theme="<marque>"]`    | Applications de marque                        |
| `@mcs-ds/tokens/json/<contexte>.json`         | Valeurs résolues par contexte, couleurs d'état calculées                               | Figma, documentation, outils                  |
| `@mcs-ds/tokens` (JavaScript et types)        | Noms typés (`TokenName`), valeurs résolues du thème par défaut                         | Canvas, graphiques, e-mails, tests            |
| `@mcs-ds/tokens/tailwind.css` (optionnel)     | Pont `@theme` vers Tailwind v4                                                         | Applications sous Tailwind                    |
| `packages/tokens/api/token-names.txt` (dépôt) | Liste des noms publics, triée                                                          | CI : toute suppression est un breaking change |

## 11. Pipeline

```text
sources DTCG ─► validation du schéma ─► résolution (Terrazzo, resolver 2025.10) ─► contrôles
                                                                                   │
                     ┌─────────────────────────────────────────────────────────────┘
                     ▼
     nommage · contraste par paire et par contexte · hooks déclarés par les contrats · dépréciations
                     │
                     ▼
     plugin de sortie maison : light-dark(), portées de thème, @layer mcs.tokens, JSON, TypeScript
```

- **Terrazzo** est retenu pour l'analyse et la résolution : il implémente le module Resolver 2025.10.
  Style Dictionary n'est pas retenu tant que ce module n'est pas supporté (ticket #1590 encore ouvert en
  octobre 2026). Le format étant standard, l'outil reste remplaçable.
- La **sortie CSS** est un plugin maison d'environ deux cents lignes : nos conventions (`light-dark()`,
  portées, layers, hooks) sont spécifiques et doivent rester sous contrôle.
- La génération est **déterministe** : même entrée, même sortie, octet pour octet. La CI vérifie que les
  fichiers générés sont à jour.

## 12. Évolution sans casser les applications

| Changement                            | Classification                                                       | Mécanisme                                                                                                                                                   |
| ------------------------------------- | -------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Ajout d'un token système ou d'un hook | Mineure                                                              | Revue de nommage                                                                                                                                            |
| Changement de valeur                  | Mineure ou corrective, signalée « Tokens » dans les notes de release | Tests visuels ; une refonte visuelle majeure est une version majeure                                                                                        |
| Renommage                             | Mineure, puis majeure à la suppression                               | L'ancien nom passe en `$deprecated` et reste émis comme alias dans `@layer mcs.deprecated` pendant toute la majeure ; Stylelint le signale ; codemod fourni |
| Suppression                           | Majeure                                                              | Après au moins une version mineure de dépréciation                                                                                                          |

`$deprecated` accepte une chaîne explicative, réutilisée telle quelle dans les avertissements et les
notes de release.

## 13. Gouvernance des tokens

Un token système est ajouté seulement si :

1. au moins deux composants ou produits en ont besoin ;
2. aucun token existant n'exprime cette intention ;
3. le nom suit la grammaire et le vocabulaire (revue obligatoire) ;
4. ses paires de contraste sont déclarées s'il s'agit d'une couleur ;
5. un changeset `feat(tokens)` le documente.

Le nombre de tokens publics est suivi : toute hausse de plus de 10 % dans une version mineure déclenche
une revue d'architecture. La procédure complète est dans le skill `token-change`
(`.claude/skills/token-change/`) et dans [CONTRIBUTING.md](../../CONTRIBUTING.md).
