import { GOOGLE_SHEETS_API_URL } from '../constants/pricingConstants';

export function getAppsScriptUrl() {
  const viteUrl = typeof import.meta !== 'undefined' ? import.meta.env?.VITE_APPS_SCRIPT_URL : '';
  const craUrl = typeof process !== 'undefined' ? process.env?.REACT_APP_APPS_SCRIPT_URL : '';
  return viteUrl || craUrl || GOOGLE_SHEETS_API_URL || '';
}

export function buildAppsScriptUrl(action) {
  const baseUrl = getAppsScriptUrl();
  if (!baseUrl) return '';

  const url = new URL(baseUrl);
  if (action) url.searchParams.set('action', action);
  return url;
}
