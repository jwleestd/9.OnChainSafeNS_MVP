import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { successResponse, errorResponse, withErrorHandler } from '@/lib/api-response';
import { AdminApproveRequest, AdminApproveResponse } from '@/types';
import { sendApprovalResult } from '@/lib/email';
import { RISK_ESCALATION } from '@/lib/constants';

/**
 * GET /api/v1/admin/approve
 * QRY-ADMIN-001: 대기 중인 신고 목록 조회
 */
async function getPendingReportsHandler(req: NextRequest) {
  const reports = await prisma.fraudReport.findMany({
    where: { status: 'submitted' },
    orderBy: { reportedAt: 'asc' },
    select: {
      reportId: true,
      reportedAddress: true,
      chain: true,
      description: true,
      evidenceUrl: true,
      reportedAt: true,
      reporter: {
        select: {
          email: true
        }
      }
    }
  });

  return successResponse(reports);
}

/**
 * POST /api/v1/admin/approve
 * CMD-ADMIN-001~003: 신고 승인/거부 처리
 */
async function approveReportHandler(req: NextRequest) {
  const body = (await req.json()) as AdminApproveRequest;
  const { report_id, action, reviewer_notes } = body;

  if (!report_id || !['approve', 'reject'].includes(action)) {
    return errorResponse('VALIDATION_ERROR', '유효하지 않은 요청입니다', 400);
  }

  const report = await prisma.fraudReport.findUnique({
    where: { reportId: report_id },
    include: { reporter: true }
  });

  if (!report) {
    return errorResponse('NOT_FOUND', '신고 내역을 찾을 수 없습니다', 404);
  }

  if (report.status !== 'submitted') {
    return errorResponse('CONFLICT', '이미 처리된 신고입니다', 409);
  }

  const now = new Date();
  let finalStatus: 'approved' | 'rejected' = action === 'approve' ? 'approved' : 'rejected';
  let createdFraudAddressId: string | undefined;

  // DB 트랜잭션
  await prisma.$transaction(async (tx) => {
    // 1. Report 상태 업데이트
    await tx.fraudReport.update({
      where: { reportId: report_id },
      data: {
        status: finalStatus,
        reviewedAt: now,
        reviewerNotes: reviewer_notes || null,
      }
    });

    // 2. 승인(approve)일 경우 FRAUD_ADDRESS 테이블 동기화
    if (finalStatus === 'approved') {
      const existingFraudAddress = await tx.fraudAddress.findFirst({
        where: { address: report.reportedAddress, chain: report.chain }
      });

      if (existingFraudAddress) {
        // 이미 존재하면 reportCount 증가 및 위험도 자동 상향 로직
        const newCount = existingFraudAddress.reportCount + 1;
        let newRiskLevel = existingFraudAddress.riskLevel;

        if (newCount >= RISK_ESCALATION.CRITICAL_THRESHOLD) {
          newRiskLevel = 'critical';
        } else if (newCount >= RISK_ESCALATION.HIGH_THRESHOLD && newRiskLevel !== 'critical') {
          newRiskLevel = 'high';
        }

        await tx.fraudAddress.update({
          where: { fraudId: existingFraudAddress.fraudId },
          data: {
            reportCount: newCount,
            riskLevel: newRiskLevel,
            status: 'verified' // inactive 등 상태일 경우 다시 활성화
          }
        });
        createdFraudAddressId = existingFraudAddress.fraudId;
      } else {
        // 존재하지 않으면 새로 생성 (초기 riskLevel = medium, sourceType = community)
        const newFraud = await tx.fraudAddress.create({
          data: {
            address: report.reportedAddress,
            chain: report.chain,
            riskLevel: 'medium',
            reportCount: 1,
            sourceType: 'community',
            firstReportedAt: now,
            status: 'verified',
          }
        });
        createdFraudAddressId = newFraud.fraudId;
      }
    }
  });

  // 3. 심사 결과 이메일 발송 (CMD-ADMIN-003)
  // 실패하더라도 에러만 로그로 남기고 성공 응답
  sendApprovalResult(report.reporter.email, {
    reportedAddress: report.reportedAddress,
    chain: report.chain,
    action: finalStatus,
    notes: reviewer_notes,
  }).catch((err) => {
    console.error('[Email Error] 심사 결과 발송 실패:', err);
  });

  return successResponse<AdminApproveResponse>({
    report_id,
    status: finalStatus as any,
    fraud_address_id: createdFraudAddressId,
    reviewed_at: now.toISOString(),
  });
}

export const GET = withErrorHandler(getPendingReportsHandler);
export const POST = withErrorHandler(approveReportHandler);
