<h1 align="center">Publicodes</h1>

The model of NGC
([`nosgestesclimat`](https://github.com/datagir/nosgestesclimat/tree/master/data))
is build with [publicodes](https://publi.codes/), an interpreter on top of an
extended [YAML](https://yaml.org/) syntax used to models complex computations.

For example this is an extract from the file [`./data/transport/transport . avion.yaml`](https://github.com/datagir/nosgestesclimat/blob/master/data/transport/transport%20.%20avion.yaml):

```yaml
transport . avion . court courrier:
  formule: heures de vol * vitesse moyenne * empreinte par km

transport . avion . court courrier . vitesse moyenne:
  formule: 600 / 1.3
  unité: km/h
  note: |
    Nous utilisons la vitesse moyenne de vol pour un Paris Toulouse.
```

There is dedicated [_mécanismes_](https://publi.codes/docs/m%C3%A9canismes)
such as `formule` or `note` supported by default by the publicode interpreter.

## Packaging

Publicodes greenhouse gas emission calculation models begin to be used in
different projects, such as :
[`futur.eco`](https://github.com/laem/futureco-data) and
[`impactCO2`](https://github.com/datagir/impactCO2).
To avoid the duplication of models and to facilitate the reuse of rules, we
introduced a new meta-mechanism : `importer!`.

### Usage

To import rules from a _packaged_ publicodes model, you need to specify the following syntax :

```yaml
importer!:
  depuis: <npm_package_name>
  les règles:
    - <rule_name_from_the_npm_package>
    - <rule_name_from_the_npm_package>:
      <attr_to_overwrite>: <value>
      ...
    ...
```

When compiling yaml files to a standalone json file, each yaml entry
`importer!` will be replaced by all imported rules and their dependencies by
the `getModelFromSource.js` script.

### Publishing a new package

Currently, there is only the
[`futureco-data`](https://www.npmjs.com/package/futureco-data) package
published on NPM.

To be used in the `importer!` meta-mechanism, the NPM package need to expose the
model compiled into `<package_name>.model.json`.

## Custom mechanisms

However, during the implementation of the NGC's website new _mécanismes_ were
added on top of native ones:

- [`mosaic`](https://github.com/datagir/nosgestesclimat-site/wiki/mosaic):
  used to specify a set of related questions needed to be answer at the same
  time.
