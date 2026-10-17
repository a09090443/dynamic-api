// @ts-check

const {themes: prismThemes} = require('prism-react-renderer');

const GITHUB_URL = 'https://github.com/a09090443/dynamic-api';

/** @type {import('@docusaurus/types').Config} */
const config = {
  title: 'Dynamic API Manager',
  tagline: '執行期動態載入 SOAP / RESTful 服務，並以資料庫管理 Mock 回應',
  favicon: 'img/logo.svg',

  // 部署前請改為實際網域與路徑（llms.txt、sitemap 會使用此網址）；
  // 例如部署到 GitHub Pages 專案頁時，baseUrl 需改為 '/dynamic-api/'
  url: 'https://a09090443.github.io',
  baseUrl: '/',

  organizationName: 'a09090443',
  projectName: 'dynamic-api',

  onBrokenLinks: 'throw',

  i18n: {
    defaultLocale: 'zh-Hant',
    locales: ['zh-Hant'],
  },

  markdown: {
    mermaid: true,
    hooks: {
      onBrokenMarkdownLinks: 'throw',
    },
  },

  themes: [
    '@docusaurus/theme-mermaid',
    [
      require.resolve('@easyops-cn/docusaurus-search-local'),
      /** @type {import('@easyops-cn/docusaurus-search-local').PluginOptions} */
      ({
        hashed: true,
        language: ['en', 'zh'],
        indexBlog: false,
        docsRouteBasePath: '/docs',
        highlightSearchTermsOnTargetPage: true,
        explicitSearchResultPath: true,
      }),
    ],
  ],

  plugins: [
    [
      'docusaurus-plugin-llms',
      {
        generateLLMsTxt: true,
        generateLLMsFullTxt: true,
        title: 'Dynamic API Manager 文件',
        description:
          'Dynamic API Manager 是在執行期從上傳的 JAR 動態發布 SOAP Web Service 與 RESTful Controller，' +
          '並依 publishUri / method / condition 從資料庫回傳 Mock 回應的系統。' +
          '文件包含使用者指南、JAR 開發指南、需求規格書 (SRS) 與設計規格書 (SDD)。',
        // 依側邊欄順序輸出（規則需含斜線，否則會以檔名比對到所有 intro.md）
        includeOrder: [
          'docs/intro.md',
          ...['overview', 'installation', 'quick-start', 'endpoint', 'restful', 'mock-response', 'wsdl-tool', 'configuration', 'troubleshooting']
            .map((p) => `docs/guide/${p}.md`),
          ...['overview', 'base-jar', 'restful-jar', 'endpoint-jar', 'condition-design', 'build-deploy']
            .map((p) => `docs/jar-dev/${p}.md`),
          ...['intro', 'glossary', 'overview', 'use-cases', 'functional/jar', 'functional/endpoint', 'functional/restful',
            'functional/mock-response', 'functional/tools', 'non-functional', 'interfaces', 'data-rules', 'acceptance']
            .map((p) => `docs/srs/${p}.md`),
          ...['intro', 'architecture', 'modules', 'dynamic-loading', 'mock-engine', 'frontend', 'data',
            'api/conventions', 'api/endpoint', 'api/restful', 'api/common', 'workflows', 'security-errors', 'deployment', 'decisions']
            .map((p) => `docs/sdd/${p}.md`),
        ],
      },
    ],
  ],

  presets: [
    [
      'classic',
      /** @type {import('@docusaurus/preset-classic').Options} */
      ({
        docs: {
          sidebarPath: require.resolve('./sidebars.js'),
          editUrl: `${GITHUB_URL}/tree/master/docs-site/`,
          showLastUpdateTime: false,
        },
        blog: false,
        theme: {
          customCss: require.resolve('./src/css/custom.css'),
        },
      }),
    ],
  ],

  themeConfig:
    /** @type {import('@docusaurus/preset-classic').ThemeConfig} */
    ({
      navbar: {
        title: 'Dynamic API Manager',
        logo: {
          alt: 'Dynamic API Manager',
          src: 'img/logo.svg',
        },
        items: [
          {type: 'docSidebar', sidebarId: 'guideSidebar', position: 'left', label: '使用者指南'},
          {type: 'docSidebar', sidebarId: 'jarDevSidebar', position: 'left', label: 'JAR 開發指南'},
          {type: 'docSidebar', sidebarId: 'srsSidebar', position: 'left', label: '需求規格書 (SRS)'},
          {type: 'docSidebar', sidebarId: 'sddSidebar', position: 'left', label: '設計規格書 (SDD)'},
          {href: GITHUB_URL, label: 'GitHub', position: 'right'},
        ],
      },
      footer: {
        style: 'dark',
        links: [
          {
            title: '開始使用',
            items: [
              {label: '文件總覽', to: '/docs/intro'},
              {label: '安裝與啟動', to: '/docs/guide/installation'},
              {label: '快速上手', to: '/docs/guide/quick-start'},
            ],
          },
          {
            title: '開發',
            items: [
              {label: 'JAR 開發總覽', to: '/docs/jar-dev/overview'},
              {label: '管理 API 參考', to: '/docs/sdd/api/conventions'},
            ],
          },
          {
            title: '規格',
            items: [
              {label: '需求規格書 (SRS)', to: '/docs/srs/intro'},
              {label: '設計規格書 (SDD)', to: '/docs/sdd/intro'},
            ],
          },
          {
            title: '更多',
            items: [{label: 'GitHub', href: GITHUB_URL}],
          },
        ],
        copyright: `Copyright © ${new Date().getFullYear()} Dynamic API Manager. Built with Docusaurus.`,
      },
      prism: {
        theme: prismThemes.github,
        darkTheme: prismThemes.dracula,
        additionalLanguages: ['java', 'json', 'yaml', 'bash', 'sql', 'properties', 'groovy', 'kotlin', 'powershell'],
      },
      mermaid: {
        theme: {light: 'neutral', dark: 'dark'},
      },
    }),
};

module.exports = config;
