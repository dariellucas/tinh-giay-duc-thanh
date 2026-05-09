import React, { useEffect, useRef, useState } from 'react';
import { AlertCircle, CheckCircle2, Save } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { saveQuote, updateQuote } from '../services/quoteService';

function getQuoteCategoryKey(category) {
  return String(category || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

function QuoteSaveForm({ quote, editingQuote, onFinishEditing }) {
  const { user } = useAuth();
  const [customerName, setCustomerName] = useState('');
  const [quotedBy, setQuotedBy] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [savedQuoteCode, setSavedQuoteCode] = useState('');
  const [savedAction, setSavedAction] = useState('');
  const [error, setError] = useState('');
  const preserveSaveFeedbackRef = useRef(false);

  const quoteCategoryKey = getQuoteCategoryKey(quote?.productCategory);
  const editingQuoteCategoryKey = getQuoteCategoryKey(editingQuote?.productCategory);
  const activeEditingQuote = editingQuote?.id && quoteCategoryKey === editingQuoteCategoryKey
    ? editingQuote
    : null;
  const quoteModeKey = `${quoteCategoryKey || 'unknown'}:${activeEditingQuote?.id || 'new'}`;
  const currentUserDisplayName = user?.displayName || user?.userName || '';

  useEffect(() => {
    if (activeEditingQuote) {
      setCustomerName(activeEditingQuote.customerName || '');
      setQuotedBy(currentUserDisplayName);
      return;
    }
    setCustomerName('');
    setQuotedBy(currentUserDisplayName);
  }, [activeEditingQuote, currentUserDisplayName]);

  useEffect(() => {
    if (preserveSaveFeedbackRef.current) {
      preserveSaveFeedbackRef.current = false;
      return;
    }
    setSavedQuoteCode('');
    setSavedAction('');
    setError('');
  }, [quoteModeKey]);

  const handleCancelEditing = () => {
    if (typeof window !== 'undefined') {
      const confirmed = window.confirm('Bạn có chắc muốn hủy chỉnh sửa báo giá này? Các thay đổi chưa lưu sẽ bị mất.');
      if (!confirmed) return;
    }
    setSavedQuoteCode('');
    setSavedAction('');
    setError('');
    onFinishEditing?.({ navigateToHistory: true });
  };

  const handleSaveQuote = async () => {
    const trimmedCustomerName = customerName.trim();
    const trimmedQuotedBy = quotedBy.trim();
    const isEditing = Boolean(activeEditingQuote);

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
    setSavedAction('');

    try {
      const mutationPayload = {
        ...quote,
        customerName: trimmedCustomerName,
        quotedBy: trimmedQuotedBy,
        createdBy: user?.userName || '',
      };
      const savedQuote = isEditing
        ? await updateQuote({
          ...mutationPayload,
          id: activeEditingQuote.id,
          quoteCode: activeEditingQuote.quoteCode,
        })
        : await saveQuote(mutationPayload);
      setSavedQuoteCode(savedQuote.quoteCode);
      setSavedAction(isEditing ? 'updated' : 'saved');
      if (isEditing) preserveSaveFeedbackRef.current = true;
      onFinishEditing?.();
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
              {activeEditingQuote ? `Đang chỉnh sửa ${activeEditingQuote.quoteCode || ''}` : 'Tên khách hàng *'}
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
              readOnly
              placeholder="VD: Kinh doanh Đức Thành"
              className="w-full rounded-xl border border-blue-100 bg-blue-50 px-3 py-2.5 text-sm font-semibold text-blue-900 outline-none"
            />
          </div>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row">
          {activeEditingQuote && (
            <button
              type="button"
              onClick={handleCancelEditing}
              disabled={isSaving}
              className="inline-flex items-center justify-center rounded-xl border border-blue-200 bg-white px-4 py-2.5 text-sm font-semibold text-blue-700 shadow-sm transition-colors hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Hủy chỉnh sửa
            </button>
          )}
          <button
            type="button"
            onClick={handleSaveQuote}
            disabled={isSaving}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Save size={16} />
            <span>{isSaving ? 'Đang lưu...' : activeEditingQuote ? 'Cập nhật báo giá' : 'Lưu báo giá'}</span>
          </button>
        </div>
      </div>

      {savedQuoteCode && (
        <p className="mt-3 flex items-center gap-2 text-sm font-semibold text-emerald-700">
          <CheckCircle2 size={16} />
          <span>{savedAction === 'updated' ? 'Đã cập nhật' : 'Đã lưu'} báo giá {savedQuoteCode}.</span>
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
