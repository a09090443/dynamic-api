import React from 'react';
import clsx from 'clsx';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';
import styles from './index.module.css';

function HomepageHeader() {
  const {siteConfig} = useDocusaurusContext();
  return (
    <header className={clsx('hero hero--primary', styles.heroBanner)}>
      <div className="container">
        <h1 className="hero__title">{siteConfig.title}</h1>
        <p className="hero__subtitle">{siteConfig.tagline}</p>
        <div className={styles.buttons}>
          <Link className="button button--secondary button--lg" to="/docs/guide/quick-start">
            10 分鐘快速上手
          </Link>
          <Link className="button button--outline button--secondary button--lg" to="/docs/intro">
            文件總覽
          </Link>
        </div>
      </div>
    </header>
  );
}

const SECTIONS = [
  {
    title: '使用者指南',
    to: '/docs/guide/overview',
    description: '安裝啟動、建立 Endpoint 與 RESTful、維護 Mock 回應、疑難排解與已知問題。',
  },
  {
    title: 'JAR 開發指南',
    to: '/docs/jar-dev/overview',
    description: '撰寫可被動態載入的 SOAP / REST 類別：基底類別、Condition 設計、打包與上線。',
  },
  {
    title: '需求規格書 (SRS)',
    to: '/docs/srs/intro',
    description: '系統目標、使用情境、功能與非功能需求、業務規則與驗收範圍。',
  },
  {
    title: '設計規格書 (SDD)',
    to: '/docs/sdd/intro',
    description: '架構、動態載入機制、資料設計、管理 API 規格、部署與技術債。',
  },
];

const FEATURES = [
  {
    title: '不重啟即可上線',
    description: '上傳 JAR、打開開關，SOAP 服務由 Apache CXF 發布，REST Controller 直接註冊進 Spring MVC。',
  },
  {
    title: '回應存在資料庫',
    description: '依 publishUri、method、condition 查詢回應內容，測試人員可自行新增、切換情境。',
  },
  {
    title: '單一 JAR 部署',
    description: 'Next.js 管理介面靜態匯出後打包進 Spring Boot，內嵌 SQLite，一個指令即可啟動。',
  },
];

function Sections() {
  return (
    <section className={styles.features}>
      <div className="container">
        <div className="row">
          {SECTIONS.map((s) => (
            <div key={s.title} className={clsx('col col--3', styles.card)}>
              <Link to={s.to} className={styles.cardLink}>
                <h3>{s.title}</h3>
                <p>{s.description}</p>
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Features() {
  return (
    <section className={styles.features}>
      <div className="container">
        <div className="row">
          {FEATURES.map((f) => (
            <div key={f.title} className="col col--4">
              <div className="text--center padding-horiz--md">
                <h3>{f.title}</h3>
                <p>{f.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default function Home() {
  const {siteConfig} = useDocusaurusContext();
  return (
    <Layout
      title={`${siteConfig.title} 文件`}
      description="Dynamic API Manager：執行期動態載入 SOAP / RESTful 服務並管理 Mock 回應的系統文件">
      <HomepageHeader />
      <main>
        <Features />
        <Sections />
      </main>
    </Layout>
  );
}
