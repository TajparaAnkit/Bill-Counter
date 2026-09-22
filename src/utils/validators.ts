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

// ---- GST party validators (India) ----

// GSTIN: 2-digit state code, 10-char PAN, entity number, 'Z', checksum char.
export const validateGSTIN = (gstin: string): boolean => {
  const v = gstin.trim().toUpperCase();
  if (!v) return true; // optional field
  return /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(v);
};

// PAN: 5 letters, 4 digits, 1 letter.
export const validatePAN = (pan: string): boolean => {
  const v = pan.trim().toUpperCase();
  if (!v) return true; // optional field
  return /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(v);
};

// Extract the PAN embedded in a GSTIN (characters 3–12).
export const panFromGSTIN = (gstin: string): string => {
  const v = gstin.trim().toUpperCase();
  return validateGSTIN(v) && v.length === 15 ? v.slice(2, 12) : '';
};
