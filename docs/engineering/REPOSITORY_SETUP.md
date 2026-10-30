# Mise en place du dépôt et des services

> Statut : en vigueur. Dernière mise à jour : 2026-10-30.
> Procédures à exécuter **une seule fois** par un mainteneur. Les réglages GitHub sont du code
> (`tools/github/`) : les rejouer est sans danger.

Ordre recommandé : sections 1 à 4 maintenant, section 5 au moment de la première publication (pilote).

## 1. Prérequis locaux

```sh
nvm use                      # Node 24 (le Node par défaut du shell peut être plus ancien)
corepack enable              # pnpm à la version fixée dans package.json
brew install gh              # CLI GitHub
gh auth login                # GitHub.com, HTTPS, authentification par navigateur
```

## 2. Créer le dépôt GitHub

**Dépôt public recommandé.** Sur un compte GitHub gratuit, les rulesets ne s'appliquent qu'aux dépôts
publics ; la provenance npm et le secret scanning gratuit l'exigent aussi. Un dépôt privé demande
GitHub Pro ou Team pour que les règles soient réellement appliquées.

```sh
cd mcs-design-system
pnpm install                 # installe les hooks
pnpm run verify              # tout doit être vert

git add -A
git commit -m "chore: bootstrap architecture and engineering governance"

gh repo create macsim1982/mcs-design-system --public --source=. --remote=origin \
  --description "Platform-first web design system: HTML/CSS core, DTCG tokens, light-DOM behaviors"

# Premier push uniquement : le hook pre-push refuse (à juste titre) les push directs sur main.
# C'est l'unique exception, avant l'activation des rulesets.
git push --no-verify -u origin main
```

Le hook `pre-commit` vérifie tous les fichiers indexés : le premier commit prend environ une minute.

## 3. Configurer le dépôt

```sh
sh tools/github/configure-repository.sh macsim1982/mcs-design-system
```

Le script applique :

| Réglage        | Valeur                                                                                             |
| -------------- | -------------------------------------------------------------------------------------------------- |
| Merge          | Squash uniquement ; titre et corps de la PR deviennent le commit ; branches supprimées après merge |
| Sécurité       | Signalement privé de vulnérabilités ; secret scanning et push protection                           |
| GitHub Actions | Jeton en lecture seule par défaut ; les workflows n'approuvent jamais de PR                        |
| Environnements | `npm` (publication depuis `main` et `release/*`), `github-pages` (`main` seulement)                |
| Variable       | `BREAKING_CHANGE_APPROVALS=0` (mode solo, section 7)                                               |
| Rulesets       | `protected-branches`, `protected-branches-review`, `version-tags`                                  |

Vérification : onglet **Settings › Rules › Rulesets** du dépôt, puis ouvrir une PR de test.

## 4. Installer Renovate

1. Ouvrir <https://github.com/apps/renovate> et cliquer sur **Install** (ou **Configure**).
2. Choisir le compte `macsim1982`, puis **Only select repositories** › `mcs-design-system`.
3. Accepter la connexion au tableau de bord Mend si elle est demandée (application hébergée gratuite).
4. La configuration existe déjà (`.github/renovate.json`) : Renovate l'utilise directement et ouvre une
   issue « Dependency Dashboard ». Les PR de mises à jour arrivent le lundi matin, sauf les alertes de
   vulnérabilité, traitées immédiatement.

Chaque PR Renovate passe par la CI. Branches `renovate/*`, titres `chore(deps): …` et mises à jour des
devDependencies de la racine sont compatibles avec toutes les vérifications ; aucun changeset n'est
requis.

## 5. Application GitHub de release

**Pourquoi** : une PR ouverte avec le `GITHUB_TOKEN` par défaut ne déclenche aucun workflow. La PR
« Version Packages » n'obtiendrait donc jamais `ci-ok` ni `pr-checks`, et ne pourrait pas être mergée.
L'application fournit un jeton éphémère (une heure) à chaque exécution ; aucun jeton longue durée n'est
stocké.

1. GitHub › photo de profil › **Settings** › **Developer settings** › **GitHub Apps** › **New GitHub App**.
2. Renseigner :
   - **GitHub App name** : `mcs-ds-release` (le nom doit être unique sur GitHub) ;
   - **Homepage URL** : `https://github.com/macsim1982/mcs-design-system` ;
   - **Webhook** : décocher **Active** ;
   - **Repository permissions** : **Contents** « Read and write », **Pull requests** « Read and write »
     (Metadata reste en lecture seule) ;
   - **Where can this GitHub App be installed?** : **Only on this account**.
3. **Create GitHub App**, puis noter le **Client ID** affiché en haut de la page.
4. **Generate a private key** : un fichier `.pem` est téléchargé.
5. Menu **Install App** › compte `macsim1982` › **Only select repositories** › `mcs-design-system`.
6. Enregistrer l'identifiant et la clé (l'environnement `npm` doit exister : section 3 faite) :

   ```sh
   gh variable set RELEASE_APP_CLIENT_ID --repo macsim1982/mcs-design-system --body "<Client ID>"
   gh secret set RELEASE_APP_PRIVATE_KEY --repo macsim1982/mcs-design-system --env npm \
     < ~/Downloads/mcs-ds-release.*.private-key.pem
   rm ~/Downloads/mcs-ds-release.*.private-key.pem   # ou le ranger dans un gestionnaire de mots de passe
   ```

## 6. npm et trusted publishing

### 6.1 Maintenant

1. Compte npm avec **2FA activée** (Account › Two-Factor Authentication ; clé de sécurité ou
   application d'authentification). Le 2FA est obligatoire pour `npm trust`.
2. Créer l'organisation : <https://www.npmjs.com> › photo de profil › **Add Organization** › nom
   `mcs-ds` › offre gratuite (paquets publics illimités). Posséder l'organisation réserve tout le scope
   `@mcs-ds`. Si le nom était pris, choisir un autre scope et remplacer `@mcs-ds/` dans le dépôt.

### 6.2 À la première publication (pilote)

npm n'accepte de configurer un trusted publisher que pour un paquet **qui existe déjà** (documentation de
`npm trust`). Chaque paquet doit donc être créé une fois à la main, puis plus jamais.

1. Créer chaque paquet avec une version de réservation `0.0.0`, depuis un dossier temporaire :

   ```sh
   npm login    # navigateur et 2FA
   for name in tokens web react; do
     dir=$(mktemp -d)
     printf '{ "name": "@mcs-ds/%s", "version": "0.0.0", "description": "Name reservation, do not use." }\n' \
       "$name" > "$dir/package.json"
     (cd "$dir" && npm publish --access public)
     npm deprecate "@mcs-ds/$name@0.0.0" "Name reservation, do not use."
   done
   ```

2. Déclarer le workflow de release comme seul éditeur autorisé (npm 11.15 ou plus) :

   ```sh
   for name in tokens web react; do
     npm trust github "@mcs-ds/$name" --repo macsim1982/mcs-design-system \
       --file release.yml --env npm --allow-publish --yes
   done
   npm trust list @mcs-ds/web
   ```

3. Sur npmjs.com, pour chaque paquet : **Settings** › **Publishing access** › **Require two-factor
   authentication and disallow tokens**. Plus aucun jeton ne peut publier : seul `release.yml`, dans
   l'environnement `npm`, le peut, avec provenance.
4. Faire `npm logout` sur le poste.

Les versions suivantes (0.1.0 et au-delà) sont publiées exclusivement par `release.yml`. Un échec de
l'échange OIDC fait échouer la publication : aucun jeton de secours n'existe.

## 7. Mode solo et passage en mode équipe

GitHub interdit d'approuver sa propre PR. Tant qu'il n'y a qu'un mainteneur :

- le ruleset `protected-branches` (sans contournement possible) impose PR, CI verte (`ci-ok`,
  `pr-checks`), conversations résolues, historique linéaire et squash ;
- le ruleset `protected-branches-review` (une approbation et CODEOWNERS) peut être contourné par un
  administrateur, **uniquement lors du merge d'une PR** ; jamais pour un push direct ni pour une CI rouge ;
- `BREAKING_CHANGE_APPROVALS=0` désactive l'exigence de deux approbations pour une rupture. La revue
  repose alors sur la checklist de la PR et sur les contrôles automatiques.

Dès qu'un second mainteneur rejoint le projet :

1. retirer `bypass_actors` de `.github/rulesets/protected-branches-review.json` et relancer
   `sh tools/github/apply-rulesets.sh` ;
2. `gh variable set BREAKING_CHANGE_APPROVALS --body 2` (ou supprimer la variable : la valeur par défaut
   est 2) ;
3. ajouter ses équipes ou son compte dans `.github/CODEOWNERS`.
