export function safeParseNumber(value, fallback = 0) {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : fallback;
  }
  if (value === null || value === undefined) return fallback;

  let normalized = String(value).trim().replace(/\s/g, '');
  if (!normalized) return fallback;

  const isDotThousandsOnly = /^\d{1,3}(\.\d{3})+$/.test(normalized);
  const isCommaThousandsOnly = /^\d{1,3}(,\d{3})+$/.test(normalized);

  if (isDotThousandsOnly) {
    normalized = normalized.replace(/\./g, '');
  } else if (isCommaThousandsOnly) {
    normalized = normalized.replace(/,/g, '');
  } else if (normalized.includes(',') && normalized.includes('.')) {
    normalized = normalized.replace(/\./g, '').replace(',', '.');
  } else if (normalized.includes(',')) {
    normalized = normalized.replace(',', '.');
  }

  const parsed = parseFloat(normalized);
  return Number.isFinite(parsed) ? parsed : fallback;
}
