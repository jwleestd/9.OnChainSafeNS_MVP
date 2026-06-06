import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyToken } from './src/lib/auth';

/**
 * Middleware: Phase-0 보호된 라우트 및 API 접근 제어
 * - `/api/v1/admin/*`: admin_session 검증 (실패 시 401 JSON)
 * - `/(admin)/*`: admin_session 검증 (실패 시 /auth/admin-login 리다이렉트)
 * 
 * *유저 API(인증 필요)의 경우, Route Handler 내부에서 `getUserSession()`을 호출하여 처리함 (MW에서는 Admin만 처리)*
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Admin API 검증
  if (pathname.startsWith('/api/v1/admin')) {
    const token = request.cookies.get('admin_session')?.value;
    if (!token) {
      return NextResponse.json({ success: false, error: { code: 'UNAUTHORIZED', message: '관리자 인증이 필요합니다' } }, { status: 401 });
    }

    const session = await verifyToken(token);
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ success: false, error: { code: 'UNAUTHORIZED', message: '관리자 권한이 유효하지 않습니다' } }, { status: 401 });
    }
  }

  // 2. Admin UI 검증 (향후 FE 구현 시 적용)
  if (pathname.startsWith('/admin') || pathname.startsWith('/(admin)')) {
    const token = request.cookies.get('admin_session')?.value;
    let isValidAdmin = false;

    if (token) {
      const session = await verifyToken(token);
      if (session && session.role === 'admin') {
        isValidAdmin = true;
      }
    }

    if (!isValidAdmin) {
      return NextResponse.redirect(new URL('/auth/admin-login', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/api/v1/admin/:path*',
    '/admin/:path*',
    '/(admin)/:path*'
  ]
};
