<!--
Titre de la PR : Conventional Commits, en anglais (ex. « feat(button): add loading state »).
Il deviendra le message du commit sur main. Une rupture s'écrit avec « ! » (« feat(button)!: … »).
Les sections marquées (obligatoire) doivent contenir du texte ; « Aucun » est une réponse valide.
Règles : docs/engineering/GIT_WORKFLOW.md
-->

## Contexte et objectif

<!-- (obligatoire) Pourquoi ce changement ? Lien vers l'issue, la RFC ou l'ADR. -->

## Description du changement

<!-- (obligatoire) Ce qui change, du point de vue d'un consommateur puis de l'implémentation. -->

## Décisions techniques

<!-- Choix faits, alternatives écartées. Une nouvelle abstraction répond au test d'admission
     (docs/architecture/PRINCIPLES.md, section 4). -->

## Impact sur l'API publique

<!-- (obligatoire) Cochez une case et détaillez. API publique : tokens, hooks CSS, classes, attributs,
     anatomie, balises, événements, props, exports. -->

- [ ] Aucun
- [ ] Ajout (compatible)
- [ ] Dépréciation (compatible, avertissement en développement)
- [ ] Rupture (changeset major ou minor avant 1.0, section Migration, deux approbations)

## Changements visuels

<!-- Captures avant et après, ou « Aucun ». Les captures de référence modifiées sont relues. -->

## Tokens

<!-- Tokens ou hooks ajoutés, modifiés, dépréciés ; contrastes vérifiés. Ou « Aucun ». -->

## Accessibilité

<!-- Clavier, lecteurs d'écran, contraste, forced colors, mouvement réduit. Ou « Non concerné ». -->

## Tests réalisés

<!-- (obligatoire) Tests ajoutés ou modifiés, vérifications manuelles (navigateurs, lecteurs d'écran). -->

## Risques identifiés

<!-- (obligatoire) Ce qui pourrait casser, pour qui, et comment le détecter. -->

## Migration

<!-- Étapes pour les consommateurs, codemod éventuel. Ou « Aucune ». -->

## Checklist

- [ ] Changeset ajouté (`pnpm changeset`), ou changeset vide si aucun effet publié (`pnpm changeset --empty`)
- [ ] Contrat, documentation et fixtures à jour
- [ ] Tests au bon niveau (docs/engineering/TESTING_STRATEGY.md)
- [ ] Aucune exception de lint sans justification
