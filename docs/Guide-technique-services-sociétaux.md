<h1 align="center">Hybridation du modèle Nos Gestes Climat via les Services Sociétaux</h1>

<p align="center">Ce fichier contient les informations techniques permettant de comprendre et reproduire le calcul du poste "Services Sociétaux" de <a href="https://nosgestesclimat.fr/">nosgestesclimat.fr</a>.</p>

> 🇬🇧 This guide is dedicated to public services calculation method for French citizens. It gives a method to compute a common carbon footprint base for every French citizen. It is not translated yet as this method is related to French avalaible data.

---

<details open=true>

<summary>Sommaire</summary>

- [Introduction](#introduction)
- [Principe général](#principe-général)
- [Données de départ](#données-de-départ)
- [Reproduire le calcul](#reproduire-le-calcul)
	- [1) Préparer les données financières en vue de la décomposition des données du SDES](#1-préparer-les-données-financières-en-vue-de-la-décomposition-des-données-du-sdes)
		- [Cas des valeurs "secrètes"](#cas-des-valeurs-secrètes)
	- [2) Décomposer les données du SDES](#2-décomposer-les-données-du-sdes)
	- [3) Etudier la composition de chacune des branches économiques et justifier les choix de répartition](#3-etudier-la-composition-de-chacune-des-branches-économiques-et-justifier-les-choix-de-répartition)
	- [4) Générer les règles des services sociétaux](#4-générer-les-règles-des-services-sociétaux)
- [Limites du calcul](#limites-du-calcul)
- [Scripts disponibles](#scripts-disponibles)
	- [`analyze_CA_NAF.js`](#analyze_ca_nafjs)
	- [`desagregate_naf_SDES.js`](#desagregate_naf_sdesjs)
	- [`genereate_rules.js`](#genereate_rulesjs)
	- [`utils.js`](#utilsjs)

</details>

---

## Introduction

> **Warning**
>
> **Un pré-requis pour vous lancer dans ce guide est la lecture de notre article sur [l'implémentation des "services scoiétaux" dans Nos Gestes Climat](https://nosgestesclimat.fr/nouveaut%C3%A9s/l'empreinte-climat%20des%20%22services%20soci%C3%A9taux%22).**

**En bref**, certains postes constituant l'empreinte carbone individuelle sont inhérents à la société à laquelle nous appartenons et ne peuvent pas être captés autrement que via une approche macro-économique (i.e. l'approche "montante" utilisée dans le reste du test NGC et permettant de reconstituer l'empreinte individuelle via les données physiques de consommation n'est pas suffisante). Ils correspondent à l'empreinte des services publics français, et des services marchands -- que l'on considère comme étant essentiels à la vie de chacun. Le tout divisé par la population du pays.

La première catégorie "services publics" comprend par exemple l'empreinte des hôpitaux français, ou de la justice. Nous considérons que cette empreinte doit être également répartie pour tous les citoyens, car ce sont des postes "républicains" que seule la démocratie peut faire évoluer, pas directement par les choix de consommation individuels.

La deuxième catégorie "services marchands" comprend notamment le réseau de télécommunications (fibre, téléphone, etc.), mais aussi les assurances ou encore la poste. Ce sont des services utilisés par la grande majorité de la population pour lesquels nous n'avons pas encore le détail qui nous permettrait de répartir l'empreinte en fonction des choix de consommation des citoyens.

## Principe général

En France, le calcul de l'empreinte carbone nationale est géré par le Service des Données et Etudes Statistiques (SDES) du Ministère de l'Écologie. Le dernier résultat précis est [disponible pour l'année **2017**](https://www.statistiques.developpement-durable.gouv.fr/la-decomposition-de-lempreinte-carbone-de-la-demande-finale-de-la-france-par-postes-de-consommation). C'est à partir de ces données que l'on retrouve l'ordre de grandeur des 10 tonnes de CO2e par an et par personne ([voir derniers chiffres sortis fin 2022](https://www.statistiques.developpement-durable.gouv.fr/lempreinte-carbone-de-la-france-de-1995-2021)).

Les données fournies par le SDES donnent une empreinte carbone correspondant à ce qui est consommé sur le territoire français par branche économique ou bien par groupement de branches économiques. Ces branches sont issues de la nomenclature CPA (Classification européenne des Produits par Activité). **Il est alors possible de diviser l'empreinte carbone calculée au niveau "macro" selon les secteurs d'activités et donc selon les postes de consommation.**

Ainsi, l'objectif est de **déterminer la part de cette empreinte carbone nationale non comptabilisée dans Nos Gestes Climat** afin de produire un chiffre correspondant à une base d'empreinte commune à tous les Français : les services sociétaux.

Ce travail n'est pas évident : pour certaines données, elles sont aggrégées à un niveau au dessus du CPA, pour d'autres, il est nécessaire de descendre au niveau du sous-groupe CPA pour ne capter qu'une partie de la branche.

Pour nous aider, nous disposons des chiffres d'affaires par branche économique _française_ permettant alors de décomposer les intensités carbone selon les intensité économique. Un problème apparait : certaines données étant confidentielles et donc secrètes. Alors que faire ? Nous avons fait l'hypothèse que ces données l'étaient également pour le calcul de l'empreinte carbone nationale. Faute d'informations supplémentaires, nous avons choisi de ne pas les considérer dans ces calculs de décomposition. Il semble que ces données sont connues à des fins statistiques par le SDES mais nous n'y avons pas accès (voir [Limites du calcul](#limites-du-calcul)).

Pour illustrer la cas de données aggrégées au niveau supérieur CPA, prenons l'exemple de la construction (= F41_43 = 54116 kTCO2e). Via les ratios issus des chiffres d'affaires, on a : F41=25%, F42=13.5%, F43=61.5%.

Pour aller encore plus loin sur un niveau de précision plus avancé (sous-branches économiques), prenons l'exemple de E38 relatif à la collecte des déchets, seules les sous branches E3812 et E3822, concernant les déchets dangereux, étaient à inclure dans les services publics. Nous avons donc également utilisé la décomposition par chiffre d'affaire pour ressortir l'intensité carbone associée aux sous-branches en question au sein de E38.

Ainsi, nous disposons d'informations suffisantes pour proposer une première version de la décomposition des services sociétaux, "dans l'attente de mieux". Par ailleurs, et vous le verrez dans la suite du document, ces calculs sont automatisés via des scripts javascript qui permettent de **reproduire ce travail d'analyse et mettre à jour le modèle avec de nouvelles données en quelques minutes** !

![](https://storage.gra.cloud.ovh.net/v1/AUTH_0f20d409cb2a4c9786c769e2edec0e06/imagespadincubateurnet/uploads/upload_cd83618ee65063258012cd3d4ce17933.png)

## Données de départ

Pour réaliser ce travail d'hybridation du modèle d'empreinte carbone individuelle, nous disposons de données très intéressantes :

- [Les données de décomposition de l’empreinte carbone de la demande finale de la France](https://www.statistiques.developpement-durable.gouv.fr/la-decomposition-de-lempreinte-carbone-de-la-demande-finale-de-la-france-par-postes-de-consommation) du SDES. On dispose alors de l'intensité carbone associée à la demande finale totale de la population française pour chaque branche économique (code CPA). Ici en [json](https://github.com/datagir/nosgestesclimat/blob/master/scripts/naf/donn%C3%A9es/liste_SDES.json).

A noter que la nomenclature **CPA** correspond à la **Classification européenne des Produits par Activité** [parallèle de la nomenclature **NACE**](<https://ec.europa.eu/eurostat/statistics-explained/index.php?title=Glossary:Statistical_classification_of_products_by_activity_(CPA)/fr>) qui correspond à la classification statistique des activités économiques dans les communautés européennes [dont découlent les code **NAF** (Nomenclature d'Activité Française)](https://webmarche.adullact.org/?page=Entreprise.EntreprisePopupCodeNaf). Il semble la nomenclature entre CPA, NACE et NAF esu quasi-identique. Leur contenu ne l'est pas.

[Un schéma sera plus parlant](<https://ec.europa.eu/eurostat/documents/1995700/1995914/CPA2008introductoryguidelinesFR.pdf/234336a7-1b86-476c-bb1b-fe0ce240090b#:~:text=Communaut%C3%A9s%20europ%C3%A9ennes%20(l'acronyme%20NACE,%C3%A9conomiques%20dans%20les%20Communaut%C3%A9s%20europ%C3%A9ennes).&text=CPC%20d%C3%A9signe%20la%20Classification%20centrale%20des%20produits%20des%20Nations%20unies.&text=CPA%20d%C3%A9signe%20la%20Classification%20europ%C3%A9enne%20des%20produits%20par%20activit%C3%A9.>):

![](https://storage.gra.cloud.ovh.net/v1/AUTH_0f20d409cb2a4c9786c769e2edec0e06/imagespadincubateurnet/uploads/upload_d34243e2db7588c3ab981df2996fa237.png)

- La [liste des codes NAF](https://www.data.gouv.fr/fr/datasets/nomenclature-dactivites-francaise-naf/), ici en [json](https://github.com/datagir/nosgestesclimat/blob/master/scripts/naf/donn%C3%A9es/liste_NAF.json), dont les contenus sont explicité sur [le site de l'INSEE](https://www.insee.fr/fr/metadonnees/nafr2/?champRecherche=true) ou sur le site [NACEV2](https://nacev2.com/fr).

- [Le chiffre d'affaire par branche économique en France en 2017](https://www.insee.fr/fr/statistiques/4226067?sommaire=4226092), selon la nomenclature NAF et au niveau de la "sous-classe", ici en [json](https://github.com/datagir/nosgestesclimat/blob/master/scripts/naf/donn%C3%A9es/ca_branches_2017.json)

## Reproduire le calcul

### 1) Préparer les données financières en vue de la décomposition des données du SDES

Pour cette première étape, on utilise le script `analyze_NAF_CA.js` qui permet d'obtenir pour chaque branche et sous-branche la part de chiffre d'affaire (en %) de chaque élément au sein du groupe auquel il appartient.

> N'oublions pas que l'objectif final est d'atribuer, parmi l'ensemble des branches écnomiques, celles qui composent les services sociétaux, ce qui nécessite parfois de descendre au niveau de la "sous-branche".

> Le fichier d'entrée (`ca_branches_2017.json`) correspond au chiffre d'affaire par branche économique en France en 2017. Il est tout a fait possible de traiter de la même manière les données pour d'autres années.

Le fichier de sortie est `analyse_CA_NAF.json`.

Ainsi, en prenant l'exemple de la branche "08" (Autres industries extractives), on passe de

```json
{
		"branche": "08",
		"libellé": "Autres industries extractives",
		"ca": "4903.8"
	},
	{
		"branche": "081",
		"libellé": "Extraction de pierres, de sables et d'argiles",
		"ca": "4411.5"
	},
	{
		"branche": "0811",
		"libellé": "Extraction de pierres ornementales et de construction, de calcaire industriel, de gypse, de craie et d'ardoise",
		"ca": "508.3"
	},
	{
		"branche": "0811Z",
		"libellé": "Extraction de pierres ornementales et de construction, de calcaire industriel, de gypse, de craie et d'ardoise",
		"ca": "508.3"
	},
	{
		"branche": "0812",
		"libellé": "Exploitation de gravières et sablières, extraction d’argiles et de kaolin",
		"ca": "3903.1"
	},
	{
		"branche": "0812Z",
		"libellé": "Exploitation de gravières et sablières, extraction d’argiles et de kaolin",
		"ca": "3903.1"
	},
	{
		"branche": "089",
		"libellé": "Activités extractives n.c.a.",
		"ca": "492.4"
	},
	{
		"branche": "0891",
		"libellé": "Extraction des minéraux chimiques et d'engrais minéraux",
		"ca": "63.2"
	},
	{
		"branche": "0891Z",
		"libellé": "Extraction des minéraux chimiques et d'engrais minéraux",
		"ca": "63.2"
	},
	{
		"branche": "0892",
		"libellé": "Extraction de tourbe",
		"ca": "60.8"
	},
	{
		"branche": "0892Z",
		"libellé": "Extraction de tourbe",
		"ca": "60.8"
	},
	{
		"branche": "0893",
		"libellé": "Production de sel",
		"ca": "153.1"
	},
	{
		"branche": "0893Z",
		"libellé": "Production de sel",
		"ca": "153.1"
	},
	{
		"branche": "0899",
		"libellé": "Autres activités extractives n.c.a.",
		"ca": "215.2"
	},
	{
		"branche": "0899Z",
		"libellé": "Autres activités extractives n.c.a.",
		"ca": "215.2"
	}
```

à :

```json
"8":
  {
		"branche": "08",
		"libellé": "Autres industries extractives",
		"ca": 4903.8,
		"composition": [
			{
				"branche": "081",
				"libellé": "Extraction de pierres, de sables et d'argiles",
				"ca": 4411.5,
				"part": "90%",
				"description": [
					{
						"branche": "0811",
						"libellé": "Extraction de pierres ornementales et de construction, de calcaire industriel, de gypse, de craie et d'ardoise",
						"ca": "508.3",
						"part": "12%"
					},
					{
						"branche": "0812",
						"libellé": "Exploitation de gravières et sablières, extraction d’argiles et de kaolin",
						"ca": "3903.1",
						"part": "88%"
					}
				]
			},
			{
				"branche": "089",
				"libellé": "Activités extractives n.c.a.",
				"ca": 492.4,
				"part": "10%",
				"description": [
					{
						"branche": "0891",
						"libellé": "Extraction des minéraux chimiques et d'engrais minéraux",
						"ca": "63.2",
						"part": "13%"
					},
					{
						"branche": "0892",
						"libellé": "Extraction de tourbe",
						"ca": "60.8",
						"part": "12%"
					},
					{
						"branche": "0893",
						"libellé": "Production de sel",
						"ca": "153.1",
						"part": "31%"
					},
					{
						"branche": "0899",
						"libellé": "Autres activités extractives n.c.a.",
						"ca": "215.2",
						"part": "44%"
					}
				]
			}
		]
	}
```

#### Cas des valeurs "secrètes"

Certains chiffres d'affaire sont marquées "S" (ie, "soumises au secret statistique") : c'est le cas pour l'extraction de gaz naturel, l'industrie du tabac ou encore les engins militaires. Dans la suite nous prendrons l'exemple du groupement SDES C10_12 comprenant C10, C11 dont le CA est connu et C12 inconnu.

Le SDES nous a confirmé, suite à des échanges en décembre 2022, que ces valeurs leur sont connues, ce qui implique que l'intensité carbone de chaque groupement de branches comprend les intensités carbone des branches "S".

Une première possibilté de gestion de ces valeurs inconnues consistait à les prendre en compte sur la base d'un ratio basé sur le nombre de branche composant chaque groupement. Ansi considérer que C12 représente 33% et que C10 et C11 se partagent les 67% restants selon leurs parts de CA. Mais pour quelle raison devrait-on s'en tenir à une définition de nomenclature arbitraire ?

Une autre option était d'ignorer les branches secrètes. On ne connait pas ces valeurs secrètes, il semble impossible d'estimer d'une manière ou d'une autre la part de ces branchs secrètes. En prenant du recul sur l'objectif de ce travail, on se rend compte que peu de branches secrètes sont intéressantes dans la composition des services sociétaux ce qui ne semble pas une hypothèse trop forte que de ne pas chercher à combler ces "trous". Cependant, il est important de garder en tête cette problématique pour la prochaine version.

### 2) Décomposer les données du SDES

La deuxième étape est la désagrégation des données du SDES (`liste_SDES.json`) via les parts du chiffre d'affaire de chaque branche (`ca_branches_2017.json`). Pour rappel, les données de décomposition de l’empreinte carbone de la demande finale de la France sont rapportées parfois au niveau de la branche économique, parfois au niveau d'un regroupement de branches (exemple : CPA_E36 / CPA_E37_E39).

> Ces aggrégations semblent d'ailleurs volontaire car elles permettent de ne pas pouvoir remonter aux valeurs statistiques secrètes. Elles sont également dépendantes du niveau de données accessibles pour les calculs matriciels intermédiaires.

Nous utilisons le script `desagregate_naf_SDES.js`. Le fichier de sortie est `liste_SDES_traitée.json`.

Un fichier intermédiaire pour effectuer ce calcul est `SDES_groups.json`, qui permet de gérer les groupements de branches évoqués précédemment. La création des clés de ce fichier a été géré "manuellement" lors de la création de ces scripts et est mis à jour dans le script (à condition que la consitution des groupement ne change pas).

### 3) Etudier la composition de chacune des branches économiques et justifier les choix de répartition

Troisième étape et non des moindres : définir le contenu des services sociétaux via les descriptions de chaque branches économiques. En effet, l'idée de la première étape était également de rentrer au niveau de la sous classe pour exposer le contenu de chaque branche et les part de chaque sous-classe en terme de chiffre d'affaire. Pour comprendre chacune des catégories, il a également été nécessaire de parcourir [le site de l'INSEE](https://www.insee.fr/fr/metadonnees/nafr2/?champRecherche=true) ou encore des sites comme [NACEV2](https://nacev2.com/fr).

Le travail était conséquent : l'idée était de passer en revue l'ensemble des branches afin d'essayer de savoir si tout ou partie de la branche était "comptabilisé (ou sensé l'être)" dans NGC. Dans le cas contraire, il fallait ensuite décider ce qui relevait des services publics et des services marchands et surtout le justifier, selon notre compréhension des choses (avec pour objectif d'ouvrir le débat avec des contributeurs) !

Ici pas de script, cette répartition est définie dans le fichier `répartition_services_sociétaux.yaml`.

### 4) Générer les règles des services sociétaux

Quatrième et dernière étape, la génération des règles publicodes ! Et c'est le script `generate_rules.js` qui permet de le faire automatiquement à partir de 3 fichiers générés précédemment :

- `liste_SDES_traitée.json`
- `analyse_CA_NAF.json`
- `répartition_services_sociétaux.yaml`

Un autre fichier a été utilisé, nommé `titres_raccourcis.yaml` qui permet de simplifier certains libellés de branches pour que l'utilisateur ait une idée plus rapidement du contenu de la décomposition.

3 fichiers de règles sont alors créés :

- `empreinte par branche.yaml`
- `services publics.yaml`
- `services marchands.yaml`

Le premier est à la base des règles appelées dans les 2 derniers mais aussi dans `empreinte nationale.yaml` permettant alors d'exposer dans [la documentation](https://nosgestesclimat.fr/documentation/empreinte-SDES) les chiffres du SDES qui mène à l'ordre de grandeur des 10 tonnes bien connu.

> **Note**
> La commande `yarn generate:servicesRules` depuis `nosgestesclimat-site` permet de générer le fichier de règles et donc d'effectuer toutes les étapes précédentes en quelques secondes.

## Limites du calcul

- Il est possible que le fichier dont nous disposons pour décomposer les intensités carbone des différentes branches ne soit pas adapté au fichier du SDES. (**nomenclature NAF vs CPA**) : est ce que le chiffre d'affaire couvre les même périmètres que pour les données du SDES (Territoire française, nomenclature ?). Par ailleurs, ces chiffres d'affaire inclut également ce qui est vendu et **exporté**, on fait donc implicitement l'hypothèse que les chiffre d'affaire correspond à 50% de ventes sur le territoire français et 50% à l'étranger.
- **Certaines valeurs de ce fichier sont "secrètes"** : les budgets associés à la défense ne sont volontairement pas public. Dans une première approche nous avons omis ces postes pour la décomposition des postes d'émission en supposant qu'elles étaient également secrètes pour le SDES. Finalement il semble qu'elles sont connues a des fins statistiques et l'agrégation proposée ne permet pas de remonter jusqu'à ces chiffres. Nous n'avons pour le moment pas d'autres pistes pour résoudre les problèmes liés à cette approche par chiffre d'affaire. Il faudrait explorer d'autres méthodes afin de désagréger ces branches.
- Une autre limite importante à cette méthode de calcul, qui concerne plus généralement l'approche macro-économique, est le **caractère homogène ou non du contenu de chaque branche**. Par exemple, dans le secteur de la construction, les émissions carbone associées à la construction d'un local en brique, d'une tiny house ou de prestations de finitions (peinture) pour un même investissement seront très hétérogènes. Il s'agira peut-être de creuser certains postes importants des services sociétaux afin de limiter les incertitudes (changements d'approche ?).

## Scripts disponibles

### `analyze_CA_NAF.js`

### `desagregate_naf_SDES.js`

### `genereate_rules.js`

### `utils.js`
