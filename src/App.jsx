import React, { useState, useEffect, useMemo } from 'react';
import { Settings, Maximize, Printer, Layout, AlertCircle, Info, FileText, X, Copy, Check, RefreshCw } from 'lucide-react';

// URL Google Sheets API
const GOOGLE_SHEETS_API_URL = 'https://script.google.com/macros/s/AKfycbxxxG6_SjHC3__zrbNV2s5wTr2ngrj_4Az1xcxhpe9xR-KSowPMnwcKF_ro5s3Le-J0/exec'; 

// Dữ liệu bảng giá dự phòng trong trường hợp API lỗi / không phản hồi
const DEFAULT_PAPER_DATA = [
  { paperType: "Couche", gsm: 80, price: 22.4 },
  { paperType: "Couche", gsm: 100, price: 20.8 },
  { paperType: "Couche", gsm: 120, price: 20.8 },
  { paperType: "Couche", gsm: 150, price: 20.8 },
  { paperType: "Couche", gsm: 180, price: 20.8 },
  { paperType: "Couche", gsm: 200, price: 20.8 },
  { paperType: "Couche", gsm: 230, price: 20.8 },
  { paperType: "Couche", gsm: 250, price: 20.8 },
  { paperType: "Couche", gsm: 300, price: 20.8 },
  { paperType: "Couche Matt", gsm: 100, price: 20.8 },
  { paperType: "Couche Matt", gsm: 120, price: 20.8 },
  { paperType: "Couche Matt", gsm: 150, price: 20.8 },
  { paperType: "Couche Matt", gsm: 200, price: 20.8 },
  { paperType: "Couche Pindo", gsm: 300, price: 22.8 },
  { paperType: "Couche Pindo", gsm: 350, price: 22.8 },
  { paperType: "Off", gsm: 70, price: 20.9 },
  { paperType: "Off", gsm: 80, price: 20.9 },
  { paperType: "Off", gsm: 100, price: 20.9 },
  { paperType: "Off", gsm: 120, price: 20.9 },
  { paperType: "Off", gsm: 140, price: 20.9 },
  { paperType: "Off", gsm: 150, price: 20.9 },
  { paperType: "Off", gsm: 180, price: 23.6 },
  { paperType: "Off", gsm: 200, price: 26.0 },
  { paperType: "Off", gsm: 250, price: 26.0 },
  { paperType: "Ivory", gsm: 210, price: 18.7 },
  { paperType: "Ivory", gsm: 230, price: 17.7 },
  { paperType: "Ivory", gsm: 250, price: 17.7 },
  { paperType: "Ivory", gsm: 300, price: 17.7 },
  { paperType: "Ivory", gsm: 350, price: 17.7 },
  { paperType: "Ivory", gsm: 400, price: 17.7 },
  { paperType: "Duplex", gsm: 250, price: 17.0 },
  { paperType: "Duplex", gsm: 270, price: 17.0 },
  { paperType: "Duplex", gsm: 300, price: 15.8 },
  { paperType: "Duplex", gsm: 310, price: 15.8 },
  { paperType: "Duplex", gsm: 350, price: 15.3 },
  { paperType: "Duplex", gsm: 400, price: 15.3 },
  { paperType: "Duplex", gsm: 450, price: 15.3 },
  { paperType: "Kraft trắng", gsm: 100, price: 30.7 },
  { paperType: "Kraft trắng", gsm: 120, price: 30.7 },
  { paperType: "Kraft nâu", gsm: 170, price: 13.6 },
  { paperType: "Kraft nâu", gsm: 250, price: 17.0 },
  { paperType: "Kraft nâu", gsm: 280, price: 17.0 },
  { paperType: "Kraft nâu", gsm: 300, price: 17.0 },
  { paperType: "Kraft nâu", gsm: 350, price: 17.0 },
  { paperType: "Bãi Bằng", gsm: 60, price: 25.5 },
  { paperType: "Bãi Bằng", gsm: 70, price: 25.5 },
  { paperType: "Bãi Bằng", gsm: 80, price: 25.5 },
  { paperType: "Bãi Bằng", gsm: 100, price: 25.5 }
];

const PARENT_PAPER_SIZES = [
  "27 x 52", "36.3 x 39.5", "36 x 52", "32.5 x 43", 
  "39.5 x 54.5", "43 x 62", "43 x 65", "52 x 72", 
  "54.5 x 79", "62 x 86", "65 x 86", "72 x 102", "79 x 109"
].map(size => {
  const [a, b] = size.split('x').map(s => parseFloat(s.trim()));
  return { label: size, w: Math.max(a, b), h: Math.min(a, b) };
});

const PRODUCT_SIZES = [
  { label: 'A3 (42 x 29.7)', w: 42, h: 29.7 },
  { label: 'A4 (29.7 x 21)', w: 29.7, h: 21 },
  { label: 'A5 (21 x 14.8)', w: 21, h: 14.8 },
  { label: 'Kích thước khác', w: 0, h: 0 }
];

const KHO_THIEU_SIZES = {
  0: { w: 41.8, h: 29.7, label: 'A3 thiếu (41.8 x 29.7)' },
  1: { w: 29.7, h: 20.7, label: 'A4 thiếu (29.7 x 20.7)' },
  2: { w: 20.7, h: 14.8, label: 'A5 thiếu (20.7 x 14.8)' },
};

export default function App() {
  const [paperDatabase, setPaperDatabase] = useState(null);
  const [isLoadingPrices, setIsLoadingPrices] = useState(true);
  const [priceLoadError, setPriceLoadError] = useState('');

  const [parentSizeIdx, setParentSizeIdx] = useState(7);
  const [customParentW, setCustomParentW] = useState('');
  const [customParentH, setCustomParentH] = useState('');
  const [productTypeIdx, setProductTypeIdx] = useState(1);
  const [customW, setCustomW] = useState('');
  const [customH, setCustomH] = useState('');
  const [isKhoThieu, setIsKhoThieu] = useState(true);
  const [quantity, setQuantity] = useState(1000);
  
  const [paperType, setPaperType] = useState('');
  const [paperGsm, setPaperGsm] = useState('');
  
  const [muonSong, setMuonSong] = useState(false);
  const [muonNhip, setMuonNhip] = useState(false);
  const [allowMixed, setAllowMixed] = useState(true);

  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [orderForm, setOrderForm] = useState({
    orderCode: '', supplier: '', paperType: '', deliveryDate: '', deliveryAddress: '', notes: ''
  });
  const [generatedOrder, setGeneratedOrder] = useState('');
  const [orderCopied, setOrderCopied] = useState(false);

  const MARGIN = 0.2;
  const SPOILAGE = 100;

  // HÀM TẢI DỮ LIỆU TỪ GOOGLE SHEETS
  const fetchPaperPrices = async () => {
    setIsLoadingPrices(true);
    setPriceLoadError('');
    try {
      let rawData;
      try {
        const response = await fetch(GOOGLE_SHEETS_API_URL, { redirect: 'follow' });
        
        // CẢI TIẾN: Đọc dưới dạng text trước để xem Google trả về JSON hay trang báo lỗi (HTML)
        const text = await response.text();
        
        // Nếu nội dung bắt đầu bằng thẻ HTML, nghĩa là Google đang chặn quyền truy cập
        if (text.trim().startsWith('<')) {
          if (text.includes('accounts.google.com') || text.includes('Sign in')) {
            throw new Error('Google đang chặn quyền. Vui lòng cấp quyền "Bất kỳ ai" (Anyone). Đang dùng giá dự phòng.');
          } else {
            throw new Error('Link API bị sai hoặc file Google Sheets đã bị xóa. Đang dùng giá dự phòng.');
          }
        }
        
        // Nếu không phải HTML, thử parse ra JSON
        const json = JSON.parse(text);
        rawData = json.record ? json.record : json; 
      } catch (fetchError) {
        console.warn("Lỗi API:", fetchError);
        rawData = DEFAULT_PAPER_DATA; // Fallback an toàn
        setPriceLoadError(fetchError.message || 'Mất kết nối. Đang dùng bảng giá dự phòng.');
      }
      
      const formattedData = {};
      rawData.forEach(row => {
        if (row && row.paperType && String(row.paperType).trim() !== '') {
          if (!formattedData[row.paperType]) formattedData[row.paperType] = {};
          formattedData[row.paperType][row.gsm] = parseFloat(row.price) || 0;
        }
      });

      if (Object.keys(formattedData).length === 0) {
        throw new Error('Dữ liệu tải về bị trống. Hãy kiểm tra lại Google Sheets.');
      }

      setPaperDatabase(formattedData);
      
      const firstType = Object.keys(formattedData)[0];
      if (firstType) {
        setPaperType(firstType);
        setPaperGsm(Number(Object.keys(formattedData[firstType])[0]));
      }

    } catch (err) {
      console.error(err);
      setPriceLoadError('Lỗi thiết lập dữ liệu. Đang dùng bảng giá dự phòng.');
    } finally {
      setIsLoadingPrices(false);
    }
  };

  useEffect(() => {
    fetchPaperPrices();
  }, []);

  const availablePaperTypes = paperDatabase ? Object.keys(paperDatabase) : [];
  const availableGsms = paperDatabase && paperDatabase[paperType] 
    ? Object.keys(paperDatabase[paperType]).map(Number).sort((a,b)=>a-b) 
    : [];

  const calculateImposition = () => {
    if (!paperDatabase) {
      setError('Đang tải dữ liệu giá giấy, vui lòng chờ...');
      return;
    }

    setError('');
    setGeneratedOrder('');
    
    const GAP = muonSong ? 0 : 0.4;
    const GRIPPER = muonNhip ? 0 : 1.0;
    
    let Pw, Ph;
    if (parentSizeIdx === PARENT_PAPER_SIZES.length) {
      const cpW = parseFloat(customParentW);
      const cpH = parseFloat(customParentH);
      if (isNaN(cpW) || isNaN(cpH) || cpW <= 0 || cpH <= 0) {
        setError('Vui lòng nhập kích thước khổ giấy in tùy chọn hợp lệ.');
        return;
      }
      Pw = Math.max(cpW, cpH);
      Ph = Math.min(cpW, cpH);
    } else {
      const parent = PARENT_PAPER_SIZES[parentSizeIdx];
      Pw = parent.w;
      Ph = parent.h;
    }

    let prodW, prodH;
    if (productTypeIdx === PRODUCT_SIZES.length - 1) {
      const cw = parseFloat(customW);
      const ch = parseFloat(customH);
      if (isNaN(cw) || isNaN(ch) || cw <= 0 || ch <= 0) {
        setError('Vui lòng nhập kích thước sản phẩm hợp lệ.');
        return;
      }
      prodW = Math.max(cw, ch);
      prodH = Math.min(cw, ch);
    } else {
      if (isKhoThieu && KHO_THIEU_SIZES[productTypeIdx]) {
        prodW = KHO_THIEU_SIZES[productTypeIdx].w;
        prodH = KHO_THIEU_SIZES[productTypeIdx].h;
      } else {
        prodW = PRODUCT_SIZES[productTypeIdx].w;
        prodH = PRODUCT_SIZES[productTypeIdx].h;
      }
    }

    const qty = parseInt(quantity);
    if (isNaN(qty) || qty <= 0) {
      setError('Vui lòng nhập số lượng sản phẩm hợp lệ.');
      return;
    }

    const usableW = Pw - (MARGIN * 2);
    const usableH = Ph - MARGIN - GRIPPER;

    let layouts = [];

    const getBlocksInSpace = (spaceX, spaceY, spaceW, spaceH, itemW, itemH, isRotated) => {
        if (spaceW < itemW || spaceH < itemH) return null;
        const c = Math.floor((spaceW + GAP) / (itemW + GAP));
        const r = Math.floor((spaceH + GAP) / (itemH + GAP));
        if (c > 0 && r > 0) return { x: spaceX, y: spaceY, w: itemW, h: itemH, cols: c, rows: r, isRotated };
        return null;
    };

    const tryCombinations = (mainW, mainH, mainRotated) => {
        const oppW = mainH; const oppH = mainW; const oppRotated = !mainRotated;
        const maxC = Math.floor((usableW + GAP) / (mainW + GAP));
        const maxR = Math.floor((usableH + GAP) / (mainH + GAP));
        if (maxC === 0 || maxR === 0) return;

        for (let c = 1; c <= maxC; c++) {
            for (let r = 1; r <= maxR; r++) {
                const mainBlockW = c * (mainW + GAP) - GAP;
                const mainBlockH = r * (mainH + GAP) - GAP;
                const mainBlock = { x: 0, y: 0, w: mainW, h: mainH, cols: c, rows: r, isRotated: mainRotated };
                
                layouts.push({ total: c * r, blocks: [mainBlock] });

                if (allowMixed) {
                    const rightA = getBlocksInSpace(mainBlockW + GAP, 0, usableW - mainBlockW - GAP, usableH, oppW, oppH, oppRotated);
                    const bottomA = getBlocksInSpace(0, mainBlockH + GAP, mainBlockW, usableH - mainBlockH - GAP, oppW, oppH, oppRotated);
                    let blocksA = [mainBlock]; let totalA = c * r;
                    if (rightA) { blocksA.push(rightA); totalA += rightA.cols * rightA.rows; }
                    if (bottomA) { blocksA.push(bottomA); totalA += bottomA.cols * bottomA.rows; }
                    if (blocksA.length > 1) layouts.push({ total: totalA, blocks: blocksA });

                    const rightB = getBlocksInSpace(mainBlockW + GAP, 0, usableW - mainBlockW - GAP, mainBlockH, oppW, oppH, oppRotated);
                    const bottomB = getBlocksInSpace(0, mainBlockH + GAP, usableW, usableH - mainBlockH - GAP, oppW, oppH, oppRotated);
                    let blocksB = [mainBlock]; let totalB = c * r;
                    if (rightB) { blocksB.push(rightB); totalB += rightB.cols * rightB.rows; }
                    if (bottomB) { blocksB.push(bottomB); totalB += bottomB.cols * bottomB.rows; }
                    if (blocksB.length > 1) layouts.push({ total: totalB, blocks: blocksB });
                }
            }
        }
    };

    tryCombinations(prodW, prodH, false);
    tryCombinations(prodH, prodW, true);

    let bestOpt = { total: 0, blocks: [] };
    layouts.forEach(l => {
        if (l.total > bestOpt.total) {
            bestOpt = l;
        } else if (l.total === bestOpt.total && l.total > 0) {
            if (l.blocks.length < bestOpt.blocks.length) bestOpt = l;
        }
    });

    if (bestOpt.total === 0) {
      setError('Sản phẩm quá lớn, không thể xếp vừa khổ giấy này (tính cả lề, sông và nhíp).');
      setResult(null);
      return;
    }

    const parentSheetsNeeded = Math.ceil(qty / bestOpt.total) + SPOILAGE;

    const pricePerTon = paperDatabase[paperType] && paperDatabase[paperType][paperGsm] 
      ? paperDatabase[paperType][paperGsm] 
      : 0; 
    
    const areaM2 = (Pw * Ph) / 10000;
    const weightPerSheetKg = (areaM2 * paperGsm) / 1000;
    const totalWeightKg = weightPerSheetKg * parentSheetsNeeded;
    
    const pricePerKg = pricePerTon * 1000;
    const totalCostVnd = totalWeightKg * pricePerKg;

    setResult({
      parentW: Pw, parentH: Ph, productW: prodW, productH: prodH,
      blocks: bestOpt.blocks, itemsPerSheet: bestOpt.total, sheetsNeeded: parentSheetsNeeded,
      requestedQty: qty, printableW: usableW, printableH: usableH, gap: GAP, gripper: GRIPPER,
      paperType, paperGsm, totalWeightKg, pricePerKg, totalCostVnd
    });
  };

  useEffect(() => {
    if(!isLoadingPrices && (!error || error.includes("lớn") || error.includes("hợp lệ"))) calculateImposition();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [parentSizeIdx, customParentW, customParentH, productTypeIdx, customW, customH, quantity, muonSong, muonNhip, isKhoThieu, paperType, paperGsm, allowMixed, isLoadingPrices]);

  const handleOpenOrderModal = () => {
    if (result) {
      setOrderForm(prev => ({ ...prev, paperType: `${result.paperType} ${result.paperGsm} gsm` }));
    }
    setIsOrderModalOpen(true);
  };

  const handleGenerateOrder = () => {
    if (!result) return;
    const finalPaperType = orderForm.paperType || `${result.paperType} ${result.paperGsm} gsm`;
    const orderText = `Đơn đặt hàng\nDear ${orderForm.supplier || '[Nhà cung cấp]'}, Đức Thành gửi đơn đặt hàng với nội dung sau:\n- Mã đơn: ${orderForm.orderCode || '[Mã đơn]'}\n- Loại giấy: ${finalPaperType}\n- Kích thước: ${result.parentW} x ${result.parentH} cm\n- Số lượng: ${result.sheetsNeeded.toLocaleString()} tờ\n- Ngày giao: ${orderForm.deliveryDate || '[Ngày giao]'}\n- Địa chỉ giao: ${orderForm.deliveryAddress || '[Địa chỉ giao]'}\n- Ghi chú: ${orderForm.notes || '[Ghi chú]'}`;
    setGeneratedOrder(orderText);
    setIsOrderModalOpen(false);
  };

  const handleCopyOrder = () => {
    if (!generatedOrder) return;
    const copyToClipboard = () => {
      const textArea = document.createElement("textarea");
      textArea.value = generatedOrder; document.body.appendChild(textArea); textArea.select();
      try { document.execCommand('copy'); setOrderCopied(true); setTimeout(() => setOrderCopied(false), 2000); } catch (err) {}
      document.body.removeChild(textArea);
    };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(generatedOrder).then(() => { setOrderCopied(true); setTimeout(() => setOrderCopied(false), 2000); }).catch(copyToClipboard);
    } else copyToClipboard();
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setOrderForm(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans p-4 md:p-8 flex flex-col">
      <div className="max-w-6xl mx-auto w-full space-y-6 flex-grow">
        
        {/* Header */}
        <div className="flex items-center space-x-3 mb-8">
          <div className="p-3 bg-blue-600 rounded-lg text-white shadow-lg">
            <Layout size={28} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 text-left">Tính giấy Đức Thành</h1>
            <p className="text-sm text-slate-500">Tối ưu hoá xếp bát, hỗ trợ tính sông, nhíp, bù hao tự động</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* CỘT TRÁI: FORM NHẬP LIỆU */}
          <div className="lg:col-span-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-5">
            <h2 className="text-lg font-semibold flex items-center space-x-2 border-b pb-3">
              <Settings size={20} className="text-blue-500"/>
              <span>Thông Số Đầu Vào</span>
            </h2>

            {/* Các trường kích thước */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 flex items-center justify-between">
                <span>Khổ giấy in (Nguyên khổ)</span><span className="text-xs text-slate-400">Đơn vị: cm</span>
              </label>
              <select className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" value={parentSizeIdx} onChange={(e) => setParentSizeIdx(parseInt(e.target.value))}>
                {PARENT_PAPER_SIZES.map((size, idx) => (<option key={idx} value={idx}>{size.label}</option>))}
                <option value={PARENT_PAPER_SIZES.length}>Tùy chọn...</option>
              </select>
            </div>

            {parentSizeIdx === PARENT_PAPER_SIZES.length && (
              <div className="grid grid-cols-2 gap-4 bg-emerald-50 p-3 rounded-lg border border-emerald-100">
                <div className="space-y-1"><label className="text-xs font-medium text-slate-600">Ngang (cm)</label><input type="number" step="0.1" className="w-full p-2 border border-slate-300 rounded outline-none" value={customParentW} onChange={(e) => setCustomParentW(e.target.value)}/></div>
                <div className="space-y-1"><label className="text-xs font-medium text-slate-600">Cao (cm)</label><input type="number" step="0.1" className="w-full p-2 border border-slate-300 rounded outline-none" value={customParentH} onChange={(e) => setCustomParentH(e.target.value)}/></div>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 flex items-center justify-between"><span>Khổ sản phẩm</span></label>
              <select className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" value={productTypeIdx} onChange={(e) => setProductTypeIdx(parseInt(e.target.value))}>
                {PRODUCT_SIZES.map((size, idx) => {
                  let label = size.label; if (isKhoThieu && KHO_THIEU_SIZES[idx]) label = KHO_THIEU_SIZES[idx].label;
                  return <option key={idx} value={idx}>{label}</option>
                })}
              </select>
              {productTypeIdx !== PRODUCT_SIZES.length - 1 && (
                <div className="pt-1">
                  <label className="flex items-center space-x-2 cursor-pointer group w-fit">
                    <input type="checkbox" className="w-4 h-4 rounded text-blue-600 cursor-pointer" checked={isKhoThieu} onChange={(e) => setIsKhoThieu(e.target.checked)} />
                    <span className="text-sm font-medium text-slate-700 group-hover:text-blue-600 transition-colors">Chọn khổ thiếu</span>
                  </label>
                </div>
              )}
            </div>

            {productTypeIdx === PRODUCT_SIZES.length - 1 && (
              <div className="grid grid-cols-2 gap-4 bg-blue-50 p-3 rounded-lg border border-blue-100">
                <div className="space-y-1"><label className="text-xs font-medium text-slate-600">Ngang (cm)</label><input type="number" step="0.1" className="w-full p-2 border border-slate-300 rounded outline-none" value={customW} onChange={(e) => setCustomW(e.target.value)}/></div>
                <div className="space-y-1"><label className="text-xs font-medium text-slate-600">Cao (cm)</label><input type="number" step="0.1" className="w-full p-2 border border-slate-300 rounded outline-none" value={customH} onChange={(e) => setCustomH(e.target.value)}/></div>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 flex items-center justify-between"><span>Số lượng sản phẩm cần in</span></label>
              <input type="number" className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-lg font-semibold" value={quantity} onChange={(e) => setQuantity(e.target.value)} />
            </div>

            {/* Vật tư Giấy (Đồng bộ từ API) */}
            <div className="pt-3 border-t border-slate-100 relative">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-slate-700">Vật tư giấy</span>
                <button 
                  onClick={fetchPaperPrices} 
                  disabled={isLoadingPrices}
                  className="text-xs flex items-center space-x-1 text-blue-600 hover:text-blue-800 transition-colors disabled:opacity-50"
                  title="Đồng bộ giá từ Google Sheets"
                >
                  <RefreshCw size={12} className={isLoadingPrices ? "animate-spin" : ""} />
                  <span>Cập nhật giá</span>
                </button>
              </div>

              {isLoadingPrices ? (
                <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 text-center text-sm text-slate-500 animate-pulse">
                  Đang tải bảng giá từ hệ thống...
                </div>
              ) : (
                <>
                  {priceLoadError && (
                    <div className="mb-3 p-2 bg-yellow-50 text-yellow-700 text-xs rounded border border-yellow-200">
                      {priceLoadError}
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <label className="text-xs text-slate-500">Loại giấy</label>
                      <select 
                        className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm font-medium"
                        value={paperType}
                        onChange={(e) => {
                          const newType = e.target.value;
                          setPaperType(newType);
                          setPaperGsm(Number(Object.keys(paperDatabase[newType])[0])); 
                        }}
                      >
                        {availablePaperTypes.map(type => <option key={type} value={type}>{type}</option>)}
                      </select>
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-xs text-slate-500">Định lượng (gsm)</label>
                      <select 
                        className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm font-medium"
                        value={paperGsm}
                        onChange={(e) => setPaperGsm(Number(e.target.value))}
                      >
                        {availableGsms.map(gsm => <option key={gsm} value={gsm}>{gsm}</option>)}
                      </select>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Tuỳ chọn Mượn Sông, Mượn Nhíp, Xếp L */}
            <div className="flex flex-col space-y-3 pt-3 border-t border-slate-100">
              <label className="flex items-center space-x-2 cursor-pointer group">
                <input type="checkbox" className="w-4 h-4 rounded text-blue-600" checked={muonSong} onChange={(e) => setMuonSong(e.target.checked)} />
                <span className="text-sm font-medium text-slate-700">Mượn sông <span className="text-slate-500 font-normal">(Sông = 0mm)</span></span>
              </label>
              <label className="flex items-center space-x-2 cursor-pointer group">
                <input type="checkbox" className="w-4 h-4 rounded text-blue-600" checked={muonNhip} onChange={(e) => setMuonNhip(e.target.checked)} />
                <span className="text-sm font-medium text-slate-700">Mượn nhíp <span className="text-slate-500 font-normal">(Nhíp = 0mm)</span></span>
              </label>
              <label className="flex items-center space-x-2 cursor-pointer group">
                <input type="checkbox" className="w-4 h-4 rounded text-blue-600" checked={allowMixed} onChange={(e) => setAllowMixed(e.target.checked)} />
                <span className="text-sm font-medium text-slate-700">Xếp phối hợp <span className="text-slate-500 font-normal">(Chữ L)</span></span>
              </label>
            </div>

            <button onClick={calculateImposition} disabled={isLoadingPrices} className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-colors flex justify-center items-center space-x-2 shadow-sm disabled:opacity-50">
              <Maximize size={18} /><span>Tính toán bình giấy</span>
            </button>
          </div>

          {/* CỘT PHẢI: KẾT QUẢ VÀ BẢN VẼ */}
          <div className="lg:col-span-8 flex flex-col space-y-6">
            {error ? (
              <div className="bg-red-50 border border-red-200 text-red-700 p-6 rounded-2xl flex items-center space-x-3"><AlertCircle size={24} /><span className="font-medium">{error}</span></div>
            ) : result ? (
              <>
                <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
                  <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 flex flex-col justify-center items-center text-center">
                    <span className="text-slate-500 text-sm font-medium mb-1">Số bát (SP/Tờ)</span>
                    <span className="text-3xl font-bold text-blue-600">{result.itemsPerSheet}</span>
                    <span className="text-xs text-slate-400 mt-1">{result.blocks.length === 1 ? `${result.blocks[0].cols} cột × ${result.blocks[0].rows} hàng` : `Xếp phối hợp`}</span>
                  </div>
                  
                  <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 flex flex-col justify-center items-center text-center">
                    <span className="text-slate-500 text-sm font-medium mb-1 flex items-center justify-center space-x-1"><Printer size={14}/> <span>Số tờ in</span></span>
                    <span className="text-3xl font-bold text-slate-700">{result.sheetsNeeded.toLocaleString()}</span>
                    <span className="text-xs text-slate-400 mt-1">+100 tờ bù hao</span>
                  </div>

                  <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 flex flex-col justify-center items-center text-center">
                    <span className="text-slate-500 text-sm font-medium mb-1">Diện tích sử dụng</span>
                    <span className="text-3xl font-bold text-slate-700">{((result.itemsPerSheet * result.productW * result.productH) / (result.parentW * result.parentH) * 100).toFixed(1)}%</span>
                    <span className="text-xs text-slate-400 mt-1">{result.blocks.length > 1 ? "Kết hợp xoay chiều" : (result.blocks[0]?.isRotated ? "SP xoay dọc" : "SP xếp xuôi")}</span>
                  </div>

                  <div className="bg-emerald-50 p-4 rounded-2xl shadow-sm border border-emerald-200 flex flex-col justify-center items-center text-center">
                    <span className="text-emerald-700 text-sm font-medium mb-1">Dự toán tiền giấy</span>
                    <span className="text-2xl font-bold text-emerald-700">{Math.round(result.totalCostVnd).toLocaleString('vi-VN')} đ</span>
                    <span className="text-[11px] text-emerald-600 mt-1">{result.totalWeightKg.toFixed(1)}kg × {result.pricePerKg.toLocaleString('vi-VN')}đ</span>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex-grow flex flex-col">
                  <h2 className="text-lg font-semibold mb-4 text-slate-800 border-b pb-2 flex justify-between items-center">
                    <span>Bản vẽ kỹ thuật</span>
                    <div className="flex items-center space-x-3">
                      <span className="text-xs font-normal text-slate-500 bg-slate-100 px-2 py-1 rounded hidden md:inline-block">Tỷ lệ chính xác</span>
                      <button onClick={handleOpenOrderModal} className="text-sm font-medium bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-lg flex items-center space-x-1 transition shadow-sm">
                        <FileText size={16} /><span>Tạo lệnh cắt giấy</span>
                      </button>
                    </div>
                  </h2>
                  
                  <div className="relative w-full flex-grow flex items-center justify-center bg-slate-50 border border-dashed border-slate-300 rounded-xl p-4 overflow-hidden min-h-[400px]">
                    <ImpositionCanvas result={result} />
                  </div>
                  
                  {/* Legend */}
                  <div className="mt-4 flex flex-wrap gap-4 text-xs text-slate-600 justify-center">
                    <div className="flex items-center space-x-1"><div className="w-3 h-3 bg-white border border-slate-400"></div><span>Giấy in</span></div>
                    <div className="flex items-center space-x-1"><div className="w-3 h-3 bg-blue-100 border border-blue-400"></div><span>Bát</span></div>
                    {result.gripper > 0 && <div className="flex items-center space-x-1"><div className="w-3 h-3 bg-slate-800"></div><span>Nhíp ({result.gripper * 10}mm)</span></div>}
                    <div className="flex items-center space-x-1"><div className="w-3 h-3 border-2 border-dashed border-red-300"></div><span>Lề (2mm)</span></div>
                    {result.gap > 0 ? <div className="flex items-center space-x-1"><div className="w-3 h-3 bg-transparent border-t-2 border-green-400"></div><span>Sông ({result.gap * 10}mm)</span></div> : <div className="flex items-center space-x-1"><span className="italic text-slate-400">Đã mượn Sông</span></div>}
                  </div>

                  {generatedOrder && (
                    <div className="mt-6 p-4 bg-emerald-50 rounded-xl border border-emerald-200 relative">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-emerald-800 font-semibold text-sm">Nội dung lệnh cắt giấy:</span>
                        <button onClick={handleCopyOrder} className="text-xs flex items-center space-x-1 bg-white border border-emerald-200 hover:bg-emerald-100 text-emerald-700 px-2 py-1 rounded transition shadow-sm">
                          {orderCopied ? <Check size={14} className="text-green-600"/> : <Copy size={14}/>}<span>{orderCopied ? 'Đã copy' : 'Copy'}</span>
                        </button>
                      </div>
                      <pre className="text-sm text-slate-700 whitespace-pre-wrap font-sans bg-white p-3 rounded border border-emerald-100">{generatedOrder}</pre>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="bg-white border border-slate-200 p-10 rounded-2xl flex flex-col items-center justify-center text-slate-400 flex-grow h-full min-h-[400px]">
                <Layout size={48} className="mb-4 opacity-50"/><p>Nhập thông số và bấm tính toán để xem bản vẽ.</p>
              </div>
            )}
          </div>
        </div>
        
        {/* Modal Tạo Lệnh Cắt Giấy */}
        {isOrderModalOpen && (
          <div className="fixed inset-0 bg-slate-900 bg-opacity-50 flex justify-center items-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
              <div className="px-5 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
                <h3 className="text-lg font-bold text-slate-800">Tạo lệnh cắt giấy</h3>
                <button onClick={() => setIsOrderModalOpen(false)} className="text-slate-400 hover:text-slate-600 transition"><X size={20} /></button>
              </div>
              <div className="p-5 space-y-4 overflow-y-auto max-h-[70vh]">
                <div className="space-y-1"><label className="text-sm font-medium text-slate-700">Mã đơn</label><input type="text" name="orderCode" value={orderForm.orderCode} onChange={handleFormChange} className="w-full p-2 border border-slate-300 rounded outline-none" placeholder="VD: DH-12345" /></div>
                <div className="space-y-1"><label className="text-sm font-medium text-slate-700">Nhà cung cấp</label><input type="text" name="supplier" value={orderForm.supplier} onChange={handleFormChange} className="w-full p-2 border border-slate-300 rounded outline-none" placeholder="Tên nhà cung cấp giấy" /></div>
                <div className="space-y-1"><label className="text-sm font-medium text-slate-700">Loại giấy</label><input type="text" name="paperType" value={orderForm.paperType} onChange={handleFormChange} className="w-full p-2 border border-slate-300 rounded outline-none" /></div>
                <div className="space-y-1"><label className="text-sm font-medium text-slate-700">Ngày giao</label><input type="text" name="deliveryDate" value={orderForm.deliveryDate} onChange={handleFormChange} className="w-full p-2 border border-slate-300 rounded outline-none" placeholder="VD: Sáng mai 08/10" /></div>
                <div className="space-y-1"><label className="text-sm font-medium text-slate-700">Địa chỉ giao</label><input type="text" name="deliveryAddress" value={orderForm.deliveryAddress} onChange={handleFormChange} className="w-full p-2 border border-slate-300 rounded outline-none" placeholder="Địa chỉ xưởng/kho" /></div>
                <div className="space-y-1"><label className="text-sm font-medium text-slate-700">Ghi chú</label><textarea name="notes" value={orderForm.notes} onChange={handleFormChange} rows="2" className="w-full p-2 border border-slate-300 rounded outline-none" placeholder="Các yêu cầu khác..."></textarea></div>
              </div>
              <div className="px-5 py-4 border-t border-slate-200 bg-slate-50 flex justify-end space-x-3">
                <button onClick={() => setIsOrderModalOpen(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-200 font-medium rounded transition text-sm">Hủy</button>
                <button onClick={handleGenerateOrder} className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded shadow-sm transition flex items-center space-x-2 text-sm">
                  <FileText size={16} /><span>Tạo lệnh</span>
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
      
      <footer className="max-w-6xl mx-auto w-full mt-10 pt-6 border-t border-slate-200 text-center text-sm text-slate-500 pb-2">
        <p className="font-medium text-slate-600">&copy; {new Date().getFullYear()} Bản quyền thuộc về Công ty TNHH Sản xuất & Dịch vụ Đức Thành.</p>
        <p className="mt-1">Created by Do Trong Nghia</p>
      </footer>
    </div>
  );
}

function ImpositionCanvas({ result }) {
  if (!result) return null;
  const { parentW, parentH, blocks, gap, gripper } = result;
  const MARGIN = 0.2; const GAP = gap; const GRIPPER = gripper;
  const padding = Math.max(parentW, parentH) * 0.05;
  const viewBox = `-${padding} -${padding} ${parentW + padding*2} ${parentH + padding*2}`;

  const items = [];
  blocks.forEach((block, bIdx) => {
    for (let r = 0; r < block.rows; r++) {
      for (let c = 0; c < block.cols; c++) {
        items.push({
          x: MARGIN + block.x + c * (block.w + GAP), y: MARGIN + block.y + r * (block.h + GAP), w: block.w, h: block.h,
          id: `item-${bIdx}-${r}-${c}`, isFirstInBlock: r === 0 && c === 0 
        });
      }
    }
  });

  const fontSize = Math.max(parentW, parentH) * 0.025;
  const strokeW = Math.max(parentW, parentH) * 0.002;

  return (
    <svg className="w-full h-full max-h-[600px] drop-shadow-md" viewBox={viewBox} preserveAspectRatio="xMidYMid meet">
      <rect x={0} y={0} width={parentW} height={parentH} fill="#ffffff" stroke="#94a3b8" strokeWidth={strokeW * 2} />
      {GRIPPER > 0 && (
        <><rect x={0} y={parentH - GRIPPER} width={parentW} height={GRIPPER} fill="#1e293b" opacity="0.8"/>
          <text x={parentW / 2} y={parentH - (GRIPPER/2)} fill="white" fontSize={fontSize * 0.8} textAnchor="middle" dominantBaseline="middle">NHÍP ({GRIPPER * 10}mm)</text></>
      )}
      <rect x={MARGIN} y={MARGIN} width={parentW - (MARGIN*2)} height={parentH - MARGIN - GRIPPER} fill="none" stroke="#fca5a5" strokeWidth={strokeW} strokeDasharray={`${strokeW*4},${strokeW*4}`} />
      
      {items.map(item => (
        <g key={item.id}>
          <rect x={item.x} y={item.y} width={item.w} height={item.h} fill="#dbeafe" stroke="#3b82f6" strokeWidth={strokeW} />
          {item.isFirstInBlock && <text x={item.x + item.w/2} y={item.y + item.h/2} fill="#1e40af" fontSize={fontSize * 0.9} textAnchor="middle" dominantBaseline="middle" className="font-semibold">{item.w} x {item.h}</text>}
        </g>
      ))}

      <path d={`M 0 -${padding*0.3} L ${parentW} -${padding*0.3}`} stroke="#64748b" strokeWidth={strokeW} />
      <path d={`M 0 -${padding*0.4} L 0 -${padding*0.2}`} stroke="#64748b" strokeWidth={strokeW} />
      <path d={`M ${parentW} -${padding*0.4} L ${parentW} -${padding*0.2}`} stroke="#64748b" strokeWidth={strokeW} />
      <text x={parentW/2} y={-(padding*0.4)} fill="#475569" fontSize={fontSize} textAnchor="middle">Ngang: {parentW}cm</text>
      
      <path d={`M -${padding*0.3} 0 L -${padding*0.3} ${parentH}`} stroke="#64748b" strokeWidth={strokeW} />
      <path d={`M -${padding*0.4} 0 L -${padding*0.2} 0`} stroke="#64748b" strokeWidth={strokeW} />
      <path d={`M -${padding*0.4} ${parentH} L -${padding*0.2} ${parentH}`} stroke="#64748b" strokeWidth={strokeW} />
      <text x={-(padding*0.4)} y={parentH/2} fill="#475569" fontSize={fontSize} textAnchor="middle" transform={`rotate(-90, -${padding*0.4}, ${parentH/2})`} className="mb-2">Cao: {parentH}cm</text>
    </svg>
  );
}