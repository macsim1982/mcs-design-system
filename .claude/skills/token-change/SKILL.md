---
name: token-change
description: Procédure pour ajouter, modifier, renommer ou supprimer un design token ou un hook de composant, ou créer un thème de marque. À utiliser pour toute demande qui touche aux tokens ou aux thèmes.
---

# Changement de token

## Ajouter un token système

1. Vérifier qu'aucun token n'exprime déjà l'intention (`grep` dans `packages/tokens/src`).
2. Critères (TOKENS.md §13) : au moins deux usages, nom conforme à la grammaire, pas d'état, pas de
   valeur dans le nom. Sinon : variable privée `--_*` dans le CSS du composant.
3. Validation du nom par `mcs-architect`.
4. `mcs-tokens` : source DTCG au niveau `sys`, `$description`, contrainte de contraste si c'est un premier
   plan ; régénération ; contrastes verts.
5. Changeset : `feat(tokens): add <token>` et ligne `Tokens:`.

## Ajouter un hook de composant

Seulement si un thème réel doit faire varier cette propriété indépendamment du niveau système.
`mcs-architect` l'ajoute au contrat (`hooks`) ; `mcs-css` le lit avec un repli ; changeset avec une ligne
`Tokens:`.

## Modifier une valeur

Corrective (correction) ou mineure (ajustement visuel), signalée par la ligne `Tokens:` ; captures de
référence relues par le design.

## Renommer ou supprimer

1. Version mineure : `$deprecated` avec le nom de remplacement ; alias émis dans `@layer mcs.deprecated` ;
   changeset `deprecate(tokens): …`.
2. Version majeure suivante : suppression, changeset `major` avec `Migration:` et codemod si possible.

## Créer une marque

THEMING.md §5 : fichier `brands/<marque>.tokens.json` qui étend la marque par défaut, contexte du
modificateur `brand` dans le resolver, génération, contrastes verts dans tous les modes, captures d'un
échantillon de composants.
