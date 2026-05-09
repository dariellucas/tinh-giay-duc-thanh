import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { AlertCircle, ChevronRight, History, Loader2, RefreshCw, Search, User, Users } from 'lucide-react';
import QuoteDetail from './QuoteDetail';
import { fetchQuotes, QUOTE_HISTORY_REFRESH_EVENT, saveQuote } from '../services/quoteService';
import { useAuth } from '../context/AuthContext';
import { useDebounce } from '../hooks/useDebounce';

const PAGE_SIZE = 100;
const DEFAULT_PRODUCT_CATEGORIES = ['Tờ rời', 'Catalogue', 'Vở', 'Hộp mềm', 'Túi giấy', 'Phong bì', 'Decal'];

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

function QuoteHistory({ onEditQuote }) {
  const { user } = useAuth();
  const [quotes, setQuotes] = useState([]);
  const [authorOptions, setAuthorOptions] = useState([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [quotedByFilter, setQuotedByFilter] = useState('');
  const [offset, setOffset] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState('');
  const [hasMore, setHasMore] = useState(false);
  const [selectedQuote, setSelectedQuote] = useState(null);
  const debouncedSearch = useDebounce(search, 350);

  const categories = useMemo(() => {
    const uniqueCategories = new Set(quotes.map((quote) => quote.productCategory).filter(Boolean));
    DEFAULT_PRODUCT_CATEGORIES.forEach((item) => uniqueCategories.add(item));
    return Array.from(uniqueCategories).sort((a, b) => a.localeCompare(b, 'vi'));
  }, [quotes]);

  const authorCounts = useMemo(() => (
    quotes.reduce((counts, quote) => {
      const author = quote.quotedBy || 'Chưa xác định';
      counts[author] = (counts[author] || 0) + 1;
      return counts;
    }, {})
  ), [quotes]);

  const authors = useMemo(() => {
    const uniqueAuthors = new Set(authorOptions);
    quotes.forEach((quote) => {
      if (quote.quotedBy) uniqueAuthors.add(quote.quotedBy);
    });
    return Array.from(uniqueAuthors).filter(Boolean).sort((a, b) => a.localeCompare(b, 'vi'));
  }, [authorOptions, quotes]);

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
        quotedBy: quotedByFilter,
      });

      setQuotes((currentQuotes) => (append ? [...currentQuotes, ...data] : data));
      setAuthorOptions((currentAuthors) => {
        const nextAuthors = new Set(currentAuthors);
        data.forEach((quote) => {
          if (quote.quotedBy) nextAuthors.add(quote.quotedBy);
        });
        return Array.from(nextAuthors).sort((a, b) => a.localeCompare(b, 'vi'));
      });
      setOffset(nextOffset + data.length);
      setHasMore(data.length === PAGE_SIZE);
    } catch (fetchError) {
      setError(fetchError?.message || 'Không tải được lịch sử báo giá.');
      if (!append) setQuotes([]);
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  }, [category, debouncedSearch, quotedByFilter]);

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

  return (
    <div className="flex h-full min-h-0 flex-col space-y-5">
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex items-center space-x-2 text-blue-700">
              <History size={22} />
              <h2 className="text-xl font-bold text-slate-900">Lịch sử báo giá</h2>
            </div>
            <p className="mt-1 text-sm text-slate-500">Tra cứu nhanh các báo giá đã lưu theo khách hàng, mã báo giá hoặc loại sản phẩm.</p>
          </div>
          <button
            type="button"
            onClick={() => loadQuotes({ nextOffset: 0, append: false })}
            disabled={isLoading || isLoadingMore}
            className="inline-flex items-center justify-center space-x-2 rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
            <span>Làm mới</span>
          </button>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-[minmax(0,1fr)_260px]">
          <div className="relative">
            <Search size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Tìm Tên KH hoặc Mã BG..."
              className="w-full rounded-xl border border-slate-300 bg-slate-50 py-2.5 pl-10 pr-3 text-sm outline-none transition-colors focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100"
            />
          </div>
          <select
            value={category}
            onChange={(event) => setCategory(event.target.value)}
            className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 text-sm font-medium text-slate-700 outline-none transition-colors focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100"
          >
            <option value="">Tất cả loại sản phẩm</option>
            {categories.map((item) => (
              <option key={item} value={item}>{item}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid min-h-0 flex-1 gap-4 xl:grid-cols-[260px_minmax(0,1fr)]">
        <aside className="min-h-0 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 bg-slate-50 px-4 py-3">
            <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-slate-600">
              <Users size={16} />
              <span>Người báo giá</span>
            </div>
          </div>
          <div className="h-full overflow-y-auto p-3 custom-scrollbar">
            <button
              type="button"
              onClick={() => setQuotedByFilter('')}
              className={`mb-1 flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm font-semibold transition-colors ${
                quotedByFilter === '' ? 'bg-blue-50 text-blue-700' : 'text-slate-700 hover:bg-slate-50'
              }`}
            >
              <span className="flex items-center gap-2">
                <ChevronRight size={14} className={quotedByFilter === '' ? 'text-blue-500' : 'text-slate-300'} />
                Tất cả
              </span>
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500">{quotes.length}</span>
            </button>

            <div className="ml-3 border-l border-slate-200 pl-2">
              {authors.length === 0 ? (
                <div className="px-3 py-2 text-xs text-slate-400">Chưa có dữ liệu người báo giá.</div>
              ) : (
                authors.map((author) => {
                  const isActive = quotedByFilter === author;
                  return (
                    <button
                      key={author}
                      type="button"
                      onClick={() => setQuotedByFilter(author)}
                      className={`mb-1 flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm transition-colors ${
                        isActive ? 'bg-blue-50 font-semibold text-blue-700' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                      }`}
                    >
                      <span className="flex min-w-0 items-center gap-2">
                        <User size={14} className={isActive ? 'text-blue-500' : 'text-slate-400'} />
                        <span className="truncate">{author}</span>
                      </span>
                      {authorCounts[author] ? (
                        <span className="ml-2 rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500">{authorCounts[author]}</span>
                      ) : null}
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </aside>

        <div className="min-h-0 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
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
            <p className="mt-1 text-sm text-slate-500">Thử đổi từ khóa tìm kiếm hoặc bộ lọc loại sản phẩm.</p>
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
