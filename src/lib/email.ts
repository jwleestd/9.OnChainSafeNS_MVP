// ============================================
// LIB-002: Resend 이메일 발송 모듈
// SRS §3.5, C-P0-004
// Gap Resolution C-5: 실패 시 재시도 없이 로그만
// ============================================
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);
const fromEmail = process.env.FROM_EMAIL || 'noreply@example.com';

/**
 * 이메일 인증 코드 발송 (REQ-P0-014)
 */
export async function sendVerificationCode(email: string, code: string): Promise<boolean> {
  try {
    await resend.emails.send({
      from: fromEmail,
      to: email,
      subject: '[OnChain SafeNS] 이메일 인증 코드',
      html: `
        <div style="font-family: sans-serif; padding: 20px;">
          <h2>이메일 인증 코드</h2>
          <p>아래 6자리 코드를 입력하여 인증을 완료하세요.</p>
          <div style="font-size: 32px; font-weight: bold; letter-spacing: 8px; padding: 16px; background: #f0f0f0; border-radius: 8px; display: inline-block;">
            ${code}
          </div>
          <p style="color: #666; margin-top: 16px;">이 코드는 10분간 유효합니다.</p>
        </div>
      `,
    });
    return true;
  } catch (error) {
    console.error('[Email] 인증 코드 발송 실패:', error);
    return false;
  }
}

/**
 * 신고 접수 확인 이메일 (REQ-P0-003)
 */
export async function sendReportConfirmation(
  email: string,
  report: { reportedAddress: string; chain: string }
): Promise<boolean> {
  try {
    await resend.emails.send({
      from: fromEmail,
      to: email,
      subject: '[OnChain SafeNS] 사기 신고 접수 완료',
      html: `
        <div style="font-family: sans-serif; padding: 20px;">
          <h2>사기 신고 접수 완료</h2>
          <p>신고가 정상적으로 접수되었습니다. 운영팀이 검토 후 결과를 알려드리겠습니다.</p>
          <table style="border-collapse: collapse; margin-top: 12px;">
            <tr><td style="padding: 4px 12px; color: #666;">대상 주소</td><td style="padding: 4px 12px; font-family: monospace;">${report.reportedAddress}</td></tr>
            <tr><td style="padding: 4px 12px; color: #666;">체인</td><td style="padding: 4px 12px;">${report.chain}</td></tr>
          </table>
        </div>
      `,
    });
    return true;
  } catch (error) {
    console.error('[Email] 신고 접수 확인 발송 실패:', error);
    return false;
  }
}

/**
 * 신고 심사 결과 통지 이메일 (REQ-P0-013)
 */
export async function sendApprovalResult(
  email: string,
  result: { reportedAddress: string; chain: string; action: 'approved' | 'rejected'; notes?: string }
): Promise<boolean> {
  const actionText = result.action === 'approved' ? '승인' : '거부';
  const emoji = result.action === 'approved' ? '✅' : '❌';

  try {
    await resend.emails.send({
      from: fromEmail,
      to: email,
      subject: `[OnChain SafeNS] 신고 심사 결과 — ${actionText}`,
      html: `
        <div style="font-family: sans-serif; padding: 20px;">
          <h2>${emoji} 신고 심사 결과: ${actionText}</h2>
          <table style="border-collapse: collapse; margin-top: 12px;">
            <tr><td style="padding: 4px 12px; color: #666;">대상 주소</td><td style="padding: 4px 12px; font-family: monospace;">${result.reportedAddress}</td></tr>
            <tr><td style="padding: 4px 12px; color: #666;">체인</td><td style="padding: 4px 12px;">${result.chain}</td></tr>
            <tr><td style="padding: 4px 12px; color: #666;">결과</td><td style="padding: 4px 12px; font-weight: bold;">${actionText}</td></tr>
            ${result.notes ? `<tr><td style="padding: 4px 12px; color: #666;">사유</td><td style="padding: 4px 12px;">${result.notes}</td></tr>` : ''}
          </table>
        </div>
      `,
    });
    return true;
  } catch (error) {
    console.error('[Email] 심사 결과 통지 발송 실패:', error);
    return false;
  }
}

/**
 * 데모 이체 결과 통지 이메일 (REQ-P0-019)
 */
export async function sendTransferNotification(
  email: string,
  transfer: {
    recipientName: string;
    resolvedAddress?: string;
    chain?: string;
    amount: number;
    transferStatus: 'completed' | 'blocked';
    fraudDetail?: string;
  }
): Promise<boolean> {
  const isBlocked = transfer.transferStatus === 'blocked';
  const emoji = isBlocked ? '🚫' : '✅';
  const statusText = isBlocked ? '이체 차단' : '이체 완료 (시뮬레이션)';

  try {
    await resend.emails.send({
      from: fromEmail,
      to: email,
      subject: `[OnChain SafeNS] ${statusText}`,
      html: `
        <div style="font-family: sans-serif; padding: 20px;">
          <h2>${emoji} ${statusText}</h2>
          <table style="border-collapse: collapse; margin-top: 12px;">
            <tr><td style="padding: 4px 12px; color: #666;">수신자</td><td style="padding: 4px 12px;">${transfer.recipientName}</td></tr>
            ${transfer.resolvedAddress ? `<tr><td style="padding: 4px 12px; color: #666;">주소</td><td style="padding: 4px 12px; font-family: monospace;">${transfer.resolvedAddress}</td></tr>` : ''}
            ${transfer.chain ? `<tr><td style="padding: 4px 12px; color: #666;">체인</td><td style="padding: 4px 12px;">${transfer.chain}</td></tr>` : ''}
            <tr><td style="padding: 4px 12px; color: #666;">금액</td><td style="padding: 4px 12px;">${transfer.amount}</td></tr>
            ${isBlocked && transfer.fraudDetail ? `<tr><td style="padding: 4px 12px; color: #666;">차단 사유</td><td style="padding: 4px 12px; color: red;">${transfer.fraudDetail}</td></tr>` : ''}
          </table>
          ${!isBlocked ? '<p style="color: #666; margin-top: 16px;">※ 이 이체는 시뮬레이션이며, 실제 블록체인 트랜잭션은 발생하지 않았습니다.</p>' : ''}
        </div>
      `,
    });
    return true;
  } catch (error) {
    console.error('[Email] 이체 결과 통지 발송 실패:', error);
    return false;
  }
}
