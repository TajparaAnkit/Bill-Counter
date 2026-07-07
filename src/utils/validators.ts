export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePassword = (password: string): { valid: boolean; message: string } => {
  if (password.length < 6) {
    return { valid: false, message: 'Password must be at least 6 characters' };
  }
  if (!/[A-Z]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one uppercase letter' };
  }
  if (!/[0-9]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one number' };
  }
  return { valid: true, message: '' };
};

export const parseFirebaseError = (error: any): string => {
  const candidates = [
    error?.code,
    error?.message,
    error?.response?.data?.error?.message,
  ]
    .filter(Boolean)
    .map((value) => String(value).trim().toLowerCase());

  const errorMap: Record<string, string> = {
    'auth/email-already-in-use': 'Email already registered. Try logging in instead.',
    'email_exists': 'Email already registered. Try logging in instead.',
    'email-exists': 'Email already registered. Try logging in instead.',
    'auth/weak-password': 'Password is too weak. Use at least 6 characters with uppercase and numbers.',
    'auth/invalid-email': 'Please enter a valid email address.',
    'auth/user-not-found': 'No account found with this email. Please register first.',
    'auth/wrong-password': 'Incorrect password. Please try again.',
    'auth/too-many-requests': 'Too many attempts. Please try again later.',
    'auth/network-request-failed': 'Network error. Please check your connection.',
    'auth/operation-not-allowed': 'This operation is not allowed. Please contact support.',
    'auth/configuration-not-found': 'Firebase authentication is not configured. Please try again later.',
  };

  for (const candidate of candidates) {
    if (errorMap[candidate]) {
      return errorMap[candidate];
    }
  }

  return error?.message || 'An unexpected error occurred. Please try again.';
};
