# Analyse critique des design systems existants

> Statut : validée le 2026-10-30 (v1). Faits vérifiés le 2026-10-30 (registre npm, dépôts et documentation
> officiels). Les jugements sont des opinions argumentées, signalées comme telles.

L'objectif n'est pas de copier, mais de comprendre les compromis de chaque système, ce qui a vieilli et
ce qui reste pertinent en 2026. Chaque fiche se termine par ce que nous **retenons** et ce que nous
**évitons**. La synthèse (section 3) relie ces leçons aux décisions d'[ARCHITECTURE.md](ARCHITECTURE.md).

## 1. Fiches

### 1.1 Material Design 3 et Material Web (Google)

**État en 2026.** Material 3 reste le langage de design de Google ; l'évolution « M3 Expressive »
(2025) a d'abord été livrée sur Android et Compose. Material Web (`@material/web`, Lit et Shadow DOM)
est officiellement en **mode maintenance depuis 2024** (« pending new maintainers ») : versions 2.3
(mars 2025), 2.4 (août 2025), 2.5 (juillet 2026).

| Dimension  | Analyse                                                                                                                                                                                   |
| ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Tokens     | Trois niveaux formalisés : `md.ref` (palettes), `md.sys` (rôles), `md.comp` (composants). Rigueur exemplaire, mais des milliers de tokens de composant, chacun étant une API à maintenir. |
| Couleur    | Couleur dynamique : palettes tonales dans l'espace HCT, générées depuis une couleur source. Les paires de rôles (`primary` et `on-primary`) garantissent le contraste par construction.   |
| États      | « State layers » : un calque d'opacité de la couleur de premier plan au survol et à la pression, plutôt qu'un token par état.                                                             |
| Composants | Material Web encapsule tout en Shadow DOM. Formulaires réimplémentés via `ElementInternals`, personnalisation limitée à `::part` et aux custom properties.                                |
| Framework  | Web Components génériques, sans adapters officiels.                                                                                                                                       |
| Faiblesses | Identité visuelle difficile à quitter ; explosion des tokens de composant ; dépendance à une équipe unique (la maintenance a cessé quand Google a réaffecté les ingénieurs).              |

- **Retenu** : les paires fond/premier plan, les états calculés plutôt que tokenisés, la génération de
  palettes dans un espace perceptuel (nous utilisons OKLCH).
- **Évité** : les tokens de composant publiés en masse ; un cœur Shadow DOM ; la dépendance à une
  bibliothèque maintenue par une seule équipe.

### 1.2 Radix (Primitives, Colors, Themes)

**État en 2026.** Primitives React accessibles et sans style ; toujours maintenu (`radix-ui` 1.8.1,
octobre 2026). Une partie de l'équipe d'origine a créé Base UI chez MUI (1.0 en décembre 2025).

| Dimension  | Analyse                                                                                                                                                                         |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Composants | Composants composés (`Dialog.Root`, `Dialog.Trigger`…), `asChild` pour le polymorphisme, attributs `data-state` pour le style, mode contrôlé et non contrôlé systématique.      |
| A11y       | Comportements soignés, alignés sur l'APG, mais reconstruits en JavaScript : `Portal`, `FocusScope`, `DismissableLayer`, verrouillage du scroll.                                 |
| Couleur    | Radix Colors : échelles fonctionnelles de 12 crans où chaque cran a un usage défini (fonds, bordures, aplats, texte). Excellente idée de design.                                |
| Framework  | React uniquement ; la plupart des primitives sont des composants client.                                                                                                        |
| Faiblesses | Une grande partie du code réimplémente ce que la plateforme fait nativement depuis 2023-2025 (top layer, `inert`, `popover`, `<dialog>`). Coût en JavaScript et en hydratation. |

- **Retenu** : l'ergonomie des composants composés pour les adapters, l'état exposé au CSS, les échelles
  fonctionnelles comme source d'inspiration pour nos rôles.
- **Évité** : réimplémenter portails, pièges à focus et calques de fermeture que le navigateur fournit.

### 1.3 shadcn/ui

**État en 2026.** Ce n'est pas une bibliothèque mais une distribution de code : une CLI copie les
composants (Tailwind et Radix, ou Base UI) dans le projet. Selon des sources secondaires, Base UI est le
choix par défaut des nouveaux projets depuis juillet 2026.

| Dimension  | Analyse                                                                                                                                                                                                          |
| ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Modèle     | « Open code » : l'équipe possède le code et le modifie librement ; registre de composants distribuable.                                                                                                          |
| Theming    | Custom properties par paires (`--primary`, `--primary-foreground`), simples et efficaces.                                                                                                                        |
| Forces     | Aucun verrou de version, personnalisation totale, très bonne lisibilité (y compris pour les assistants de code).                                                                                                 |
| Faiblesses | Aucune voie de mise à jour : les correctifs (y compris d'accessibilité) ne se propagent pas, et chaque copie dérive. À l'échelle de plusieurs produits, c'est l'incohérence assurée. Couplé à React et Tailwind. |

- **Retenu** : le modèle « code que vous possédez » pour la couche des recettes et patterns, pas pour le
  cœur.
- **Évité** : un cœur distribué par copie, sans gouvernance ni mises à jour.

### 1.4 Chakra UI

**État en 2026.** Chakra v3 (fin 2024) a réécrit le système : comportements délégués à Ark UI et Zag.js
(machines à états indépendantes du framework), API de « recipes » pour les variantes, mais toujours
Emotion au runtime (`@emotion/react` en peerDependency de la version 3.37).

| Dimension  | Analyse                                                                                                                                                                                            |
| ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Tokens     | Tokens et tokens sémantiques avec conditions (clair et sombre) ; recipes et slot recipes pour décrire les variantes comme des données.                                                             |
| DX         | Très bonne : style props, autocomplétion, composition.                                                                                                                                             |
| Faiblesses | CSS-in-JS au runtime (coût de rendu, incompatible avec le rendu serveur pur des React Server Components) ; migration v2 vers v3 lourde pour les utilisateurs ; grande surface d'API (style props). |

- **Retenu** : les variantes décrites comme des données (nos contrats) ; l'idée de machines à états
  indépendantes du framework, que nos éléments réalisent sans couche supplémentaire.
- **Évité** : le CSS-in-JS au runtime ; les style props ; les réécritures qui imposent une migration
  totale.

### 1.5 Carbon (IBM)

**État en 2026.** Implémentation React principale (`@carbon/react` 1.119) et Web Components sur Lit
(`@carbon/web-components` 2.66), styles en Sass (`@carbon/styles`), implémentations communautaires pour
d'autres frameworks.

| Dimension  | Analyse                                                                                                                                                      |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Theming    | Quatre thèmes (white, g10, g90, g100) et surtout des **tokens contextuels de couche** (`layer-01` à `layer-03`) qui s'adaptent à l'imbrication des surfaces. |
| A11y       | Rigueur d'entreprise (IBM Equal Access, outillage de vérification dédié).                                                                                    |
| Framework  | Plusieurs implémentations du même composant : les écarts de parité entre React et Web Components sont un coût permanent.                                     |
| Faiblesses | Sass obligatoire pour personnaliser, CSS volumineuse, sélecteurs longs ; lourd pour un petit site.                                                           |

- **Retenu** : le modèle de couches contextuelles (nos surfaces et thèmes imbriqués reposent sur
  l'héritage des custom properties).
- **Évité** : plusieurs implémentations du même composant ; le préprocesseur comme passage obligé.

### 1.6 Salesforce Lightning Design System (SLDS)

**État en 2026.** SLDS a popularisé le terme « design tokens » (outil Theo, 2014). SLDS 2 (thème
Cosmos) remplace les design tokens par des **global styling hooks** (`--slds-g-*`). La documentation
officielle précise que les hooks partagés et **de niveau composant ne sont pas supportés dans SLDS 2** ;
les hooks globaux sont faits pour être consommés et non réassignés dans un composant ; un linter dédié
détecte les hooks dépréciés.

| Dimension  | Analyse                                                                                                                                           |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| Contrats   | Les **blueprints** décrivent chaque composant par son HTML et son CSS, indépendamment du framework : c'est exactement notre notion d'anatomie.    |
| Évolution  | Le passage des hooks de composant aux hooks globaux confirme que les tokens de composant publiés en masse ne tiennent pas dans la durée.          |
| Faiblesses | Balisage BEM verbeux ; héritage du « synthetic shadow » de LWC, un polyfill devenu une dette de long terme ; couplage à la plateforme Salesforce. |

- **Retenu** : l'anatomie HTML comme contrat indépendant du framework ; des hooks globaux en priorité ;
  un linter de dépréciation.
- **Évité** : un polyfill qui change la sémantique de la plateforme et devient impossible à retirer.

### 1.7 Fluent UI (Microsoft)

**État en 2026.** Fluent UI React v9 (`@fluentui/react-components` 9.75) avec Griffel (CSS-in-JS
atomique, extraction au build possible) ; Fluent UI Web Components v3 sur FAST, **stable depuis le
29 juin 2026**, après une longue période de bêta.

| Dimension   | Analyse                                                                                                                                                                           |
| ----------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Composition | API de slots et recomposition par hooks séparés (état, rendu, styles) : un composant peut être reconstruit à partir de ses morceaux.                                              |
| Theming     | Tokens exposés en custom properties, mais injectés par un `FluentProvider` (contexte React requis).                                                                               |
| Faiblesses  | Grande complexité (beaucoup de paquets, hooks suffixés `_unstable`) ; performance dépendante d'un plugin de build ; deux implémentations (React et Web Components) qui divergent. |

- **Retenu** : la séparation état, rendu et style, que nous obtenons structurellement (élément, anatomie,
  CSS).
- **Évité** : un provider obligatoire pour le thème ; un styling qui dépend d'un plugin de bundler.

### 1.8 Adobe Spectrum

**État en 2026.** React Spectrum repose sur React Aria (hooks) et React Aria Components (1.22) ;
Spectrum 2 (`@react-spectrum/s2` 1.8) utilise des macros de style compilées au build. Spectrum Web
Components (Lit) prépare une **deuxième génération** (2.0 en bêta) qui sépare un paquet de
comportements abstraits (`@adobe/spectrum-wc-core`) des composants rendus et stylés
(`@adobe/spectrum-wc`).

| Dimension  | Analyse                                                                                                                                                                        |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| A11y, i18n | React Aria est la référence des comportements accessibles et internationalisés (dates, nombres, plus de 30 langues), au prix d'une taille et d'une complexité importantes.     |
| Couleur    | Leonardo (outil open source d'Adobe) génère des palettes à partir de **ratios de contraste cibles** : l'accessibilité est un paramètre d'entrée, pas un contrôle a posteriori. |
| Tokens     | Très nombreux, avec des données et schémas publiés.                                                                                                                            |
| Faiblesses | Implémentations multiples (React Spectrum et Web Components) ; macros de style qui exigent un outillage de build ; explosion des tokens.                                       |

- **Retenu** : les palettes contraintes par le contraste ; la leçon de la deuxième génération (séparer le
  comportement du rendu) ; la prudence sur les composants très complexes (date picker, data grid), à ne
  construire que sur besoin avéré.
- **Évité** : un styling qui dépend d'un compilateur ; les implémentations parallèles.

## 2. Autres références utiles

| Référence                              | Pourquoi elle compte                                                                                                                                                                       |
| -------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| GOV.UK Frontend (6.6)                  | Près de dix ans d'HTML, CSS et JavaScript en amélioration progressive, indépendant de tout framework, au service de centaines de services. Preuve de longévité du modèle « HTML d'abord ». |
| GitHub Catalyst et `@github/*-element` | Custom elements en light DOM qui enrichissent un balisage rendu côté serveur (onglets, menus) : précédent direct de nos éléments de comportement.                                          |
| Web Awesome 3 (successeur de Shoelace) | Lit, Shadow DOM, parts et custom properties : l'état de l'art du modèle « tout Web Component », avec ses limites en SSR et en formulaires.                                                 |
| Base UI 1.x, Ark UI et Zag.js          | Primitives sans style de nouvelle génération ; Zag.js prouve qu'un comportement peut être écrit une fois et lié à plusieurs frameworks.                                                    |
| Primer (GitHub)                        | Tokens fonctionnels nommés par propriété (`fgColor`, `bgColor`, `borderColor`), lisibles et faciles à documenter.                                                                          |
| Open UI                                | Groupe qui incube `popover`, invokers, interest invokers, customizable select, focusgroup. S'aligner sur Open UI, c'est préparer le remplacement de nos éléments par du natif.             |
| Tailwind CSS v4                        | Configuration en CSS (`@theme`) fondée sur des custom properties : un pont vers nos tokens est trivial et optionnel.                                                                       |
| Lion (ING), Nord (Nordhealth)          | Web Components en marque blanche et pour la santé ; retours d'expérience sur la difficulté des formulaires dans le Shadow DOM.                                                             |

## 3. Synthèse : ce qui compte en 2026

| Leçon                                                                                            | Observée chez                               | Décision correspondante         |
| ------------------------------------------------------------------------------------------------ | ------------------------------------------- | ------------------------------- |
| Maintenir plusieurs implémentations du même composant coûte cher et produit des écarts de parité | Carbon, Fluent, Spectrum                    | D-03, D-08                      |
| Une bibliothèque portée par une seule équipe peut s'arrêter                                      | Material Web                                | D-01, D-10                      |
| Les tokens de composant publiés en masse ne tiennent pas dans la durée                           | Material 3, SLDS 2                          | D-06                            |
| Le contraste se garantit par construction (paires, palettes contraintes)                         | Material 3, Leonardo, shadcn/ui             | D-06, D-14                      |
| La plateforme a rattrapé les primitives JavaScript (top layer, `inert`, `popover`, `<dialog>`)   | Radix, Base UI, Chakra                      | D-01                            |
| Le CSS-in-JS au runtime est un passif (performance, React Server Components)                     | Chakra, Fluent (sans extraction)            | D-02                            |
| Le Shadow DOM complique SSR, ARIA et formulaires pour un design system généraliste               | Material Web, Web Awesome, Lion             | D-04                            |
| Le contrat HTML/CSS survit aux frameworks                                                        | SLDS (blueprints), GOV.UK Frontend          | D-05                            |
| Séparer comportement et rendu est la tendance de fond                                            | Spectrum WC 2nd gen, Zag.js, Fluent (hooks) | D-03, D-05                      |
| Le modèle « code possédé » est excellent en périphérie, dangereux au cœur                        | shadcn/ui                                   | Section 4.2 d'ARCHITECTURE      |
| Les réécritures totales épuisent les utilisateurs                                                | Chakra v3, Fluent v9                        | D-18, politique de dépréciation |

## 4. Ce qui pourrait être amélioré par rapport à l'existant

1. **Un cœur sans runtime obligatoire.** Aucun des systèmes étudiés ne fonctionne entièrement sans
   JavaScript pour ses composants simples, sauf GOV.UK Frontend et SLDS en CSS seul.
2. **Une seule implémentation par composant**, utilisable en HTML pur comme dans un framework, sans les
   coûts du Shadow DOM.
3. **Le contraste garanti dès les tokens** et vérifié en CI pour chaque thème, y compris personnalisé.
4. **Des thèmes imbriquables sans JavaScript**, via `color-scheme` et `light-dark()`.
5. **Des polyfills avec date de retrait**, pour que la dette de plateforme diminue au lieu de s'accumuler.
6. **Une API compacte**, avec un vocabulaire contrôlé et des rapports d'API qui rendent toute
   modification visible en revue.
