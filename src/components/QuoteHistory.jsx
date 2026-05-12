import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  ChevronRight,
  History,
  Loader2,
  Plus,
  RefreshCw,
  Search,
  User,
  Users,
} from 'lucide-react';
import QuoteDetail from './QuoteDetail';
import { fetchQuotes, QUOTE_HISTORY_REFRESH_EVENT, saveQuote } from '../services/quoteService';
import { useAuth } from '../context/AuthContext';
import { useDebounce } from '../hooks/useDebounce';
import { fetchUsers } from '../services/authService';
import { PRODUCT_CATEGORIES, getProductCategoryByLabel } from '../constants/productCategories';

const PAGE_SIZE = 100;

function formatCurrency(value) {
  const amount = Number(value) || 0;
  return `${Math.round(amount).toLocaleString('vi-VN')} đ`;
}

function formatDateTime(value) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

function normalizeOwner(value) {
  return String(value || '').trim().toLowerCase();
}

function getEmployeeKey(employee) {
  return employee?.userName || employee?.displayName || '';
}

function employeeMatchesQuote(employee, quote) {
  if (!employee || !quote) return false;
  const userName = normalizeOwner(employee.userName);
  const displayName = normalizeOwner(employee.displayName);
  const createdBy = normalizeOwner(quote.createdBy);
  const quotedBy = normalizeOwner(quote.quotedBy);

  return Boolean((userName && createdBy === userName) || (displayName && quotedBy === displayName));
}

function QuoteSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 6 }).map((_, index) => (
        <div key={index} className="grid grid-cols-6 gap-4 rounded-xl border border-slate-100 bg-white p-4">
          {Array.from({ length: 6 }).map((__, cellIndex) => (
            <div key={cellIndex} className="h-4 animate-pulse rounded bg-slate-100" />
          ))}
        </div>
      ))}
    </div>
  );
}

function QuoteHistory({ category, onQuoteListMeta, onEditQuote, onCreateQuote }) {
  const { user } = useAuth();
  const [quotes, setQuotes] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedEmployeeKey, setSelectedEmployeeKey] = useState('');
  const [offset, setOffset] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isLoadingEmployees, setIsLoadingEmployees] = useState(false);
  const [error, setError] = useState('');
  const [employeeError, setEmployeeError] = useState('');
  const [hasMore, setHasMore] = useState(false);
  const [selectedQuote, setSelectedQuote] = useState(null);
  const debouncedSearch = useDebounce(search, 350);

  const extraCategoryLabels = useMemo(() => {
    const unique = new Set();
    quotes.forEach((quote) => {
      const label = quote.productCategory;
      if (label && !PRODUCT_CATEGORIES.some((c) => c.label === label)) unique.add(label);
    });
    return Array.from(unique).sort((a, b) => a.localeCompare(b, 'vi'));
  }, [quotes]);

  useEffect(() => {
    if (!onQuoteListMeta) return;
    onQuoteListMeta({ extraCategoryLabels, displayedCount: quotes.length });
  }, [extraCategoryLabels, quotes.length, onQuoteListMeta]);

  const activeCategory = useMemo(() => getProductCategoryByLabel(category), [category]);

  const employeeOptions = useMemo(() => {
    const optionMap = new Map();
    employees.forEach((employee) => {
      const key = getEmployeeKey(employee);
      if (key) optionMap.set(key, employee);
    });
    quotes.forEach((quote) => {
      if (!quote.quotedBy) return;
      const key = quote.createdBy || quote.quotedBy;
      if (!optionMap.has(key)) {
        optionMap.set(key, {
          userName: quote.createdBy || '',
          displayName: quote.quotedBy,
          role: '',
          active: true,
        });
      }
    });
    return Array.from(optionMap.values()).sort((a, b) => (
      String(a.displayName || a.userName).localeCompare(String(b.displayName || b.userName), 'vi')
    ));
  }, [employees, quotes]);

  const selectedEmployee = useMemo(() => (
    employeeOptions.find((employee) => getEmployeeKey(employee) === selectedEmployeeKey) || null
  ), [employeeOptions, selectedEmployeeKey]);

  const authorCounts = useMemo(() => (
    quotes.reduce((counts, quote) => {
      employeeOptions.forEach((employee) => {
        const key = getEmployeeKey(employee);
        if (key && employeeMatchesQuote(employee, quote)) counts[key] = (counts[key] || 0) + 1;
      });
      return counts;
    }, {})
  ), [employeeOptions, quotes]);

  const canEditQuote = useCallback((quote) => {
    if (!quote || !user) return false;
    const currentUserName = normalizeOwner(user.userName);
    const currentDisplayName = normalizeOwner(user.displayName || user.userName);
    const createdBy = normalizeOwner(quote.createdBy);
    const quotedBy = normalizeOwner(quote.quotedBy);

    if (createdBy) return createdBy === currentUserName;
    return Boolean(quotedBy && (quotedBy === currentDisplayName || quotedBy === currentUserName));
  }, [user]);

  const loadQuotes = useCallback(async ({ nextOffset = 0, append = false } = {}) => {
    setError('');
    if (append) {
      setIsLoadingMore(true);
    } else {
      setIsLoading(true);
    }

    try {
      const data = await fetchQuotes({
        limit: PAGE_SIZE,
        offset: nextOffset,
        search: debouncedSearch.trim(),
        category,
        quotedBy: selectedEmployee?.displayName || '',
        createdBy: selectedEmployee?.userName || '',
      });

      setQuotes((currentQuotes) => (append ? [...currentQuotes, ...data] : data));
      setOffset(nextOffset + data.length);
      setHasMore(data.length === PAGE_SIZE);
    } catch (fetchError) {
      setError(fetchError?.message || 'Không tải được lịch sử báo giá.');
      if (!append) setQuotes([]);
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  }, [category, debouncedSearch, selectedEmployee]);

  useEffect(() => {
    let isMounted = true;

    async function loadEmployees() {
      setIsLoadingEmployees(true);
      setEmployeeError('');

      try {
        const data = await fetchUsers();
        if (!isMounted) return;
        setEmployees(data.filter((employee) => employee?.active !== false));
      } catch (fetchError) {
        if (!isMounted) return;
        setEmployeeError(fetchError?.message || 'Không tải được danh sách nhân viên.');
      } finally {
        if (isMounted) setIsLoadingEmployees(false);
      }
    }

    loadEmployees();
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    setOffset(0);
    setQuotes([]);
    loadQuotes({ nextOffset: 0, append: false });
  }, [loadQuotes]);

  useEffect(() => {
    const handleRefresh = () => {
      setOffset(0);
      setQuotes([]);
      loadQuotes({ nextOffset: 0, append: false });
    };

    window.addEventListener(QUOTE_HISTORY_REFRESH_EVENT, handleRefresh);
    return () => window.removeEventListener(QUOTE_HISTORY_REFRESH_EVENT, handleRefresh);
  }, [loadQuotes]);

  const handleLoadMore = () => {
    loadQuotes({ nextOffset: offset, append: true });
  };

  const handleCreateQuote = () => {
    if (!activeCategory?.canCreateQuote || !onCreateQuote) return;
    onCreateQuote(activeCategory);
  };

  const handleDuplicateQuote = async (quote) => {
    const duplicatedQuote = await saveQuote({
      productCategory: quote.productCategory,
      productName: `${quote.productName || 'Báo giá'} (Bản sao)`,
      specifications: quote.specifications || {},
      totalAmount: quote.totalAmount,
      customerName: quote.customerName,
      quotedBy: user?.displayName || user?.userName || '',
      createdBy: user?.userName || '',
    });

    await loadQuotes({ nextOffset: 0, append: false });
    return duplicatedQuote;
  };

  const handleEditQuote = (quote) => {
    if (!canEditQuote(quote)) {
      setError('Bạn chỉ được chỉnh sửa báo giá do chính mình tạo.');
      return;
    }
    if (onEditQuote) onEditQuote(quote);
    setSelectedQuote(null);
  };

  const title = category || 'Tất cả báo giá';
  const searchPlaceholder = category
    ? `Tìm báo giá trong ${category}...`
    : 'Tìm báo giá theo tên KH hoặc mã BG...';
  const layoutGridClass = 'xl:grid-cols-[240px_minmax(0,1fr)]';
  const canCreateCurrentCategory = Boolean(activeCategory?.canCreateQuote && onCreateQuote);

  return (
    <div className="grid h-full min-h-0 gap-4 xl:grid-cols-1">
      <div className={`grid min-h-0 flex-1 gap-4 ${layoutGridClass}`}>
        <aside className="min-h-0 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 bg-slate-50 px-4 py-3">
            <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-slate-600">
              <Users size={16} />
              <span>Nhân viên</span>
            </div>
          </div>
          <div className="h-full overflow-y-auto p-3 custom-scrollbar">
            <button
              type="button"
              onClick={() => setSelectedEmployeeKey('')}
              className={`mb-1 flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm font-semibold transition-colors ${
                selectedEmployeeKey === '' ? 'bg-red-50 text-red-700' : 'text-slate-700 hover:bg-slate-50'
              }`}
            >
              <span className="flex items-center gap-2">
                <ChevronRight size={14} className={selectedEmployeeKey === '' ? 'text-red-500' : 'text-slate-300'} />
                Tất cả
              </span>
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500">{quotes.length}</span>
            </button>

            <div className="ml-3 border-l border-slate-200 pl-2">
              {isLoadingEmployees ? (
                <div className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-slate-400">
                  <Loader2 size={14} className="animate-spin" />
                  Đang tải nhân viên...
                </div>
              ) : employeeOptions.length === 0 ? (
                <div className="px-3 py-2 text-xs text-slate-400">Chưa có dữ liệu nhân viên.</div>
              ) : (
                employeeOptions.map((employee) => {
                  const key = getEmployeeKey(employee);
                  const isActive = selectedEmployeeKey === key;
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setSelectedEmployeeKey(key)}
                      className={`mb-1 flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm transition-colors ${
                        isActive ? 'bg-red-50 font-semibold text-red-700' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                      }`}
                    >
                      <span className="flex min-w-0 items-center gap-2">
                        <User size={14} className={isActive ? 'text-red-500' : 'text-slate-400'} />
                        <span className="truncate">{employee.displayName || employee.userName}</span>
                      </span>
                      {authorCounts[key] ? (
                        <span className="ml-2 rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500">{authorCounts[key]}</span>
                      ) : null}
                    </button>
                  );
                })
              )}
            </div>
            {employeeError && (
              <div className="mt-3 rounded-xl bg-amber-50 px-3 py-2 text-xs font-medium text-amber-700">
                {employeeError}
              </div>
            )}
          </div>
        </aside>

        <div className="flex min-h-0 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 bg-white p-4">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-red-600">Danh sách báo giá</p>
                <h2 className="mt-1 text-2xl font-bold text-slate-900">{title}</h2>
                <p className="mt-1 text-sm text-slate-500">
                  {selectedEmployee ? `Đang xem báo giá của ${selectedEmployee.displayName || selectedEmployee.userName}.` : 'Đang xem báo giá của tất cả nhân viên.'}
                </p>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row">
                <button
                  type="button"
                  onClick={() => loadQuotes({ nextOffset: 0, append: false })}
                  disabled={isLoading || isLoadingMore}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
                  <span>Làm mới</span>
                </button>
                <button
                  type="button"
                  onClick={handleCreateQuote}
                  disabled={!canCreateCurrentCategory}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                  title={canCreateCurrentCategory ? `Thêm báo giá ${category}` : 'Vui lòng chọn danh mục có form báo giá'}
                >
                  <Plus size={16} />
                  <span>Thêm mới</span>
                </button>
              </div>
            </div>

            <div className="mt-4">
              <div className="relative">
                <Search size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="search"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder={searchPlaceholder}
                  className="w-full rounded-xl border border-slate-300 bg-slate-50 py-2.5 pl-10 pr-3 text-sm outline-none transition-colors focus:border-red-400 focus:bg-white focus:ring-2 focus:ring-red-100"
                />
              </div>
            </div>
          </div>

        {error ? (
          <div className="flex min-h-[360px] flex-col items-center justify-center p-8 text-center">
            <AlertCircle size={44} className="mb-3 text-red-500" />
            <p className="text-base font-semibold text-slate-800">Không tải được lịch sử báo giá</p>
            <p className="mt-1 max-w-md text-sm text-slate-500">{error}</p>
          </div>
        ) : isLoading ? (
          <div className="p-4">
            <QuoteSkeleton />
          </div>
        ) : quotes.length === 0 ? (
          <div className="flex min-h-[360px] flex-col items-center justify-center p-8 text-center">
            <History size={44} className="mb-3 text-slate-300" />
            <p className="text-base font-semibold text-slate-700">Chưa có báo giá phù hợp</p>
            <p className="mt-1 text-sm text-slate-500">Thử đổi từ khóa tìm kiếm, danh mục hoặc nhân viên.</p>
          </div>
        ) : (
          <div className="flex h-full flex-col">
            <div className="overflow-auto custom-scrollbar">
              <table className="min-w-[980px] w-full divide-y divide-slate-200 text-left text-sm">
                <thead className="sticky top-0 z-10 bg-slate-50 text-xs font-bold uppercase tracking-wider text-slate-500">
                  <tr>
                    <th className="px-4 py-3">Ngày tạo</th>
                    <th className="px-4 py-3">Mã BG</th>
                    <th className="px-4 py-3">Tên KH</th>
                    <th className="px-4 py-3">Sản phẩm</th>
                    <th className="px-4 py-3 text-right">Tổng tiền</th>
                    <th className="px-4 py-3">Người báo</th>
                    <th className="px-4 py-3 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {quotes.map((quote, index) => (
                    <tr key={quote.id || `${quote.quoteCode}-${index}`} className="hover:bg-blue-50/40">
                      <td className="whitespace-nowrap px-4 py-3 font-medium text-slate-700">{formatDateTime(quote.createdAt)}</td>
                      <td className="whitespace-nowrap px-4 py-3 font-semibold text-blue-700">{quote.quoteCode || '-'}</td>
                      <td className="px-4 py-3 text-slate-700">{quote.customerName || '-'}</td>
                      <td className="px-4 py-3">
                        <div className="font-semibold text-slate-800">{quote.productCategory || '-'}</div>
                        <div className="text-xs text-slate-500">{quote.productName || '-'}</div>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-right font-bold text-emerald-700">{formatCurrency(quote.totalAmount)}</td>
                      <td className="whitespace-nowrap px-4 py-3 text-slate-600">{quote.quotedBy || '-'}</td>
                      <td className="px-4 py-3 text-center">
                        <button
                          type="button"
                          onClick={() => setSelectedQuote(quote)}
                          className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 transition-colors hover:bg-blue-100"
                        >
                          Xem chi tiết
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="border-t border-slate-200 bg-slate-50 px-4 py-3 text-center">
              {hasMore ? (
                <button
                  type="button"
                  onClick={handleLoadMore}
                  disabled={isLoadingMore}
                  className="inline-flex items-center justify-center space-x-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isLoadingMore && <Loader2 size={16} className="animate-spin" />}
                  <span>{isLoadingMore ? 'Đang tải...' : 'Tải thêm'}</span>
                </button>
              ) : (
                <span className="text-sm text-slate-500">Đã hiển thị {quotes.length.toLocaleString('vi-VN')} báo giá.</span>
              )}
            </div>
          </div>
        )}
        </div>
      </div>
      <QuoteDetail
        quote={selectedQuote}
        onClose={() => setSelectedQuote(null)}
        onDuplicate={handleDuplicateQuote}
        onEdit={handleEditQuote}
        canEdit={selectedQuote ? canEditQuote(selectedQuote) : false}
      />
    </div>
  );
}

export default QuoteHistory;
