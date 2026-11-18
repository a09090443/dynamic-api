'use client';

import { useEffect, useState } from 'react';
import { responseService } from '@/services/response.service';

export type MockCount = { state: 'loading' } | { state: 'ok'; count: number } | { state: 'error' };

const CONCURRENCY = 4;

/**
 * 後端沒有彙總端點，逐服務呼叫 getResponseList 取得 Mock 回應筆數（同時最多 4 筆）。
 * 每列各自成功或失敗；清單重新載入或卸載時丟棄過期結果。
 */
export function useMockCounts(publishUris: string[] | null, serviceType: 'ENDPOINT' | 'RESTFUL') {
  const [counts, setCounts] = useState<Record<string, MockCount>>({});
  const key = publishUris ? publishUris.join('\u0000') : null;

  useEffect(() => {
    let cancelled = false;
    if (!publishUris) {
      setCounts({});
      return;
    }
    const initial: Record<string, MockCount> = {};
    publishUris.forEach((u) => (initial[u] = { state: 'loading' }));
    setCounts(initial);

    const queue = [...publishUris];
    const worker = async () => {
      while (queue.length > 0) {
        const uri = queue.shift() as string;
        let result: MockCount;
        try {
          const list = await responseService.getResponseList({ publishUri: uri, serviceType });
          result = { state: 'ok', count: list.length };
        } catch {
          result = { state: 'error' };
        }
        if (cancelled) return;
        setCounts((prev) => ({ ...prev, [uri]: result }));
      }
    };
    for (let i = 0; i < Math.min(CONCURRENCY, publishUris.length); i++) {
      void worker();
    }
    return () => {
      cancelled = true;
    };
    // key 代表 publishUris 的內容；避免陣列參考改變就重查
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, serviceType]);

  return counts;
}
