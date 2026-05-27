export const logoSrc = '/assets/icons/siyan-logo.png'

export const primaryNav = [
  { module: 'workspace', label: '工作台', path: '/workspace', icon: 'dashboard', breakAfter: true },
  { module: 'discover', label: '选品', path: '/discover', icon: 'discover' },
  { module: 'create', label: '创作', path: '/create', icon: 'clapperboard' },
  { module: 'chat', label: '对话', path: '/chat', icon: 'messages' },
  { module: 'tasks', label: '任务', path: '/tasks', icon: 'todo' },
  { module: 'agent', label: '代理', path: '/agent', icon: 'bot' },
]

export const moduleSidebars = {
  create: [
    { items: [{ id: 'dashboard', label: '概览', path: '/create', icon: 'dashboard' }] },
    {
      title: '灵感',
      items: [
        { id: 'hottest-videos', label: '热门视频', path: '/create/hottest-videos', icon: 'flame' },
        { id: 'hooks', label: '黄金3秒', path: '/create/hooks', icon: 'zap', activePaths: ['/create/hooks', '/create/hooks3e60'] },
        { id: 'angles', label: '卖点角度', path: '/create/angles', icon: 'compass' },
        { id: 'formulas', label: '爆款模式', path: '/create/formulas', icon: 'film' },
        { id: 'money-shots', label: '转化镜头', path: '/create/money-shots', icon: 'crosshair' },
      ],
    },
    {
      title: '工作室',
      items: [
        { id: 'creation-video', label: '视频创作', path: '/create/video', icon: 'video' },
        { id: 'creation-image', label: '图片生成', path: '/create/image', icon: 'image', badge: 'NEW' },
        { id: 'script-generator', label: '脚本生成', path: '/create/script-generator', icon: 'penLine' },
      ],
    },
    { title: '素材', items: [{ id: 'my-creations', label: '我的创作', path: '/create/my-creations', icon: 'layers' }] },
  ],
  assets: [
    { items: [{ id: 'assets-overview', label: '概览', path: '/assets', icon: 'dashboard' }] },
    {
      title: '业务',
      items: [
        { id: 'assets-shops', label: '店铺', path: '/assets/shops', icon: 'store' },
        { id: 'assets-products', label: '商品', path: '/assets/products', icon: 'package' },
      ],
    },
    {
      title: '内容',
      items: [
        { id: 'assets-avatars', label: '模特', path: '/assets/avatars', icon: 'userRound' },
        { id: 'assets-resources', label: '素材库', path: '/assets/resources', icon: 'folderOpen' },
      ],
    },
  ],
  social: [
    { items: [{ id: 'social-overview', label: '概览', path: '/social', icon: 'dashboard' }] },
    {
      title: '发布',
      items: [
        { id: 'social-posts', label: '帖子', path: '/social/posts', icon: 'fileText', activePaths: ['/social/posts', '/social/posts/batch-publish'] },
        { id: 'social-calendar', label: '日历', path: '/social/calendar', icon: 'calendar' },
        { id: 'social-analytics', label: '分析', path: '/social/analytics', icon: 'chart' },
      ],
    },
    {
      title: '互动',
      items: [
        { id: 'social-comments', label: '评论', path: '/social/comments', icon: 'messageSquare' },
        { id: 'social-messages', label: '消息', path: '/social/messages', icon: 'mail' },
      ],
    },
    { title: '设置', items: [{ id: 'social-accounts', label: '账号', path: '/social/accounts', icon: 'userRound' }] },
  ],
}

export const discoverGroups = [
  {
    id: 'discover-overview',
    label: '概览',
    icon: 'dashboard',
    openPrefixes: ['/discover/overview/pulse', '/discover/overview/opportunities', '/discover/overview/markets'],
    items: [
      { label: '动态', path: '/discover/overview/pulse', activePaths: ['/discover/overview/pulse', '/discover/overview/pulse11ea'] },
      { label: '机会', path: '/discover/overview/opportunities' },
      { label: '市场', path: '/discover/overview/markets' },
    ],
  },
  { id: 'discover-dashboard', label: '数据大盘', icon: 'chart', items: [] },
  { id: 'discover-products', label: '商品', icon: 'package', items: [] },
  { id: 'discover-shops', label: '店铺', icon: 'store', items: [] },
  { id: 'discover-creators', label: '达人', icon: 'userRound', items: [] },
  {
    id: 'discover-videos',
    label: '视频',
    icon: 'video',
    openPrefixes: ['/discover/tiktok/videos'],
    items: [
      { label: '视频搜索', path: '/discover/tiktok/videos', activePaths: ['/discover/tiktok/videos', '/discover/tiktok/videos11ea'] },
      { label: '外贸询盘', path: '/discover/tiktok/videos/b2b', activePaths: ['/discover/tiktok/videos/b2b', '/discover/tiktok/videos2d7d'] },
    ],
  },
  {
    id: 'discover-ads',
    label: '广告',
    icon: 'broadcast',
    openPrefixes: ['/discover/tiktok/ads'],
    items: [{ label: '广告搜索', path: '/discover/tiktok/ads', activePaths: ['/discover/tiktok/ads', '/discover/tiktok/ads11ea'] }],
  },
  { id: 'discover-live', label: '直播', icon: 'clapperboard', items: [] },
]

export const normalizeLayoutPath = (path) => {
  if (!path || path === '/discover/overview') return '/discover/overview/pulse'
  return path
}

export const getActiveModule = (path) => {
  const module = normalizeLayoutPath(path).split('/')[1] || 'workspace'
  return primaryNav.some((item) => item.module === module) ? module : 'workspace'
}

export const onlineTiktokDiscoverGroups = [
  {
    id: 'discover-overview',
    label: '概览',
    icon: 'dashboard',
    openPrefixes: ['/discover/overview/pulse', '/discover/overview/opportunities', '/discover/overview/markets'],
    items: [
      { label: '动态', path: '/discover/overview/pulse' },
      { label: '机会', path: '/discover/overview/opportunities' },
      { label: '市场', path: '/discover/overview/markets' },
    ],
  },
  { id: 'discover-dashboard', label: '数据大盘', icon: 'chart', items: [] },
  {
    id: 'discover-products',
    label: '商品',
    icon: 'package',
    openPrefixes: ['/discover/tiktok/products'],
    items: [
      { label: '商品搜索', path: '/discover/tiktok/products' },
      { label: '销量榜', path: '/discover/tiktok/products/top-selling' },
      { label: '热推榜', path: '/discover/tiktok/products/most-promoted' },
      { label: '新品榜', path: '/discover/tiktok/products/new-arrivals' },
    ],
  },
  {
    id: 'discover-shops',
    label: '店铺',
    icon: 'store',
    openPrefixes: ['/discover/tiktok/shops'],
    items: [
      { label: '店铺搜索', path: '/discover/tiktok/shops' },
      { label: '销量榜', path: '/discover/tiktok/shops/top-selling' },
      { label: '热推榜', path: '/discover/tiktok/shops/most-promoted' },
    ],
  },
  {
    id: 'discover-creators',
    label: '达人',
    icon: 'userRound',
    openPrefixes: ['/discover/tiktok/creators'],
    items: [
      { label: '达人搜索', path: '/discover/tiktok/creators' },
      { label: '带货达人榜', path: '/discover/tiktok/creators/commercial' },
      { label: '涨粉达人榜', path: '/discover/tiktok/creators/growth' },
      { label: '达人机构榜', path: '/discover/tiktok/creators/agency' },
    ],
  },
  {
    id: 'discover-videos',
    label: '视频',
    icon: 'video',
    openPrefixes: ['/discover/tiktok/videos'],
    items: [
      { label: '视频搜索', path: '/discover/tiktok/videos' },
      { label: '外贸询盘', path: '/discover/tiktok/videos/b2b' },
    ],
  },
  {
    id: 'discover-ads',
    label: '广告',
    icon: 'broadcast',
    openPrefixes: ['/discover/tiktok/ads'],
    items: [{ label: '广告搜索', path: '/discover/tiktok/ads' }],
  },
  {
    id: 'discover-lives',
    label: '直播',
    icon: 'clapperboard',
    openPrefixes: ['/discover/tiktok/lives'],
    items: [{ label: '直播搜索', path: '/discover/tiktok/lives' }],
  },
]

export const onlineShopifyDiscoverGroups = [
  { id: 'shopify-ads', label: '广告搜索', path: '/discover/shopify/ads', icon: 'broadcast', items: [] },
  { id: 'shopify-products', label: '商品搜索', path: '/discover/shopify/products', icon: 'package', items: [] },
  { id: 'shopify-shops', label: '店铺搜索', path: '/discover/shopify/shops', icon: 'store', items: [] },
]

export const getDiscoverGroups = (path) => {
  return normalizeLayoutPath(path).startsWith('/discover/shopify') ? onlineShopifyDiscoverGroups : onlineTiktokDiscoverGroups
}
