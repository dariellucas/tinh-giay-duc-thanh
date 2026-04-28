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

export function calculatePaperCost(widthCm, heightCm, gsm, sheetsNeeded, pricePerTon) {
  // width/height: cm, gsm: g/m2, sheetsNeeded: sheets, pricePerTon: trieu VND/tan.
  const areaM2 = (safeParseNumber(widthCm) * safeParseNumber(heightCm)) / 10000;
  const weightPerSheetKg = (areaM2 * safeParseNumber(gsm)) / 1000;
  const totalWeightKg = weightPerSheetKg * safeParseNumber(sheetsNeeded);
  const pricePerKg = safeParseNumber(pricePerTon) * 1000; // Gia goc theo tan, quy doi ve kg.

  return totalWeightKg * pricePerKg;
}

export function getSpoilageByQuantity(dinhMucDatabase, soToInLyThuyet, category = 'In') {
  let spoilage = 100; // Gia tri mac dinh theo logic hien co.
  const quantity = parseInt(soToInLyThuyet, 10) || 0;

  if (!dinhMucDatabase || dinhMucDatabase.length === 0) {
    return spoilage;
  }

  const rules = dinhMucDatabase.filter((rule) => rule.category === category);
  for (let i = 0; i < rules.length; i++) {
    const rule = rules[i];
    const fromQ = parseInt(rule.fromQty, 10) || 0;
    const toQ = parseInt(rule.toQty, 10) || 0;
    const spoilVal = parseInt(rule.spoilage, 10) || 0;

    if (quantity >= fromQ && quantity <= toQ) {
      spoilage = spoilVal;
      break;
    }
  }

  return spoilage;
}
