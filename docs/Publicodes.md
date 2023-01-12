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

## Custom mechanisms

However, during the implementation of the NGC's website new _mécanismes_ were
added on top of native ones:

- [`mosaic`](https://github.com/datagir/nosgestesclimat-site/wiki/mosaic):
  used to specify a set of related questions needed to be answer at the same
  time.
