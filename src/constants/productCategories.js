import { Book, BookOpen, Box, FileText, Mail, ShoppingBag, StickyNote } from 'lucide-react';

export const PRODUCT_CATEGORIES = [
  { id: 'toroi', label: 'Tờ rời', tabId: 'toroi', icon: FileText, canCreateQuote: true },
  { id: 'catalogue', label: 'Catalogue', tabId: 'catalogue', icon: BookOpen, canCreateQuote: true },
  { id: 'vo', label: 'Vở', tabId: 'vo', icon: Book, canCreateQuote: false },
  { id: 'hopmem', label: 'Hộp mềm', tabId: 'hopmem', icon: Box, canCreateQuote: true },
  { id: 'tuigiay', label: 'Túi giấy', tabId: 'tuigiay', icon: ShoppingBag, canCreateQuote: true },
  { id: 'phongbi', label: 'Phong bì', tabId: 'phongbi', icon: Mail, canCreateQuote: false },
  { id: 'decal', label: 'Decal', tabId: 'decal', icon: StickyNote, canCreateQuote: false },
];

export const DEFAULT_QUOTE_CATEGORY = 'Tờ rời';

export function getProductCategoryByLabel(label) {
  const normalizedLabel = String(label || '').trim().toLowerCase();
  return PRODUCT_CATEGORIES.find((category) => category.label.toLowerCase() === normalizedLabel) || null;
}

export function getProductCategoryByTabId(tabId) {
  return PRODUCT_CATEGORIES.find((category) => category.tabId === tabId) || null;
}

export function getProductCategoryFromQuote(quote) {
  const category = String(quote?.productCategory || '').toLowerCase();
  if (category.includes('catalogue')) return getProductCategoryByTabId('catalogue');
  if (category.includes('tờ') || category.includes('to roi') || category.includes('rời')) return getProductCategoryByTabId('toroi');
  if (category.includes('hộp') || category.includes('hop')) return getProductCategoryByTabId('hopmem');
  if (category.includes('túi') || category.includes('tui')) return getProductCategoryByTabId('tuigiay');
  if (category.includes('vở') || category.includes('vo')) return getProductCategoryByTabId('vo');
  if (category.includes('phong') || category.includes('phong bì') || category.includes('phong bi')) return getProductCategoryByTabId('phongbi');
  if (category.includes('decal')) return getProductCategoryByTabId('decal');
  return null;
}
