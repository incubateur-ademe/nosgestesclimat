<h1 align="center">Translation of the model</h1>

<p align="center">This file contains all the information about the translation of the model of <a href="https://nosgestesclimat.fr/">nosgestesclimat.fr</a>.</p>

> For the user interface translation (e.g. releases, FAQ, button's text, etc...)
> , please refer to this
> [wiki](https:/github.com/datagir/nosgestesclimat-site/wiki/Translation).

---

<!-- vim-markdown-toc GitLab -->

* [Configuration](#configuration)
  * [DeepL API key](#deepl-api-key)
  * [Dev dependencies](#dev-dependencies)
* [Available languages](#available-languages)
* [Architecture](#architecture)
* [Workflow](#workflow)
  * [Modification of the `./data` files](#modification-of-the-data-files)
  * [Modification of the `./personas` files](#modification-of-the-personas-files)
  * [Improving an existing translation](#improving-an-existing-translation)
    * [Contribution guide for translation from GitHub](#contribution-guide-for-translation-from-github)
  * [Translating region models](#translating-region-models)
* [Available scripts](#available-scripts)
  * [`translate-rules.js`](#translate-rulesjs)
  * [`check-translation.js`](#check-translationjs)
  * [`rulesToJSON.js`](#rulestojsonjs)
  * [`translate-personas.js`](#translate-personasjs)
  * [`personasToJSON.js`](#personastojsonjs)
  * [`check-personas.js`](#check-personasjs)
  * [`translateRegionModel.js`](#translateregionmodeljs)

<!-- vim-markdown-toc -->

---

## Configuration

### DeepL API key

To be able to run all available scripts you need to have defined the _env_
variable `DEEPL_API_KEY` with a valid [DeepL API
key](https://www.deepl.com/fr/docs-api/introduction/).

> You can specify it when running the command like:
>
> ```
> DEEPL_API_KEY=<your-api-key> yarn <cmd>
> ```
>
> or saving it in your `.bashrc` file -- or other terminal config file.

### Dev dependencies

Before running any scripts, make sure that you have all the dependencies installed by
running:

```
yarn install
```
## Available languages

Currently, the model and the website UI are available in:

* `fr` -- is the reference language.
* `en-us` -- has been review by hand.
* `es` -- automatically generated.
* `it` -- automatically generated.

## Architecture

The model is written in [Publicodes](#TODO) inside the
[`data`](https://github.com/datagir/nosgestesclimat/tree/master/data) folder.
The translations are stored in `data/translated-rules-<lang>.yaml`. A [subset
of available mechanisms](#translate-rulesjs) are translated and stored in the
corresponding `data/translated-rules-<lang>.yaml` file.

The personas translations are stored inside the
[`personas`](https://github.com/datagir/nosgestesclimat/tree/master/personas)
folder.

## Workflow

### Modification of the `./data` files

After modifying the model, you can run the [`yarn
check:rules`](#check-translationsjs) command to verify that there are no
missing translations. If this is not the case, and once
[configured](#configuration), you can automatically translate missing entries
with the [`yarn translate:rules`](#translate-rulesjs) command.

Once the translations generated you have the possibility to correct them by
hand directly in the corresponding `./data/translated-rules-<lang>.yaml` file
-- see the [dedicated section](#improving-an-existing-translation).

**Before pushing any modifications, take the time to review the generated
translation and to verify the `git diff` to be sure nothing has been overridden
by error.**

> Note: make sure to provide a `titre` field for each new rule.

### Modification of the `./personas` files

Like for the precedent workflow, you need to first check if there are missing
translations by running the command [`yarn check:personas`](#check-personasjs).
Then , if needed, you can automatically translate them with the [`yarn
translate:personas`](#tranlsate-personasjs) command.

Once the translations generated you have the possibility to correct them by
hand directly in the corresponding `./personas/personas-<lang>.yaml` file --
see the [dedicated section](#improving-an-existing-translation).

**Before pushing any modifications, take the time to review the generated
translation and to verify the `git diff` to be sure nothing has been overridden
by error.**

### Improving an existing translation

If you found a translation incorrect or imprecise, you can modify it directly
from the `data` (resp. `personas`) folder.

If you are ready to create a [Pull
Request](https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/proposing-changes-to-your-work-with-pull-requests/creating-a-pull-request)
to push your suggestion directly to the project, please refer to the [dedicated
guide](#contribution-guide-for-translation-from-github). Otherwise, you can
simply send your suggestion in a mail to: datagir@ademe.fr.

#### Contribution guide for translation from GitHub

1. The first step consists of finding the file where is stored the targeted
   translation. You can refer to the [dedicated section](#architecture) or
   search for it from with the GitHub search bar:
    1. Press `/` and paste the searched text.
    2. Choose the `In this repository` choice.
    3. Look at `code results` and click on the corresponding file name.
2. Once you've found the file, you need to edit it.
    1. Select the `master` branch on the button -- at the left of the file
       path.
    2. Then, press `E` to edit the file -- or click in the pencil button. By
       pressing `.` you can open the file in the GitHub online editor.
    3. Click on the text, and press `Ctrl-F` to search for the specific
       translation.
    4. Now, you can edit the translation text.
        > Make sure to not edit `.lock` attributes, its corresponds to reference
        > value to translate from.
    5. When all changes have been made, go to the bottom of the page under the `Commit
       changes` section. Enter in the first text field:
        ```
        fix(t9n): update translation in the <edited_filename>.
        ```
3. Finally, select the `Create a new branch for this commit and start a pull
   request.` option. You can add more information if you want about your
   translation before clicking on the `Create pull request` button to open the
   pull request.

Well done! We will look at your proposition before [updating the
translations](#updating-the-translation) and integrating the changes to the
project.

### Translating region models

To translate region models stored in `./data/i18n/models` from a language to an
other, you can use the [`translateRegionModel.js`](#translateregionmodeljs)
script.

## Available scripts

Scripts related to the translation are stored in the folder
[`scripts/i18n`](https://github.com/datagir/nosgestesclimat-site/tree/master/scripts/i18n).

For each script you can specify different options -- e.g. source language,
target languages, etc.... All available options can be shown by providing the
`(-h | --help)` flag.

### `translate-rules.js`

This script allows to automatically translate the model's rules by using the DeepL API.

The translated [_mécanismes_](https://publi.codes/docs/m%C3%A9canismes) are:

* `titre`
* `description`
* `question`
* `résumé`
* `note`
* `suggestions`
* `mosaique`

>   To run with `yarn`:
>
>   ```
>   yarn translate:rules -h
>   ```

**The method**

The method used for the rules translation consists in storing for each
[supported language](#available-languages), both the _reference_ value and its
translation in a separated file (`./data/translated-rules-<lang>.yaml`):

```yaml
# Example from .data/translated-rules-en-us.yaml

alimentation . boisson . alcool . facteur:
  note: Wine doesn't have the same footprint as beer by the liter, that's a big
    simplification.
  note.lock: Le vin n'a pas la même empreinte que la bière au litre, c'est une
    grosse simplification.
```

This allows to automatically detect missing translation and those which are not
up to date.

At the end to compile the JSON file parsed by the website's engine, the script
[`rulesToJSON.js`](#rulestojsonjs) will override the _mécanismes_ of the model
by the ones present in the corresponding `translated-rules-<lang>.yaml` file.

### `check-translation.js`

This script allows to get missing model's rules translations.

>   To run with `yarn`:
>
>   ```
>   yarn check:rules -h
>   ```

### `rulesToJSON.js`

This script allows bundles all the model's rules into a single JSON file for
each [supported language](#available-languages) to be used by the website's
engine.

It generates `public/co2-<lang>.json` files.

>   To run with `yarn`:
>
>   ```
>   yarn compile:rules -h
>   ```

### `translate-personas.js`

This script allows to automatically translate the personas by using the DeepL API.

The translated [_mécanismes_](https://publi.codes/docs/m%C3%A9canismes) are:

* `nom`
* `description`
* `résumé`

>   To run with `yarn`:
>
>   ```
>   yarn translate:personas -h
>   ```

**The method**

The method used for the rules translation consists in storing for each
[available language](#available-languages), both the _reference_ value and its
translation in a separated file (`./personas/personas-<lang>.yaml`):

```yaml
# Example from .data/personas-en-us.yaml

personas . moyenne:
  description: >
    The average man or woman simply consumes like the average French person.
  description.lock: >
    Monsieur ou madame moyenne consomme tout simplement comme la
    moyenne française.
  nom: Average
  nom.lock: Moyenne
```

This allows to automatically detect missing translation and those which are not
up to date.

At the end to compile the JSON file used by the website, the script
[`personasToJSON.js`](#personastojsonjs) will override the _mécanismes_ of the
`personas/personas-fr.yaml` by the ones present in the corresponding
`translated-rules-<lang>.yaml` file.

### `personasToJSON.js`

This script allows bundles all the personas files into a single JSON file for
each [supported language](#available-languages).

It generates `public/personas-<lang>.json` files.

>   To run with `yarn`:
>
>   ```
>   yarn compile:personas -h
>   ```

### `check-personas.js`

This script allows to get missing personas translations.

>   To run with `yarn`:
>
>   ```
>   yarn check:personas -h
>   ```

### `translateRegionModel.js`

This script allows to translate region models stored in `./data/i18n/models`.

You can specify following flag:

- `--source` (`-s`) to choose the language translate from.
- `--target` (`-t`) to choose the language(s) translate to.
- `--model` (`-o`) to choose region code corresponding to the model to translate.

> To run with `yarn`:
>
> ```
> yarn translate:model [options]
> ```
