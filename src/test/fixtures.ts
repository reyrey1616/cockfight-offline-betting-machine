import type {
  AdminUser,
  BetListRow,
  BetRow,
  CashBalanceResponse,
  CashMutationResponse,
  Collector,
  Fight,
  PublicUser,
  SessionPreviewResponse,
  SessionResetRow
} from '@/types/api'

export const adminUser: PublicUser = {
  id: 'admin-1',
  username: 'admin',
  fullName: 'House Admin',
  role: 'ADMIN',
  initials: 'HA'
}

export const tellerUser: PublicUser = {
  id: 'teller-1',
  username: 'teller1',
  fullName: 'Desk One',
  role: 'TELLER',
  initials: 'D1'
}

export function makeAdminUser(overrides: Partial<AdminUser> = {}): AdminUser {
  return {
    id: 'teller-2',
    username: 'teller2',
    fullName: 'Desk Two',
    role: 'TELLER',
    initials: 'D2',
    isActive: true,
    createdAt: '2026-05-15T00:00:00.000Z',
    updatedAt: '2026-05-15T00:00:00.000Z',
    ...overrides
  }
}

export function makeCollector(overrides: Partial<Collector> = {}): Collector {
  return {
    id: 'col-1',
    name: 'Collector A',
    code: 'COL-A',
    isActive: true,
    createdAt: '2026-05-15T00:00:00.000Z',
    updatedAt: '2026-05-15T00:00:00.000Z',
    ...overrides
  }
}

export function makeFight(overrides: Partial<Fight> = {}): Fight {
  return {
    id: 'fight-1',
    fightNumber: 1,
    status: 'OPEN',
    commissionRate: '0.1000',
    meronPool: '1000.00',
    walaPool: '800.00',
    meronOdds: 1.71,
    walaOdds: 2.13,
    meronAcceptingBets: true,
    meronHeldAt: null,
    meronHeldByUserId: null,
    walaAcceptingBets: true,
    walaHeldAt: null,
    walaHeldByUserId: null,
    outcome: null,
    payoutRatioMeron: null,
    payoutRatioWala: null,
    openedAt: '2026-05-15T12:00:00.000Z',
    closedAt: null,
    settledAt: null,
    cancelledAt: null,
    previousOutcome: null,
    previousPayoutRatioMeron: null,
    previousPayoutRatioWala: null,
    correctedAt: null,
    correctedByUserId: null,
    correctionReason: null,
    createdAt: '2026-05-15T12:00:00.000Z',
    updatedAt: '2026-05-15T12:00:00.000Z',
    ...overrides
  }
}

export function makeSessionPreview(
  overrides: Partial<SessionPreviewResponse> = {}
): SessionPreviewResponse {
  return {
    counts: { fights: 3, bets: 10, collectorCash: 2, ledger: 5 },
    invariants: {
      unfinishedFights: { violated: false, count: 0 },
      unpaidWinningBets: { violated: false, count: 0 },
      nonZeroBalances: { violated: false, tellerCount: 0, tellers: [] }
    },
    canResetCleanly: true,
    ...overrides
  }
}

export function makeCashBalance(
  overrides: Partial<CashBalanceResponse> = {}
): CashBalanceResponse {
  return {
    tellerId: tellerUser.id,
    username: tellerUser.username,
    fullName: tellerUser.fullName,
    balance: '1500.00',
    ...overrides
  }
}

export function makeCashMutation(
  overrides: Partial<CashMutationResponse> = {}
): CashMutationResponse {
  return {
    ledgerEntry: {
      id: 'ledger-1',
      code: 'ADV12345',
      tellerId: tellerUser.id,
      type: 'CASH_ADVANCE',
      amount: '500.00',
      betId: null,
      collectorId: 'col-1',
      adjustedByUserId: null,
      notes: null,
      createdAt: '2026-05-15T12:00:00.000Z'
    },
    actorBalance: '2000.00',
    ...overrides
  }
}

export function makeBetRow(overrides: Partial<BetRow> = {}): BetRow {
  return {
    id: 'bet-1',
    code: 'ABCD1234',
    clientRequestId: '00000000-0000-4000-8000-000000000001',
    fightId: 'fight-1',
    tellerId: tellerUser.id,
    tellerNameSnapshot: tellerUser.fullName,
    tellerInitialsSnapshot: tellerUser.initials,
    side: 'MERON',
    amount: '100.00',
    status: 'PENDING',
    payoutAmount: null,
    paidAt: null,
    paidByUserId: null,
    voidedAt: null,
    voidedByUserId: null,
    voidReason: null,
    previousStatus: null,
    previousPayoutAmount: null,
    correctedAt: null,
    createdAt: '2026-05-15T12:00:00.000Z',
    updatedAt: '2026-05-15T12:00:00.000Z',
    ...overrides
  }
}

export function makeBetListRow(overrides: Partial<BetListRow> = {}): BetListRow {
  return {
    ...makeBetRow(overrides),
    fightNumber: 1,
    fightStatus: 'OPEN',
    meronOdds: null,
    walaOdds: null,
    payoutRatioMeron: null,
    payoutRatioWala: null,
    fightEndedAt: null,
    ...overrides
  }
}

export function makeSessionResetRow(overrides: Partial<SessionResetRow> = {}): SessionResetRow {
  return {
    id: 'reset-1',
    performedAt: '2026-05-15T20:00:00.000Z',
    performedByUserId: adminUser.id,
    performedByUsername: adminUser.username,
    performedByFullName: adminUser.fullName,
    fightCount: 5,
    betCount: 12,
    ledgerCount: 0,
    collectorCashCount: 2,
    notes: 'End of night',
    forced: false,
    ...overrides
  }
}
