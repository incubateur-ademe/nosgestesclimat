<h1 align="center">Translation of the model</h1>

<p align="center">This file contains all the information about the translation of the model of <a href="https://nosgestesclimat.fr/">nosgestesclimat.fr</a>.</p>

> For the translation of the website's UI, please refer to the dedicated
> [file](https:/github.com/datagir/nosgestesclimat-site/blob/master/docs/translating.md).

---

<!-- vim-markdown-toc GitLab -->

* [Workflow](#workflow)
  * [Modification of the `./data` files](#modification-of-the-data-files)
  * [Modification of the `./personas` files](#modification-of-the-personas-files)
* [Configuration](#configuration)
  * [DeepL API key](#deepl-api-key)
  * [Dev dependencies](#dev-dependencies)
* [Available languages](#available-languages)
* [Available scripts](#available-scripts)
  * [`translate-rules.js`](#translate-rulesjs)
  * [`check-translation.js`](#check-translationjs)
  * [`rulesToJSON.js`](#rulestojsonjs)
  * [`translate-personas.js`](#translate-personasjs)
  * [`personasToJSON.js`](#personastojsonjs)
  * [`check-personas.js`](#check-personasjs)

<!-- vim-markdown-toc -->

---

## Workflow

### Modification of the `./data` files

After modifying the model, you can run the [`yarn translate:rules:check`](#check-translationsjs) command
to verify that there are no missing translations.
If this is not the case, and once [configured](#configuration) you can
automatically translate missing entries with the [`yarn
translate:rules`](#translate-rulesjs) command.

Once the translations generated you have the possibility to correct them by
hand directly in the corresponding `./data/translated-rules-<lang>.yaml` file.

**Before pushing any modifications, take the time to review the generated
translation and to verify the `git diff` to be sure nothing has been overridden
by error.**

> Note: make sure to provide a `titre` field for each new rule.

### Modification of the `./personas` files

Like for the precedent workflow, you need to first check if there are missing translations
by running the command [`yarn translate:personas:check`](#check-personasjs).
Then , if needed, you can automatically translate them with the [`yarn
translate:personas`](#tranlsate-personasjs) command.

Once the translations generated you have the possibility to correct them by
hand directly in the corresponding `./personas/personas-<lang>.yaml` file.

**Before pushing any modifications, take the time to review the generated
translation and to verify the `git diff` to be sure nothing has been overridden
by error.**

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

Moreover, in order to translate Markdown content some scripts use
[`pandoc`](https://pandoc.org/MANUAL.html). Make sure it is installed.

## Available languages

Currently, the model and the website UI are available in:

* `fr` -- is the reference language.
* `en-us`
* `es`
* `it`

## Available scripts

Scripts related to the translation are stored in the folder
[`scripts/i18n`](https://github.com/datagir/nosgestesclimat-site/tree/master/scripts/i18n).

For each script you can specify different options -- e.g. source language,
target languages, etc....
All available options can be shown by providing the `(-h | --help)` flag.

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
  note.ref: Le vin n'a pas la même empreinte que la bière au litre, c'est une
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
