import React, { Suspense, lazy, useCallback, useMemo, useState } from 'react';
import {
  Calculator,
  ChevronRight,
  History,
  Layout,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
} from 'lucide-react';
import AccountPanel from './components/AccountPanel';
import ErrorBoundary from './components/ErrorBoundary';
import LoginScreen from './components/LoginScreen';
import { AuthProvider, useAuth } from './context/AuthContext';
import { PricingDataProvider, usePricingDataContext } from './context/PricingDataContext';
import { DecalCalculator, PhongBiCalculator, VoCalculator } from './modules/PlaceholderCalculators';
import {
  DEFAULT_QUOTE_CATEGORY,
  PRODUCT_CATEGORIES,
  getProductCategoryByTabId,
  getProductCategoryFromQuote,
} from './constants/productCategories';

const ToRoiCalculator = lazy(() => import('./modules/ToRoiCalculator'));
const CatalogueCalculator = lazy(() => import('./modules/CatalogueCalculator'));
const HopMemCalculator = lazy(() => import('./modules/HopMemCalculator'));
const TuiGiayCalculator = lazy(() => import('./modules/TuiGiayCalculator'));
const QuoteHistory = lazy(() => import('./components/QuoteHistory'));

function AppShell() {
  const [activeTab, setActiveTab] = useState('quoteHistory');
  const [listCategory, setListCategory] = useState(DEFAULT_QUOTE_CATEGORY);
  const [categoryRailCollapsed, setCategoryRailCollapsed] = useState(false);
  const [extraCategoryLabels, setExtraCategoryLabels] = useState([]);
  const [quoteListBadgeCount, setQuoteListBadgeCount] = useState(0);
  const [editingQuote, setEditingQuote] = useState(null);
  const [isAccountPanelOpen, setIsAccountPanelOpen] = useState(false);
  const { user, logout } = useAuth();
  const { priceLoadError } = usePricingDataContext();

  const handleQuoteListMeta = useCallback(({ extraCategoryLabels: extras, displayedCount }) => {
    setExtraCategoryLabels(extras || []);
    setQuoteListBadgeCount(typeof displayedCount === 'number' ? displayedCount : 0);
  }, []);

  const sidebarCategories = useMemo(() => {
    const extras = (extraCategoryLabels || []).map((label) => ({
      id: label,
      label,
      icon: History,
    }));
    return [...PRODUCT_CATEGORIES, ...extras];
  }, [extraCategoryLabels]);

  const productTabMeta = getProductCategoryByTabId(activeTab);
  const isQuoteListView = activeTab === 'quoteHistory';

  const isSidebarCategoryActive = (label) => {
    if (isQuoteListView) return listCategory === label;
    return productTabMeta?.label === label;
  };

  const confirmCancelEditing = () => {
    if (!editingQuote?.id) return true;
    if (typeof window === 'undefined') return true;
    return window.confirm('Bạn đang chỉnh sửa báo giá. Hủy chỉnh sửa và bỏ các thay đổi chưa lưu?');
  };

  const handleFinishEditing = ({ navigateToHistory = false } = {}) => {
    setEditingQuote(null);
    if (navigateToHistory) setActiveTab('quoteHistory');
  };

  const handleCreateQuote = (category) => {
    if (!category?.tabId) return;
    if (!confirmCancelEditing()) return;
    setEditingQuote(null);
    setActiveTab(category.tabId);
  };

  const goToQuoteList = (nextCategory) => {
    if (!confirmCancelEditing()) return;
    setEditingQuote(null);
    setListCategory(nextCategory);
    setActiveTab('quoteHistory');
  };

  const openCalculatorTab = (tabId) => {
    if (!tabId) return;
    if (!confirmCancelEditing()) return;
    setEditingQuote(null);
    setActiveTab(tabId);
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'toroi': return <ToRoiCalculator editingQuote={editingQuote} onFinishEditing={handleFinishEditing} />;
      case 'catalogue': return <CatalogueCalculator editingQuote={editingQuote} onFinishEditing={handleFinishEditing} />;
      case 'vo': return <VoCalculator />;
      case 'hopmem': return <HopMemCalculator editingQuote={editingQuote} onFinishEditing={handleFinishEditing} />;
      case 'tuigiay': return <TuiGiayCalculator editingQuote={editingQuote} onFinishEditing={handleFinishEditing} />;
      case 'phongbi': return <PhongBiCalculator />;
      case 'decal': return <DecalCalculator />;
      case 'quoteHistory': return (
        <QuoteHistory
          category={listCategory}
          onQuoteListMeta={handleQuoteListMeta}
          onCreateQuote={handleCreateQuote}
          onEditQuote={handleEditQuote}
        />
      );
      default: return <ToRoiCalculator editingQuote={editingQuote} onFinishEditing={handleFinishEditing} />;
    }
  };

  const handleEditQuote = (quote) => {
    const productCategoryLabel = quote?.productCategory?.trim?.() || '';
    if (productCategoryLabel) setListCategory(productCategoryLabel);
    else {
      const mapped = getProductCategoryFromQuote(quote);
      if (mapped?.label) setListCategory(mapped.label);
    }
    const category = getProductCategoryFromQuote(quote);
    if (category?.tabId) setActiveTab(category.tabId);
    setEditingQuote(quote);
  };

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-slate-50 font-sans text-slate-800 w-full">
      <style>{`
        #root {
          max-width: none !important;
          width: 100% !important;
          padding: 0 !important;
          margin: 0 !important;
          text-align: left !important;
        }
        .custom-scrollbar::-webkit-scrollbar { width: 5px; height: 5px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background-color: #cbd5e1; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background-color: #94a3b8; }
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
      
      <div
        className={`hidden md:flex flex-col bg-white border-r border-slate-200 sticky top-0 h-screen overflow-y-auto shrink-0 transition-[width] duration-200 ease-out ${categoryRailCollapsed ? 'w-[4.75rem]' : 'w-64'}`}
      >
        <div className={`border-b border-slate-100 flex items-center gap-3 text-blue-600 ${categoryRailCollapsed ? 'justify-center px-3 py-5' : 'p-6'}`}>
          <Layout size={28} />
          {!categoryRailCollapsed && (
            <h1 className="text-xl font-bold tracking-tight text-slate-900 leading-tight">Đức Thành Printing</h1>
          )}
        </div>

        <div className="p-4 space-y-1 flex-grow flex flex-col min-h-0">
          <div className={`flex items-center mb-3 ${categoryRailCollapsed ? 'justify-center' : 'justify-between px-1'}`}>
            {!categoryRailCollapsed && (
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Danh mục</p>
            )}
            <button
              type="button"
              onClick={() => setCategoryRailCollapsed((c) => !c)}
              className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition-colors hover:bg-slate-50"
              aria-label={categoryRailCollapsed ? 'Mở rộng danh mục' : 'Thu gọn danh mục'}
            >
              {categoryRailCollapsed ? <PanelLeftOpen size={16} /> : <PanelLeftClose size={16} />}
            </button>
          </div>

          <div className={`min-h-0 flex-1 overflow-y-auto custom-scrollbar ${categoryRailCollapsed ? 'px-1' : ''}`}>
            <button
              type="button"
              onClick={() => goToQuoteList('')}
              className={`mb-1 flex w-full items-center rounded-xl px-3 py-2 text-left text-sm font-semibold transition-colors ${
                categoryRailCollapsed ? 'justify-center' : 'justify-between'
              } ${
                isSidebarCategoryActive('') ? 'bg-red-50 text-red-700' : 'text-slate-700 hover:bg-slate-50'
              }`}
              title="Tất cả"
            >
              <span className={`flex min-w-0 items-center ${categoryRailCollapsed ? 'justify-center' : 'gap-2'}`}>
                <ChevronRight size={14} className={isSidebarCategoryActive('') ? 'text-red-500' : 'text-slate-300'} />
                {!categoryRailCollapsed && <span className="truncate">Tất cả</span>}
              </span>
              {!categoryRailCollapsed && (
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500">{quoteListBadgeCount}</span>
              )}
            </button>

            <div className={categoryRailCollapsed ? 'space-y-1' : 'ml-2 border-l border-slate-200 pl-2'}>
              {sidebarCategories.map((item) => {
                const Icon = item.icon || History;
                const isActive = isSidebarCategoryActive(item.label);
                const tabId = item.tabId || '';
                if (categoryRailCollapsed) {
                  return (
                    <button
                      key={item.id || item.label}
                      type="button"
                      onClick={() => goToQuoteList(item.label)}
                      className={`mb-1 flex w-full items-center justify-center rounded-xl px-3 py-2 text-left text-sm transition-colors ${
                        isActive ? 'bg-red-50 font-semibold text-red-700' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                      }`}
                      title={item.label}
                    >
                      <Icon size={18} className={isActive ? 'text-red-500' : 'text-slate-400'} />
                    </button>
                  );
                }
                return (
                  <div key={item.id || item.label} className="mb-1 flex w-full gap-1">
                    <button
                      type="button"
                      onClick={() => goToQuoteList(item.label)}
                      className={`flex min-w-0 flex-1 items-center gap-2 rounded-xl px-3 py-2 text-left text-sm transition-colors ${
                        isActive ? 'bg-red-50 font-semibold text-red-700' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                      }`}
                      title={`Danh sách: ${item.label}`}
                    >
                      <Icon size={18} className={`shrink-0 ${isActive ? 'text-red-500' : 'text-slate-400'}`} />
                      <span className="truncate">{item.label}</span>
                    </button>
                    {tabId ? (
                      <button
                        type="button"
                        onClick={() => openCalculatorTab(tabId)}
                        className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border transition-colors ${
                          activeTab === tabId && !isQuoteListView
                            ? 'border-red-200 bg-red-50 text-red-700'
                            : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-50'
                        }`}
                        title="Mở máy tính giá"
                        aria-label={`Mở máy tính ${item.label}`}
                      >
                        <Calculator size={16} />
                      </button>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="border-t border-slate-100 p-4">
          <div className="mb-3 flex items-center gap-3 rounded-xl bg-slate-50 p-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-100 text-blue-700">
              <span className="text-sm font-bold">{(user?.displayName || user?.userName || 'U').charAt(0).toUpperCase()}</span>
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-slate-800">{user?.displayName || user?.userName || 'Người dùng'}</p>
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400">{user?.role || 'sales'}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIsAccountPanelOpen(true)}
            className="mb-2 flex w-full items-center justify-center rounded-xl border border-blue-100 bg-blue-50 px-4 py-2.5 text-sm font-semibold text-blue-700 transition-colors hover:bg-blue-100"
          >
            Tài khoản
          </button>
          <button
            type="button"
            onClick={logout}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900"
          >
            <LogOut size={16} />
            <span>Đăng xuất</span>
          </button>
        </div>
      </div>

      <div className="flex-1 flex flex-col xl:h-screen xl:overflow-hidden overflow-y-auto">
        <div className="p-4 md:p-8 w-full flex flex-col flex-1 min-h-0">
          {priceLoadError && (
            <div className="mb-4 bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 rounded-xl text-sm">
              {priceLoadError}
            </div>
          )}
          <div className="md:hidden mb-4 bg-white border border-slate-200 rounded-2xl p-3 shadow-sm shrink-0">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <label htmlFor="mobile-category-select" className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Danh mục báo giá
                </label>
                <p className="mt-1 text-sm font-semibold text-slate-800">{user?.displayName || user?.userName || 'Người dùng'}</p>
              </div>
              <button
                type="button"
                onClick={() => setIsAccountPanelOpen(true)}
                className="rounded-xl border border-blue-100 bg-blue-50 px-3 py-2 text-xs font-bold text-blue-700"
              >
                Tài khoản
              </button>
              <button
                type="button"
                onClick={logout}
                className="inline-flex items-center justify-center rounded-xl border border-slate-200 p-2 text-slate-600"
                aria-label="Đăng xuất"
              >
                <LogOut size={18} />
              </button>
            </div>
            {activeTab !== 'quoteHistory' ? (
              <div className="mb-3 flex flex-col gap-2 rounded-xl border border-amber-100 bg-amber-50 px-3 py-2 text-sm font-medium text-amber-900">
                <span>Đang tạo báo giá ({productTabMeta?.label || activeTab}).</span>
                <button
                  type="button"
                  className="w-full rounded-lg border border-slate-200 bg-white py-2 text-sm font-semibold text-slate-800"
                  onClick={() => goToQuoteList(listCategory)}
                >
                  Quay lại danh sách
                </button>
              </div>
            ) : null}
            <label htmlFor="mobile-category-select" className="mb-1 block text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Chọn danh mục
            </label>
            <select
              id="mobile-category-select"
              value={listCategory}
              onChange={(e) => goToQuoteList(e.target.value)}
              className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium text-slate-700 outline-none"
            >
              <option value="">Tất cả</option>
              {sidebarCategories.map((item) => (
                <option key={item.id || item.label} value={item.label}>
                  {item.label}
                </option>
              ))}
            </select>
          </div>
          
          <div className="flex-1 min-h-0">
            <ErrorBoundary>
              <Suspense fallback={<div className="bg-white border border-slate-200 rounded-2xl p-6 text-slate-500 text-sm">Đang tải module...</div>}>
                {renderContent()}
              </Suspense>
            </ErrorBoundary>
          </div>
        </div>

        <footer className="w-full py-4 border-t border-slate-200 bg-white text-center text-sm text-slate-500 shrink-0 hidden xl:block">
          <p className="font-medium text-slate-600">&copy; {new Date().getFullYear()} Bản quyền thuộc về Công ty TNHH Sản xuất & Dịch vụ Đức Thành.</p>
        </footer>
      </div>

      {isAccountPanelOpen && <AccountPanel onClose={() => setIsAccountPanelOpen(false)} />}

    </div>
  );
}

function AuthenticatedApp() {
  const { isAuthenticated, isCheckingSession } = useAuth();

  if (isCheckingSession) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 font-sans text-sm font-semibold text-slate-500">
        Đang kiểm tra phiên đăng nhập...
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginScreen />;
  }

  return (
    <PricingDataProvider>
      <AppShell />
    </PricingDataProvider>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AuthenticatedApp />
    </AuthProvider>
  );
}
