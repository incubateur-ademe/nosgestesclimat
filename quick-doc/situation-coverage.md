### Questions non couvertes

> Il y a **35** questions non couvertes sur un total de **221** questions.

| Règle | Question | Valeur par défaut |
| --- | --- | --- |
| logement . chauffage . baisse température . nombre degrés | De combien de degrés seriez-vous prêt à diminuer la température de votre logement ? | 1 |
| logement . nombre colocataires | Combien de colocataires pourriez-vous accueillir ? | 1 |
| logement . installer photovoltaique . nombre panneaux | Combien de panneaux pourriez-vous installer ? | 4 |
| logement . installer photovoltaique . zone climatique | Où se situe votre logement en France ? | 'centre et littoral atlantique' |
| transport . voiture . boulot . voyageurs | Combien êtes-vous dans la voiture pour vos trajets domicile-travail ? | 1 |
| transport . voiture . boulot . covoiturage . nombre de covoitureurs | Combien de personnes pourraient covoiturer avec vous ? | 1 |
| transport . voiture . boulot . sans voiture . type | Si vous deviez ne plus prendre votre voiture pour vous rendre au travail quel autre moyen de transport pourriez-vous utiliser ? | 'bus' |
| transport . voiture . boulot . télétravail . jours télétravaillés | Combien de jours de télétravail par semaine pourriez-vous faire ? | 4 |
| transport . voiture . limitation autoroute . km autoroute | Combien de km à l'année faites-vous sur autoroute (à peu près) ? | voiture . km * 0.1 |
| métrique |  | 'carbone' |
| déforestation |  | oui |
| divers . animaux domestiques . empreinte . chats . alimentation . besoins énergétiques journaliers . facteur énergie . activité |  | 'actif' |
| divers . animaux domestiques . empreinte . chiens . alimentation . besoins énergétiques journaliers . facteur énergie . activité |  | 'actif' |
| divers . électroménager . appareils . petit réfrigérateur . nombre | Combien de petits réfrigérateurs possédez-vous ? | 0 |
| logement . chauffage . gaz . consommation estimée via le coût . saisie | Pas de facture ? Entrez vos dépenses approximatives par mois |  |
| logement . chauffage . bouteille gaz . consommation estimée via le poids . saisie | Vous utilisez un format de bonbonne différent ? Entrez votre consommation annuelle en kg. |  |
| logement . chauffage . citerne propane . consommation estimée via le coût . saisie | Pas de facture ? Entrez vos dépenses approximatives par mois |  |
| logement . chauffage . fioul . consommation estimée via le coût . saisie | Pas de facture ? Entrez vos dépenses approximatives par mois |  |
| logement . chauffage . bois . type . granulés . consommation estimée via le coût . saisie | Pas de facture ? Entrez vos dépenses approximatives par mois |  |
| logement . chauffage . bois . type . bûches . consommation estimée via le coût . saisie | Pas de facture ? Entrez vos dépenses approximatives par mois |  |
| logement . chauffage . réseau de chaleur . consommation | Quelle est votre consommation annuelle d'énergie via le réseau de chaleur raccordé à votre foyer ? | parc français . chauffage . consommation réseau de chaleur par m2 * surface |
| logement . chauffage . réseau de chaleur . consommation estimée via le coût . saisie | Pas de facture ? Entrez vos dépenses approximatives par mois |  |
| logement . construction . rénovation . travaux . extension . taille | Quelle est la taille de l'extension réalisée (en m²) ? | 0.2 * logement . surface |
| logement . eau domestique . bains et douches . habitude |  | 'bain parfois' |
| logement . eau domestique . toilettes . nombre |  | 3 |
| logement . eau domestique . toilettes . type |  | 'classiques' |
| logement . électricité . réseau . consommation estimée via le coût . saisie | Pas de facture ? Entrez vos dépenses approximatives par mois |  |
| logement . électricité . photovoltaique . production estimée via la puissance installée . saisie | Pas de relevé ? Entrez ici votre puissance installée.

_(Sachez qu'en moyenne, 1 panneau = 400 Wc)_
 |  |
| logement . vacances . échange . nombre de nuitées | Combien de nuits passez-vous en échange de maison par an ? | moyenne |
| transport . mobilité douce . vae . km | Combien de kilomètres faites-vous à l'année avec votre Vélo à Assistance Électrique (VAE) ? | 1000 |
| transport . vacances . van . km | Quelle distance parcourez-vous à l'année en van ? | 9310 |
| transport . vacances . van . consommation aux 100 | Connaissez-vous la consommation moyenne de votre van ? | 9 |
| transport . voiture . thermique . carburant | Quel type de carburant votre voiture consomme-t-elle ? | 'essence E5 ou E10' |
| transport . voiture . électrique . consommation aux 100 | Connaissez-vous la consommation moyenne de la voiture ? | consommation estimée |
| transport . voiture . barème construction . barème électrique . batterie . capacité |  | [object Object] |

### Questions couvertes

| Règle | Question | Personas |
| --- | --- | --- |
| logement . température | À quelle température chauffez-vous votre logement ? | Yoram |
| logement . propriétaire | Etes-vous propriétaire de votre logement ? | Yoram, Mehdi |
| logement . chauffage collectif | Votre chauffage est-il collectif ou individuel ? | Yoram, Corentin |
| transport . voiture . boulot . jours travaillés en voiture | Combien de jours par semaine prenez-vous votre voiture pour aller au travail ? | Mehdi |
| transport . voiture . boulot . distance . km aller | A quelle distance de chez vous se situe votre travail ? | Mehdi |
| transport . voiture . boulot . télétravail . compatible | Votre travail est-il totalement ou en partie compatible avec le télétravail ? | Mehdi |
| transport . voiture . voiture 5km . fréquence | Combien de fois par semaine prenez-vous la voiture pour moins de 5km ? | Sylviane |
| alimentation . boisson . chaude . café . nombre | Nombre de cafés par jour | Yoram, Sandy, Jessica, Nolan |
| alimentation . boisson . chaude . thé . nombre | Nombre de thés par jour | Yoram, Sandy, Jessica, Nolan |
| alimentation . boisson . chaude . chocolat chaud . nombre | Nombre de chocolats chauds par jour | Yoram, Sandy, Jessica, Nolan |
| alimentation . boisson . chaude . chicorée . nombre | Nombre de tasses de chicorée par jour | Yoram, Sandy, Sylviane, Jessica, Nolan |
| alimentation . type de lait | Le lait que vous consommez est-il d'origine animale ou végétale ? | Yoram, Corentin, Sandy, Anne Claire, Gérard |
| alimentation . boisson . eau en bouteille . consommateur | Buvez-vous votre eau en bouteille ? | Yoram, Corentin, Sandy, Mehdi, Sylviane, Jessica, Nolan, Gérard |
| alimentation . boisson . sucrées . litres | Quelle est votre consommation par semaine de sodas, jus de fruits, etc. ? | Yoram, Corentin, Sandy, Mehdi, Sylviane, Jessica, Nolan, Gérard |
| alimentation . boisson . alcool . litres | Quelle est votre consommation par semaine d'alcool (vin, bière, etc.) ? | Yoram, Corentin, Sandy, Mehdi, Sylviane, Jessica, Nolan, Gérard |
| alimentation . déchets . quantité jetée | Comment estimeriez-vous la quantité de déchets que vous jetez ? | Yoram, Sandy, Mehdi, Sylviane, Jessica, Nolan, Anne Claire, Gérard |
| alimentation . déchets . gestes . compostage biodéchets . présent | Compostez-vous vos biodéchets ? | Sandy, Sylviane, Jessica, Anne Claire |
| alimentation . déchets . gestes . gaspillage alimentaire . présent | Cherchez-vous à réduire votre gaspillage alimentaire (que les produits aient été cuisinés ou non) ? | Sandy, Sylviane, Jessica, Anne Claire |
| alimentation . déchets . gestes . stop pub . présent | Avez-vous un stop pub sur votre boîte aux lettres ? | Sandy, Sylviane, Jessica, Anne Claire |
| alimentation . déchets . gestes . acheter en vrac . présent | Achetez-vous en vrac ? | Sandy, Sylviane, Jessica, Anne Claire |
| alimentation . plats . végétalien . nombre | Nombre de plats végétaliens par semaine | Yoram, Corentin, Sandy, Mehdi, Sylviane, Jessica, Nolan, Anne Claire, Gérard |
| alimentation . plats . végétarien . nombre | Nombre de plats végétariens par semaine | Yoram, Corentin, Sandy, Mehdi, Sylviane, Jessica, Nolan, Anne Claire, Gérard |
| alimentation . plats . viande blanche . nombre | Nombre de plats viande blanche par semaine | Yoram, Corentin, Sandy, Mehdi, Sylviane, Jessica, Nolan, Anne Claire, Gérard |
| alimentation . plats . viande rouge . nombre | Nombre de plats viande rouge par semaine | Yoram, Corentin, Sandy, Mehdi, Sylviane, Jessica, Nolan, Anne Claire, Gérard |
| alimentation . plats . poisson gras . nombre | Nombre de plats poisson gras par semaine | Yoram, Corentin, Sandy, Mehdi, Jessica, Anne Claire, Gérard |
| alimentation . plats . poisson blanc . nombre | Nombre de plats poisson blanc par semaine | Yoram, Corentin, Sandy, Mehdi, Jessica, Anne Claire, Gérard |
| alimentation . petit déjeuner . type | Quel petit déjeuner vous correspond le plus ? | Yoram, Corentin, Sandy, Mehdi, Sylviane, Jessica, Nolan, Gérard |
| alimentation . local . consommation | Consommez-vous des produits locaux ? | Yoram, Corentin, Anne Claire, Gérard |
| alimentation . de saison . consommation | Consommez-vous des produits de saison ? | Yoram, Corentin, Mehdi, Sylviane |
| divers . ameublement . meubles . armoire . nombre | Combien d'armoires possédez-vous ? | Yoram, Corentin, Sandy, Mehdi |
| divers . ameublement . meubles . canapé . nombre | Combien de canapés possédez-vous ? | Yoram, Corentin, Sandy, Mehdi |
| divers . ameublement . meubles . matelas . nombre | Combien de matelas possédez-vous ? | Yoram, Corentin, Sandy, Mehdi |
| divers . ameublement . meubles . lit . nombre | Combien de lits possédez-vous ? | Yoram, Corentin, Sandy, Mehdi |
| divers . ameublement . meubles . table . nombre | Combien de tables possédez-vous ? | Yoram, Corentin, Sandy, Mehdi |
| divers . ameublement . meubles . chaise . nombre | Combien de chaises possédez-vous ? | Yoram, Corentin, Sandy, Mehdi |
| divers . ameublement . meubles . petit meuble . nombre | Combien de petits meubles possédez-vous ? | Yoram, Corentin, Sandy, Mehdi |
| divers . ameublement . meubles . grand meuble . nombre | Combien de grands meubles (non inclu ailleurs) possédez-vous ? | Yoram, Corentin, Sandy, Mehdi |
| divers . animaux domestiques . empreinte . chats . nombre | Combien de chats possédez-vous dans votre foyer ? | Yoram, Sandy, Mehdi, Sylviane, Nolan, Gérard |
| divers . animaux domestiques . empreinte . petit chien . nombre | Combien de chiens possédez-vous dans votre foyer ? | Yoram, Sandy, Mehdi, Sylviane, Nolan, Gérard |
| divers . animaux domestiques . empreinte . chien moyen . nombre | Combien de chiens possédez-vous dans votre foyer ? | Yoram, Sandy, Mehdi, Sylviane, Nolan, Gérard |
| divers . animaux domestiques . empreinte . gros chien . nombre | Combien de chiens possédez-vous dans votre foyer ? | Yoram, Sandy, Mehdi, Sylviane, Nolan, Gérard |
| divers . autres produits . niveau de dépenses | Le test ne capte pas encore toutes vos consommations, comment estimeriez-vous votre niveau de dépenses en produits neufs (décoration d'intérieur, bricolage, jeux, loisirs créatifs, outils, etc.) ? | Yoram, Corentin, Sandy, Mehdi, Sylviane, Jessica, Nolan, Gérard |
| divers . ameublement . préservation | Quelle relation entretenez-vous à vos objets, vos appareils, vos meubles ? | Yoram, Corentin, Mehdi, Sylviane, Jessica, Nolan, Gérard |
| divers . électroménager . appareils . réfrigérateur . nombre | Combien de réfrigérateurs possédez-vous ? | Yoram, Corentin, Sandy, Mehdi, Sylviane, Jessica, Nolan, Gérard |
| divers . électroménager . appareils . congélateur . nombre | Combien de congélateurs possédez-vous ? | Yoram, Corentin, Sandy, Mehdi |
| divers . électroménager . appareils . lave-linge . nombre | Combien de lave-linge possédez-vous ? | Yoram, Corentin, Sandy, Mehdi, Sylviane, Jessica, Nolan, Gérard |
| divers . électroménager . appareils . sèche-linge . nombre | Combien de sèche-linge possédez-vous ? | Yoram, Corentin, Sandy, Mehdi, Sylviane, Jessica, Nolan, Gérard |
| divers . électroménager . appareils . lave-vaisselle . nombre | Combien de lave-vaisselle possédez-vous ? | Yoram, Corentin, Sandy, Mehdi, Sylviane, Jessica, Nolan, Gérard |
| divers . électroménager . appareils . hotte . nombre | Combien de hotte possédez-vous ? | Yoram, Corentin, Sandy, Mehdi |
| divers . électroménager . appareils . four . nombre | Combien de fours possédez-vous ? | Yoram, Corentin, Sandy, Mehdi, Sylviane, Jessica, Nolan, Gérard |
| divers . électroménager . appareils . micro-onde . nombre | Combien de micro-ondes possédez-vous ? | Yoram, Corentin, Sandy, Mehdi, Sylviane, Jessica, Nolan, Gérard |
| divers . électroménager . appareils . plaques . nombre | Combien de plaques possédez-vous ? | Yoram, Corentin, Sandy, Mehdi |
| divers . électroménager . appareils . bouilloire . nombre | Combien de bouilloire possédez-vous ? | Yoram, Corentin, Sandy, Mehdi, Sylviane, Jessica, Nolan, Gérard |
| divers . électroménager . appareils . cafetière . nombre | Combien de cafetière possédez-vous ? | Yoram, Corentin, Sandy, Mehdi, Sylviane, Jessica, Nolan, Gérard |
| divers . électroménager . appareils . aspirateur . nombre | Combien de aspirateur possédez-vous ? | Yoram, Corentin, Sandy, Mehdi, Sylviane, Jessica, Nolan, Gérard |
| divers . électroménager . appareils . robot cuisine . nombre | Combien de robot cuisine possédez-vous ? | Yoram, Corentin, Sandy, Mehdi, Sylviane, Jessica, Nolan, Gérard |
| divers . loisirs . culture . concerts et spectacles . présent | Vous arrive-t-il d'assister à des concerts ou spectacles ? | Yoram, Corentin, Mehdi, Sylviane, Jessica, Nolan, Anne Claire, Gérard |
| divers . loisirs . culture . musées et monuments . présent | Vous arrive-t-il de visiter des musées, monuments et parcs nationaux ? | Yoram, Corentin, Mehdi, Sylviane, Jessica, Nolan, Anne Claire, Gérard |
| divers . loisirs . culture . édition . présent | Achetez-vous parfois des livres, revues ou journaux ? | Yoram, Corentin, Mehdi, Sylviane, Jessica, Nolan, Anne Claire, Gérard |
| divers . loisirs . culture . pratique de la musique . présent | Possédez-vous un instrument de musique ? | Yoram, Corentin, Mehdi, Sylviane, Jessica, Nolan, Anne Claire, Gérard |
| divers . loisirs . sports . individuel extérieur . présent | Faites-vous du roller ou du skateboard ? | Yoram, Corentin, Sandy, Mehdi, Sylviane, Jessica, Nolan, Anne Claire |
| divers . loisirs . sports . balle ou ballon . présent | Pratiquez-vous un sport de raquette ? | Yoram, Corentin, Sandy, Mehdi, Sylviane, Jessica, Nolan, Anne Claire |
| divers . loisirs . sports . aquatique . présent | Pratiquez-vous un sport en piscine ? | Yoram, Corentin, Sandy, Mehdi, Sylviane, Jessica, Nolan, Anne Claire |
| divers . loisirs . sports . martial ou combat . présent | Pratiquez-vous un art martial ou de combat ? | Yoram, Corentin, Sandy, Mehdi, Sylviane, Jessica, Nolan, Anne Claire |
| divers . loisirs . sports . athlétisme . présent | Pratiquez-vous l'athlétisme ? | Yoram, Corentin, Sandy, Mehdi, Sylviane, Jessica, Nolan, Anne Claire |
| divers . loisirs . sports . salle de sport . présent | Fréquentez-vous une salle de sport, fitness ou musculation ? | Yoram, Corentin, Sandy, Mehdi, Sylviane, Jessica, Nolan, Anne Claire |
| divers . loisirs . sports . équitation . présent | Pratiquez-vous l'équitation ? | Yoram, Corentin, Sandy, Mehdi, Sylviane, Jessica, Nolan, Anne Claire |
| divers . loisirs . sports . golf . présent | Pratiquez-vous le golf ? | Yoram, Corentin, Sandy, Mehdi, Sylviane, Jessica, Nolan, Anne Claire |
| divers . loisirs . sports . nautique . présent | Pratiquez-vous un sport nautique ? | Yoram, Corentin, Sandy, Mehdi, Sylviane, Jessica, Nolan, Anne Claire |
| divers . loisirs . sports . hiver montagne . présent | Pratiquez-vous un sport d'hiver ou de montagne ? | Yoram, Corentin, Sandy, Mehdi, Sylviane, Jessica, Nolan, Anne Claire |
| divers . loisirs . sports . sports énergivores . présent | Pratiquez-vous un sport impliquant un véhicule motorisé ? | Yoram, Corentin, Sandy, Mehdi, Sylviane, Jessica, Nolan, Anne Claire |
| divers . loisirs . sports . autres sports . présent | Pratiquez-vous un sport non listé ? | Yoram, Corentin, Sandy, Mehdi, Sylviane, Jessica, Nolan, Anne Claire |
| divers . numérique . internet . durée journalière | Combien d'heures passez-vous par jour sur internet hors bureau (envoi de mails, surf Web, streaming vidéo, etc.) ? | Yoram, Corentin, Sandy, Mehdi, Jessica, Nolan, Anne Claire, Gérard |
| divers . numérique . appareils . téléphone . nombre | Utilisez-vous un téléphone ? | Yoram, Corentin, Sandy, Mehdi, Nolan |
| divers . numérique . appareils . ordinateur portable . nombre | Utilisez-vous un ordinateur portable ? | Yoram, Corentin, Sandy, Mehdi, Nolan |
| divers . numérique . appareils . ordinateur fixe . nombre | Utilisez-vous un ordinateur fixe ? | Yoram, Corentin, Sandy, Mehdi, Nolan, Gérard |
| divers . numérique . appareils . tablette . nombre | Utilisez-vous une tablette ? | Yoram, Corentin, Sandy, Mehdi, Nolan, Gérard |
| divers . numérique . appareils . TV . nombre | Utilisez-vous une TV ? | Yoram, Corentin, Sandy, Mehdi, Nolan, Gérard |
| divers . numérique . appareils . enceinte bluetooth . nombre | Utilisez-vous une enceinte bluetooth ? | Yoram, Corentin, Sandy, Mehdi, Nolan |
| divers . numérique . appareils . console de salon . nombre | Utilisez-vous une console de salon ? | Yoram, Corentin, Sandy, Mehdi, Nolan |
| divers . numérique . appareils . console portable . nombre | Utilisez-vous un console portable ? | Yoram, Corentin, Sandy, Mehdi, Nolan |
| divers . numérique . appareils . imprimante . nombre | Utilisez-vous un imprimante ? | Yoram, Corentin, Sandy, Mehdi, Nolan |
| divers . produits consommables . consommation | Comment estimeriez-vous votre consommation de produits d'hygiène (savon, maquillage...) et d'entretien (lessive, produits ménagers...) par mois ? | Yoram |
| divers . tabac . consommation par semaine | Quelle est votre consommation par semaine de tabac ? | Yoram, Corentin, Sandy, Mehdi, Sylviane, Jessica, Nolan, Anne Claire, Gérard |
| divers . textile . t-shirt . nombre | Nombre de t-shirt achetés sur une année | Yoram, Corentin, Sandy, Mehdi, Sylviane, Jessica, Nolan, Anne Claire, Gérard |
| divers . textile . pantalon . nombre | Nombre de pantalons/jeans achetés sur une année | Yoram, Corentin, Sandy, Mehdi, Sylviane, Jessica, Nolan, Anne Claire, Gérard |
| divers . textile . short . nombre | Nombre de shorts achetés sur une année | Yoram, Corentin, Sandy, Mehdi, Sylviane, Jessica, Nolan, Anne Claire, Gérard |
| divers . textile . sweat . nombre | Nombre de sweats achetés sur une année | Yoram, Corentin, Sandy, Mehdi, Sylviane, Jessica, Nolan, Anne Claire, Gérard |
| divers . textile . robe . nombre | Nombre de robes achetées sur une année | Yoram, Corentin, Sandy, Mehdi, Sylviane, Jessica, Nolan, Anne Claire, Gérard |
| divers . textile . chemise . nombre | Nombre de chemises achetées sur une année | Yoram, Corentin, Sandy, Mehdi |
| divers . textile . pull . nombre | Nombre de pulls achetés sur une année | Yoram, Corentin, Sandy |
| divers . textile . chaussure . nombre | Nombre de chaussures achetées sur une année | Yoram, Corentin, Sandy, Mehdi, Sylviane, Jessica, Nolan, Anne Claire, Gérard |
| divers . textile . manteau . nombre | Nombre de manteaux achetés sur une année | Yoram, Corentin, Sandy, Mehdi, Sylviane, Jessica, Nolan, Anne Claire, Gérard |
| divers . textile . petit article . nombre | Nombre de petits articles génériques achetés sur une année | Yoram, Corentin, Sandy |
| divers . textile . gros article . nombre | Nombre de gros articles génériques achetés sur une année | Yoram, Corentin, Sandy |
| logement . chauffage . PAC . présent | Votre logement est-il chauffé via une pompe à chaleur ? | Yoram, Corentin, Sandy, Mehdi, Sylviane, Jessica, Nolan, Anne Claire, Gérard |
| logement . chauffage . électricité . présent | Votre logement est-il chauffé à l'électricité ? | Yoram, Corentin, Sandy, Mehdi, Sylviane, Jessica, Nolan, Anne Claire, Gérard |
| logement . chauffage . gaz . présent | Votre logement est-il chauffé au gaz ? | Yoram, Corentin, Sandy, Mehdi, Sylviane, Jessica, Nolan, Anne Claire, Gérard |
| logement . chauffage . gaz . consommation | Quelle est la consommation annuelle de gaz de votre foyer ? | Corentin, Sandy |
| logement . chauffage . gaz . biogaz | Avez-vous souscrit à un contrat gaz incluant du biogaz (ou biométhane) ? | Corentin, Sandy, Gérard |
| logement . chauffage . biogaz . part | Quelle est la part de biogaz garantie par votre contrat de gaz ? | Corentin |
| logement . chauffage . bouteille gaz . présent | Utilisez-vous des bouteille de gaz ? | Yoram, Corentin, Sandy, Mehdi, Sylviane, Jessica, Nolan, Anne Claire, Gérard |
| logement . chauffage . bouteille gaz . consommation | Quelle est votre consommation annuelle en bouteilles de gaz (13 kg) ? | Sandy |
| logement . chauffage . citerne propane . présent | Votre logement est-il chauffé via une citerne de propane ? | Yoram, Corentin, Sandy, Mehdi, Sylviane, Jessica, Nolan, Anne Claire, Gérard |
| logement . chauffage . citerne propane . consommation | Quelle est la consommation annuelle de gaz propane en citerne de votre foyer ? | Mehdi |
| logement . chauffage . fioul . présent | Votre logement est-il chauffé au fioul ? | Yoram, Corentin, Sandy, Mehdi, Sylviane, Jessica, Nolan, Anne Claire, Gérard |
| logement . chauffage . fioul . consommation | Quelle est la consommation annuelle de fioul domestique de votre foyer ? | Sylviane |
| logement . chauffage . bois . présent | Votre logement est-il chauffé au bois ? | Yoram, Corentin, Sandy, Mehdi, Sylviane, Jessica, Nolan, Anne Claire, Gérard |
| logement . chauffage . bois . type | Quel type de bois utilisez-vous ? | Nolan, Anne Claire |
| logement . chauffage . bois . type . granulés . consommation | Quelle est la consommation annuelle de bois en granulés de votre foyer ? | Nolan |
| logement . chauffage . bois . type . bûches . consommation | Quelle la consommation annuelle de bois en bûches de votre foyer ? | Anne Claire |
| logement . chauffage . réseau de chaleur . présent | Votre logement est-il chauffé via un réseau de chaleur ? | Yoram, Corentin, Sandy, Mehdi, Sylviane, Jessica, Nolan, Anne Claire, Gérard |
| logement . climatisation . présent | Utilisez-vous un système de climatisation pour refroidir votre logement (climatiseur électrique, pompe à chaleur) ? | Yoram, Corentin, Sandy, Sylviane, Jessica, Nolan, Anne Claire |
| logement . climatisation . nombre | Combien de climatiseurs électriques possédez-vous ? | Anne Claire |
| logement . construction . rénovation . travaux . rénovation . présent | Avez-vous réalisé des travaux de rénovation (second d'oeuvre) ? | Corentin, Sylviane, Nolan, Anne Claire |
| logement . construction . rénovation . travaux . isolation . présent | Avez-vous réalisé des travaux d'isolation ? | Corentin, Sylviane, Nolan, Anne Claire |
| logement . construction . rénovation . travaux . chauffage . présent | Avez-vous changé de système de chauffage ? | Corentin, Sylviane, Nolan, Anne Claire |
| logement . construction . rénovation . travaux . extension . présent | Avez-vous réalisé une extension de votre logement ? | Corentin, Sylviane, Nolan, Anne Claire |
| logement . eau domestique . jardin . surface | 5 | Sandy, Anne Claire |
| logement . eau domestique . jardin . type arrosage | 'arrosoir' | Sandy |
| logement . électricité . réseau . consommation | Quelle est la consommation annuelle d'électricité (réseau) de votre foyer ? | Yoram, Corentin, Sandy, Mehdi, Sylviane, Jessica, Nolan, Anne Claire, Gérard |
| logement . électricité . photovoltaique . présent | Votre logement dispose-t-il de panneaux photovoltaïques ? | Anne Claire |
| logement . électricité . photovoltaique . production | Quelle est la production annuelle d'électricité de vos panneaux solaires photovoltaïques, qu'elle soit autoconsommée ou réinjectée dans le réseau ? | Anne Claire |
| logement . électricité . photovoltaique . part autoconsommation | Quelle part de cette électricité produite consommez-vous ? | Anne Claire |
| logement . extérieur . salon de jardin bois . présent | Possédez-vous un salon de jardin en bois ? | Sandy, Mehdi, Sylviane, Nolan, Anne Claire |
| logement . extérieur . salon de jardin résine ou métal . présent | Possédez-vous un salon de jardin en résine ou métal ? | Sandy, Mehdi, Sylviane, Nolan, Anne Claire |
| logement . extérieur . tondeuse électrique ou robot . présent | Possédez-vous une tondeuse électrique ou robot ? | Sandy, Mehdi, Sylviane, Nolan, Anne Claire |
| logement . extérieur . tondeuse thermique . présent | Possédez-vous une tondeuse thermique ? | Sandy, Mehdi, Sylviane, Nolan, Anne Claire |
| logement . extérieur . barbecue électrique ou gaz . présent | Possédez-vous un barbecue électrique ou gaz ? | Sandy, Mehdi, Sylviane, Nolan, Anne Claire |
| logement . extérieur . barbecue charbon . présent | Possédez-vous un barbecue au charbon ? | Sandy, Mehdi, Sylviane, Nolan, Anne Claire |
| logement . habitants | Combien de personnes vivent chez vous ? | Yoram, Corentin, Sandy, Mehdi, Sylviane, Jessica, Nolan, Anne Claire, Gérard |
| logement . surface | Quelle est la surface de votre logement ? | Yoram, Corentin, Sandy, Mehdi, Sylviane, Jessica, Nolan, Anne Claire, Gérard |
| logement . type | Dans quel type de logement vivez-vous ? | Yoram, Corentin, Sandy, Mehdi, Sylviane, Jessica, Nolan, Anne Claire, Gérard |
| logement . âge | Quel est l'âge de votre logement ? | Yoram, Corentin, Sandy, Mehdi, Sylviane, Jessica, Nolan, Anne Claire, Gérard |
| logement . piscine . surface | Quelle est la taille de votre piscine ? | Mehdi |
| logement . piscine . type | Votre logement dispose-t-il d'une piscine privée ? | Yoram, Sandy, Mehdi, Anne Claire |
| logement . vacances . hotel . présent | Allez-vous à l'hôtel ? | Yoram, Corentin, Sandy, Mehdi, Sylviane, Jessica, Nolan, Anne Claire, Gérard |
| logement . vacances . hotel . nombre de nuitées | Combien de nuits passez-vous à l'hôtel ou chambre d'hôtes par an ? | Mehdi, Jessica, Anne Claire, Gérard |
| logement . vacances . camping . présent | Allez-vous en camping ? | Yoram, Corentin, Sandy, Mehdi, Sylviane, Jessica, Nolan, Anne Claire, Gérard |
| logement . vacances . camping . nombre de nuitées | Combien de nuits passez-vous en camping par an ? | Yoram, Sandy |
| logement . vacances . auberge de jeunesse . présent | Allez-vous en auberge de jeunesse ? | Yoram, Corentin, Sandy, Mehdi, Sylviane, Jessica, Nolan, Anne Claire, Gérard |
| logement . vacances . auberge de jeunesse . nombre de nuitées | Combien de nuits passez-vous en auberge de jeunesse par an ? | Jessica |
| logement . vacances . locations . présent | Allez-vous en vacances en location meublée (type Airbnb) ? | Yoram, Corentin, Sandy, Mehdi, Sylviane, Jessica, Nolan, Anne Claire, Gérard |
| logement . vacances . locations . nombre de nuitées | Combien de nuits passez-vous en locations meublées par an ? | Mehdi, Anne Claire |
| logement . vacances . échange . présent | Pratiquez-vous l'échange de maison ? | Yoram, Corentin, Sandy, Mehdi, Sylviane, Jessica, Nolan, Anne Claire, Gérard |
| logement . vacances . famille ou amis . présent | Allez-vous chez des amis ou de la famille ? | Yoram, Corentin, Sandy, Mehdi, Sylviane, Jessica, Nolan, Anne Claire, Gérard |
| logement . vacances . résidence secondaire . présent | Possédez-vous une résidence secondaire ? | Yoram, Corentin, Sandy, Mehdi, Sylviane, Jessica, Nolan, Anne Claire, Gérard |
| logement . vacances . résidence secondaire . surface | Quelle est la surface de votre résidence secondaire ? | Mehdi, Nolan |
| logement . vacances . résidence secondaire . localisation | Où se situe votre résidence secondaire ? | Mehdi, Nolan |
| logement . vacances . résidence secondaire . durée . nuitées week end . nombre | Combien de week-ends passez-vous dans votre maison secondaire ? | Mehdi, Nolan |
| logement . vacances . résidence secondaire . durée . nuitées semaine . nombre | Combien de semaines passez-vous dans votre maison secondaire ? | Mehdi, Nolan |
| logement . vacances . résidence secondaire . saison | À quelle(s) saison(s) vous rendez-vous majoritairement dans votre résidence secondaire ? | Mehdi, Nolan |
| services sociétaux . question rhétorique | Nous attribuons l'empreinte des services publics (éducation, santé...) et marchands (télécom, assurance...) à chaque citoyenne et citoyen de façon égale. Cela représente autour de 1,5 tonnes de CO2e par personne. | Yoram |
| transport . avion . usager | Avez-vous pris l'avion au moins une fois ces 3 dernières années ? | Yoram, Corentin, Sandy, Mehdi, Sylviane, Jessica, Nolan, Anne Claire, Gérard |
| transport . avion . court courrier . heures de vol | Sur une année, combien d'heures voyagez-vous sur des vols de moins de 2h (court-courrier) ? | Mehdi, Jessica, Anne Claire, Gérard |
| transport . avion . moyen courrier . heures de vol | Sur une année, combien d'heures voyagez-vous sur des vols entre 2 et 6h (moyen-courrier) ? | Mehdi, Jessica, Anne Claire, Gérard |
| transport . avion . long courrier . heures de vol | Sur une année, combien d'heures voyagez-vous sur des vols de plus de 6h (long-courrier) ? | Mehdi, Jessica, Anne Claire, Gérard |
| transport . deux roues . usager | Utilisez-vous un scooter ou une moto ? | Yoram, Corentin, Sandy, Mehdi, Sylviane, Jessica, Anne Claire |
| transport . deux roues . km | Combien de km faites-vous à l'année avec votre scooter ou moto ? | Corentin, Jessica |
| transport . deux roues . type | Quelle est la motorisation de votre scooter ou moto ? | Corentin, Jessica |
| transport . ferry . usager | Prenez-vous le ferry ? | Yoram, Sandy, Mehdi, Anne Claire, Gérard |
| transport . ferry . heures | Combien d'heures par an voyagez-vous en ferry ou croisière ? | Anne Claire, Gérard |
| transport . mobilité douce . marche . présent | Vous déplacez-vous en marchant ? | Yoram |
| transport . mobilité douce . vélo . présent | Possédez-vous un vélo "musculaire" (sans assistance) ? | Yoram, Corentin |
| transport . mobilité douce . vae . présent | Possédez vous un vélo à Assistance Électrique (VAE) ? | Yoram |
| transport . mobilité douce . autres véhicules à moteur . présent | Possédez vous une trottinette électrique, gyropode, monocycle électrique, hoverboard...? | Yoram, Mehdi |
| transport . mobilité douce . autres véhicules à moteur . km | Combien de kilomètres faites-vous à l'année avec votre trottinette électrique, gyropode, monocycle électrique, hoverboard...? | Mehdi |
| transport . train . km | Combien de kilomètres parcourez-vous en train par an ? | Yoram, Corentin, Sandy, Mehdi, Sylviane, Jessica, Nolan |
| transport . transports commun . mosaic . bus . présent | Vous arrive t-il de prendre le bus ? | Yoram, Corentin, Sandy, Mehdi, Sylviane, Jessica, Nolan |
| transport . transports commun . mosaic . bus . heures par semaine | Combien d'heures passez-vous dans un bus par semaine ? | Corentin, Nolan |
| transport . transports commun . mosaic . car . présent | Vous arrive t-il de prendre le car ? | Yoram, Corentin, Sandy, Mehdi, Sylviane, Jessica, Nolan |
| transport . transports commun . mosaic . car . km par semaine | Combien de kilomètres parcourez-vous en car par semaine ? | Sylviane |
| transport . transports commun . mosaic . métro ou tram . présent | Vous arrive t-il de prendre le métro ou tram ? | Yoram, Corentin, Sandy, Mehdi, Sylviane, Jessica, Nolan |
| transport . transports commun . mosaic . métro ou tram . heures par semaine | Combien d'heures passez-vous par semaine en métro, tram, RER ? | Corentin, Jessica, Nolan |
| transport . vacances . caravane . propriétaire | Possédez-vous une caravane ? | Yoram, Sandy |
| transport . vacances . caravane . distance | Quelle distance parcourez-vous à l'année en caravane ? | Sandy |
| transport . vacances . camping car . propriétaire | Possédez-vous un camping car ? | Yoram, Sandy, Gérard |
| transport . vacances . camping car . km | Quelle distance parcourez-vous à l'année en camping-car ? | Gérard |
| transport . vacances . camping car . consommation aux 100 | Connaissez-vous la consommation moyenne de votre camping-car ? | Gérard |
| transport . vacances . van . propriétaire | Possédez-vous un van ? | Yoram, Sandy |
| transport . voiture . km | Quelle distance parcourez-vous à l'année en voiture ? | Yoram, Corentin, Sandy, Mehdi, Sylviane, Jessica, Nolan, Anne Claire, Gérard |
| transport . voiture . utilisateur | Utilisez-vous majoritairement la même voiture pour vous déplacer ? | Corentin, Sandy, Mehdi, Sylviane, Nolan, Anne Claire, Gérard |
| transport . voiture . voyageurs | Quel est le nombre moyen de voyageurs dans la voiture ? | Corentin, Sandy, Mehdi, Nolan |
| transport . voiture . motorisation | Quel type de voiture utilisez-vous ? | Mehdi, Sylviane, Nolan, Anne Claire, Gérard |
| transport . voiture . thermique . consommation aux 100 | Connaissez-vous la consommation moyenne de la voiture ? | Sylviane, Nolan, Anne Claire, Gérard |
| transport . voiture . gabarit | Quel est le gabarit de la voiture ? | Mehdi, Sylviane, Nolan, Anne Claire, Gérard |
