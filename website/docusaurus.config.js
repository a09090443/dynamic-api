// @ts-check
// Note: type annotations allow type checking and IDEs autocompletion

const lightCodeTheme = require('prism-react-renderer').themes.github;
const darkCodeTheme = require('prism-react-renderer').themes.dracula;

/** @type {import('@docusaurus/types').Config} */
const config = {
  title: 'Dynamic API Manager',
  tagline: '動態 API 管理系統 - 運行時熱部署與 Mock 回應管理',
  favicon: 'img/favicon.ico',

  // Set the production url of your site here
  url: 'https://your-docusaurus-site.example.com',
  // Set the /<baseUrl>/ pathname under which your site is served
  // For GitHub pages deployment, it is often '/<projectName>/'
  baseUrl: '/',

  // GitHub pages deployment config.
  // If you aren't using GitHub pages, you don't need these.
  organizationName: 'your-org', // Usually your GitHub org/user name.
  projectName: 'dynamic-api', // Usually your repo name.

  onBrokenLinks: 'throw',
  onBrokenMarkdownLinks: 'warn',

  // Even if you don't use internalization, you can use this field to set useful
  // metadata like html lang. For example, if your site is Chinese, you may want
  // to replace "en" with "zh-Hans".
  i18n: {
    defaultLocale: 'zh-Hant',
    locales: ['zh-Hant'],
  },

  presets: [
    [
      'classic',
      /** @type {import('@docusaurus/preset-classic').Options} */
      ({
        docs: {
          sidebarPath: require.resolve('./sidebars.js'),
          // Please change this to your repo.
          // Remove this to remove the "edit this page" links.
          editUrl:
            'https://github.com/your-org/dynamic-api/tree/main/website/',
        },
        blog: false,
        theme: {
          customCss: require.resolve('./src/css/custom.css'),
        },
      }),
    ],
  ],

  themes: ['@docusaurus/theme-mermaid'],

  markdown: {
    mermaid: true,
  },

  themeConfig:
    /** @type {import('@docusaurus/preset-classic').ThemeConfig} */
    ({
      // Replace with your project's social card
      image: 'img/docusaurus-social-card.jpg',
      navbar: {
        title: 'Dynamic API Manager',
        logo: {
          alt: 'Dynamic API Manager Logo',
          src: 'img/logo.svg',
        },
        items: [
          {
            type: 'docSidebar',
            sidebarId: 'srsSidebar',
            position: 'left',
            label: '需求規格書 (SRS)',
          },
          {
            type: 'docSidebar',
            sidebarId: 'sddSidebar',
            position: 'left',
            label: '設計規格書 (SDD)',
          },
          {
            href: 'https://github.com/your-org/dynamic-api',
            label: 'GitHub',
            position: 'right',
          },
        ],
      },
      footer: {
        style: 'dark',
        links: [
          {
            title: '文件',
            items: [
              {
                label: '需求規格書 (SRS)',
                to: '/docs/srs/intro',
              },
              {
                label: '設計規格書 (SDD)',
                to: '/docs/sdd/intro',
              },
            ],
          },
          {
            title: '更多',
            items: [
              {
                label: 'GitHub',
                href: 'https://github.com/your-org/dynamic-api',
              },
            ],
          },
        ],
        copyright: `Copyright © ${new Date().getFullYear()} Dynamic API Manager. Built with Docusaurus.`,
      },
      prism: {
        theme: lightCodeTheme,
        darkTheme: darkCodeTheme,
        additionalLanguages: ['java', 'json', 'yaml', 'bash'],
      },
      mermaid: {
        theme: { light: 'neutral', dark: 'dark' },
        options: {
          maxTextSize: 50000,
        },
      },
    }),
};

module.exports = config;
