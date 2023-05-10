# International

The internationalization of "Nos Gestes Climat" is complex : it is not only a question of language translation but
also to put in place a solution to adapt the calculation and language depending on the country an user is connecting
from.

Please, do not hesitate to contribute and to contact us if needed at `contact@nosgestesclimat.fr` or with a GitHub issue.

## Tutorial : A new calculation model for my country / region

**Step 1 :**
GitHub is a dedicated platform for code and discussion.
[This page](https://github.com/datagir/nosgestesclimat/blob/master/CONTRIBUTING.md) explains you (in french) basics of
the language used for the calculation models. You do not need to be a developper in order to contribute, this language
is intuitive and our infrastructure allows you to publish a version of your model without having to go through all the
website code.

**Step 2 :** GitHub is a particularly interesting platform for managing code versions. To start your own version, create
an account on GitHub and find our repository : [datagir/nosgestesclimat](https://github.com/datagir/nosgestesclimat)

**Step 3 :** You can then find the different models we support for the diverse regions and countries in the directory :
`data/i18n/models`

> **Note**  
> Those files contains calculation rules (in yaml format) which are linked to the french model (available in the
> `/data/` directory).

### Your model is not yet supported in NGC ?

You can create your own !  
Your file should be named with the country-code (uppercase), dash-separated with the language code (lowercase) and the
extension `.yaml`, for instance: for the United-Kingdom, in english the file is named `UK-en-us.yaml` (`UK` being the
country code of the United Kingdom and `en-us` being the language code). You can then start writing your own rule.

> **Warning**  
> The `params` section contains the caracteristic of your region and is mandatory. You should at least indicate the
> `nom` (name) and `code` attributes. The `gentilé` (demonym) and `drapeau` (flag) attributes are optionnal.

Example :

```yaml
params:
  code: UK
  nom: United Kingdom
  gentilé: British
  drapeau: GB
```

You can then follow the steps below to improve your model.

### Propose a change on an existing model

1. Open the corresponding file for the region (according to the country/language codes).

2. Rewrite the file according to the rules declared in the base model (french).

   > **Warning**
   > Be careful to report the keys of the french model **exactly** as-is. Otherwise the translation
   > will not be operational. You can copy-paste them in order to be sure they are exactly the same.

   For instance, the carbon intensity of the electricity mix is defined in the rule `intensité électricité` of the file
   `data/divers/commun.yaml`. To edit that value and title in the newly created model, you should re-write this rule
   with the new attributes.

   Example for the UK:

   ```yaml
   intensité électricité:
     titre: Climate intensity of United-Kingdom's electricity mix
     formule: 0.236
     note: |
       [Electricity Map](https://app.electricitymaps.com/map) view 5 years, 2022
   ```

> **Note**
> The model's code may contain minor subtilities (in particular in order to generate 'Mosaics'), do not hesitate to ask
> for help if you don't understand something.

For your modifications to be taken into account, it is necessary to have both file `XX-fr.yaml` and `XX-en-us.yaml` (for french and english language) containing the rules identical to the twin file but translated. You can use the `scripts/i18n/translateRegionModel.js` script to automatically translate your file. Be carefull, the previously translated file will be overwritten. If translation improvements have been made before, take a look at the diffs. (Documentation in the [wiki](https://github.com/datagir/nosgestesclimat/wiki/Translation#translateregionmodeljs))

### Remarks

- Think about translating your region model (see previous section)
- You can (and should) contribute with running the simulator locally in order to see what modifications you brought in
  real time. (See the [contribution guide (FR)](https://github.com/datagir/nosgestesclimat/blob/master/CONTRIBUTING.md))

### Finally

**Step 4 :**
When you are happy with your modifications, make a PR (
[guide](https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/proposing-changes-to-your-work-with-pull-requests/creating-a-pull-request))

Review your modifications before to publish it. But don't worry : if you broke something, you will see a comment with
details of what doesn't work anymore. Someone will also review your edits before they are merged in production.

**Step 5 :**
Your version of the model is now linked to the website of "nosgestesclimat". You can see your modifications live at the
following address `https://nosgestesclimat.fr/simulateur/bilan?PR={PR-ID}`. (Replace `{PR-ID}` with the id of your PR.)

**Step 6 :**
Our team will review your changes and they will be able to answer your questions. The goal is to propose a version of
the model for each country/region. When your changes will be validated, it will be deployed and online on our website.
Any person that will connect from the specific country, you made a model for, will see your version.
