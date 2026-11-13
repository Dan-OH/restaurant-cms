export const SITE_NAME = 'Restaurant'
export const LOGO_SRC = '/logo.svg'

// The page with this slug is served at "/".
export const HOME_SLUG = 'home'

// Slugs that would collide with app routes.
export const RESERVED_SLUGS = ['admin']

export function pagePath(slug) {
  return slug === HOME_SLUG ? '/' : `/${slug}`
}

export function slugify(text) {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}
