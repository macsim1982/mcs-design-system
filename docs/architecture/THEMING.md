# Theming

> Statut : validée le 2026-10-30 (v1). Dernière mise à jour : 2026-10-30.
> Prérequis : [TOKENS.md](TOKENS.md).

## 1. Objectifs

- Supporter clair, sombre, marques personnalisées, marque blanche et contraste élevé.
- Changer de thème **au runtime, sans JavaScript obligatoire et sans rebuild** de l'application.
- Permettre les **thèmes imbriqués et contextuels** : une section sombre dans une page claire, une zone
  co-brandée.
- N'exiger **aucun provider**, contexte ou objet de thème côté framework.

## 2. Quatre dimensions orthogonales

| Dimension     | Valeurs                 | Contrôlée par                                     | Mécanisme CSS                                               |
| ------------- | ----------------------- | ------------------------------------------------- | ----------------------------------------------------------- |
| Marque        | `default`, `acme`, …    | Fichier de thème chargé, ou `data-mcs-theme`      | Redéclaration des tokens système                            |
| Schéma        | `light`, `dark`, `auto` | `prefers-color-scheme` ou `data-mcs-color-scheme` | `color-scheme` et `light-dark()`                            |
| Contraste     | `standard`, `more`      | `prefers-contrast` ou `data-mcs-contrast`         | Redéclaration des tokens de couleur concernés               |
| Forced colors | actif ou non            | Système d'exploitation (Windows Contraste élevé)  | `@media (forced-colors: active)` dans le CSS des composants |

Une densité (`comfortable`, `compact`) pourra s'ajouter comme cinquième dimension si un produit en a
besoin ; elle suivra le même modèle (attribut et redéclaration des tokens de taille).

## 3. Mécanique

### 3.1 Clair et sombre : `color-scheme` et `light-dark()`

```css
@layer mcs.tokens {
  :root {
    color-scheme: light dark; /* suit le système par défaut */
    --mcs-color-surface-base: light-dark(oklch(0.99 0 0), oklch(0.19 0.01 260));
    --mcs-color-text-default: light-dark(oklch(0.23 0.01 260), oklch(0.95 0.005 260));
  }
  [data-mcs-color-scheme='light'] {
    color-scheme: light;
  }
  [data-mcs-color-scheme='dark'] {
    color-scheme: dark;
  }
  [data-mcs-color-scheme='auto'] {
    color-scheme: light dark;
  }
}
```

Pourquoi ce choix :

- une custom property non enregistrée transporte `light-dark(…)` tel quel, et la fonction est
  évaluée **sur l'élément qui utilise la couleur**. Il suffit donc de changer `color-scheme` sur un
  ancêtre pour inverser toute une section, sans redéclarer un seul token ;
- `color-scheme` aligne aussi les contrôles natifs, les barres de défilement et le fond par défaut du
  canevas ;
- les composants ne contiennent **aucun style spécifique au mode sombre**. Stylelint interdit
  `prefers-color-scheme` dans le CSS des composants.

`light-dark()` ne vaut que pour les couleurs, ce qui couvre l'essentiel du mode sombre : ombres et
élévation sont aussi des couleurs. Une différence non colorimétrique entre modes (rare) passerait par
une redéclaration dans `[data-mcs-color-scheme]`.

### 3.2 Contraste élevé

```css
@layer mcs.tokens {
  @media (prefers-contrast: more) {
    :root:not([data-mcs-contrast='standard']) {
      --mcs-color-border-default: light-dark(oklch(0.45 0 0), oklch(0.75 0 0));
    }
  }
  [data-mcs-contrast='more'] {
    --mcs-color-border-default: light-dark(oklch(0.45 0 0), oklch(0.75 0 0));
  }
}
```

Le contexte `more` renforce les bordures, les textes atténués, les fonds teintés et l'anneau de focus.
Il est généré depuis le resolver, jamais écrit à la main.

### 3.3 Forced colors

En mode forced colors, le navigateur remplace les couleurs par des couleurs système et supprime
`box-shadow`. Le design system ne fournit donc pas de « thème » forced colors. Chaque composant :

- porte son indicateur de focus par `outline`, préservé par le mode ;
- ajoute une bordure ou un soulignement quand un état n'est exprimé que par un fond (sélection,
  élément actif) ;
- utilise `currentColor` pour ses icônes SVG ;
- est testé visuellement en forced colors (voir [ACCESSIBILITY.md](ACCESSIBILITY.md)).

### 3.4 Marques

Une marque est un contexte du resolver, compilé en un fichier CSS :

```css
/* @mcs-ds/tokens/css/themes/acme.css, sortie à la racine */
@layer mcs.tokens {
  :root {
    --mcs-color-accent-strong-bg: light-dark(oklch(0.55 0.21 25), oklch(0.7 0.17 25));
    --mcs-radius-control: 999px;
    --mcs-font-family-sans: 'Acme Sans', system-ui, sans-serif;
  }
}
```

Le même thème peut être généré **dans une portée** pour une zone co-brandée :

```css
@layer mcs.tokens {
  [data-mcs-theme='acme'] {
    /* mêmes déclarations, valeurs littérales */
  }
}
```

Les valeurs sont littérales et redéclarées dans la portée : c'est ce qui rend l'imbrication fiable (voir
« Le piège des alias résolus à la racine » dans [TOKENS.md](TOKENS.md)).

## 4. API de theming

L'API est faite d'**attributs HTML** posés sur `<html>` ou sur n'importe quel élément.

```html
<html data-mcs-color-scheme="dark">
  …
  <section data-mcs-color-scheme="light">Encart clair dans une page sombre</section>
  <aside data-mcs-theme="acme">Zone co-brandée</aside>
</html>
```

```js
// Basculer le schéma : aucune API du design system n'est nécessaire.
document.documentElement.dataset.dsColorScheme = 'dark';
```

### 4.1 Persistance sans flash

La préférence est stockée dans un cookie pour que le serveur rende directement le bon attribut. Pour les
sites statiques, un script bloquant de quelques lignes, placé dans `<head>` avant les feuilles de style,
évite le flash :

```html
<script>
  try {
    const scheme = localStorage.getItem('mcs-color-scheme');
    if (scheme) document.documentElement.dataset.dsColorScheme = scheme;
  } catch {}
</script>
```

La balise `<meta name="color-scheme" content="light dark">` informe le navigateur avant même le
chargement du CSS.

### 4.2 Personnaliser un composant

Par ordre de préférence :

1. une **variante** prévue par le contrat ;
2. un **token système** dans un thème (change tous les composants qui l'utilisent) ;
3. un **hook** de composant, dans un thème ou de manière contextuelle :

```css
.checkout-toolbar {
  --mcs-button-radius: 0;
}
```

4. une surcharge CSS dans le layer de l'application, qui l'emporte toujours (voir
   [CSS_ARCHITECTURE.md](CSS_ARCHITECTURE.md)).

## 5. Créer un thème

1. Créer `packages/tokens/src/brands/<marque>.tokens.json` en étendant la marque par défaut : palettes de
   référence, polices, rayons, quelques tokens système.
2. Déclarer la marque comme contexte du modificateur `brand` dans le resolver.
3. Lancer la génération : le build échoue si une paire de couleurs ne respecte pas son contraste minimal,
   dans n'importe quel mode.
4. Vérifier les tests visuels du thème (un échantillon de composants par mode).
5. Ajouter un changeset `feat(tokens): add <marque> theme`.

Pour une application qui ne veut pas de build : surcharger directement les tokens système dans sa
propre feuille, après celle du design system. Le contraste n'est alors plus vérifié automatiquement ;
la documentation fournit une page de contrôle qui affiche toutes les paires.

## 6. Marque blanche

| Besoin                                                            | Solution                                                                                                                                                                       |
| ----------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Quelques clients connus                                           | Un thème compilé par client, servi par URL (`/themes/<client>.css`), mis en cache                                                                                              |
| Multi-tenant (le client choisit ses couleurs dans un back-office) | Compilation à la demande côté serveur, avec la même fonction que le build et une mise en cache par empreinte. **Différée** tant que le besoin n'est pas confirmé (question Q5) |

Règles de sécurité pour la marque blanche :

- un tenant ne fournit **jamais de CSS brut**, seulement des valeurs typées (couleurs, rayon, police
  dans une liste autorisée), validées par le compilateur. Sinon, c'est une injection CSS (exfiltration
  par sélecteurs d'attributs, recouvrement d'interface) ;
- le compilateur refuse un thème dont les contrastes échouent et propose la couleur conforme la plus
  proche.

`contrast-color()` (Baseline newly available depuis avril 2026) pourra servir d'amélioration pour choisir
automatiquement le texte sur une couleur arbitraire, sans remplacer la validation.

## 7. Performance

- Changer de schéma ou de contraste coûte un recalcul de style, sans JavaScript ni nouveau CSS.
- Un thème complet pèse quelques kilo-octets compressés ; le budget est fixé dans
  [PERFORMANCE.md](PERFORMANCE.md).
- Pas de `transition: all` lors d'un changement de thème : l'animation de dizaines de propriétés coûte
  cher et gêne les personnes sensibles au mouvement.

## 8. Anti-patterns

| Anti-pattern                                                 | Pourquoi                                                                |
| ------------------------------------------------------------ | ----------------------------------------------------------------------- |
| Styles « dark » dans le CSS d'un composant                   | Duplique le thème, casse l'imbrication ; interdit par Stylelint         |
| Provider ou contexte de thème en JavaScript                  | Runtime inutile, incompatible avec le HTML seul et le rendu serveur pur |
| Objets de thème injectés en CSS-in-JS                        | Coût au runtime, pas de cache navigateur                                |
| Utiliser des palettes de référence dans une application      | Ne suit ni le mode ni la marque                                         |
| Enregistrer un token de couleur avec `@property`             | Fige `light-dark()` à l'élément de déclaration                          |
| Alias `var()` déclarés sur `:root` pour des thèmes imbriqués | Résolus à la racine : l'imbrication échoue silencieusement              |
| CSS fourni par un tenant                                     | Injection CSS                                                           |
