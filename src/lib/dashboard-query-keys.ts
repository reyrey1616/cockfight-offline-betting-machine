/** Prefix for queries that should refresh from realtime WebSocket events. */
export const DASHBOARD_LIVE_QUERY_PREFIX = ['dashboard', 'live'] as const

/** Prefix for all dashboard tables (including manual refresh). */
export const DASHBOARD_QUERY_PREFIX = ['dashboard'] as const
