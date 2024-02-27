export type Page = 'home' | 'doc' | 'personas' | 'situations' | 'migration'

export const baseUrl =
  process.env.NODE_ENV === 'development' ? '' : '/nosgestesclimat'

export function pathTo(page: Page): string {
  switch (page) {
    case 'home':
      return baseUrl + '/'
    case 'doc':
      return baseUrl + '/doc'
    case 'personas':
      return baseUrl + '/personas'
    case 'situations':
      return baseUrl + '/situations'
    case 'migration':
      return baseUrl + '/migration'
  }
}
