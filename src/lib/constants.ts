// ============================================
// LIB-004: 상수 정의
// SRS §6.7, Gap Resolution C-1 (예약어)
// ============================================

/**
 * 지원 체인 목록 (Phase-0)
 */
export const SUPPORTED_CHAINS = ['ethereum', 'polygon', 'bsc', 'solana'] as const;
export type SupportedChain = (typeof SUPPORTED_CHAINS)[number];

/**
 * 예약어 차단 목록 — Safe-Name 등록 시 사용 불가
 * Gap Resolution C-1 결정: 3개 카테고리 (관리자/기관, 거래소, 보안/법집행)
 */
export const RESERVED_WORDS: readonly string[] = [
  // 카테고리 1: 관리자/기관
  'admin', 'administrator', 'system', 'root', 'operator', 'support', 'helpdesk',
  'official', 'moderator', 'mod',
  // 카테고리 2: 거래소/서비스
  'binance', 'coinbase', 'upbit', 'bithumb', 'kraken', 'okx', 'bybit',
  'metamask', 'phantom', 'trustwallet', 'ledger',
  // 카테고리 3: 보안/법집행
  'police', 'fbi', 'interpol', 'sec', 'ciso', 'security', 'fraud',
  'scam', 'phishing', 'hack', 'hacker',
] as const;

/**
 * FRAUD_ADDRESS 위험도 레벨
 */
export const RISK_LEVELS = ['low', 'medium', 'high', 'critical'] as const;
export type RiskLevel = (typeof RISK_LEVELS)[number];

/**
 * FRAUD_ADDRESS 상태값
 * Gap Resolution C-4: verified, inactive, appealed
 */
export const FRAUD_ADDRESS_STATUS = ['verified', 'inactive', 'appealed'] as const;
export type FraudAddressStatus = (typeof FRAUD_ADDRESS_STATUS)[number];

/**
 * FRAUD_REPORT 상태값
 */
export const FRAUD_REPORT_STATUS = ['submitted', 'approved', 'rejected'] as const;
export type FraudReportStatus = (typeof FRAUD_REPORT_STATUS)[number];

/**
 * SAFE_NAME 상태값
 */
export const SAFE_NAME_STATUS = ['active', 'expired'] as const;
export type SafeNameStatus = (typeof SAFE_NAME_STATUS)[number];

/**
 * TRANSFER_DEMO 상태값
 */
export const TRANSFER_STATUS = ['completed', 'blocked', 'name_not_found'] as const;
export type TransferStatus = (typeof TRANSFER_STATUS)[number];

export const FRAUD_STATUS = ['clean', 'flagged'] as const;
export type FraudStatus = (typeof FRAUD_STATUS)[number];

/**
 * 자동 위험도 상향 임계치
 * Gap Resolution C-3: 5건→high, 10건→critical
 */
export const RISK_ESCALATION = {
  HIGH_THRESHOLD: 5,
  CRITICAL_THRESHOLD: 10,
} as const;

/**
 * 허위 신고 자동 차단
 * Gap Resolution C-2: 3회 누적 → 30일 차단
 */
export const FALSE_REPORT_BAN = {
  MAX_COUNT: 3,
  BAN_DAYS: 30,
} as const;

/**
 * 이메일 인증 코드 설정
 */
export const EMAIL_VERIFICATION = {
  CODE_LENGTH: 6,
  EXPIRY_MINUTES: 10,
  COOLDOWN_SECONDS: 60,
} as const;

/**
 * 표준 에러 메시지
 */
export const ERROR_MESSAGES = {
  VALIDATION_ERROR: '입력값이 유효하지 않습니다',
  UNAUTHORIZED: '인증이 필요합니다',
  INVALID_CODE: '인증 코드가 일치하지 않습니다',
  NOT_FOUND: '요청한 리소스를 찾을 수 없습니다',
  CONFLICT: '이미 존재하는 리소스입니다',
  EXPIRED: '인증 코드가 만료되었습니다. 다시 요청하세요',
  RATE_LIMITED: '요청이 너무 많습니다. 잠시 후 다시 시도하세요',
  INTERNAL_ERROR: '서버 내부 오류가 발생했습니다',
  EMAIL_REQUIRED: '이메일 인증이 필요합니다',
  REPORT_RESTRICTED: '신고 제한 상태입니다. 제한 해제 후 다시 시도하세요',
  RESERVED_NAME: '예약된 이름은 사용할 수 없습니다',
  INVALID_NAME_FORMAT: '이름 형식이 올바르지 않습니다',
  INVALID_ADDRESS: '올바른 지갑 주소를 입력하세요',
  INVALID_AMOUNT: '유효한 송금액을 입력하세요',
  DUPLICATE_REPORT: '이미 신고된 주소입니다',
  NAME_ALREADY_EXISTS: '이미 등록된 이름입니다',
} as const;
