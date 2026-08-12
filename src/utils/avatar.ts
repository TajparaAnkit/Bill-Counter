// ---------------------------------------------------------------------------
// Avatar helpers — deterministic initials + gradient colour for a given name.
// Used by the customer/bill tables so the same person always gets the same
// coloured initials avatar.
// ---------------------------------------------------------------------------

/** Tailwind gradient class pairs used for avatar backgrounds. */
export const AVATAR_GRADIENTS = [
  'from-blue-600 to-indigo-600',
  'from-sky-500 to-blue-500',
  'from-violet-500 to-purple-500',
  'from-amber-500 to-orange-500',
  'from-rose-500 to-pink-500',
];

/** Up to two uppercase initials from a name, e.g. `"Ankit Patel"` → `"AP"`. */
export const getInitials = (name?: string): string => {
  const parts = (name || '').trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  return (parts[0][0] + (parts[1]?.[0] || '')).toUpperCase();
};

/**
 * Pick a stable gradient class for a name (same name → same colour) by hashing
 * its character codes into the {@link AVATAR_GRADIENTS} palette.
 */
export const avatarGradient = (name?: string): string => {
  const code = (name || '').split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return AVATAR_GRADIENTS[code % AVATAR_GRADIENTS.length];
};
