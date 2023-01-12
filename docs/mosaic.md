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

- `type`: selection or number, for boolean questions or numbered question
- `clé`: key that corresponds to the rules we want to be in the mosaic
- `suggestions`: as classic questions, some suggestions can be set.
- `total`: only for numbered mosaics, to display message according the the total the user selection (ex: diet question)

```yaml
a:
  question: Cochez ce qui vous correspond
  mosaique:
    type: selection
    clé: présent
    suggestions:
      tout:
        café . nombre: oui
        thé . nombre: oui
      aucun: aucun
  formule:
    somme:
      - b
      - c

a . b:
  applicable si: présent
  formule: 1

a . b . présent:
  par défaut: oui

a . c:
  applicable si: présent
  formule: d

a . c . présent:
  par défaut: non

a . c . d:
  formule: 100
```

> Note: children mosaic rules have to be of degree 2. In the example above, the
> rule `a . c . e . présent` would not be in the mosaic.

## Workarounds on site side

In
[`Conversation.tsx`](https://github.com/datagir/nosgestesclimat-site/blob/master/source/components/conversation/Conversation.tsx)
and
[`RuleInput.tsx`](https://github.com/datagir/nosgestesclimat-site/blob/master/source/components/conversation/RuleInput.tsx),
specific treatment is given to mosaic question with the function
[`getRelatedMosaicInfosIfExists`](https://github.com/datagir/nosgestesclimat-site/blob/master/source/components/conversation/RuleInput.tsx#L56-L83).
