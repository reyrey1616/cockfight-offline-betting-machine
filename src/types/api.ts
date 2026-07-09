// Hand-written API types.
//
// These mirror the backend's Fastify JSON schemas. The source of truth
// is `cockfigh-offline-betting-api/src/modules/*/*.schemas.js` —
// whenever a schema changes there, the matching type here MUST change
// too. We chose hand-written over generated to keep the surface small
// and so the comments here can explain meaning beyond the wire shape.
//
// Adding a new endpoint? Add (a) a Request type, (b) a Response type,
// (c) a thin wrapper in `@/lib/api.ts` that posts/gets it. That's it.

import type { FightStatusValue } from '@/constants'

// ===========================================================================
// Canonical error envelope (every non-2xx response from the API).
//
// Backend definition: cockfigh-offline-betting-api/src/lib/api-schemas.js
// Always the same shape. The `code` is the contract; `message` is
// human-readable; `details` varies per code (field list for 400,
// conflicting state for 409, etc.).
// ===========================================================================
export interface ApiErrorBody {
  error: {
    code: string
    message: string
    details?: unknown
  }
}

// ===========================================================================
// Auth
// ===========================================================================

export type UserRole = 'TELLER' | 'ADMIN'

/**
 * Public user shape — what the API returns from /auth/login and /auth/me.
 * Never includes the stored password, `isActive`, or timestamps; admin
 * `GET /users` responses use a richer shape (see backend `adminUser`).
 */
export interface PublicUser {
  id: string
  username: string
  fullName: string
  /** 3-char uppercase initials derived from username (e.g. "ADM"). */
  initials: string
  role: UserRole
}

export interface LoginRequest {
  username: string
  password: string
}

export interface LoginResponse {
  /** Signed JWT. Pass as `Authorization: Bearer <token>` on every
      protected request. 30-day lifetime by default (server-configurable
      via JWT_EXPIRES_IN). */
  token: string
  user: PublicUser
}

export interface MeResponse {
  user: PublicUser
}

export interface ChangePasswordRequest {
  currentPassword: string
  newPassword: string
}

export interface ChangePasswordResponse {
  ok: true
  message: string
}

export interface LogoutResponse {
  ok: true
  message: string
}

// ===========================================================================
// Users (admin `GET/POST /users`)
// ===========================================================================

/** Admin list/detail projection — matches `adminUserSchema` on the API. */
export interface AdminUser {
  id: string
  username: string
  fullName: string
  initials: string
  role: UserRole
  isActive: boolean
  createdAt: string
  updatedAt: string
}

/** `POST /users` body. Username first 3 chars must be letters (bet-ticket stamp). */
export interface CreateUserRequest {
  username: string
  password: string
  fullName: string
  role: UserRole
}

export interface CreateUserResponse {
  user: AdminUser
}

/** `GET /users` query — all keys optional; omit filters to return everyone. */
export interface ListUsersQuery {
  role?: UserRole
  isActive?: boolean
}

export interface ListUsersResponse {
  users: AdminUser[]
}

/** `PATCH /users/:id` — at least one field required on the wire. */
export interface UpdateUserRequest {
  fullName?: string
  isActive?: boolean
}

export interface UpdateUserResponse {
  user: AdminUser
}

/** `POST /users/:id/password` — admin sets a new password (no current password). */
export interface ResetUserPasswordRequest {
  newPassword: string
}

export interface ResetUserPasswordResponse {
  ok: true
}

/** `GET /users/:id/barcode` — admin only; barcode encodes teller login password. */
export interface TellerLoginBarcodeResponse {
  username: string
  fullName: string
  initials: string
  barcodeValue: string
}

// ===========================================================================
// Collectors (`POST/GET/PATCH /collectors`)
// ===========================================================================

/** Full collector row — matches `collectorSchema` on the API. */
export interface Collector {
  id: string
  /** Scannable badge code, e.g. `COL` + 5 chars; issued at create. */
  code: string
  name: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

/** `POST /collectors` body — only `name`; server normalizes whitespace. */
export interface GetCollectorByCodeResponse {
  collector: Collector
}

export interface CreateCollectorRequest {
  name: string
}

export interface CreateCollectorResponse {
  collector: Collector
}

/** `GET /collectors` — optional `isActive` filter. */
export interface ListCollectorsQuery {
  isActive?: boolean
}

export interface ListCollectorsResponse {
  collectors: Collector[]
}

/** `PATCH /collectors/:id` — rename and/or retire (soft). */
export interface UpdateCollectorRequest {
  name?: string
  isActive?: boolean
}

export interface UpdateCollectorResponse {
  collector: Collector
}

// ===========================================================================
// Settings — singleton `GET/PATCH /settings`
// ===========================================================================

/** Matches `settingSchema` on the API; `commissionRate` is a decimal string on the wire. */
export interface Setting {
  id: 'singleton'
  commissionRate: string
  updatedAt: string
}

export interface GetSettingsResponse {
  setting: Setting
}

/** `PATCH /settings` — `commissionRate` as a fraction 0–0.3 (e.g. 0.15 = 15%). */
export interface UpdateSettingsRequest {
  commissionRate: number
}

export interface UpdateSettingsResponse {
  setting: Setting
}

/** `GET /settings/admin-void-barcode` — admin only; barcode encodes fixed void secret. */
export interface AdminVoidBarcodeResponse {
  username: string
  barcodeValue: string
}

// ===========================================================================
// Session — `GET /session/preview`, `POST /session/reset`, `GET /session/resets`
// ===========================================================================

export interface SessionResetInvariantFlag {
  violated: boolean
  count: number
}

export interface SessionResetNonZeroBalanceTeller {
  tellerId: string
  username: string
  fullName: string
  balance: string
}

export interface SessionResetInvariants {
  unfinishedFights: SessionResetInvariantFlag
  unpaidWinningBets: SessionResetInvariantFlag
  nonZeroBalances: {
    violated: boolean
    tellerCount: number
    tellers?: SessionResetNonZeroBalanceTeller[]
  }
}

export interface SessionPreviewResponse {
  counts: {
    fights: number
    bets: number
    /** All teller ledger rows (bet-linked rows included). */
    ledger: number
    /** Cash advances from collectors + remits back only. */
    collectorCash: number
  }
  invariants: SessionResetInvariants
  canResetCleanly: boolean
}

export interface SessionResetRow {
  id: string
  performedAt: string
  performedByUserId: string
  performedByUsername?: string | null
  performedByFullName?: string | null
  fightCount: number
  betCount: number
  ledgerCount: number
  /** CASH_ADVANCE + REMIT rows wiped; null on older audit rows. */
  collectorCashCount: number | null
  notes: string | null
  forced: boolean
}

export interface ResetSessionRequest {
  confirm: 'WIPE-SESSION'
  password: string
  notes?: string
  force?: boolean
}

export interface ResetSessionResponse {
  sessionReset: SessionResetRow
}

export interface ListSessionResetsQuery {
  limit?: number
  cursor?: string
}

export interface ListSessionResetsResponse {
  resets: SessionResetRow[]
  nextCursor: string | null
}

// ===========================================================================
// Fights — `GET/POST /fights`, lifecycle, side hold (see fights.schemas.js)
// ===========================================================================

/** `FightOutcome` on the wire — includes Prisma `CANCELLED` for legacy rows. */
export type FightOutcomeWire = 'MERON' | 'WALA' | 'DRAW' | 'CANCELLED'

/** Body for `POST /fights/:id/settle` — fraction outcomes only (no `CANCELLED`). */
export type SettleFightOutcome = 'MERON' | 'WALA' | 'DRAW'

export interface Fight {
  id: string
  fightNumber: number
  status: FightStatusValue
  /** Decimal string fraction, e.g. `"0.1000"` = 10%. */
  commissionRate: string
  meronPool: string
  walaPool: string
  meronOdds: number | null
  walaOdds: number | null
  meronAcceptingBets: boolean
  meronHeldAt: string | null
  meronHeldByUserId: string | null
  walaAcceptingBets: boolean
  walaHeldAt: string | null
  walaHeldByUserId: string | null
  outcome: FightOutcomeWire | null
  payoutRatioMeron: string | null
  payoutRatioWala: string | null
  openedAt: string | null
  closedAt: string | null
  settledAt: string | null
  cancelledAt: string | null
  previousOutcome: FightOutcomeWire | null
  previousPayoutRatioMeron: string | null
  previousPayoutRatioWala: string | null
  correctedAt: string | null
  correctedByUserId: string | null
  correctionReason: string | null
  createdAt: string
  updatedAt: string
}

export interface ListFightsQuery {
  status?: FightStatusValue
  current?: boolean
  limit?: number
  cursor?: string
}

export interface ListFightsResponse {
  fights: Fight[]
  nextCursor: string | null
}

export interface GetFightResponse {
  fight: Fight
}

export interface CreateFightResponse {
  fight: Fight
}

export interface FightActionResponse {
  fight: Fight
  replay?: boolean
}

export interface SettleFightRequest {
  outcome: SettleFightOutcome
}

export interface CancelFightRequest {
  reason?: string
}

export interface CorrectFightRequest {
  outcome: SettleFightOutcome
  reason: string
}

/** Snapshot inside `WELCOME` / WS frames — see `loadCurrentFightSnapshot` in the API. */
export interface FightWelcomeSnapshot {
  id: string
  fightNumber: number
  status: FightStatusValue
  commissionRate: string
  meronPool: string
  walaPool: string
  meronOdds: number | null
  walaOdds: number | null
  meronAcceptingBets: boolean
  walaAcceptingBets: boolean
  outcome: FightOutcomeWire | null
  payoutRatioMeron: string | null
  payoutRatioWala: string | null
}

// ===========================================================================
// Bets — `GET /bets` (list; teller-scoped unless admin)
// ===========================================================================

export type BetStatusWire =
  | 'PENDING'
  | 'WON'
  | 'LOST'
  | 'PAID'
  | 'VOIDED'
  | 'PENDING_REFUND'
  | 'REFUNDED'

export type BetSideWire = 'MERON' | 'WALA'

/** Row from `GET /bets` detail payloads — matches `betSchema` on the API. */
export interface BetRow {
  id: string
  code: string
  clientRequestId: string
  fightId: string
  tellerId: string
  tellerNameSnapshot?: string
  tellerInitialsSnapshot?: string
  amount: string
  side: BetSideWire
  status: BetStatusWire
  payoutAmount: string | null
  paidAt: string | null
  paidByUserId: string | null
  voidedAt: string | null
  voidedByUserId: string | null
  voidReason: string | null
  previousStatus: BetStatusWire | null
  previousPayoutAmount: string | null
  correctedAt: string | null
  createdAt: string
  updatedAt: string
}

/** `GET /bets` list rows include joined fight context for dashboards. */
export interface BetListRow extends BetRow {
  fightNumber: number
  fightStatus: FightStatusValue
  meronOdds: number | null
  walaOdds: number | null
  payoutRatioMeron: string | null
  payoutRatioWala: string | null
  /** Settled or cancelled timestamp — dashboard ages off unpaid rows after configured window. */
  fightEndedAt: string | null
}

export interface ListBetsQuery {
  fightId?: string
  tellerId?: string
  status?: BetStatusWire
  side?: BetSideWire
  since?: string
  limit?: number
  cursor?: string
}

export interface ListBetsResponse {
  bets: BetListRow[]
  nextCursor: string | null
}

/** Fight summary returned with bet payloads (placement, lookup, pay). */
export interface PlaceBetFightSummary {
  id: string
  fightNumber: number
  status: FightStatusValue
  outcome?: FightOutcomeWire | null
  meronPool: string
  walaPool: string
  meronOdds: number | null
  walaOdds: number | null
  payoutRatioMeron: string | null
  payoutRatioWala: string | null
}

export interface BetByCodeResponse {
  bet: BetRow
  fight: PlaceBetFightSummary
}

export interface PlaceBetRequest {
  clientRequestId: string
  fightId: string
  side: BetSideWire
  amount: number
}

export interface PlaceBetResponse {
  bet: BetRow
  fight: PlaceBetFightSummary
  replay?: boolean
  actorBalance: string
}

export interface PayBetResponse {
  bet: BetRow
  fight: PlaceBetFightSummary
  replay: boolean
  actorBalance: string
}

export interface VoidBetRequest {
  adminPassword: string
  reason?: string
}

export interface VoidBetResponse {
  bet: BetRow
  fight: PlaceBetFightSummary
  replay: boolean
  actorBalance: string
}

// ===========================================================================
// Cash — `GET /cash/balance`, `GET /cash/ledger`
// ===========================================================================

export interface CashBalanceResponse {
  tellerId: string
  username: string
  fullName: string
  balance: string
}

export type LedgerEntryTypeWire =
  | 'CASH_ADVANCE'
  | 'BET_PLACED'
  | 'BET_VOIDED'
  | 'BET_REFUNDED'
  | 'PAYOUT'
  | 'REMIT'
  | 'ADJUSTMENT'

export interface LedgerEntryRow {
  id: string
  code: string | null
  tellerId: string
  type: LedgerEntryTypeWire
  amount: string
  betId: string | null
  collectorId: string | null
  collectorName?: string | null
  adjustedByUserId: string | null
  notes: string | null
  createdAt: string
  /** Present when the ledger row is joined to a bet (e.g. PAYOUT). */
  betAmount?: string | null
  betSide?: 'MERON' | 'WALA' | null
  betPayoutAmount?: string | null
  payoutRatioMeron?: string | null
  payoutRatioWala?: string | null
}

export interface ListLedgerQuery {
  tellerId?: string
  type?: LedgerEntryTypeWire
  since?: string
  until?: string
  limit?: number
  cursor?: string
}

export interface ListLedgerResponse {
  entries: LedgerEntryRow[]
  nextCursor: string | null
}

export interface CashAdvanceRequest {
  /** ADMIN only — omit when teller records own deposit. */
  tellerId?: string
  collectorCode: string
  amount: number
  notes?: string
}

export interface CashRemitRequest {
  collectorCode: string
  amount: number
  notes?: string
}

export interface CashMutationResponse {
  ledgerEntry: LedgerEntryRow
  actorBalance: string
}

// ===========================================================================
// Reports — `GET /reports/teller-commissions` (admin)
// ===========================================================================

export interface TellerCommissionRow {
  tellerId: string
  username: string
  fullName: string
  isActive: boolean
  betCount: number
  grossHandle: string
  winningStake: string
  losingStake: string
  commissionGenerated: string
}

export interface TellerCommissionsTotals {
  tellerCount: number
  betCount: number
  grossHandle: string
  commissionGenerated: string
}

export interface TellerCommissionsResponse {
  scope: {
    since: string | null
    until: string | null
    fightId: string | null
    includeInactive: boolean
  }
  tellers: TellerCommissionRow[]
  totals: TellerCommissionsTotals
}

// ===========================================================================
// Reports — `GET /reports/fight-commissions` (admin)
// ===========================================================================

export interface FightCommissionRow {
  fightId: string
  fightNumber: number
  status: string
  outcome: string | null
  commissionRate: string
  grossHandle: string
  commission: string
  betCount: number
  pendingBetCount: number
  wasCorrected: boolean
  settledAt: string | null
}

export interface FightCommissionsTotals {
  fightCount: number
  betCount: number
  grossHandle: string
  commission: string
}

export interface FightCommissionsResponse {
  scope: {
    since: string | null
    until: string | null
  }
  fights: FightCommissionRow[]
  totals: FightCommissionsTotals
}
