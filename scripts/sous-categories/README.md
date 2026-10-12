# Sous catégories et postes « custom »

Ces scripts calculent les **sous catégories** du modèle
([`data/ui/subcategories.publicodes`](../../data/ui/subcategories.publicodes))
pour des simulations ou des personas, puis agrègent ces sous catégories en
**postes** décrits dans un fichier YAML (Ravijen, page de fin…).

Le point de jonction est un **CSV de sous catégories** : une ligne par
simulation, une colonne par règle de sous catégories. Tous les scripts le
partagent et le format est défini une fois pour toutes dans
[`lib/csv.mjs`](./lib/csv.mjs) et [`lib/subcategories.mjs`](./lib/subcategories.mjs).

```
                      ┌─ recomputeSubcategories.mjs ────────┐   simulations en base (Postgres)
CSV de sous catégories┤                                     ├─► sous-categories-*.csv
                      └─ recomputeSubCategoriesForPersonas.mjs┘   situations de personas (YAML)
                                    │
                                    ▼
                      customSubcategories.mjs ── data/ui/ravijen.yaml
                                              └─ data/ui/page-de-fin.yaml ─► .csv / .yaml
                                    │
                                    ▼
                      csvToPosthog.mjs ──────────────────────────────────► .posthog.csv
```

## Prérequis

- Lancer les commandes **depuis la racine du dépôt** (les scripts résolvent
  `scripts/sous-categories/` et les chemins de `data/` à partir de là).
- `pnpm compile` avant toute analyse de personas : par défaut,
  `recomputeSubCategoriesForPersonas.mjs` lit le modèle **local**
  (`public/co2-model.<PAYS>-lang.<LANG>.json`). Après une modification du modèle,
  recompiler **puis** régénérer le CSV, sinon les résultats restent sur l'ancien
  modèle.

## 1. Sous catégories des simulations en base

Pour toutes les simulations stockées en Postgres.

```sh
node scripts/sous-categories/recomputeSubcategories.mjs \
  --start-date 2026-09-01 --end-date 2026-09-30 \
  --output sous-categories-2026-09-WIP.csv --url "$DATABASE_URL"
```

| Option                   | Défaut                | Rôle                                                                                           |
| ------------------------ | --------------------- | ---------------------------------------------------------------------------------------------- |
| `-o`, `--output`         | `sous-categories.csv` | CSV de sortie (résolu dans ce dossier)                                                         |
| `-b`, `--batch`          | `50`                  | Taille des lots                                                                                |
| `-u`, `--url`            | `…localhost:5432/ngc` | URL de connexion Postgres                                                                      |
| `-s`, `--schema`         | `ngc`                 | Schéma Postgres                                                                                |
| `-r`, `--rules`          | —                     | Force un fichier de règles unique pour toutes les versions (au lieu du catalogue `RULES_SETS`) |
| `--start-date`           | —                     | Début de la période (inclus)                                                                   |
| `--end-date`             | —                     | Fin de la période (`YYYY-MM-DD` incluse, timestamp ISO exclu)                                  |
| `-f`, `--from`           | `auto`                | Reprise : `auto` (checkpoint), `0` / `all` (repart de zéro) ou une date                        |
| `--recompute-incoherent` | `false`               | Ne retraite que les simulations flaguées incohérentes et remplace leurs lignes                 |
| `-v`, `--verbose`        | —                     | Détail par simulation                                                                          |

Comportements notables :

- **Reprise sur incident** : le CSV est écrit au fil de l'eau et un checkpoint
  (`<output>.checkpoint.json`) est sauvegardé après chaque lot ; relancer la
  commande sans `--from` reprend au lot suivant.
- Les simulations sous une version de prévisualisation (`rc`, `beta`,
  `FR-fr-pr-…`) sont ignorées : ces versions ne sont pas publiées sur npm.
- Les règles de sous catégories dépendent de la version du modèle ; le
  catalogue `RULES_SETS` associe chaque plage de versions aux fichiers à
  charger (la structure — donc les colonnes — reste la même).
- Le script vérifie que `bilan . sous catégories` égale `bilan` et flague les
  simulations incohérentes.

## 2. Sous catégories de personas

Même format de sortie, mais les situations viennent d'un YAML au lieu de la
base.

```sh
node scripts/sous-categories/recomputeSubCategoriesForPersonas.mjs \
  --situations data/ui/personas-ui.yaml \
  --output sous-categories-personas.csv \
  --verbose
```

| Option               | Défaut                             | Rôle                                                         |
| -------------------- | ---------------------------------- | ------------------------------------------------------------ |
| `-s`, `--situations` | `data/ui/personas-ui.yaml`         | YAML des situations (relatif à la racine)                    |
| `-o`, `--output`     | `sous-categories-personas.csv`     | CSV de sortie (résolu dans ce dossier)                       |
| `-r`, `--rules`      | `data/ui/subcategories.publicodes` | Fichier des règles de sous catégories                        |
| `-C`, `--country`    | `FR`                               | Code pays du modèle                                          |
| `-l`, `--language`   | `fr`                               | Langue du modèle                                             |
| `--version`          | —                                  | Modèle distant `nightly` ou `latest` au lieu du modèle local |
| `--metric`           | `carbone`                          | Métrique évaluée (`carbone` ou `eau`)                        |
| `-v`, `--verbose`    | —                                  | Détail par situation                                         |

Deux formats de situations sont acceptés : une situation « nue »
(`data/ui/personas-ui.yaml`) ou un persona complet contenant `situation`
(`personas/personas-fr.yaml`). Le préfixe `personas . ` est retiré des noms.

## 3. Postes « custom » (Ravijen, page de fin…)

Évalue les agrégations décrites dans un fichier YAML **à partir des colonnes du
CSV** (sans relancer Publicodes).

```sh
# Moyennes Ravijen sur des simulations (filtres actifs par défaut)
node scripts/sous-categories/customSubcategories.mjs \
  --input sous-categories-2026-09-WIP.csv \
  --categories data/ui/ravijen.yaml \
  --min-tonnes 3 --max-tonnes 50

# Détail par situation, pour des personas
node scripts/sous-categories/customSubcategories.mjs \
  --input sous-categories-personas.csv \
  --categories data/ui/page-de-fin.yaml \
  --no-filter --per-situation --format yaml
```

| Option               | Défaut                 | Rôle                                                   |
| -------------------- | ---------------------- | ------------------------------------------------------ |
| `-i`, `--input`      | _(requis)_             | CSV de sous catégories (résolu dans ce dossier)        |
| `-o`, `--output`     | voir ci-dessous        | Fichier de sortie (résolu dans ce dossier)             |
| `-f`, `--format`     | `csv`                  | `csv` ou `yaml`                                        |
| `-c`, `--categories` | `data/ui/ravijen.yaml` | Fichier YAML des postes (relatif à la racine)          |
| `--per-situation`    | `false`                | Une ligne par situation × poste, au lieu de la moyenne |
| `-S`, `--situation`  | —                      | Ne garder que ces situations (colonne `simulationId`)  |
| `--min-tonnes`       | `3`                    | Bilan minimal, inclus                                  |
| `--max-tonnes`       | `50`                   | Bilan maximal, inclus                                  |
| `--no-filter`        | `false`                | Désactive les filtres `progression` et `bilan`         |

### Filtres

Sans `--no-filter`, seules les simulations **terminées** (`progression` = 1) dont
le `bilan` est compris **entre `--min-tonnes` et `--max-tonnes`** sont retenues.
`--no-filter` est indispensable pour un CSV de personas (pas de notion de
progression).

### Nom de sortie par défaut

`<input>.<slug categories>[.per-situation].<format>`, à côté du CSV d'entrée.
Exemples :

| Commande                                              | Sortie                             |
| ----------------------------------------------------- | ---------------------------------- |
| `--input x.csv --categories data/ui/ravijen.yaml`     | `x.ravijen.csv`                    |
| `--input x.csv --categories data/ui/page-de-fin.yaml` | `x.page-de-fin.csv`                |
| `… --per-situation --format yaml`                     | `x.page-de-fin.per-situation.yaml` |

Sans `--output`, le fichier par défaut est **écrasé** à chaque lancement.

### Totaux et parts

- Le **total** est la somme des colonnes `bilan . sous catégories . <xxx>` de
  premier niveau (`transport`, `alimentation`, `logement`, `consommation`,
  `services sociétaux`) ; le total d'une catégorie est la colonne
  correspondante. Les totaux ne sont **pas** déduits du fichier de postes : un
  poste oublié fausserait toutes les parts.
- `part_pct` est la part dans le total ; `part_pct_categorie` la part au sein de
  la catégorie (ex. part de la voiture dans le transport).
- Les postes plus profonds (ex. `transport . voiture . usage`) sont inclus dans
  leur agrégat : sommer tous les postes du fichier double-compterait les poids.
- **Contrôle de couverture** : le script liste les sous catégories « feuilles »
  absentes du fichier de postes. Une sous catégorie non rattachée laisse son
  poids hors du total des postes, et donc fausse les parts.

## 4. Export PostHog

Convertit un CSV `;` + virgule décimale en CSV `,` + point décimal, importable
dans PostHog.

```sh
node scripts/sous-categories/csvToPosthog.mjs \
  --input sous-categories-2026-09-prod.csv
```

| Option           | Défaut                | Rôle                                |
| ---------------- | --------------------- | ----------------------------------- |
| `-i`, `--input`  | _(requis)_            | CSV source (résolu dans ce dossier) |
| `-o`, `--output` | `<input>.posthog.csv` | CSV de sortie                       |

## Format du CSV de sous catégories

Une ligne par simulation, séparateur `;`, virgule décimale.

| Colonne                     | Contenu                                                               |
| --------------------------- | --------------------------------------------------------------------- |
| `simulationId`              | Identifiant (UUID en base, nom de la situation pour les personas)     |
| `date`                      | Date de génération                                                    |
| `progression`               | 1 si la simulation est terminée                                       |
| `bilan`                     | Bilan total (kgCO2e)                                                  |
| `bilanCoherent`             | `true` si la somme des sous catégories égale `bilan`                  |
| `bilan . sous catégories …` | Une colonne par règle de sous catégories (ordre du fichier de règles) |

## Fichiers produits

Les CSV/YAML volumineux de ce dossier sont des **artefacts d'analyse**, pas des
sources. Par convention :

- `sous-categories-<période>-WIP.csv` / `-prod.csv` : sorties de
  `recomputeSubcategories.mjs` ;
- `sous-categories-personas.csv` : sortie de
  `recomputeSubCategoriesForPersonas.mjs` ;
- `*.ravijen.{csv,yaml}`, `*.page-de-fin*.{csv,yaml}` : sorties de
  `customSubcategories.mjs` ;
- `*.posthog.csv` : sortie de `csvToPosthog.mjs`, importable dans PostHog.
