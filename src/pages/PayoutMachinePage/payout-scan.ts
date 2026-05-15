export const TICKET_CODE_MAX = 8

export function sanitizeTicketInput(raw: string): string {
  return raw.replace(/[^A-Za-z0-9]/g, '').toUpperCase().slice(0, TICKET_CODE_MAX)
}

export function isCompleteTicketCode(code: string): boolean {
  return sanitizeTicketInput(code).length === TICKET_CODE_MAX
}
