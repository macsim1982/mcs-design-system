---
name: hotfix
description: Procédure de correction urgente d'une version publiée, jusqu'à la release corrective et au retour sur main. À utiliser quand l'utilisateur signale une anomalie critique en production ou demande un hotfix.
---

# Hotfix

Référence : docs/engineering/RELEASE_PROCESS.md §9. Chaque action Git distante (push, PR, merge)
demande l'accord explicite de l'utilisateur.

1. **Qualifier** : version touchée, sévérité « critique », reproduction minimale.
2. **Choisir la base** :
   - `git log --oneline v<dernière>..main -- .changeset` est vide, ou ne contient que des correctifs :
     brancher depuis `main` ;
   - sinon : `git switch -c release/<maj>.<min>.x v<version>` (si la branche n'existe pas), puis brancher
     depuis elle.
3. **Brancher** : `git switch -c hotfix/<description> <base>`.
4. **Corriger** : correctif minimal et test de non-régression qui échoue avant le correctif (délégué à
   `mcs-qa`) ; changeset `fix(<portée>): …` en `patch`.
5. **Vérifier** : `pnpm run verify` ; aucun contrôle n'est sauté.
6. **PR** vers la base choisie, étiquette `hotfix`, une approbation de mainteneur.
7. **Release** : merger la PR « version packages » générée sur la base ; publication, tags et note de
   release sont automatiques.
8. **Retour sur main** : automatique depuis une branche de maintenance (PR `chore(release): merge back`) ;
   pour une ligne plus ancienne : `git cherry-pick -x <sha>` vers les autres branches concernées.
9. **Clore** : ticket d'incident mis à jour, ligne « Known Regressions » retirée si elle existait.
