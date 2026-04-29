import { GOOGLE_SHEETS_API_URL } from '../constants/pricingConstants';

export const QUOTE_HISTORY_REFRESH_EVENT = 'quote-history:refresh';

const DEFAULT_LIMIT = 100;

function getAppsScriptUrl() {
  const viteUrl = typeof import.meta !== 'undefined' ? import.meta.env?.VITE_APPS_SCRIPT_URL : '';
  const craUrl = typeof process !== 'undefined' ? process.env?.REACT_APP_APPS_SCRIPT_URL : '';
  return viteUrl || craUrl || GOOGLE_SHEETS_API_URL || '';
}

function buildQuotesUrl({ limit, offset, search, category }) {
  const baseUrl = getAppsScriptUrl();
  if (!baseUrl) return '';

  const url = new URL(baseUrl);
  url.searchParams.set('action', 'getQuotes');
  url.searchParams.set('limit', String(limit));
  url.searchParams.set('offset', String(offset));
  if (search) url.searchParams.set('search', search);
  if (category) url.searchParams.set('category', category);
  return url.toString();
}

function buildSaveQuoteUrl() {
  const baseUrl = getAppsScriptUrl();
  if (!baseUrl) return '';

  const url = new URL(baseUrl);
  url.searchParams.set('action', 'saveQuote');
  return url.toString();
}

export async function fetchQuotes({ limit = DEFAULT_LIMIT, offset = 0, search = '', category = '' } = {}) {
  const url = buildQuotesUrl({ limit, offset, search, category });
  if (!url) {
    console.error('[CRITICAL] Missing API URL');
    return [];
  }

  try {
    const response = await fetch(url, { redirect: 'follow' });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    return Array.isArray(data) ? data : data.quotes || [];
  } catch (error) {
    console.error('Failed to fetch quote history:', error);
    throw error;
  }
}

export async function saveQuote(quotePayload) {
  const url = buildSaveQuoteUrl();
  if (!url) {
    console.error('[CRITICAL] Missing API URL');
    throw new Error('Thiếu URL Apps Script để lưu báo giá.');
  }

  try {
    const response = await fetch(url, {
      method: 'POST',
      redirect: 'follow',
      body: JSON.stringify(quotePayload),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    if (!data.ok) {
      throw new Error(data.error || 'Không lưu được báo giá.');
    }

    notifyQuoteSaved(data.quote);
    return data.quote;
  } catch (error) {
    console.error('Failed to save quote:', error);
    throw error;
  }
}

export function notifyQuoteSaved(detail = {}) {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(QUOTE_HISTORY_REFRESH_EVENT, { detail }));
}
