const E164_PATTERN = /^\+[1-9]\d{1,14}$/

/** Checks E.164 format (+ followed by 1-15 digits, no spaces/dashes). */
export function isValidE164(value: string): boolean {
  return E164_PATTERN.test(value)
}

/** Strips everything but leading "+" and digits -- does not add a country code. */
export function normalizePhoneInput(value: string): string {
  const trimmed = value.trim()
  const hasPlus = trimmed.startsWith('+')
  const digits = trimmed.replace(/[^\d]/g, '')
  return hasPlus ? `+${digits}` : digits
}
