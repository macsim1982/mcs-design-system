# Politique de sécurité

## Versions supportées

| Version                    | Correctifs de sécurité                              |
| -------------------------- | --------------------------------------------------- |
| Dernière version majeure   | Oui                                                 |
| Version majeure précédente | Oui, pendant 12 mois après la sortie de la suivante |
| Versions plus anciennes    | Non                                                 |

Aucune version n'est encore publiée.

## Signaler une vulnérabilité

**N'ouvrez pas d'issue publique.** Utilisez le signalement privé de GitHub : onglet « Security » du
dépôt, puis « Report a vulnerability ».

Indiquez si possible : la version touchée, le composant ou le paquet, un scénario de reproduction et
l'impact estimé.

| Étape                              | Délai visé               |
| ---------------------------------- | ------------------------ |
| Accusé de réception                | 3 jours ouvrés           |
| Évaluation et sévérité             | 10 jours ouvrés          |
| Correctif pour une faille critique | Hotfix, dès que possible |

La divulgation est coordonnée : l'avis de sécurité (GitHub Security Advisory, et CVE si pertinent) est
publié avec la version corrective, en créditant la personne qui a signalé la faille si elle le souhaite.

## Périmètre

Dans le périmètre :

- injection de HTML ou de script via un composant (contenu dynamique d'un toast, d'un tooltip…) ;
- injection CSS via un thème de marque blanche ;
- compromission de la chaîne de publication (workflows, dépendances, paquets npm).

Hors périmètre : les vulnérabilités d'une application qui utilise le design system en dehors des usages
documentés.

## Mesures en place

- Publication npm sans secret stocké : trusted publishing (OIDC) et provenance.
- Actions GitHub épinglées par SHA de commit, mises à jour par Renovate.
- Aucune dépendance installée moins de trois jours après sa publication (`minimumReleaseAge`) ; aucun
  script d'installation exécuté sans autorisation explicite (`allowBuilds`).
- Détection de secrets avant chaque commit et en CI (secretlint).
- Permissions minimales par job ; aucune donnée non fiable interpolée dans un script de workflow.
- Aucune dépendance runtime dans les paquets `@mcs-ds/web` et `@mcs-ds/tokens`.
