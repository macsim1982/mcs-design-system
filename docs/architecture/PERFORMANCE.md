# Performance

> Statut : validée le 2026-10-30 (v1). Dernière mise à jour : 2026-10-30.
> Les budgets sont des valeurs initiales, à confirmer pendant le pilote (hypothèse H5).

## 1. Objectifs

- Aucun coût JavaScript pour les composants qui n'en ont pas besoin (type A).
- Aucune dégradation des Core Web Vitals d'une application qui adopte le design system : pas de
  décalage de mise en page (CLS) à l'upgrade, pas de tâche longue à l'initialisation (INP), CSS
  compacte (LCP).
- Des coûts proportionnels à l'usage : une page qui n'utilise que des boutons ne paie que les boutons.

## 2. Budgets

Tailles compressées en Brotli, vérifiées en CI par size-limit. Dépasser un budget exige un ADR.

| Artefact                                          | Budget                                                      |
| ------------------------------------------------- | ----------------------------------------------------------- |
| Tokens du thème par défaut (`default.css`)        | ≤ 4 Ko                                                      |
| CSS complète (`mcs.css`, environ 20 composants)   | ≤ 25 Ko                                                     |
| CSS d'un composant (médiane)                      | ≤ 1,5 Ko                                                    |
| JavaScript d'un élément de comportement (médiane) | ≤ 3 Ko                                                      |
| JavaScript d'un élément de comportement (maximum) | ≤ 6 Ko                                                      |
| Helpers internes partagés                         | ≤ 2 Ko                                                      |
| Adapter React d'un composant                      | ≤ 1 Ko                                                      |
| JavaScript d'un composant de type A               | 0                                                           |
| Dépendances runtime de `@mcs-ds/web`              | 0                                                           |
| CLS causé par l'upgrade d'un élément              | 0                                                           |
| Initialisation de 100 éléments de type C          | Aucune tâche > 50 ms sur un mobile de milieu de gamme émulé |

## 3. Modèle de coût

| Source de coût                     | Ce qui le déclenche                                        | Position du design system                                                             |
| ---------------------------------- | ---------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| Analyse et exécution du JavaScript | Bibliothèques, composants, polyfills                       | Zéro pour le type A ; modules par élément ; polyfills à la demande                    |
| Hydratation                        | Composants de framework rendus côté serveur                | Aucune pour le type A (composants serveur React)                                      |
| Recalcul de style                  | Taille du DOM, complexité des sélecteurs, shadow roots     | Pas de shadow roots ; sélecteurs plats ; spécificité bornée                           |
| Mise en page                       | Lectures et écritures de géométrie en JavaScript           | Positionnement en CSS (anchor positioning) ; repli JavaScript seulement si nécessaire |
| Upgrade des custom elements        | Définition, constructeurs, `connectedCallback`             | Constructeurs vides ; initialisation paresseuse                                       |
| Écouteurs et observateurs          | Un écouteur par item, `MutationObserver` sur un sous-arbre | Délégation sur la racine ; observateurs limités aux enfants directs                   |
| Polices                            | Fichiers de police, décalage à l'affichage                 | Piles système par défaut ; recette de chargement pour les marques                     |
| Icônes                             | Icônes en composants JavaScript, polices d'icônes          | SVG ; jamais de police d'icônes                                                       |
| CSS                                | Feuilles bloquantes                                        | Budget ; entrées par composant                                                        |

## 4. Stratégies

### 4.1 Livraison

- **ESM non bundlé**, un fichier par module : le bundler du consommateur fait le tree shaking.
- `sideEffects` déclare précisément les fichiers à effet de bord (définitions d'éléments, CSS).
- Pas de barrel à effet de bord : `@mcs-ds/web/contracts` ne contient que des données ; chaque élément a son
  point d'entrée (`@mcs-ds/web/elements/tabs.js`).
- Une build CDN regroupée pour l'usage sans bundler.
- Condition d'export `development` : les avertissements de développement ne coûtent rien en production.

### 4.2 Chargement des éléments

| Stratégie            | Usage                                                                                                               |
| -------------------- | ------------------------------------------------------------------------------------------------------------------- |
| Import explicite     | Applications avec bundler, adapters (un import par élément utilisé)                                                 |
| Chargeur automatique | Sites sans build : observe le document, importe le module d'une balise `mcs-*` non définie à sa première apparition |
| Au besoin            | Îlots : à la visibilité ou à la première interaction                                                                |

Le chargeur automatique est optionnel, car il observe tout le document : il ne doit pas être utilisé dans
une application qui connaît ses composants.

### 4.3 Polyfills

Chargés par import dynamique seulement si la détection échoue (par exemple
`!('popover' in HTMLElement.prototype)`). Les navigateurs récents ne téléchargent rien. Chaque polyfill
a une date de retrait dans le registre des fonctionnalités.

### 4.4 Rendu

- Animations sur `opacity` et `transform` uniquement.
- Pas de lecture de géométrie dans une boucle ; pas de `getComputedStyle` répété.
- Pas d'observateur de redimensionnement quand une container query suffit.
- `content-visibility: auto` documenté comme recette pour les longues listes de l'application, pas
  appliqué d'office.

### 4.5 Polices

Le thème par défaut utilise des piles de polices système : zéro octet. Pour une marque, la recette
documentée est : WOFF2, sous-ensemble de caractères, `font-display: swap`, police de repli ajustée
(`size-adjust`, `ascent-override`) pour limiter le décalage, préchargement de la seule police critique.

## 5. Abstractions coûteuses identifiées

| Abstraction                                              | Coût                                                                                         | Décision                                                  |
| -------------------------------------------------------- | -------------------------------------------------------------------------------------------- | --------------------------------------------------------- |
| CSS-in-JS au runtime                                     | Sérialisation et injection de styles à chaque rendu ; incompatible avec le rendu serveur pur | Exclu                                                     |
| Shadow DOM par instance                                  | Un arbre de styles par instance, mémoire, recalculs                                          | Exclu par défaut                                          |
| Portails et positionnement en JavaScript                 | Code, mesures de mise en page, écouteurs de défilement                                       | Remplacés par le top layer et l'anchor positioning        |
| Pièges à focus, gestionnaires de calques                 | Code et écouteurs globaux                                                                    | Remplacés par `<dialog>` modal, `inert` et `popover`      |
| Hydratation de contenus statiques                        | JavaScript inutile                                                                           | Type A en composants serveur                              |
| `MutationObserver` sur tout un sous-arbre                | Notifications à chaque mutation                                                              | Limité aux enfants directs de l'élément                   |
| `:has()` large (`body:has(…)` avec descendants profonds) | Invalidations de style coûteuses                                                             | Réservé à des cas ciblés (verrouillage du scroll), mesuré |
| Longues chaînes de `var()`                               | Résolution à chaque recalcul                                                                 | Une indirection privée au plus                            |
| Propriétés enregistrées héritées (`@property`)           | Calcul systématique dans tout l'arbre                                                        | Non utilisées pour les tokens                             |
| Style props                                              | Runtime et surface d'API                                                                     | Exclues                                                   |
| Icônes en composants JavaScript                          | Code par icône, hydratation                                                                  | SVG (sprite ou inline)                                    |

## 6. Mesure

| Mesure                                     | Outil                                                       | Quand                        |
| ------------------------------------------ | ----------------------------------------------------------- | ---------------------------- |
| Tailles et budgets                         | size-limit                                                  | Chaque PR touchant un paquet |
| Contenu des bundles                        | Rapport de bundle à la demande                              | Revue                        |
| CLS à l'upgrade, tâches longues            | Playwright et API Performance dans les applications témoins | Branche principale           |
| Micro-mesures (1 000 boutons, 100 onglets) | Page de référence et mesure du temps de style et d'upgrade  | Avant chaque version mineure |
| Suivi en production                        | Recette `web-vitals` fournie aux applications               | Côté consommateur            |

On suit les **tendances** plutôt que des valeurs absolues : une régression de plus de 10 % sur une
micro-mesure bloque la release le temps de l'expliquer.
