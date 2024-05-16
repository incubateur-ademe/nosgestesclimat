import { Rule, RuleNode, Evaluation } from 'publicodes'
// This file is generated on package build
import { DottedName } from './dottedNames'

export { DottedName } from './dottedNames'

export type NGCRuleNode = RuleNode & {
  rawNode: NGCRule
}

export type NGCRulesNodes = Record<DottedName, NGCRuleNode>

type Color = `#${string}`

export type NodeValue = Evaluation

export type SuggestionsNode = Record<
  string,
  string | number | Record<string, string | number>
>

export type MosaiqueNode = {
  type: 'selection' | 'nombre'
  options: DottedName[]
  total?: number
  suggestions?: SuggestionsNode
}

export type MosaicInfos = {
  mosaicRule: RuleNode
  mosaicParams: MosaiqueNode
  mosaicDottedNames: [DottedName, NGCRuleNode][]
}

type Formule = any

export type MigrationType = {
  keysToMigrate: Record<DottedName, DottedName>
  valuesToMigrate: Record<DottedName, Record<string, NodeValue>>
}

export type Persona = {
  nom: string
  description: string
  icônes: string
  résumé?: string
  situation: Partial<Record<DottedName, string | number>>
}

export type Personas = Record<string, Persona>

export type migrationType = {
  keysToMigrate: Record<DottedName, DottedName>
  valuesToMigrate: Record<DottedName, Record<string, NodeValue>>
}

export type RegionAuthor = {
  nom: string
  url?: string
}

export type RegionCode = string

export type RegionParams = {
  code: RegionCode
  nom: string
  gentilé: string
  authors?: RegionAuthor[]
  drapeau?: string
}

export type SupportedRegionType = {
  [currentLang: string]: RegionParams
}

export type SupportedRegions = { [key: string]: SupportedRegionType }

export type NGCRule = Rule & {
  abréviation?: string
  couleur?: Color
  mosaique?: MosaiqueNode
  type?: string
  action?: { dépasse: string[] }
  icônes?: string
  sévérité?: string
  dottedName?: DottedName
  question?: string
  plus?: boolean
  formule?: Formule
  aide?: string
  inactif?: string
  résumé?: string
  plancher?: number
  avertissement?: string
}

// TODO: Should remove "| string" when frontend migrates to model DottedName type
export type NGCRules = Record<DottedName | string, NGCRule>

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
  averageOfElectricityConsumption: number
  percentageOfCoolingSystem: number
  percentageOfVegan: number
  percentageOfRedMeat: number
  percentageOfLocalAndSeasonal: number
  percentageOfBottledWater: number
  percentageOfZeroWaste: number
  amountOfClothing: number
  percentageOfStreaming: number
}
