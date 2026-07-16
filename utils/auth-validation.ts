type PasswordValidationResult = {
  valid: boolean;
  message: string | null;
};

export function validateEmail(email: string): PasswordValidationResult {
  const trimmed = email.trim();

  if (!trimmed) {
    return { valid: false, message: 'Enter your email address.' };
  }

  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailPattern.test(trimmed)) {
    return { valid: false, message: 'Enter a valid email address.' };
  }

  return { valid: true, message: null };
}

export function validatePassword(password: string): PasswordValidationResult {
  if (!password) {
    return { valid: false, message: 'Enter your password.' };
  }

  if (password.length < 8) {
    return { valid: false, message: 'Password must be at least 8 characters.' };
  }

  return { valid: true, message: null };
}

export function validatePasswordConfirmation(
  password: string,
  confirmPassword: string,
): PasswordValidationResult {
  if (!confirmPassword) {
    return { valid: false, message: 'Confirm your password.' };
  }

  if (password !== confirmPassword) {
    return { valid: false, message: 'Passwords do not match.' };
  }

  return { valid: true, message: null };
}

export function getAuthErrorMessage(error: { message?: string } | null): string {
  if (!error?.message) {
    return 'Something went wrong. Please try again.';
  }

  const message = error.message.toLowerCase();

  if (message.includes('invalid login credentials')) {
    return 'Incorrect email or password.';
  }

  if (message.includes('user already registered')) {
    return 'An account with this email already exists. Sign in instead.';
  }

  if (message.includes('password should be at least')) {
    return 'Password must be at least 8 characters.';
  }

  if (message.includes('unable to validate email address') || message.includes('invalid email')) {
    return 'Enter a valid email address.';
  }

  if (message.includes('email not confirmed')) {
    return 'Confirm your email before signing in.';
  }

  if (message.includes('network') || message.includes('fetch')) {
    return 'Network error. Check your connection and try again.';
  }

  return error.message;
}
