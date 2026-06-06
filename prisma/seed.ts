// ============================================
// SEED-001 ~ SEED-003: Phase-0 시드 데이터
// SRS §6.3 기준
// Gap Resolution D-2: FRAUD_ADDRESS 30건
// ============================================
import { PrismaClient } from '../src/generated/prisma/client.js';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import { faker } from '@faker-js/faker';

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// ─────────────────────────────────────────────
// §6.3.2 FRAUD_ADDRESS 분포 (30건)
// ─────────────────────────────────────────────
const chains = ['ethereum', 'polygon', 'bsc', 'solana'] as const;
const riskLevels = ['critical', 'high', 'medium', 'low'] as const;

// 분포: ethereum 15, polygon 8, bsc 4, solana 3
const chainDistribution = [
  ...Array(15).fill('ethereum'),
  ...Array(8).fill('polygon'),
  ...Array(4).fill('bsc'),
  ...Array(3).fill('solana'),
] as string[];

// 분포: critical 5, high 10, medium 10, low 5
const riskDistribution = [
  ...Array(5).fill('critical'),
  ...Array(10).fill('high'),
  ...Array(10).fill('medium'),
  ...Array(5).fill('low'),
] as string[];

// SAFE_NAME과 교차하는 수동 사기 주소 3건
const manualFraudAddresses = [
  {
    chain: 'ethereum',
    address: '0xBAD0000000000000000000000000000000000001',
    riskLevel: 'critical',
    reportCount: 5,
  },
  {
    chain: 'polygon',
    address: '0xRISK000000000000000000000000000000000001',
    riskLevel: 'high',
    reportCount: 3,
  },
  {
    chain: 'ethereum',
    address: '0xSCAM000000000000000000000000000000000001',
    riskLevel: 'medium',
    reportCount: 2,
  },
];

async function seedFraudAddresses() {
  console.log('📌 FRAUD_ADDRESS 시드 생성 중...');

  // 27건: faker 자동 생성
  for (let i = 0; i < 27; i++) {
    await prisma.fraudAddress.create({
      data: {
        chain: chainDistribution[i],
        address: faker.finance.ethereumAddress(),
        riskLevel: riskDistribution[i],
        reportCount: faker.number.int({ min: 1, max: 10 }),
        sourceType: 'seed',
        firstReportedAt: faker.date.past({ years: 1 }),
        status: 'verified',
      },
    });
  }

  // 3건: SAFE_NAME 교차용 수동 주소
  for (const addr of manualFraudAddresses) {
    await prisma.fraudAddress.create({
      data: {
        chain: addr.chain,
        address: addr.address,
        riskLevel: addr.riskLevel,
        reportCount: addr.reportCount,
        sourceType: 'seed',
        firstReportedAt: faker.date.past({ years: 1 }),
        status: 'verified',
      },
    });
  }

  console.log('✅ FRAUD_ADDRESS 30건 생성 완료');
}

// ─────────────────────────────────────────────
// §6.3.4 USER 분포 (5건)
// ─────────────────────────────────────────────
async function seedUsers() {
  console.log('📌 USER 시드 생성 중...');

  const users = [
    { email: 'user1@test.com', emailVerified: true },
    { email: 'user2@test.com', emailVerified: true },    // 중복 신고 테스트
    { email: 'user3@test.com', emailVerified: true },
    { email: 'unverified@test.com', emailVerified: false },  // 401 에러 테스트
    {
      email: 'restricted@test.com',
      emailVerified: true,
      reportRestrictionUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 미래 30일
    },  // 429 에러 테스트
  ];

  const createdUsers = [];
  for (const user of users) {
    const created = await prisma.user.create({ data: user });
    createdUsers.push(created);
  }

  console.log('✅ USER 5건 생성 완료');
  return createdUsers;
}

// ─────────────────────────────────────────────
// §6.3.3 SAFE_NAME 분포 (10건)
// ─────────────────────────────────────────────
async function seedSafeNames(userIds: string[]) {
  console.log('📌 SAFE_NAME 시드 생성 중...');

  const safeNames = [
    // 1~3: 정상 주소 (ethereum)
    { humanName: 'alice.safe', chain: 'ethereum', walletAddress: faker.finance.ethereumAddress(), ownerId: userIds[0], status: 'active' },
    { humanName: 'bob.safe', chain: 'ethereum', walletAddress: faker.finance.ethereumAddress(), ownerId: userIds[1], status: 'active' },
    { humanName: 'kim.safe', chain: 'ethereum', walletAddress: faker.finance.ethereumAddress(), ownerId: userIds[2], status: 'active' },
    // 4~5: 정상 주소 (polygon)
    { humanName: 'test-user.safe', chain: 'polygon', walletAddress: faker.finance.ethereumAddress(), ownerId: userIds[0], status: 'active' },
    { humanName: 'dev.safe', chain: 'polygon', walletAddress: faker.finance.ethereumAddress(), ownerId: userIds[1], status: 'active' },
    // 6~7: 정상 주소 (solana, bsc)
    { humanName: 'sol-user.safe', chain: 'solana', walletAddress: faker.finance.ethereumAddress(), ownerId: userIds[2], status: 'active' },
    { humanName: 'bsc-user.safe', chain: 'bsc', walletAddress: faker.finance.ethereumAddress(), ownerId: userIds[0], status: 'active' },
    // 8: ⚠️ FRAUD_ADDRESS 교차 (critical)
    { humanName: 'evil.safe', chain: 'ethereum', walletAddress: '0xBAD0000000000000000000000000000000000001', ownerId: userIds[1], status: 'active' },
    // 9: ⚠️ FRAUD_ADDRESS 교차 (high)
    { humanName: 'risky.safe', chain: 'polygon', walletAddress: '0xRISK000000000000000000000000000000000001', ownerId: userIds[2], status: 'active' },
    // 10: 만료 이름 테스트
    { humanName: 'expired-name.safe', chain: 'ethereum', walletAddress: faker.finance.ethereumAddress(), ownerId: userIds[0], status: 'expired' },
  ];

  for (const sn of safeNames) {
    await prisma.safeName.create({ data: sn });
  }

  console.log('✅ SAFE_NAME 10건 생성 완료');
}

// ─────────────────────────────────────────────
// OPERATOR (1건)
// ─────────────────────────────────────────────
async function seedOperator() {
  console.log('📌 OPERATOR 시드 생성 중...');

  await prisma.operator.create({
    data: {
      name: 'Admin',
      email: 'admin@onchainsafe.com',
      role: 'admin',
    },
  });

  console.log('✅ OPERATOR 1건 생성 완료');
}

// ─────────────────────────────────────────────
// SEED-003: 정합성 자동 검증 (REQ-P0-NF-005)
// ─────────────────────────────────────────────
async function verifySeeds() {
  console.log('\n🔍 시드 데이터 정합성 검증 중...');

  const counts = {
    fraudAddresses: await prisma.fraudAddress.count(),
    safeNames: await prisma.safeName.count(),
    users: await prisma.user.count(),
    operators: await prisma.operator.count(),
  };

  const expected = { fraudAddresses: 30, safeNames: 10, users: 5, operators: 1 };
  let allPassed = true;

  for (const [key, expectedCount] of Object.entries(expected)) {
    const actual = counts[key as keyof typeof counts];
    const passed = actual === expectedCount;
    console.log(`  ${passed ? '✅' : '❌'} ${key}: ${actual}/${expectedCount}`);
    if (!passed) allPassed = false;
  }

  // 사기 교차 주소 확인
  const evilSafe = await prisma.safeName.findUnique({ where: { humanName: 'evil.safe' } });
  const evilFraud = evilSafe
    ? await prisma.fraudAddress.findFirst({ where: { address: evilSafe.walletAddress } })
    : null;
  const crossCheck = !!evilFraud;
  console.log(`  ${crossCheck ? '✅' : '❌'} evil.safe ↔ FRAUD_ADDRESS 교차: ${crossCheck}`);
  if (!crossCheck) allPassed = false;

  console.log(`\n${allPassed ? '🎉 모든 시드 데이터 검증 통과!' : '⚠️ 일부 검증 실패 — seed.ts를 확인하세요'}\n`);
}

// ─────────────────────────────────────────────
// Main
// ─────────────────────────────────────────────
async function main() {
  console.log('🌱 Phase-0 시드 데이터 생성 시작\n');

  // 기존 데이터 초기화 (순서 주의 — FK 참조 순)
  await prisma.transferDemo.deleteMany();
  await prisma.fraudReport.deleteMany();
  await prisma.safeName.deleteMany();
  await prisma.fraudAddress.deleteMany();
  await prisma.user.deleteMany();
  await prisma.operator.deleteMany();

  // 시드 생성
  await seedFraudAddresses();
  const users = await seedUsers();
  const userIds = users.map((u) => u.userId);
  await seedSafeNames(userIds);
  await seedOperator();

  // 정합성 검증
  await verifySeeds();
}

main()
  .catch((e) => {
    console.error('❌ 시드 생성 실패:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
