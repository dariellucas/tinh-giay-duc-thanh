import {
  DEFAULT_DINHMUC_DATA,
  DEFAULT_FINISHING_DATA,
  DEFAULT_PAPER_DATA,
  DEFAULT_PRINTER_DATA,
  GOOGLE_SHEETS_API_URL,
} from '../constants/pricingConstants';

const CACHE_KEY = 'pricingDataCacheV1';
const CACHE_TTL_MS = 12 * 60 * 60 * 1000;
const REQUEST_TIMEOUT_MS = 15000;

function parseRolls(rolls) {
  if (!rolls) return [];
  return String(rolls)
    .split(';')
    .map((s) => s.trim())
    .filter(Boolean);
}

export function formatPaperDatabase(rows = []) {
  const formattedData = {};
  rows.forEach((row) => {
    if (!row || !row.paperType || String(row.paperType).trim() === '') return;
    if (!formattedData[row.paperType]) formattedData[row.paperType] = {};
    formattedData[row.paperType][row.gsm] = {
      price: parseFloat(row.price) || 0,
      rolls: parseRolls(row.rolls),
    };
  });
  return formattedData;
}

function getFallbackPayload(errorMessage = '') {
  return {
    paperDatabase: formatPaperDatabase(DEFAULT_PAPER_DATA),
    printerDatabase: DEFAULT_PRINTER_DATA,
    finishingDatabase: DEFAULT_FINISHING_DATA,
    hopMemDatabase: [],
    dinhMucDatabase: DEFAULT_DINHMUC_DATA,
    priceLoadError: errorMessage,
    isFromCache: false,
  };
}

function saveCache(payload) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(
    CACHE_KEY,
    JSON.stringify({
      createdAt: Date.now(),
      payload,
    }),
  );
}

function readValidCache() {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed?.createdAt || !parsed?.payload) return null;
    if (Date.now() - parsed.createdAt > CACHE_TTL_MS) return null;
    return parsed.payload;
  } catch {
    return null;
  }
}

async function fetchWithTimeout(url) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const response = await fetch(url, {
      redirect: 'follow',
      signal: controller.signal,
    });
    return response;
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function loadPricingData() {
  try {
    const response = await fetchWithTimeout(GOOGLE_SHEETS_API_URL);
    const text = await response.text();

    if (text.trim().startsWith('<')) {
      throw new Error('Không lấy được dữ liệu. Đang dùng giá dự phòng.');
    }

    const json = JSON.parse(text);
    const rawPapers = json.papers && json.printers ? json.papers : json.record || json;
    const rawPrinters = json.papers && json.printers ? json.printers : [];
    const rawFinishing = json.finishing || DEFAULT_FINISHING_DATA;
    const rawHopMem = json.hopMem || [];
    const rawDinhMuc = json.dinhMuc || DEFAULT_DINHMUC_DATA;

    const paperDatabase = formatPaperDatabase(rawPapers);
    if (Object.keys(paperDatabase).length === 0) throw new Error('Dữ liệu trống.');

    const payload = {
      paperDatabase,
      printerDatabase: rawPrinters.length > 0 ? rawPrinters : DEFAULT_PRINTER_DATA,
      finishingDatabase: rawFinishing.length > 0 ? rawFinishing : DEFAULT_FINISHING_DATA,
      hopMemDatabase: rawHopMem,
      dinhMucDatabase: rawDinhMuc.length > 0 ? rawDinhMuc : DEFAULT_DINHMUC_DATA,
      priceLoadError: '',
      isFromCache: false,
    };

    saveCache(payload);
    return payload;
  } catch (networkError) {
    const cached = readValidCache();
    if (cached) {
      return {
        ...cached,
        priceLoadError: 'Đang dùng dữ liệu cache gần nhất do lỗi kết nối.',
        isFromCache: true,
      };
    }
    return getFallbackPayload(networkError?.message || 'Mất kết nối. Đang dùng bảng giá dự phòng.');
  }
}
