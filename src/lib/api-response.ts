// ============================================
// API-001: 통합 에러 응답 유틸리티
// SRS §6.1.1 — 응답 포맷 표준
// ============================================
import { NextResponse } from 'next/server';
import { randomUUID } from 'crypto';

interface SuccessResponseBody<T> {
  success: true;
  data: T;
  meta: {
    timestamp: string;
    request_id: string;
  };
}

interface ErrorResponseBody {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown[];
  };
  meta: {
    timestamp: string;
    request_id: string;
  };
}

/**
 * 성공 응답 생성
 */
export function successResponse<T>(data: T, status = 200): NextResponse<SuccessResponseBody<T>> {
  return NextResponse.json(
    {
      success: true as const,
      data,
      meta: {
        timestamp: new Date().toISOString(),
        request_id: `req_${randomUUID().slice(0, 12)}`,
      },
    },
    { status }
  );
}

/**
 * 에러 응답 생성
 */
export function errorResponse(
  code: string,
  message: string,
  status: number,
  details?: unknown[]
): NextResponse<ErrorResponseBody> {
  return NextResponse.json(
    {
      success: false as const,
      error: {
        code,
        message,
        ...(details && { details }),
      },
      meta: {
        timestamp: new Date().toISOString(),
        request_id: `req_${randomUUID().slice(0, 12)}`,
      },
    },
    { status }
  );
}

import { NextRequest } from 'next/server';

/**
 * Route Handler 래퍼 — try/catch + 500 폴백
 */
export function withErrorHandler(
  handler: (req: NextRequest) => Promise<NextResponse>
): (req: NextRequest) => Promise<NextResponse> {
  return async (req: NextRequest) => {
    try {
      return await handler(req);
    } catch (error) {
      console.error('[API Error]', error);
      return errorResponse('INTERNAL_ERROR', '서버 내부 오류가 발생했습니다', 500);
    }
  };
}
