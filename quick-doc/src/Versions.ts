export type Version = 'nightly' | 'latest'

export function versionFromString(version: string): Version {
  switch (version) {
    case 'nightly':
      return 'nightly'
    case 'latest':
      return 'latest'
    default:
      throw new Error(`Invalid version: ${version}`)
  }
}
