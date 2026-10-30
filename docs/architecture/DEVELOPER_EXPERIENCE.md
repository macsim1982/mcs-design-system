# Expérience développeur et documentation

> Statut : validée le 2026-10-30 (v1). Dernière mise à jour : 2026-10-30.

## 1. Objectif

Un développeur qui écrit `<Button variant="primary">Acheter</Button>` doit savoir, **sans quitter son
éditeur**, quelles props existent, quelles valeurs sont permises, quels événements sont émis, quels
tokens et hooks sont disponibles, et où trouver comment personnaliser, créer une variante ou créer un
thème. La DX fait partie de l'architecture : elle repose sur les contrats, pas sur une documentation
écrite à part qui finirait par diverger.

## 2. Les cinq premières minutes

| Étape | Avec un framework (React)                                          | Sans build (HTML)                                                         |
| ----- | ------------------------------------------------------------------ | ------------------------------------------------------------------------- |
| 1     | `pnpm add @mcs-ds/react @mcs-ds/web @mcs-ds/tokens`                | Deux balises `<link>` vers un CDN                                         |
| 2     | Importer `default.css` et `mcs.css` à la racine de l'application   | —                                                                         |
| 3     | `import { Button } from '@mcs-ds/react'`, autocomplétion des props | `<button class="mcs-button" data-variant="primary">`, autocomplétion HTML |
| 4     | Un composant de type C importe sa définition tout seul             | `<script type="module">` du module de l'élément, ou chargeur automatique  |

Aucune configuration de bundler, aucun plugin, aucun provider.

## 3. Découvrabilité depuis l'IDE

| Question                | Réponse fournie par                                                                                                                              |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| Quelles props ?         | Types React dérivés des contrats ; JSDoc générée : description, `@default`, lien vers la documentation                                           |
| Quelles variantes ?     | Unions de littéraux (`'primary' \| 'secondary' \| 'tertiary'`) proposées par l'autocomplétion                                                    |
| Quels événements ?      | Props `on…` typées, avec le type du détail                                                                                                       |
| Quels tokens ?          | Type `TokenName` de `@mcs-ds/tokens` ; données d'autocomplétion des custom properties pour VS Code ; explorateur de tokens dans la documentation |
| Comment personnaliser ? | La JSDoc de chaque composant liste ses hooks (`--mcs-button-radius`) avec un lien vers l'échelle de personnalisation                             |
| En HTML pur ?           | Données personnalisées HTML pour VS Code et `web-types` pour JetBrains, générées depuis les contrats : balises, attributs, valeurs               |

Toutes ces métadonnées sont **générées depuis les contrats** : elles ne peuvent pas diverger de l'API
réelle.

## 4. Retours d'erreur

| Mécanisme                         | Ce qu'il signale                                                                                                                |
| --------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| TypeScript                        | Valeur de variante inconnue, prop inexistante, callback mal typé                                                                |
| Avertissements en développement   | Attribut invalide, partie d'anatomie manquante, nom accessible absent, deux versions de `@mcs-ds/web` chargées                  |
| Feuille de débogage (`debug.css`) | En développement : `.mcs-button` sur un élément non interactif, image sans `alt`, valeur `data-*` inconnue, contrôle sans label |
| Préréglage html-validate          | Les mêmes règles, en lint de templates (HTML, CMS) ; généré depuis les contrats                                                 |

Format de chaque message : ce qui ne va pas, pourquoi, comment corriger, lien vers la documentation.

```text
[mcs] <mcs-tab-list> n'a pas de nom accessible.
Les listes d'onglets doivent être nommées pour que les lecteurs d'écran les distinguent.
Ajoutez aria-label ou aria-labelledby. Voir https://mcs.example/components/tabs#accessibilite
```

## 5. Échelle de personnalisation

Du moins puissant au plus puissant. On monte d'un cran seulement si le précédent ne suffit pas.

| Niveau | Mécanisme                                    | Exemple                                                    | Stabilité                                            |
| ------ | -------------------------------------------- | ---------------------------------------------------------- | ---------------------------------------------------- |
| 1      | Variante prévue                              | `variant="tertiary"`                                       | API publique                                         |
| 2      | Token système dans un thème                  | `--mcs-radius-control: 999px`                              | API publique                                         |
| 3      | Hook de composant                            | `.toolbar { --mcs-button-radius: 0 }`                      | API publique                                         |
| 4      | Surcharge CSS dans le layer de l'application | `.checkout .mcs-button { … }`                              | À vos risques (classes publiques, rendu non garanti) |
| 5      | Composition d'un nouveau composant           | `IconButton` construit à partir de `Button` et d'une icône | API publique                                         |
| 6      | Recette copiée et adaptée                    | Le code d'un pattern documenté, possédé par l'application  | Hors du design system                                |

### Créer une variante

1. Vérifier qu'une combinaison existante (`variant` et `tone`) ne suffit pas.
2. Dans l'application : déclarer la variante dans le layer de l'application en posant les hooks ou les
   variables du composant, puis étendre le type par augmentation de l'interface `ButtonVariants` (voir
   [COMPONENT_ARCHITECTURE.md](COMPONENT_ARCHITECTURE.md), section 12.4).
3. Dans le design system : proposer la variante (template de demande), qui entre dans le contrat si au
   moins deux produits en ont besoin.

### Créer un thème

Voir [THEMING.md](THEMING.md), section 5 : un fichier DTCG, un contexte du resolver, une génération qui
vérifie les contrastes. Sans build : surcharger les tokens système dans une feuille chargée après celle
du design system.

## 6. Stratégie de documentation

### 6.1 Publics et artefacts

| Public                   | Besoin                                   | Artefact                                                               |
| ------------------------ | ---------------------------------------- | ---------------------------------------------------------------------- |
| Développeur consommateur | Utiliser, personnaliser, migrer          | Site de documentation, types, notes de release, guides de migration    |
| Designer                 | Principes, tokens, usage des composants  | Site (fondations, tokens), bibliothèque Figma synchronisée             |
| Contributeur             | Construire, tester, publier              | [CONTRIBUTING.md](../../CONTRIBUTING.md), `docs/engineering/`, atelier |
| Architecte, mainteneur   | Comprendre et faire évoluer              | `docs/architecture/`, ADR                                              |
| Agents de code (IA)      | Agir vite et juste, avec peu de contexte | `CLAUDE.md`, règles par domaine, skills, gabarits (voir section 7)     |

### 6.2 Page type d'un composant

1. Résumé et quand l'utiliser (et quand ne pas l'utiliser)
2. Exemples interactifs, avec des onglets HTML et React
3. Anatomie
4. API : props, attributs, événements, hooks (générées depuis le contrat)
5. Accessibilité : pattern APG, carte clavier, responsabilités de l'application
6. Theming : tokens utilisés, hooks
7. À faire et à éviter
8. Statut et historique des changements

### 6.3 Une seule source pour les exemples

Les **fixtures** (`*.fixtures.ts`) sont des fonctions qui renvoient du HTML. Elles alimentent l'atelier,
les tests et la documentation : un exemple documenté est donc un exemple testé. Les exemples React de la
documentation sont rendus côté serveur pour afficher le HTML équivalent, ce qui garantit l'identité des
deux onglets.

### 6.4 Outils

| Phase | Outil                                                      | Rôle                                                            |
| ----- | ---------------------------------------------------------- | --------------------------------------------------------------- |
| 2     | Storybook 10, rendu HTML (`apps/workbench`)                | Atelier de développement, revue visuelle, documentation interne |
| 3     | Site statique (Astro et Starlight pressentis, à confirmer) | Documentation publique, versionnée par version majeure          |

Storybook n'est jamais une dépendance runtime : les stories sont de fines enveloppes autour des fixtures.
Remplacer l'outil revient à supprimer ces enveloppes.

### 6.5 Documentation versionnée

- La documentation de chaque version majeure reste en ligne pendant toute sa période de maintenance.
- Les notes de release vivent dans le dépôt (`docs/releases/`) et sur GitHub.
- Chaque version majeure a son guide de migration, avec les codemods disponibles.

## 7. Expérience des agents de code

L'implémentation sera en grande partie assistée par des agents. La DX inclut donc le **coût en contexte**
pour un agent :

- les documents d'architecture sont longs et pédagogiques ; les agents lisent des **digests normatifs
  compacts**, chargés seulement quand un fichier du domaine est touché (`.claude/rules/`) ;
- le **contrat** d'un composant est la seule lecture nécessaire pour l'implémenter ;
- le boilerplate est produit par des **générateurs déterministes** (`pnpm scaffold:component`), pas par
  un modèle ;
- chaque domaine a un agent spécialisé, avec ses chemins, ses entrées et ses sorties (`.claude/agents/`).

Le protocole complet est décrit dans [`CLAUDE.md`](../../CLAUDE.md).

## 8. Mises à jour

- Dépréciations annoncées une version mineure au moins avant la suppression, avec un avertissement en
  développement et une entrée dans les notes de release.
- Codemods pour les renommages (classes, attributs, tokens, props).
- Les rapports d'API garantissent qu'aucun changement de l'API publique ne passe inaperçu.
