const csv = require("csv-parser");
const fs = require("fs");
const results = [];
const yaml = require("js-yaml");

fs.createReadStream("base carbone v16.1.csv")
  .pipe(csv())
  .on("data", data => {
    let {
      "Code de la catégorie": categorie,
      "Unité français": unité,
      "Type Ligne": type,
      "Total poste non décomposé": co2e
    } = data;

    categorie ===
      "Achats de biens > Produits agro-alimentaires, plats préparés et boissons > Plats préparés > Petit déjeuner" &&
      unité === "kgCO2e/portion" &&
      type === "Elément" &&
      results.push({
        espace: "nourriture",
        nom: data["Nom base français"],
        description: data["Commentaire français"],
        formule: co2e,
        unité: "kgCO₂e"
      });
  })
  .on("end", () => {
    //console.log(results);
    fs.writeFile("./nourriture.yaml", yaml.safeDump(results), function(err) {
      if (err) {
        return console.log(err);
      }

      console.log("The file was saved!");
    });
  });
