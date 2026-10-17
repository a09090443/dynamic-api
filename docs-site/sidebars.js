// @ts-check

/** @type {import('@docusaurus/plugin-content-docs').SidebarsConfig} */
const sidebars = {
  guideSidebar: [
    'intro',
    {
      type: 'category',
      label: '開始使用',
      collapsed: false,
      items: ['guide/overview', 'guide/installation', 'guide/quick-start'],
    },
    {
      type: 'category',
      label: '操作指南',
      collapsed: false,
      items: ['guide/endpoint', 'guide/restful', 'guide/mock-response', 'guide/wsdl-tool'],
    },
    {
      type: 'category',
      label: '參考',
      collapsed: false,
      items: ['guide/configuration', 'guide/troubleshooting'],
    },
  ],

  jarDevSidebar: [
    'jar-dev/overview',
    'jar-dev/base-jar',
    'jar-dev/restful-jar',
    'jar-dev/endpoint-jar',
    'jar-dev/condition-design',
    'jar-dev/build-deploy',
  ],

  srsSidebar: [
    'srs/intro',
    'srs/glossary',
    'srs/overview',
    'srs/use-cases',
    {
      type: 'category',
      label: '3. 功能性需求',
      collapsed: false,
      items: [
        'srs/functional/jar',
        'srs/functional/endpoint',
        'srs/functional/restful',
        'srs/functional/mock-response',
        'srs/functional/tools',
      ],
    },
    'srs/non-functional',
    'srs/interfaces',
    'srs/data-rules',
    'srs/acceptance',
  ],

  sddSidebar: [
    'sdd/intro',
    'sdd/architecture',
    {
      type: 'category',
      label: '3. 模組與元件設計',
      collapsed: false,
      items: ['sdd/modules', 'sdd/dynamic-loading', 'sdd/mock-engine', 'sdd/frontend'],
    },
    'sdd/data',
    {
      type: 'category',
      label: '5. 介面與 API 設計',
      collapsed: false,
      items: ['sdd/api/conventions', 'sdd/api/endpoint', 'sdd/api/restful', 'sdd/api/common'],
    },
    'sdd/workflows',
    'sdd/security-errors',
    'sdd/deployment',
    'sdd/decisions',
  ],
};

module.exports = sidebars;
