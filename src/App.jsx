import React, { Suspense, lazy, useState } from 'react';
import { BookOpen, Book, Box, FileText, History, Layout, Mail, ShoppingBag, StickyNote } from 'lucide-react';
import ErrorBoundary from './components/ErrorBoundary';
import { PricingDataProvider, usePricingDataContext } from './context/PricingDataContext';
import { DecalCalculator, PhongBiCalculator, VoCalculator } from './modules/PlaceholderCalculators';

const ToRoiCalculator = lazy(() => import('./modules/ToRoiCalculator'));
const CatalogueCalculator = lazy(() => import('./modules/CatalogueCalculator'));
const HopMemCalculator = lazy(() => import('./modules/HopMemCalculator'));
const TuiGiayCalculator = lazy(() => import('./modules/TuiGiayCalculator'));
const QuoteHistory = lazy(() => import('./components/QuoteHistory'));

function AppShell() {
  const [activeTab, setActiveTab] = useState('catalogue'); 
  const [editingQuote, setEditingQuote] = useState(null);
  const { priceLoadError } = usePricingDataContext();

  const TABS = [
    { id: 'toroi', label: 'Tờ rời', icon: FileText },
    { id: 'catalogue', label: 'Catalogue', icon: BookOpen },
    { id: 'vo', label: 'Vở', icon: Book },
    { id: 'hopmem', label: 'Hộp mềm', icon: Box },
    { id: 'tuigiay', label: 'Túi giấy', icon: ShoppingBag },
    { id: 'phongbi', label: 'Phong bì', icon: Mail },
    { id: 'decal', label: 'Decal', icon: StickyNote },
    { id: 'quoteHistory', label: 'Lịch sử báo giá', icon: History },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'toroi': return <ToRoiCalculator editingQuote={editingQuote} />;
      case 'catalogue': return <CatalogueCalculator editingQuote={editingQuote} />;
      case 'vo': return <VoCalculator />;
      case 'hopmem': return <HopMemCalculator editingQuote={editingQuote} />;
      case 'tuigiay': return <TuiGiayCalculator editingQuote={editingQuote} />;
      case 'phongbi': return <PhongBiCalculator />;
      case 'decal': return <DecalCalculator />;
      case 'quoteHistory': return <QuoteHistory onEditQuote={handleEditQuote} />;
      default: return <ToRoiCalculator />;
    }
  };

  const handleEditQuote = (quote) => {
    const category = String(quote?.productCategory || '').toLowerCase();
    if (category.includes('catalogue')) setActiveTab('catalogue');
    else if (category.includes('tờ') || category.includes('to roi') || category.includes('rời')) setActiveTab('toroi');
    else if (category.includes('hộp') || category.includes('hop')) setActiveTab('hopmem');
    else if (category.includes('túi') || category.includes('tui')) setActiveTab('tuigiay');
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
      
      <div className="hidden md:flex w-64 flex-col bg-white border-r border-slate-200 sticky top-0 h-screen overflow-y-auto shrink-0">
        <div className="p-6 border-b border-slate-100">
          <div className="flex items-center space-x-3 text-blue-600">
            <Layout size={28} />
            <h1 className="text-xl font-bold tracking-tight text-slate-900">Đức Thành Printing</h1>
          </div>
        </div>
        
        <div className="p-4 space-y-1 flex-grow">
          <p className="text-xs font-semibold text-slate-400 mb-3 px-3 uppercase tracking-wider">Hệ thống tính giá</p>
          {TABS.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 text-sm font-medium
                  ${isActive 
                    ? 'bg-blue-50 text-blue-700 shadow-sm border border-blue-100/50' 
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}`}
              >
                <Icon size={18} className={isActive ? "text-blue-600" : "text-slate-400"} />
                <span>{tab.label}</span>
              </button>
            )
          })}
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
            <label htmlFor="mobile-tab-select" className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
              Hệ thống tính giá
            </label>
            <select
              id="mobile-tab-select"
              value={activeTab}
              onChange={(e) => setActiveTab(e.target.value)}
              className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium text-slate-700 outline-none"
            >
              {TABS.map(tab => (
                <option key={tab.id} value={tab.id}>{tab.label}</option>
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

    </div>
  );
}

export default function App() {
  return (
    <PricingDataProvider>
      <AppShell />
    </PricingDataProvider>
  );
}
