# Contribuer

Merci de contribuer ! Ce guide est opérationnel : il dit **comment faire**. Les règles et leurs raisons
sont dans [`docs/engineering/`](docs/engineering/) et [`docs/architecture/`](docs/architecture/).

En participant, vous acceptez le [code de conduite](CODE_OF_CONDUCT.md).

> Phase actuelle : pilote (phase 2). Seuls les fondations minimales et les cinq composants pilotes
> (Button, champ de texte, Dialog, Tabs, Menu) sont implémentés avant le bilan du pilote.

## Langues

Documentation, issues et pull requests en français. Code, identifiants, messages de commit, changesets et
notes de release en anglais.

## 1. Installer le projet

Prérequis : Git, Node.js 24 et pnpm.

```sh
git clone <url-du-dépôt> && cd mcs-design-system
nvm use                 # lit .nvmrc (Node 24)
corepack enable         # fournit la version de pnpm fixée dans package.json
pnpm install            # dépendances et hooks Git (Husky)
```

L'installation refuse une version de Node non supportée et toute dépendance publiée depuis moins de
trois jours (protection de la supply chain, voir
[CODING_STANDARDS.md](docs/engineering/CODING_STANDARDS.md), section 7).

## 2. Configurer son environnement

- Extensions d'éditeur recommandées : ESLint, Stylelint, Prettier, EditorConfig. Activer le formatage à
  l'enregistrement avec Prettier.
- **Hooks Git dans un client graphique** (VS Code, GitHub Desktop) : si un hook ne trouve pas `node` ou
  `pnpm` (parce que nvm n'est chargé que dans le terminal), créer `~/.config/husky/init.sh` :

  ```sh
  export NVM_DIR="$HOME/.nvm"
  . "$NVM_DIR/nvm.sh"
  nvm use --silent
  ```

- Recommandé : `git config rerere.enabled true` (résolutions de conflits réutilisées).

## 3. Lancer le projet

| Commande                      | Effet                                                  |
| ----------------------------- | ------------------------------------------------------ |
| `pnpm run verify`             | Tous les contrôles de la CI, en local                  |
| `pnpm run lint`               | ESLint, Stylelint, Prettier (vérification), secretlint |
| `pnpm run format`             | Formate tous les fichiers                              |
| `pnpm run typecheck`          | Contrôle de types                                      |
| `pnpm run check:architecture` | Règles de couches et de dépendances                    |
| `pnpm run check:deadcode`     | Fichiers, exports et dépendances inutilisés            |
| `pnpm run build`              | Build de tous les paquets                              |

L'atelier (Storybook) et les commandes de paquets arrivent en phase 2.

## 4. Lancer les tests

```sh
pnpm run test:unit        # tests unitaires
pnpm run test:coverage    # avec couverture et seuils
```

Les tests en navigateur, visuels et E2E sont décrits dans
[TESTING_STRATEGY.md](docs/engineering/TESTING_STRATEGY.md).

## 5. Créer une branche

```sh
git switch main && git pull --rebase
git switch -c feature/button-loading-state
```

Types : `feature`, `fix`, `hotfix`, `chore`, `docs`. Description en kebab-case. Jamais de travail direct
sur `main` ni sur `release/*` (le hook `pre-push` et les rulesets le refusent). Détails :
[GIT_WORKFLOW.md](docs/engineering/GIT_WORKFLOW.md), section 2.

## 6. Travailler sur un composant

1. Une issue « Proposition » ou une RFC acceptée existe (nouveau composant, nouvelle variante).
2. Générer le squelette : `pnpm scaffold:component <nom> --type <A|B|C>`.
3. Compléter le **contrat** en premier (`<nom>.contract.ts`) et le faire relire (API et accessibilité).
4. Écrire le CSS, puis le comportement (types B et C), puis l'adapter React.
5. Écrire les fixtures et les tests ; vérifier la Definition of Done d'accessibilité
   ([ACCESSIBILITY.md](docs/architecture/ACCESSIBILITY.md), section 5).
6. Documenter, puis ajouter un changeset.

Les règles de chaque étape sont résumées dans `.claude/rules/` et détaillées dans
[COMPONENT_ARCHITECTURE.md](docs/architecture/COMPONENT_ARCHITECTURE.md).

## 7. Créer ou modifier un token

Suivre la procédure de [TOKENS.md](docs/architecture/TOKENS.md), section 13 (et le skill
`.claude/skills/token-change/`) : vérifier qu'aucun token existant ne convient, nommer selon la
grammaire, déclarer les contrastes, régénérer, ajouter un changeset avec une ligne `Tokens:`. Un
renommage passe par une dépréciation.

## 8. Rédiger un commit

```text
feat(button): add loading state
fix(dialog): correct focus restoration
feat(button)!: rename variant property

BREAKING CHANGE: `data-variant="ghost"` is now `data-variant="tertiary"`.
```

Le hook `commit-msg` refuse un message non conforme. Un changement visuel est un `feat` ou un `fix`,
jamais un `style`. Référence : [GIT_WORKFLOW.md](docs/engineering/GIT_WORKFLOW.md), section 7.

## 9. Ajouter un changeset

```sh
pnpm changeset            # si un paquet publié change
pnpm changeset --empty    # sinon (refactoring, tests, outillage)
pnpm run check:changesets
```

Format : [RELEASE_PROCESS.md](docs/engineering/RELEASE_PROCESS.md), section 4.

## 10. Soumettre une pull request

1. `pnpm run verify` passe en local.
2. Pousser la branche, ouvrir la PR : le titre suit Conventional Commits (il deviendra le commit sur
   `main`).
3. Remplir le template : contexte et objectif, description, impact sur l'API publique, tests réalisés et
   risques sont obligatoires.
4. La CI (`ci-ok`) et les contrôles de PR (`pr-checks`) doivent être verts ; une approbation (deux pour
   une rupture) ; conversations résolues ; merge en squash.

## 11. Effectuer une revue

- Vérifier : conformité à l'architecture, API publique et semver, accessibilité, tokens, tests utiles,
  budgets de performance, documentation.
- Préfixer les commentaires : `bloquant:`, `question:`, `suggestion:`, `détail:`.
- Première revue sous un jour ouvré.

Détails : [GIT_WORKFLOW.md](docs/engineering/GIT_WORKFLOW.md), section 10.

## 12. Publier une release (mainteneurs)

Les releases sont automatiques : chaque merge sur `main` met à jour la PR
`chore(release): version packages`. Relire la note de release générée (`docs/releases/v<version>.md`),
compléter « Known Regressions », puis merger : publication npm, tags, release GitHub et déploiement de la
documentation suivent. Simulation : lancer manuellement le workflow « Release » (dry run). Détails :
[RELEASE_PROCESS.md](docs/engineering/RELEASE_PROCESS.md).

## 13. Effectuer un hotfix (mainteneurs)

Suivre [RELEASE_PROCESS.md](docs/engineering/RELEASE_PROCESS.md), section 9 : choix de la base (`main`
ou branche de maintenance), branche `hotfix/<description>`, correctif et test de non-régression,
changeset `patch`, PR, release corrective, retour automatique sur `main`.

## Contribuer avec un agent de code

[`CLAUDE.md`](CLAUDE.md) décrit la garde de phase, les invariants, les agents spécialisés, leur périmètre
et le protocole de synchronisation. Les mêmes règles s'appliquent au code produit par un agent et au code
écrit à la main.
