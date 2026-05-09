import { getAuthToken } from './authService';
import { buildAppsScriptUrl } from './appScriptConfig';

export const QUOTE_HISTORY_REFRESH_EVENT = 'quote-history:refresh';

const DEFAULT_LIMIT = 100;

function buildQuotesUrl({ limit, offset, search, category, quotedBy }) {
  const url = buildAppsScriptUrl('getQuotes');
  if (!url) return '';

  url.searchParams.set('limit', String(limit));
  url.searchParams.set('offset', String(offset));
  url.searchParams.set('authToken', getAuthToken());
  if (search) url.searchParams.set('search', search);
  if (category) url.searchParams.set('category', category);
  if (quotedBy) url.searchParams.set('quotedBy', quotedBy);
  return url.toString();
}

function buildQuoteMutationUrl(action) {
  const url = buildAppsScriptUrl(action);
  return url ? url.toString() : '';
}

export async function fetchQuotes({ limit = DEFAULT_LIMIT, offset = 0, search = '', category = '', quotedBy = '' } = {}) {
  const url = buildQuotesUrl({ limit, offset, search, category, quotedBy });
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
    if (data?.ok === false) {
      throw new Error(data.error || 'Không tải được lịch sử báo giá.');
    }
    return Array.isArray(data) ? data : data.quotes || [];
  } catch (error) {
    console.error('Failed to fetch quote history:', error);
    throw error;
  }
}

export async function saveQuote(quotePayload) {
  const url = buildQuoteMutationUrl('saveQuote');
  if (!url) {
    console.error('[CRITICAL] Missing API URL');
    throw new Error('Thiếu URL Apps Script để lưu báo giá.');
  }

  try {
    const response = await fetch(url, {
      method: 'POST',
      redirect: 'follow',
      body: JSON.stringify({
        ...quotePayload,
        authToken: getAuthToken(),
      }),
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

export async function updateQuote(quotePayload) {
  const url = buildQuoteMutationUrl('updateQuote');
  if (!url) {
    console.error('[CRITICAL] Missing API URL');
    throw new Error('Thiếu URL Apps Script để cập nhật báo giá.');
  }

  try {
    const response = await fetch(url, {
      method: 'POST',
      redirect: 'follow',
      body: JSON.stringify({
        ...quotePayload,
        authToken: getAuthToken(),
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    if (!data.ok) {
      throw new Error(data.error || 'Không cập nhật được báo giá.');
    }

    notifyQuoteSaved(data.quote);
    return data.quote;
  } catch (error) {
    console.error('Failed to update quote:', error);
    throw error;
  }
}

export function notifyQuoteSaved(detail = {}) {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(QUOTE_HISTORY_REFRESH_EVENT, { detail }));
}
