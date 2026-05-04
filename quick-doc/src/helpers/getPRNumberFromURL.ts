export function getPRNumberFromURL() {
  return new URLSearchParams(window.location.search).get('PR')?.trim() || null
}
