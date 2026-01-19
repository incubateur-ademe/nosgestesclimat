import { Evaluation, Rule, RuleNode, Situation } from 'publicodes'
import { Categories as GeneratedCategories } from './types/categories.d'
import { DottedName as GeneratedDottedName } from './types/dottedNames'
import { Subcategories as GeneratedSubcategories } from './types/subcategories.d'
import { ExtendedSituationDottedNames as GeneratedExtendedSituationDottedNames } from './types/extendedSituationDottedNames'

export type DottedName = GeneratedDottedName
export type Categories = GeneratedCategories
export type Subcategories = GeneratedSubcategories
export type ExtendedSituationDottedNames = GeneratedExtendedSituationDottedNames

export type ExtendedSituation = Record<
  ExtendedSituationDottedNames,
  | {
      nodeValue: Evaluation
      source: 'answered' | 'default'
    }
  | {
      nodeValue?: undefined
      source: 'omitted'
    }
>

export type NGCRuleNode = RuleNode & { rawNode: NGCRule }

export type NGCRulesNodes = Record<DottedName, NGCRuleNode>

export type NodeValue = Evaluation

export type SuggestionValue = 'oui' | 'non' | number

export type Suggestions = Record<
  string,
  SuggestionValue | Record<string, SuggestionValue>
>

export type MosaiqueNode = {
  type: 'selection' | 'nombre'
  options: DottedName[]
  suggestions?: Suggestions
  'option aucun'?: 'aucun' | 'non concerné'
}

export type MosaicInfos = {
  mosaicRule: RuleNode
  mosaicParams: MosaiqueNode
  mosaicDottedNames: [DottedName, NGCRuleNode][]
}

export type MigrationType = {
  keysToMigrate: Record<DottedName, DottedName>
  valuesToMigrate: Record<DottedName, Record<string, NodeValue>>
}

export type Persona = {
  nom: string
  description: string
  icônes: string
  résumé?: string
  situation: Situation<DottedName>
  extendedSituation: ExtendedSituation
}

export type Personas = Record<string, Persona>

export type migrationType = {
  keysToMigrate: Record<DottedName, DottedName>
  valuesToMigrate: Record<DottedName, Record<string, NodeValue>>
}

export type RegionAuthor = { nom: string; url?: string }

export type RegionCode = string

export type RegionParams = {
  code: RegionCode
  nom: string
  gentilé: string
  authors?: RegionAuthor[]
  drapeau?: string
}

export type SupportedRegion = Record<string, RegionParams>

export type SupportedRegions = Record<RegionCode, SupportedRegion>

export type NGCRule =
  | (Omit<Rule, 'formule' | 'question' | 'valeur' | 'description' | 'note'> & {
      formule?: Rule['formule'] | number
      question?: Rule['question'] | null
      valeur?: Rule['valeur'] | number
      description?: Rule['description'] | string
      note?: Rule['note'] | string
      abréviation?: string
      mosaique?: MosaiqueNode
      type?: string
      action?: { dépasse: string[] }
      icônes?: string
      aide?: string
      inactif?: string
      plancher?: string | number
      plafond?: string | number
      avertissement?: string
    })
  | null

export type Metrics = 'carbone' | 'eau'

export type NGCRules = Record<DottedName, NGCRule>

export type FunFacts = {
  percentageOfBicycleUsers: number
  percentageOfVegetarians: number
  percentageOfCarOwners: number
  percentageOfPlaneUsers: number
  percentageOfLongPlaneUsers: number
  averageOfCarKilometers: number
  averageOfTravelers: number
  percentageOfElectricHeating: number
  percentageOfGasHeating: number
  percentageOfFuelHeating: number
  percentageOfWoodHeating: number
  percentageOfCoolingSystem: number
  percentageOfVegan: number
  percentageOfRedMeat: number
  percentageOfLocalAndSeasonal: number
  percentageOfBottledWater: number
  percentageOfZeroWaste: number
  amountOfClothing: number
  percentageOfStreaming: number
}
