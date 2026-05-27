import { routes } from '../router/routes'

const routeByPath = new Map(routes.map((route) => [route.path, route.path]))
const routeAliases = {
  '/discover': '/discover/overview/pulse',
  '/discover/overview': '/discover/overview/pulse',
  '/discover/overview/pulse11ea': '/discover/overview/pulse',
  '/discover/tiktok/ads11ea': '/discover/tiktok/ads',
  '/discover/tiktok/videos11ea': '/discover/tiktok/videos',
  '/discover/tiktok/videos2d7d': '/discover/tiktok/videos/b2b',
}

const normalizeRoutePath = (path) => {
  const appPath = path.startsWith('/app/') ? path.replace(/^\/app/, '') : path
  const normalized = appPath.replace(/\.html$/, '').replace(/\/$/, '') || '/workspace'
  if (routeAliases[normalized]) return routeAliases[normalized]
  return routeByPath.get(normalized) || normalized
}

export function routeFromHref(href) {
  if (!href || href.startsWith('mailto:') || href.startsWith('tel:') || href.startsWith('javascript:')) return null

  if (href.startsWith('#/')) {
    return normalizeRoutePath(href.replace(/^#/, ''))
  }

  if (href.startsWith('/app/')) {
    return normalizeRoutePath(href.split(/[?#]/)[0])
  }

  if (/^https?:\/\//i.test(href)) {
    try {
      const url = new URL(href)
      if (url.hostname === 'www.chuhaijiang.com' && url.pathname.startsWith('/app/')) {
        return normalizeRoutePath(url.pathname)
      }
    } catch {
      return null
    }
  }

  return null
}

export function navigateToRoute(route) {
  if (!route) return
  window.location.hash = route
}
