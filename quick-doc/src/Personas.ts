import personasFr from '../../public/personas-fr.json'

export const personas = personasFr
export const personasEntries = Object.entries(personas)
export type PersonaKey = keyof typeof personas
export const defaultPersona: PersonaKey = 'personas . marie'
