const csv = require("csv-parser");
const fs = require("fs");
const results = [];
const yaml = require("yaml");

fs.createReadStream("base carbone v16.1.csv")
  // get this file here : https://github.com/laem/futureco-data/issues/50
  .pipe(csv())
  .on("data", data => {
    let {
      "Code de la catégorie": categorie,
      "Unité français": unité,
      "Type Ligne": type,
      "Total poste non décomposé": co2e,
      "Nom base français": nom,
      "Nom attribut français": attribut
    } = data;

    categorie.includes(
      "Achats de biens > Produits agro-alimentaires, plats préparés et boissons > Plats préparés > "
    ) &&
      unité === "kgCO2e/portion" &&
      type === "Elément" &&
      results.push({
        espace: "nourriture",
        nom: nom + (attribut ? " - " + attribut : ""),
        exposé: "oui",
        description: data["Commentaire français"],
        formule: +co2e,
        unité: "kgCO₂e"
      });
  })
  .on("end", () => {
    // We'll now update, not replace, the current publicodes file
    fs.readFile("./co2.yaml", "utf8", (err, data) => {
      let rules = yaml.parse(data);
      let updatedRules = rules.map(rule => {
        let update = results.find(
          r => r.nom === rule.nom && r.espace === rule.espace
        );
        return { icônes: "", ...rule, ...update };
      });
      fs.writeFile("./co2.yaml", yaml.stringify(updatedRules), function(err) {
        if (err) {
          return console.log(err);
        }

        console.log("The file was saved!");
      });
    });
  });
