# Workflow Git, pull requests et quality gates

> Statut : en vigueur dès la phase 1. Dernière mise à jour : 2026-10-30.
> Ce document décrit les règles ; les fichiers cités les font respecter. Si les deux divergent, c'est un
> bug à corriger dans la même PR.

## 1. Stratégie retenue

| Critère                          | GitFlow                                                | GitHub Flow                            | Trunk-Based Development                                        |
| -------------------------------- | ------------------------------------------------------ | -------------------------------------- | -------------------------------------------------------------- |
| Branches longues                 | `main`, `develop`, `release/*`, `hotfix/*`             | `main`                                 | `main` (et branches de release à la demande)                   |
| Intégration                      | Tardive (`develop` vers `release` vers `main`)         | Continue                               | Continue, branches de quelques jours au plus                   |
| Adapté à un paquet npm versionné | Oui, mais lourd                                        | Oui pour la dernière version seulement | Oui, avec branches de maintenance pour les anciennes versions  |
| Conflits et dérive               | Fréquents (`develop` diverge de `main`)                | Faibles                                | Faibles                                                        |
| Hotfix d'une ancienne version    | Prévu                                                  | Non prévu                              | Branche de maintenance créée depuis un tag                     |
| Compatibilité avec Changesets    | Mauvaise (les changesets se dupliquent entre branches) | Bonne                                  | **Bonne** : la PR « Version Packages » est le train de release |

**Recommandation : Trunk-Based Development**, avec des branches de travail courtes (mécanique de
GitHub Flow) et des **branches de maintenance créées seulement quand une version publiée doit être
corrigée** sans embarquer le travail en cours sur `main`.

Pourquoi pas de `develop` : Changesets accumule déjà les changements non publiés sur `main` et la PR
« Version Packages » décide du moment de la publication. Une branche `develop` ajouterait une
synchronisation permanente sans aucun bénéfice.

## 2. Branches

| Branche                         | Rôle                                                                           | Durée de vie               | Créée par                 |
| ------------------------------- | ------------------------------------------------------------------------------ | -------------------------- | ------------------------- |
| `main`                          | Tronc : toujours vert et publiable                                             | Permanente                 | —                         |
| `feature/<description>`         | Nouvelle fonctionnalité                                                        | Quelques jours             | Contributeur              |
| `fix/<description>`             | Correction non urgente                                                         | Quelques jours             | Contributeur              |
| `hotfix/<description>`          | Correction urgente d'une version publiée                                       | Quelques heures            | Mainteneur                |
| `chore/<description>`           | Outillage, CI, dépendances, refactoring sans effet visible                     | Quelques jours             | Contributeur              |
| `docs/<description>`            | Documentation uniquement                                                       | Quelques jours             | Contributeur              |
| `release/<majeure>.x`           | Maintenance d'une version majeure précédente (LTS)                             | Durée de la maintenance    | Mainteneur, depuis un tag |
| `release/<majeure>.<mineure>.x` | Correctif d'une version publiée quand `main` contient du travail non publiable | Jusqu'au retour sur `main` | Mainteneur, depuis un tag |
| `changeset-release/<base>`      | PR « Version Packages » générée par Changesets                                 | Jusqu'à la release         | Automatique               |
| `renovate/<…>`                  | Mises à jour de dépendances                                                    | Jusqu'au merge             | Automatique               |

### 2.1 Nommage

```text
<type>/<description-en-kebab-case>
feature/button-loading-state
fix/123-dialog-focus-restoration     (le numéro de ticket est optionnel)
release/1.x
release/1.4.x
```

- Types autorisés : `feature`, `fix`, `hotfix`, `chore`, `docs`, `release` (maintenance seulement).
- Description en minuscules, chiffres et tirets, 60 caractères au plus.
- Vérifié par `tools/lib/branch.ts`, au `pre-push` et dans la CI (`pr.yml`).

### 2.2 Création et suppression

- Une branche de travail part de `main` à jour ; un hotfix part de `main` ou d'une branche de maintenance
  (voir [RELEASE_PROCESS.md](RELEASE_PROCESS.md), section 9).
- Les branches sont supprimées automatiquement après merge (réglage du dépôt « Automatically delete head
  branches »).
- Une branche de travail sans activité depuis 30 jours est signalée, puis supprimée après accord de son
  auteur.
- Seuls les mainteneurs créent des branches `release/*`.

## 3. Merge

| Cible                                           | Méthode autorisée                                         | Raison                                                                     |
| ----------------------------------------------- | --------------------------------------------------------- | -------------------------------------------------------------------------- |
| `main`                                          | **Squash merge** uniquement                               | Historique linéaire ; un commit par PR ; le titre de PR devient le message |
| `release/*`                                     | **Squash merge** uniquement                               | Idem                                                                       |
| Retour d'une branche de maintenance vers `main` | Squash merge d'une PR `chore(release): merge back vX.Y.Z` | Garde l'historique linéaire de `main`                                      |

Le titre de la PR est le message de commit final : il doit respecter Conventional Commits (vérifié par
`pr.yml`).

## 4. Protection des branches

Les règles sont du code : [`.github/rulesets/`](../../.github/rulesets/), appliquées par
`tools/github/configure-repository.sh` (voir [REPOSITORY_SETUP.md](REPOSITORY_SETUP.md)).

| Règle                                        | `main`            | `release/*` | Tags `v*`, `@mcs-ds/*` |
| -------------------------------------------- | ----------------- | ----------- | ---------------------- |
| Push direct interdit (PR obligatoire)        | Oui               | Oui         | —                      |
| Approbations requises                        | 1 (2 si breaking) | 1           | —                      |
| Revue des CODEOWNERS requise                 | Oui               | Oui         | —                      |
| Approbations invalidées par un nouveau push  | Oui               | Oui         | —                      |
| Dernier push approuvé par une autre personne | Oui               | Oui         | —                      |
| Conversations résolues                       | Oui               | Oui         | —                      |
| Statuts requis : `ci-ok`, `pr-checks`        | Oui               | Oui         | —                      |
| Branche à jour avant merge                   | Oui               | Oui         | —                      |
| Historique linéaire                          | Oui               | Oui         | —                      |
| Force push et suppression interdits          | Oui               | Oui         | Oui                    |

Deux rulesets se partagent ces règles :

- `protected-branches` : PR obligatoire, statuts requis, conversations résolues, historique linéaire,
  squash, interdiction du force push et de la suppression. **Aucun contournement possible.**
- `protected-branches-review` : approbation et revue des CODEOWNERS. **Mode solo** (un seul mainteneur,
  qui ne peut pas approuver sa propre PR) : un administrateur peut contourner cette seule exigence, et
  uniquement en mergeant une PR dont la CI est verte. Le contournement disparaît dès qu'un second
  mainteneur arrive ([REPOSITORY_SETUP.md](REPOSITORY_SETUP.md), section 7).

Un garde local (`pre-push`) refuse aussi le push direct vers une branche protégée, pour un retour plus
rapide.

## 5. Conflits et synchronisation

- On se resynchronise sur `main` par **rebase** (`git pull --rebase origin main`), jamais en mergeant
  `main` dans la branche.
- `git config rerere.enabled true` est recommandé pour rejouer les résolutions déjà faites.
- Conflit sur `pnpm-lock.yaml` : prendre la version de `main`, puis relancer `pnpm install`. Ne jamais
  résoudre un lockfile à la main.
- Les changesets ne sont jamais en conflit (un fichier par changement).
- Synchronisation entre branches longues : un correctif fait sur `main` est **cherry-pické** vers une
  branche de maintenance (`git cherry-pick -x`) ; un correctif fait sur une branche de maintenance
  revient sur `main` par la PR de retour ouverte automatiquement après la release.

## 6. Rollback

| Situation                                   | Action                                                                                                                                   |
| ------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| Commit fautif sur `main`, pas encore publié | PR `revert: <titre d'origine>` (`git revert <sha>`), jamais de réécriture d'historique                                                   |
| Version npm fautive                         | Procédure de [RELEASE_PROCESS.md](RELEASE_PROCESS.md), section 11 : remise du tag `latest` sur la version saine, dépréciation, correctif |
| Documentation fautive                       | Redéploiement de la version précédente                                                                                                   |

## 7. Messages de commit

Format [Conventional Commits](https://www.conventionalcommits.org/) :

```text
<type>(<scope>)<!>: <description>

<corps optionnel : le pourquoi, pas le comment>

<footers optionnels>
BREAKING CHANGE: <description de la rupture et de la migration>
Refs: #123
```

| Type       | Usage                                                                                |
| ---------- | ------------------------------------------------------------------------------------ |
| `feat`     | Nouvelle capacité visible par les consommateurs                                      |
| `fix`      | Correction d'un comportement visible                                                 |
| `perf`     | Amélioration de performance                                                          |
| `refactor` | Restructuration sans changement de comportement                                      |
| `docs`     | Documentation uniquement                                                             |
| `style`    | **Formatage du code** (espaces, points-virgules), pas le style visuel des composants |
| `test`     | Tests uniquement                                                                     |
| `build`    | Build, dépendances, empaquetage                                                      |
| `ci`       | Workflows et configuration de CI                                                     |
| `chore`    | Maintenance diverse                                                                  |
| `revert`   | Annulation d'un commit                                                               |

Points d'attention :

- Un changement **visuel** d'un composant est un `feat` ou un `fix`, jamais un `style`.
- Portée en kebab-case : un composant (`button`), un paquet (`tokens`), un domaine (`ci`, `release`).
- Description à l'impératif, en anglais, sans majuscule initiale ni point final ; 100 caractères au plus
  pour l'en-tête.
- **Breaking change** : `!` après la portée (`feat(button)!: rename variant property`) et/ou un footer
  `BREAKING CHANGE: …`. Une ligne d'en-tête qui commence par `BREAKING CHANGE:` n'est **pas** un message
  valide : c'est un footer.

Exemples valides :

```text
feat(button): add loading state
fix(dialog): correct focus restoration
perf(tokens): reduce generated CSS size
feat(button)!: rename variant property

BREAKING CHANGE: `data-variant="ghost"` is now `data-variant="tertiary"`.
```

Vérifié par commitlint (`commitlint.config.js`) au hook `commit-msg` et sur le titre de chaque PR.

## 8. Hooks Git

Installés automatiquement par `pnpm install` (script `prepare`, Husky). Ils donnent un retour rapide ;
**la CI reste l'autorité**, car un hook peut être contourné (`--no-verify`).

| Hook         | Contrôles                                                                                                                                                                    | Raison                                                                          | Durée visée |
| ------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------- | ----------- |
| `pre-commit` | `git diff --cached --check` (marqueurs de conflit, espaces en fin de ligne) ; lint-staged sur les fichiers indexés : ESLint `--fix`, Stylelint `--fix`, Prettier, secretlint | Ne jamais committer un fichier mal formaté, un marqueur de conflit ou un secret | < 10 s      |
| `commit-msg` | commitlint                                                                                                                                                                   | Historique exploitable ; titres de PR cohérents                                 | < 1 s       |
| `pre-push`   | Nom de branche ; refus du push direct vers `main` et `release/*` ; `typecheck` ; tests unitaires                                                                             | Ne pas pousser un code qui ne compile pas ; garde local des branches protégées  | < 60 s      |

Délégués à la CI parce que trop longs : tests en navigateur, tests visuels, build complet, contrôles
d'architecture, code mort.

Contourner un hook (`--no-verify`, `HUSKY=0`) est toléré en local pour un commit de travail, jamais pour
contourner une règle : la CI bloquera le merge.

## 9. Pull requests

### 9.1 Contenu obligatoire

Le template [`.github/PULL_REQUEST_TEMPLATE.md`](../../.github/PULL_REQUEST_TEMPLATE.md) impose les
sections ; `pr.yml` vérifie que les sections obligatoires sont présentes et remplies :

- titre conforme à Conventional Commits ;
- **contexte et objectif** ;
- **description du changement** ;
- décisions techniques ;
- **impact sur l'API publique** ;
- changements visuels ;
- tokens ;
- accessibilité ;
- **tests réalisés** ;
- **risques identifiés** ;
- migration.

Les sections en gras doivent contenir du texte (« Aucun » est une réponse valide).

### 9.2 Taille

Moins de 400 lignes modifiées hors fichiers générés, de préférence. Au-delà, découper : contrat d'abord,
puis styles, comportement, adapter.

### 9.3 Cycle

```text
brouillon ──► prête pour revue ──► revue ──► modifications ──► approbation ──► CI verte ──► squash merge
```

## 10. Revue de code

### 10.1 Règles

- Aucune PR n'est mergée sans approbation, CI verte et conversations résolues.
- Le dernier push doit être approuvé par une autre personne que son auteur.
- Délai de première revue visé : un jour ouvré.
- Commentaires préfixés pour lever l'ambiguïté : `bloquant:`, `question:`, `suggestion:`, `détail:`.

### 10.2 Nombre de relecteurs selon la criticité

| Changement                                                | Approbations | Relecteurs requis                         |
| --------------------------------------------------------- | ------------ | ----------------------------------------- |
| Documentation, outillage local                            | 1            | Un mainteneur                             |
| Correction, amélioration sans changement d'API            | 1            | CODEOWNER de la zone                      |
| Ajout à l'API publique (variante, token, hook, composant) | 1            | CODEOWNER et revue d'API (mainteneur)     |
| Contrat, élément de comportement, accessibilité           | 1            | CODEOWNER, dont le référent accessibilité |
| Workflows CI/CD, release, rulesets                        | 1            | Mainteneur                                |
| **Breaking change**                                       | **2**        | Deux mainteneurs ; vérifié par `pr.yml`   |

En mode solo, ces approbations sont impossibles (GitHub interdit d'approuver sa propre PR). La variable
de dépôt `BREAKING_CHANGE_APPROVALS` vaut alors `0`, et la revue repose sur la checklist de la PR et sur
les contrôles automatiques. Elle repasse à `2` avec le second mainteneur.

### 10.3 Ce que la revue vérifie

- Conformité à l'architecture (couches, contrats, natif d'abord)
- API publique : nommage, cohérence, classification semver, changeset
- Accessibilité : clavier, nom accessible, états
- Tokens : nécessité, nommage, contrastes
- Tests : ils protègent le comportement public, pas l'implémentation
- Performance : budgets
- Documentation et notes pour la release

### 10.4 Procédure pour un breaking change

1. RFC acceptée (ou ADR si le changement est structurel).
2. Dépréciation livrée dans une version mineure antérieure, avec avertissement en développement.
3. PR avec titre `type(scope)!: …`, changeset `major` contenant une section `Migration:`.
4. Codemod si le changement est mécanique.
5. Deux approbations de mainteneurs (contrôle automatique de `pr.yml`).
6. Entrée dans le guide de migration de la version majeure.

## 11. Quality gates

```text
PULL REQUEST
    │
    ├── Hygiène de PR (pr.yml) ─────── titre · branche · sections du template · changesets · approbations
    │
    ├── Lint ───────────────────────── ESLint · Stylelint · Prettier · secretlint · actionlint
    ├── TypeScript ─────────────────── typecheck
    ├── Tests unitaires ────────────── Vitest et couverture
    ├── Architecture ───────────────── dependency-cruiser · Knip
    ├── Build ──────────────────────── build de tous les paquets
    │      (ces jobs tournent en parallèle)
    │
    ├── Conditionnels ──────────────── tests en navigateur et accessibilité (si un paquet change)
    │                                   tests visuels (si CSS, tokens ou fixtures changent)
    │                                   vérification des paquets : publint, attw, tailles (si un paquet change)
    │
    ├── ci-ok ──────────────────────── agrège tous les jobs ci-dessus
    ├── Revue de code ──────────────── 1 ou 2 approbations, CODEOWNERS
    ▼
MERGE (squash)
```

| Gate                                 | Statut                                 | Justification                                                                               | Défini dans                           |
| ------------------------------------ | -------------------------------------- | ------------------------------------------------------------------------------------------- | ------------------------------------- |
| Titre de PR (commitlint)             | Obligatoire                            | Le titre devient le message de commit sur `main`                                            | `pr.yml`                              |
| Nom de branche                       | Obligatoire                            | Lisibilité, automatisations par préfixe                                                     | `pr.yml`, `tools/lib/branch.ts`       |
| Sections du template                 | Obligatoire                            | Contexte, impacts et risques connus avant la revue                                          | `pr.yml`, `tools/lib/pull-request.ts` |
| Changesets (présence et format)      | Obligatoire si un paquet publié change | Pas de changement publié sans version ni note de release                                    | `pr.yml`, `tools/lib/changesets.ts`   |
| Approbations pour un breaking change | Obligatoire si breaking                | Impact sur tous les consommateurs                                                           | `pr.yml`                              |
| ESLint, Stylelint, Prettier          | Obligatoire                            | Qualité et cohérence ; règles d'architecture CSS                                            | `ci.yml`                              |
| secretlint                           | Obligatoire                            | Aucun secret dans le dépôt                                                                  | `ci.yml`                              |
| actionlint                           | Obligatoire                            | Les workflows de release sont rarement exécutés : leurs erreurs doivent être trouvées avant | `ci.yml`                              |
| TypeScript                           | Obligatoire                            | Correction des types, API publique                                                          | `ci.yml`                              |
| Tests unitaires et couverture        | Obligatoire                            | Comportement public des modules                                                             | `ci.yml`, `vitest.config.ts`          |
| Architecture (dependency-cruiser)    | Obligatoire                            | Frontières de couches, cycles                                                               | `ci.yml`, `.dependency-cruiser.cjs`   |
| Code mort (Knip)                     | Obligatoire                            | Fichiers, exports et dépendances inutilisés                                                 | `ci.yml`, `knip.json`                 |
| Build                                | Obligatoire                            | Ce qui est mergé doit pouvoir être publié                                                   | `ci.yml`                              |
| Tests en navigateur et accessibilité | Conditionnel                           | Seulement si du code de composant ou d'adapter change                                       | `ci.yml` (job `scope`)                |
| Tests visuels                        | Conditionnel                           | Seulement si CSS, tokens ou fixtures changent                                               | `ci.yml` (job `scope`)                |
| Vérification des paquets et tailles  | Conditionnel                           | Seulement si un paquet change                                                               | `ci.yml` (job `scope`)                |
| Revue de code                        | Obligatoire                            | Jugement humain : architecture, API, accessibilité                                          | Rulesets, CODEOWNERS                  |

Les contrôles conditionnels s'exécutent toujours intégralement sur `main` et avant une release.

## 12. Workflows de CI

| Workflow      | Déclencheurs                                                             | Contenu                                                                                                                                          |
| ------------- | ------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| `ci.yml`      | PR, push sur `main` et `release/*`, merge queue, appel par `release.yml` | Quality gates techniques, agrégés dans `ci-ok`                                                                                                   |
| `pr.yml`      | Ouverture, modification et synchronisation de PR ; soumission de revue   | Hygiène de PR, agrégée dans `pr-checks`                                                                                                          |
| `release.yml` | Push sur `main` et `release/*`, déclenchement manuel (dry run)           | Vérification complète, PR « Version Packages », publication npm, tags, release GitHub, notes, retour sur `main`, déploiement de la documentation |

État actuel : sans paquet, les jobs conditionnels sont ignorés et la release ne publie rien ; tout
s'active automatiquement avec les premiers paquets.

La PR de version et la PR de retour sur `main` sont ouvertes avec le jeton éphémère d'une application
GitHub : une PR ouverte avec le `GITHUB_TOKEN` par défaut ne déclencherait pas les workflows requis.

Règles de sécurité des workflows : permissions minimales par job, actions épinglées par SHA de commit
(mises à jour par Renovate), aucune donnée non fiable (titre, corps, nom de branche) interpolée dans un
script, aucun secret npm (publication par OIDC).
