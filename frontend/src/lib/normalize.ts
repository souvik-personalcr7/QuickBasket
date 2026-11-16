/**
 * Normalizes email address:
 * - Trims leading and trailing whitespace
 * - Converts to lowercase for case-insensitive uniqueness
 */
export function normalizeEmail(rawEmail: string): string {
  if (!rawEmail || typeof rawEmail !== 'string') return '';
  return rawEmail.trim().toLowerCase();
}

/**
 * Normalizes phone number into a canonical E.164-style format:
 * - Strips whitespace, dashes, brackets, and punctuation
 * - Resolves international prefixes (e.g. '00' -> '+')
 * - Automatically defaults standard 10-digit Indian numbers to '+91<digits>'
 * - Strips leading trunk '0' for 11-digit numbers (e.g. '09876543210' -> '+919876543210')
 * - Ensures consistent '+<countryCode><digits>' representation
 */
export function normalizePhoneNumber(rawPhone: string): string {
  if (!rawPhone || typeof rawPhone !== 'string') return '';

  let cleaned = rawPhone.trim().replace(/[\s\-\(\)\.]/g, '');

  if (cleaned.startsWith('00')) {
    cleaned = '+' + cleaned.slice(2);
  }

  const hasLeadingPlus = cleaned.startsWith('+');
  const digitsOnly = cleaned.replace(/\D/g, '');

  if (!digitsOnly) return '';

  if (hasLeadingPlus) {
    return `+${digitsOnly}`;
  }

  // 10-digit mobile number -> default to +91
  if (digitsOnly.length === 10) {
    return `+91${digitsOnly}`;
  }

  // 11 digits starting with 0 -> replace leading 0 with +91
  if (digitsOnly.length === 11 && digitsOnly.startsWith('0')) {
    return `+91${digitsOnly.slice(1)}`;
  }

  // 12 digits starting with 91 -> prepend +
  if (digitsOnly.length === 12 && digitsOnly.startsWith('91')) {
    return `+${digitsOnly}`;
  }

  return `+${digitsOnly}`;
}

