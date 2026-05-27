import { navigateToRoute, routeFromHref } from './navigation'

const closestInside = (event, selector, root) => {
  const node = event.target.closest?.(selector)
  return node && root?.contains(node) ? node : null
}

const setDataState = (element, state) => {
  element?.setAttribute('data-state', state)
}

const toggleAccordion = (trigger, root) => {
  const isOpen = trigger.getAttribute('aria-expanded') === 'true'
  const nextState = isOpen ? 'closed' : 'open'
  const panelId = trigger.getAttribute('aria-controls')
  const item = trigger.closest('[data-slot="accordion-item"]')
  const panel = panelId ? root.querySelector(`#${CSS.escape(panelId)}`) : null

  trigger.setAttribute('aria-expanded', String(!isOpen))
  setDataState(trigger, nextState)
  setDataState(item, nextState)

  if (panel) {
    setDataState(panel, nextState)
    panel.hidden = isOpen
  }
}

const syncTabState = (tab) => {
  const tablist = tab.closest('[role="tablist"]')
  if (!tablist) return

  tablist.querySelectorAll('[role="tab"]').forEach((item) => {
    const selected = item === tab
    item.setAttribute('aria-selected', String(selected))
    item.setAttribute('tabindex', selected ? '0' : '-1')
    setDataState(item, selected ? 'active' : 'inactive')
  })
}

const toggleMobileNavigation = (root) => {
  const overlay = root.querySelector('.app-sidebar-mobile-overlay')
  const drawer = root.querySelector('.app-sidebar-mobile-drawer')
  const isClosed = !drawer?.classList.contains('is-open')

  overlay?.classList.toggle('is-open', isClosed)
  drawer?.classList.toggle('is-open', isClosed)
}

const toggleSidebar = (button, root) => {
  const sidebar = button.closest('[data-sidebar-expanded]') || root.querySelector('[data-sidebar-expanded]')
  const pageMain = root.querySelector('main[style*="margin-left"]')
  const expanded = sidebar?.getAttribute('data-sidebar-expanded') !== 'false'
  const nextExpanded = !expanded

  sidebar?.setAttribute('data-sidebar-expanded', String(nextExpanded))
  if (pageMain) pageMain.style.marginLeft = nextExpanded ? '244px' : '124px'
  button.setAttribute('aria-label', nextExpanded ? '收起面板' : '展开面板')
}

const handleRouteLink = (event, link) => {
  const href = link.getAttribute('href')
  const nextRoute = routeFromHref(href)
  if (!nextRoute) return false

  event.preventDefault()
  navigateToRoute(nextRoute)
  return true
}

export function handlePageClick(event, root) {
  if (!root) return

  const loginButton = closestInside(event, '[data-ph-capture-attribute-button-name="nav:topbar_login_clicked"]', root)
  if (loginButton) {
    event.preventDefault()
    navigateToRoute('/login')
    return
  }

  const accordionTrigger = closestInside(event, '[data-slot="accordion-trigger"]', root)
  if (accordionTrigger) {
    toggleAccordion(accordionTrigger, root)
    return
  }

  const tab = closestInside(event, '[role="tab"]', root)
  if (tab) syncTabState(tab)

  const mobileMenuButton = closestInside(event, 'button[aria-label="菜单"]', root)
  if (mobileMenuButton) {
    toggleMobileNavigation(root)
    return
  }

  const sidebarToggle = closestInside(event, '[data-ph-capture-attribute-button-name="nav:sidebar_toggle"]', root)
  if (sidebarToggle) {
    toggleSidebar(sidebarToggle, root)
    return
  }

  const link = closestInside(event, 'a[href]', root)
  if (link) handleRouteLink(event, link)
}
