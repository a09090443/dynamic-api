'use client';

import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { endpointService } from '@/services/endpoint.service';
import { restfulService } from '@/services/restful.service';
import { Endpoint, Restful } from '@/types/models';

export type ConnectionStatus = 'checking' | 'ok' | 'error';

interface ServiceSummary {
  endpoints: Endpoint[] | null;
  controllers: Restful[] | null;
  connection: ConnectionStatus;
  refresh: () => void;
}

const ServiceSummaryContext = createContext<ServiceSummary>({
  endpoints: null,
  controllers: null,
  connection: 'checking',
  refresh: () => undefined,
});

/**
 * 側欄筆數與頂列連線狀態的資料來源。
 * 掛載、路由切換與 refresh() 時並行呼叫 getEndpoints、getControllers；兩者都成功才算連線正常。
 * 後端沒有健康檢查端點，因此以清單 API 的實際結果判斷。
 */
export function ServiceSummaryProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [endpoints, setEndpoints] = useState<Endpoint[] | null>(null);
  const [controllers, setControllers] = useState<Restful[] | null>(null);
  const [connection, setConnection] = useState<ConnectionStatus>('checking');
  const generation = useRef(0);

  const refresh = useCallback(() => {
    const gen = ++generation.current;
    setConnection('checking');
    Promise.allSettled([endpointService.getEndpoints(), restfulService.getControllers()]).then(([ep, rf]) => {
      if (gen !== generation.current) return;
      setEndpoints(ep.status === 'fulfilled' ? ep.value : null);
      setControllers(rf.status === 'fulfilled' ? rf.value : null);
      setConnection(ep.status === 'fulfilled' && rf.status === 'fulfilled' ? 'ok' : 'error');
    });
  }, []);

  useEffect(() => {
    refresh();
  }, [pathname, refresh]);

  return (
    <ServiceSummaryContext.Provider value={{ endpoints, controllers, connection, refresh }}>
      {children}
    </ServiceSummaryContext.Provider>
  );
}

export function useServiceSummary(): ServiceSummary {
  return useContext(ServiceSummaryContext);
}
