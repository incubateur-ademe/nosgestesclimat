# Enquête avion — Forum Vies Mobiles / OpinionWay (mai 2025)

Scripts d'extraction et de synthèse des trajets en avion déclarés par les
1 647 répondants de l'enquête OpinionWay pour Forum Vies Mobiles.

Par défaut, les sorties ne portent que sur les **vols personnels** (hors motifs
professionnels), trajets mixtes **inclus** : voir « Vols personnels et vols
professionnels ». `--cadre tous` rétablit l'ensemble des vols, `--mixed strict`
exclut les trajets mixtes.

## Fichiers

| Fichier                                                                         | Rôle                                                                      |
| ------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| `OpinionWay pour Forum Vies Mobiles - Base de données complète - Mai 2025.xlsx` | Source (feuille `bdd`, 1 446 colonnes)                                    |
| `Base1.xlsx`                                                                    | Annuaire aéroports : code IATA → latitude/longitude/pays                  |
| `Base2c.xlsx`                                                                   | Correspondance nom d'aéroport (tel qu'utilisé dans l'enquête) → code IATA |
| `Rapport_Final_cor.R`                                                           | Script R d'origine du chercheur (analyse complète, non exécuté ici)       |
| `lib/xlsxReader.mjs`                                                            | Lecture XLSX sans dépendance externe (zip + XML)                          |
| `lib/trajets.mjs`                                                               | Repérage des colonnes du questionnaire et extraction des trajets          |
| `lib/airports.mjs`                                                              | Chargement des aéroports et distance haversine                            |
| `extractTrajetsAvion.mjs`                                                       | Produit `trajets-avion.csv` (format large, une ligne par ID)              |
| `distancesAvion.mjs`                                                            | Produit `distances-avion.csv` (km A/R par année)                          |
| `syntheseAvion.mjs`                                                             | Produit `synthese-avion.csv` (moyennes par population)                    |
| `trajets-avion.csv`                                                             | Sortie 1 — trajets détaillés                                              |
| `distances-avion.csv`                                                           | Sortie 2 — kilomètres par année                                           |
| `synthese-avion.csv`                                                            | Sortie 3 — moyennes                                                       |

## Exécution

Les trois scripts s'enchaînent : `distancesAvion` et `syntheseAvion` relisent
les sorties précédentes.

```bash
cd nosgestesclimat
node scripts/avion/extractTrajetsAvion.mjs   # → trajets-avion.csv
node scripts/avion/distancesAvion.mjs        # → distances-avion.csv
node scripts/avion/syntheseAvion.mjs         # → synthese-avion.csv
```

Options utiles :

| Script                | Option                                                                                                               |
| --------------------- | -------------------------------------------------------------------------------------------------------------------- |
| `extractTrajetsAvion` | `--merge-years` (années dans une cellule au lieu d'un bloc par année), `--sep`, `--no-bom`                           |
| `distancesAvion`      | `--threshold <km>` (seuil court / moyen-long, défaut 1 500), `--assume-departure none\|home\|home-then-paris\|paris` |
| `syntheseAvion`       | `--gp-only` (restreint à la cible « population générale »)                                                           |

Options communes aux trois scripts (`--cadre`, `--mixed`, `--sep`, `--no-bom`) :
voir la section « Vols personnels et vols professionnels ».

## Structure du questionnaire

Deux blocs symétriques, l'un pour les vols **en France** (`q8*`), l'autre pour
l'**étranger** (`q10*`). Chaque trajet occupe un créneau « Voyage vu en N » :

| Information                                                 | France          | Étranger               | Créneaux |
| ----------------------------------------------------------- | --------------- | ---------------------- | -------- |
| Destination (aéroport d'arrivée)                            | `q8tmp_0…14`    | `q10tmp_0…14`          | 15       |
| Aéroport de départ                                          | `q8a1a_i1…10`   | `q10a1a_i1…10`         | 10       |
| **Fréquence** (« Combien de fois avez-vous volé vers X ? ») | `q8a1b_i1…10`   | `q10a1b_i1…10`         | 10       |
| **Années** (choix multiple : 2022, 2023, 2024)              | `q8a1e_iN$1…3`  | `q10a1f_iN$1…3`        | 10 × 3   |
| **Motifs du vol** (choix multiple, pro et perso)            | `q8a1c_iN$1…10` | `q10a1c_iN$1…10`       | 10 × 10  |
| Vols internes au voyage                                     | —               | `q10a1e_iN` + `@othv1` | 10       |

Le créneau de destination est **0-based** (`q8tmp_0` = voyage 1) alors que les
blocs de détail sont **1-based** (`q8a1a_i1` = voyage 1).

## Conventions de calcul (à connaître avant toute réutilisation)

### 1. Répartition de la fréquence par année

L'enquête ne demande **qu'une fréquence par trajet**, mais autorise plusieurs
années cochées. Les vols sont donc répartis sur les années du trajet :

- parcours de la **plus récente à la plus ancienne** (2024 → 2022) ;
- **curseur chaîné** : le trajet suivant démarre là où le précédent s'est
  arrêté, **y compris d'un répondant au suivant** ;
- la somme des années est toujours égale à la fréquence déclarée.

Exemples :

| Cas                                          | Répartition                                         |
| -------------------------------------------- | --------------------------------------------------- |
| 4 vols sur 2022-2023-2024                    | 2024: 2, 2023: 1, 2022: 1 → curseur suivant en 2023 |
| 2 vols sur 2022-2023-2024 _(trajet suivant)_ | 2023: 1, 2022: 1, 2024: 0                           |
| 5 vols sur 2022 + 2024                       | 2024: 3, 2022: 2                                    |

Conséquence : la ventilation annuelle dépend de **l'ordre des lignes** du
fichier source (les totaux, eux, n'en dépendent pas). C'est un choix de
méthode, différent de celui du script R qui répète la fréquence sur chaque
année cochée (9 634 vols au lieu de 5 359).

### 2. Vols personnels et vols professionnels

La question `q8a1c` / `q10a1c` (« Dans quel cadre avez-vous volé vers X ? ») est
à choix multiple et compte 10 modalités :

| Type          | Codes     | Libellés                                                              |
| ------------- | --------- | --------------------------------------------------------------------- |
| Professionnel | 1, 2, 9   | client/fournisseur, congrès/salon, autre motif professionnel          |
| Personnel     | 3 à 8, 10 | études, vacances/loisirs, famille, amis, accompagnement, soins, autre |

Chaque trajet est classé par `classifyTrip()` (dans `lib/trajets.mjs`) :

| Cadre           | Définition                           | Trajets | Vols déclarés |
| --------------- | ------------------------------------ | ------: | ------------: |
| `personnel`     | uniquement des motifs personnels     |   2 201 |         4 105 |
| `professionnel` | uniquement des motifs professionnels |     256 |           831 |
| `mixte`         | au moins un motif de chaque type     |      96 |           406 |
| `non renseigné` | aucune case cochée                   |     316 |            17 |

**Limite structurelle** : la fréquence n'existe qu'**une fois par trajet**, pas
par motif. Un trajet mixte ne peut donc pas être scindé entre vols
professionnels et vols personnels. D'où l'option `--mixed` :

| `--mixed`  | Trajets mixtes                          | Vols personnels | Vols professionnels |
| ---------- | --------------------------------------- | --------------: | ------------------: |
| `inclusif` | comptés dans les deux cadres _(défaut)_ |           4 511 |               1 237 |
| `strict`   | écartés des deux cadres                 |           4 105 |                 831 |

En mode `inclusif`, les deux cadres ne forment plus une partition : un trajet
mixte est compté des deux côtés. En mode `strict`, 406 vols (7,6 %) ne sont
dans aucun cadre et 17 vols n'ont aucun motif.

**Le cadre `personnel` + `--mixed inclusif` est le comportement par défaut** des
scripts de calcul : un vol est retenu dès qu'**au moins un motif personnel** est
coché, y compris s'il porte aussi un motif professionnel. Utilisation :

```bash
# Défaut : vols personnels, trajets mixtes inclus
node scripts/avion/extractTrajetsAvion.mjs   # tous les trajets, colonne « cadre »
node scripts/avion/distancesAvion.mjs
node scripts/avion/syntheseAvion.mjs

# Exclure les trajets mixtes
node scripts/avion/distancesAvion.mjs --mixed strict

# Revenir à l'ensemble des vols, tous motifs confondus
node scripts/avion/distancesAvion.mjs --cadre tous
node scripts/avion/syntheseAvion.mjs --cadre tous

# Vols professionnels seuls
node scripts/avion/distancesAvion.mjs --cadre professionnel --output distances-pro.csv
node scripts/avion/syntheseAvion.mjs --cadre professionnel \
  --distances distances-pro.csv --output synthese-pro.csv
```

Points de méthode :

- `extractTrajetsAvion.mjs` **ne filtre pas** : c'est la source, elle garde tous
  les trajets et expose le cadre de chacun (`trajet N - cadre`), plus 4 colonnes
  de totaux par ID.
- `--cadre` et `--mixed` sont appliqués **après** la répartition par année : le
  curseur reste celui du fichier complet, donc la ventilation annuelle des
  trajets retenus est identique à celle d'une exécution sans filtre. C'est ce qui
  garantit que `distancesAvion` et `syntheseAvion` restent cohérents entre eux.
- Passer les mêmes `--cadre` / `--mixed` aux **deux** scripts : la synthèse lit
  le csv produit par `distancesAvion`, et un désaccord entre les deux produirait
  des colonnes incohérentes (vols d'un côté, km de l'autre).

Repères pondérés (moyenne annuelle par personne, cible GP) selon le mode :

| Population          | Vols strict | Vols inclusif | Vols tous | km strict | km inclusif | km tous |
| ------------------- | ----------: | ------------: | --------: | --------: | ----------: | ------: |
| Tous les ans        |        2,78 |      **2,90** |      3,09 |    18 118 |  **19 501** |  19 812 |
| Occasionnels        |        0,76 |      **0,78** |      0,80 |     4 022 |   **3 984** |   4 223 |
| Tous les répondants |        0,56 |      **0,61** |      0,67 |     3 336 |   **3 624** |   3 977 |

La colonne en gras est le défaut. Les vols personnels représentent l'essentiel
des vols et des kilomètres : le professionnel pèse environ 10 à 16 % selon la
population considérée. Inclure les trajets mixtes ajoute ~7 % aux vols
personnels (406 vols sur 5 359) et comble l'essentiel de l'écart avec `tous`.

### 3. Aller-retour

La question de fréquence compte les vols **vers** la destination (aller). Les
kilomètres sont calculés en **aller-retour** : `2 × fréquence × distance
haversine`. Aucune trace d'un vol retour déclaré séparément.

### 4. Distances

Distance orthodromique entre les coordonnées des aéroports, via
`Base2c` (nom → IATA) puis `Base1` (IATA → lat/lon). Le seuil court /
moyen-long courrier s'applique à la **distance aller simple** : 1 500 km par
défaut, ajustable avec `--threshold`.

> Le modèle Nos Gestes Climat retient un seuil différent : il définit le court
> courrier comme un vol de moins de 2 h, soit environ 1 000 km
> ([avion.publicodes:197](/Users/clementauger/Documents/dev/ngc/nosgestesclimat/data/empreinte/transport/avion.publicodes:197)).
> Les chiffres produits ici ne sont donc pas directement comparables à ceux du
> modèle public ; relancer avec `--threshold 1000` pour s'aligner.

### 5. Imputation du départ manquant

Sur 2 869 trajets, **554** ont une destination mais pas d'aéroport de départ
(dont 240 avec une fréquence > 0, les autres ne pèsent aucun km). Le départ est
estimé par l'aéroport le plus fréquent du répondant sur ses autres trajets,
puis par Paris-CDG en repli (option par défaut `home-then-paris`) : 229 trajets
sont ainsi résolus (147 via l'aéroport habituel, 82 via CDG), 325 restent sans
distance. Deux gardes : jamais un aéroport identique à l'arrivée (distance
nulle), jamais un aéroport habituel hors Europe pour un vol intérieur français.
Les km ainsi produits sont isolés dans les colonnes « dont imputés » — les
soustraire ou relancer avec `--assume-departure none` pour ne garder que le
déclaratif.

### 6. Périmètre des kilomètres

Ne sont pas comptés faute de données : les **escales** (le questionnaire
demande explicitement l'aéroport de destination finale) et les **318 vols
internes au voyage** (leurs aéroports ne sont pas renseignés). 85 trajets ont
un départ égal à l'arrivée et pèsent 0 km.

## Populations de `synthese-avion.csv`

| Population                                       | Définition                                           | Effectif |
| ------------------------------------------------ | ---------------------------------------------------- | -------- |
| `tous les ans (2022, 2023 et 2024)`              | au moins 1 vol chacune des 3 années                  | 347      |
| `au moins 1 vol sur 3 ans, pas tous les ans`     | au moins 1 vol sur la période, mais pas chaque année | 468      |
| `aucun vol sur les 3 ans`                        | aucun vol attribuable à une année                    | 832      |
| `ensemble des répondants (non-voyageurs inclus)` | tout le monde                                        | 1 647    |

Colonnes, pour chaque population et chaque période (2022, 2023, 2024, moyenne
annuelle sur 3 ans, total sur 3 ans), en version **non pondérée** et
**pondérée** par `POIDS_GP` (poids de calage de la population générale) :

| Métrique                                 | Unité             |
| ---------------------------------------- | ----------------- |
| `vols`                                   | vols / personne   |
| `vols court courrier`                    | vols / personne   |
| `vols moyen/long courrier`               | vols / personne   |
| `vols non ventilés (catégorie inconnue)` | vols / personne   |
| `km A/R`                                 | km A/R / personne |
| `km court courrier A/R`                  | km A/R / personne |
| `km moyen/long courrier A/R`             | km A/R / personne |

Deux identités sont vérifiables ligne à ligne :

```text
vols = vols court + vols moyen/long + vols non ventilés
km A/R = km court + km moyen/long
```

Les **vols non ventilés** sont les vols déclarés qu'on ne peut pas rattacher à
une catégorie de distance : 303 vols sur des trajets dont le départ et
l'arrivée sont le même aéroport (distance nulle, saisie erronée) et 53 vols
dont un aéroport est absent de la base, soit 356 vols sur 5 333 répartis
(~7 %). Ils ne sont associés à aucun kilomètre.

La sortie console affiche les mêmes métriques sous forme de tableau, avec un
en-tête de colonnes par population (`eff.` = effectif, valeur = non pondéré
(pondéré)) :

```text
vols | dont court | dont ML | non vent. | km A/R | dont court | dont ML
```

`ML` = moyen/long courrier, `non vent.` = vols sans distance connue. Les deux
dernières colonnes déclinent les km en court et moyen/long courrier.

La ventilation court / moyen-long courrier vient de `distances-avion.csv` (seuil
de 1 500 km sur la distance aller simple par défaut). Comme ce fichier ignore
les trajets sans distance, la synthèse recalcule l'écart et l'expose dans
`vols non ventilés` plutôt que de le laisser invisible.

Pour une lecture représentative des Français, utiliser les colonnes pondérées ;
l'échantillon brut surreprésente les grands voyageurs.

### Pourquoi « pondéré » et « non pondéré » divergent autant sur l'ensemble

`POIDS_GP` n'est pas un poids de population : c'est un poids de calage **interne
à la cible GP**, dont la somme vaut exactement l'effectif GP (1 040, pour 1 647
répondants). Il vaut **0** pour les 607 répondants recrutés uniquement comme
grands voyageurs (302) ou non voyageurs (305), sur-recrutés par construction.

Conséquence : sur la population « ensemble des répondants », la colonne pondérée
ne pondère pas les 1 647 répondants, elle **les restreint au sous-échantillon
GP** (1 040). L'écart est donc un effet de périmètre, pas de redressement.

Décomposition des km A/R par personne et par an :

| Étape                                           |     n | km/an |
| ----------------------------------------------- | ----: | ----: |
| tous les répondants                             | 1 647 | 5 871 |
| − 302 GV recrutés en supplément                 | 1 345 | 3 017 |
| − 305 NV recrutés en supplément                 | 1 040 | 3 902 |
| + pondération `POIDS_GP` (poids de 0,59 à 1,98) | 1 040 | 3 977 |

Les GV recrutés en supplément représentent 18 % des répondants mais **58 % des
kilomètres** parcourus : les retirer fait chuter la moyenne de 49 %. À
l'inverse, retirer les NV (0 km) la fait remonter de 29 %. La pondération
elle-même ne déplace la moyenne que de +1,9 %.

C'est la valeur pondérée (3 977 km/an) qui est comparable à la moyenne
nationale ; la non pondérée sur 1 647 est un artefact d'échantillonnage. Le
même mécanisme explique l'écart sur les vols (1,08 contre 0,67) et sur toutes
les populations dont l'effectif pondéré est inférieur à l'effectif brut.

Repères actuels (moyenne annuelle par personne, pondérée, seuil 1 500 km, défaut
= vols personnels avec trajets mixtes inclus) :

| Population              | Vols / an | dont court | dont moyen/long | km A/R / an | dont court |
| ----------------------- | --------- | ---------- | --------------- | ----------- | ---------- |
| Tous les ans            | 2,90      | 1,32       | 1,24            | 19 501      | 1 870      |
| Occasionnels            | 0,78      | 0,43       | 0,28            | 3 984       | 633        |
| **Tous les répondants** | **0,61**  | **0,30**   | **0,24**        | **3 624**   | **439**    |

Avec `--mixed strict` (mixtes exclus) : 2,78 / 0,76 / 0,56 vols et 18 118 /
4 022 / 3 336 km. Avec `--cadre tous` (professionnel inclus) : 3,09 / 0,80 /
0,67 vols et 19 812 / 4 223 / 3 977 km. Les vols personnels représentent donc
84 à 95 % des vols et des km selon la population.

Avec le seuil de 1 000 km, la ventilation court / moyen-long change mais pas
les totaux de vols et de km.

Le court courrier représente environ **45 à 55 % des vols** (56 % en non
pondéré) mais seulement **10 à 16 % des kilomètres** : un vol domestique est
fréquent mais court, donc peu émetteur au regard d'un long-courrier. Les deux
métriques ne racontent donc pas la même histoire, d'où l'intérêt de les garder
séparées.

## Contrôles de cohérence

```bash
node scripts/avion/extractTrajetsAvion.mjs | grep -E "Vols|Cadre"
# 5 359 vols déclarés = somme des fréquences brutes (hors vols internes)
# et 4 105 + 831 + 406 + 17 = 5 359 (somme des cadres)

node scripts/avion/distancesAvion.mjs | tail -12
# perYear + "trajets sans année" = "total réel" (personnel + mixtes par défaut)
```

Repères stables sur cette base :

- 1 647 répondants, 818 ayant volé sur la période (49,7 %) ;
- 2 869 trajets extraits (910 France, 1 959 étranger), dont 327 sans année ;
- 5 359 vols déclarés ; 5 333 répartis sur les années, 26 non attribuables ;
- cadres : 4 105 vols personnels, 831 professionnels, 406 mixtes, 17 sans motif ;
- 318 vols internes au voyage, sur 176 trajets (question `q10a1e`) ;
- tous cadres : 29 011 069 km par année, 29 248 629 km réels (écart = trajets
  sans année) ; personnels + mixtes (défaut) : 25 648 696 km par année,
  25 886 257 km réels ; personnels exclusifs : 23 750 009 / 23 838 180 km.

## Pièges rencontrés sur la base source

- 554 trajets sans aéroport de départ (boucle de détail interrompue), ramenés
  à 325 non résolus après imputation ;
- 327 trajets sans année, dont 47 au-delà du 10ᵉ créneau (la liste de
  destinations va jusqu'à 15, les détails jusqu'à 10) ;
- 85 trajets avec départ = arrivée ;
- 43 trajets du bloc « étranger » dont la destination est en France
  (Guadeloupe, Réunion, Paris…) ;
- 3 aéroports absents de `Base2c` (Aberdeen Dyce, Zielona Góra-Babimost,
  « ajaccio » en minuscules) et 3 codes IATA sans coordonnées dans `Base1`.
