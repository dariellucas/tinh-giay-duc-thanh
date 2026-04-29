import React, { useEffect, useState } from 'react';
import { AlertCircle, CheckCircle2, Save } from 'lucide-react';
import { saveQuote, updateQuote } from '../services/quoteService';

const QUOTE_AUTHOR_KEY = 'quoteAuthorName';

function QuoteSaveForm({ quote, editingQuote }) {
  const [customerName, setCustomerName] = useState('');
  const [quotedBy, setQuotedBy] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [savedQuoteCode, setSavedQuoteCode] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (typeof window === 'undefined') return;
    setQuotedBy(localStorage.getItem(QUOTE_AUTHOR_KEY) || '');
  }, []);

  useEffect(() => {
    if (!editingQuote) return;
    setCustomerName(editingQuote.customerName || '');
    setQuotedBy(editingQuote.quotedBy || '');
  }, [editingQuote]);

  useEffect(() => {
    setSavedQuoteCode('');
    setError('');
  }, [quote]);

  const handleSaveQuote = async () => {
    const trimmedCustomerName = customerName.trim();
    const trimmedQuotedBy = quotedBy.trim();

    if (!trimmedCustomerName) {
      setError('Vui lòng nhập tên khách hàng trước khi lưu.');
      return;
    }

    if (!quote) {
      setError('Chưa có dữ liệu báo giá để lưu.');
      return;
    }

    setIsSaving(true);
    setError('');
    setSavedQuoteCode('');

    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem(QUOTE_AUTHOR_KEY, trimmedQuotedBy);
      }

      const mutationPayload = {
        ...quote,
        customerName: trimmedCustomerName,
        quotedBy: trimmedQuotedBy,
      };
      const savedQuote = editingQuote?.id
        ? await updateQuote({
          ...mutationPayload,
          id: editingQuote.id,
          quoteCode: editingQuote.quoteCode,
        })
        : await saveQuote(mutationPayload);
      setSavedQuoteCode(savedQuote.quoteCode);
    } catch (saveError) {
      setError(saveError?.message || 'Không lưu được báo giá.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="rounded-2xl border border-blue-100 bg-blue-50/70 p-4 shadow-sm">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end">
        <div className="grid flex-1 gap-3 md:grid-cols-2">
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-blue-900">
              {editingQuote ? `Đang chỉnh sửa ${editingQuote.quoteCode || ''}` : 'Tên khách hàng *'}
            </label>
            <input
              type="text"
              value={customerName}
              onChange={(event) => setCustomerName(event.target.value)}
              placeholder="VD: Công ty ABC"
              className="w-full rounded-xl border border-blue-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-blue-900">Người báo giá</label>
            <input
              type="text"
              value={quotedBy}
              onChange={(event) => setQuotedBy(event.target.value)}
              placeholder="VD: Kinh doanh Đức Thành"
              className="w-full rounded-xl border border-blue-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
            />
          </div>
        </div>

        <button
          type="button"
          onClick={handleSaveQuote}
          disabled={isSaving}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Save size={16} />
          <span>{isSaving ? 'Đang lưu...' : editingQuote ? 'Cập nhật báo giá' : 'Lưu báo giá'}</span>
        </button>
      </div>

      {savedQuoteCode && (
        <p className="mt-3 flex items-center gap-2 text-sm font-semibold text-emerald-700">
          <CheckCircle2 size={16} />
          <span>{editingQuote ? 'Đã cập nhật' : 'Đã lưu'} báo giá {savedQuoteCode}.</span>
        </p>
      )}

      {error && (
        <p className="mt-3 flex items-start gap-2 text-sm font-medium text-red-600">
          <AlertCircle size={16} className="mt-0.5 shrink-0" />
          <span>{error}</span>
        </p>
      )}
    </div>
  );
}

export default QuoteSaveForm;
