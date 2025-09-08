import { getLocalRules } from '../../tests/commons.mjs'
import Engine from 'publicodes'

// should be prod rules when working in cron
const rules = await getLocalRules('FR', 'fr')
const engine = new Engine(rules, {
  warn: {
    cyclicReferences: false
  }
})

const dottedNamesWithDLUO = Object.keys(rules).reduce((acc, dottedName) => {
  const rawRuleKeys = new Set(Object.keys(rules[dottedName] ?? {}))

  if (!rawRuleKeys.has('DLUO')) {
    return acc
  }

  if (!acc[rules[dottedName]['DLUO']]) {
    acc[rules[dottedName]['DLUO']] = []
  }

  acc[rules[dottedName]['DLUO']].push(dottedName)
  return acc
}, {})

const today = new Date()
today.setHours(0, 0, 0, 0)

const DLUOCalendar = Object.fromEntries(
  Object.entries(dottedNamesWithDLUO)
    .filter(([date]) => {
      const [dd, mm, yyyy] = date.split('/')
      const d = new Date(Number(yyyy), Number(mm) - 1, Number(dd))
      d.setHours(0, 0, 0, 0)
      return d <= today
    })
    .sort(([a], [b]) => new Date(a) - new Date(b))
)

const cardProperties = {
  'Nom de la tâche': {
    title: [
      {
        text: {
          content: `DLUO - ${new Date().toLocaleDateString('fr-FR')}`
        }
      }
    ]
  },
  'Sprint associé': {
    relation: [
      {
        id: '1cb6523d57d7805db51ef8cbeef7162e'
      }
    ]
  },
  'Personne assignée': {
    people: [
      // Clément
      {
        object: 'user',
        id: '4136a322774447a993e5d1c6e996f3cb'
      },
      // Julie
      {
        object: 'user',
        id: '55897f63c5d343af86415bfb291c8765'
      },
      // Quentin
      {
        object: 'user',
        id: '1f8d872b594c81229c630002eff848ba'
      }
    ]
  },
  Etat: {
    status: {
      name: 'En spécification'
    }
  },
  Etiquette: {
    multi_select: [
      {
        name: '🍃 Modèle'
      }
    ]
  },
  Prio: {
    select: {
      name: 'P1'
    }
  }
}

if (Object.keys(DLUOCalendar).length === 0) {
  // Générer un objet Notion même quand il n'y a pas de DLUO dépassée
  const notionPayload = {
    parent: { database_id: 'NOTION_DATABASE_PLACEHOLDER' },
    icon: {
      type: 'emoji',
      emoji: '📅'
    },
    properties: cardProperties,
    children: [
      {
        object: 'block',
        type: 'paragraph',
        paragraph: {
          rich_text: [
            {
              type: 'text',
              text: {
                content:
                  "✅ Aucune DLUO n'est dépassée actuellement. Toutes les règles sont à jour."
              }
            }
          ]
        }
      }
    ]
  }
  console.log(JSON.stringify(notionPayload))
} else {
  const getRelatedRulesFromDLUO = (parentDottedName) => {
    const rulesFromParent = Object.entries(rules).filter(
      ([dottedName, rule]) => {
        if (
          !dottedName.startsWith(parentDottedName) ||
          dottedName === parentDottedName ||
          !rule
        ) {
          return false
        }
        // On vérifie si la règle a une valeur numérique
        const nodeValue = engine.evaluate(dottedName).nodeValue
        if (Number(nodeValue) === nodeValue) {
          return true
        }
        return false
      }
    )

    const rulesList = rulesFromParent.map(([name]) => name)
    let content = rulesList.join('\n')

    // Limitation à 1900 caractères (marge de sécurité sous les 2000 de Notion)
    if (content.length > 1900) {
      const truncatedRules = []
      let currentLength = 0

      for (const rule of rulesList) {
        const ruleWithComma = rule + ', '
        if (currentLength + ruleWithComma.length > 1850) {
          // Marge pour le texte "..."
          break
        }
        truncatedRules.push(rule)
        currentLength += ruleWithComma.length
      }

      const remainingCount = rulesList.length - truncatedRules.length
      content =
        truncatedRules.join('\n') + ` \n... (+${remainingCount} autres règles)`
    }
    return content
  }

  const tableRows = []

  Object.entries(DLUOCalendar).forEach(([date, dottedNames]) => {
    tableRows.push({
      object: 'block',
      type: 'table_row',
      table_row: {
        cells: [
          [{ type: 'text', text: { content: `Date: ${date}` } }],
          [{ type: 'text', text: { content: '' } }]
        ]
      }
    })

    dottedNames.forEach((name) => {
      tableRows.push({
        object: 'block',
        type: 'table_row',
        table_row: {
          cells: [
            [{ type: 'text', text: { content: name } }],
            [{ type: 'text', text: { content: getRelatedRulesFromDLUO(name) } }]
          ]
        }
      })
    })
  })
  // --- Objet JavaScript pour Notion ---
  const notionPayload = {
    parent: { database_id: 'NOTION_DATABASE_PLACEHOLDER' },
    icon: {
      type: 'emoji',
      emoji: '📅'
    },
    properties: cardProperties,
    children: [
      {
        object: 'block',
        type: 'table',
        table: {
          table_width: 2,
          has_column_header: true,
          has_row_header: false,
          children: tableRows
        }
      }
    ]
  }

  console.log(JSON.stringify(notionPayload))
}
