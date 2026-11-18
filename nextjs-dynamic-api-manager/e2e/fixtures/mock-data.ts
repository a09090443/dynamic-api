import type { Endpoint, Restful } from '../../src/types/models';
import type { Response } from '../../src/types/response';

// E2E 固定假資料；格式對應後端管理 API 的 data 欄位。
// 刻意不用設計稿的示意數字（12／7／2、12／8），用來確認畫面數字來自 API。

const endpoint = (p: Partial<Endpoint> & { id: string; publishUri: string }): Endpoint => ({
  beanName: `${p.publishUri}Bean`,
  classPath: `com.example.${p.publishUri}.Endpoint`,
  jarFileId: '',
  jarFileName: '',
  file: null,
  isActive: false,
  ignoreCdata: false,
  ...p,
});

export const endpoints: Endpoint[] = [
  endpoint({
    id: 'ep-1',
    publishUri: 'e2e-order-endpoint',
    beanName: 'orderEndpoint',
    classPath: 'com.example.OrderEndpoint',
    jarFileId: 'jar-ep-1',
    jarFileName: 'order.jar',
    isActive: true,
  }),
  endpoint({
    id: 'ep-2',
    publishUri: 'company',
    beanName: 'companyEndpoint',
    classPath: 'com.example.CompanyEndpoint',
    jarFileId: 'jar-ep-2',
    jarFileName: 'company.jar',
    isActive: false,
  }),
  endpoint({
    id: 'ep-3',
    publishUri: 'order',
    beanName: 'legacyOrder',
    classPath: 'com.example.LegacyOrder',
    isActive: true,
  }),
];

/** SC-ENDPOINT-01 用：13 筆，含啟用／停用、有／無 JAR，三個搜尋欄位各有獨立關鍵字 */
export const manyEndpoints: Endpoint[] = Array.from({ length: 13 }, (_, i) => {
  const n = i + 1;
  return endpoint({
    id: `many-${n}`,
    publishUri: n === 1 ? 'alpha-uri-only' : `svc-${String(n).padStart(2, '0')}`,
    beanName: n === 2 ? 'betaBeanOnly' : `bean${n}`,
    classPath: n === 3 ? 'com.gamma.ClassOnly' : `com.example.Svc${n}`,
    jarFileId: n % 4 === 0 ? '' : `jar-${n}`,
    jarFileName: n % 4 === 0 ? '' : `svc-${n}.jar`,
    isActive: n % 3 === 0,
  });
});

export const restfuls: Restful[] = [
  {
    id: 'rf-1',
    publishUri: 'e2e-inventory-restful',
    classPath: 'com.example.InventoryController',
    jarFileId: 'jar-rf-1',
    jarFileName: 'inventory.jar',
    file: null,
    isActive: false,
  },
  {
    id: 'rf-2',
    publishUri: 'orders',
    classPath: 'com.example.OrdersController',
    jarFileId: '',
    jarFileName: '',
    file: null,
    isActive: true,
  },
];

export const LONG_CONTENT = `<order><id>1</id><items>${'<item>widget</item>'.repeat(30)}</items></order>`;

export const responses: Response[] = [
  {
    id: 'resp-1',
    publishUri: 'e2e-order-endpoint',
    method: 'getOrder',
    condition: 'orderId=1',
    responseContent: '<order>1</order>',
    isActive: true,
    serviceType: 'ENDPOINT',
  },
  {
    id: '101',
    publishUri: 'company',
    method: 'getCompany',
    condition: '',
    responseContent: LONG_CONTENT,
    isActive: false,
    serviceType: 'ENDPOINT',
  },
  {
    id: '102',
    publishUri: 'company',
    method: 'listCompany',
    condition: '{"taxId":"123"}',
    responseContent: '{"ok":true}',
    isActive: true,
    serviceType: 'ENDPOINT',
  },
  {
    id: 'rest-1',
    publishUri: 'orders',
    method: 'GET /orders',
    condition: '',
    responseContent: '[]',
    isActive: true,
    serviceType: 'RESTFUL',
  },
];

export const savedRestful: Restful = {
  id: 'rf-new',
  publishUri: 'e2e-new-restful',
  classPath: 'com.example.E2eController',
  jarFileId: '',
  jarFileName: '',
  file: null,
  isActive: false,
};
