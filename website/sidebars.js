/**
 * Creating a sidebar enables you to:
 * - create an ordered group of docs
 * - render a sidebar for each doc of that group
 * - provide next/previous navigation
 *
 * The sidebars can be generated from the filesystem, or explicitly defined here.
 *
 * Create as many sidebars as you want.
 */

// @ts-check

/** @type {import('@docusaurus/plugin-content-docs').SidebarsConfig} */
const sidebars = {
  // SRS 側邊欄
  srsSidebar: [
    {
      type: 'doc',
      id: 'srs/intro',
      label: '📋 文件資訊',
    },
    {
      type: 'category',
      label: '1️⃣ 簡介',
      items: [
        'srs/introduction/purpose',
        'srs/introduction/scope',
        'srs/introduction/audience',
        'srs/introduction/glossary',
        'srs/introduction/references',
      ],
    },
    {
      type: 'category',
      label: '2️⃣ 系統概述',
      items: [
        'srs/overview/goals',
        'srs/overview/stakeholders',
        'srs/overview/use-cases',
        'srs/overview/architecture',
      ],
    },
    {
      type: 'category',
      label: '3️⃣ 功能性需求 ⭐',
      items: [
        'srs/functional-requirements/jar-management',
        'srs/functional-requirements/endpoint-management',
        'srs/functional-requirements/restful-management',
        'srs/functional-requirements/mock-response',
        'srs/functional-requirements/auxiliary-tools',
      ],
    },
    {
      type: 'category',
      label: '4️⃣ 非功能性需求 ⭐',
      items: [
        'srs/non-functional/performance',
        'srs/non-functional/availability',
        'srs/non-functional/security',
        'srs/non-functional/maintainability',
        'srs/non-functional/usability',
        'srs/non-functional/compliance',
      ],
    },
  ],

  // SDD 側邊欄
  sddSidebar: [
    {
      type: 'doc',
      id: 'sdd/intro',
      label: '📋 文件資訊',
    },
    {
      type: 'category',
      label: '2️⃣ 系統總體設計',
      items: [
        'sdd/architecture/overview',
      ],
    },
    {
      type: 'category',
      label: '3️⃣ 模組與元件設計 ⭐',
      items: [
        'sdd/modules/overview',
        'sdd/modules/jar-module',
        'sdd/modules/endpoint-module',
        'sdd/modules/restful-module',
      ],
    },
    {
      type: 'category',
      label: '4️⃣ 資料設計 ⭐',
      items: [
        'sdd/database/erd',
        'sdd/database/schema',
        'sdd/database/consistency',
      ],
    },
    {
      type: 'category',
      label: '5️⃣ 介面與 API 設計 ⭐',
      items: [
        'sdd/api/overview',
        'sdd/api/endpoint-api',
        'sdd/api/restful-api',
        'sdd/api/common-api',
        'sdd/api/error-handling',
      ],
    },
    {
      type: 'category',
      label: '6️⃣ 業務流程與演算法 ⭐',
      items: [
        'sdd/workflows/overview',
        'sdd/workflows/endpoint-loading',
      ],
    },
    {
      type: 'category',
      label: '8️⃣ 部署、設定與運維 ⭐',
      items: [
        'sdd/deployment/overview',
      ],
    },
  ],
};

module.exports = sidebars;
