# Notes de release

Une note par version publiée, générée par `pnpm release:version` dans la PR « Version Packages », puis
relue et complétée avant le merge (contexte, « Known Regressions »). Le script de publication refuse de
publier une version sans sa note.

| Fichier                   | Contenu                                                    |
| ------------------------- | ---------------------------------------------------------- |
| `v<version>.md`           | Note de release destinée aux utilisateurs du design system |
| `migration-v<majeure>.md` | Guide de migration de chaque version majeure               |

Le changelog technique, par paquet, est dans [`CHANGELOG.md`](../../CHANGELOG.md).
Format et processus : [RELEASE_PROCESS.md](../engineering/RELEASE_PROCESS.md), section 7.

Aucune version n'a encore été publiée.
