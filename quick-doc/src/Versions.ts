export type Version = 'nightly' | 'latest' | 'nightly-eau'

export function versionFromString(version: string): Version {
  switch (version) {
    case 'nightly':
      return 'nightly'
    case 'nightly-eau':
      return 'nightly'
    case 'latest':
      return 'latest'
    default:
      throw new Error(`Invalid version: ${version}`)
  }
}

export type Metric = 'eau' | 'carbone'
