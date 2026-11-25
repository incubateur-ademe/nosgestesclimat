// Lecture minimale de classeurs .xlsx (zip + xml), sans dépendance externe.
// Les lignes sont renvoyées sous forme de tableaux indexés par numéro de
// colonne (0-based), la première ligne étant l'en-tête.

import zlib from 'node:zlib'

const EOCD_SIGNATURE = 0x06054b50
const CENTRAL_FILE_SIGNATURE = 0x02014b50
const LOCAL_FILE_SIGNATURE = 0x04034b50

const SHEET_PATH = 'xl/worksheets/sheet1.xml'
const SHARED_STRINGS_PATH = 'xl/sharedStrings.xml'

function readZipEntries(buffer) {
  let eocd = -1
  for (let i = buffer.length - 22; i >= 0 && i > buffer.length - 66_000; i--) {
    if (buffer.readUInt32LE(i) === EOCD_SIGNATURE) {
      eocd = i
      break
    }
  }
  if (eocd === -1) {
    throw new Error("Fichier xlsx invalide : fin de l'archive zip introuvable")
  }

  const entryCount = buffer.readUInt16LE(eocd + 10)
  let offset = buffer.readUInt32LE(eocd + 16)
  const entries = new Map()

  for (let i = 0; i < entryCount; i++) {
    if (buffer.readUInt32LE(offset) !== CENTRAL_FILE_SIGNATURE) {
      throw new Error('Fichier xlsx invalide : répertoire central corrompu')
    }
    const method = buffer.readUInt16LE(offset + 10)
    const compressedSize = buffer.readUInt32LE(offset + 20)
    const nameLength = buffer.readUInt16LE(offset + 28)
    const extraLength = buffer.readUInt16LE(offset + 30)
    const commentLength = buffer.readUInt16LE(offset + 32)
    const localOffset = buffer.readUInt32LE(offset + 42)
    const name = buffer
      .toString('utf8', offset + 46, offset + 46 + nameLength)
      .replace(/\\/g, '/')

    entries.set(name, { method, compressedSize, localOffset })
    offset += 46 + nameLength + extraLength + commentLength
  }

  return entries
}

function readZipEntry(buffer, entry) {
  const { method, compressedSize, localOffset } = entry
  if (buffer.readUInt32LE(localOffset) !== LOCAL_FILE_SIGNATURE) {
    throw new Error('Fichier xlsx invalide : en-tête local corrompu')
  }
  const nameLength = buffer.readUInt16LE(localOffset + 26)
  const extraLength = buffer.readUInt16LE(localOffset + 28)
  const start = localOffset + 30 + nameLength + extraLength
  const data = buffer.subarray(start, start + compressedSize)

  if (method === 0) return data.toString('utf8')
  if (method === 8) return zlib.inflateRawSync(data).toString('utf8')
  throw new Error(`Méthode de compression zip non supportée : ${method}`)
}

function decodeXmlEntities(text) {
  return text.replace(
    /&(#x?[0-9a-fA-F]+|amp|lt|gt|quot|apos);/g,
    (match, entity) => {
      if (entity === 'amp') return '&'
      if (entity === 'lt') return '<'
      if (entity === 'gt') return '>'
      if (entity === 'quot') return '"'
      if (entity === 'apos') return "'"
      if (entity.startsWith('#x') || entity.startsWith('#X')) {
        return String.fromCodePoint(parseInt(entity.slice(2), 16))
      }
      return String.fromCodePoint(parseInt(entity.slice(1), 10))
    }
  )
}

function parseSharedStrings(xml) {
  const strings = []
  const siStart = '<si>'
  const siEnd = '</si>'
  let from = 0
  while (true) {
    const start = xml.indexOf(siStart, from)
    if (start === -1) break
    const end = xml.indexOf(siEnd, start)
    if (end === -1) break
    const block = xml.slice(start, end)
    // un <si> peut contenir plusieurs <t> (texte enrichi) ; on ignore les <rPh>
    const parts = []
    const tRegex = /<t(?:\s[^>]*)?>([\s\S]*?)<\/t>/g
    let match
    while ((match = tRegex.exec(block)) !== null) {
      parts.push(decodeXmlEntities(match[1]))
    }
    strings.push(parts.join(''))
    from = end + siEnd.length
  }
  return strings
}

function columnIndex(reference) {
  const letters = reference.replace(/[^A-Z]/g, '')
  let index = 0
  for (const letter of letters) index = index * 26 + (letter.charCodeAt(0) - 64)
  return index - 1
}

function parseSheet(xml, sharedStrings) {
  const rows = []
  const rowStart = '<row '
  const rowEnd = '</row>'
  let from = 0

  while (true) {
    const start = xml.indexOf(rowStart, from)
    if (start === -1) break
    const end = xml.indexOf(rowEnd, start)
    if (end === -1) break
    const block = xml.slice(start, end)
    from = end + rowEnd.length

    const row = []
    const cellRegex = /<c\b([^>]*?)(?:\/>|>([\s\S]*?)<\/c>)/g
    let cell
    while ((cell = cellRegex.exec(block)) !== null) {
      const attributes = cell[1]
      const body = cell[2] ?? ''
      const reference = /r="([A-Z]+\d+)"/.exec(attributes)?.[1]
      if (!reference) continue

      const type = /t="([^"]+)"/.exec(attributes)?.[1]
      let value = null
      if (type === 'inlineStr') {
        const parts = []
        const tRegex = /<t(?:\s[^>]*)?>([\s\S]*?)<\/t>/g
        let match
        while ((match = tRegex.exec(body)) !== null) {
          parts.push(decodeXmlEntities(match[1]))
        }
        value = parts.join('')
      } else {
        const raw = /<v>([\s\S]*?)<\/v>/.exec(body)?.[1]
        if (raw !== undefined) {
          value =
            type === 's'
              ? (sharedStrings[Number(raw)] ?? '')
              : decodeXmlEntities(raw)
        }
      }
      if (value !== null && value !== '') row[columnIndex(reference)] = value
    }
    rows.push(row)
  }

  return rows
}

/**
 * Lit la première feuille d'un classeur xlsx et renvoie ses lignes, la
 * première étant l'en-tête.
 */
export function readXlsxRows(buffer) {
  const entries = readZipEntries(buffer)
  const sheetEntry = entries.get(SHEET_PATH)
  if (!sheetEntry) throw new Error('Feuille introuvable dans le classeur')

  const stringsEntry = entries.get(SHARED_STRINGS_PATH)
  const sharedStrings = stringsEntry
    ? parseSharedStrings(readZipEntry(buffer, stringsEntry))
    : []

  return parseSheet(readZipEntry(buffer, sheetEntry), sharedStrings)
}

/** Renvoie l'en-tête nettoyé (chaînes trimées, colonnes vides à null). */
export function readXlsxHeader(buffer) {
  const rows = readXlsxRows(buffer)
  return (rows[0] ?? []).map((value) =>
    value === undefined || value === null ? null : value.trim()
  )
}
