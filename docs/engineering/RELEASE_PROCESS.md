# Versions, releases, notes de release et déploiement

> Statut : en vigueur dès la phase 1 ; aucune publication possible tant qu'aucun paquet n'existe.
> Dernière mise à jour : 2026-10-30.

## 1. Vue d'ensemble

```text
PR avec changeset ──► merge sur main ──► release.yml
                                           │
                     ┌─────────────────────┴──────────────────────┐
                     │ changesets en attente ?                    │
               oui   ▼                                      non   ▼
   PR « chore(release): version packages »          publication si une version n'est pas encore sur npm :
   • versions calculées                              1. vérification complète (ci.yml)
   • notes de release générées (docs/releases/)      2. notes de release présentes, sinon arrêt
   • CHANGELOG.md mis à jour                         3. build et publication npm (OIDC, provenance)
   • relue et enrichie, puis mergée ───────────────► 4. tags Git, release GitHub avec les notes
                                                     5. retour sur main (branche de maintenance)
                                                     6. déploiement de la documentation
```

Aucune étape n'est manuelle à part la relecture et le merge de la PR de version.

## 2. Semantic Versioning appliqué au design system

Format `MAJEURE.MINEURE.CORRECTIVE`. Pour un design system, l'API publique ne se limite pas au code :

| Surface publique                                        | Corrective (PATCH)               | Mineure (MINOR)      | Majeure (MAJOR)                                        |
| ------------------------------------------------------- | -------------------------------- | -------------------- | ------------------------------------------------------ |
| Noms de tokens système                                  | —                                | Ajout ; dépréciation | Suppression, renommage effectif                        |
| Valeurs de tokens                                       | Correction (contraste, coquille) | Ajustement visuel    | Refonte visuelle d'ensemble                            |
| Hooks CSS (`--mcs-<composant>-*`)                       | —                                | Ajout ; dépréciation | Suppression ; changement de sens                       |
| Classes, parties, attributs `data-*` et leurs valeurs   | —                                | Ajout ; dépréciation | Suppression ou renommage                               |
| Anatomie HTML                                           | —                                | Ajout facultatif     | Élément requis ajouté ou supprimé ; structure modifiée |
| Balises, attributs, propriétés, événements des éléments | —                                | Ajout ; dépréciation | Suppression, renommage, changement de `detail`         |
| Props et types React                                    | Correction de type               | Prop ajoutée         | Prop supprimée ou renommée ; type plus strict          |
| Comportement (clavier, focus)                           | Correction vers le pattern APG   | Nouvelle interaction | Interaction supprimée ou modifiée                      |
| Couches CSS (`mcs.*`)                                   | —                                | —                    | Ordre ou noms modifiés                                 |
| Plancher navigateurs                                    | —                                | —                    | Relèvement                                             |
| Exports (`exports` de `package.json`)                   | —                                | Ajout                | Suppression ou déplacement                             |

Règles complémentaires :

- Un correctif d'accessibilité qui modifie le comportement pour le rendre conforme est une corrective,
  même s'il change le rendu.
- Avant 1.0, une rupture est une **mineure** (`0.x`), mais elle suit la même exigence de migration.
- Un composant `experimental` peut changer dans une mineure ; ce changement est quand même signalé comme
  breaking dans les notes.

## 3. Versionnement des paquets

- Groupe **fixe** dans Changesets : `@mcs-ds/tokens`, `@mcs-ds/web` et `@mcs-ds/react` portent toujours la même
  version. Une application installe un ensemble cohérent, et le support ne gère jamais de mélange.
  Configuration : [`.changeset/config.json`](../../.changeset/config.json).
- Dépendances entre paquets : `@mcs-ds/web` dépend de `@mcs-ds/tokens` en version exacte ; `@mcs-ds/react` déclare
  `@mcs-ds/web` en peerDependency. Les références `workspace:*` sont remplacées par les versions publiées.
- Paquets hors du groupe (futur `@mcs-ds/icons`) : versionnés indépendamment.
- Applications privées (`apps/*`) : jamais versionnées ni publiées.

### Dist-tags npm

| Dist-tag              | Contenu                                                      |
| --------------------- | ------------------------------------------------------------ |
| `latest`              | Dernière version stable de la ligne la plus récente          |
| `next`, `beta`, `rc`… | Pré-versions (identifiant du mode pré-version de Changesets) |
| `maint-<maj>.<min>`   | Correctif publié sur une ligne plus ancienne que `latest`    |

Le choix est automatique (`tools/lib/semver.ts`) : une version publiée depuis une branche de maintenance
ne déplace jamais `latest` vers une ligne plus ancienne.

## 4. Changesets

### 4.1 Quand en ajouter un

Toute PR qui modifie un fichier publié d'un paquet ajoute un changeset (`pnpm changeset`). Une PR sans
effet pour les consommateurs (refactoring, tests) ajoute un changeset vide (`pnpm changeset --empty`).
La CI refuse une PR qui modifie un paquet sans changeset.

### 4.2 Format

```markdown
---
'@mcs-ds/web': minor
'@mcs-ds/react': minor
---

feat(button): add loading state

API: New `loading` prop on `<Button>`; styles for `aria-busy="true"` on `.mcs-button`.
Tokens: Added the `--mcs-button-spinner-size` hook.
```

- **Première ligne** : `type(portée)!: description`, avec les types `feat` (nouveauté), `improve`
  (amélioration d'un existant), `fix`, `perf`, `deprecate`, `revert`, `docs`.
- **Lignes étiquetées** (facultatives, sauf `Migration:` pour une rupture) :
  - `API:` changement de l'API publique ;
  - `Tokens:` tokens ou hooks ajoutés, modifiés ou dépréciés ;
  - `Migration:` étapes pour les consommateurs ;
  - `Known issue:` régression connue.
- Une rupture porte `!` **et** un niveau `major` (ou `minor` avant 1.0) **et** une section `Migration:`.

Ces règles sont vérifiées par `pnpm check:changesets` (`tools/lib/changesets.ts`), en local et en CI.

### 4.3 Pourquoi Changesets

| Outil            | Modèle                                     | Raison du choix                                                                                         |
| ---------------- | ------------------------------------------ | ------------------------------------------------------------------------------------------------------- |
| **Changesets**   | Intentions écrites et relues en PR         | Niveau de version explicite par paquet ; texte destiné aux consommateurs ; groupes fixes ; pré-versions |
| semantic-release | Version déduite des commits                | Publication à chaque merge, monorepo mal supporté, notes égales à la qualité des commits                |
| release-please   | Version déduite des commits, PR de release | Bon, mais un commit qui touche trois paquets produit la même note pour les trois                        |

Les Conventional Commits et les changesets ne font pas doublon : les premiers décrivent l'historique pour
les développeurs, les seconds décrivent la release pour les consommateurs. La CI vérifie leur cohérence
sur le seul point critique : une rupture doit être déclarée des deux côtés.

## 5. Types de release

| Type                          | Origine                           | Commande ou déclencheur                                                                 |
| ----------------------------- | --------------------------------- | --------------------------------------------------------------------------------------- |
| Release courante              | `main`                            | Merge de la PR « version packages » (à la demande ou train hebdomadaire)                |
| Pré-version (alpha, beta, rc) | `main`, en mode pré-version       | `pnpm changeset pre enter beta`, puis releases normales, puis `pnpm changeset pre exit` |
| Maintenance (LTS)             | `release/<majeure>.x`             | Merge de la PR de version sur cette branche                                             |
| Hotfix                        | `main` ou `release/<maj>.<min>.x` | Section 9                                                                               |

## 6. Pipeline de release (`release.yml`)

1. **Vérification** : réexécution complète de `ci.yml` sur le commit exact, contrôles conditionnels
   inclus. Rien n'est publié si un contrôle échoue.
2. **Changesets** (`changesets/action`) :
   - s'il reste des changesets : création ou mise à jour de la PR de version via
     `pnpm release:version` ;
   - sinon : `pnpm release:publish`, qui ne publie que les versions absentes de npm.
3. **Publication** (`tools/bin/release-publish.ts`) :
   - refus si `docs/releases/v<version>.md` n'existe pas ;
   - choix du dist-tag ;
   - `changeset publish` : publication npm et tags par paquet (`@mcs-ds/web@1.4.0`) ;
   - tag système annoté `v<version>` et release GitHub dont le corps est la note de release.
4. **Retour sur `main`** (branches de maintenance) : ouverture automatique de la PR
   `chore(release): merge back v<version>`.
5. **Documentation** : déploiement de l'atelier (puis du site), avec un fichier `version.json` (version,
   commit, date, lien vers la note).

### Reproductibilité et secrets

- Node fixé par `.nvmrc`, pnpm par le champ `packageManager`, dépendances par `pnpm install --frozen-lockfile`.
- Actions épinglées par SHA de commit.
- **Aucun secret npm** : publication par **trusted publishing** (OIDC, GA depuis juillet 2025) ;
  provenance générée automatiquement pour un dépôt public. Comme aucun jeton n'existe, un échec de
  l'échange OIDC fait échouer la publication au lieu de retomber silencieusement sur un jeton.
- Environnement GitHub `npm` : il trace chaque publication et peut exiger une approbation manuelle.
- Les seuls secrets sont gérés par GitHub, jamais dans le dépôt : la clé privée de l'application de
  release (qui produit un jeton éphémère par exécution) et le `GITHUB_TOKEN` éphémère.

### Tester le processus

- Les scripts de release sont testés unitairement (`tools/lib/*.test.ts`).
- `release.yml` accepte un déclenchement manuel `dry-run` : génération de la note sans écriture,
  publication simulée (`--dry-run`).
- Avant la première publication réelle : pré-version d'un paquet sentinelle (hypothèse H8).

## 7. Notes de release : obligatoires à chaque publication

Aucune publication n'est terminée sans note de release ; le script de publication **refuse** de publier
sans elle.

### 7.1 Deux niveaux

| Niveau                  | Public                        | Fichier                                         | Contenu                                                                                       |
| ----------------------- | ----------------------------- | ----------------------------------------------- | --------------------------------------------------------------------------------------------- |
| **Changelog technique** | Développeurs, mainteneurs     | [`CHANGELOG.md`](../../CHANGELOG.md) (racine)   | Chaque changeset, par paquet, avec son type, son commit et sa PR                              |
| **Note de release**     | Utilisateurs du design system | `docs/releases/v<version>.md` et release GitHub | Vue orientée usage : nouveautés, ruptures, migration, tokens, composants, régressions connues |

Les deux sont générés depuis les changesets par `pnpm release:version` au moment de la PR de version,
qui est le lieu de relecture et d'enrichissement (ajouter un contexte, compléter « Known Regressions »).
Les changelogs par paquet de Changesets sont désactivés pour ne pas dupliquer cette information.

### 7.2 Format

```markdown
# Release 1.4.0

- **Date:** 2026-10-30
- **Type:** MINOR
- **Packages:** `@mcs-ds/tokens@1.4.0`, `@mcs-ds/web@1.4.0`, `@mcs-ds/react@1.4.0`

## Breaking Changes

None.

## Migration

No migration required.

## Features

- **button:** Add loading state. (#123)

## Improvements

- **dialog:** Improve keyboard navigation. (#126)

## Performance

- **tokens:** Reduce generated CSS size. (#128)

## Fixes

- **dialog:** Correct focus restoration. (#127)

## Tokens

- Added the `--mcs-button-spinner-size` hook.

## Components

- **button:** 1 feature
- **dialog:** 1 improvement, 1 fix

## Public API

- New `loading` prop on `<Button>`; styles for `aria-busy="true"` on `.mcs-button`.

## Known Regressions

None known.

## Packages

| Package          | Version | Bump  |
| ---------------- | ------- | ----- |
| `@mcs-ds/react`  | 1.4.0   | minor |
| `@mcs-ds/tokens` | 1.4.0   | minor |
| `@mcs-ds/web`    | 1.4.0   | minor |
```

Sections toujours présentes : version, date, type, ruptures, migration, nouveautés, améliorations,
performance, corrections, tokens, composants, API publique, régressions connues, paquets. Les sections
« Deprecations », « Reverts » et « Documentation » apparaissent si elles ont du contenu.

## 8. Tags et releases GitHub

| Tag                          | Créé par                       | Usage                                                                             |
| ---------------------------- | ------------------------------ | --------------------------------------------------------------------------------- |
| `@mcs-ds/<paquet>@<version>` | `changeset publish`            | Traçabilité par paquet                                                            |
| `v<version>`                 | `tools/bin/release-publish.ts` | Version du système ; point de départ des branches de maintenance ; release GitHub |

Les tags sont protégés contre la suppression et la réécriture (ruleset `version-tags`).

## 9. Hotfix

### 9.1 Arbre de décision

```text
Anomalie critique en production (bug template, sévérité « critique »)
│
├── main ne contient que des changements publiables en corrective, ou rien ?
│   └── Oui ──► hotfix/<description> depuis main ──► PR vers main ──► release corrective normale
│
└── Non (main contient des nouveautés non publiables maintenant)
    └── release/<maj>.<min>.x existe ? sinon : git switch -c release/<maj>.<min>.x v<version>
        └── hotfix/<description> depuis cette branche ──► PR vers release/<maj>.<min>.x
            ──► release corrective depuis la branche ──► PR de retour vers main (automatique)
```

### 9.2 Procédure

| Étape                         | Action                                                                                                                                                                    | Contrôle                               |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------- |
| 1. Identifier                 | Ticket « Bug » avec sévérité critique ; un mainteneur confirme et décide du hotfix                                                                                        | Ticket                                 |
| 2. Brancher                   | Selon l'arbre ci-dessus ; `git switch -c hotfix/<description> <base>`                                                                                                     | Nom de branche vérifié                 |
| 3. Corriger                   | Correctif minimal, test de non-régression qui échoue avant le correctif, changeset `fix` de niveau `patch`                                                                | Revue                                  |
| 4. Tests prioritaires         | CI complète (elle doit rester sous dix minutes : aucun contrôle n'est sauté)                                                                                              | `ci-ok`, `pr-checks`                   |
| 5. Valider                    | Une approbation de mainteneur (CODEOWNER) ; PR étiquetée `hotfix`                                                                                                         | Ruleset                                |
| 6. Publier la corrective      | Merge de la PR de version générée sur la branche cible                                                                                                                    | `release.yml`                          |
| 7. Tagger                     | Automatique : tags par paquet et `v<version>`                                                                                                                             | Ruleset des tags                       |
| 8. Publier la note de release | Automatique : note générée dans la PR de version, publiée en release GitHub                                                                                               | Refus de publication sans note         |
| 9. Réintégrer                 | Depuis `main` : rien à faire. Depuis une branche de maintenance : PR de retour ouverte automatiquement, à merger. Pour une ligne LTS plus ancienne : `git cherry-pick -x` | PR de retour ouverte par `release.yml` |

### 9.3 Exercice

Une fois par trimestre, la procédure est jouée à blanc : branche de maintenance depuis le dernier tag,
correctif factice, déclenchement manuel de `release.yml` en `dry-run`. Les écarts constatés corrigent ce
document.

## 10. Déploiement de la documentation

| Élément     | Règle                                                                                                                |
| ----------- | -------------------------------------------------------------------------------------------------------------------- |
| Quoi        | Atelier (`apps/workbench`) en phase 2, site public en phase 3                                                        |
| Quand       | Après chaque publication réussie                                                                                     |
| Où          | GitHub Pages (environnement `github-pages`, qui trace chaque déploiement)                                            |
| Traçabilité | `version.json` (version, commit, date, lien vers la note) servi avec le site ; version affichée dans le pied de page |
| Versions    | Une documentation par version majeure maintenue                                                                      |

Le job de déploiement ne s'exécute que si l'application de documentation existe.

## 11. Rollback

npm interdit de republier une version et limite fortement la dépublication. Un rollback est donc une
**nouvelle publication** :

1. **Immédiat** : remettre `latest` sur la dernière version saine.

   ```sh
   npm dist-tag add @mcs-ds/web@1.4.0 latest   # pour chaque paquet du groupe
   ```

2. **Signaler** la version fautive :

   ```sh
   npm deprecate @mcs-ds/web@1.4.1 "Regression in dialog focus. Use 1.4.2."
   ```

3. **Corriger** : `git revert` en PR, puis release corrective (1.4.2).
4. **Communiquer** : note de release de la corrective (section « Fixes » et contexte) et ticket
   d'incident.
5. **Documentation** : redéploiement de la version précédente si nécessaire.

## 12. Migrations

- Chaque version majeure a un guide de migration (`docs/releases/migration-v<majeure>.md`) construit à
  partir des sections `Migration:` des changesets.
- Les renommages mécaniques (classes, attributs, tokens, props) ont un codemod.
- Les dépréciations sont livrées au moins une mineure avant la suppression (voir
  [GOVERNANCE.md](../architecture/GOVERNANCE.md)).

## 13. Avant la première publication

Procédures détaillées, sections citées : [REPOSITORY_SETUP.md](REPOSITORY_SETUP.md).

- [ ] Dépôt créé et configuré par `tools/github/configure-repository.sh` : merge, sécurité, environnements
      `npm` et `github-pages`, rulesets, mode solo (section 3).
- [ ] Application Renovate installée (section 4).
- [ ] Application GitHub de release créée et installée ; variable `RELEASE_APP_CLIENT_ID` et secret
      d'environnement `RELEASE_APP_PRIVATE_KEY` (section 5). Raison : une PR ouverte avec le `GITHUB_TOKEN`
      par défaut ne déclenche aucun workflow, donc la PR de version n'obtiendrait jamais ses statuts requis.
- [ ] Organisation npm `mcs-ds` créée (scope `@mcs-ds`, décision D-13), 2FA activée (section 6.1).
- [ ] Paquets réservés en `0.0.0` puis trusted publisher configuré par `npm trust github` ; npm exige que le
      paquet existe avant de configurer la confiance ; publication par jeton ensuite interdite (section 6.2).
- [ ] Pré-version d'un paquet sentinelle publiée de bout en bout (H8).
