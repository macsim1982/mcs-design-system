# Stratégie de tests

> Statut : en vigueur dès la phase 1 pour l'outillage ; activée composant par composant à partir du
> pilote. Dernière mise à jour : 2026-10-30.

## 1. Principes

1. **Tester le comportement public et les contrats**, pas l'implémentation : ce qu'un consommateur voit
   (DOM, accessibilité, événements, rendu) et ce que le contrat promet.
2. **De vrais navigateurs pour l'interface** : jsdom et happy-dom n'implémentent pas fidèlement les custom
   elements, `ElementInternals`, `popover`, `<dialog>`, le focus ni la mise en page.
3. **Chaque comportement est testé au niveau le moins coûteux qui le prouve**, et une seule fois.
4. **Pas d'objectif de 100 % de couverture** : la couverture est un indicateur de zones oubliées, pas un
   but.
5. **Déterminisme** : pas de test qui dépend de l'heure, du réseau ou d'une animation en cours.

## 2. Niveaux

| Niveau            | Ce qui est testé                                                                                               | Outil                                            | Fichiers                  | Où                         |
| ----------------- | -------------------------------------------------------------------------------------------------------------- | ------------------------------------------------ | ------------------------- | -------------------------- |
| **Unitaire**      | Fonctions pures : contrôleurs de comportement, génération de tokens, outillage                                 | Vitest (Node)                                    | `*.test.ts`               | À côté du code             |
| **Composant**     | Un composant dans un vrai navigateur : DOM, états, clavier, focus, événements                                  | Vitest, mode navigateur (Playwright)             | `*.browser.test.ts`       | Dossier du composant       |
| **Intégration**   | Adapter et élément ensemble : rendu React, mode contrôlé, rendu serveur et upgrade ; tests de contrat partagés | Vitest, mode navigateur                          | `*.browser.test.tsx`      | `packages/react`           |
| **Accessibilité** | axe-core sur chaque fixture et chaque état ; carte clavier ; forced colors ; mouvement réduit                  | axe-core dans les tests composant ; Playwright   | Dans les tests composant  | Dossier du composant       |
| **Visuel**        | Rendu pixel des fixtures : états, thèmes, modes, forced colors                                                 | Playwright Test (`toHaveScreenshot`) dans Docker | `*.visual.test.ts`        | Dossier du composant       |
| **E2E**           | Les paquets **publiés** (tarballs) dans des applications réelles : HTML statique, Next.js, Vite                | Playwright Test                                  | `*.e2e.test.ts`           | `apps/consumers/*`         |
| **Types**         | API publique des types : props, unions, augmentation                                                           | Vitest (`typecheck`)                             | `*.test-d.ts`             | `packages/react`, contrats |
| **Build**         | Validité des paquets, résolution des types, budgets, import dans Node sans DOM (SSR)                           | publint, attw, size-limit, test d'import Node    | Configuration des paquets | CI                         |

Ce qui n'est **pas** testé deux fois :

- le rendu visuel n'est pas vérifié dans les tests composant (c'est le rôle des tests visuels) ;
- le comportement clavier n'est pas re-testé en E2E (déjà couvert au niveau composant) ;
- le CSS n'a pas de test unitaire : il est couvert par les tests visuels et par les tests de contrat
  (chaque variante déclarée a un sélecteur).

## 3. Choix des outils

| Outil                       | Décision                     | Raison                                                                                                                                                  |
| --------------------------- | ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Vitest 5                    | Retenu                       | Un seul runner pour Node et les vrais navigateurs (Chromium, Firefox, WebKit via Playwright) ; rapide ; typecheck intégré                               |
| Playwright                  | Retenu                       | Fournisseur de navigateurs de Vitest ; tests visuels en Docker ; E2E ; émulation de `forced-colors` et `prefers-reduced-motion`                         |
| axe-core                    | Retenu                       | Référence des règles d'accessibilité automatisables                                                                                                     |
| Testing Library             | Non retenu                   | Les locators de Vitest (`page.getByRole`) et ses événements réels couvrent le besoin                                                                    |
| Outils de test de Storybook | Non retenus                  | Les fixtures sont testées directement ; Storybook reste un atelier                                                                                      |
| Chromatic                   | Non retenu au départ         | Captures Playwright versionnées dans le dépôt, sans service externe. Argos ou Chromatic restent une option si une interface de revue devient nécessaire |
| jsdom, happy-dom            | Non retenus pour l'interface | Implémentations partielles des APIs dont dépend le design system                                                                                        |

## 4. Organisation et nommage

```text
packages/web/src/components/tabs/
├── tabs.fixtures.ts           exemples nommés, partagés par l'atelier, les tests et la documentation
├── tabs.browser.test.ts       comportement, clavier, accessibilité
└── tabs.visual.test.ts        captures
packages/react/src/
├── tabs.browser.test.tsx      intégration et tests de contrat partagés
└── tabs.test-d.ts             types publics
tools/lib/
└── branch.test.ts             unitaire
```

Nommage des tests : `describe('<composant>')`, puis le domaine, puis le comportement attendu formulé
comme une phrase.

```ts
describe('tabs', () => {
  describe('keyboard', () => {
    it('moves focus to the next tab on ArrowRight and wraps at the end', async () => {});
  });
});
```

## 5. Ce qui est testé selon le type de composant

| Type | Composant (navigateur)                                                                         | Accessibilité                                | Visuel                         | Intégration React                                                    |
| ---- | ---------------------------------------------------------------------------------------------- | -------------------------------------------- | ------------------------------ | -------------------------------------------------------------------- |
| A    | Contrat : chaque variante a un sélecteur, la valeur par défaut équivaut à l'absence d'attribut | axe sur chaque fixture ; sélecteurs gardiens | États × thèmes (échantillon)   | Rendu serveur identique à la fixture                                 |
| B    | Câblage (identifiants, `aria-describedby`, `aria-invalid`) ; absence de restructuration du DOM | axe ; annonce des erreurs                    | États d'erreur                 | Rendu déclaratif équivalent                                          |
| C    | Carte clavier du contrat ; états ; événements ; initialisation tardive des enfants ; nettoyage | axe dans chaque état ; restauration du focus | États × thèmes × forced colors | Mode contrôlé, SSR et upgrade, absence d'avertissement d'hydratation |

Les tests clavier sont **générés depuis la carte clavier du contrat** puis complétés à la main pour les
cas particuliers : une touche documentée sans test fait échouer la suite.

## 6. Accessibilité

- **axe-core** sur chaque fixture, dans chaque état (fermé, ouvert, sélectionné, invalide, désactivé),
  dans les trois moteurs. Aucune règle désactivée sans justification dans le test.
- **Clavier** : carte du contrat, ordre du focus, piège absent, restauration du focus après fermeture.
- **Forced colors et mouvement réduit** : émulation Playwright (`emulateMedia`) dans les tests visuels.
- **Zoom et reflow** : captures à 320 px de large et avec un texte agrandi à 200 %.
- **Lecteurs d'écran** : scripts de test manuels par composant (que faire, ce qui doit être annoncé),
  exécutés pour chaque nouveau composant de type C et à chaque version mineure, sur NVDA et Firefox, JAWS
  et Chrome, VoiceOver sous macOS et iOS, TalkBack et Chrome. Résultats consignés dans le README du
  composant.

## 7. Tests visuels

- Playwright Test dans l'image Docker officielle de Playwright : polices et rendu identiques en local et
  en CI.
- Captures de référence versionnées dans le dépôt, à côté des tests.
- Animations désactivées, polices chargées avant capture, seuil de différence nul par défaut.
- **Échantillonnage** pour éviter l'explosion combinatoire :

| Sur une PR                                                                                     | Sur `main` et avant release                          |
| ---------------------------------------------------------------------------------------------- | ---------------------------------------------------- |
| Chromium ; thème clair ; tous les états ; sombre et forced colors pour les composants modifiés | Chromium, Firefox, WebKit ; tous les thèmes et modes |

- Mise à jour des captures : déclenchement manuel du workflow, qui régénère les captures dans Docker et les
  pousse sur la branche de la PR. Toute capture modifiée est relue en revue (design si nécessaire).

## 8. Multi-navigateurs

| Moteur           | Tests composant (PR) | Tests visuels (PR) | Tests visuels (`main`)  | E2E (release) |
| ---------------- | -------------------- | ------------------ | ----------------------- | ------------- |
| Chromium         | Oui                  | Oui                | Oui                     | Oui           |
| Firefox          | Oui                  | Non                | Oui                     | Oui           |
| WebKit           | Oui                  | Non                | Oui                     | Oui           |
| Émulation mobile | Non                  | Non                | Oui (viewport, tactile) | Oui           |

Vérification manuelle sur appareils réels (Safari iOS, Chrome Android) avant chaque version mineure.
Les replis des fonctionnalités de niveau B sont testés en forçant le chemin de repli
(`data-mcs-force-fallback`).

## 9. Couverture

| Zone                                               | Seuil (lignes, fonctions, instructions / branches) | Raison                                              |
| -------------------------------------------------- | -------------------------------------------------- | --------------------------------------------------- |
| `tools/lib/` (outillage)                           | 85 % / 75 %                                        | Logique pure, facile à tester ; sécurise la release |
| `packages/web/src/**/*.ts` (éléments, contrôleurs) | 85 % / 80 %                                        | Comportements critiques                             |
| `packages/tokens` (génération)                     | 85 % / 75 %                                        | Erreur de génération, donc thèmes faux partout      |
| `packages/react`                                   | 80 % / 70 %                                        | Principalement couvert par les tests de contrat     |
| CSS                                                | Pas de couverture                                  | Couvert par les tests visuels et de contrat         |

Les seuils sont vérifiés par Vitest en CI (`vitest.config.ts`). Les points d'entrée en ligne de commande
(`tools/bin/`) sont exclus : ils ne font qu'appeler des fonctions testées.

## 10. Tests obligatoires

### Avant merge

| Test                                      | Condition                           |
| ----------------------------------------- | ----------------------------------- |
| Unitaires et couverture                   | Toujours                            |
| Types (`typecheck`)                       | Toujours                            |
| Composant et accessibilité, trois moteurs | Si un paquet ou une fixture change  |
| Visuels (échantillon PR)                  | Si CSS, tokens ou fixtures changent |
| Build et vérification des paquets         | Si un paquet change                 |

### Avant release

Tout ce qui précède, sans condition, plus :

- tests visuels complets (trois moteurs, tous les thèmes et modes) ;
- E2E sur les tarballs dans les trois applications témoins ;
- budgets de taille ;
- revue des résultats des tests manuels d'accessibilité de la version.

## 11. Tests instables

Un test instable est mis en quarantaine (`it.skip` avec un lien vers un ticket) dans la journée, et
corrigé ou supprimé sous une semaine. Les relances automatiques sont désactivées : elles cachent les
problèmes.

## 12. Fixtures

Les fixtures sont la source unique des exemples : des fonctions qui renvoient du HTML, paramétrées par les
props du contrat. Elles alimentent l'atelier (stories), les tests composant et visuels, et la
documentation.

## 13. État actuel

| Élément                                      | État                                                                  |
| -------------------------------------------- | --------------------------------------------------------------------- |
| Tests unitaires de l'outillage (`tools/`)    | **Opérationnels**, avec couverture et seuils                          |
| Projet Vitest « browser »                    | À ajouter avec le premier paquet (configuration décrite ci-dessus)    |
| Tests visuels, E2E, vérification des paquets | Jobs CI prêts ; activés automatiquement dès que les fichiers existent |

Scripts à ajouter avec le premier paquet, appelés par les jobs conditionnels de `ci.yml` :
`test:browser` (projet Vitest « browser », moteur choisi par la variable `MCS_BROWSER`), `test:visual`
(Playwright Test, exécuté dans l'image Docker de Playwright) et `check:packages` (publint, attw,
size-limit).
