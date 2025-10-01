import { NextRequest, NextResponse } from 'next/server';
import { appConfig } from '@/config/config';

const BACKEND_URL = appConfig.backendUrl;

export async function GET(request: NextRequest) {
  return handleRequest(request, 'GET');
}

export async function POST(request: NextRequest) {
  return handleRequest(request, 'POST');
}

export async function PUT(request: NextRequest) {
  return handleRequest(request, 'PUT');
}

export async function DELETE(request: NextRequest) {
  return handleRequest(request, 'DELETE');
}

async function handleRequest(request: NextRequest, method: string) {
  try {
    // 從 URL 中提取路徑
    const url = new URL(request.url);
    const pathParts = url.pathname.replace('/api/', ''); // 移除 /api/ 前綴
    const targetUrl = `${BACKEND_URL}/${pathParts}${url.search}`;

    console.log(`Proxying ${method} request to: ${targetUrl}`);

    // 準備請求選項
    const requestOptions: RequestInit = {
      method,
      headers: {
        'Content-Type': request.headers.get('content-type') || 'application/json',
        'Accept': 'application/json',
      },
    };

    // 對於 POST, PUT, DELETE 請求，添加 body
    if (method !== 'GET') {
      const contentType = request.headers.get('content-type');
      
      if (contentType?.includes('application/json')) {
        const body = await request.text();
        requestOptions.body = body;
      } else if (contentType?.includes('multipart/form-data')) {
        // 對於 multipart，我們需要轉發原始的 FormData
        const formData = await request.formData();
        requestOptions.body = formData;
        // 不設置 Content-Type，讓 fetch 自動處理 multipart 邊界
        delete (requestOptions.headers as Record<string, unknown>)['Content-Type'];
      } else if (method === 'DELETE') {
        // 對於 DELETE 請求，嘗試讀取 body
        try {
          const body = await request.text();
          if (body) {
            requestOptions.body = body;
          }
        } catch (error) {
          console.log('No body for DELETE request');
        }
      }
    }

    // 發送請求到後端
    const response = await fetch(targetUrl, requestOptions);
    
    // 獲取回應內容
    const responseText = await response.text();
    
    // 返回回應
    return new NextResponse(responseText, {
      status: response.status,
      statusText: response.statusText,
      headers: {
        'Content-Type': response.headers.get('content-type') || 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });

  } catch (error) {
    console.error('Proxy error:', error);
    return new NextResponse(
      JSON.stringify({ error: 'Proxy request failed' }), 
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

// 處理 OPTIONS 請求（CORS 預檢）
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}