# Accessibilité

> Statut : validée le 2026-10-30 (v1). Dernière mise à jour : 2026-10-30.
> L'accessibilité est un **plancher** (voir [PRINCIPLES.md](PRINCIPLES.md)), pas un critère arbitrable.

## 1. Cible

| Référentiel                | Statut au 2026-10-30                                                                             | Position du design system                       |
| -------------------------- | ------------------------------------------------------------------------------------------------ | ----------------------------------------------- |
| **WCAG 2.2 niveau AA**     | Recommandation W3C                                                                               | **Cible** de chaque composant publié            |
| EN 301 549 V4.1.1          | Publiée le 2 septembre 2026, fondée sur WCAG 2.2 ; citation au Journal officiel de l'UE attendue | Couverte par la cible                           |
| European Accessibility Act | Applicable depuis le 28 juin 2025 (dont l'e-commerce)                                            | La cible donne aux produits une base conforme   |
| RGAA 4.1.2                 | Référentiel français en vigueur, fondé sur WCAG 2.1                                              | Couvert par la cible (WCAG 2.2 inclut WCAG 2.1) |
| WCAG 3                     | En cours d'élaboration                                                                           | Suivi ; APCA calculé à titre informatif         |

Un design system ne rend pas un produit conforme à lui seul : il fournit des composants conformes **dans
les usages documentés**. Les responsabilités de l'application (alternatives textuelles, structure des
titres, contenus) sont documentées.

## 2. Mécanismes architecturaux

L'accessibilité vient de la structure du système, pas d'une passe finale :

| Mécanisme                                      | Effet                                                                          | Où                                                     |
| ---------------------------------------------- | ------------------------------------------------------------------------------ | ------------------------------------------------------ |
| Natif d'abord                                  | Sémantique, clavier, focus et formulaires gratuits et éprouvés                 | [COMPONENT_ARCHITECTURE.md](COMPONENT_ARCHITECTURE.md) |
| Pas de Shadow DOM                              | Références ARIA (`aria-labelledby`, `aria-controls`, `for`) dans un seul arbre | D-04                                                   |
| L'état visuel dérive de l'état sémantique      | Un état oublié en ARIA est aussi absent visuellement : le bug se voit          | P4                                                     |
| Sémantique des éléments via `ElementInternals` | Rôles et états cohérents, sans conflit avec les frameworks                     | D-03                                                   |
| Contrat avec pattern APG et carte clavier      | Comportement spécifié avant d'être codé, puis testé                            | Contrats                                               |
| Paires de couleurs à contraste contraint       | Contraste garanti pour chaque thème et chaque mode                             | [TOKENS.md](TOKENS.md)                                 |
| Focus par `outline`                            | Visible partout, y compris en forced colors                                    | [CSS_ARCHITECTURE.md](CSS_ARCHITECTURE.md)             |
| Mouvement opt-in                               | Rien ne bouge si l'utilisateur a demandé une réduction                         | CSS                                                    |
| Sélecteurs gardiens                            | Un composant interactif sur un élément non sémantique paraît cassé             | CSS                                                    |

## 3. Règles par domaine

### 3.1 Sémantique et ARIA

- Première règle d'ARIA : un élément natif plutôt qu'un rôle ARIA.
- Chaque composant de type C implémente un pattern de l'APG (WAI-ARIA Authoring Practices Guide),
  référencé dans son contrat. Un écart au pattern est documenté et justifié.
- Pas de `role="menu"` pour une navigation de site : on utilise le pattern disclosure.
- Les régions nommées (listes d'onglets, menus, tableaux défilants) ont un nom accessible obligatoire.

### 3.2 Clavier

- Tout est utilisable au clavier, sans piège (WCAG 2.1.1 et 2.1.2).
- Les widgets composites utilisent un **roving tabindex** : un seul arrêt de tabulation par widget,
  flèches à l'intérieur. L'attribut natif `focusgroup` (Open UI) remplacera ce helper quand il sera
  Baseline.
- Typeahead dans les menus et les listes.
- Carte clavier déclarée dans le contrat, testée automatiquement, affichée dans la documentation.

### 3.3 Focus

- Focus visible par `:focus-visible` et `outline` : épaisseur d'au moins 2 px, contraste d'au moins 3:1
  avec les couleurs adjacentes (vise WCAG 2.4.13, niveau AAA).
- Focus non masqué (2.4.11, AA) : la base fournit `scroll-padding` pour les en-têtes collants.
- Modale native : le reste du document devient inerte, Échap ferme, le focus revient à l'élément
  déclencheur à la fermeture. Ce comportement est natif ; le pilote vérifie son uniformité entre
  moteurs.
- Popover : fermeture légère et Échap natifs ; l'état déplié du déclencheur est exposé par le
  navigateur.
- Jamais de `outline: none` sans remplacement équivalent (règle Stylelint).

### 3.4 Lecteurs d'écran

- Nom accessible, rôle et état corrects pour chaque partie interactive.
- Annonces dynamiques : une seule région polie et une seule région assertive, gérées par le toaster.
  `ariaNotify()` (Baseline newly available depuis septembre 2026) est utilisé en amélioration.
- Pas de contenu porteur de sens uniquement dans `::before` et `::after` ni dans un attribut `title`.

### 3.5 Formulaires

- Label visible associé (`<label for>`) ; pas de placeholder comme label.
- Aide et erreur reliées par `aria-describedby` ; `aria-invalid` posé après interaction ou soumission.
- `autocomplete` documenté pour chaque type de champ (1.3.5).
- Recette de récapitulatif d'erreurs en tête de formulaire, avec liens vers les champs.
- Pas de saisie redondante (3.3.7) ; pas de test cognitif pour l'authentification (3.3.8).

### 3.6 Couleur et contraste

- Texte : 4.5:1 ; grand texte : 3:1 ; éléments non textuels (bordures de contrôle, icônes porteuses de
  sens, focus) : 3:1. Vérifié au build pour chaque paire, thème et mode.
- La couleur n'est jamais le seul moyen de transmettre une information (1.4.1) : les erreurs ont une
  icône et un texte, les liens dans un texte sont soulignés.

### 3.7 Mouvement

- Mouvement opt-in (`prefers-reduced-motion: no-preference`) ; les fondus restent permis.
- Pas d'animation automatique de plus de cinq secondes sans contrôle (2.2.2).

### 3.8 Contraste élevé et forced colors

- Contexte de tokens `more` pour `prefers-contrast: more`.
- Règles forced colors par composant ; capture visuelle en forced colors dans les tests.

### 3.9 Cibles, zoom et espacement

- Taille de cible d'au moins 24 × 24 px (2.5.8, AA), via `--mcs-size-target-min` ; 44 px en pointeur
  grossier (`@media (pointer: coarse)`) par extension de la zone cliquable, sans changer la mise en page.
- Reflow à 320 px de large (1.4.10) et espacement de texte modifiable (1.4.12) : pas de hauteur fixe
  sur un conteneur de texte.
- Tailles en `rem` : le réglage de taille de police est respecté.

### 3.10 Internationalisation

- Propriétés logiques uniquement ; `:dir()` pour les rares cas directionnels (icônes de flèche).
- Aucune chaîne de texte en dur dans les éléments : les libellés viennent de l'anatomie ou d'attributs
  (`close-label`), donc dans la langue de la page.
- Formats de date et de nombre via `Intl`.

### 3.11 Temporisation

- Toasts : durée d'au moins cinq secondes, pause au survol et au focus, fermeture manuelle, jamais pour
  une information critique ou une action requise (2.2.1).

### 3.12 Contenus à risque

- Tooltips : seulement pour le nom ou la description de boutons-icônes, sans contenu interactif,
  affichés au focus comme au survol, persistants au survol et fermables par Échap (1.4.13).

## 4. Tests

| Niveau                          | Ce qui est vérifié                                                               | Outil                                      | Quand                                            |
| ------------------------------- | -------------------------------------------------------------------------------- | ------------------------------------------ | ------------------------------------------------ |
| Tokens                          | Contraste de chaque paire, chaque thème, chaque mode                             | Build des tokens                           | Chaque PR touchant les tokens                    |
| Composant                       | Règles axe-core sur chaque fixture et chaque état                                | axe-core dans Vitest (navigateurs réels)   | Chaque PR                                        |
| Clavier                         | Carte clavier du contrat, ordre du focus, restauration du focus                  | Vitest, mode navigateur                    | Chaque PR                                        |
| Forced colors, mouvement réduit | Rendu et absence de mouvement                                                    | Playwright (`emulateMedia`), tests visuels | PR touchant le CSS                               |
| Zoom et reflow                  | Rendu à 320 px et texte agrandi à 200 %                                          | Tests visuels                              | Branche principale                               |
| Lecteurs d'écran                | NVDA et Firefox, JAWS et Chrome, VoiceOver sous macOS et iOS, TalkBack et Chrome | Tests manuels scriptés                     | Chaque version mineure, chaque nouveau composant |
| Audit                           | Audit complet par une personne experte                                           | Manuel                                     | Avant 1.0, puis chaque année                     |

Les outils automatiques détectent une partie seulement des problèmes ; les tests manuels sont
obligatoires pour tout nouveau composant de type C. Détails dans
[TESTING_STRATEGY.md](../engineering/TESTING_STRATEGY.md).

## 5. Definition of Done (accessibilité)

Un composant ne passe pas au statut `beta` sans :

- [ ] pattern APG référencé dans le contrat, écarts justifiés ;
- [ ] carte clavier complète, testée ;
- [ ] nom, rôle, état et valeur vérifiés pour chaque partie ;
- [ ] axe-core sans violation sur toutes les fixtures et tous les états ;
- [ ] contrastes vérifiés dans tous les thèmes et modes ;
- [ ] rendu forced colors vérifié (focus, états, icônes) ;
- [ ] mouvement réduit respecté ;
- [ ] cibles d'au moins 24 px ;
- [ ] test manuel avec au moins deux lecteurs d'écran sur deux plateformes ;
- [ ] section accessibilité de la documentation : usage, à faire et à éviter, responsabilités de
      l'application.

## 6. Documentation par composant

Chaque page de composant contient : le pattern APG, la carte clavier, la liste des attributs ARIA gérés
par le composant et de ceux qui restent à la charge de l'auteur, des exemples d'usage correct et
incorrect.

## 7. Gouvernance

- Une régression d'accessibilité est un bug bloquant : pas de release qui la contient en connaissance de
  cause, sauf mention explicite dans les « régressions connues » des notes de release et correctif
  planifié.
- Les tickets d'accessibilité ont une sévérité dédiée dans le template de bug.
- Une personne référente accessibilité fait partie des CODEOWNERS des contrats et des éléments.

## 8. Limites connues

| Limite                                                                                                  | Traitement                                                                           |
| ------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| Un titre placé dans `<summary>` n'est pas restitué comme titre par toutes les technologies d'assistance | Accordéon natif pour les FAQ ; variante avec titres explicites si un produit l'exige |
| Restitution de la sémantique `ElementInternals` à confirmer sur toute la matrice                        | Hypothèse H2 du pilote ; repli sur attributs ARIA                                    |
| Tooltips peu adaptés au tactile                                                                         | Usage restreint (section 3.12)                                                       |
| `<select>` natif peu stylable                                                                           | Accepté jusqu'à `base-select` Baseline ; combobox pour les besoins riches            |
| Fermeture légère des dialogs (`closedby`) non Baseline                                                  | Petit module de repli, retiré quand la fonctionnalité sera disponible partout        |
