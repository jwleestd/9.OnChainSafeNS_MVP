import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { successResponse, errorResponse, withErrorHandler } from '@/lib/api-response';
import { ResolveResponse } from '@/types';

/**
 * GET /api/v1/resolve
 * QRY-SN-001~003: Safe-Name 리졸브 및 사기 DB 교차 검증
 */
async function resolveNameHandler(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const name = searchParams.get('name');

  if (!name) {
    return errorResponse('VALIDATION_ERROR', '리졸브할 이름을 입력하세요', 400);
  }

  const normalizedName = name.toLowerCase().endsWith('.safe') ? name.toLowerCase() : `${name.toLowerCase()}.safe`;

  // 1. 이름 조회 (QRY-SN-001)
  const safeNameRecord = await prisma.safeName.findUnique({
    where: { humanName: normalizedName }
  });

  // 2. 미등록/만료 예외 처리 (QRY-SN-003)
  if (!safeNameRecord) {
    return errorResponse('NOT_FOUND', '등록되지 않은 이름입니다', 404);
  }

  if (safeNameRecord.status === 'expired') {
    return errorResponse('GONE', '만료된 이름입니다', 410);
  }

  // 3. FRAUD_ADDRESS 교차 검증 (QRY-SN-002)
  const fraudRecord = await prisma.fraudAddress.findFirst({
    where: {
      address: safeNameRecord.walletAddress,
      chain: safeNameRecord.chain,
      status: 'verified'
    }
  });

  const isFlagged = !!fraudRecord;

  return successResponse<ResolveResponse>({
    name: safeNameRecord.humanName,
    wallet_address: safeNameRecord.walletAddress,
    chain: safeNameRecord.chain as any,
    status: safeNameRecord.status,
    fraud_check: {
      is_flagged: isFlagged,
      ...(isFlagged && {
        risk_level: fraudRecord.riskLevel as any,
        report_count: fraudRecord.reportCount,
      }),
    }
  });
}

export const GET = withErrorHandler(resolveNameHandler);
