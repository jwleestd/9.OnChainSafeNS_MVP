import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { successResponse, errorResponse, withErrorHandler } from '@/lib/api-response';
import { validateAmount } from '@/lib/validators';
import { getUserSession } from '@/lib/auth';
import { TransferDemoRequest, TransferDemoResponse } from '@/types';
import { sendTransferNotification } from '@/lib/email';
import { ERROR_MESSAGES } from '@/lib/constants';

/**
 * POST /api/v1/transfer/demo
 * CMD-TX-001~004: 데모 이체 시뮬레이션
 */
async function transferDemoHandler(req: NextRequest) {
  // 1. 세션 확인
  const session = await getUserSession();
  if (!session) {
    return errorResponse('UNAUTHORIZED', ERROR_MESSAGES.UNAUTHORIZED, 401);
  }

  const user = await prisma.user.findUnique({ where: { userId: session.userId } });
  if (!user || !user.emailVerified) {
    return errorResponse('FORBIDDEN', ERROR_MESSAGES.EMAIL_REQUIRED, 403);
  }

  const body = (await req.json()) as TransferDemoRequest;
  const { recipient_name, amount } = body;

  const amountCheck = validateAmount(amount);
  if (!amountCheck.valid) {
    return errorResponse('VALIDATION_ERROR', amountCheck.error!, 400);
  }

  const normalizedName = recipient_name.toLowerCase().endsWith('.safe') 
    ? recipient_name.toLowerCase() 
    : `${recipient_name.toLowerCase()}.safe`;

  // 2. 리졸브 (CMD-TX-001)
  const safeNameRecord = await prisma.safeName.findUnique({
    where: { humanName: normalizedName }
  });

  if (!safeNameRecord || safeNameRecord.status === 'expired') {
    // 미등록/만료 시 TRANSFER_DEMO 기록 후 반환
    const demoRecord = await prisma.transferDemo.create({
      data: {
        senderId: user.userId,
        recipientName: normalizedName,
        amount: amountCheck.value,
        transferStatus: 'name_not_found',
        fraudStatus: 'clean',
      }
    });

    return successResponse<TransferDemoResponse>({
      transfer_id: demoRecord.transferId,
      recipient_name: demoRecord.recipientName,
      resolved_address: null,
      chain: null,
      amount: demoRecord.amount,
      fraud_status: demoRecord.fraudStatus as any,
      fraud_detail: demoRecord.fraudDetail,
      transfer_status: demoRecord.transferStatus as any,
      created_at: demoRecord.createdAt.toISOString(),
    });
  }

  // 3. FRAUD_ADDRESS 교차 검증 (CMD-TX-002)
  const fraudRecord = await prisma.fraudAddress.findFirst({
    where: {
      address: safeNameRecord.walletAddress,
      chain: safeNameRecord.chain,
      status: 'verified'
    }
  });

  const isFlagged = !!fraudRecord;
  const transferStatus = isFlagged ? 'blocked' : 'completed';
  const fraudStatus = isFlagged ? 'flagged' : 'clean';
  let fraudDetail = null;

  if (isFlagged) {
    fraudDetail = JSON.stringify({
      risk_level: fraudRecord.riskLevel,
      report_count: fraudRecord.reportCount
    });
  }

  // 4. TRANSFER_DEMO 기록 생성 (CMD-TX-003)
  const demoRecord = await prisma.transferDemo.create({
    data: {
      senderId: user.userId,
      recipientName: safeNameRecord.humanName,
      resolvedAddress: safeNameRecord.walletAddress,
      chain: safeNameRecord.chain,
      amount: amountCheck.value,
      transferStatus,
      fraudStatus,
      fraudDetail,
    }
  });

  // 5. 결과 이메일 발송 연동 (CMD-TX-004)
  const emailSent = await sendTransferNotification(user.email, {
    recipientName: safeNameRecord.humanName,
    resolvedAddress: safeNameRecord.walletAddress,
    chain: safeNameRecord.chain,
    amount: amountCheck.value,
    transferStatus,
    fraudDetail: isFlagged ? `위험도: ${fraudRecord.riskLevel}, 누적 신고: ${fraudRecord.reportCount}건` : undefined,
  });

  if (emailSent) {
    await prisma.transferDemo.update({
      where: { transferId: demoRecord.transferId },
      data: { notifiedAt: new Date() }
    });
  } else {
    console.error('[Email Error] 이체 결과 알림 발송 실패');
  }

  return successResponse<TransferDemoResponse>({
    transfer_id: demoRecord.transferId,
    recipient_name: demoRecord.recipientName,
    resolved_address: demoRecord.resolvedAddress,
    chain: demoRecord.chain,
    amount: demoRecord.amount,
    fraud_status: demoRecord.fraudStatus as any,
    fraud_detail: demoRecord.fraudDetail,
    transfer_status: demoRecord.transferStatus as any,
    created_at: demoRecord.createdAt.toISOString(),
  });
}

export const POST = withErrorHandler(transferDemoHandler);
