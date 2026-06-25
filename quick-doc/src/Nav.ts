export type Page = 'home' | 'doc' | 'personas' | 'situations' | 'migration'

export const isGithubPagesDeploy = import.meta.env.MODE === 'gh-pages-root'

const baseUrl = import.meta.env.BASE_URL.replace(/\/$/, '')

function withBase(path: string): string {
  return `${baseUrl}${path}`
}

export function pathTo(page: Page): string {
  switch (page) {
    case 'home':
      return withBase('/')
    case 'doc':
      return withBase('/doc')
    case 'personas':
      return withBase('/personas')
    case 'situations':
      return withBase('/situations')
    case 'migration':
      return withBase('/migration')
  }
}
