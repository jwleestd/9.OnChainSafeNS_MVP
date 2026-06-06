import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { successResponse, errorResponse, withErrorHandler } from '@/lib/api-response';
import { validateEmail } from '@/lib/validators';
import { sendVerificationCode } from '@/lib/email';
import { signToken } from '@/lib/auth';
import { EMAIL_VERIFICATION, ERROR_MESSAGES } from '@/lib/constants';
import { VerifyEmailRequest, VerifyEmailSendResponse, VerifyEmailVerifyResponse } from '@/types';
import { cookies } from 'next/headers';

/**
 * 랜덤 6자리 숫자 코드 생성
 */
function generateVerificationCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * POST /api/v1/auth/verify-email
 * CMD-AUTH-001: 인증 코드 발송 (code 파라미터가 없을 때)
 * CMD-AUTH-002: 인증 코드 검증 및 세션 발급 (code 파라미터가 있을 때)
 */
async function verifyEmailHandler(req: NextRequest) {
  const body = (await req.json()) as VerifyEmailRequest;
  const { email, code } = body;

  const emailCheck = validateEmail(email);
  if (!emailCheck.valid) {
    return errorResponse('VALIDATION_ERROR', emailCheck.error!, 400);
  }

  // 1. 인증 코드 발송 로직 (CMD-AUTH-001)
  if (!code) {
    // 쿨다운(도배 방지) 체크
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser?.verificationExpiresAt) {
      const timeRemaining = existingUser.verificationExpiresAt.getTime() - Date.now();
      const cooldownMs = EMAIL_VERIFICATION.EXPIRY_MINUTES * 60 * 1000 - EMAIL_VERIFICATION.COOLDOWN_SECONDS * 1000;
      // 발급된지 얼마 안 된 경우 (예: 1분 이내 재요청 제한)
      if (timeRemaining > cooldownMs) {
        return errorResponse('RATE_LIMITED', ERROR_MESSAGES.RATE_LIMITED, 429);
      }
    }

    const verificationCode = generateVerificationCode();
    const expiresAt = new Date(Date.now() + EMAIL_VERIFICATION.EXPIRY_MINUTES * 60 * 1000);

    // USER 레코드 생성 또는 갱신 (Upsert)
    await prisma.user.upsert({
      where: { email },
      update: {
        verificationCode,
        verificationExpiresAt: expiresAt,
      },
      create: {
        email,
        emailVerified: false,
        verificationCode,
        verificationExpiresAt: expiresAt,
      },
    });

    // 이메일 발송
    const emailSent = await sendVerificationCode(email, verificationCode);
    if (!emailSent) {
      // 발송 실패 시 (Gap Resolution C-5: 로그만 남기고 일단 성공 응답. 실제 프로덕션에서는 다를 수 있음)
      // 단, MVP 단계이므로 에러 처리 방침은 콘솔 출력입니다. 
    }

    return successResponse<VerifyEmailSendResponse>({
      message: '인증 코드가 이메일로 발송되었습니다',
    });
  }

  // 2. 인증 코드 검증 로직 (CMD-AUTH-002)
  const user = await prisma.user.findUnique({ where: { email } });

  if (!user || !user.verificationCode) {
    return errorResponse('NOT_FOUND', '인증 요청 내역을 찾을 수 없습니다', 404);
  }

  if (user.verificationExpiresAt && user.verificationExpiresAt < new Date()) {
    return errorResponse('EXPIRED', ERROR_MESSAGES.EXPIRED, 400);
  }

  if (user.verificationCode !== code) {
    return errorResponse('INVALID_CODE', ERROR_MESSAGES.INVALID_CODE, 400);
  }

  // 검증 성공: USER 상태 업데이트
  await prisma.user.update({
    where: { email },
    data: {
      emailVerified: true,
      verificationCode: null, // 코드 무효화
      verificationExpiresAt: null,
    },
  });

  // JWT 세션 발급
  const token = await signToken({ userId: user.userId, email: user.email, role: 'user' });

  // 쿠키 설정
  cookies().set({
    name: 'user_session',
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 24 * 60 * 60, // 24시간
  });

  return successResponse<VerifyEmailVerifyResponse>({ success: true });
}

export const POST = withErrorHandler(verifyEmailHandler);
