// Collector display name — client validation + normalization.
//
// MUST stay aligned with `collectors.service.js` `normalizeName()`:
// trim + collapse internal whitespace. Fastify schema only enforces
// minLength/maxLength on the *wire* string; the service rejects empty
// post-normalization, so we mirror that here to avoid pointless round-trips.

/** Same normalization as the API before length checks. */
export function normalizeCollectorName(raw: string): string {
  return raw.trim().replace(/\s+/g, ' ')
}

const NAME_MIN = 2
const NAME_MAX = 80

/** `undefined` = valid. Mirrors `createCollectorRequestSchema` + service empty check. */
export function getCreateCollectorNameError(raw: string): string | undefined {
  const n = normalizeCollectorName(raw)
  if (n.length === 0) {
    return 'Name cannot be empty or whitespace-only.'
  }
  if (n.length < NAME_MIN) {
    return `At least ${NAME_MIN} characters after trimming (Filipino-style names; single-letter labels are rejected).`
  }
  if (n.length > NAME_MAX) {
    return `At most ${NAME_MAX} characters.`
  }
  return undefined
}
