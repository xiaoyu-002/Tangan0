import { backendUrl, fetchChjCacheStatus } from '../../utils/backendApi'

// Mock workspace API used by the Vue workspace dashboard.
export const workspacePageData = {
  header: {
    badge: '快讯',
    title: '工作台总览',
    description: '汇总市场、选品、创作、社媒、资产和任务进展，帮助团队快速识别增长机会。',
    news: [
      'TikTok Shop 美国区父亲节备货进入最后两周，工具礼品与户外降温品类热度上升。',
      'Shopify 独立站广告 CPC 较上周下降 3.2%，适合测试低预算素材组合。',
      '宠物慢食碗相关视频 24 小时播放增长 91%，达人样品包建议优先发出。',
      '夏季户外、防晒冰袖、便携榨汁杯进入内容投放窗口，本周建议保持日更。',
    ],
  },
  market: {
    label: '美国',
    code: 'US',
    flag: '🇺🇸',
  },
  markets: [
    { label: '美国', code: 'US', flag: '🇺🇸', note: 'TikTok Shop 主市场' },
    { label: '英国', code: 'UK', flag: '🇬🇧', note: '英区达人增长快' },
    { label: '德国', code: 'DE', flag: '🇩🇪', note: '家居工具需求稳定' },
    { label: '日本', code: 'JP', flag: '🇯🇵', note: '美妆个护热度高' },
  ],
  performance: {
    cards: [
      {
        id: 'market',
        title: '市场动向',
        locale: '🇺🇸',
        tone: 'sky',
        href: '/discover/overview/pulse',
        chart: {
          values: [62, 58, 61, 66, 63, 70, 74],
          minLabel: '$6,537.44',
          maxLabel: '$7,264.90',
        },
        metrics: [
          { label: '动销店铺', value: '10.23万', delta: '+7.5%', deltaClass: 'text-emerald-600', href: '/discover/tiktok/shops' },
          { label: '动销商品', value: '98.83万', delta: '+11.6%', deltaClass: 'text-emerald-600', href: '/discover/tiktok/products' },
          { label: '总销售额', value: '$1858.63万', delta: '+7.1%', deltaClass: 'text-emerald-600', href: '/discover/tiktok/products' },
          { label: '本周热度', value: '86.4', delta: '+3.2%', deltaClass: 'text-emerald-600' },
        ],
      },
      {
        id: 'videos',
        title: '爆款视频',
        locale: '🇺🇸',
        tone: 'violet',
        href: '/discover/tiktok/videos',
        chart: {
          values: [35, 40, 37, 44, 49, 53, 61],
          minLabel: '2.1k',
          maxLabel: '6.8k',
        },
        metrics: [
          { label: '爆款素材', value: '1.28万', delta: '+13.2%', deltaClass: 'text-emerald-600', href: '/discover/tiktok/videos' },
          { label: '平均播放', value: '68.4万', delta: '+9.8%', deltaClass: 'text-emerald-600', href: '/discover/tiktok/videos' },
          { label: '完播率', value: '41.3%', delta: '+2.4%', deltaClass: 'text-emerald-600' },
          { label: '互动率', value: '8.6%', delta: '+1.1%', deltaClass: 'text-emerald-600' },
        ],
      },
      {
        id: 'ads',
        title: '热门广告',
        locale: '🇺🇸',
        tone: 'orange',
        href: '/discover/tiktok/ads',
        chart: {
          values: [24, 28, 31, 29, 34, 37, 42],
          minLabel: '$1.2k',
          maxLabel: '$3.8k',
        },
        metrics: [
          { label: '在投广告', value: '3,428', delta: '+5.3%', deltaClass: 'text-emerald-600', href: '/discover/tiktok/ads' },
          { label: 'CTR', value: '2.68%', delta: '+0.4%', deltaClass: 'text-emerald-600', href: '/discover/tiktok/ads' },
          { label: 'CPC', value: '$0.31', delta: '-3.2%', deltaClass: 'text-emerald-600' },
          { label: '素材消耗', value: '78.2%', delta: '+4.7%', deltaClass: 'text-emerald-600' },
        ],
      },
    ],
  },
  opportunities: [
    {
      id: 'market-analyst',
      title: '市场洞察',
      subtitle: '市场顾问 · 跟踪可增长的选品机会',
      avatar: '/assets/avatars/market-analyst.png',
      locale: '🇺🇸',
      tone: 'sky',
      activeTab: 'discovery',
      layout: 'grid',
      tabs: [
        {
          key: 'discovery',
          label: '选品发现',
          description: '发现潜力商品，覆盖蓝海选品、热卖新品和季节性爆款。',
        },
        {
          key: 'tracking',
          label: '竞对追踪',
          description: '追踪竞争对手店铺和商品，观察上新、定价和趋势变化。',
        },
        {
          key: 'validation',
          label: '机会验证',
          description: '验证某个品类是否值得投入，先看数据再决定动作。',
        },
      ],
      tabContent: {
        discovery: [
          { title: '儿童磁力钓鱼玩具', tag: '母婴用品', metric: '$1.3万 GMV', delta: '+2929%', href: '/discover/tiktok/products' },
          { title: '防晒冰袖套装', tag: '运动户外', metric: '8.1万销量', delta: '+318%', href: '/discover/tiktok/products/top-selling' },
          { title: '桌面真空清洁器', tag: '电脑办公', metric: '$7,420', delta: '+186%', href: '/discover/tiktok/products/new-arrivals' },
          { title: '宠物慢食碗', tag: '宠物用品', metric: '423 达人', delta: '+91%', href: '/discover/tiktok/creators' },
          { title: '便携榨汁杯', tag: '厨房电器', metric: '6.4% 转化', delta: '+42%', href: '/discover/tiktok/videos' },
          { title: '车载香薰扩香器', tag: '汽车用品', metric: '2.8万播放', delta: '+77%', href: '/discover/tiktok/ads' },
        ],
        tracking: [
          { title: 'DailyFinds US', tag: '竞品店铺', metric: '本周上新 42', delta: '+23%', href: '/discover/tiktok/shops/top-selling' },
          { title: 'TrendNest', tag: '增长店铺', metric: '$18.6万 GMV', delta: '+38%', href: '/discover/tiktok/shops/most-promoted' },
          { title: 'HomeSpark', tag: '家居场景', metric: '广告 128 条', delta: '+19%', href: '/discover/tiktok/ads' },
          { title: 'GlowLab', tag: '美妆个护', metric: '达人 76 位', delta: '+31%', href: '/discover/tiktok/creators/commercial' },
        ],
        validation: [
          { title: '父亲节礼品窗口', tag: '营销节点', metric: '剩余 14 天', delta: '高优先级', href: '/discover/overview/markets' },
          { title: '夏季户外降温', tag: '季节趋势', metric: '搜索 +67%', delta: '可投放', href: '/discover/overview/opportunities' },
          { title: '低客单复购品', tag: '稳定补货', metric: '毛利 42%', delta: '可建池', href: '/discover/tiktok/products/most-promoted' },
          { title: '创作者样品包', tag: '达人合作', metric: 'CPS 12%', delta: '可测试', href: '/discover/tiktok/creators/agency' },
        ],
      },
      footer: {
        text: '查看全部爆款机会',
        href: '/discover/tiktok/products',
      },
    },
    {
      id: 'creative-director',
      title: '创意总监',
      subtitle: '创意总监 · 帮你把爆款拆成可复用表达',
      avatar: '/assets/avatars/creative-director.png',
      locale: '🇺🇸',
      tone: 'orange',
      activeTab: 'hook',
      layout: 'list',
      tabs: [
        {
          key: 'hook',
          label: '爆款开场',
          description: '用一个具体问题、反差或痛点开场，先把注意力抓住。',
        },
        {
          key: 'angle',
          label: '卖点角度',
          description: '从功能、场景和证据三个方向组织表达。',
        },
        {
          key: 'script',
          label: '脚本结构',
          description: '把开头、卖点和行动号召串成稳定脚本。',
        },
      ],
      tabContent: {
        hook: [
          {
            title: '问题式开场',
            subtitle: '适合冲转化',
            description: '直接抛出一个常见问题，让观众先对号入座，再自然进入产品解法。',
            badge: '11.5%',
          },
          {
            title: '证据式开场',
            subtitle: '适合高客单',
            description: '先展示结果，再补充过程和证据，降低观众疑虑。',
            badge: '8.2%',
          },
          {
            title: '反差式开场',
            subtitle: '适合新奇品',
            description: '把用户预期与真实效果拉开，制造停顿感和好奇心。',
            badge: '9.8%',
          },
        ],
        angle: [
          {
            title: '功能证据',
            subtitle: '证明产品真的有效',
            description: '把性能、参数和实测对比讲清楚，让观众快速建立信任。',
            badge: '证据',
          },
          {
            title: '场景替代',
            subtitle: '证明它为什么更方便',
            description: '把产品放进真实使用场景里，演示它如何替代旧方案。',
            badge: '场景',
          },
          {
            title: '情绪共鸣',
            subtitle: '证明它很懂用户',
            description: '从焦虑、懒惰和省心三个情绪切口进入，拉近距离。',
            badge: '情绪',
          },
        ],
        script: [
          {
            title: '3 秒钩子',
            subtitle: '先开门再讲解',
            description: '第一句话只做一件事，就是让人停下来继续看。',
            badge: 'Hook',
          },
          {
            title: '卖点递进',
            subtitle: '从轻到重',
            description: '把核心卖点拆成 2 到 3 层，逐层增强说服力。',
            badge: 'Flow',
          },
          {
            title: '行动号召',
            subtitle: '明确下一步',
            description: '最后把“怎么看”“怎么买”“怎么联系”讲得更直接。',
            badge: 'CTA',
          },
        ],
      },
      footer: {
        text: '查看更多创意方向',
        href: '/create/hooks',
      },
    },
  ],
  socialAssets: [
    {
      id: 'social',
      title: '社媒',
      href: '/social',
      tone: 'sky',
      heading: '账号已连接，内容表现正常',
      description: 'TikTok、Instagram、YouTube、Facebook 均已同步最近 7 天数据。',
      status: '已连接 4 个账号',
      platforms: [
        { label: 'TikTok', short: 'TT', color: 'text-[#69c9d0]' },
        { label: 'Instagram', short: 'IG', color: 'text-[#c13584]' },
        { label: 'YouTube', short: 'YT', color: 'text-[#ff0000]' },
        { label: 'Facebook', short: 'FB', color: 'text-[#1877f2]' },
      ],
      metrics: [
        { label: '总播放', value: '128.4万', delta: '+18.2%' },
        { label: '互动率', value: '7.9%', delta: '+1.4%' },
        { label: '私信线索', value: '342', delta: '+36' },
      ],
      recentItems: [
        { title: '宠物慢食碗演示视频', meta: 'TikTok · 28.6万播放' },
        { title: '夏季户外降温合集', meta: 'Instagram · 1.8万互动' },
      ],
      cta: {
        label: '查看社媒看板',
        href: '/social/analytics',
      },
    },
    {
      id: 'assets',
      title: '资产',
      href: '/assets',
      tone: 'amber',
      heading: '店铺、商品和素材库已同步',
      description: '创作素材、商品库和店铺销售表现已进入同一资产池。',
      status: '已同步 3 家店铺',
      metrics: [
        { label: '商品素材', value: '286', delta: '+24' },
        { label: '店铺 GMV', value: '$42.8万', delta: '+12.1%' },
        { label: '可用模特', value: '18', delta: '+3' },
      ],
      recentItems: [
        { title: 'HomeSpark 夏季主推商品包', meta: '42 个商品 · 16 条素材' },
        { title: '父亲节礼品素材集合', meta: '已生成 9 条脚本' },
      ],
      actions: [
        { label: '查看店铺', href: '/assets/shops' },
        { label: '打开素材库', href: '/assets/resources' },
      ],
    },
  ],
  support: {
    chat: {
      title: '对话',
      href: '/chat',
      summary: '今天已有 6 次 AI 协作，最近一次由市场顾问完成。',
      messages: [
        {
          agent: '市场顾问',
          avatar: '/assets/avatars/market-analyst.png',
          text: '已筛出 4 个适合父亲节窗口的轻量测试品类。',
          time: '09:42',
        },
        {
          agent: '创意总监',
          avatar: '/assets/avatars/creative-director.png',
          text: '宠物慢食碗脚本已拆成 3 个开场版本。',
          time: '10:18',
        },
        {
          agent: '社媒管家',
          avatar: '/assets/avatars/social-manager.png',
          text: '本周内容排期已同步到 TikTok 与 Instagram。',
          time: '11:05',
        },
      ],
    },
    tasks: {
      title: '任务',
      href: '/tasks',
      filters: [
        { key: 'today', label: '今天' },
        { key: '7d', label: '近 7 天' },
        { key: '30d', label: '近 30 天' },
      ],
      activeFilter: 'today',
      items: [
        {
          title: '生成宠物慢食碗 3 条 UGC 脚本',
          agent: '创意总监',
          status: '已完成',
          progress: 100,
          tone: 'emerald',
          due: '10:30',
        },
        {
          title: '追踪父亲节礼品竞品价格',
          agent: '市场顾问',
          status: '进行中',
          progress: 68,
          tone: 'sky',
          due: '14:00',
        },
        {
          title: '同步本周 12 条短视频排期',
          agent: '社媒管家',
          status: '排队中',
          progress: 35,
          tone: 'amber',
          due: '16:30',
        },
      ],
    },
  },
  dock: {
    avatar: '/assets/avatars/market-analyst.png',
    prompt: '你的市场现在什么卖得好？',
    agent: '市场顾问',
    shortcut: '⌘K',
  },
}

const makePerformanceCards = (market, overrides = []) => {
  return workspacePageData.performance.cards.map((card, index) => {
    const override = overrides[index] || {}
    return {
      ...card,
      locale: market.flag,
      chart: {
        ...card.chart,
        ...(override.chart || {}),
      },
      metrics: override.metrics || card.metrics,
    }
  })
}

const makePanel = (panel, market, override = {}) => {
  return {
    ...panel,
    locale: market.flag,
    subtitle: override.subtitle || panel.subtitle,
    tabs: panel.tabs.map((tab) => ({
      ...tab,
      ...(override.tabs?.[tab.key] || {}),
    })),
    tabContent: {
      ...panel.tabContent,
      ...(override.tabContent || {}),
    },
    footer: {
      ...panel.footer,
      ...(override.footer || {}),
    },
  }
}

const marketSnapshotConfig = {
  US: {
    news: workspacePageData.header.news,
  },
  UK: {
    news: [
      '英国 TikTok Shop 家居收纳和园艺工具搜索量连续 3 天上升，适合做低客单组合包测试。',
      '英区美妆达人回复率提升至 18%，中腰部达人样品合作转化更稳定。',
      'Shopify 英国站本周礼品类加购率提升 6.4%，建议同步父亲节与夏季露营素材。',
    ],
    performance: [
      {
        chart: { values: [42, 46, 49, 51, 56, 58, 63], minLabel: '£4,210', maxLabel: '£5,980' },
        metrics: [
          { label: '动销店铺', value: '3.84万', delta: '+5.8%', deltaClass: 'text-emerald-600', href: '/discover/tiktok/shops' },
          { label: '动销商品', value: '31.6万', delta: '+9.2%', deltaClass: 'text-emerald-600', href: '/discover/tiktok/products' },
          { label: '总销售额', value: '£428.7万', delta: '+6.6%', deltaClass: 'text-emerald-600', href: '/discover/tiktok/products' },
          { label: '本周热度', value: '78.9', delta: '+2.7%', deltaClass: 'text-emerald-600' },
        ],
      },
      {
        chart: { values: [30, 33, 35, 41, 39, 47, 55], minLabel: '1.4k', maxLabel: '4.9k' },
        metrics: [
          { label: '爆款素材', value: '6,420', delta: '+10.5%', deltaClass: 'text-emerald-600', href: '/discover/tiktok/videos' },
          { label: '平均播放', value: '42.1万', delta: '+7.4%', deltaClass: 'text-emerald-600', href: '/discover/tiktok/videos' },
          { label: '完播率', value: '38.7%', delta: '+1.8%', deltaClass: 'text-emerald-600' },
          { label: '互动率', value: '7.4%', delta: '+0.9%', deltaClass: 'text-emerald-600' },
        ],
      },
      {
        chart: { values: [20, 22, 25, 27, 31, 34, 36], minLabel: '£0.9k', maxLabel: '£2.7k' },
        metrics: [
          { label: '在投广告', value: '1,126', delta: '+4.6%', deltaClass: 'text-emerald-600', href: '/discover/tiktok/ads' },
          { label: 'CTR', value: '2.41%', delta: '+0.3%', deltaClass: 'text-emerald-600', href: '/discover/tiktok/ads' },
          { label: 'CPC', value: '£0.28', delta: '-2.1%', deltaClass: 'text-emerald-600' },
          { label: '素材消耗', value: '69.8%', delta: '+3.4%', deltaClass: 'text-emerald-600' },
        ],
      },
    ],
    marketPanel: {
      subtitle: '市场顾问 · 聚焦英国站礼品、家居与达人带货机会',
      tabContent: {
        discovery: [
          { title: '折叠式园艺收纳箱', tag: 'Garden & Home', metric: '£8.4万 GMV', delta: '+214%', href: '/discover/tiktok/products' },
          { title: '旅行用压缩收纳袋', tag: 'Travel', metric: '5.7万销量', delta: '+168%', href: '/discover/tiktok/products/top-selling' },
          { title: '男士胡须修护套装', tag: 'Beauty', metric: '£32.6 AOV', delta: '+88%', href: '/discover/tiktok/products/new-arrivals' },
          { title: '厨房防油清洁喷雾', tag: 'Kitchen', metric: '312 达人', delta: '+73%', href: '/discover/tiktok/creators' },
        ],
        tracking: [
          { title: 'BritTrend Finds', tag: '增长店铺', metric: '本周上新 28', delta: '+19%', href: '/discover/tiktok/shops/top-selling' },
          { title: 'HomeEase UK', tag: '家居场景', metric: '£12.1万 GMV', delta: '+26%', href: '/discover/tiktok/shops/most-promoted' },
          { title: 'GlowStreet', tag: '美妆个护', metric: '达人 49 位', delta: '+22%', href: '/discover/tiktok/creators/commercial' },
        ],
        validation: [
          { title: '夏季露营小工具', tag: '季节趋势', metric: '搜索 +52%', delta: '可测试', href: '/discover/overview/opportunities' },
          { title: '父亲节礼品组合', tag: '营销节点', metric: '剩余 10 天', delta: '高优先级', href: '/discover/overview/markets' },
          { title: '低客单清洁用品', tag: '复购品类', metric: '毛利 38%', delta: '可铺量', href: '/discover/tiktok/products/most-promoted' },
        ],
      },
    },
    creativePanel: {
      subtitle: '创意总监 · 把英区高回复达人内容拆成可复用脚本',
      tabContent: {
        hook: [
          { title: '英国家庭场景开头', subtitle: '适合家居收纳', description: '用厨房、花园、车库这类真实场景进入，让观众马上理解使用前后的差别。', badge: '9.6%' },
          { title: '礼物清单式开头', subtitle: '适合父亲节', description: '把商品放进“最后一刻礼物清单”，用时间压力推动点击和收藏。', badge: '8.8%' },
          { title: '省空间对比开头', subtitle: '适合旅行品', description: '先展示凌乱行李箱，再切到压缩后的结果，视觉反差更直接。', badge: '10.1%' },
        ],
        angle: [
          { title: '小空间友好', subtitle: '强调英国居住场景', description: '把卖点落在节省空间、好收纳、无需复杂安装，降低购买犹豫。', badge: '场景' },
          { title: '礼品属性', subtitle: '强调送礼不踩雷', description: '用“实用、轻量、价格友好”三点组织短视频表达。', badge: 'Gift' },
          { title: '达人真实试用', subtitle: '强调可信任', description: '保留达人生活化口吻，少用硬广词，多用实际操作细节。', badge: 'UGC' },
        ],
        script: [
          { title: '痛点 2 秒', subtitle: '先给问题', description: '开场只说一个具体麻烦，例如“柜子又满了”或“露营东西太散”。', badge: 'Hook' },
          { title: '演示 6 秒', subtitle: '中段给证据', description: '连续展示展开、收纳、对比结果，减少口播解释。', badge: 'Demo' },
          { title: '清单 CTA', subtitle: '最后给行动', description: '结尾引导“加入本周礼物清单”或“收藏夏季出行清单”。', badge: 'CTA' },
        ],
      },
    },
  },
  DE: {
    news: [
      '德国站工具配件、车载清洁和厨房小电搜索量上涨，用户更关注耐用度和参数证明。',
      '德区广告素材中“前后对比 + 参数字幕”的完播率更高，建议减少夸张口播。',
      'Shopify 德国独立站退货率低于上周 1.1%，高单价小家电可继续测评型素材。',
    ],
    performance: [
      {
        chart: { values: [39, 43, 45, 44, 50, 54, 59], minLabel: '€3,860', maxLabel: '€5,420' },
        metrics: [
          { label: '动销店铺', value: '2.76万', delta: '+4.9%', deltaClass: 'text-emerald-600', href: '/discover/tiktok/shops' },
          { label: '动销商品', value: '24.8万', delta: '+7.6%', deltaClass: 'text-emerald-600', href: '/discover/tiktok/products' },
          { label: '总销售额', value: '€392.4万', delta: '+5.9%', deltaClass: 'text-emerald-600', href: '/discover/tiktok/products' },
          { label: '本周热度', value: '74.2', delta: '+1.9%', deltaClass: 'text-emerald-600' },
        ],
      },
      {
        chart: { values: [28, 32, 31, 36, 40, 43, 48], minLabel: '980', maxLabel: '3.7k' },
        metrics: [
          { label: '爆款素材', value: '4,980', delta: '+8.1%', deltaClass: 'text-emerald-600', href: '/discover/tiktok/videos' },
          { label: '平均播放', value: '31.5万', delta: '+5.6%', deltaClass: 'text-emerald-600', href: '/discover/tiktok/videos' },
          { label: '完播率', value: '36.8%', delta: '+1.2%', deltaClass: 'text-emerald-600' },
          { label: '互动率', value: '6.3%', delta: '+0.6%', deltaClass: 'text-emerald-600' },
        ],
      },
      {
        chart: { values: [18, 21, 23, 24, 29, 32, 35], minLabel: '€0.8k', maxLabel: '€2.3k' },
        metrics: [
          { label: '在投广告', value: '942', delta: '+3.8%', deltaClass: 'text-emerald-600', href: '/discover/tiktok/ads' },
          { label: 'CTR', value: '2.18%', delta: '+0.2%', deltaClass: 'text-emerald-600', href: '/discover/tiktok/ads' },
          { label: 'CPC', value: '€0.34', delta: '-1.4%', deltaClass: 'text-emerald-600' },
          { label: '素材消耗', value: '64.5%', delta: '+2.8%', deltaClass: 'text-emerald-600' },
        ],
      },
    ],
    marketPanel: {
      subtitle: '市场顾问 · 关注德国站工具、厨房和参数型种草机会',
      tabContent: {
        discovery: [
          { title: '无线迷你电动螺丝刀', tag: 'Tools', metric: '€6.9万 GMV', delta: '+174%', href: '/discover/tiktok/products' },
          { title: '车载座椅缝隙清洁刷', tag: 'Auto', metric: '4.2万销量', delta: '+131%', href: '/discover/tiktok/products/top-selling' },
          { title: '低噪桌面真空机', tag: 'Office', metric: '€41.2 AOV', delta: '+66%', href: '/discover/tiktok/products/new-arrivals' },
          { title: '厨房密封储物罐', tag: 'Kitchen', metric: '218 达人', delta: '+58%', href: '/discover/tiktok/creators' },
        ],
        tracking: [
          { title: 'WerkzeugHub', tag: '工具店铺', metric: '本周上新 19', delta: '+14%', href: '/discover/tiktok/shops/top-selling' },
          { title: 'CleanAuto DE', tag: '汽车用品', metric: '€9.8万 GMV', delta: '+21%', href: '/discover/tiktok/shops/most-promoted' },
          { title: 'KüchePlus', tag: '厨房场景', metric: '广告 64 条', delta: '+17%', href: '/discover/tiktok/ads' },
        ],
        validation: [
          { title: '参数证明型工具', tag: '理性决策', metric: '转化 +18%', delta: '值得测', href: '/discover/overview/opportunities' },
          { title: '车内清洁套装', tag: '复购品类', metric: '毛利 34%', delta: '可铺量', href: '/discover/tiktok/products/most-promoted' },
          { title: '低噪小电器', tag: '高客单', metric: '退货 -1.1%', delta: '可加码', href: '/discover/overview/markets' },
        ],
      },
    },
    creativePanel: {
      subtitle: '创意总监 · 为德区素材强化参数、证明和对比逻辑',
      tabContent: {
        hook: [
          { title: '数据开头', subtitle: '适合工具品类', description: '第一屏直接给参数或测试结果，比如转速、续航、噪音分贝。', badge: '7.9%' },
          { title: '前后对比开头', subtitle: '适合清洁品', description: '用同一镜头展示清洁前后，避免过多情绪化表达。', badge: '8.4%' },
          { title: '耐用测试开头', subtitle: '适合高客单', description: '用连续测试片段建立质量感，强化“不是一次性玩具”。', badge: '7.6%' },
        ],
        angle: [
          { title: '参数可信', subtitle: '先证明再销售', description: '把规格、材质、测试条件写进字幕，降低德国用户的信息不确定性。', badge: 'Proof' },
          { title: '长期省钱', subtitle: '强调耐用', description: '用单次成本、可复用次数、保修感表达替代单纯低价。', badge: 'Value' },
          { title: '整洁秩序', subtitle: '贴合生活习惯', description: '围绕车内、桌面、厨房的整洁效率组织卖点。', badge: 'Order' },
        ],
        script: [
          { title: '参数字幕', subtitle: '开头 3 秒', description: '把核心参数放到第一屏，不等观众点开评论区再找答案。', badge: 'Spec' },
          { title: '连续测试', subtitle: '中段 8 秒', description: '用 2 到 3 个测试场景证明稳定表现。', badge: 'Test' },
          { title: '风险解除', subtitle: '结尾说明', description: '补充适配范围、清洁方式或保修提示，降低下单顾虑。', badge: 'Trust' },
        ],
      },
    },
  },
  JP: {
    news: [
      '日本站美妆个护、收纳小物和宠物护理内容热度上升，精致细节镜头更容易获得收藏。',
      '日区短视频里“安静演示 + 字幕说明”互动率提升 1.7%，适合做多版本封面测试。',
      'Shopify 日本站小件组合包客单价提升 9.3%，建议用套装逻辑重组素材。',
    ],
    performance: [
      {
        chart: { values: [36, 38, 41, 45, 47, 53, 57], minLabel: '¥42.8万', maxLabel: '¥68.5万' },
        metrics: [
          { label: '动销店铺', value: '2.18万', delta: '+6.2%', deltaClass: 'text-emerald-600', href: '/discover/tiktok/shops' },
          { label: '动销商品', value: '19.4万', delta: '+8.7%', deltaClass: 'text-emerald-600', href: '/discover/tiktok/products' },
          { label: '总销售额', value: '¥5,842万', delta: '+7.4%', deltaClass: 'text-emerald-600', href: '/discover/tiktok/products' },
          { label: '本周热度', value: '81.6', delta: '+3.1%', deltaClass: 'text-emerald-600' },
        ],
      },
      {
        chart: { values: [31, 36, 40, 43, 48, 52, 58], minLabel: '1.8k', maxLabel: '5.6k' },
        metrics: [
          { label: '爆款素材', value: '7,310', delta: '+12.6%', deltaClass: 'text-emerald-600', href: '/discover/tiktok/videos' },
          { label: '平均播放', value: '55.2万', delta: '+8.9%', deltaClass: 'text-emerald-600', href: '/discover/tiktok/videos' },
          { label: '完播率', value: '44.5%', delta: '+2.6%', deltaClass: 'text-emerald-600' },
          { label: '互动率', value: '9.1%', delta: '+1.7%', deltaClass: 'text-emerald-600' },
        ],
      },
      {
        chart: { values: [16, 20, 24, 26, 30, 33, 39], minLabel: '¥12万', maxLabel: '¥38万' },
        metrics: [
          { label: '在投广告', value: '1,284', delta: '+5.9%', deltaClass: 'text-emerald-600', href: '/discover/tiktok/ads' },
          { label: 'CTR', value: '2.92%', delta: '+0.5%', deltaClass: 'text-emerald-600', href: '/discover/tiktok/ads' },
          { label: 'CPC', value: '¥41', delta: '-2.8%', deltaClass: 'text-emerald-600' },
          { label: '素材消耗', value: '72.7%', delta: '+3.9%', deltaClass: 'text-emerald-600' },
        ],
      },
    ],
    marketPanel: {
      subtitle: '市场顾问 · 追踪日本站美妆、收纳和宠物护理机会',
      tabContent: {
        discovery: [
          { title: '便携睫毛梳套装', tag: 'Beauty', metric: '¥860万 GMV', delta: '+238%', href: '/discover/tiktok/products' },
          { title: '桌面透明收纳抽屉', tag: 'Storage', metric: '6.8万销量', delta: '+152%', href: '/discover/tiktok/products/top-selling' },
          { title: '宠物湿巾加热盒', tag: 'Pet Care', metric: '¥2,980 AOV', delta: '+94%', href: '/discover/tiktok/products/new-arrivals' },
          { title: '旅行分装瓶套装', tag: 'Travel Beauty', metric: '386 达人', delta: '+81%', href: '/discover/tiktok/creators' },
        ],
        tracking: [
          { title: 'Kirei Select', tag: '美妆店铺', metric: '本周上新 33', delta: '+24%', href: '/discover/tiktok/shops/top-selling' },
          { title: 'MiniLife JP', tag: '收纳场景', metric: '¥1,420万 GMV', delta: '+29%', href: '/discover/tiktok/shops/most-promoted' },
          { title: 'PetMori', tag: '宠物护理', metric: '达人 58 位', delta: '+27%', href: '/discover/tiktok/creators/commercial' },
        ],
        validation: [
          { title: '细节镜头美妆工具', tag: '内容优势', metric: '收藏 +36%', delta: '可放量', href: '/discover/overview/opportunities' },
          { title: '小件组合套装', tag: '客单提升', metric: 'AOV +9.3%', delta: '可重组', href: '/discover/tiktok/products/most-promoted' },
          { title: '宠物护理小电器', tag: '新兴需求', metric: '搜索 +49%', delta: '可试样', href: '/discover/overview/markets' },
        ],
      },
    },
    creativePanel: {
      subtitle: '创意总监 · 用日区偏好的安静演示和细节镜头组织内容',
      tabContent: {
        hook: [
          { title: '静物细节开头', subtitle: '适合美妆工具', description: '用微距镜头展示质感和使用细节，第一秒就建立精致感。', badge: '11.2%' },
          { title: '收纳前后开头', subtitle: '适合家居小物', description: '先给凌乱桌面，再给整齐结果，转场尽量干净。', badge: '9.4%' },
          { title: '宠物反应开头', subtitle: '适合宠物用品', description: '用宠物真实反应做信任入口，字幕解释产品作用。', badge: '8.9%' },
        ],
        angle: [
          { title: '精致细节', subtitle: '强调质感', description: '展示边角、材质、收纳后的视觉秩序，让商品显得更值得收藏。', badge: 'Detail' },
          { title: '轻量套装', subtitle: '强调组合价值', description: '把多个小件打成一套，突出“刚好够用、不占空间”。', badge: 'Set' },
          { title: '安静可靠', subtitle: '减少强推感', description: '弱化夸张口播，用字幕和演示让用户自己得出结论。', badge: 'Soft' },
        ],
        script: [
          { title: '一镜到底展示', subtitle: '开头给质感', description: '第一段只做视觉吸引，不塞太多卖点。', badge: 'Visual' },
          { title: '字幕列卖点', subtitle: '中段轻解释', description: '每屏只保留一个短句，配合手部演示。', badge: 'Caption' },
          { title: '套装收尾', subtitle: '结尾给组合', description: '用整套摆拍和使用场景收尾，强化收藏与下单理由。', badge: 'Bundle' },
        ],
      },
    },
  },
}

workspacePageData.marketSnapshots = Object.fromEntries(
  workspacePageData.markets.map((market) => {
    const config = marketSnapshotConfig[market.code] || marketSnapshotConfig.US
    const [marketPanel, creativePanel] = workspacePageData.opportunities
    return [
      market.code,
      {
        market,
        news: config.news || workspacePageData.header.news,
        performance: {
          cards: makePerformanceCards(market, config.performance),
        },
        opportunities: [
          makePanel(marketPanel, market, config.marketPanel),
          makePanel(creativePanel, market, config.creativePanel),
        ],
      },
    ]
  }),
)

const CHJ_ENTITY_API_BASE = backendUrl('/api/chj/svc/passthrough/entity/tiktok')

const CHJ_WORKSPACE_API = {
  NEWS_LIST: `${CHJ_ENTITY_API_BASE}/workspace/news/list`,
  MARKET_PULSE: `${CHJ_ENTITY_API_BASE}/workspace/performance/market_pulse`,
  HOTTEST_VIDEOS: `${CHJ_ENTITY_API_BASE}/workspace/performance/hottest_videos`,
  TRENDING_ADS: `${CHJ_ENTITY_API_BASE}/workspace/performance/trending_ads`,
  OPPORTUNITY_COUNTS: `${CHJ_ENTITY_API_BASE}/dashboard/opportunities/counts`,
  PRODUCT_OPPORTUNITIES: `${CHJ_ENTITY_API_BASE}/dashboard/opportunities/product`,
  HOOKS: `${CHJ_ENTITY_API_BASE}/workspace/opportunities/hooks`,
  TEMPLATES: `${CHJ_ENTITY_API_BASE}/workspace/opportunities/formulas`,
  ANGLES: `${CHJ_ENTITY_API_BASE}/workspace/opportunities/angles`,
}

const DATA_REGION_HEADER = 'x-biyi-data-region'
const MARKET_REGION_MAP = {
  US: 'US',
  UK: 'UK',
  DE: 'DE',
  JP: 'JP',
}
const CURRENCY_SYMBOLS = {
  US: '$',
  UK: '£',
  GB: '£',
  DE: '€',
  JP: '¥',
}
const PRODUCT_FIELD_PREFIX = 'tiktok_product_dashboard_'
const OPPORTUNITY_TYPES = {
  discovery: 'sales_spikes',
  tracking: 'blue_ocean',
  validation: 'seasonal_bestsellers',
}

const zhNumberFormatter = new Intl.NumberFormat('zh-CN', {
  maximumFractionDigits: 1,
})

const getDefaultStartDateStr = () => {
  const chinaNow = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Shanghai' }))
  chinaNow.setDate(chinaNow.getDate() - (chinaNow.getHours() < 15 ? 2 : 1))
  const year = chinaNow.getFullYear()
  const month = String(chinaNow.getMonth() + 1).padStart(2, '0')
  const day = String(chinaNow.getDate()).padStart(2, '0')
  return `${year}${month}${day}`
}

const assertChjResponse = (data) => {
  if (data?.base_resp && data.base_resp.code !== 0) {
    throw new Error(data.base_resp.msg || `CHJ API error: ${data.base_resp.code}`)
  }
  return data
}

const postChjApi = async (url, { region, body = {} } = {}) => {
  const headers = {
    'Content-Type': 'application/json',
  }
  if (region) headers[DATA_REGION_HEADER] = region

  const response = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  })

  const data = await response.json()
  if (!response.ok) {
    throw new Error(data?.base_resp?.msg || `CHJ API HTTP ${response.status}`)
  }
  return assertChjResponse(data)
}

const takeFulfilled = (result, fallback = null) => {
  return result.status === 'fulfilled' ? result.value : fallback
}

const moduleCount = (status, moduleKey) => {
  const modules = status?.cache?.modules || []
  return modules.find((item) => item.module_key === moduleKey)?.total || 0
}

const assertBackendCacheReady = async () => {
  const status = await fetchChjCacheStatus()
  if (!status?.configured) {
    throw new Error(status?.detail || 'Backend RDS cache is not configured')
  }
  if (!moduleCount(status, 'today_opportunities')) {
    throw new Error('Backend RDS cache has no today_opportunities records')
  }
  return status
}

const toNumber = (value, fallback = 0) => {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value)
    if (Number.isFinite(parsed)) return parsed
  }
  if (value && typeof value === 'object' && 'value' in value) return toNumber(value.value, fallback)
  return fallback
}

const formatCompactNumber = (value) => {
  const number = toNumber(value)
  const abs = Math.abs(number)
  if (abs >= 100000000) return `${zhNumberFormatter.format(number / 100000000)}亿`
  if (abs >= 10000) return `${zhNumberFormatter.format(number / 10000)}万`
  return zhNumberFormatter.format(number)
}

const formatCurrency = (value, marketCode = 'US') => {
  const symbol = CURRENCY_SYMBOLS[marketCode] || '$'
  return `${symbol}${formatCompactNumber(value)}`
}

const formatGrowth = (rate) => {
  const number = toNumber(rate, 0)
  const percent = number * 100
  const sign = percent >= 0 ? '+' : ''
  return `${sign}${percent.toFixed(Math.abs(percent) >= 100 ? 0 : 1)}%`
}

const formatRatioPercent = (rate) => {
  const number = toNumber(rate, 0)
  const percent = Math.abs(number) <= 1 ? number * 100 : number
  return `${percent.toFixed(Math.abs(percent) >= 10 ? 0 : 1)}%`
}

const trendClass = (rate) => (toNumber(rate) >= 0 ? 'text-emerald-600' : 'text-red-500')

const buildTrendValues = (growth = 0, base = 48) => {
  const safeGrowth = Math.max(-0.45, Math.min(0.75, toNumber(growth, 0)))
  const start = base * (1 - safeGrowth * 0.35)
  const end = base * (1 + safeGrowth * 0.35)
  return Array.from({ length: 7 }, (_, index) => {
    const progress = index / 6
    const wobble = Math.sin(index + base) * 2.5
    return Math.max(8, Math.round(start + (end - start) * progress + wobble))
  })
}

const flattenFieldList = (entity) => {
  return Object.fromEntries((entity?.field_list || []).map((field) => [field.field_key, field.value]))
}

const categoryLabel = (...categories) => {
  const category = categories.find(Boolean)
  return category ? `类目 ${category}` : 'TikTok Shop'
}

const localizedValue = (item, key) => {
  return item?.[`${key}_zh`] || item?.[`${key}_cn`] || item?.[key] || item?.[`${key}_en`] || ''
}

const humanizeType = (value, fallback = '趋势类型') => {
  if (!value) return fallback
  return String(value)
    .split(/[_-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

const mapNewsItems = (data) => {
  return (data?.groups || [])
    .flatMap((group) => group.items || [])
    .sort((left, right) => {
      const priority = { urgent: 0, high: 1, medium: 2, low: 3 }
      return (priority[left.priority] ?? 2) - (priority[right.priority] ?? 2)
    })
    .map((item) => {
      const title = item.title_zh || item.title || item.description_zh || item.description || '出海匠市场快讯'
      const summary = item.impact_summary_zh || item.description_zh || item.impact_summary || item.description || ''
      return summary && summary !== title ? `${title}｜${summary}` : title
    })
    .filter(Boolean)
    .slice(0, 8)
}

const mapMarketPulseCard = (data, market, fallbackCard) => {
  if (!data?.gmv_summary) return fallbackCard

  const gmv = data.gmv_summary
  const category = data.top_category_summary || {}
  const product = data.top_product_summary || {}
  const shop = data.top_shop_summary || {}

  return {
    ...fallbackCard,
    locale: market.flag,
    chart: {
      values: buildTrendValues(gmv.growth_rate, 56),
      minLabel: formatCurrency(toNumber(gmv.value) * 0.86, market.code),
      maxLabel: formatCurrency(gmv.value, market.code),
    },
    metrics: [
      {
        label: 'GMV',
        value: formatCurrency(gmv.value, market.code),
        delta: formatGrowth(gmv.growth_rate),
        deltaClass: trendClass(gmv.growth_rate),
        href: '/discover/overview/pulse',
      },
      {
        label: '热门类目',
        value: categoryLabel(category.l3_category, category.l2_category, category.l1_category),
        delta: formatGrowth(category.growth_rate),
        deltaClass: trendClass(category.growth_rate),
        href: '/discover/overview/markets',
      },
      {
        label: '爆品 GMV',
        value: formatCurrency(product.gmv, market.code),
        delta: formatGrowth(product.growth_rate),
        deltaClass: trendClass(product.growth_rate),
        href: '/discover/tiktok/products',
      },
      {
        label: '头部店铺',
        value: formatCurrency(shop.gmv, market.code),
        delta: formatGrowth(shop.growth_rate),
        deltaClass: trendClass(shop.growth_rate),
        href: '/discover/tiktok/shops',
      },
    ],
  }
}

const mapVideoCard = (data, market, fallbackCard) => {
  if (!data?.hottest_by_gmv) return fallbackCard

  const hottestByGmv = data.hottest_by_gmv || {}
  const topByGpm = data.top_by_gpm || {}
  const mostViewed = data.most_viewed || {}
  const hottestByEr = data.hottest_by_er || {}

  return {
    ...fallbackCard,
    locale: market.flag,
    chart: {
      values: buildTrendValues(0.28, 48),
      minLabel: formatCompactNumber(toNumber(mostViewed.play_count) * 0.35),
      maxLabel: formatCompactNumber(mostViewed.play_count),
    },
    metrics: [
      { label: 'GMV 最高视频', value: formatCurrency(hottestByGmv.gmv, market.code), delta: '线上', deltaClass: 'text-violet-600', href: '/discover/tiktok/videos' },
      { label: 'GPM 最高', value: formatCurrency(topByGpm.gpm, market.code), delta: '线上', deltaClass: 'text-violet-600', href: '/discover/tiktok/videos' },
      { label: '播放最高', value: formatCompactNumber(mostViewed.play_count), delta: '实时', deltaClass: 'text-violet-600', href: '/discover/tiktok/videos' },
      { label: '互动率最高', value: formatRatioPercent(hottestByEr.engagement_rate), delta: '实时', deltaClass: 'text-violet-600' },
    ],
  }
}

const mapAdsCard = (data, market, fallbackCard) => {
  if (!data?.hottest_by_gmv) return fallbackCard

  const hottestByGmv = data.hottest_by_gmv || {}
  const topByRoas = data.top_by_roas || {}
  const mostViewed = data.most_viewed || {}
  const highestSpend = data.highest_spend || {}

  return {
    ...fallbackCard,
    locale: market.flag,
    chart: {
      values: buildTrendValues(0.2, 42),
      minLabel: formatCurrency(toNumber(highestSpend.spend) * 0.35, market.code),
      maxLabel: formatCurrency(highestSpend.spend, market.code),
    },
    metrics: [
      { label: 'GMV 最高广告', value: formatCurrency(hottestByGmv.gmv, market.code), delta: '线上', deltaClass: 'text-orange-600', href: '/discover/tiktok/ads' },
      { label: 'ROAS 最高', value: `${toNumber(topByRoas.roas).toFixed(1)}x`, delta: '实时', deltaClass: 'text-orange-600', href: '/discover/tiktok/ads' },
      { label: '播放最高', value: formatCompactNumber(mostViewed.play_count), delta: '实时', deltaClass: 'text-orange-600', href: '/discover/tiktok/ads' },
      { label: '消耗最高', value: formatCurrency(highestSpend.spend, market.code), delta: '线上', deltaClass: 'text-orange-600' },
    ],
  }
}

const fetchProductOpportunities = (type, region, limit = 6) => {
  return postChjApi(CHJ_WORKSPACE_API.PRODUCT_OPPORTUNITIES, {
    region,
    body: {
      field_filter: [
        {
          filter_key: 'tiktok_product_dashboard_opportunity_type',
          quick_option_name: `tiktok_product_dashboard_opportunity_type_${type}`,
        },
      ],
      sort_filter: [
        {
          field_key: 'tiktok_product_dashboard_spike_sort_score',
          order: 1,
        },
      ],
      limit,
      offset: 0,
    },
  })
}

const mapProductOpportunityItems = (data, market, type) => {
  return (data?.entity_list || []).slice(0, 6).map((entity) => {
    const fields = flattenFieldList(entity)
    const productId = fields[`${PRODUCT_FIELD_PREFIX}product_id`] || entity.entity_id
    const productName = fields[`${PRODUCT_FIELD_PREFIX}product_name`] || `商品 ${productId}`
    const gmv = fields[`${PRODUCT_FIELD_PREFIX}product_gmv_for_last_30_days`] || fields[`${PRODUCT_FIELD_PREFIX}product_gmv`] || fields[`${PRODUCT_FIELD_PREFIX}category_monthly_gmv`]
    const scoreKey = type === 'blue_ocean'
      ? 'blue_ocean_sort_score'
      : type === 'seasonal_bestsellers'
        ? 'seasonal_bestseller_sort_score'
        : 'spike_sort_score'
    const score = fields[`${PRODUCT_FIELD_PREFIX}${scoreKey}`]
    const spike = fields[`${PRODUCT_FIELD_PREFIX}spike_pct`]

    return {
      title: productName,
      tag: categoryLabel(
        fields[`${PRODUCT_FIELD_PREFIX}l3_category`],
        fields[`${PRODUCT_FIELD_PREFIX}l2_category`],
        fields[`${PRODUCT_FIELD_PREFIX}l1_category`],
      ),
      metric: formatCurrency(gmv, market.code),
      delta: spike === undefined ? `评分 ${Math.round(toNumber(score))}` : formatGrowth(spike),
      href: productId ? `/discover/tiktok/products` : '/discover/tiktok/products',
    }
  })
}

const mapCreativeItems = (data, market, descriptionKey = 'insight') => {
  return (data?.types || []).slice(0, 3).map((item, index) => {
    const title = humanizeType(item.type, `创意 ${index + 1}`)
    const description = localizedValue(item, descriptionKey)
      || localizedValue(item, 'insight_template')
      || localizedValue(item, 'description')
      || localizedValue(item, 'strategy')
      || '出海匠公开数据给出的内容表达方向。'

    return {
      title,
      subtitle: `${formatRatioPercent(item.usage_percent)} 使用占比 · ${formatCurrency(item.avg_gmv, market.code)} 平均GMV`,
      description,
      badge: formatRatioPercent(item.usage_percent),
    }
  })
}

const fetchRemoteNews = async () => {
  const data = await postChjApi(CHJ_WORKSPACE_API.NEWS_LIST)
  return mapNewsItems(data)
}

const buildRemoteMarketSnapshot = async (market, sharedNews) => {
  const region = MARKET_REGION_MAP[market.code] || market.code
  const fallbackSnapshot = workspacePageData.marketSnapshots[market.code] || workspacePageData.marketSnapshots.US
  const fallbackMarketPanel = fallbackSnapshot.opportunities[0]
  const fallbackCreativePanel = fallbackSnapshot.opportunities[1]
  const [
    marketPulse,
    hottestVideos,
    trendingAds,
    salesSpikes,
    blueOcean,
    seasonalBestsellers,
    hooks,
    angles,
    templates,
    opportunityCounts,
  ] = await Promise.allSettled([
    postChjApi(CHJ_WORKSPACE_API.MARKET_PULSE, {
      region,
      body: {
        time_filter: {
          granularity: 0,
          start_date_time: getDefaultStartDateStr(),
        },
      },
    }),
    postChjApi(CHJ_WORKSPACE_API.HOTTEST_VIDEOS, { region }),
    postChjApi(CHJ_WORKSPACE_API.TRENDING_ADS, { region }),
    fetchProductOpportunities(OPPORTUNITY_TYPES.discovery, region, 6),
    fetchProductOpportunities(OPPORTUNITY_TYPES.tracking, region, 4),
    fetchProductOpportunities(OPPORTUNITY_TYPES.validation, region, 4),
    postChjApi(CHJ_WORKSPACE_API.HOOKS, { region }),
    postChjApi(CHJ_WORKSPACE_API.ANGLES, { region }),
    postChjApi(CHJ_WORKSPACE_API.TEMPLATES, { region }),
    postChjApi(CHJ_WORKSPACE_API.OPPORTUNITY_COUNTS, { region }),
  ])

  const counts = takeFulfilled(opportunityCounts)
  const countsText = counts?.total ? ` · ${counts.total} 个机会信号` : ''
  const discoveryItems = mapProductOpportunityItems(takeFulfilled(salesSpikes), market, OPPORTUNITY_TYPES.discovery)
  const trackingItems = mapProductOpportunityItems(takeFulfilled(blueOcean), market, OPPORTUNITY_TYPES.tracking)
  const validationItems = mapProductOpportunityItems(takeFulfilled(seasonalBestsellers), market, OPPORTUNITY_TYPES.validation)
  const hookItems = mapCreativeItems(takeFulfilled(hooks), market, 'insight_template')
  const angleItems = mapCreativeItems(takeFulfilled(angles), market, 'insight')
  const templateItems = mapCreativeItems(takeFulfilled(templates), market, 'insight')

  return {
    market,
    news: sharedNews?.length ? sharedNews : fallbackSnapshot.news,
    performance: {
      cards: [
        mapMarketPulseCard(takeFulfilled(marketPulse), market, fallbackSnapshot.performance.cards[0]),
        mapVideoCard(takeFulfilled(hottestVideos), market, fallbackSnapshot.performance.cards[1]),
        mapAdsCard(takeFulfilled(trendingAds), market, fallbackSnapshot.performance.cards[2]),
      ],
    },
    opportunities: [
      makePanel(workspacePageData.opportunities[0], market, {
        subtitle: `市场顾问 · 出海匠公开 API ${market.label} 实时机会${countsText}`,
        tabContent: {
          discovery: discoveryItems.length ? discoveryItems : fallbackMarketPanel.tabContent.discovery,
          tracking: trackingItems.length ? trackingItems : fallbackMarketPanel.tabContent.tracking,
          validation: validationItems.length ? validationItems : fallbackMarketPanel.tabContent.validation,
        },
      }),
      makePanel(workspacePageData.opportunities[1], market, {
        subtitle: `创意总监 · 出海匠公开 API ${market.label} 内容洞察`,
        tabContent: {
          hook: hookItems.length ? hookItems : fallbackCreativePanel.tabContent.hook,
          angle: angleItems.length ? angleItems : fallbackCreativePanel.tabContent.angle,
          script: templateItems.length ? templateItems : fallbackCreativePanel.tabContent.script,
        },
      }),
    ],
  }
}

const buildRemoteWorkspaceData = async () => {
  const data = cloneData(workspacePageData)
  const cacheStatus = await assertBackendCacheReady()
  const sharedNews = await fetchRemoteNews().catch(() => [])
  const entries = await Promise.all(data.markets.map(async (market) => {
    try {
      return [market.code, await buildRemoteMarketSnapshot(market, sharedNews)]
    } catch (error) {
      console.warn(`[workspace] ${market.code} remote snapshot fallback`, error)
      return [market.code, data.marketSnapshots[market.code]]
    }
  }))

  return {
    ...data,
    header: {
      ...data.header,
      badge: '实时快讯',
      description: '已通过本地代理接入出海匠公开 API，市场表现、爆款视频、热门广告和机会洞察会优先展示线上数据。',
    },
    marketSnapshots: Object.fromEntries(entries),
    remoteSource: {
      provider: 'chuhaijiang',
      backend: 'fastapi',
      cache: cacheStatus.cache,
      fetchedAt: new Date().toISOString(),
    },
  }
}

const buildProgressiveMarketSnapshot = async (market, getSharedNews, onUpdate) => {
  const region = MARKET_REGION_MAP[market.code] || market.code
  const fallbackSnapshot = workspacePageData.marketSnapshots[market.code] || workspacePageData.marketSnapshots.US
  const fallbackMarketPanel = fallbackSnapshot.opportunities[0]
  const fallbackCreativePanel = fallbackSnapshot.opportunities[1]
  const performanceCards = fallbackSnapshot.performance.cards.map((card) => ({
    ...card,
    locale: market.flag,
  }))
  const marketTabContent = {
    ...fallbackMarketPanel.tabContent,
  }
  const creativeTabContent = {
    ...fallbackCreativePanel.tabContent,
  }
  let opportunityCountText = ''
  const snapshot = {
    market,
    news: fallbackSnapshot.news,
    performance: {
      cards: performanceCards,
    },
    opportunities: fallbackSnapshot.opportunities,
  }

  const currentNews = () => {
    const sharedNews = getSharedNews?.() || []
    return sharedNews.length ? sharedNews : fallbackSnapshot.news
  }

  const emitSnapshot = () => {
    snapshot.news = currentNews()
    snapshot.performance = {
      cards: [...performanceCards],
    }
    snapshot.opportunities = [
      makePanel(workspacePageData.opportunities[0], market, {
        subtitle: `市场顾问 · 出海匠公开 API ${market.label} 实时机会${opportunityCountText}`,
        tabContent: { ...marketTabContent },
      }),
      makePanel(workspacePageData.opportunities[1], market, {
        subtitle: `创意总监 · 出海匠公开 API ${market.label} 内容洞察`,
        tabContent: { ...creativeTabContent },
      }),
    ]
    onUpdate?.(cloneData(snapshot))
  }

  const track = (label, promise) => {
    return promise.catch((error) => {
      console.warn(`[workspace] ${market.code} ${label} fallback`, error)
      return null
    })
  }

  emitSnapshot()

  await Promise.all([
    track('market pulse', postChjApi(CHJ_WORKSPACE_API.MARKET_PULSE, {
      region,
      body: {
        time_filter: {
          granularity: 0,
          start_date_time: getDefaultStartDateStr(),
        },
      },
    }).then((data) => {
      performanceCards[0] = mapMarketPulseCard(data, market, fallbackSnapshot.performance.cards[0])
      emitSnapshot()
      return data
    })),
    track('hottest videos', postChjApi(CHJ_WORKSPACE_API.HOTTEST_VIDEOS, { region }).then((data) => {
      performanceCards[1] = mapVideoCard(data, market, fallbackSnapshot.performance.cards[1])
      emitSnapshot()
      return data
    })),
    track('trending ads', postChjApi(CHJ_WORKSPACE_API.TRENDING_ADS, { region }).then((data) => {
      performanceCards[2] = mapAdsCard(data, market, fallbackSnapshot.performance.cards[2])
      emitSnapshot()
      return data
    })),
    track('sales spikes', fetchProductOpportunities(OPPORTUNITY_TYPES.discovery, region, 6).then((data) => {
      const items = mapProductOpportunityItems(data, market, OPPORTUNITY_TYPES.discovery)
      if (items.length) marketTabContent.discovery = items
      emitSnapshot()
      return data
    })),
    track('blue ocean', fetchProductOpportunities(OPPORTUNITY_TYPES.tracking, region, 4).then((data) => {
      const items = mapProductOpportunityItems(data, market, OPPORTUNITY_TYPES.tracking)
      if (items.length) marketTabContent.tracking = items
      emitSnapshot()
      return data
    })),
    track('seasonal bestsellers', fetchProductOpportunities(OPPORTUNITY_TYPES.validation, region, 4).then((data) => {
      const items = mapProductOpportunityItems(data, market, OPPORTUNITY_TYPES.validation)
      if (items.length) marketTabContent.validation = items
      emitSnapshot()
      return data
    })),
    track('hooks', postChjApi(CHJ_WORKSPACE_API.HOOKS, { region }).then((data) => {
      const items = mapCreativeItems(data, market, 'insight_template')
      if (items.length) creativeTabContent.hook = items
      emitSnapshot()
      return data
    })),
    track('angles', postChjApi(CHJ_WORKSPACE_API.ANGLES, { region }).then((data) => {
      const items = mapCreativeItems(data, market, 'insight')
      if (items.length) creativeTabContent.angle = items
      emitSnapshot()
      return data
    })),
    track('templates', postChjApi(CHJ_WORKSPACE_API.TEMPLATES, { region }).then((data) => {
      const items = mapCreativeItems(data, market, 'insight')
      if (items.length) creativeTabContent.script = items
      emitSnapshot()
      return data
    })),
    track('opportunity counts', postChjApi(CHJ_WORKSPACE_API.OPPORTUNITY_COUNTS, { region }).then((data) => {
      opportunityCountText = data?.total ? ` · ${data.total} 个机会信号` : ''
      emitSnapshot()
      return data
    })),
  ])

  emitSnapshot()
  return cloneData(snapshot)
}

const buildProgressiveRemoteWorkspaceData = async ({ onUpdate } = {}) => {
  const data = cloneData(workspacePageData)
  const cacheStatus = await assertBackendCacheReady()
  let sharedNews = []

  const publish = () => {
    onUpdate?.(cloneData(data))
  }

  const setMarketSnapshot = (market, snapshot) => {
    data.marketSnapshots = {
      ...data.marketSnapshots,
      [market.code]: snapshot,
    }
    publish()
  }

  data.remoteSource = {
    provider: 'chuhaijiang',
    backend: 'fastapi',
    cache: cacheStatus.cache,
    fetchedAt: new Date().toISOString(),
    loading: true,
  }
  data.header = {
    ...data.header,
    badge: '实时快讯',
    description: '已通过本地代理接入出海匠公开 API，市场表现、爆款视频、热门广告和机会洞察会优先展示线上数据。',
  }
  publish()

  const newsTask = fetchRemoteNews()
    .then((items) => {
      sharedNews = items || []
      if (sharedNews.length) {
        data.header = {
          ...data.header,
          news: sharedNews,
        }
        data.marketSnapshots = Object.fromEntries(
          Object.entries(data.marketSnapshots || {}).map(([code, snapshot]) => [
            code,
            {
              ...snapshot,
              news: sharedNews,
            },
          ]),
        )
        publish()
      }
      return sharedNews
    })
    .catch((error) => {
      console.warn('[workspace] news fallback', error)
      return []
    })

  await Promise.all([
    newsTask,
    ...data.markets.map(async (market) => {
      try {
        const snapshot = await buildProgressiveMarketSnapshot(market, () => sharedNews, (partialSnapshot) => {
          setMarketSnapshot(market, partialSnapshot)
        })
        setMarketSnapshot(market, snapshot)
      } catch (error) {
        console.warn(`[workspace] ${market.code} progressive snapshot fallback`, error)
        setMarketSnapshot(market, data.marketSnapshots[market.code])
      }
    }),
  ])

  data.remoteSource = {
    ...data.remoteSource,
    fetchedAt: new Date().toISOString(),
    loading: false,
  }
  publish()
  return cloneData(data)
}

const cloneData = (value) => {
  if (typeof structuredClone === 'function') return structuredClone(value)
  return JSON.parse(JSON.stringify(value))
}

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

export async function fetchWorkspaceData(options = {}) {
  await wait(80)
  try {
    return await buildProgressiveRemoteWorkspaceData(options)
  } catch (error) {
    console.warn('[workspace] remote API fallback', error)
    return cloneData(workspacePageData)
  }
}

export function getWorkspaceData() {
  return cloneData(workspacePageData)
}
