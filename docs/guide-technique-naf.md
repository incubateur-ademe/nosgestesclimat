<h1 align="center">Hybridation du modèle Nos Gestes Climat via les Services Sociétaux</h1>

<p align="center">Ce fichier contient les informations techniques permettant de comprendre et reproduire le calcul du poste "Services Sociétaux" de <a href="https://nosgestesclimat.fr/">nosgestesclimat.fr</a>.</p>

---

<details open=true>

<summary>Sommaire</summary>

- [Introduction](#introduction)
- [Principe général](#principe-général)
- [Données de départ](#données-de-départ)
- [Reproduire le calcul](#reproduire-le-calcul)
- [Limites du calcul](#limites-du-calcul)
- [Scripts disponibles](#scripts-disponibles)
  - [`analyse_CA_branches.js`](#analyse_ca_branchesjs)
  - [`generateNAF_YAML.js`](#generatenaf_yamljs)
  - [`generateNAF2.js`](#generatenaf2js)
  - [`naf.js`](#nafjs)
  - [`set_NAF_division.js`](#set_naf_divisionjs)

</details>

---

## Introduction

Un pré-requis pour vous lancer dans ce guide est la lecture de notre article sur [l'implémentation des "services scoiétaux" dans Nos Gestes Climat](https://nosgestesclimat.fr/nouveaut%C3%A9s/l'empreinte-climat%20des%20%22services%20soci%C3%A9taux%22).

**En bref**, certains postes constituant l'empreinte carbone individuelle sont inhérentes à la société à laquelle nous appartenons et ne peuvent pas être captés autrement que via une approche macro-économique (ie l'approche "montante" utilisée dans le reste du test NGC et permettant de reconstituer l'empreinte individuelle via les données physiques de consommation n'est pas suffisante). Ils correspondent à l'empreinte des services publics français, et des services marchands que l'on peut considérer comme étant essentiels à la vie de chacun, divisées par la population du pays.

La première catégorie "services publics" comprend par exemple l'empreinte des hôpitaux français, ou de la justice. Nous considérons que cette empreinte doit être également répartie pour tous les citoyens, car ce sont des postes "républicains" que seule la démocratie peut faire évoluer, pas directement par les choix de consommation individuels.

La deuxième catégorie "services marchands" comprend notamment le réseau de télécommunications (fibre, téléphone, etc.), mais aussi les assurances ou encore la poste. Ce sont des services relativement universels pour lesquels nous n'avons pas encore le détail qui nous permettrait de répartir l'empreinte en fonction des choix de consommation des citoyens.

## Principe général

En France, le calcul de l'empreinte carbone nationale est géré par le Service des Données et Etudes Statistiques (SDES) du Ministère de l'Écologie. Le dernier résultat précis est disponible pour l'année 2017. C'est à partir de ces données que l'on retrouve l'ordre de grandeur des 10 tonnes de CO2e par an et par personne.

Les données fournies par le SDES donnent une empreinte carbone correspondant à ce qui est consommé sur le territoire français par branche économique ou bien par groupement de branches économiques. Il est alors possible de diviser l'empreinte carbone calculée au niveau "macro" selon les secteurs d'activités et donc selon les postes de consommation.

Ainsi, l'objectif est de déterminer la part de cette empreinte carbone nationale non comptabilisée dans Nos Gestes Climat afin de produire un chiffre correspondant à une base d'empreinte commune à tous les Français : les services sociétaux.

Ce travail n'est pas évident : pour certaines données, elles sont aggrégées à un niveau au dessus du CPA, pour d'autres, il est nécessaire de descendre au niveau du sous-groupe CPA pour ne capter qu'une partie de la branche.

Pour nous aider, nous disposons des chiffres d'affaires par branche économique _française_ permettant alors de décomposer les intensités carbone selon les intensité économique. Au-delà du fait que ces chiffres d'affaires sont nationaux, un autre problème apparait : certaines données étant confidentielles et donc secrètes. Alors que faire ? Nous avons fait l'hypothèse que ces données l'étaient également pour le calcul de l'empreinte carbone nationale. Faute d'informations supplémentaires, nous avons choisi de ne pas les considérer dans ces calculs de décomposition.

Pour illusttrer la cas de données aggrégées au niveau supérieur CPA, prenons l'exemple de la construction (= F41_43 = 54116 kTCO2e). Via les ratios issus des chiffres d'affaires, on a : F41=25%, F42=13.5%, F43=61.5%.

Pour aller encore plus loin sur un niveau de précision plus important (sous-branches économiques), prenons l'exemple de E38 relatif à la collecte des déchets, seules les sous branches E3812 et E3822, concernant les déchets dangereux, étaient à inclure dans les services publics. Nous avons donc également utilisé la décomposition par chiffre d'affaire pour ressortir l'intensité carbone associées aux sous-branche en question au sein de E38.

Ainsi, nous disposons d'informations suffisantes pour proposer une première version de la décomposition des services sociétaux, "dans l'attente de mieux". Par ailleurs, et vous le verrez dans la suite du document, ces calculs sont automatisés via des scripts javascript qui permettent de reproduire ce travail d'analyse et mettre à jour le modèle avec de nouvelles données en quelques minutes !

![](https://storage.gra.cloud.ovh.net/v1/AUTH_0f20d409cb2a4c9786c769e2edec0e06/imagespadincubateurnet/uploads/upload_cd83618ee65063258012cd3d4ce17933.png)

## Données de départ

Pour réaliser ce travail d'hybridation du modèle d'empreinte carbone individuelle, nous disposons de données très intéressantes :

- [Les données de décomposition de l’empreinte carbone de la demande finale de la France](https://www.statistiques.developpement-durable.gouv.fr/la-decomposition-de-lempreinte-carbone-de-la-demande-finale-de-la-france-par-postes-de-consommation) du SDES. On dispose alors de l'intensité carbone associée à la demande finale totale de la population française pour chaque branche économique (code CPA). Ici en [json](https://github.com/datagir/nosgestesclimat/blob/master/scripts/naf/donn%C3%A9es/liste_SDES.json).

A noter que la nomenclature **CPA** correspond à la **Classification européenne des Produits par Activité** [parallèle de la nomenclature **NACE**](<https://ec.europa.eu/eurostat/statistics-explained/index.php?title=Glossary:Statistical_classification_of_products_by_activity_(CPA)/fr>) qui correspond à la classification statistique des activités économiques dans les communautés européennes [dont découle les code **NAF** (Nomenclature d'Activité Française)](https://webmarche.adullact.org/?page=Entreprise.EntreprisePopupCodeNaf). Il semble la nomenclature entre CPA, NACE et NAF esu quasi-identique. Leur contenu ne l'est pas.

[Un schéma sera plus parlant](<https://ec.europa.eu/eurostat/documents/1995700/1995914/CPA2008introductoryguidelinesFR.pdf/234336a7-1b86-476c-bb1b-fe0ce240090b#:~:text=Communaut%C3%A9s%20europ%C3%A9ennes%20(l'acronyme%20NACE,%C3%A9conomiques%20dans%20les%20Communaut%C3%A9s%20europ%C3%A9ennes).&text=CPC%20d%C3%A9signe%20la%20Classification%20centrale%20des%20produits%20des%20Nations%20unies.&text=CPA%20d%C3%A9signe%20la%20Classification%20europ%C3%A9enne%20des%20produits%20par%20activit%C3%A9.>):

![](https://storage.gra.cloud.ovh.net/v1/AUTH_0f20d409cb2a4c9786c769e2edec0e06/imagespadincubateurnet/uploads/upload_d34243e2db7588c3ab981df2996fa237.png)

- La [liste des codes NAF](https://www.data.gouv.fr/fr/datasets/nomenclature-dactivites-francaise-naf/), ici en [json](https://github.com/datagir/nosgestesclimat/blob/master/scripts/naf/donn%C3%A9es/liste_NAF.json), dont les contenus sont explicité sur [le site de l'INSEE](https://www.insee.fr/fr/metadonnees/nafr2/?champRecherche=true) ou sur le site [NACEV2](https://nacev2.com/fr).

- [Le chiffre d'affaire par branche économique en France en 2017](https://www.insee.fr/fr/statistiques/4226067?sommaire=4226092), selon la nomenclature NAF et au niveau de la "sous-classe", ici en [json](https://github.com/datagir/nosgestesclimat/blob/master/scripts/naf/donn%C3%A9es/ca_branches_2017.json)

## Reproduire le calcul

A venir

## Limites du calcul

- Il est possible que le fichier dont nous disposons pour décomposer les intensités carbone des différentes branches ne soit pas adapté au fichier du SDES. (nomenclature NAF vs CPA) : est ce que le chiffre d'affaire couvre les même périmètres que pour les données du SDES (Territoire française, nomenclature ?)
- Certaines valeurs de ce fichier sont "secrètes" : les budgets associées à la défense ne sont volontairement pas public. Dans une première approche nous avons omis ces postes pour la décomposition des postes d'émission en supposant qu'elles étaient également secrètes pour le SDES. Finalement il semble qu'elles sont connues a des fins statistiques et l'agrégation proposée ne permet pas de remonter jusqu'à ces chiffres. Nous n'avons pour le moment pas d'autres pistes pour résoudre les problèmes liés à cette approche par chiffre d'affaire. Il faudrait explorer d'autres méthodes afin de désagréger ces branches.
- Une autre limite importante à cette méthode de calcul, qui concerne plus généralement l'approche macro-économique, est le caractère homogène ou non du contenu de chaque branche. Par exemple, dans le secteur de la construction, les émissions carbone associées à la construction d'un local en brique, d'une tiny house ou de prestations de finitions (peinture) pour un même investissement seront très hétérogènes. Il s'agira peut-être de creuser certains postes importants des services sociétaux afin de limiter les incertitudes (changements d'approche ?).

## Scripts disponibles

A venir

### `analyse_CA_branches.js`

### `generateNAF_YAML.js`

### `generateNAF2.js`

### `naf.js`

### `set_NAF_division.js`
