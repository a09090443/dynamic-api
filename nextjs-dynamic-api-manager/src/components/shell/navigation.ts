// 側欄項目與麵包屑規則的唯一定義處

export type NavCountKey = 'endpoints' | 'controllers';
export type NavIconKey = 'endpoint' | 'restful' | 'response' | 'wsdl' | 'about';

export interface NavItem {
  label: string;
  href: string;
  icon: NavIconKey;
  count?: NavCountKey;
}

export interface NavGroup {
  label: string;
  items: NavItem[];
}

/** /test-api 保留網址，但不放進側欄 */
export const navGroups: NavGroup[] = [
  {
    label: '服務',
    items: [
      { label: 'SOAP Endpoint', href: '/endpoint', icon: 'endpoint', count: 'endpoints' },
      { label: 'RESTful API', href: '/restful', icon: 'restful', count: 'controllers' },
      { label: 'Mock 回應', href: '/response', icon: 'response' },
    ],
  },
  {
    label: '工具',
    items: [
      { label: 'WSDL 轉換', href: '/wsdl', icon: 'wsdl' },
      { label: '系統資訊', href: '/about', icon: 'about' },
    ],
  },
];

export interface Crumb {
  label: string;
  href?: string;
}

/** 去掉 basePath 與結尾斜線，例如 /dynamic-api/endpoint/ → /endpoint */
export function normalizePath(pathname: string): string {
  let p = pathname.replace(/^\/dynamic-api(?=\/|$)/, '');
  if (p.length > 1 && p.endsWith('/')) p = p.slice(0, -1);
  return p || '/';
}

export function breadcrumbsFor(pathname: string, params: URLSearchParams): Crumb[] {
  const path = normalizePath(pathname);
  switch (path) {
    case '/endpoint':
      return [{ label: '服務' }, { label: 'SOAP Endpoint' }];
    case '/restful':
      return [{ label: '服務' }, { label: 'RESTful API' }];
    case '/response': {
      const publishUri = params.get('publishUri');
      if (!publishUri) return [{ label: '服務' }, { label: 'Mock 回應' }];
      const isRest = params.get('serviceType') === 'RESTFUL';
      return [
        isRest ? { label: 'RESTful API', href: '/restful' } : { label: 'SOAP Endpoint', href: '/endpoint' },
        { label: publishUri },
        { label: 'Mock 回應' },
      ];
    }
    case '/wsdl':
      return [{ label: '工具' }, { label: 'WSDL 轉換' }];
    case '/about':
      return [{ label: '工具' }, { label: '系統資訊' }];
    case '/test-api':
      return [{ label: '工具' }, { label: 'API 測試' }];
    default:
      return [{ label: 'Dynamic API' }];
  }
}
