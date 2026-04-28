export function findFinishingByName(finishingDatabase, name) {
  const target = String(name || '').trim().toLowerCase();
  return (finishingDatabase || []).find(
    (item) => String(item?.item || '').trim().toLowerCase() === target,
  );
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
