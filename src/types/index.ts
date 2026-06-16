// ============================================
// API-002 ~ API-009: Phase-0 API Request/Response DTO
// SRS §6.1 P0-A1 ~ P0-A7 기준
// ============================================
import type { SupportedChain, RiskLevel, FraudReportStatus, TransferStatus, FraudStatus } from '@/lib/constants';

// ─────────────────────────────────────────────
// API-003: GET /api/v1/fraud/lookup
// ─────────────────────────────────────────────
export interface FraudLookupQuery {
  address: string;
  chain: SupportedChain;
}

export interface FraudLookupResponse {
  found: boolean;
  address: string;
  chain: SupportedChain;
  risk_level?: RiskLevel;
  report_count?: number;
  source_type?: string;
  status?: string;
  first_reported_at?: string;
}

// ─────────────────────────────────────────────
// API-004: POST /api/v1/fraud/report
// ─────────────────────────────────────────────
export interface FraudReportRequest {
  reported_address: string;
  chain: SupportedChain;
  description: string;
  evidence_url: string;
}

export interface FraudReportResponse {
  report_id: string;
  status: FraudReportStatus;
  reported_at: string;
}

// ─────────────────────────────────────────────
// API-005: POST /api/v1/safename/register
// ─────────────────────────────────────────────
export interface SafeNameRegisterRequest {
  human_name: string;
  wallet_address: string;
  chain: SupportedChain;
}

export interface SafeNameRegisterResponse {
  name_id: string;
  human_name: string;
  status: string;
  registered_at: string;
}

// ─────────────────────────────────────────────
// API-006: GET /api/v1/resolve
// ─────────────────────────────────────────────
export interface ResolveQuery {
  name: string;
}

export interface ResolveResponse {
  name: string;
  wallet_address: string;
  chain: SupportedChain;
  status: string;
  fraud_check: {
    is_flagged: boolean;
    risk_level?: RiskLevel;
    report_count?: number;
  };
}

// ─────────────────────────────────────────────
// API-007: POST /api/v1/admin/approve
// ─────────────────────────────────────────────
export interface AdminApproveRequest {
  report_id: string;
  action: 'approve' | 'reject';
  reviewer_notes?: string;
}

export interface AdminApproveResponse {
  report_id: string;
  status: FraudReportStatus;
  fraud_address_id?: string;
  reviewed_at: string;
}

// ─────────────────────────────────────────────
// API-008: POST /api/v1/auth/verify-email
// ─────────────────────────────────────────────
export interface VerifyEmailRequest {
  email: string;
  code?: string; // code 없으면 코드 발송, 있으면 코드 검증
}

export interface VerifyEmailSendResponse {
  message: string;
}

export interface VerifyEmailVerifyResponse {
  success: true;
}

// ─────────────────────────────────────────────
// API-009: POST /api/v1/transfer/demo
// ─────────────────────────────────────────────
export interface TransferDemoRequest {
  recipient_name: string;
  amount: number;
}

export interface TransferDemoResponse {
  transfer_id: string;
  recipient_name: string;
  resolved_address: string | null;
  chain: string | null;
  amount: number;
  fraud_status: FraudStatus;
  fraud_detail: string | null;
  transfer_status: TransferStatus;
  created_at: string;
}
