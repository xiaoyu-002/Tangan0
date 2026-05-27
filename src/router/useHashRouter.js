import { computed, defineAsyncComponent, onMounted, onUnmounted, ref } from 'vue'
import { routeFallback, routes } from './routes'

let createCacheStarted = false

const routeAliases = {
  '/discover/overview': '/discover/overview/pulse',
  '/discover/overview/pulse11ea': '/discover/overview/pulse',
  '/discover/tiktok/ads11ea': '/discover/tiktok/ads',
  '/discover/tiktok/videos11ea': '/discover/tiktok/videos',
  '/discover/tiktok/videos2d7d': '/discover/tiktok/videos/b2b',
}

const normalizeHash = () => {
  const hashPath = window.location.hash.replace(/^#/, '').replace(/\/+$/, '') || '/'
  if (hashPath === '/') return routeFallback
  return routeAliases[hashPath] || hashPath
}

const warmCreateCache = (path) => {
  if (createCacheStarted || !path.startsWith('/create')) return
  createCacheStarted = true
  import('../pages/create/createApi')
    .then(({ ensureCreateSessionCache }) => ensureCreateSessionCache())
    .catch(() => {})
}

export function useHashRouter() {
  const currentPath = ref(normalizeHash())

  const syncHash = () => {
    const nextPath = normalizeHash()
    if (window.location.hash !== `#${nextPath}`) {
      window.location.hash = nextPath
      return
    }
    currentPath.value = nextPath
    warmCreateCache(nextPath)
  }

  onMounted(() => {
    if (!window.location.hash) window.location.hash = routeFallback
    syncHash()
    window.addEventListener('hashchange', syncHash)
  })

  onUnmounted(() => {
    window.removeEventListener('hashchange', syncHash)
  })

  const currentRoute = computed(() => {
    return routes.find((route) => route.path === currentPath.value) || routes.find((route) => route.path === routeFallback)
  })

  const pageComponent = computed(() => defineAsyncComponent(currentRoute.value.component))

  return {
    currentPath,
    currentRoute,
    pageComponent,
  }
}
