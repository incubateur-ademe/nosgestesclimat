<h1 align="center">Hybridation du modèle Nos Gestes Climat via les Services Sociétaux</h1>

<p align="center">Ce fichier contient les informations techniques permettant de comprendre et reproduire le calcul du poste "Services Sociétaux" de <a href="https://nosgestesclimat.fr/">nosgestesclimat.fr</a>.</p>

> 🇬🇧 This guide is dedicated to public services calculation method for French citizens. It gives a method to compute a common carbon footprint base for every French citizen. It is not translated yet as this method is related to French avalaible data.

---

<details open=true>

<summary>Sommaire</summary>

- [Avant propos](#avant-propos)
- [Introduction](#introduction)
- [Principe général de l'approche macroéconomique](#principe-général-de-lapproche-macroéconomique)
  - [Mais comment est calculée l’empreinte carbone par produits (biens ou services) ?](#mais-comment-est-calculée-lempreinte-carbone-par-produits-biens-ou-services-)
- [Couplage de l'approche macroéconomique au modèle Nos Gestes Climat](#couplage-de-lapproche-macroéconomique-au-modèle-nos-gestes-climat)
- [Focus sur les nomenclatures](#focus-sur-les-nomenclatures)
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

## Avant propos

N’hésitez pas à lire cet [article](https://nosgestesclimat.fr/nouveaut%C3%A9s/l'empreinte-climat%20des%20%22services%20soci%C3%A9taux%22) pour comprendre la philosophie du travail mené sur l’implémentation des « services sociétaux » dans Nos Gestes Climat.

Pour résumer NGC, s’est hybridé pour maintenant fusionner deux approches et essayer de profiter des avantages de chacune d’elle :

- L’approche suivie jusqu’ici par Nos Gestes Climat, que l’on peut qualifier de d’approche « micro » et adaptée pour préciser le calcul de l’empreinte carbone individuelle en fonction de la réalité des modes de consommation de chacun Avec toutefois une limite, celles des services utilisés par tous (services publics, services régaliens, etc.) pour lesquels nous ne disposons pas de facteurs d’émissions et dont il serait contreproductif d’essayer d’évaluer une « consommation réelle » ;
- Une approche que l’on peut qualifier de « macro » qui permet de dégager une empreinte carbone moyenne à grande échelle (celle du pays !) et surtout de monitorer son évolution dans le temps sans pour autant retranscrire les multiples différences de consommation des individus. A titre d’exemple, même si vous n’avez jamais mis les pieds sur un bateau de plaisance, l’empreinte carbone moyenne "macro" vous imputera une partie (1/67 millionième) de l’activité de construction et de réparation des bateaux de plaisance ainsi qu’une partie de l’activité des marinas.

## Introduction

Certains postes constituant l'empreinte carbone individuelle sont inhérents à la société à laquelle nous appartenons et ne peuvent pas être captés via l'approche actuelle de NGC (approche "_montante_", "_bottom-up_" ou "_micro_"). C'est pourquoi, nous nous tournons vers l'approche macro-économique pour estimer l'impact des services sociétaux que nous divisons en deux catégories : les services publics français, et les services marchands - que l'on considère comme étant essentiels à la vie de chacun. Le tout divisé par la population du pays.

La première catégorie "services publics" comprend par exemple l'empreinte des hôpitaux français, ou de la justice. Nous considérons que cette empreinte doit être répartie égalitairement entre tous les citoyens, car ce sont des postes "républicains" que seule la l'Etat peut faire évoluer, et non directement les choix de consommation individuels. L’influence de l’individu sur l’empreinte carbone de ces services est toutefois possible mais indirecte via le vote ou les mobilisations citoyennes. Qui plus est, il serait contreproductif et extrêmement difficile d’un point de vue méthodologique d’attribuer la réalité de consommation de ces services (comme attribuer de manière pondérée l’impact du service « éducation » en fonction du nombre d’enfants ou encore ne pas attribuer l’impact du service « justice » à ceux n’ayant jamais eu recours à la justice).

La deuxième catégorie "services marchands" comprend notamment le réseau de télécommunications (fibre, téléphone, etc.), mais aussi les assurances ou encore les services postaux. Ce sont des services utilisés par la grande majorité de la population pour lesquels nous ne disposons pas de données, nous empêchant ainsi de répartir l'empreinte en fonction des choix de consommation des citoyens.

## Principe général de l'approche macroéconomique

En France, le calcul de l'empreinte carbone nationale est géré par le Service des Données et Etudes Statistiques (SDES) du Ministère de la Transition Écologique. Le dernier résultat précis est [disponible pour l'année **2017**](https://www.statistiques.developpement-durable.gouv.fr/la-decomposition-de-lempreinte-carbone-de-la-demande-finale-de-la-france-par-postes-de-consommation). C'est à partir de ces données que l'on retrouve l'ordre de grandeur des "10 tonnes" de CO2e par an et par personne. On parle bien ici d'ordre grandeur car les [derniers chiffres sortis fin 2022 ont évolué](https://www.statistiques.developpement-durable.gouv.fr/lempreinte-carbone-de-la-france-de-1995-2021)).

L‘empreinte carbone fournies par le SDES se décompose en :

- une composante « émissions directes des ménages » représentant la consommation de combustibles fossiles des ménages (pour le transport et le logement notamment)
- une composante demande finale intérieure représentant les produits et services consommés sur le territoire français, et les investissements, en distinguant :
  - les émissions de la production intérieure (les émissions associées à la production intérieure exportées sont exclues)
  - les émissions associées aux importations (les émissions associées aux importations qui sont ensuite « ré-exportées » sont exclues)

Ainsi, ce qui nous intéresse ici c’est la composante demande finale car les émissions directes des ménages sont bien captées par les questions actuelles sur les déplacements et les différents types de chauffage.

La demande finale, qui est satisfaite par la production intérieure et les importations, comprend :

- la consommation finale des ménages
- la consommation finale des administrations publiques
- la consommation finale des organismes à but non lucratifs
- les investissements (formation brute de capital) et la variation des stocks
- les exportations

La consommation finale des administrations publiques comprend les dépenses de consommation collective (défense, justice, etc.) et les dépenses de consommation individuelle (éducation, santé, etc.) assimilables aux transferts sociaux. Considérant que les dépenses de consommation finale des administrations publiques et des institutions à but non lucratifs (associations, syndicats, etc.) fournissent des biens et des services aux ménages, les émissions associées sont inclues dans l’estimation de l’empreinte carbone.

Les investissements et la variation des stocks sont nécessaires aux activités de production. Les émissions associées sont inclues dans l’estimation de l’empreinte carbone. Les émissions ne sont pas amorties dans le temps. Les émissions associées aux investissements d’une année N sont affectées en totalité dans l’empreinte carbone de l’année N .

Les émissions associées aux exportations sont exclues de l’estimation de l’empreinte carbone.

Cette demande finale est ventilée par produits (biens ou services) par branche économique conformémnet à la nomenclature CPA (Classification européenne des Produits par Activité) elle-même issue de la réglementation NACE (voir plus bas). Plus spécifiquement, le SDES met à disposition l’empreinte carbone de la demande finale française, catégorisée selon ces codes CPA, permettant ainsi de déduire l’impact GES des produits et services de certains secteurs d’activités.

### Mais comment est calculée l’empreinte carbone par produits (biens ou services) ?

Le SDES travaille à partir d’agrégat macroéconomiques présentant, en valeur monétaire :

- les ressources (production et importations)
- les emplois (la demande finale et la demande des branches d’activités économiques)

Pour les ressources, les données économiques traduisent les échanges monétaires entres les différentes branches de l’activité économiques françaises catégorisées selon les codes CPA évoqués plus haut. Ces agrégats monétaires sont téléchargeables depuis le site [d’Eurostat](https://ec.europa.eu/eurostat/databrowser/view/NAIO_10_CP1700__custom_4866069/default/table?lang=fr).

> On peut ainsi savoir que la branche Hébergements et Restauration a acheté X euros de produits issus de « l’agriculture, de la chasse et des services associés » et Y euros de produits « textiles », etc. On obtient ce qu’on appelle un Tableau Entrée Sorties (TES), résumant donc tous les échanges monétaires sur une année donnée par pays.

Ces TES sont accessibles [ici](https://www.statistiques.developpement-durable.gouv.fr/estimation-de-lempreinte-carbone-de-1995-2020) (rubrique « Données »/ [Fichier de données associées au calcul de l'empreinte carbone](https://www.statistiques.developpement-durable.gouv.fr/estimation-de-lempreinte-carbone-de-1995-2020)) et existent en plusieurs déclinaisons : TES de la production intérieure + importations ; TES de la production intérieure seulement ; TES des importations (respectivement les onglets « siot05 », « dom05 », « imp05 »).

> Comme nous le verrons plus bas, ces agrégats monétaires ne sont disponibles qu’à l’échelle de code entier et parfois de codes regroupés entre eux. Les données monétaires ne sont pas disponibles à l’échelle des sous-codes, ce qui nous a posé problèmes. Impossible ainsi d’avoir le détail des produits achetés par la branche Hébergement et Restauration parmi les produits de « l’agriculture, de la chasse et des services associés ». Le SDES dispose uniquement du montant monétaire des achats de la branche Hébergement-Restauration à cette catégorie de produit sans aucune discrimination entre sous-code CPA représentant la variété des produits au sein de cette branche.

Par la suite le SDES s’appuie sur le travail du CITEPA qui réalise, chaque année, l’inventaire, des GES et polluants atmosphériques. Cet inventaire spécifique dénommé compte d’émissions dans l’air ou inventaire NAMEA-AIR (Air émissions account) est conçu dans un cadre conceptuel identique à celui des TES précités. Ils permettent de rapprocher les données d’émissions avec des agrégats économiques. Cet inventaire résulte de la ventilation des émissions compilées dans les nomenclatures SNAP (Selected Nomenclature for Air Pollution), la NAPFUE (Nomenclature for Air Pollution of FUEls) et introduit une distinction supplémentaire par le biais d'une rubrique permettant de définir un sous-ensemble de l'activité (par exemple, le type de procédé, le sous-secteur, etc.). Ainsi, actuellement, le système national identifie plus de 1100 activités émettrices élémentaires différentes. Par ailleurs, les méthodes retenues pour réaliser l’inventaire sont diverses : principes méthodologiques du GIEC ou d’organismes de référence étrangers, méthode nationale propre, recueille par enquête spécifique auprès de certains secteurs, consultation des déclarations en ligne pour des activités réglementées et parfois des modélisations spécifiques pour combler les lacunes ou carences en données. Le détail de l’organisation et des méthodes des inventaires nationaux des émissions atmosphériques en France est accessible [ici](https://www.citepa.org/wp-content/uploads/publications/ominea/OMINEA-2022v2.pdf).

**Très bien, mais quel lien avec nos agrégats macro-économiques ?**

Le CITEPA affecte les GES aux branches d’activités émettrices répertoriées par la nomenclature NACE (voir plus bas), miroir de la nomenclature CPA. Le CITEPA réalise donc différents types d’allocations (simples ou complexes) pour, des données d’émissions présentées au niveau le plus fin de la SNAP, aboutir à l’inventaire d’émissions au format NAMEA-AIR catégorisé par branches d’activités. Ces allocations sont détaillées dans ce [document](https://www.citepa.org/wp-content/uploads/rapport_final_IndA_NAMEA-2022.pdf).

Les comptes d’émissions dans l’air de la France sont disponibles sur le site du [SDES](https://www.statistiques.developpement-durable.gouv.fr/inventaire-des-emissions-de-gaz-effet-de-serre-et-des-polluants-atmospheriques-par-branches). A l'échelle européenne, c'est Eurostat qui diffuse les comptes d’émissions dans l’air des États membres de l’UE.

Pour estimer l’empreinte carbone de la France, le SDES se fonde sur les analyses entrées-sorties (ou calcul input-output) développées par le l’économiste Wassily Léontieff. Les TES présentent un équilibre entre les ressources (production et importations) et les emplois (demande). Depuis cet équilibre comptable il est possible d’exprimer la production (et/ou les importations) en fonction de la demande finale. Dans la mesure où il possible d’affecter des émissions de GES à la production (et/ou les importations) grâce aux comptes d’émissions dans l’air, l’analyse entrées-sorties permet d’associer des émissions de GES à la demande finale.

Si êtes à l'aise, n’hésitez pas à creuser le détail avec la note méthodologique [ici](https://www.statistiques.developpement-durable.gouv.fr/sites/default/files/2021-10/m%C3%A9thodologie_empreinte_carbone_octobre2021_0.pdf).

## Couplage de l'approche macroéconomique au modèle Nos Gestes Climat

Maintenant que nous connaissons mieux la méthode de calcul de l’approche macroéconomique voyons comment nous l’avons couplé au modèle de calcul actuel de Nos Gestes Climat
Nous avons commencé par analyser qualitativement l’empreinte carbone de la demande finale afin de

- déterminer les rubriques (c’est-à-dire les codes CPA) de l’empreinte carbone nationale non prise en compte via le questionnaire Nos Gestes Climat. En quelques sortes nous avons cherché à déterminer les « trous dans la raquette » afin de savoir à quel point le périmètre de l’empreinte carbone nationale et celui de NGC se juxtaposent, pour notamment dégager des pistes d’améliorations futures
- déterminer, et c’est ce qui nous intéresse principalement ici, ce qui relève de services utiles et consommés par tous : les services sociétaux

Ce travail n'a pas été évident : pour certaines données, GES, comme nous l’avons dit plus haut, les codes CPA sont agrégés entre eux. Par exemple, les codes E.37, E.38 et E.39, représentant respectivement la collecte et le traitement des eaux usées ; la collecte, le traitement l’élimination et la récupération des déchets ; la dépollution et les autres services de gestion des déchets) pour lesquels la données GES n’est disponible qu’à cette échelle agrégée. Pour d'autres, il a été nécessaire de descendre au niveau du sous-groupe CPA pour ne "capter" qu'une partie de la branche (or les données ne sont pas disponibles à cette échelle « inférieure » des sous-codes). C’est le cas, par exemple, du code CPA F, intitulé « Constructions et travaux de construction », pour laquelle le sous-code « Génie Civil » (F.42) nous intéresse mais pas celui de la « Construction de bâtiments » (F.41) car cela est déjà (en partie) pris en compte via le questionnaire NGC.

**Alors comment faire ?**

Pour nous aider, nous avons utilisé [les chiffres d'affaires par branche économique en France en 2017](https://www.insee.fr/fr/statistiques/4226067?sommaire=4226092) (disponible en json [ici](https://github.com/datagir/nosgestesclimat/blob/master/scripts/services-societaux/input/ca_branches_2017.json) catégorisés selon la nomenclature NAF (voir plus bas) et qui, eux, sont disponibles à l’échelle de code, sous-code et sous-sous-code CPA. Cela nous a ainsi permis de décomposer les intensités carbone des branches (échelle code CPA) selon les intensité économique des sous branches (échelle sous-code CPA). Un problème apparait : certaines données sont confidentielles et donc secrètes. Alors que faire ? Nous avons fait l'hypothèse que ces données l'étaient également pour le calcul de l'empreinte carbone nationale. Faute d'informations supplémentaires, nous avons choisi de ne pas les considérer dans ces calculs de décomposition. Il semble que ces données sont connues à des fins statistiques par le SDES mais nous n'y avons pas accès (voir [Limites du calcul](#limites-du-calcul)).

Pour illustrer un cas de données agrégées au niveau supérieur CPA, reprenons l'exemple de la construction. Dans les données du SDES, les codes CPA F.41, F.42 et F.43 sont agrégés en un seul code CPA_F dont les émissions de GES sont estimées à 54116 kTCO2e). Via les ratios issus des chiffres d'affaires, on a : F41=25%, F42=13.5%, F43=61.5%.

Pour aller encore plus loin et mettre en avant un niveau d'allocation plus avancé (à l'échelle de sous-branches économiques), prenons l'exemple de E38 relatif à la collecte des déchets, seules les sous branches E3812 et E3822, concernant les déchets dangereux, étaient à inclure dans les services publics (NGC évaluant déjà l’impact de la gestion des déchets non dangereux). Nous avons donc ici aussi utilisé la décomposition par chiffre d'affaire pour ressortir l'intensité carbone associée aux sous-branches en question au sein de E38.

Ainsi, avec les données du SDES et les chiffres d’affaires des branches de l’économie française nous disposons d'informations suffisantes pour catégoriser et évaluer l'empreinte carbone des services sociétaux. Par ailleurs, et vous le verrez dans la suite du document, ces calculs sont automatisés via des scripts javascript qui permettent de **reproduire ce travail d'analyse et mettre à jour le modèle avec de nouvelles données en quelques minutes** !

![](https://storage.gra.cloud.ovh.net/v1/AUTH_0f20d409cb2a4c9786c769e2edec0e06/imagespadincubateurnet/uploads/upload_cd83618ee65063258012cd3d4ce17933.png)

Cependant, il s’agit d’une première version, qui souffre de quelques limitations (voir [Limites du calcul](#limites-du-calcul))

## Focus sur les nomenclatures

Revenons sur les nomenclatures que nous venons d’aborder.

Nous avons mentionné la nomenclature la Nomenclature statistique des activités économiques dans la Communauté européenne (NACE) ainsi que la classification européenne des Produits par activités (CPA). Les catégories de produits de la classification CPA sont liées aux activités définies par la nomenclature NACE. Chaque produit de la classification CPA – tout bien ou service transportable ou non – est ainsi associé à une seule activité de la NACE. Ce lien avec les activités de la NACE donne à la CPA une [structure parallèle](<https://ec.europa.eu/eurostat/statistics-explained/index.php?title=Glossary:Statistical_classification_of_products_by_activity_(CPA)/fr>) à celle de la NACE. A savoir également : c’est de la nomenclature NACE européenne que découle la nomenclature NAF française (Nomenclature d'Activité Française). Cette dernière est accessible ici en [json](https://github.com/datagir/nosgestesclimat/blob/master/scripts/services-societaux/input/liste_NAF.json) et les contenus sont explicités sur le site de [l'INSEE](https://www.insee.fr/fr/metadonnees/nafr2/?champRecherche=true) ou sur le site [NACEV2](https://nacev2.com/fr).

[Un schéma sera plus parlant](https://user-images.githubusercontent.com/66410914/232066436-5b86d987-9d90-4dfb-ae58-f46ccd44ac48.png)

![Schéma_nomenclature](https://user-images.githubusercontent.com/66410914/232079560-e24786da-61e8-402f-851f-5986dcb259bb.png)

Nous avons également évoqué les nomenclatures liées aux polluants atmosphériques :

- la nomenclature SNAP (Selected Nomenclature for Air Pollution) qui est une nomenclature européenne relative aux activités émettrices de polluants. Elle comporte onze catégories d'émetteurs :
  - Combustion dans les industries de l'énergie et de la transformation de l'énergie
  - Combustion hors industrie
  - Combustion dans l'industrie manufacturière
  - Procédés de production
  - Extraction et distribution de combustibles fossiles/énergie géothermique
  - Utilisation de solvants et autres produits
  - Transports routiers
  - Autres sources mobiles et machines
  - Traitement et élimination des déchets
  - Agriculture et sylviculture
  - Autres sources et puit
- la NAPFUE (Nomenclature for Air Pollution of FUEls) qui est une nomenclature européenne relative aux combustibles polluants. Cette nomenclature permet de renseigner quel combustible est à l’origine des émissions de composés dans l’atmosphère (notamment au sein d’une activité émettrice caractérisé par son code SNAP)

## Reproduire le calcul

### 1) Préparer les données financières en vue de la décomposition des données du SDES

Pour cette première étape, on utilise le script `analyze_NAF_CA.js` qui permet d'obtenir pour chaque branche et sous-branche la part de chiffre d'affaire (en %) de chaque sous branche au sein de la branche à laquelle elle appartient.

> N'oublions pas que l'objectif final est de catégoriser, les branches économiques relevant des services sociétaux, ce qui nécessite parfois de descendre au niveau de la "sous-branche".

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

Certains chiffres d'affaires sont marquées "S" (signifiant "soumis au secret statistique") : c'est le cas pour l'extraction de gaz naturel, l'industrie du tabac ou encore les engins militaires. Dans la suite nous prendrons l'exemple des produits des industries alimentaires, boissons et produits à base de tabac, soit respectivement les codes CPA C.10, C.11 et C.12. Ces derniers sont agrégés ensemble dans les données fournies par le SDES et les chiffres d’affaires des branches C.10 et C.11 sont connus tandis que le CA de la branche C.12 est inconnu.

Le SDES nous a confirmé, suite à des échanges en décembre 2022, que ces valeurs leur sont connues, ce qui implique que l'intensité carbone de chaque groupement de branches comprend les intensités carbone des branches "S". Comment donc traiter ces branches ? Deux possibilités s’offraient à nous

Une première possibilté de gestion de ces valeurs inconnues consistait à estimer leur poids GES sur la base d'un ratio basé sur le nombre de branches composant chaque groupement. Ainsi, dans notre exemple du code CPA agrégé C.10-C.12, considérer que C.12 représente 33% et que C.10 et C.11 se partagent les 67% restants selon leurs parts de CA.

Une autre option était d'ignorer les branches secrètes car ne connaissant pas le CA, il nous était impossible d'estimer d'une manière ou d'une autre le poids GES de ces branches secrètes. En prenant du recul sur l'objectif de ce travail, on se rend compte que très peu de branches secrètes rentrent dans notre composition des services sociétaux. Il ne semble donc pas aberrant de ne pas chercher à combler ces "trous". Cependant, il est important de garder en tête cette problématique pour la prochaine version.

### 2) Décomposer les données du SDES

La deuxième étape est l'allocation GES à partir des données du SDES (`liste_SDES.json`) via les parts du chiffre d'affaire de chaque branche (`ca_branches_2017.json`). Pour rappel, les données GES de l’empreinte carbone de la demande finale de la France n’existent qu’à l’échelle de code CPA entier et sont même parfois agrégés à l’échelle de plusieurs codes (exemple : CPA_E36 / CPA_E37_E39).

> Ces agrégations ne sont pas issues de la volonté du SDES, mais de la disponibilité des données monétaires qui se trouvent déjà agrégés pour certains codes et des données d’émissions de GES restituées par branches à 2 chiffres par le Citepa ou par Eurostat pour nos partenaires commerciaux

Nous utilisons le script `desagregate_naf_SDES.js`. Le fichier de sortie est `liste_SDES_traitée.json`.

Un fichier intermédiaire pour effectuer ce calcul est `SDES_groups.json`, qui permet de gérer les groupements de branches évoqués précédemment. La création des clés d'allocation de ce fichier a été réalisé "manuellement" lors de la création de ces scripts et est mis à jour dans le script (à condition que la constitution des groupements ne change pas).

### 3) Etudier la composition de chacune des branches économiques et justifier les choix de répartition

Troisième étape et non des moindres : définir ce que l’on considère relever des services sociétaux via les descriptions techniques de chaque branche économique. Pour rappel, chacune des catégories de la nomenclature NAF sont accessibles sur [le site de l'INSEE](https://www.insee.fr/fr/metadonnees/nafr2/?champRecherche=true) ou encore des sites comme [NACEV2](https://nacev2.com/fr).

Le travail a été conséquent : l'idée était de passer en revue l'ensemble des branches afin de déterminer si tout ou partie de la branche était "pris en compte (ou sensé l'être)" par l'approche "micro" du questionnaire NGC (cf. Avant-propos). Dans le cas contraire, il a fallu ensuite qualifier ce qui relevait des services publics et des services marchands tout en pouvant le justifier. Ces justifications sont, pour certaines branches, contestables et nous espérons pouvoir ouvrir le débat avec des contributeurs

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

Le premier est à la base des règles appelées dans les 2 derniers mais aussi à la base du fichier `empreinte nationale.yaml`, fichier permettant d'exposer dans [la documentation](https://nosgestesclimat.fr/documentation/empreinte-SDES) les données du SDES qui mènent à l'ordre de grandeur des "10 tonnes" bien connu.

> **Note**
> La commande `yarn generate:servicesRules` depuis `nosgestesclimat-site` permet de générer le fichier de règles et donc d'effectuer toutes les étapes précédentes en quelques secondes.

## Limites du calcul

- Il est possible que le fichier dont nous disposons pour décomposer les intensités carbone des différentes branches ne soit pas adapté au fichier du SDES. (**nomenclature NAF vs CPA**) : est ce que le chiffre d'affaire couvre les même périmètres que pour les données du SDES (Territoire française, nomenclature ?). Par ailleurs, ces chiffres d'affaire inclut également ce qui est vendu et **exporté**, on fait donc implicitement l'hypothèse que les chiffre d'affaire correspond à 50% de ventes sur le territoire français et 50% à l'étranger.
- **Certaines valeurs de ce fichier sont "secrètes"** : les budgets associés à la défense ne sont volontairement pas rendus publics. Dans une première approche nous avons omis ces postes pour la décomposition des postes d'émission en supposant qu'elles étaient également secrètes pour le SDES. Finalement il semble qu'elles sont connues à des fins statistiques et l'agrégation proposée ne permet pas de remonter jusqu'à ces chiffres. Nous n'avons pour le moment pas d'autres pistes pour résoudre les problèmes liés à cette approche par chiffre d'affaire. Il faudrait explorer d'autres méthodes afin de désagréger ces branches.
- Une autre limite importante à cette méthode de calcul, qui concerne plus généralement l'approche macro-économique, est le **caractère homogène ou non des produits de chaque branche**. Par exemple, dans le secteur de la construction, les émissions carbone associées à la construction d'un local en brique, d'une tiny house ou de prestations de finitions (peinture) pour un même investissement seront très hétérogènes. Il s'agira peut-être de creuser certains postes importants des services sociétaux afin de limiter les incertitudes (changements d'approche ?).

## Scripts disponibles

### `analyze_CA_NAF.js`

### `desagregate_naf_SDES.js`

### `genereate_rules.js`

### `utils.js`