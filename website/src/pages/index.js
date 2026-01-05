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
          <Link
            className="button button--secondary button--lg"
            to="/docs/srs/intro">
            查看需求規格書 (SRS)
          </Link>
          <Link
            className="button button--secondary button--lg"
            to="/docs/sdd/intro"
            style={{marginLeft: '10px'}}>
            查看設計規格書 (SDD)
          </Link>
        </div>
      </div>
    </header>
  );
}

function HomepageFeatures() {
  const features = [
    {
      title: '動態熱部署',
      description: (
        <>
          在運行時動態載入 JAR 檔案，實現 Web Service 與 RESTful API 的熱部署，
          無需重啟應用程式，大幅提升部署效率。
        </>
      ),
    },
    {
      title: 'Mock 回應管理',
      description: (
        <>
          集中管理多個 API 服務的 Mock 回應規則，支援多條件匹配，
          快速切換不同測試情境，簡化測試流程。
        </>
      ),
    },
    {
      title: '視覺化管理介面',
      description: (
        <>
          提供直觀的 Web 管理介面，支援 Endpoint、Restful、Response 的
          新增、編輯、啟用/停用操作，降低使用門檻。
        </>
      ),
    },
  ];

  return (
    <section className={styles.features}>
      <div className="container">
        <div className="row">
          {features.map((feature, idx) => (
            <div key={idx} className={clsx('col col--4')}>
              <div className="text--center padding-horiz--md">
                <h3>{feature.title}</h3>
                <p>{feature.description}</p>
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
      description="Dynamic API Manager - 動態 API 管理系統文件">
      <HomepageHeader />
      <main>
        <HomepageFeatures />
      </main>
    </Layout>
  );
}
