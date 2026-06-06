// ============================================
// LIB-003: 입력 검증 모듈
// SRS §3.5, REQ-P0-007
// ============================================
import { RESERVED_WORDS, SUPPORTED_CHAINS, type SupportedChain } from './constants';

/**
 * Safe-Name 형식 검증
 * - 3~20자, 영소문자 + 숫자 + 하이픈만 허용
 * - 하이픈으로 시작/끝 불가
 * - .safe 확장자가 붙어있으면 제거 후 검증
 */
export function validateNameFormat(name: string): { valid: boolean; normalized: string; error?: string } {
  // .safe 제거 (유저가 붙여서 입력하는 경우 대비)
  const normalized = name.toLowerCase().replace(/\.safe$/, '').trim();

  if (!normalized) {
    return { valid: false, normalized, error: '이름을 입력해주세요' };
  }

  if (normalized.length < 3 || normalized.length > 20) {
    return { valid: false, normalized, error: '이름은 3~20자여야 합니다' };
  }

  if (!/^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/.test(normalized)) {
    return { valid: false, normalized, error: '영소문자, 숫자, 하이픈만 사용 가능하며, 하이픈으로 시작/끝 불가합니다' };
  }

  return { valid: true, normalized };
}

/**
 * 예약어 확인
 * Gap Resolution C-1: 3개 카테고리 차단
 */
export function isReservedWord(name: string): boolean {
  const normalized = name.toLowerCase().replace(/\.safe$/, '').trim();
  return RESERVED_WORDS.includes(normalized);
}

/**
 * 지갑 주소 형식 검증 (체인별)
 */
export function validateAddress(address: string, chain: SupportedChain): { valid: boolean; error?: string } {
  switch (chain) {
    case 'ethereum':
    case 'polygon':
    case 'bsc':
      // EVM 호환 체인: 0x + 40자 hex
      if (!/^0x[0-9a-fA-F]{40}$/.test(address)) {
        return { valid: false, error: '올바른 EVM 주소 형식이 아닙니다 (0x + 40자 hex)' };
      }
      return { valid: true };
    case 'solana':
      // Solana: Base58, 32~44자
      if (!/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(address)) {
        return { valid: false, error: '올바른 Solana 주소 형식이 아닙니다' };
      }
      return { valid: true };
    default:
      return { valid: false, error: '지원하지 않는 체인입니다' };
  }
}

/**
 * 이메일 형식 검증
 */
export function validateEmail(email: string): { valid: boolean; error?: string } {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { valid: false, error: '올바른 이메일 형식을 입력하세요' };
  }
  return { valid: true };
}

/**
 * 지원 체인 검증
 */
export function isValidChain(chain: string): chain is SupportedChain {
  return (SUPPORTED_CHAINS as readonly string[]).includes(chain);
}

/**
 * 신고 설명 검증 (최소 10자)
 */
export function validateDescription(desc: string): { valid: boolean; error?: string } {
  if (!desc || desc.trim().length < 10) {
    return { valid: false, error: '피해 내역은 10자 이상 입력해주세요' };
  }
  return { valid: true };
}

/**
 * 송금액 검증
 */
export function validateAmount(amount: unknown): { valid: boolean; value: number; error?: string } {
  const num = Number(amount);
  if (isNaN(num) || num <= 0) {
    return { valid: false, value: 0, error: '유효한 송금액을 입력하세요' };
  }
  return { valid: true, value: num };
}
