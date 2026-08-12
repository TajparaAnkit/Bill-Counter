// ---------------------------------------------------------------------------
// Formatting helpers shared across the app.
//
// Firestore returns timestamps as `Timestamp` objects (with a `.toDate()`
// method or a `.seconds` field), but locally-created records use plain `Date`
// or millisecond numbers. These helpers normalise all of those shapes and
// centralise our currency/date formatting so every screen renders values the
// same way.
// ---------------------------------------------------------------------------

/**
 * Normalise any timestamp-ish value (Firestore Timestamp, Date, ms number, or
 * `{ seconds }` object) to a `Date`. Returns `null` when the value is missing
 * or unparseable.
 */
export const toDate = (value: any): Date | null => {
  if (!value) return null;
  if (typeof value.toDate === 'function') return value.toDate(); // Firestore Timestamp
  if (typeof value.seconds === 'number') return new Date(value.seconds * 1000);
  const d = new Date(value);
  return isNaN(d.getTime()) ? null : d;
};

/** Milliseconds since epoch for a timestamp-ish value; `0` when unknown. */
export const toMillis = (value: any): number => {
  const d = toDate(value);
  return d ? d.getTime() : 0;
};

/**
 * Format a number using the Indian locale grouping, without a currency symbol.
 * e.g. `123456` → `"1,23,456.00"`.
 */
export const formatAmount = (n: number): string =>
  Number(n || 0).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

/** Same as {@link formatAmount} but prefixed with the ₹ symbol. */
export const formatCurrency = (n: number): string => `₹${formatAmount(n)}`;

/**
 * Short, human-friendly date, e.g. `"09 Jul 2026"`. Returns `"N/A"` for
 * missing/unparseable values.
 */
export const formatDate = (value: any): string => {
  const d = toDate(value);
  return d
    ? d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
    : 'N/A';
};
