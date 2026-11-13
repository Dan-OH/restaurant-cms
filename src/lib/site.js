export const SITE_NAME = 'Restaurant'
export const LOGO_SRC = '/logo.svg'

// The top-level page with this slug is served at "/".
export const HOME_SLUG = 'home'

// Top-level slugs that would collide with app routes.
export const RESERVED_SLUGS = ['admin']

export function slugify(text) {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}
