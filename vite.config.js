import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'

const proxyPrefixes = ['/data-gateway', '/content-relay', '/chj-api']

const createProxyRule = (prefix, backendTarget) => ({
  target: backendTarget,
  changeOrigin: true,
  secure: false,
  rewrite: (path) => `/api/chj${path.slice(prefix.length)}`,
})

const createProxyConfig = (backendTarget) => {
  const chjApiProxy = Object.fromEntries(
    proxyPrefixes.map((prefix) => [prefix, createProxyRule(prefix, backendTarget)]),
  )

  const imageApiProxy = {
    '/image-api': {
      target: backendTarget,
      changeOrigin: true,
      secure: false,
      rewrite: () => '/api/generation/images',
    },
  }

  const aireiterApiProxy = {
    '/aireiter-api': {
      target: backendTarget,
      changeOrigin: true,
      secure: false,
      rewrite: (path) => path.replace(/^\/aireiter-api/, '/api/video'),
    },
  }

  return {
    '/api': {
      target: backendTarget,
      changeOrigin: true,
      secure: false,
    },
    ...chjApiProxy,
    ...imageApiProxy,
    ...aireiterApiProxy,
  }
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const backendTarget = env.VITE_BACKEND_PROXY_TARGET || 'http://127.0.0.1:8000'
  const proxy = createProxyConfig(backendTarget)

  return {
    plugins: [vue()],
    server: {
      port: 5173,
      proxy,
    },
    preview: {
      port: 4173,
      proxy,
    },
  }
})
