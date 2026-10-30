---
paths:
  - 'packages/tokens/**'
  - '**/*.tokens.json'
---

# Tokens

Source : docs/architecture/TOKENS.md et THEMING.md. Propriétaire : `mcs-tokens`.

- Format DTCG 2025.10 : `$value`, `$type` (au niveau du groupe), alias `{a.b.c}`, `$extensions`
  (préfixe `mcs.`), `$deprecated`, `$extends`. Fichiers `*.tokens.json`, resolver `mcs.resolver.json`.
- Niveaux : `ref` (palettes, jamais émises en CSS), `sys` (API publique). Hooks de composant déclarés dans
  les contrats, valorisés seulement par un thème.
- Nommage : `<catégorie>.<rôle>[.<variante>][.<propriété>]` → `--mcs-<…>` ; kebab-case anglais ; ni
  état, ni valeur, ni couleur nommée au niveau `sys`.
- Couleurs en OKLCH (avec `hex` de repli) ; chaque `fg` déclare sa contrainte de contraste
  (`mcs.contrast` : 4.5 pour le texte, 3 pour le non textuel).
- Pas de token d'état (survol, pression) : calculés dans le CSS. Pas de breakpoint au runtime. Pas de
  z-index hors `z.sticky`.
- Sortie CSS : valeurs littérales, `light-dark()` pour clair et sombre, contexte `more` sous
  `prefers-contrast` et `[data-mcs-contrast]`, le tout dans `@layer mcs.tokens`. Jamais `@property` pour une
  couleur ; jamais d'alias `var()` déclaré sur `:root`.
- Ajouter un token système : au moins deux usages, aucun token existant ne convient, revue de nommage,
  changeset `feat(tokens)`. Renommer : `$deprecated` et alias pendant une majeure.
- Les fichiers générés ne s'éditent jamais à la main ; la génération est déterministe.

Procédure : skill `token-change`. Vérifier : build des tokens (contrastes) et rapport des noms.
