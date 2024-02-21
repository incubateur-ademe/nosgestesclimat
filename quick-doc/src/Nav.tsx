export type Page = 'home' | 'doc' | 'personas'

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
  }
}
