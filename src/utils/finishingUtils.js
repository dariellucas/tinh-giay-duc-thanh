import { safeParseNumber } from './numberUtils';

export function findFinishingByName(finishingDatabase, name) {
  const target = String(name || '').trim().toLowerCase();
  return (finishingDatabase || []).find(
    (item) => String(item?.item || '').trim().toLowerCase() === target,
  );
}

function warnMissingFinishingRows(processName, missingNames) {
  if (missingNames.length > 0) {
    console.warn(`[${processName}] Không tìm thấy dòng GiaCong: ${missingNames.join(', ')}`);
  }
}

export function calculateFoilCost(finishingDatabase, lengthCm, widthCm, quantity, extraSheets = 0) {
  const dieRow = findFinishingByName(finishingDatabase, 'Khuôn nhũ');
  const areaRow = findFinishingByName(finishingDatabase, 'Ép nhũ theo cm');
  const hitRow = findFinishingByName(finishingDatabase, 'Ép nhũ theo nhát');
  const missingRows = [];

  if (!dieRow) missingRows.push('Khuôn nhũ');
  if (!areaRow) missingRows.push('Ép nhũ theo cm');
  if (!hitRow) missingRows.push('Ép nhũ theo nhát');
  warnMissingFinishingRows('calculateFoilCost', missingRows);

  const dieUnitPrice = dieRow ? safeParseNumber(dieRow.price) : 0;
  const dieMin = dieRow ? safeParseNumber(dieRow.minPrice) : 0;
  const pricePerCm2 = areaRow ? safeParseNumber(areaRow.price) : 0;
  const pricePerHit = hitRow ? safeParseNumber(hitRow.price) : 0;
  const areaCm2 = safeParseNumber(lengthCm) * safeParseNumber(widthCm);
  const dieBaseCost = areaCm2 * dieUnitPrice;
  const dieCost = Math.max(dieBaseCost, dieMin);
  const costByArea = areaCm2 * pricePerCm2;
  const costPerUnit = Math.max(costByArea, pricePerHit);
  const totalImpressions = safeParseNumber(quantity) + safeParseNumber(extraSheets);
  const impressionCost = costPerUnit * totalImpressions;

  return {
    dieCost,
    dieMin,
    impressionCost,
    totalCost: dieCost + impressionCost,
    details: {
      areaCm2,
      dieUnitPrice,
      dieBaseCost,
      pricePerCm2,
      pricePerHit,
      costPerUnit,
      totalImpressions,
      missingRows,
    },
  };
}

export function calculateEmbossCost(finishingDatabase, lengthCm, widthCm, quantity, extraSheets = 0) {
  const dieRow = findFinishingByName(finishingDatabase, 'Khuôn thúc nổi');
  const hitRow = findFinishingByName(finishingDatabase, 'Lượt thúc nổi');
  const missingRows = [];

  if (!dieRow) missingRows.push('Khuôn thúc nổi');
  if (!hitRow) missingRows.push('Lượt thúc nổi');
  warnMissingFinishingRows('calculateEmbossCost', missingRows);

  const dieUnitPrice = dieRow ? safeParseNumber(dieRow.price) : 0;
  const dieMin = dieRow ? safeParseNumber(dieRow.minPrice) : 0;
  const length = safeParseNumber(lengthCm);
  const width = safeParseNumber(widthCm);
  const areaCm2 = length * width;
  const dieBaseCost = areaCm2 * dieUnitPrice;
  const dieCost = Math.max(dieBaseCost, dieMin);
  const pricePerHit = hitRow ? safeParseNumber(hitRow.price) : 0;
  const totalImpressions = safeParseNumber(quantity) + safeParseNumber(extraSheets);
  const impressionCost = pricePerHit * totalImpressions;

  return {
    dieCost,
    dieMin,
    impressionCost,
    totalCost: dieCost + impressionCost,
    details: {
      lengthCm: length,
      widthCm: width,
      areaCm2,
      dieUnitPrice,
      dieBaseCost,
      pricePerHit,
      totalImpressions,
      missingRows,
    },
  };
}

export function filterPrintersBySize(printers, reqMax, reqMin) {
  const requiredMax = Number(reqMax) || 0;
  const requiredMin = Number(reqMin) || 0;

  return (printers || []).filter((printer) => {
    const normalizedName = String(printer?.name || '').replace(/,/g, '.');
    const match = normalizedName.match(/(\d+(?:\.\d+)?)\s*[xX×]\s*(\d+(?:\.\d+)?)/);

    if (!match) {
      return true;
    }

    const first = Number(match[1]) || 0;
    const second = Number(match[2]) || 0;
    const printerMax = Math.max(first, second);
    const printerMin = Math.min(first, second);

    return printerMax >= requiredMax && printerMin >= requiredMin;
  });
}
