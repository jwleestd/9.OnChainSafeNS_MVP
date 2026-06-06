import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { successResponse, errorResponse, withErrorHandler } from '@/lib/api-response';
import { validateAddress, validateDescription, isValidChain } from '@/lib/validators';
import { sendReportConfirmation } from '@/lib/email';
import { getUserSession } from '@/lib/auth';
import { FraudReportRequest, FraudReportResponse } from '@/types';
import { ERROR_MESSAGES } from '@/lib/constants';

/**
 * POST /api/v1/fraud/report
 * CMD-FRAUD-001~004: 사기 신고 접수
 */
async function fraudReportHandler(req: NextRequest) {
  const session = await getUserSession();
  if (!session) {
    return errorResponse('UNAUTHORIZED', ERROR_MESSAGES.UNAUTHORIZED, 401);
  }

  const user = await prisma.user.findUnique({ where: { userId: session.userId } });
  if (!user || !user.emailVerified) {
    return errorResponse('FORBIDDEN', ERROR_MESSAGES.EMAIL_REQUIRED, 403);
  }

  // CMD-FRAUD-004: 허위 신고 제한 검증
  if (user.reportRestrictionUntil && user.reportRestrictionUntil > new Date()) {
    return errorResponse('RATE_LIMITED', ERROR_MESSAGES.REPORT_RESTRICTED, 429);
  }

  const body = (await req.json()) as FraudReportRequest;
  const { reported_address, chain, description, evidence_url } = body;

  // 입력 검증
  if (!isValidChain(chain)) {
    return errorResponse('VALIDATION_ERROR', '지원하지 않는 체인입니다', 400);
  }

  const addressCheck = validateAddress(reported_address, chain);
  if (!addressCheck.valid) {
    return errorResponse('VALIDATION_ERROR', addressCheck.error!, 400);
  }

  const descCheck = validateDescription(description);
  if (!descCheck.valid) {
    return errorResponse('VALIDATION_ERROR', descCheck.error!, 400);
  }

  if (!evidence_url || !evidence_url.startsWith('http')) {
    return errorResponse('VALIDATION_ERROR', '올바른 증빙 URL(http/https)을 입력하세요', 400);
  }

  // CMD-FRAUD-002: 동일 주소 중복 신고 처리
  // 1. 유저 본인이 이미 신고했는지 확인 (대기 중이거나 승인된 건)
  const existingReportByUser = await prisma.fraudReport.findFirst({
    where: {
      reporterId: user.userId,
      reportedAddress: reported_address,
      chain: chain,
      status: { in: ['submitted', 'approved'] }
    }
  });

  if (existingReportByUser) {
    return errorResponse('CONFLICT', ERROR_MESSAGES.DUPLICATE_REPORT, 409);
  }

  // 2. 다른 유저가 신고한 적이 있는지 확인 (FRAUD_ADDRESS 테이블)
  const existingFraudAddress = await prisma.fraudAddress.findFirst({
    where: { address: reported_address, chain: chain }
  });

  // DB 트랜잭션: FRAUD_REPORT 생성 및 필요한 경우 FRAUD_ADDRESS 카운트 증가
  const result = await prisma.$transaction(async (tx) => {
    // Report 생성
    const report = await tx.fraudReport.create({
      data: {
        reporterId: user.userId,
        reportedAddress: reported_address,
        chain,
        description,
        evidenceUrl: evidence_url,
        status: 'submitted',
      }
    });

    // 다른 유저가 이미 승인받아 등록된 FRAUD_ADDRESS가 있다면 카운트 1 증가
    if (existingFraudAddress) {
      await tx.fraudAddress.update({
        where: { fraudId: existingFraudAddress.fraudId },
        data: { reportCount: { increment: 1 } }
      });
    }

    return report;
  });

  // CMD-FRAUD-003: 확인 이메일 발송 (비동기 처리, 실패해도 로직 진행)
  sendReportConfirmation(user.email, {
    reportedAddress: reported_address,
    chain,
  }).catch((err) => {
    console.error('[Email Error] 확인 이메일 발송 실패:', err);
  });

  return successResponse<FraudReportResponse>({
    report_id: result.reportId,
    status: result.status as any,
    reported_at: result.reportedAt.toISOString(),
  });
}

export const POST = withErrorHandler(fraudReportHandler);
