/**
 * Maps Supabase Auth errors and PostgreSQL messages to plain, user-friendly feedback.
 * Prevents leaking technical internal error codes to ordinary users.
 */
export function formatAuthError(error: unknown): string {
  if (!error) return 'An unexpected error occurred. Please try again.'

  const message = error instanceof Error ? error.message : String(error)
  const lower = message.toLowerCase()

  if (lower.includes('invalid login credentials') || lower.includes('invalid_grant')) {
    return 'Incorrect email or password. Please verify your details.'
  }

  if (lower.includes('email not confirmed')) {
    return 'Your email has not been confirmed yet. Please check your inbox.'
  }

  if (lower.includes('rate limit') || lower.includes('too many requests')) {
    return 'Too many login attempts. Please wait a few moments before trying again.'
  }

  if (lower.includes('user already registered') || lower.includes('already exists')) {
    return 'An account with this email is already registered.'
  }

  if (lower.includes('token has expired') || lower.includes('otp expired')) {
    return 'This link has expired. Please request a new recovery or invitation link.'
  }

  if (lower.includes('suspended')) {
    return 'Your portal access has been suspended. Please contact an administrator.'
  }

  if (lower.includes('disabled')) {
    return 'This portal account has been disabled.'
  }

  if (lower.includes('network') || lower.includes('failed to fetch')) {
    return 'Unable to connect to the server. Please check your internet connection.'
  }

  return 'We could not complete your request. Please try again.'
}

export const getFriendlyAuthErrorMessage = formatAuthError

