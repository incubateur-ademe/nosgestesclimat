<h1 align="center">Mosaic <i>mécanisme</i></h1>

Some questions are grouped in an artifical questions, called mosaic questions
(mosaïques), not present in [publi.codes](https://publi.codes/).

In nosgestesclimat-site, we added a feature to answers multiple "classic"
questions in once. It is very usefull to avoid answering dozens questions like
"Do you have a laptop ? Do you have a smartphone ? Do you have a camera ?".
Instead, it is asked "What equipments do you have ?". However, the model
compile and is understandable without this feature.

## What does it look like on model side ?

An attribute `mosaique` can be set. It includes multiple arguments:

- `type`: selection or number, for boolean questions or numbered question.
- `options`: a list of rules we want to be in the mosaic. We don't want to repeat the parent rule at the begining of each namespace. Implicitly, we consider the rulename of the mosaic as the parent rule of each option.
- `suggestions`: as classic questions, some suggestions can be set.

### Example for "selection" mosaics:

```yaml
a:
  question: Cochez ce qui vous correspond
  mosaique:
    type: selection
    options:
      - b . présent
      - c . présent
    suggestions:
      tout:
        b . présent: oui
        c  . présent: oui
      aucun:
        b . présent: non
        c  . présent: non
  formule:
    somme:
      - b
      - c

a . b:
  applicable si: présent
  formule: 1

a . b . présent:
  question: b est-il présent ?
  par défaut: oui

a . c:
  applicable si: présent
  formule: d

a . c . présent:
  question: c est-il présent ?
  par défaut: non

a . c . d:
  formule: 100
```

> Note: Each mosdaique suggestions must contain a choice "Aucun" with all the option to `false` or `0` as it allows users validate the question directly with "no choice".

## Workarounds on site side

To be completed.
