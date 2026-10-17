// @ts-check

const {themes: prismThemes} = require('prism-react-renderer');

const fs = require('node:fs');
const path = require('node:path');

const GITHUB_URL = 'https://github.com/a09090443/dynamic-api';

// 部署網址：預設為 GitHub Pages 專案頁，部署到其他位置時以環境變數覆寫
// （llms.txt、sitemap、robots.txt 都會使用此網址）
const SITE_URL = process.env.DOCS_SITE_URL || 'https://a09090443.github.io';
const BASE_URL = process.env.DOCS_BASE_URL || '/dynamic-api/';

// llms.txt 的分區，同時產生各區塊的 llms-{id}.txt / llms-{id}-full.txt
const LLM_SECTIONS = [
  {
    id: 'guide',
    title: '使用者指南',
    description: '安裝、操作管理介面、設定 Mock 回應、設定參考與疑難排解。給操作者與測試人員。',
    pages: ['overview', 'installation', 'quick-start', 'endpoint', 'restful', 'mock-response', 'wsdl-tool', 'configuration', 'troubleshooting'],
  },
  {
    id: 'jar-dev',
    title: 'JAR 開發指南',
    description: '撰寫可被動態載入的 RESTful / SOAP JAR、Mock 查詢 API 與 condition 設計。給 Java 開發人員。',
    pages: ['overview', 'base-jar', 'restful-jar', 'endpoint-jar', 'condition-design', 'build-deploy'],
  },
  {
    id: 'srs',
    title: '需求規格書（SRS）',
    description: '功能需求（FR-*）、非功能需求、使用情境（UC-*）、業務規則與已知問題（KI-*）。',
    pages: ['intro', 'glossary', 'overview', 'use-cases', 'functional/jar', 'functional/endpoint', 'functional/restful',
      'functional/mock-response', 'functional/tools', 'non-functional', 'interfaces', 'data-rules', 'acceptance'],
  },
  {
    id: 'sdd',
    title: '設計規格書（SDD）',
    description: '架構、動態載入、Mock 機制、資料表、管理 API 規格、流程、部署與技術債（TD-*）。',
    pages: ['intro', 'architecture', 'modules', 'dynamic-loading', 'mock-engine', 'frontend', 'data',
      'api/conventions', 'api/endpoint', 'api/restful', 'api/common', 'workflows', 'security-errors', 'deployment', 'decisions'],
  },
].map((s) => ({...s, files: s.pages.map((p) => `docs/${s.id}/${p}.md`)}));

const DOCS_ROOT = `${SITE_URL}${BASE_URL}`;

const LLMS_ROOT_CONTENT = [
  '本文件依 `new-frontend` 分支的程式碼撰寫；標示「已知問題」(KI-*) 或「技術債」(TD-*) 的項目代表程式行為與預期不一致。',
  '每個連結都是該頁的 Markdown 原文。依需求選讀：',
  '',
  `- 全部內容：[llms-full.txt](${DOCS_ROOT}llms-full.txt)`,
  ...LLM_SECTIONS.map((s) =>
    `- ${s.title}：${s.description} 連結清單 [llms-${s.id}.txt](${DOCS_ROOT}llms-${s.id}.txt)，全文 [llms-${s.id}-full.txt](${DOCS_ROOT}llms-${s.id}-full.txt)`),
].join('\n');

/** 依 url / baseUrl 產生 robots.txt，避免與部署網址不一致 */
function robotsTxtPlugin(context) {
  return {
    name: 'robots-txt',
    async postBuild({outDir}) {
      const root = `${context.siteConfig.url}${context.siteConfig.baseUrl}`;
      const content = [
        'User-agent: *',
        'Allow: /',
        '',
        '# Explicitly allow major AI agents',
        ...['GPTBot', 'ChatGPT-User', 'ClaudeBot', 'Claude-User', 'PerplexityBot', 'Google-Extended']
          .flatMap((ua) => [`User-agent: ${ua}`, 'Allow: /']),
        '',
        `Sitemap: ${root}sitemap.xml`,
        '',
        '# LLM-friendly content (https://llmstxt.org)',
        `# ${root}llms.txt`,
        `# ${root}llms-full.txt`,
        '',
      ].join('\n');
      fs.writeFileSync(path.join(outDir, 'robots.txt'), content);
    },
  };
}

/** @type {import('@docusaurus/types').Config} */
const config = {
  title: 'Dynamic API Manager',
  tagline: '執行期動態載入 SOAP / RESTful 服務，並以資料庫管理 Mock 回應',
  favicon: 'img/logo.svg',

  url: SITE_URL,
  baseUrl: BASE_URL,

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
    robotsTxtPlugin,
    [
      'docusaurus-plugin-llms',
      {
        generateLLMsTxt: true,
        generateLLMsFullTxt: true,
        // 每頁另外輸出 .md，llms.txt 連結指向 Markdown 原文
        generateMarkdownFiles: true,
        keepFrontMatter: ['title', 'description'],
        excludeImports: true,
        removeDuplicateHeadings: true,
        rootContent: LLMS_ROOT_CONTENT,
        fullRootContent: LLMS_ROOT_CONTENT,
        customLLMFiles: LLM_SECTIONS.flatMap((s) => [false, true].map((full) => ({
          filename: `llms-${s.id}${full ? '-full' : ''}.txt`,
          title: `Dynamic API Manager ${s.title}`,
          description: s.description,
          includePatterns: s.files,
          orderPatterns: s.files,
          fullContent: full,
        }))),
        title: 'Dynamic API Manager 文件',
        description:
          'Dynamic API Manager 是在執行期從上傳的 JAR 動態發布 SOAP Web Service 與 RESTful Controller，' +
          '並依 publishUri / method / condition 從資料庫回傳 Mock 回應的系統。' +
          '文件包含使用者指南、JAR 開發指南、需求規格書 (SRS) 與設計規格書 (SDD)。',
        // 依側邊欄順序輸出（規則需含斜線，否則會以檔名比對到所有 intro.md）
        includeOrder: ['docs/intro.md', ...LLM_SECTIONS.flatMap((s) => s.files)],
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
