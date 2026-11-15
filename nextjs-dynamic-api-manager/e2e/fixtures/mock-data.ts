import type { Endpoint, Restful } from '../../src/types/models';
import type { Response } from '../../src/types/response';

// E2E 固定假資料；格式對應後端管理 API 的 data 欄位

export const endpoints: Endpoint[] = [
  {
    id: 'ep-1',
    publishUri: 'e2e-order-endpoint',
    beanName: 'orderEndpoint',
    classPath: 'com.example.OrderEndpoint',
    jarFileId: 'jar-ep-1',
    jarFileName: 'order.jar',
    file: null,
    isActive: true,
    ignoreCdata: false,
  },
];

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
];

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
