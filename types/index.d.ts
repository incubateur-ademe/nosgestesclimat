import { Rule } from 'publicodes'

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

type NGCRule = Rule & {
  abréviation?: string
  couleur?: Color
  mosaique?: MosaiqueNode
  type?: string
  sévérité?: string
  action?: { dépasse: string[] }
  icônes?: string
  sévérité?: 'avertissement' | 'information' | 'invalide'
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
