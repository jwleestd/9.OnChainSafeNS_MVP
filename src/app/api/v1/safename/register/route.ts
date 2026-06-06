import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { successResponse, errorResponse, withErrorHandler } from '@/lib/api-response';
import { validateNameFormat, isReservedWord, validateAddress, isValidChain } from '@/lib/validators';
import { getUserSession } from '@/lib/auth';
import { SafeNameRegisterRequest, SafeNameRegisterResponse } from '@/types';
import { ERROR_MESSAGES } from '@/lib/constants';

/**
 * POST /api/v1/safename/register
 * CMD-SN-001~002: Safe-Name 등록
 */
async function registerSafeNameHandler(req: NextRequest) {
  const session = await getUserSession();
  if (!session) {
    return errorResponse('UNAUTHORIZED', ERROR_MESSAGES.UNAUTHORIZED, 401);
  }

  const user = await prisma.user.findUnique({ where: { userId: session.userId } });
  if (!user || !user.emailVerified) {
    return errorResponse('FORBIDDEN', ERROR_MESSAGES.EMAIL_REQUIRED, 403);
  }

  const body = (await req.json()) as SafeNameRegisterRequest;
  const { human_name, wallet_address, chain } = body;

  // 1. 이름 규칙 검증
  const nameCheck = validateNameFormat(human_name);
  if (!nameCheck.valid) {
    return errorResponse('VALIDATION_ERROR', nameCheck.error!, 400);
  }
  const normalizedName = nameCheck.normalized + '.safe'; // .safe 강제 부착

  // 2. 예약어 차단 검증
  if (isReservedWord(normalizedName)) {
    return errorResponse('VALIDATION_ERROR', ERROR_MESSAGES.RESERVED_NAME, 400);
  }

  // 3. 체인 및 주소 검증
  if (!isValidChain(chain)) {
    return errorResponse('VALIDATION_ERROR', '지원하지 않는 체인입니다', 400);
  }

  const addressCheck = validateAddress(wallet_address, chain);
  if (!addressCheck.valid) {
    return errorResponse('VALIDATION_ERROR', addressCheck.error!, 400);
  }

  // 4. 이름 중복 체크
  const existingName = await prisma.safeName.findUnique({
    where: { humanName: normalizedName }
  });

  if (existingName) {
    return errorResponse('CONFLICT', ERROR_MESSAGES.NAME_ALREADY_EXISTS, 409);
  }

  // 5. DB 저장
  const newSafeName = await prisma.safeName.create({
    data: {
      humanName: normalizedName,
      walletAddress: wallet_address,
      chain,
      ownerId: user.userId,
      status: 'active',
    }
  });

  return successResponse<SafeNameRegisterResponse>({
    name_id: newSafeName.nameId,
    human_name: newSafeName.humanName,
    status: newSafeName.status,
    registered_at: newSafeName.registeredAt.toISOString(),
  });
}

export const POST = withErrorHandler(registerSafeNameHandler);
