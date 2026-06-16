import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { successResponse, errorResponse, withErrorHandler } from '@/lib/api-response';
import { validateAddress, isValidChain } from '@/lib/validators';
import { FraudLookupResponse } from '@/types';

/**
 * GET /api/v1/fraud/lookup
 * QRY-FRAUD-001~003: 사기 주소 조회
 */
async function fraudLookupHandler(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const address = searchParams.get('address');
  const chain = searchParams.get('chain');

  if (!address || !chain) {
    return errorResponse('VALIDATION_ERROR', '주소와 체인은 필수 입력값입니다', 400);
  }

  if (!isValidChain(chain)) {
    return errorResponse('VALIDATION_ERROR', '지원하지 않는 체인입니다', 400);
  }

  const addressCheck = validateAddress(address, chain);
  if (!addressCheck.valid) {
    return errorResponse('VALIDATION_ERROR', addressCheck.error!, 400);
  }

  const fraudRecord = await prisma.fraudAddress.findFirst({
    where: {
      address: address,
      chain: chain,
    },
  });

  if (!fraudRecord) {
    // 미등록 주소 시 200 + 빈 결과 반환 (QRY-FRAUD-002)
    return successResponse<FraudLookupResponse>({
      found: false,
      address,
      chain,
    });
  }

  // QRY-FRAUD-003: source_type 폴백 처리
  const sourceTypeLabel = fraudRecord.sourceType || '출처 미확인';

  return successResponse<FraudLookupResponse>({
    found: true,
    address: fraudRecord.address,
    chain: fraudRecord.chain as any,
    risk_level: fraudRecord.riskLevel as any,
    report_count: fraudRecord.reportCount,
    source_type: sourceTypeLabel,
    status: fraudRecord.status,
    first_reported_at: fraudRecord.firstReportedAt.toISOString(),
  });
}

export const GET = withErrorHandler(fraudLookupHandler);
