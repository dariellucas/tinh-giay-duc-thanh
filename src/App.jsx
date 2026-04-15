import React, { useState, useEffect, useMemo } from 'react';
import { 
  Settings, Maximize, Printer, Layout, AlertCircle, 
  FileText, X, Copy, Check, RefreshCw, BookOpen, Book, 
  Box, ShoppingBag, Mail, StickyNote, Sparkles, Layers,
  ChevronDown, ChevronRight
} from 'lucide-react';

// ==========================================
// CONSTANTS & DỮ LIỆU CƠ BẢN
// ==========================================
const GOOGLE_SHEETS_API_URL = 'https://script.google.com/macros/s/AKfycbxxxG6_SjHC3__zrbNV2s5wTr2ngrj_4Az1xcxhpe9xR-KSowPMnwcKF_ro5s3Le-J0/exec'; 

const DEFAULT_PAPER_DATA = [
  { paperType: "Couche", gsm: 80, price: 22.4, rolls: "62; 65; 72; 79; 86; 109" }, 
  { paperType: "Couche", gsm: 100, price: 20.8, rolls: "62; 65; 72; 79; 86; 102; 109" },
  { paperType: "Couche", gsm: 120, price: 20.8, rolls: "62; 65; 72; 79; 86; 102; 109" },
  { paperType: "Couche", gsm: 150, price: 20.8, rolls: "62; 65; 72; 79; 86; 102; 109" },
  { paperType: "Couche", gsm: 180, price: 20.8, rolls: "62; 86" }, 
  { paperType: "Couche", gsm: 200, price: 20.8, rolls: "62; 65; 72; 79; 86; 102; 109" },
  { paperType: "Couche", gsm: 230, price: 20.8, rolls: "79; 109" }, 
  { paperType: "Couche", gsm: 250, price: 20.8, rolls: "62; 65; 72; 79; 86; 102; 109" },
  { paperType: "Couche", gsm: 300, price: 20.8, rolls: "62; 65; 72; 79; 86; 102; 109" }, 
  { paperType: "Couche Matt", gsm: 100, price: 20.8 },
  { paperType: "Couche Matt", gsm: 120, price: 20.8 },
  { paperType: "Off", gsm: 200, price: 26.0 }, { paperType: "Off", gsm: 250, price: 26.0 },
  { paperType: "Ivory", gsm: 210, price: 18.7 }, { paperType: "Ivory", gsm: 230, price: 17.7 },
  { paperType: "Ivory", gsm: 250, price: 17.7 }, { paperType: "Ivory", gsm: 300, price: 17.7 },
  { paperType: "Ivory", gsm: 350, price: 17.7 }, { paperType: "Ivory", gsm: 400, price: 17.7 },
  { paperType: "Duplex", gsm: 250, price: 17.0 }, { paperType: "Duplex", gsm: 270, price: 17.0 },
  { paperType: "Duplex", gsm: 300, price: 15.8 }, { paperType: "Duplex", gsm: 310, price: 15.8 },
  { paperType: "Duplex", gsm: 350, price: 15.3 }, { paperType: "Duplex", gsm: 400, price: 15.3 },
  { paperType: "Duplex", gsm: 450, price: 15.3 }, { paperType: "Kraft trắng", gsm: 100, price: 30.7 },
  { paperType: "Kraft trắng", gsm: 120, price: 30.7 }, { paperType: "Kraft nâu", gsm: 170, price: 13.6 },
  { paperType: "Kraft nâu", gsm: 250, price: 17.0 }, { paperType: "Kraft nâu", gsm: 280, price: 17.0 },
  { paperType: "Kraft nâu", gsm: 300, price: 17.0 }, { paperType: "Kraft nâu", gsm: 350, price: 17.0 },
  { paperType: "Bãi Bằng", gsm: 60, price: 25.5 }, { paperType: "Bãi Bằng", gsm: 70, price: 25.5 },
  { paperType: "Bãi Bằng", gsm: 80, price: 25.5 }, { paperType: "Bãi Bằng", gsm: 100, price: 25.5 }
];

const DEFAULT_PRINTER_DATA = [
  { id: 'fallback_1', name: '65x86', platePrice: 100000, runPrice: 500000 },
  { id: 'fallback_2', name: '52x72', platePrice: 80000, runPrice: 400000 },
  { id: 'fallback_3', name: '72x102', platePrice: 150000, runPrice: 800000 }
];

const DEFAULT_FINISHING_DATA = [
  { item: 'Xả lô', price: 0, unit: 'VNĐ / 1 bài', minPrice: 150000 },
  { item: 'Cán mờ', price: 0.25, unit: 'VNĐ / 1 cm2', minPrice: 150000 },
  { item: 'Cán bóng', price: 0.23, unit: 'VNĐ / 1 cm2', minPrice: 150000 },
  { item: 'Gấp vạch', price: 15, unit: 'VNĐ / 1 vạch / 1 tờ', minPrice: 200000 },
  { item: 'Xén', price: 30000, unit: 'VNĐ / 1 ream', minPrice: 80000 },
  { item: 'Ghim gáy', price: 15, unit: 'VNĐ / 1 trang', minPrice: 600000 },
  { item: 'Keo gáy', price: 20, unit: 'VNĐ / 1 trang', minPrice: 1000000 },
  { item: 'Khâu keo', price: 20, unit: 'VNĐ / 1 trang', minPrice: 1500000 },
  { item: 'Gáy lò xo A4', price: 4500, unit: 'VNĐ / 1 quyển', minPrice: 300000 },
  { item: 'Gáy lò xo A5', price: 3500, unit: 'VNĐ / 1 quyển', minPrice: 300000 }
];

const DEFAULT_DINHMUC_DATA = [
  { category: 'In', fromQty: 1, toQty: 5000, name: 'Ít', spoilage: 100, unit: 'Tờ in' },
  { category: 'In', fromQty: 5001, toQty: 7000, name: 'Trung bình', spoilage: 150, unit: 'Tờ in' },
  { category: 'In', fromQty: 7001, toQty: 10000, name: 'Nhiều', spoilage: 200, unit: 'Tờ in' },
  { category: 'In', fromQty: 10001, toQty: 9999999999, name: 'Rất nhiều', spoilage: 300, unit: 'Tờ in' }
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

const LAMINATION_TYPES = [
  { id: 'none', label: 'Không cán' },
  { id: 'matte', label: 'Cán mờ' },
  { id: 'glossy', label: 'Cán bóng' }
];

const MARKUP_RATES = [
  1.1, 1.15, 1.2, 1.25, 1.3, 1.35, 1.4, 1.45, 1.5, 1.55, 1.6, 1.65, 1.7, 1.75, 1.8
];

const BINDING_TYPES = [
  { id: 'ghim', label: 'Ghim gáy' },
  { id: 'keo', label: 'Keo gáy' },
  { id: 'khau', label: 'Khâu keo' },
  { id: 'loxo', label: 'Gáy lò xo' }
];


// ==========================================
// THÀNH PHẦN CANVAS BẢN VẼ (Cho Tờ Rơi)
// ==========================================
function ImpositionCanvas({ result }) {
  if (!result) return null;
  const { parentW, parentH, blocks, gap, gripper, impositionStyle, printSides, topMargin } = result;
  const MARGIN = 0.2; const GAP = gap; const GRIPPER = gripper;
  const padding = Math.max(parentW, parentH) * 0.05;
  const viewBox = `-${padding} -${padding} ${parentW + padding*2} ${parentH + padding*2}`;

  const items = [];
  blocks.forEach((block, bIdx) => {
    for (let r = 0; r < block.rows; r++) {
      for (let c = 0; c < block.cols; c++) {
        let sideLabel = 'A';
        if (printSides === 2) {
          if (impositionStyle === 'Trở nó') {
            sideLabel = c < block.cols / 2 ? 'A' : 'B';
          } else if (impositionStyle === 'Trở lật') {
            sideLabel = r < block.rows / 2 ? 'A' : 'B';
          }
        }
        
        items.push({
          x: MARGIN + block.x + c * (block.w + GAP), 
          y: topMargin + block.y + r * (block.h + GAP), 
          w: block.w, h: block.h,
          id: `item-${bIdx}-${r}-${c}`, 
          isFirstInBlock: r === 0 && c === 0,
          sideLabel: sideLabel
        });
      }
    }
  });

  const fontSize = Math.max(parentW, parentH) * 0.025;
  const strokeW = Math.max(parentW, parentH) * 0.002;
  const hasTopGripper = printSides === 2 && impositionStyle === 'Trở lật' && GRIPPER > 0;

  return (
    <svg className="w-full h-full max-h-[600px] drop-shadow-md" viewBox={viewBox} preserveAspectRatio="xMidYMid meet">
      <rect x={0} y={0} width={parentW} height={parentH} fill="#ffffff" stroke="#94a3b8" strokeWidth={strokeW * 2} />
      
      {GRIPPER > 0 && (
        <><rect x={0} y={parentH - GRIPPER} width={parentW} height={GRIPPER} fill="#1e293b" opacity="0.8"/>
          <text x={parentW / 2} y={parentH - (GRIPPER/2)} fill="white" fontSize={fontSize * 0.8} textAnchor="middle" dominantBaseline="middle">NHÍP ({GRIPPER * 10}mm)</text></>
      )}

      {hasTopGripper && (
        <><rect x={0} y={0} width={parentW} height={GRIPPER} fill="#1e293b" opacity="0.8"/>
          <text x={parentW / 2} y={GRIPPER/2} fill="white" fontSize={fontSize * 0.8} textAnchor="middle" dominantBaseline="middle" transform={`rotate(180, ${parentW/2}, ${GRIPPER/2})`}>NHÍP ({GRIPPER * 10}mm)</text></>
      )}

      <rect x={MARGIN} y={topMargin} width={parentW - (MARGIN*2)} height={parentH - topMargin - (GRIPPER > 0 ? GRIPPER : MARGIN)} fill="none" stroke="#fca5a5" strokeWidth={strokeW} strokeDasharray={`${strokeW*4},${strokeW*4}`} />
      
      {items.map(item => (
        <g key={item.id}>
          <rect x={item.x} y={item.y} width={item.w} height={item.h} fill="#dbeafe" stroke="#3b82f6" strokeWidth={strokeW} />
          <text x={item.x + item.w/2} y={item.y + item.h/2} fill="#3b82f6" opacity="0.15" fontSize={Math.min(item.w, item.h) * 0.6} fontWeight="bold" textAnchor="middle" dominantBaseline="central">
            {item.sideLabel}
          </text>
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

// ==========================================
// MODULE 1: TỜ RỜI (Flyers, Vouchers, etc.)
// ==========================================
function ToRoiCalculator({ paperDatabase, printerDatabase, finishingDatabase, dinhMucDatabase, isLoadingPrices, priceLoadError, fetchPaperPrices }) {
  // --- STATES ---
  const [parentSizeIdx, setParentSizeIdx] = useState('');
  const [customParentW, setCustomParentW] = useState('');
  const [customParentH, setCustomParentH] = useState('');
  const [rollWidth, setRollWidth] = useState('');
  const [rollSplit, setRollSplit] = useState(1);
  const [rollCutLength, setRollCutLength] = useState('');
  const [productTypeIdx, setProductTypeIdx] = useState('');
  const [customW, setCustomW] = useState('');
  const [customH, setCustomH] = useState('');
  const [isKhoThieu, setIsKhoThieu] = useState(false);
  const [quantity, setQuantity] = useState('');
  const [productName, setProductName] = useState('');
  const [printColors, setPrintColors] = useState(4);
  const [printSides, setPrintSides] = useState(2);
  const [impositionStyle, setImpositionStyle] = useState('Trở nó');
  const [lamination, setLamination] = useState('none');
  const [laminationSides, setLaminationSides] = useState(1);
  const [foldingLines, setFoldingLines] = useState(0);
  const [selectedPrinter, setSelectedPrinter] = useState('');
  const [shippingCost, setShippingCost] = useState(0);
  const [markup, setMarkup] = useState(1.1);
  const [paperType, setPaperType] = useState('');
  const [paperGsm, setPaperGsm] = useState('');
  const [muonSong, setMuonSong] = useState(false);
  const [muonNhip, setMuonNhip] = useState(false);
  const [allowMixed, setAllowMixed] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [orderForm, setOrderForm] = useState({
    orderCode: '', supplier: '', paperType: '', deliveryDate: '', deliveryAddress: '', notes: ''
  });
  const [generatedOrder, setGeneratedOrder] = useState('');
  const [orderCopied, setOrderCopied] = useState(false);

  const MARGIN = 0.2;

  const { reqMax, reqMin } = useMemo(() => {
    let pw = 0, ph = 0;
    if (parentSizeIdx === '') {
      pw = 0; ph = 0;
    } else if (parentSizeIdx === PARENT_PAPER_SIZES.length) {
      pw = parseFloat(customParentW) || 0;
      ph = parseFloat(customParentH) || 0;
    } else if (parentSizeIdx === PARENT_PAPER_SIZES.length + 1) {
      pw = (parseFloat(rollWidth) || 0) / rollSplit;
      ph = parseFloat(rollCutLength) || 0;
    } else {
      pw = PARENT_PAPER_SIZES[parentSizeIdx].w;
      ph = PARENT_PAPER_SIZES[parentSizeIdx].h;
    }
    return { reqMax: Math.max(pw, ph), reqMin: Math.min(pw, ph) };
  }, [parentSizeIdx, customParentW, customParentH, rollWidth, rollSplit, rollCutLength]);

  const validPrinters = useMemo(() => {
    if (!printerDatabase) return [];
    return printerDatabase.filter(p => {
      const normalizedName = p.name.replace(/,/g, '.');
      const match = normalizedName.match(/(\d+(?:\.\d+)?)\s*[xX]\s*(\d+(?:\.\d+)?)/);
      if (match) {
        const pMax = Math.max(parseFloat(match[1]), parseFloat(match[2]));
        const pMin = Math.min(parseFloat(match[1]), parseFloat(match[2]));
        return pMax >= reqMax && pMin >= reqMin;
      }
      return true;
    });
  }, [printerDatabase, reqMax, reqMin]);

  useEffect(() => {
    if (validPrinters.length > 0) {
      if (!validPrinters.find(p => p.id === selectedPrinter)) {
        setSelectedPrinter(validPrinters[0].id);
      }
    } else {
      setSelectedPrinter('');
    }
  }, [validPrinters, selectedPrinter]);

  const availablePaperTypes = paperDatabase ? Object.keys(paperDatabase) : [];
  const availableGsms = paperDatabase && paperDatabase[paperType] 
    ? Object.keys(paperDatabase[paperType]).map(Number).sort((a,b)=>a-b) 
    : [];

  const availableRolls = useMemo(() => {
    if (paperDatabase && paperType && paperGsm && paperDatabase[paperType][paperGsm]) {
       return paperDatabase[paperType][paperGsm].rolls || [];
    }
    return [];
  }, [paperDatabase, paperType, paperGsm]);

  useEffect(() => {
    if (availableRolls.length > 0) {
      if (!availableRolls.includes(String(rollWidth))) {
        setRollWidth(availableRolls[0]);
      }
    } else {
      setRollWidth('');
    }
  }, [availableRolls, rollWidth]);

  const calculateImposition = (e) => {
    const isManualClick = e && e.type === 'click';

    if (!paperDatabase || !printerDatabase) {
      setError('Đang tải dữ liệu, vui lòng chờ...');
      return;
    }

    if (productTypeIdx === '' || quantity === '' || parentSizeIdx === '' || paperType === '' || paperGsm === '') {
      if (isManualClick) setError('Vui lòng chọn đầy đủ Khổ SP, Số lượng in, Loại giấy và Khổ giấy in.');
      else setError('');
      setResult(null);
      return;
    }

    if (validPrinters.length === 0 || !selectedPrinter) {
      setError(`Kích thước giấy in (${reqMin}x${reqMax}) quá lớn. Không có máy in nào phù hợp!`);
      setResult(null);
      return;
    }

    setError('');
    setGeneratedOrder('');
    
    const GAP = muonSong ? 0 : 0.4;
    const GRIPPER = muonNhip ? 0 : 1.0;
    
    // ÉP BUỘC TỜ GIẤY IN LUÔN NẰM NGANG (LANDSCAPE)
    const Pw = reqMax; 
    const Ph = reqMin;

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

    const isTroLat = printSides === 2 && impositionStyle === 'Trở lật';
    const topMargin = (isTroLat && !muonNhip) ? GRIPPER : MARGIN;
    const bottomMargin = !muonNhip ? GRIPPER : MARGIN;
    
    const usableW = Pw - (MARGIN * 2);
    const usableH = Ph - topMargin - bottomMargin;

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

    const soToInLyThuyet = Math.ceil(qty / bestOpt.total); 

    let dynamicSpoilage = 100; // Giá trị mặc định
    if (dinhMucDatabase && dinhMucDatabase.length > 0) {
      const printSpoilageRules = dinhMucDatabase.filter(d => d.category === 'In');
      for (let i = 0; i < printSpoilageRules.length; i++) {
        const rule = printSpoilageRules[i];
        const fromQ = parseInt(rule.fromQty) || 0;
        const toQ = parseInt(rule.toQty) || 0;
        const spoilVal = parseInt(rule.spoilage) || 0;
        
        if (soToInLyThuyet >= fromQ && soToInLyThuyet <= toQ) {
          dynamicSpoilage = spoilVal;
          break;
        }
      }
    }

    if (printSides === 2 && impositionStyle === 'Trở khác') {
      dynamicSpoilage += 50;
    }

    const parentSheetsNeeded = soToInLyThuyet + dynamicSpoilage;

    const pricePerTon = paperDatabase[paperType] && paperDatabase[paperType][paperGsm] 
      ? paperDatabase[paperType][paperGsm].price 
      : 0; 
    
    const areaM2 = (Pw * Ph) / 10000;
    const weightPerSheetKg = (areaM2 * paperGsm) / 1000;
    const totalWeightKg = weightPerSheetKg * parentSheetsNeeded;
    const pricePerKg = pricePerTon * 1000;
    const totalCostVnd = totalWeightKg * pricePerKg;

    const getFinishing = (name) => finishingDatabase.find(f => f.item.trim().toLowerCase() === name.trim().toLowerCase());

    const tienGiay = totalCostVnd;

    let tienXaLo = 0;
    if (parentSizeIdx === PARENT_PAPER_SIZES.length + 1) {
      const xaLoObj = getFinishing('xả lô');
      tienXaLo = xaLoObj ? parseFloat(xaLoObj.minPrice) : 150000;
    }
    
    let soKem = printColors;
    if (printSides === 2 && impositionStyle === 'Trở khác') {
      soKem = printColors * 2;
    }
    const selectedPrinterObj = printerDatabase.find(p => p.id === selectedPrinter);
    const giaKem = selectedPrinterObj ? parseFloat(selectedPrinterObj.platePrice) || 0 : 0;
    const tienKem = soKem * giaKem;

    let soLuotInMoiKem = soToInLyThuyet;
    if (printSides === 2) {
      if (impositionStyle === 'Trở khác') {
        soLuotInMoiKem = soToInLyThuyet;
      } else {
        soLuotInMoiKem = soToInLyThuyet * 2;
      }
    }

    const quaLuotMoiKem = Math.max(0, soLuotInMoiKem - 1000); 
    const giaLuotCoBan = selectedPrinterObj ? parseFloat(selectedPrinterObj.runPrice) || 0 : 0;
    const giaLuot = printColors === 1 ? giaLuotCoBan + 10 : giaLuotCoBan;
    const tienIn = quaLuotMoiKem * soKem * giaLuot;

    const haoIn = 30;
    const haoCan = 20;
    const haoGap = 20;

    let tienCan = 0;
    let canDetail = '';
    if (lamination !== 'none') {
      const canName = lamination === 'matte' ? 'cán mờ' : 'cán bóng';
      const canObj = getFinishing(canName);
      if (canObj) {
        const toCan = Math.max(0, parentSheetsNeeded - haoIn - haoCan);
        const areaCm2 = Pw * Ph;
        const totalArea = areaCm2 * toCan * laminationSides;
        const cost = totalArea * parseFloat(canObj.price);
        tienCan = Math.max(cost, parseFloat(canObj.minPrice));
        canDetail = `(${toCan.toLocaleString('vi-VN')} tờ × ${laminationSides} mặt × ${areaCm2.toLocaleString('vi-VN')}cm² × ${canObj.price}đ)`;
      }
    }

    let tienXen = 0;
    let xenDetail = '';
    const xenObj = getFinishing('xén');
    if (xenObj) {
      const reams = parentSheetsNeeded / 500;
      const cost = reams * parseFloat(xenObj.price);
      tienXen = Math.max(cost, parseFloat(xenObj.minPrice));
      xenDetail = `(${reams.toFixed(1)} ram × ${xenObj.price.toLocaleString('vi-VN')}đ)`;
    }

    let tienGapVach = 0;
    let gapDetail = '';
    if (foldingLines > 0) {
      const gapObj = getFinishing('gấp vạch');
      if (gapObj) {
        const haoCanThucTe = lamination !== 'none' ? haoCan : 0;
        const toGap = Math.max(0, parentSheetsNeeded - haoIn - haoCanThucTe - haoGap);
        const soSanPhamGap = toGap * bestOpt.total; // Tính ra tổng số SP

        const cost = soSanPhamGap * foldingLines * parseFloat(gapObj.price);
        tienGapVach = Math.max(cost, parseFloat(gapObj.minPrice));
        gapDetail = `(${soSanPhamGap.toLocaleString('vi-VN')} SP × ${foldingLines} vạch × ${gapObj.price}đ)`;
      }
    }

    const tienVanChuyen = parseFloat(shippingCost) || 0; 

    const giaSanXuat = tienGiay + tienXaLo + tienKem + tienIn + tienCan + tienXen + tienGapVach + tienVanChuyen;
    const giaBan = giaSanXuat * markup;
    const donGiaSP = giaBan / qty;

    setResult({
      parentW: Pw, parentH: Ph, productW: prodW, productH: prodH,
      blocks: bestOpt.blocks, itemsPerSheet: bestOpt.total, sheetsNeeded: parentSheetsNeeded,
      requestedQty: qty, printableW: usableW, printableH: usableH, gap: GAP, gripper: GRIPPER,
      paperType, paperGsm, totalWeightKg, pricePerKg, totalCostVnd,
      impositionStyle, printSides, topMargin,
      dynamicSpoilage,
      costs: {
        tienGiay, tienXaLo, tienKem, tienIn, tienCan, tienXen, tienGapVach, tienVanChuyen,
        giaSanXuat, giaBan, donGiaSP, markup,
        soKem, giaKem, quaLuotMoiKem, giaLuot, canDetail, xenDetail, gapDetail
      }
    });
  };

  useEffect(() => {
    if(!isLoadingPrices && (!error || error.includes("lớn") || error.includes("hợp lệ") || error.includes("Khổ SP"))) calculateImposition();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [parentSizeIdx, customParentW, customParentH, productTypeIdx, customW, customH, quantity, muonSong, muonNhip, isKhoThieu, paperType, paperGsm, allowMixed, isLoadingPrices, rollWidth, rollSplit, rollCutLength, impositionStyle, printSides, lamination, laminationSides, foldingLines, shippingCost, markup, finishingDatabase, dinhMucDatabase]);

  const { canTroNo, canTroLat, troReason } = useMemo(() => {
    if (!result || printSides === 1) return { canTroNo: true, canTroLat: true, troReason: '' };
    
    if (result.itemsPerSheet % 2 !== 0) {
      return { canTroNo: false, canTroLat: false, troReason: 'Tổng số bát lẻ, bắt buộc in Trở khác.' };
    }
    
    if (result.blocks.length > 1) {
      return { canTroNo: false, canTroLat: false, troReason: 'Bản vẽ xếp chữ L thiếu đối xứng, bắt buộc in Trở khác.' };
    }

    const cols = result.blocks[0].cols;
    const rows = result.blocks[0].rows;
    
    const troNo = cols % 2 === 0;
    const troLat = rows % 2 === 0;
    
    let reason = '';
    if (!troNo && !troLat) reason = 'Số cột và hàng đều lẻ, không thể in Trở hay lật.';
    else if (!troNo && impositionStyle === 'Trở nó') reason = 'Số cột lẻ, không thể in Trở nó.';
    else if (!troLat && impositionStyle === 'Trở lật') reason = 'Số hàng lẻ, không thể in Trở lật.';

    return { canTroNo: troNo, canTroLat: troLat, troReason: reason };
  }, [result, printSides, impositionStyle]);

  useEffect(() => {
    if (printSides === 2) {
      if (impositionStyle === 'Trở nó' && !canTroNo) setImpositionStyle('Trở khác');
      if (impositionStyle === 'Trở lật' && !canTroLat) setImpositionStyle('Trở khác');
    }
  }, [printSides, canTroNo, canTroLat, impositionStyle]);

  const handleOpenOrderModal = () => {
    if (result) {
      setOrderForm(prev => ({ ...prev, paperType: `${result.paperType} ${result.paperGsm} gsm` }));
    }
    setIsOrderModalOpen(true);
  };

  const handleGenerateOrder = () => {
    if (!result) return;
    const finalPaperType = orderForm.paperType || `${result.paperType} ${result.paperGsm} gsm`;
    const orderText = `Đơn đặt hàng\nDear ${orderForm.supplier || '[Nhà cung cấp]'}, Đức Thành gửi đơn đặt hàng với nội dung sau:\n- Mã đơn: ${orderForm.orderCode || '[Mã đơn]'}\n- Loại giấy: ${finalPaperType}\n- Kích thước: ${result.parentW} x ${result.parentH} cm\n- Số lượng: ${result.sheetsNeeded.toLocaleString('vi-VN')} tờ\n- Ngày giao: ${orderForm.deliveryDate || '[Ngày giao]'}\n- Địa chỉ giao: ${orderForm.deliveryAddress || '[Địa chỉ giao]'}\n- Ghi chú: ${orderForm.notes || '[Ghi chú]'}`;
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

  return (
    <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 xl:h-full min-h-0">
      {/* KHU VỰC TRÁI */}
      <div className="xl:col-span-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-6 xl:overflow-y-auto custom-scrollbar xl:h-full">
        <h2 className="text-lg font-semibold flex items-center space-x-2 border-b pb-3 shrink-0">
          <Settings size={20} className="text-blue-500"/>
          <span>Thông Số Đầu Vào</span>
        </h2>

        {/* 1. THÔNG TIN CHUNG */}
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-slate-800 bg-slate-100 p-2 rounded">1. Thông tin chung</h3>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Tên sản phẩm</label>
            <input type="text" className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="VD: Tờ rơi khai trương..." value={productName} onChange={(e) => setProductName(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Số lượng in *</label>
              <input type="number" className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-semibold text-blue-700" value={quantity} onChange={(e) => setQuantity(e.target.value)} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Khổ SP *</label>
              <select className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" value={productTypeIdx} onChange={(e) => setProductTypeIdx(e.target.value === '' ? '' : parseInt(e.target.value))}>
                <option value="" disabled hidden>Chọn khổ SP...</option>
                {PRODUCT_SIZES.map((size, idx) => {
                  let label = size.label; if (isKhoThieu && KHO_THIEU_SIZES[idx]) label = KHO_THIEU_SIZES[idx].label;
                  return <option key={idx} value={idx}>{label}</option>
                })}
              </select>
            </div>
          </div>
          {productTypeIdx !== '' && productTypeIdx !== PRODUCT_SIZES.length - 1 && (
            <div className="pt-1">
              <label className="flex items-center space-x-2 cursor-pointer group w-fit">
                <input type="checkbox" className="w-4 h-4 rounded text-blue-600 cursor-pointer" checked={isKhoThieu} onChange={(e) => setIsKhoThieu(e.target.checked)} />
                <span className="text-sm font-medium text-slate-700 group-hover:text-blue-600 transition-colors">Chọn khổ thiếu</span>
              </label>
            </div>
          )}
          {productTypeIdx === PRODUCT_SIZES.length - 1 && (
            <div className="grid grid-cols-2 gap-4 bg-blue-50 p-3 rounded-lg border border-blue-100">
              <div className="space-y-1"><label className="text-xs font-medium text-slate-600">Ngang (cm)</label><input type="number" step="0.1" className="w-full p-2 border border-slate-300 rounded outline-none" value={customW} onChange={(e) => setCustomW(e.target.value)}/></div>
              <div className="space-y-1"><label className="text-xs font-medium text-slate-600">Cao (cm)</label><input type="number" step="0.1" className="w-full p-2 border border-slate-300 rounded outline-none" value={customH} onChange={(e) => setCustomH(e.target.value)}/></div>
            </div>
          )}
        </div>

        {/* 2. VẬT TƯ GIẤY */}
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-slate-800 bg-slate-100 p-2 rounded flex justify-between items-center">
            <span>2. Vật tư giấy & Bình bản</span>
            <button onClick={fetchPaperPrices} disabled={isLoadingPrices} className="text-xs flex items-center space-x-1 text-blue-600 hover:text-blue-800 disabled:opacity-50 font-normal">
              <RefreshCw size={12} className={isLoadingPrices ? "animate-spin" : ""} /><span>Cập nhật giá</span>
            </button>
          </h3>
          {isLoadingPrices ? (
            <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 text-center text-sm text-slate-500 animate-pulse">Đang tải bảng giá...</div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-600">Loại giấy *</label>
                <select className="w-full p-2 bg-slate-50 border border-slate-300 rounded outline-none text-sm" value={paperType} onChange={(e) => { const newType = e.target.value; setPaperType(newType); setPaperGsm(''); }}>
                  <option value="" disabled hidden>Chọn loại giấy...</option>
                  {availablePaperTypes.map(type => <option key={type} value={type}>{type}</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-600">Định lượng *</label>
                <select className="w-full p-2 bg-slate-50 border border-slate-300 rounded outline-none text-sm" value={paperGsm} onChange={(e) => setPaperGsm(e.target.value === '' ? '' : Number(e.target.value))} disabled={!paperType}>
                  <option value="" disabled hidden>Chọn định lượng...</option>
                  {availableGsms.map(gsm => <option key={gsm} value={gsm}>{gsm}</option>)}
                </select>
              </div>
            </div>
          )}
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <label className="text-sm font-medium text-slate-700 flex justify-between">
              <span>Khổ giấy in (Nguyên khổ) *</span>
              {parentSizeIdx === PARENT_PAPER_SIZES.length + 1 && reqMax > 0 && (
                <span className="text-xs text-amber-600 font-semibold bg-amber-100 px-2 py-0.5 rounded">
                  Khổ xả: {reqMin} x {reqMax} cm
                </span>
              )}
            </label>
            <select className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm" value={parentSizeIdx} onChange={(e) => setParentSizeIdx(e.target.value === '' ? '' : parseInt(e.target.value))}>
              <option value="" disabled hidden>Chọn khổ giấy in...</option>
              {PARENT_PAPER_SIZES.map((size, idx) => (<option key={idx} value={idx}>{size.label}</option>))}
              <option value={PARENT_PAPER_SIZES.length}>Tùy chọn...</option>
              <option value={PARENT_PAPER_SIZES.length + 1}>Xả lô (Từ cuộn)...</option>
            </select>
          </div>
          {parentSizeIdx === PARENT_PAPER_SIZES.length && (
            <div className="grid grid-cols-2 gap-4 bg-emerald-50 p-2.5 rounded-lg border border-emerald-100">
              <div className="space-y-1"><label className="text-xs font-medium text-slate-600">Ngang (cm)</label><input type="number" step="0.1" className="w-full p-2 border border-slate-300 rounded outline-none" value={customParentW} onChange={(e) => setCustomParentW(e.target.value)}/></div>
              <div className="space-y-1"><label className="text-xs font-medium text-slate-600">Cao (cm)</label><input type="number" step="0.1" className="w-full p-2 border border-slate-300 rounded outline-none" value={customParentH} onChange={(e) => setCustomParentH(e.target.value)}/></div>
            </div>
          )}
          {parentSizeIdx === PARENT_PAPER_SIZES.length + 1 && (
            <div className="grid grid-cols-3 gap-3 bg-amber-50 p-2.5 rounded-lg border border-amber-200 shadow-inner mt-1">
              <div className="space-y-1">
                <label className="text-xs font-bold text-amber-800">Khổ lô (cm)</label>
                {availableRolls.length > 0 ? (
                  <select className="w-full p-2 bg-white border border-amber-300 rounded outline-none text-sm font-semibold text-amber-900" value={rollWidth} onChange={(e) => setRollWidth(e.target.value)}>
                    {availableRolls.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                ) : (
                  <input type="text" className="w-full p-2 border border-amber-200 rounded outline-none text-sm text-slate-400 bg-amber-100" value="Không có lô" disabled />
                )}
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-amber-800">Chia lô</label>
                <select className="w-full p-2 bg-white border border-amber-300 rounded outline-none text-sm" value={rollSplit} onChange={(e) => setRollSplit(Number(e.target.value))}>
                  {[1, 2, 3].map(v => <option key={v} value={v}>Chia {v}</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-amber-800">Chiều dài xả</label>
                <input type="number" step="0.1" className="w-full p-2 border border-amber-300 rounded outline-none text-sm" placeholder="VD: 30" value={rollCutLength} onChange={(e) => setRollCutLength(e.target.value)}/>
              </div>
            </div>
          )}
          <div className="flex flex-wrap gap-x-5 gap-y-2 pt-3 mt-1 border-t border-slate-100">
            <label className="flex items-center space-x-1.5 cursor-pointer group">
              <input type="checkbox" className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500" checked={muonSong} onChange={(e) => setMuonSong(e.target.checked)} />
              <span className="text-sm font-medium text-slate-700">Mượn sông</span>
            </label>
            <label className="flex items-center space-x-1.5 cursor-pointer group">
              <input type="checkbox" className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500" checked={muonNhip} onChange={(e) => setMuonNhip(e.target.checked)} />
              <span className="text-sm font-medium text-slate-700">Mượn nhíp</span>
            </label>
            <label className="flex items-center space-x-1.5 cursor-pointer group">
              <input type="checkbox" className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500" checked={allowMixed} onChange={(e) => setAllowMixed(e.target.checked)} />
              <span className="text-sm font-medium text-slate-700">Xếp phối hợp (L)</span>
            </label>
          </div>
        </div>

        {/* 3. THÔNG SỐ IN ẤN */}
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-slate-800 bg-slate-100 p-2 rounded">3. Thông số in ấn</h3>
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-600">Số màu in</label>
              <select className="w-full p-2 bg-slate-50 border border-slate-300 rounded outline-none text-sm" value={printColors} onChange={(e) => setPrintColors(Number(e.target.value))}>
                {[1, 2, 3, 4].map(c => <option key={c} value={c}>{c} màu</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-600">Số mặt in</label>
              <select className="w-full p-2 bg-slate-50 border border-slate-300 rounded outline-none text-sm" value={printSides} onChange={(e) => {
                const val = Number(e.target.value);
                setPrintSides(val);
                if (val === 1) setImpositionStyle('Trở nó');
              }}>
                <option value={1}>1 mặt</option>
                <option value={2}>2 mặt</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-600">Kiểu in trở</label>
              <select className="w-full p-2 bg-slate-50 border border-slate-300 rounded outline-none text-sm" value={impositionStyle} onChange={(e) => setImpositionStyle(e.target.value)} disabled={printSides === 1}>
                <option value="Trở nó" disabled={!canTroNo}>Trở nó</option>
                <option value="Trở khác">Trở khác</option>
                <option value="Trở lật" disabled={!canTroLat}>Trở lật</option>
              </select>
              {printSides === 2 && troReason && (
                <p className="text-[10px] text-amber-600 leading-tight mt-1 font-medium">{troReason}</p>
              )}
            </div>
          </div>
          <div className="space-y-1 pt-1">
            <label className="text-xs font-medium text-slate-600">Chọn máy in</label>
            <select 
              className={`w-full p-2 bg-slate-50 border rounded outline-none text-sm font-medium ${validPrinters.length === 0 ? 'border-red-300 text-red-600' : 'border-slate-300 text-blue-700'}`} 
              value={selectedPrinter} 
              onChange={(e) => setSelectedPrinter(e.target.value)}
              disabled={validPrinters.length === 0}
            >
              {validPrinters.length > 0 ? (
                validPrinters.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))
              ) : (
                <option value="">Không có máy in phù hợp</option>
              )}
            </select>
            {validPrinters.length === 0 && (
              <p className="text-[11px] text-red-500 mt-1 font-medium">Khổ giấy in ({reqMin}x{reqMax}) lớn hơn tất cả máy in hiện có!</p>
            )}
          </div>
        </div>

        {/* 4. GIA CÔNG */}
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-slate-800 bg-slate-100 p-2 rounded">4. Gia công & Khác</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-600">Cán màng</label>
              <select className="w-full p-2 bg-slate-50 border border-slate-300 rounded outline-none text-sm" value={lamination} onChange={(e) => setLamination(e.target.value)}>
                {LAMINATION_TYPES.map(l => <option key={l.id} value={l.id}>{l.label}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-600">Số mặt cán</label>
              <select className="w-full p-2 bg-slate-50 border border-slate-300 rounded outline-none text-sm" value={laminationSides} onChange={(e) => setLaminationSides(Number(e.target.value))} disabled={lamination === 'none'}>
                <option value={1}>1 mặt</option>
                <option value={2}>2 mặt</option>
              </select>
            </div>
            <div className="col-span-2 space-y-1">
              <label className="text-xs font-medium text-slate-600">Gấp vạch</label>
              <select className="w-full p-2 bg-slate-50 border border-slate-300 rounded outline-none text-sm" value={foldingLines} onChange={(e) => setFoldingLines(Number(e.target.value))}>
                {[0, 1, 2, 3, 4].map(v => <option key={v} value={v}>{v} vạch</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* 5. TỔNG HỢP TÀI CHÍNH */}
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-slate-800 bg-slate-100 p-2 rounded">5. Tổng hợp tài chính</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-slate-700">Vận chuyển (VNĐ)</label>
              <input type="number" className="w-1/2 p-2 bg-slate-50 border border-slate-300 rounded outline-none text-sm text-right font-medium" value={shippingCost} onChange={(e) => setShippingCost(Number(e.target.value))} />
            </div>
            <div className="flex items-center justify-between">
              <label className="text-sm font-bold text-slate-800">Hệ số lợi nhuận</label>
              <select className="w-1/2 p-2 bg-emerald-50 border border-emerald-300 text-emerald-800 rounded outline-none font-bold text-right" value={markup} onChange={(e) => setMarkup(Number(e.target.value))}>
                {MARKUP_RATES.map(m => <option key={m} value={m}>x {m}</option>)}
              </select>
            </div>
          </div>
        </div>

        <button 
          onClick={calculateImposition} 
          disabled={isLoadingPrices || validPrinters.length === 0} 
          className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-colors flex justify-center items-center space-x-2 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed mt-4 shrink-0"
        >
          <Maximize size={18} /><span>Tính toán & Báo giá</span>
        </button>
      </div>

      {/* KHU VỰC PHẢI */}
      <div className="xl:col-span-8 flex flex-col space-y-6 xl:overflow-y-auto custom-scrollbar xl:h-full xl:pr-2 xl:pb-6">
        {error ? (
          <div className="bg-red-50 border border-red-200 text-red-700 p-6 rounded-2xl flex items-center space-x-3"><AlertCircle size={24} /><span className="font-medium">{error}</span></div>
        ) : result ? (
          <>
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col shrink-0">
              <h2 className="text-lg font-semibold mb-4 text-slate-800 border-b pb-2 flex justify-between items-center">
                <span>Bản vẽ kỹ thuật</span>
                <div className="flex items-center space-x-3">
                  <span className="text-xs font-normal text-slate-500 bg-slate-100 px-2 py-1 rounded hidden md:inline-block">Tỷ lệ chính xác</span>
                  <button onClick={handleOpenOrderModal} className="text-sm font-medium bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-lg flex items-center space-x-1 transition shadow-sm">
                    <FileText size={16} /><span>Tạo lệnh cắt giấy</span>
                  </button>
                </div>
              </h2>
              
              <div className="relative w-full flex items-center justify-center bg-slate-50 border border-dashed border-slate-300 rounded-xl p-4 overflow-hidden min-h-[400px]">
                <ImpositionCanvas result={result} />
              </div>
              
              <div className="mt-4 flex flex-wrap gap-4 text-xs text-slate-600 justify-center">
                <div className="flex items-center space-x-1"><div className="w-3 h-3 bg-white border border-slate-400"></div><span>Giấy in</span></div>
                <div className="flex items-center space-x-1"><div className="w-3 h-3 bg-blue-100 border border-blue-400"></div><span>Bát</span></div>
                {result.gripper > 0 && <div className="flex items-center space-x-1"><div className="w-3 h-3 bg-slate-800"></div><span>Nhíp ({result.gripper * 10}mm)</span></div>}
                <div className="flex items-center space-x-1"><div className="w-3 h-3 border-2 border-dashed border-red-300"></div><span>Lề (2mm)</span></div>
                {result.gap > 0 ? <div className="flex items-center space-x-1"><div className="w-3 h-3 bg-transparent border-t-2 border-green-400"></div><span>Sông ({result.gap * 10}mm)</span></div> : <div className="flex items-center space-x-1"><span className="italic text-slate-400">Đã mượn Sông</span></div>}
              </div>
            </div>

            <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 shrink-0">
              <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 flex flex-col justify-center items-center text-center">
                <span className="text-slate-500 text-sm font-medium mb-1">Số bát (SP/Tờ)</span>
                <span className="text-3xl font-bold text-blue-600">{result.itemsPerSheet}</span>
                <span className="text-xs text-slate-400 mt-1">{result.blocks.length === 1 ? `${result.blocks[0].cols} cột × ${result.blocks[0].rows} hàng` : `Xếp phối hợp`}</span>
              </div>
              
              <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 flex flex-col justify-center items-center text-center">
                <span className="text-slate-500 text-sm font-medium mb-1 flex items-center justify-center space-x-1"><Printer size={14}/> <span>Số tờ in</span></span>
                <span className="text-3xl font-bold text-slate-700">{result.sheetsNeeded.toLocaleString('vi-VN')}</span>
                <span className="text-xs text-slate-400 mt-1">+{result.dynamicSpoilage} tờ bù hao</span>
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

            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden mt-2 shrink-0">
              <div className="bg-slate-50 px-6 py-3 border-b border-slate-200">
                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Chi tiết báo giá (Dự kiến)</h3>
              </div>
              <div className="p-6">
                <div className="space-y-1">
                  
                  {/* Sử dụng cấu trúc items-start để text dài có thể wrap xuống mà không đẩy cột giá ra ngoài */}
                  <div className="flex justify-between items-start text-sm py-1.5">
                    <div className="pr-4 text-slate-600">
                      <span>1. Tiền giấy nguyên liệu:</span>
                    </div>
                    <span className="font-medium text-slate-800 whitespace-nowrap">{Math.round(result.costs.tienGiay).toLocaleString('vi-VN')} đ</span>
                  </div>

                  {result.costs.tienXaLo > 0 && (
                    <div className="flex justify-between items-start text-sm py-1.5">
                      <div className="pr-4 text-slate-600">
                        <span>2. Tiền xả lô:</span>
                      </div>
                      <span className="font-medium text-slate-800 whitespace-nowrap">{Math.round(result.costs.tienXaLo).toLocaleString('vi-VN')} đ</span>
                    </div>
                  )}

                  <div className="flex justify-between items-start text-sm py-1.5">
                    <div className="pr-4 text-slate-600">
                      <span>3. Tiền xuất kẽm</span>
                      <span className="text-[11px] text-slate-400 ml-1 leading-relaxed inline-block">({result.costs.soKem} kẽm × {result.costs.giaKem.toLocaleString('vi-VN')}đ)</span>
                    </div>
                    <span className="font-medium text-slate-800 whitespace-nowrap">{Math.round(result.costs.tienKem).toLocaleString('vi-VN')} đ</span>
                  </div>

                  <div className="flex justify-between items-start text-sm py-1.5">
                    <div className="pr-4 text-slate-600">
                      <span>4. Tiền công in</span>
                      <span className="text-[11px] text-slate-400 ml-1 leading-relaxed inline-block">
                        ({result.costs.quaLuotMoiKem > 0 ? `${result.costs.quaLuotMoiKem.toLocaleString('vi-VN')} lượt quá × ${result.costs.soKem} kẽm × ${result.costs.giaLuot.toLocaleString('vi-VN')}đ` : 'Miễn phí ≤ 1.000 lượt/kẽm'})
                      </span>
                    </div>
                    <span className="font-medium text-slate-800 whitespace-nowrap">{Math.round(result.costs.tienIn).toLocaleString('vi-VN')} đ</span>
                  </div>

                  <div className="flex justify-between items-start text-sm py-1.5">
                    <div className="pr-4 text-slate-600">
                      <span>5. Tiền cán màng</span>
                      {result.costs.tienCan > 0 && <span className="text-[11px] text-slate-400 ml-1 leading-relaxed inline-block">{result.costs.canDetail}</span>}
                    </div>
                    <span className="font-medium text-slate-800 whitespace-nowrap">{Math.round(result.costs.tienCan).toLocaleString('vi-VN')} đ</span>
                  </div>

                  <div className="flex justify-between items-start text-sm py-1.5">
                    <div className="pr-4 text-slate-600">
                      <span>6. Tiền xén thành phẩm</span>
                      <span className="text-[11px] text-slate-400 ml-1 leading-relaxed inline-block">{result.costs.xenDetail}</span>
                    </div>
                    <span className="font-medium text-slate-800 whitespace-nowrap">{Math.round(result.costs.tienXen).toLocaleString('vi-VN')} đ</span>
                  </div>

                  <div className="flex justify-between items-start text-sm py-1.5">
                    <div className="pr-4 text-slate-600">
                      <span>7. Tiền gấp vạch</span>
                      {result.costs.tienGapVach > 0 && <span className="text-[11px] text-slate-400 ml-1 leading-relaxed inline-block">{result.costs.gapDetail}</span>}
                    </div>
                    <span className="font-medium text-slate-800 whitespace-nowrap">{Math.round(result.costs.tienGapVach).toLocaleString('vi-VN')} đ</span>
                  </div>

                  <div className="flex justify-between items-start text-sm py-1.5 border-b border-slate-100 pb-3">
                    <div className="pr-4 text-slate-600">
                      <span>8. Tiền vận chuyển:</span>
                    </div>
                    <span className="font-medium text-slate-800 whitespace-nowrap">{Math.round(result.costs.tienVanChuyen).toLocaleString('vi-VN')} đ</span>
                  </div>
                  
                  <div className="flex justify-between items-center pt-3">
                    <span className="font-bold text-slate-700">TỔNG GIÁ SẢN XUẤT:</span>
                    <span className="font-bold text-lg text-slate-800">{Math.round(result.costs.giaSanXuat).toLocaleString('vi-VN')} đ</span>
                  </div>

                  <div className="flex justify-between items-center bg-blue-50 p-4 rounded-xl mt-4 border border-blue-100">
                    <div>
                      <span className="font-bold text-blue-900 block text-lg">GIÁ BÁN TỔNG</span>
                      <span className="text-xs text-blue-600 font-medium">Đã nhân hệ số {result.costs.markup}</span>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-2xl text-blue-700 block">{Math.round(result.costs.giaBan).toLocaleString('vi-VN')} đ</span>
                      <span className="text-sm font-semibold text-blue-600">~ {Math.round(result.costs.donGiaSP).toLocaleString('vi-VN')} đ/SP</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="bg-white border border-slate-200 p-10 rounded-2xl flex flex-col items-center justify-center text-slate-400 h-full min-h-[400px]">
            <Layout size={48} className="mb-4 opacity-50"/><p>Nhập thông số và bấm tính toán để xem bản vẽ.</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ==========================================
// MODULE 2: CATALOGUE (Sách, Tạp chí...)
// ==========================================

function CatalogueSignatureCanvas({ sig }) {
  const { parentW, parentH, cols, rows, itemW, itemH, gap, gripper, name, isRotated, dupCount = 1, groupCount = 1, paperType, paperGsm, sheetsNeeded, spoilage, totalSheets } = sig;
  const padding = Math.max(parentW, parentH) * 0.05;
  const viewBox = `-${padding} -${padding} ${parentW + padding*2} ${parentH + padding*2}`;

  const items = [];
  const foldLinesX = [];
  const foldLinesY = [];

  // Tính toán căn giữa sơ đồ vào giữa tờ giấy
  const totalGridW = cols * itemW + (cols - 1) * gap;
  const totalGridH = rows * itemH + (rows - 1) * gap;
  const startX = (parentW - totalGridW) / 2;
  const startY = (parentH - gripper - totalGridH) / 2;
  
  const isTroNo = dupCount > 1;
  const printStyleText = isTroNo ? "IN TRỞ NÓ" : "IN TRỞ KHÁC";
  const uniqueSpreads = Math.max(1, Math.floor((cols * rows) / dupCount));

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const index = r * cols + c;
      let letter = '';

      if (isTroNo) {
        const charIndex = index % uniqueSpreads;
        const face = (Math.floor(index / uniqueSpreads) % 2) + 1; 
        letter = String.fromCharCode(65 + charIndex) + face;
      } else {
        letter = String.fromCharCode(65 + index) + '1';
      }

      items.push({
        x: startX + c * (itemW + gap),
        y: startY + r * (itemH + gap),
        w: itemW, h: itemH,
        id: `spread-${r}-${c}`,
        letter: letter
      });
      
      if (c < cols - 1 && r === 0) {
          foldLinesX.push(startX + (c + 1) * itemW + c * gap + gap/2);
      }
    }
    if (r < rows - 1) {
        foldLinesY.push(startY + (r + 1) * itemH + r * gap + gap/2);
    }
  }

  const fontSize = Math.max(parentW, parentH) * 0.025;
  const strokeW = Math.max(parentW, parentH) * 0.002;

  return (
    <div className="flex flex-col mb-6 bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm animate-in fade-in zoom-in duration-300">
      <div className="flex justify-between items-center px-4 py-3 bg-indigo-50 border-b border-indigo-100">
        <span className="font-bold text-indigo-900 text-sm flex items-center flex-wrap gap-2">
          {name}
          {groupCount > 1 && <span className="text-[11px] font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full uppercase border border-blue-200">Giống nhau x{groupCount} tay</span>}
          <span className="text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full uppercase border border-emerald-200">
            {printStyleText}
          </span>
        </span>
        <span className="text-xs font-semibold text-indigo-700 bg-white px-2 py-1 rounded shadow-sm border border-indigo-100 shrink-0">Lưới: {cols}x{rows} Bát</span>
      </div>

      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 px-4 py-2.5 bg-slate-50 border-b border-slate-200 text-xs">
        <div className="flex items-center space-x-1.5 text-slate-600">
          <FileText size={14} className="text-slate-400" />
          <span>Giấy: <strong className="text-slate-800">{paperType} {paperGsm}gsm</strong> ({parentW}x{parentH}cm)</span>
        </div>
        <div className="flex items-center space-x-1.5 text-slate-600">
          <Printer size={14} className="text-slate-400" />
          <span>Số tờ/tay: <strong className="text-slate-800">{sheetsNeeded?.toLocaleString('vi-VN')}</strong></span>
        </div>
        <div className="flex items-center space-x-1.5 text-slate-600">
          <AlertCircle size={14} className="text-slate-400" />
          <span>Bù hao: <strong className="text-slate-800">+{spoilage}</strong> tờ</span>
        </div>
        {groupCount > 1 && (
           <div className="ml-auto font-medium text-indigo-700 bg-indigo-100 border border-indigo-200 px-2 py-0.5 rounded">
             Tổng giấy nhóm: {((totalSheets) * groupCount).toLocaleString('vi-VN')} tờ
           </div>
        )}
      </div>

      <div className="p-4 bg-slate-50/50 flex justify-center">
        <svg className="w-full h-auto max-h-[350px] drop-shadow-sm bg-white border border-slate-200 rounded-xl p-2" viewBox={viewBox} preserveAspectRatio="xMidYMid meet">
          <rect x={0} y={0} width={parentW} height={parentH} fill="#ffffff" stroke="#94a3b8" strokeWidth={strokeW * 2} />
          
          {gripper > 0 && (
            <g>
              <rect x={0} y={parentH - gripper} width={parentW} height={gripper} fill="#1e293b" opacity="0.8"/>
              <text x={parentW / 2} y={parentH - (gripper/2)} fill="white" fontSize={fontSize * 0.8} textAnchor="middle" dominantBaseline="middle">NHÍP ({gripper * 10}mm)</text>
            </g>
          )}

          {items.map(item => (
            <g key={item.id}>
              <rect x={item.x} y={item.y} width={item.w} height={item.h} fill="#e0e7ff" stroke="#6366f1" strokeWidth={strokeW} />
              
              {!isRotated ? (
                 <line x1={item.x + item.w/2} y1={item.y} x2={item.x + item.w/2} y2={item.y + item.h} stroke="#6366f1" strokeWidth={strokeW} strokeDasharray={`${strokeW*3},${strokeW*3}`} />
              ) : (
                 <line x1={item.x} y1={item.y + item.h/2} x2={item.x + item.w} y2={item.y + item.h/2} stroke="#6366f1" strokeWidth={strokeW} strokeDasharray={`${strokeW*3},${strokeW*3}`} />
              )}

              {!isRotated ? (
                <rect x={item.x} y={item.y} width={item.w} height={item.h * 0.1} fill="#818cf8" opacity="0.6" />
              ) : (
                <rect x={item.x} y={item.y} width={item.w * 0.1} height={item.h} fill="#818cf8" opacity="0.6" />
              )}

              <text 
                x={item.x + item.w/2} 
                y={item.y + item.h/2} 
                fill="#4f46e5" 
                opacity="0.15" 
                fontSize={Math.min(item.w, item.h) * 0.4} 
                fontWeight="bold" 
                textAnchor="middle" 
                dominantBaseline="central"
                transform={isRotated ? `rotate(90, ${item.x + item.w/2}, ${item.y + item.h/2})` : ""}
              >
                {item.letter}
              </text>

              <text 
                x={!isRotated ? item.x + item.w/4 : item.x + item.w/2} 
                y={!isRotated ? item.y + item.h/2 : item.y + item.h/4} 
                fill="#312e81" 
                fontSize={fontSize * 0.8} 
                fontWeight="bold" 
                textAnchor="middle" 
                dominantBaseline="central"
                transform={isRotated ? `rotate(90, ${item.x + item.w/2}, ${item.y + item.h/4})` : ""}
              >
                {!isRotated ? `${(item.w/2).toFixed(1)}x${item.h}` : `${item.w}x${(item.h/2).toFixed(1)}`}
              </text>
              <text 
                x={!isRotated ? item.x + item.w*0.75 : item.x + item.w/2} 
                y={!isRotated ? item.y + item.h/2 : item.y + item.h*0.75} 
                fill="#312e81" 
                fontSize={fontSize * 0.8} 
                fontWeight="bold" 
                textAnchor="middle" 
                dominantBaseline="central"
                transform={isRotated ? `rotate(90, ${item.x + item.w/2}, ${item.y + item.h*0.75})` : ""}
              >
                {!isRotated ? `${(item.w/2).toFixed(1)}x${item.h}` : `${item.w}x${(item.h/2).toFixed(1)}`}
              </text>
            </g>
          ))}

          {foldLinesX.map((fx, i) => (
              <line key={`fx-${i}`} x1={fx} y1={startY} x2={fx} y2={startY + totalGridH} stroke="#22c55e" strokeWidth={strokeW * 2} strokeDasharray={`${strokeW*5},${strokeW*5}`} />
          ))}
          {foldLinesY.map((fy, i) => (
              <line key={`fy-${i}`} x1={startX} y1={fy} x2={startX + totalGridW} y2={fy} stroke="#22c55e" strokeWidth={strokeW * 2} strokeDasharray={`${strokeW*5},${strokeW*5}`} />
          ))}
        </svg>
      </div>
    </div>
  );
}

function CatalogueCalculator({ paperDatabase, printerDatabase, finishingDatabase, dinhMucDatabase, isLoadingPrices, fetchPaperPrices }) {
  // --- STATES CHUNG ---
  const [productName, setProductName] = useState('Catalogue nội thất 2024');
  const [quantity, setQuantity] = useState('500');
  const [productTypeIdx, setProductTypeIdx] = useState(1); 
  const [customW, setCustomW] = useState('');
  const [customH, setCustomH] = useState('');
  const [totalPages, setTotalPages] = useState('28');
  const [bindingType, setBindingType] = useState('ghim');
  const [isCombinedPrint, setIsCombinedPrint] = useState(true); 
  const [markup, setMarkup] = useState(1.1);
  const [orientation, setOrientation] = useState('doc');
  const [isKhoThieu, setIsKhoThieu] = useState(true); 

  // --- STATES BÌA ---
  const [coverPaperType, setCoverPaperType] = useState('Couche');
  const [coverPaperGsm, setCoverPaperGsm] = useState(150);
  const [coverParentSizeIdx, setCoverParentSizeIdx] = useState(5); 
  const [coverCustomParentW, setCoverCustomParentW] = useState('');
  const [coverCustomParentH, setCustomCoverParentH] = useState('');
  const [coverPrintColors, setCoverPrintColors] = useState(4);
  const [coverPrintSides, setCoverPrintSides] = useState(2);
  const [coverPrinter, setCoverPrinter] = useState('');
  const [coverLamination, setCoverLamination] = useState('none');
  const [coverLaminationSides, setCoverLaminationSides] = useState(1);
  const [coverFoil, setCoverFoil] = useState('none'); 
  const [coverRollWidth, setCoverRollWidth] = useState('');
  const [coverRollSplit, setCoverRollSplit] = useState(1);
  const [coverRollCutLength, setCoverRollCutLength] = useState('');

  // --- STATES RUỘT ---
  const [innerPaperType, setInnerPaperType] = useState('');
  const [innerPaperGsm, setInnerPaperGsm] = useState('');
  const [innerParentSizeIdx, setInnerParentSizeIdx] = useState('');
  const [innerCustomParentW, setInnerCustomParentW] = useState('');
  const [innerCustomParentH, setInnerCustomParentH] = useState('');
  const [innerPrintColors, setInnerPrintColors] = useState(4);
  const [innerPrintSides, setInnerPrintSides] = useState(2);
  const [innerPrinter, setInnerPrinter] = useState('');
  const [innerLamination, setInnerLamination] = useState('none'); 
  const [innerLaminationSides, setInnerLaminationSides] = useState(1);
  const [innerRollWidth, setInnerRollWidth] = useState('');
  const [innerRollSplit, setInnerRollSplit] = useState(1);
  const [innerRollCutLength, setInnerRollCutLength] = useState('');
  const [shippingCost, setShippingCost] = useState(0);

  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  // --- DERIVED VARIABLES ---
  const innerPagesCount = parseInt(totalPages) ? Math.max(0, parseInt(totalPages) - 4) : 0;
  const isPagesValid = parseInt(totalPages) > 0 && parseInt(totalPages) % 4 === 0;

  const availablePaperTypes = paperDatabase ? Object.keys(paperDatabase) : [];
  const coverGsms = paperDatabase && paperDatabase[coverPaperType] ? Object.keys(paperDatabase[coverPaperType]).map(Number).sort((a,b)=>a-b) : [];
  const innerGsms = paperDatabase && paperDatabase[innerPaperType] ? Object.keys(paperDatabase[innerPaperType]).map(Number).sort((a,b)=>a-b) : [];

  const { coverReqMax, coverReqMin } = useMemo(() => {
    let pw = 0, ph = 0;
    if (coverParentSizeIdx === '') { pw = 0; ph = 0; }
    else if (coverParentSizeIdx === PARENT_PAPER_SIZES.length) {
      pw = parseFloat(coverCustomParentW) || 0;
      ph = parseFloat(coverCustomParentH) || 0;
    } else if (coverParentSizeIdx === PARENT_PAPER_SIZES.length + 1) {
      pw = (parseFloat(coverRollWidth) || 0) / coverRollSplit;
      ph = parseFloat(coverRollCutLength) || 0;
    } else {
      pw = PARENT_PAPER_SIZES[coverParentSizeIdx]?.w || 0;
      ph = PARENT_PAPER_SIZES[coverParentSizeIdx]?.h || 0;
    }
    return { coverReqMax: Math.max(pw, ph), coverReqMin: Math.min(pw, ph) };
  }, [coverParentSizeIdx, coverCustomParentW, coverCustomParentH, coverRollWidth, coverRollSplit, coverRollCutLength]);

  const validCoverPrinters = useMemo(() => {
    if (!printerDatabase) return [];
    return printerDatabase.filter(p => {
      const normalizedName = p.name.replace(/,/g, '.');
      const match = normalizedName.match(/(\d+(?:\.\d+)?)\s*[xX]\s*(\d+(?:\.\d+)?)/);
      if (match) {
        const pMax = Math.max(parseFloat(match[1]), parseFloat(match[2]));
        const pMin = Math.min(parseFloat(match[1]), parseFloat(match[2]));
        return pMax >= coverReqMax && pMin >= coverReqMin;
      }
      return true;
    });
  }, [printerDatabase, coverReqMax, coverReqMin]);

  useEffect(() => {
    if (validCoverPrinters.length > 0) {
      if (!validCoverPrinters.find(p => p.id === coverPrinter)) {
        setCoverPrinter(validCoverPrinters[0].id);
      }
    } else {
      setCoverPrinter('');
    }
  }, [validCoverPrinters, coverPrinter]);

  const { innerReqMax, innerReqMin } = useMemo(() => {
    let pw = 0, ph = 0;
    if (innerParentSizeIdx === '') { pw = 0; ph = 0; }
    else if (innerParentSizeIdx === PARENT_PAPER_SIZES.length) {
      pw = parseFloat(innerCustomParentW) || 0;
      ph = parseFloat(innerCustomParentH) || 0;
    } else if (innerParentSizeIdx === PARENT_PAPER_SIZES.length + 1) {
      pw = (parseFloat(innerRollWidth) || 0) / innerRollSplit;
      ph = parseFloat(innerRollCutLength) || 0;
    } else {
      pw = PARENT_PAPER_SIZES[innerParentSizeIdx]?.w || 0;
      ph = PARENT_PAPER_SIZES[innerParentSizeIdx]?.h || 0;
    }
    return { innerReqMax: Math.max(pw, ph), innerReqMin: Math.min(pw, ph) };
  }, [innerParentSizeIdx, innerCustomParentW, innerCustomParentH, innerRollWidth, innerRollSplit, innerRollCutLength]);

  const validInnerPrinters = useMemo(() => {
    if (!printerDatabase) return [];
    return printerDatabase.filter(p => {
      const normalizedName = p.name.replace(/,/g, '.');
      const match = normalizedName.match(/(\d+(?:\.\d+)?)\s*[xX]\s*(\d+(?:\.\d+)?)/);
      if (match) {
        const pMax = Math.max(parseFloat(match[1]), parseFloat(match[2]));
        const pMin = Math.min(parseFloat(match[1]), parseFloat(match[2]));
        return pMax >= innerReqMax && pMin >= innerReqMin;
      }
      return true;
    });
  }, [printerDatabase, innerReqMax, innerReqMin]);

  useEffect(() => {
    if (validInnerPrinters.length > 0) {
      if (!validInnerPrinters.find(p => p.id === innerPrinter)) {
        setInnerPrinter(validInnerPrinters[0].id);
      }
    } else {
      setInnerPrinter('');
    }
  }, [validInnerPrinters, innerPrinter]);

  const coverAvailRolls = useMemo(() => paperDatabase && paperDatabase[coverPaperType] && paperDatabase[coverPaperType][coverPaperGsm] ? paperDatabase[coverPaperType][coverPaperGsm].rolls || [] : [], [paperDatabase, coverPaperType, coverPaperGsm]);
  useEffect(() => {
    if (coverAvailRolls.length > 0 && !coverAvailRolls.includes(String(coverRollWidth))) {
      setCoverRollWidth(coverAvailRolls[0]);
    } else if (coverAvailRolls.length === 0) {
      setCoverRollWidth('');
    }
  }, [coverAvailRolls, coverRollWidth]);

  const innerAvailRolls = useMemo(() => paperDatabase && paperDatabase[innerPaperType] && paperDatabase[innerPaperType][innerPaperGsm] ? paperDatabase[innerPaperType][innerPaperGsm].rolls || [] : [], [paperDatabase, innerPaperType, innerPaperGsm]);
  useEffect(() => {
    if (innerAvailRolls.length > 0 && !innerAvailRolls.includes(String(innerRollWidth))) {
      setInnerRollWidth(innerAvailRolls[0]);
    } else if (innerAvailRolls.length === 0) {
      setInnerRollWidth('');
    }
  }, [innerAvailRolls, innerRollWidth]);

  const handleCalculate = () => {
    if (!productTypeIdx || !quantity || !totalPages || !isPagesValid) {
      setError('Vui lòng điền đầy đủ và chính xác thông tin chung (Số trang phải chia hết cho 4).');
      setResult(null);
      return;
    }
    
    if (isCombinedPrint && validCoverPrinters.length === 0) {
      setError(`Kích thước giấy in Bìa+Ruột (${coverReqMin}x${coverReqMax}) vượt quá khổ máy in lớn nhất.`);
      setResult(null);
      return;
    }
    if (!isCombinedPrint && (validCoverPrinters.length === 0 || validInnerPrinters.length === 0)) {
      setError('Kích thước giấy in của Bìa hoặc Ruột vượt quá khổ máy in lớn nhất.');
      setResult(null);
      return;
    }

    let pW, pH;
    if (productTypeIdx === PRODUCT_SIZES.length - 1) {
      pW = parseFloat(customW);
      pH = parseFloat(customH);
    } else {
      const sizeObj = isKhoThieu && KHO_THIEU_SIZES[productTypeIdx] ? KHO_THIEU_SIZES[productTypeIdx] : PRODUCT_SIZES[productTypeIdx];
      pW = sizeObj?.w || 21;
      pH = sizeObj?.h || 29.7;
    }
    
    let prodW = orientation === 'doc' ? Math.min(pW, pH) : Math.max(pW, pH);
    let prodH = orientation === 'doc' ? Math.max(pW, pH) : Math.min(pW, pH);

    const getPaperSize = (idx, customPw, customPh, rollW, rollSplit, rollCutL) => {
      if (idx === '') return null;
      if (idx === PARENT_PAPER_SIZES.length) return { w: parseFloat(customPw)||0, h: parseFloat(customPh)||0 };
      if (idx === PARENT_PAPER_SIZES.length + 1) return { w: (parseFloat(rollW)||0) / rollSplit, h: parseFloat(rollCutL)||0 };
      return PARENT_PAPER_SIZES[idx];
    };

    let coverSize = getPaperSize(coverParentSizeIdx, coverCustomParentW, coverCustomParentH, coverRollWidth, coverRollSplit, coverRollCutLength);
    let innerSize = getPaperSize(innerParentSizeIdx, innerCustomParentW, innerCustomParentH, innerRollWidth, innerRollSplit, innerRollCutLength);

    if (isCombinedPrint && !coverSize) {
      setError('Vui lòng chọn khổ giấy in.');
      return;
    }
    if (!isCombinedPrint && (!coverSize || !innerSize)) {
      setError('Vui lòng chọn khổ giấy in cho cả Bìa và Ruột.');
      return;
    }

    const formatParent = (size) => {
      return { w: Math.max(size.w, size.h), h: Math.min(size.w, size.h) };
    };

    if (coverSize) coverSize = formatParent(coverSize);
    if (innerSize) innerSize = formatParent(innerSize);

    let signatures = [];
    const GAP = 0.4;
    const GRIPPER = 1.0;
    const qtyInt = parseInt(quantity) || 0;
    
    const spreadW = prodW * 2;
    const spreadH = prodH;
    
    const processSignatures = (totalP, pSize, prefixName, isCoverOnly, pType, pGsm) => {
       const usableW = pSize.w - 0.4; 
       const usableH = pSize.h - GRIPPER - 0.2; 

       const findGrid = (targetPages) => {
           const spreadsPerSide = targetPages / 4; 
           const configs = {
               8: [{c: 4, r: 2}, {c: 2, r: 4}, {c: 8, r: 1}, {c: 1, r: 8}], 
               4: [{c: 2, r: 2}, {c: 4, r: 1}, {c: 1, r: 4}],               
               2: [{c: 2, r: 1}, {c: 1, r: 2}],                             
               1: [{c: 1, r: 1}]                                            
           };
           
           const cfgs = configs[spreadsPerSide];
           if (!cfgs) return null;

           for (let cfg of cfgs) {
               if (cfg.c * spreadW + (cfg.c-1)*GAP <= usableW && cfg.r * spreadH + (cfg.r-1)*GAP <= usableH) {
                   return {...cfg, itemW: spreadW, itemH: spreadH, isRotated: false};
               }
               if (cfg.c * spreadH + (cfg.c-1)*GAP <= usableW && cfg.r * spreadW + (cfg.r-1)*GAP <= usableH) {
                   return {...cfg, itemW: spreadH, itemH: spreadW, isRotated: true};
               }
           }
           return null;
       };

       let maxCapacity = 0;
       [32, 16, 8, 4].forEach(cap => {
           if (maxCapacity === 0 && findGrid(cap)) maxCapacity = cap;
       });

       if (maxCapacity === 0) return false;

       let pLeft = totalP;
       let tayIdx = 1;

       while (pLeft > 0) {
           let pagesToAllocate = 0;
           let capToUse = 0;
           
           for (let cap of [32, 16, 8, 4]) {
               if (cap <= maxCapacity && pLeft >= cap) {
                   capToUse = cap;
                   pagesToAllocate = cap;
                   break;
               }
           }
           
           if (pagesToAllocate === 0) {
               if (pLeft >= 16) capToUse = 16;
               else if (pLeft >= 8) capToUse = 8;
               else capToUse = 4;
               pagesToAllocate = pLeft; 
           }

           let dupCount = 1;
           let grid = null;

           for (let dup of [8, 4, 2, 1]) {
               let testCap = capToUse * dup;
               if (testCap <= 32) {
                   let tempGrid = findGrid(testCap);
                   if (tempGrid) {
                       dupCount = dup;
                       grid = tempGrid;
                       break;
                   }
               }
           }

           if (!grid) grid = { c: 1, r: 1, itemW: spreadW, itemH: spreadH, isRotated: false };

           const sheets = Math.ceil(qtyInt / dupCount);
           let spoil = 100; 

           if (dinhMucDatabase && dinhMucDatabase.length > 0) {
               const printSpoilageRules = dinhMucDatabase.filter(d => d.category === 'In');
               for (let i = 0; i < printSpoilageRules.length; i++) {
                   const rule = printSpoilageRules[i];
                   const fromQ = parseInt(rule.fromQty) || 0;
                   const toQ = parseInt(rule.toQty) || 0;
                   const spoilVal = parseInt(rule.spoilage) || 0;
                   if (sheets >= fromQ && sheets <= toQ) {
                       spoil = spoilVal;
                       break;
                   }
               }
           }

           if (dupCount === 1) {
               spoil += 50;
           }

           signatures.push({
               id: `${prefixName}-${tayIdx}`,
               shortName: isCoverOnly ? 'Tay Bìa' : (isCombinedPrint && tayIdx === 1 ? 'Tay 1 (Bìa+Ruột)' : `Tay ${tayIdx}`),
               pages: pagesToAllocate,
               cols: grid.c,
               rows: grid.r,
               itemW: grid.itemW,
               itemH: grid.itemH,
               isRotated: grid.isRotated, 
               dupCount: dupCount, 
               parentW: pSize.w,
               parentH: pSize.h,
               gap: GAP,
               gripper: GRIPPER,
               isCover: isCoverOnly,
               paperType: pType,
               paperGsm: pGsm,
               sheetsNeeded: sheets,
               spoilage: spoil,
               totalSheets: sheets + spoil
           });

           pLeft -= pagesToAllocate;
           tayIdx++;
       }
       return true;
    };

    setError('');

    if (isCombinedPrint) {
       const success = processSignatures(parseInt(totalPages), coverSize, 'chung', false, coverPaperType, coverPaperGsm);
       if (!success) {
          setError(`Kích thước trang (${prodW}x${prodH}) quá lớn so với khổ giấy in (${coverSize.w}x${coverSize.h}).`);
          return;
       }
    } else {
       const covSuccess = processSignatures(4, coverSize, 'bia', true, coverPaperType, coverPaperGsm);
       const inSuccess = processSignatures(innerPagesCount, innerSize, 'ruot', false, innerPaperType, innerPaperGsm);
       if (!covSuccess || !inSuccess) {
          setError(`Kích thước trang quá lớn so với khổ giấy in đã chọn.`);
          return;
       }
    }

    let groupedSignatures = [];
    signatures.forEach(sig => {
        const lastSig = groupedSignatures[groupedSignatures.length - 1];
        const isSameLayout = lastSig &&
            lastSig.pages === sig.pages &&
            lastSig.cols === sig.cols &&
            lastSig.rows === sig.rows &&
            lastSig.itemW === sig.itemW &&
            lastSig.itemH === sig.itemH &&
            lastSig.isRotated === sig.isRotated &&
            lastSig.dupCount === sig.dupCount &&
            lastSig.parentW === sig.parentW &&
            lastSig.parentH === sig.parentH &&
            lastSig.paperType === sig.paperType &&
            lastSig.paperGsm === sig.paperGsm;

        if (isSameLayout) {
            lastSig.groupCount = (lastSig.groupCount || 1) + 1;
            lastSig.shortNames.push(sig.shortName);
        } else {
            groupedSignatures.push({
                ...sig,
                groupCount: 1,
                shortNames: [sig.shortName]
            });
        }
    });

    groupedSignatures.forEach(g => {
        g.name = `${g.shortNames.join(', ').toUpperCase()} - ${g.pages} trang${g.groupCount > 1 ? '/tay' : ''}`;
    });

    // ==========================================
    // TÍNH TOÁN TIỀN CATALOGUE
    // ==========================================
    let tienGiayBia = 0, tienGiayRuot = 0;
    let tongTrongLuongKg = 0, tongSoToIn = 0;

    let tienKemBia = 0, tienKemRuot = 0;
    let tienInBia = 0, tienInRuot = 0;
    let soKemBia = 0, soKemRuot = 0;
    
    let toCanBia = 0, areaBia = 0;
    let toCanRuot = 0, areaRuot = 0;

    let giaKemBia = 0, giaKemRuot = 0;
    let giaLuotBia = 0, giaLuotRuot = 0;
    let totalLuotQuaKemBia = 0, totalLuotQuaKemRuot = 0;

    signatures.forEach(sig => {
      const Pw = sig.parentW;
      const Ph = sig.parentH;
      const areaM2 = (Pw * Ph) / 10000;
      const weightPerSheetKg = (areaM2 * sig.paperGsm) / 1000;
      const totalWeightKg = weightPerSheetKg * sig.totalSheets;
      
      const pricePerTon = paperDatabase[sig.paperType] && paperDatabase[sig.paperType][sig.paperGsm] 
        ? paperDatabase[sig.paperType][sig.paperGsm].price 
        : 0; 
      const pricePerKg = pricePerTon * 1000;
      const sigCostVnd = totalWeightKg * pricePerKg;

      tongTrongLuongKg += totalWeightKg;
      tongSoToIn += sig.totalSheets;

      const isCov = sig.isCover || isCombinedPrint;
      
      const colors = isCov ? coverPrintColors : innerPrintColors;
      const sides = isCov ? coverPrintSides : innerPrintSides;
      const printerId = isCov ? coverPrinter : innerPrinter;
      const printerObj = printerDatabase.find(p => p.id === printerId);
      
      const giaKem = printerObj ? parseFloat(printerObj.platePrice) || 0 : 0;
      const giaLuotCoBan = printerObj ? parseFloat(printerObj.runPrice) || 0 : 0;
      const giaLuot = colors === 1 ? giaLuotCoBan + 10 : giaLuotCoBan;

      let soKemSig = 0;
      let soLuotInSig = 0;

      if (sides === 1) {
          soKemSig = colors * 1;
          soLuotInSig = sig.sheetsNeeded * 1;
      } else {
          const isTroKhac = sig.dupCount === 1; 
          soKemSig = colors * (isTroKhac ? 2 : 1);
          soLuotInSig = sig.sheetsNeeded * (isTroKhac ? 1 : 2);
      }

      const quaLuotSig = Math.max(0, soLuotInSig - 1000);

      const costKemSig = soKemSig * giaKem;
      const costInSig = quaLuotSig * soKemSig * giaLuot;

      if (isCov) {
        tienGiayBia += sigCostVnd;
        tienKemBia += costKemSig;
        tienInBia += costInSig;
        soKemBia += soKemSig;
        totalLuotQuaKemBia += quaLuotSig * soKemSig;
        giaKemBia = giaKem;
        giaLuotBia = giaLuot;
        
        if (coverLamination !== 'none') {
            toCanBia += Math.max(0, sig.totalSheets - 50); 
            areaBia = Pw * Ph; 
        }
      } else {
        tienGiayRuot += sigCostVnd;
        tienKemRuot += costKemSig;
        tienInRuot += costInSig;
        soKemRuot += soKemSig;
        totalLuotQuaKemRuot += quaLuotSig * soKemSig;
        giaKemRuot = giaKem;
        giaLuotRuot = giaLuot;
        
        if (innerLamination !== 'none') {
            toCanRuot += Math.max(0, sig.totalSheets - 50);
            areaRuot = Pw * Ph;
        }
      }
    });

    const tongTienGiay = tienGiayBia + tienGiayRuot;
    const tongTienKem = tienKemBia + tienKemRuot;
    const tongTienIn = tienInBia + tienInRuot;

    let kemDetail = '';
    if (soKemBia > 0 && soKemRuot > 0 && giaKemBia === giaKemRuot) {
        kemDetail = `(${soKemBia + soKemRuot} kẽm × ${giaKemBia.toLocaleString('vi-VN')}đ)`;
    } else {
        let arr = [];
        if (soKemBia > 0) arr.push(`Bìa: ${soKemBia} kẽm × ${giaKemBia.toLocaleString('vi-VN')}đ`);
        if (soKemRuot > 0) arr.push(`Ruột: ${soKemRuot} kẽm × ${giaKemRuot.toLocaleString('vi-VN')}đ`);
        kemDetail = arr.length > 0 ? `(${arr.join(' | ')})` : '';
    }

    let inDetail = '';
    if (tienInBia === 0 && tienInRuot === 0) {
        inDetail = '(Miễn phí ≤ 1.000 lượt/kẽm)';
    } else if (totalLuotQuaKemBia > 0 || totalLuotQuaKemRuot > 0) {
        if (giaLuotBia === giaLuotRuot || (totalLuotQuaKemBia > 0 && totalLuotQuaKemRuot === 0) || (totalLuotQuaKemBia === 0 && totalLuotQuaKemRuot > 0)) {
            let gl = totalLuotQuaKemBia > 0 ? giaLuotBia : giaLuotRuot;
            inDetail = `(Tổng ${(totalLuotQuaKemBia + totalLuotQuaKemRuot).toLocaleString('vi-VN')} lượt quá × ${gl.toLocaleString('vi-VN')}đ)`;
        } else {
            let arr = [];
            if (totalLuotQuaKemBia > 0) arr.push(`Bìa: ${totalLuotQuaKemBia.toLocaleString('vi-VN')} lượt quá × ${giaLuotBia.toLocaleString('vi-VN')}đ`);
            if (totalLuotQuaKemRuot > 0) arr.push(`Ruột: ${totalLuotQuaKemRuot.toLocaleString('vi-VN')} lượt quá × ${giaLuotRuot.toLocaleString('vi-VN')}đ`);
            inDetail = `(${arr.join(' | ')})`;
        }
    }

    const getFinishing = (name) => finishingDatabase.find(f => f.item.trim().toLowerCase() === name.trim().toLowerCase());
    const xaLoObj = getFinishing('xả lô');
    const minXaLoPrice = xaLoObj ? parseFloat(xaLoObj.minPrice) : 150000;

    let tienXaLoBia = 0, tienXaLoRuot = 0;
    if (coverParentSizeIdx === PARENT_PAPER_SIZES.length + 1) tienXaLoBia = minXaLoPrice;
    if (!isCombinedPrint && innerParentSizeIdx === PARENT_PAPER_SIZES.length + 1) tienXaLoRuot = minXaLoPrice;
    const tongTienXaLo = tienXaLoBia + tienXaLoRuot;

    let tienCanBia = 0, tienCanRuot = 0;
    let coverCanDetail = '', innerCanDetail = '';

    if (coverLamination !== 'none' && toCanBia > 0) {
        const canName = coverLamination === 'matte' ? 'cán mờ' : 'cán bóng';
        const canObj = getFinishing(canName);
        if (canObj) {
            const totalArea = areaBia * toCanBia * coverLaminationSides;
            const cost = totalArea * parseFloat(canObj.price);
            tienCanBia = Math.max(cost, parseFloat(canObj.minPrice));
            coverCanDetail = `(Bìa: ${toCanBia.toLocaleString('vi-VN')} tờ × ${coverLaminationSides} mặt × ${areaBia.toLocaleString('vi-VN')}cm² × ${canObj.price}đ)`;
        }
    }

    if (!isCombinedPrint && innerLamination !== 'none' && toCanRuot > 0) {
        const canName = innerLamination === 'matte' ? 'cán mờ' : 'cán bóng';
        const canObj = getFinishing(canName);
        if (canObj) {
            const totalArea = areaRuot * toCanRuot * innerLaminationSides;
            const cost = totalArea * parseFloat(canObj.price);
            tienCanRuot = Math.max(cost, parseFloat(canObj.minPrice));
            innerCanDetail = `(Ruột: ${toCanRuot.toLocaleString('vi-VN')} tờ × ${innerLaminationSides} mặt × ${areaRuot.toLocaleString('vi-VN')}cm² × ${canObj.price}đ)`;
        }
    }
    
    const tongTienCan = tienCanBia + tienCanRuot;

    // THUẬT TOÁN TIỀN XÉN THÀNH PHẨM (CATALOGUE)
    // Tính tổng số ream giấy sử dụng (chỉ tính giấy ruột hoặc tổng giấy nếu gộp)
    let xenDetail = '';
    let tienXen = 0;
    const xenObj = getFinishing('xén');
    if (xenObj) {
        const reams = tongSoToIn / 500;
        const cost = reams * parseFloat(xenObj.price);
        tienXen = Math.max(cost, parseFloat(xenObj.minPrice));
        xenDetail = `(${reams.toFixed(1)} ram × ${parseFloat(xenObj.price).toLocaleString('vi-VN')}đ)`;
    }

    // THUẬT TOÁN ĐÓNG CUỐN
    let tienDongCuon = 0;
    let dongCuonDetail = '';
    const totalP = parseInt(totalPages) || 0;
    
    let bindingNameDb = '';
    let calcType = 'page';
    let defaultPrice = 0;
    let defaultMin = 0;

    if (bindingType === 'ghim') {
        bindingNameDb = 'Ghim gáy';
        calcType = 'page';
        defaultPrice = 15;
        defaultMin = 600000;
    } else if (bindingType === 'keo') {
        bindingNameDb = 'Keo gáy';
        calcType = 'page';
        defaultPrice = 20;
        defaultMin = 1000000;
    } else if (bindingType === 'khau') {
        bindingNameDb = 'Khâu keo';
        calcType = 'page';
        defaultPrice = 20;
        defaultMin = 1500000;
    } else if (bindingType === 'loxo') {
        const isA5 = Math.max(prodW, prodH) <= 22;
        bindingNameDb = isA5 ? 'Gáy lò xo A5' : 'Gáy lò xo A4';
        calcType = 'book';
        defaultPrice = isA5 ? 3500 : 4500;
        defaultMin = 300000;
    }

    let finishingObj = getFinishing(bindingNameDb);
    if (!finishingObj && bindingType === 'loxo') {
        finishingObj = getFinishing('Gáy lò xo'); 
    }

    const actualPrice = finishingObj ? parseFloat(finishingObj.price) : defaultPrice;
    const actualMin = finishingObj ? parseFloat(finishingObj.minPrice) : defaultMin;

    if (calcType === 'page') {
        const cost = actualPrice * totalP * qtyInt;
        tienDongCuon = Math.max(cost, actualMin);
        dongCuonDetail = `(${qtyInt.toLocaleString('vi-VN')} cuốn × ${totalP} trang × ${actualPrice}đ)`;
    } else {
        const cost = actualPrice * qtyInt;
        tienDongCuon = Math.max(cost, actualMin);
        dongCuonDetail = `(${qtyInt.toLocaleString('vi-VN')} cuốn × ${actualPrice.toLocaleString('vi-VN')}đ)`;
    }

    const tienVanChuyen = parseFloat(shippingCost) || 0;

    const giaSanXuat = tongTienGiay + tongTienXaLo + tongTienKem + tongTienIn + tongTienCan + tienXen + tienDongCuon + tienVanChuyen;
    const giaBan = giaSanXuat * markup;
    const donGiaSP = giaBan / qtyInt;

    setResult({
        signatures: groupedSignatures,
        markup: markup,
        totalTayIn: signatures.length,
        costs: {
            tienGiayBia, tienGiayRuot, tongTienGiay,
            tongTrongLuongKg, tongSoToIn,
            tienXaLoBia, tienXaLoRuot, tongTienXaLo,
            tienKemBia, tienKemRuot, tongTienKem, soKemBia, soKemRuot, kemDetail,
            tienInBia, tienInRuot, tongTienIn, inDetail,
            tienCanBia, tienCanRuot, tongTienCan, coverCanDetail, innerCanDetail,
            tienXen, xenDetail,
            tienDongCuon, dongCuonDetail, bindingNameDb,
            tienVanChuyen,
            giaSanXuat, giaBan, donGiaSP
        }
    });
  };

  const renderMaterialSection = (prefix, title, subtitle, validPrintersList, reqMin, reqMax) => {
    const isCover = prefix === 'cover';
    
    const pType = isCover ? coverPaperType : innerPaperType;
    const setPType = isCover ? setCoverPaperType : setInnerPaperType;
    const pGsm = isCover ? coverPaperGsm : innerPaperGsm;
    const setPGsm = isCover ? setCoverPaperGsm : setInnerPaperGsm;
    const gsmList = isCover ? coverGsms : innerGsms;
    
    const pSizeIdx = isCover ? coverParentSizeIdx : innerParentSizeIdx;
    const setPSizeIdx = isCover ? setCoverParentSizeIdx : setInnerParentSizeIdx;
    const customPw = isCover ? coverCustomParentW : innerCustomParentW;
    const setCustomPw = isCover ? setCoverCustomParentW : setInnerCustomParentW;
    const customPh = isCover ? coverCustomParentH : innerCustomParentH;
    const setCustomPh = isCover ? (isCover ? setCustomCoverParentH : setInnerCustomParentH) : setInnerCustomParentH;
    
    const colors = isCover ? coverPrintColors : innerPrintColors;
    const setColors = isCover ? setCoverPrintColors : setInnerPrintColors;
    const sides = isCover ? coverPrintSides : innerPrintSides;
    const setSides = isCover ? setCoverPrintSides : setInnerPrintSides;
    const printer = isCover ? coverPrinter : innerPrinter;
    const setPrinter = isCover ? setCoverPrinter : setInnerPrinter;
    
    const lam = isCover ? coverLamination : innerLamination;
    const setLam = isCover ? setCoverLamination : setInnerLamination;
    const lamSides = isCover ? coverLaminationSides : innerLaminationSides;
    const setLamSides = isCover ? setCoverLaminationSides : setInnerLaminationSides;

    const rWidth = isCover ? coverRollWidth : innerRollWidth;
    const setRWidth = isCover ? setCoverRollWidth : setInnerRollWidth;
    const rSplit = isCover ? coverRollSplit : innerRollSplit;
    const setRSplit = isCover ? setCoverRollSplit : setInnerRollSplit;
    const rCutL = isCover ? coverRollCutLength : innerRollCutLength;
    const setRCutL = isCover ? setCoverRollCutLength : setInnerRollCutLength;
    const availRolls = isCover ? coverAvailRolls : innerAvailRolls;

    return (
      <div className="space-y-4">
        <h3 className="text-sm font-bold text-slate-800 bg-slate-100 p-2 rounded flex justify-between items-center">
          <span>{title}</span>
          {subtitle && <span className="text-xs font-medium text-indigo-600 bg-indigo-100 px-2 py-0.5 rounded">{subtitle}</span>}
        </h3>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-600">Loại giấy *</label>
            <select className="w-full p-2 bg-slate-50 border border-slate-300 rounded outline-none text-sm" value={pType} onChange={(e) => { setPType(e.target.value); setPGsm(''); }}>
              <option value="" disabled hidden>Chọn loại giấy...</option>
              {availablePaperTypes.map(type => <option key={type} value={type}>{type}</option>)}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-600">Định lượng *</label>
            <select className="w-full p-2 bg-slate-50 border border-slate-300 rounded outline-none text-sm" value={pGsm} onChange={(e) => setPGsm(e.target.value === '' ? '' : Number(e.target.value))} disabled={!pType}>
              <option value="" disabled hidden>Chọn định lượng...</option>
              {gsmList.map(gsm => <option key={gsm} value={gsm}>{gsm}</option>)}
            </select>
          </div>
        </div>

        <div className="space-y-2 pt-2 border-t border-slate-100">
          <label className="text-sm font-medium text-slate-700 flex justify-between">
            <span>Khổ giấy in (Nguyên khổ) *</span>
            {pSizeIdx === PARENT_PAPER_SIZES.length + 1 && reqMax > 0 && (
              <span className="text-xs text-amber-600 font-semibold bg-amber-100 px-2 py-0.5 rounded">
                Khổ xả: {reqMin} x {reqMax} cm
              </span>
            )}
          </label>
          <select className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg outline-none text-sm" value={pSizeIdx} onChange={(e) => setPSizeIdx(e.target.value === '' ? '' : parseInt(e.target.value))}>
            <option value="" disabled hidden>Chọn khổ giấy in...</option>
            {PARENT_PAPER_SIZES.map((size, idx) => (<option key={idx} value={idx}>{size.label}</option>))}
            <option value={PARENT_PAPER_SIZES.length}>Tùy chọn...</option>
            <option value={PARENT_PAPER_SIZES.length + 1}>Xả lô (Từ cuộn)...</option>
          </select>
        </div>

        {pSizeIdx === PARENT_PAPER_SIZES.length && (
          <div className="grid grid-cols-2 gap-4 bg-emerald-50 p-2.5 rounded-lg border border-emerald-100">
            <div className="space-y-1"><label className="text-xs font-medium text-slate-600">Ngang (cm)</label><input type="number" step="0.1" className="w-full p-2 border border-slate-300 rounded outline-none" value={customPw} onChange={(e) => setCustomPw(e.target.value)}/></div>
            <div className="space-y-1"><label className="text-xs font-medium text-slate-600">Cao (cm)</label><input type="number" step="0.1" className="w-full p-2 border border-slate-300 rounded outline-none" value={customPh} onChange={(e) => setCustomPh(e.target.value)}/></div>
          </div>
        )}

        {pSizeIdx === PARENT_PAPER_SIZES.length + 1 && (
          <div className="grid grid-cols-3 gap-3 bg-amber-50 p-2.5 rounded-lg border border-amber-200 shadow-inner mt-1">
            <div className="space-y-1">
              <label className="text-xs font-bold text-amber-800">Khổ lô (cm)</label>
              {availRolls.length > 0 ? (
                <select className="w-full p-2 bg-white border border-amber-300 rounded outline-none text-sm font-semibold text-amber-900" value={rWidth} onChange={(e) => setRWidth(e.target.value)}>
                  {availRolls.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              ) : (
                <input type="text" className="w-full p-2 border border-amber-200 rounded outline-none text-sm text-slate-400 bg-amber-100" value="Không có lô" disabled />
              )}
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-amber-800">Chia lô</label>
              <select className="w-full p-2 bg-white border border-amber-300 rounded outline-none text-sm" value={rSplit} onChange={(e) => setRSplit(Number(e.target.value))}>
                {[1, 2, 3].map(v => <option key={v} value={v}>Chia {v}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-amber-800">Chiều dài xả</label>
              <input type="number" step="0.1" className="w-full p-2 border border-amber-300 rounded outline-none text-sm" placeholder="VD: 30" value={rCutL} onChange={(e) => setRCutL(e.target.value)}/>
            </div>
          </div>
        )}

        <div className="grid grid-cols-3 gap-3 pt-2 border-t border-slate-100">
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-600">Số màu in</label>
            <select className="w-full p-2 bg-slate-50 border border-slate-300 rounded outline-none text-sm" value={colors} onChange={(e) => setColors(Number(e.target.value))}>
              {[1, 2, 3, 4].map(c => <option key={c} value={c}>{c} màu</option>)}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-600">Số mặt in</label>
            <select className="w-full p-2 bg-slate-50 border border-slate-300 rounded outline-none text-sm" value={sides} onChange={(e) => setSides(Number(e.target.value))}>
              <option value={1}>1 mặt</option>
              <option value={2}>2 mặt</option>
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-600">Chọn máy in</label>
            <select 
              className={`w-full p-2 bg-slate-50 border rounded outline-none text-sm font-medium ${validPrintersList.length === 0 ? 'border-red-300 text-red-600' : 'border-slate-300 text-blue-700'}`} 
              value={printer} 
              onChange={(e) => setPrinter(e.target.value)}
              disabled={validPrintersList.length === 0}
            >
              {validPrintersList.length > 0 ? (
                validPrintersList.map(p => <option key={p.id} value={p.id}>{p.name}</option>)
              ) : (
                <option value="">Không có máy phù hợp</option>
              )}
            </select>
            {validPrintersList.length === 0 && (
              <p className="text-[11px] text-red-500 mt-1 font-medium leading-tight">Khổ giấy in quá lớn!</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-100">
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-600">Cán màng</label>
            <select className="w-full p-2 bg-slate-50 border border-slate-300 rounded outline-none text-sm" value={lam} onChange={(e) => setLam(e.target.value)}>
              {LAMINATION_TYPES.map(l => <option key={l.id} value={l.id}>{l.label}</option>)}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-600">Số mặt cán</label>
            <select className="w-full p-2 bg-slate-50 border border-slate-300 rounded outline-none text-sm" value={lamSides} onChange={(e) => setLamSides(Number(e.target.value))} disabled={lam === 'none'}>
              <option value={1}>1 mặt</option>
              <option value={2}>2 mặt</option>
            </select>
          </div>
          {isCover && (
            <div className="col-span-2 space-y-1">
              <label className="text-xs font-medium text-slate-600">Gia công bìa khác (Ép nhũ, thúc nổi...)</label>
              <select className="w-full p-2 bg-slate-50 border border-slate-300 rounded outline-none text-sm" value={coverFoil} onChange={(e) => setCoverFoil(e.target.value)}>
                <option value="none">Không có</option>
                <option value="nhu">Ép nhũ logo</option>
                <option value="thuc">Thúc nổi</option>
              </select>
            </div>
          )}
        </div>
        
        {!isCover && innerPagesCount > 0 && (
          <div className="mt-4 p-3 bg-indigo-50 border border-indigo-100 rounded-lg flex items-start space-x-2 text-indigo-700 text-sm">
            <Layers size={18} className="mt-0.5 shrink-0" />
            <div>
              <p className="font-semibold">Sơ đồ bình bản ruột (Dự kiến):</p>
              <p className="text-xs opacity-90 mt-1">Hệ thống sẽ tự động tính toán và chia <strong>{innerPagesCount} trang</strong> này thành các tay sách tuỳ thuộc vào khổ giấy và máy in bạn chọn ở trên.</p>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 xl:h-full min-h-0">
      <div className="xl:col-span-5 bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-6 xl:overflow-y-auto custom-scrollbar xl:h-full">
        <h2 className="text-lg font-semibold flex items-center space-x-2 border-b pb-3 shrink-0">
          <BookOpen size={20} className="text-blue-500"/>
          <span>Thông Số Catalogue</span>
        </h2>

        <div className="space-y-4">
          <h3 className="text-sm font-bold text-slate-800 bg-slate-100 p-2 rounded flex justify-between items-center">
            <span>1. Thông tin chung</span>
            <button onClick={fetchPaperPrices} disabled={isLoadingPrices} className="text-xs flex items-center space-x-1 text-blue-600 hover:text-blue-800 disabled:opacity-50 font-normal">
              <RefreshCw size={12} className={isLoadingPrices ? "animate-spin" : ""} /><span>Cập nhật giá</span>
            </button>
          </h3>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Tên sản phẩm</label>
            <input type="text" className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="VD: Catalogue nội thất 2024..." value={productName} onChange={(e) => setProductName(e.target.value)} />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Số lượng cuốn *</label>
              <input type="number" className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-semibold text-blue-700" placeholder="VD: 500" value={quantity} onChange={(e) => setQuantity(e.target.value)} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Quy cách đóng cuốn</label>
              <select className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg outline-none font-medium text-slate-700" value={bindingType} onChange={(e) => setBindingType(e.target.value)}>
                {BINDING_TYPES.map(b => <option key={b.id} value={b.id}>{b.label}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Khổ thành phẩm (Khi gập) *</label>
              <select className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg outline-none" value={productTypeIdx} onChange={(e) => setProductTypeIdx(e.target.value === '' ? '' : parseInt(e.target.value))}>
                <option value="" disabled hidden>Chọn khổ...</option>
                {PRODUCT_SIZES.map((size, idx) => {
                  let label = size.label; if (isKhoThieu && KHO_THIEU_SIZES[idx]) label = KHO_THIEU_SIZES[idx].label;
                  return <option key={idx} value={idx}>{label}</option>
                })}
              </select>
              <div className="flex items-center space-x-4 pt-1">
                <label className="flex items-center space-x-1.5 cursor-pointer group">
                  <input type="radio" value="doc" checked={orientation === 'doc'} onChange={() => setOrientation('doc')} className="w-4 h-4 text-blue-600 focus:ring-blue-500 cursor-pointer" />
                  <span className="text-sm font-medium text-slate-700 group-hover:text-blue-600 transition-colors">Khổ dọc</span>
                </label>
                <label className="flex items-center space-x-1.5 cursor-pointer group">
                  <input type="radio" value="ngang" checked={orientation === 'ngang'} onChange={() => setOrientation('ngang')} className="w-4 h-4 text-blue-600 focus:ring-blue-500 cursor-pointer" />
                  <span className="text-sm font-medium text-slate-700 group-hover:text-blue-600 transition-colors">Khổ ngang</span>
                </label>
              </div>
              {productTypeIdx !== '' && productTypeIdx !== PRODUCT_SIZES.length - 1 && (
                <div className="pt-1">
                  <label className="flex items-center space-x-2 cursor-pointer group w-fit">
                    <input type="checkbox" className="w-4 h-4 rounded text-blue-600 cursor-pointer" checked={isKhoThieu} onChange={(e) => setIsKhoThieu(e.target.checked)} />
                    <span className="text-sm font-medium text-slate-700 group-hover:text-blue-600 transition-colors">Chọn khổ thiếu</span>
                  </label>
                </div>
              )}
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Tổng số trang (Bìa + Ruột) *</label>
              <input type="number" className={`w-full p-2.5 bg-slate-50 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-semibold ${totalPages && !isPagesValid ? 'border-red-400 text-red-600' : 'border-slate-300 text-slate-800'}`} placeholder="Bội số của 4 (VD: 16, 24...)" value={totalPages} onChange={(e) => setTotalPages(e.target.value)} />
              {totalPages && !isPagesValid && <p className="text-xs text-red-500 mt-1">Số trang phải chia hết cho 4.</p>}
            </div>
          </div>

          {productTypeIdx === PRODUCT_SIZES.length - 1 && (
            <div className="grid grid-cols-2 gap-4 bg-blue-50 p-3 rounded-lg border border-blue-100">
              <div className="space-y-1"><label className="text-xs font-medium text-slate-600">Ngang (cm)</label><input type="number" step="0.1" className="w-full p-2 border border-slate-300 rounded outline-none" value={customW} onChange={(e) => setCustomW(e.target.value)}/></div>
              <div className="space-y-1"><label className="text-xs font-medium text-slate-600">Cao (cm)</label><input type="number" step="0.1" className="w-full p-2 border border-slate-300 rounded outline-none" value={customH} onChange={(e) => setCustomH(e.target.value)}/></div>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <h3 className="text-sm font-bold text-slate-800 bg-slate-100 p-2 rounded">2. Phương pháp Bình bản</h3>
          <div className={`p-4 rounded-xl border ${isCombinedPrint ? 'bg-blue-50 border-blue-200' : 'bg-slate-50 border-slate-200'}`}>
            <label className="flex items-start space-x-3 cursor-pointer">
              <div className="mt-1">
                <input type="checkbox" className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer" checked={isCombinedPrint} onChange={(e) => setIsCombinedPrint(e.target.checked)} />
              </div>
              <div>
                <span className="text-sm font-bold text-slate-800 block">Bình chung Bìa và Ruột trên cùng một kẽm</span>
                <span className="text-xs text-slate-500 mt-0.5 block leading-relaxed">Đánh dấu nếu Bìa và Ruột dùng chung 1 loại giấy, cùng định lượng và phương pháp in để tiết kiệm chi phí xuất kẽm.</span>
              </div>
            </label>
          </div>
        </div>

        {isCombinedPrint ? (
           renderMaterialSection('cover', '3. Cấu hình In ấn (Bìa + Ruột)', `Tổng: ${totalPages || 0} trang`, validCoverPrinters, coverReqMin, coverReqMax)
        ) : (
           <div className="space-y-6">
              {renderMaterialSection('cover', '3. Cấu hình In ấn BÌA', 'Mặc định: 4 trang', validCoverPrinters, coverReqMin, coverReqMax)}
              {renderMaterialSection('inner', '4. Cấu hình In ấn RUỘT', `Tổng: ${innerPagesCount} trang`, validInnerPrinters, innerReqMin, innerReqMax)}
           </div>
        )}

        <div className="space-y-4">
          <h3 className="text-sm font-bold text-slate-800 bg-slate-100 p-2 rounded">5. Tổng hợp tài chính</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-slate-700">Vận chuyển (VNĐ)</label>
              <input type="number" className="w-1/2 p-2 bg-slate-50 border border-slate-300 rounded outline-none text-sm text-right font-medium" value={shippingCost} onChange={(e) => setShippingCost(Number(e.target.value))} />
            </div>
            <div className="flex items-center justify-between">
              <label className="text-sm font-bold text-slate-800">Hệ số lợi nhuận</label>
              <select className="w-1/2 p-2 bg-emerald-50 border border-emerald-300 text-emerald-800 rounded outline-none font-bold text-right" value={markup} onChange={(e) => setMarkup(Number(e.target.value))}>
                {MARKUP_RATES.map(m => <option key={m} value={m}>x {m}</option>)}
              </select>
            </div>
          </div>
        </div>

        <button 
          onClick={handleCalculate} 
          className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-colors flex justify-center items-center space-x-2 shadow-sm mt-4 shrink-0"
        >
          <Maximize size={18} /><span>Tính toán & Phân trang Catalogue</span>
        </button>
      </div>

      {/* KHU VỰC PHẢI */}
      <div className="xl:col-span-7 flex flex-col space-y-6 xl:overflow-y-auto custom-scrollbar xl:h-full xl:pr-2 xl:pb-6">
        {error ? (
          <div className="bg-red-50 border border-red-200 text-red-700 p-6 rounded-2xl flex items-center space-x-3 shrink-0"><AlertCircle size={24} /><span className="font-medium">{error}</span></div>
        ) : result ? (
          <>
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col shrink-0">
              <h2 className="text-lg font-semibold mb-4 text-slate-800 border-b pb-2 flex justify-between items-center">
                <span>Sơ đồ tay sách & Lệnh in</span>
              </h2>
              
              <div className="w-full flex flex-col min-h-[400px]">
                {result.signatures.map((sig, idx) => (
                    <CatalogueSignatureCanvas key={idx} sig={sig} />
                ))}
              </div>
              
              <div className="mt-4 flex flex-wrap gap-4 text-xs text-slate-600 justify-center">
                <div className="flex items-center space-x-1"><div className="w-3 h-3 bg-white border border-slate-400"></div><span>Giấy in</span></div>
                <div className="flex items-center space-x-1"><div className="w-3 h-3 bg-indigo-100 border border-indigo-400"></div><span>Bát in (2 trang)</span></div>
                <div className="flex items-center space-x-1"><div className="w-3 h-0 border-t-2 border-dashed border-indigo-400"></div><span>Gáy sách</span></div>
                <div className="flex items-center space-x-1"><div className="w-3 h-3 bg-indigo-400 opacity-60"></div><span>Đầu trang</span></div>
                <div className="flex items-center space-x-1"><div className="w-3 h-3 flex items-center justify-center font-bold text-indigo-400 text-[10px]">A1</div><span>Mặt in & Chiều in</span></div>
                <div className="flex items-center space-x-1"><div className="w-3 h-3 bg-slate-800"></div><span>Nhíp (10mm)</span></div>
                <div className="flex items-center space-x-1"><div className="w-3 h-0 border-t-2 border-dashed border-green-500"></div><span>Đường xén/gấp tờ</span></div>
              </div>
            </div>

            <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 shrink-0">
              <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 flex flex-col justify-center items-center text-center">
                <span className="text-slate-500 text-sm font-medium mb-1 flex items-center justify-center space-x-1"><Layers size={14}/> <span>Số tay in</span></span>
                <span className="text-3xl font-bold text-indigo-600">{result.totalTayIn}</span>
                <span className="text-xs text-slate-400 mt-1">Gồm Bìa & Ruột</span>
              </div>
              <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 flex flex-col justify-center items-center text-center">
                <span className="text-slate-500 text-sm font-medium mb-1">Tổng giấy in</span>
                <span className="text-3xl font-bold text-slate-700">{result.costs.tongSoToIn.toLocaleString('vi-VN')}</span>
                <span className="text-xs text-slate-400 mt-1">Tờ (Gồm bù hao)</span>
              </div>
              <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 flex flex-col justify-center items-center text-center">
                <span className="text-slate-500 text-sm font-medium mb-1">Trọng lượng</span>
                <span className="text-3xl font-bold text-slate-700">{result.costs.tongTrongLuongKg.toFixed(1)}</span>
                <span className="text-xs text-slate-400 mt-1">Kg giấy</span>
              </div>
              <div className="bg-emerald-50 p-4 rounded-2xl shadow-sm border border-emerald-200 flex flex-col justify-center items-center text-center">
                <span className="text-emerald-700 text-sm font-medium mb-1">Tổng tiền giấy</span>
                <span className="text-2xl font-bold text-emerald-700">{Math.round(result.costs.tongTienGiay).toLocaleString('vi-VN')} đ</span>
                <span className="text-[11px] text-emerald-600 mt-1">Bìa + Ruột</span>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden mt-2 shrink-0">
              <div className="bg-slate-50 px-6 py-3 border-b border-slate-200">
                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Chi tiết báo giá Catalogue (Dự kiến)</h3>
              </div>
              <div className="p-6">
                <div className="space-y-1">
                  
                  {/* Sử dụng cấu trúc items-start để wrap text */}
                  <div className="flex justify-between items-start text-sm py-1.5">
                    <div className="pr-4 text-slate-600">
                      <span>1. Tiền giấy nguyên liệu (Bìa + Ruột):</span>
                    </div>
                    <span className="font-medium text-slate-800 whitespace-nowrap">{Math.round(result.costs.tongTienGiay).toLocaleString('vi-VN')} đ</span>
                  </div>
                  
                  {result.costs.tienGiayBia > 0 && result.costs.tienGiayRuot > 0 && !isCombinedPrint && (
                     <div className="flex justify-between items-start text-[11px] text-slate-500 pl-4 border-l-2 border-slate-200 ml-1 py-1">
                       <span>- Giấy bìa: {Math.round(result.costs.tienGiayBia).toLocaleString('vi-VN')} đ</span>
                       <span className="whitespace-nowrap">- Giấy ruột: {Math.round(result.costs.tienGiayRuot).toLocaleString('vi-VN')} đ</span>
                     </div>
                  )}

                  {result.costs.tongTienXaLo > 0 && (
                    <div className="flex justify-between items-start text-sm py-1.5">
                      <div className="pr-4 text-slate-600">
                        <span>X. Tiền xả lô:</span>
                      </div>
                      <span className="font-medium text-slate-800 whitespace-nowrap">{Math.round(result.costs.tongTienXaLo).toLocaleString('vi-VN')} đ</span>
                    </div>
                  )}

                  <div className="flex justify-between items-start text-sm py-1.5">
                    <div className="pr-4 text-slate-600">
                      <span>2. Tiền xuất kẽm</span>
                      {result.costs.kemDetail && <span className="text-[11px] text-slate-400 ml-1 leading-relaxed inline-block">{result.costs.kemDetail}</span>}
                    </div>
                    <span className="font-medium text-slate-800 whitespace-nowrap">{Math.round(result.costs.tongTienKem).toLocaleString('vi-VN')} đ</span>
                  </div>

                  <div className="flex justify-between items-start text-sm py-1.5">
                    <div className="pr-4 text-slate-600">
                      <span>3. Tiền công in</span>
                      {result.costs.inDetail && <span className="text-[11px] text-slate-400 ml-1 leading-relaxed inline-block">{result.costs.inDetail}</span>}
                    </div>
                    <span className="font-medium text-slate-800 whitespace-nowrap">{Math.round(result.costs.tongTienIn).toLocaleString('vi-VN')} đ</span>
                  </div>

                  <div className="flex justify-between items-start text-sm py-1.5">
                    <div className="pr-4 text-slate-600">
                      <span>4. Tiền cán màng</span>
                      {result.costs.tongTienCan > 0 && (
                        <span className="text-[11px] text-slate-400 ml-1 leading-relaxed inline-block">
                          {result.costs.coverCanDetail} {result.costs.innerCanDetail}
                        </span>
                      )}
                    </div>
                    <span className="font-medium text-slate-800 whitespace-nowrap">{Math.round(result.costs.tongTienCan).toLocaleString('vi-VN')} đ</span>
                  </div>
                  
                  <div className="flex justify-between items-start text-sm py-1.5 opacity-50">
                    <div className="pr-4 text-slate-600">
                      <span>5. Gia công bìa khác (Nhũ, Thúc nổi...):</span>
                    </div>
                    <span className="font-medium whitespace-nowrap">Chờ thuật toán...</span>
                  </div>
                  
                  <div className="flex justify-between items-start text-sm py-1.5">
                    <div className="pr-4 text-slate-600">
                      <span>6. Tiền xén thành phẩm</span>
                      {result.costs.xenDetail && <span className="text-[11px] text-slate-400 ml-1 leading-relaxed inline-block">{result.costs.xenDetail}</span>}
                    </div>
                    <span className="font-medium text-slate-800 whitespace-nowrap">{Math.round(result.costs.tienXen).toLocaleString('vi-VN')} đ</span>
                  </div>

                  <div className="flex justify-between items-start text-sm py-1.5">
                    <div className="pr-4 text-slate-600">
                      <span>7. Công đóng cuốn ({result.costs.bindingNameDb})</span>
                      {result.costs.dongCuonDetail && <span className="text-[11px] text-slate-400 ml-1 leading-relaxed inline-block">{result.costs.dongCuonDetail}</span>}
                    </div>
                    <span className="font-medium text-slate-800 whitespace-nowrap">{Math.round(result.costs.tienDongCuon).toLocaleString('vi-VN')} đ</span>
                  </div>

                  <div className="flex justify-between items-start text-sm py-1.5 border-b border-slate-100 pb-3">
                    <div className="pr-4 text-slate-600">
                      <span>8. Tiền vận chuyển:</span>
                    </div>
                    <span className="font-medium text-slate-800 whitespace-nowrap">{Math.round(result.costs.tienVanChuyen).toLocaleString('vi-VN')} đ</span>
                  </div>
                  
                  <div className="flex justify-between items-center pt-3">
                    <span className="font-bold text-slate-700">TỔNG GIÁ SẢN XUẤT:</span>
                    <span className="font-bold text-lg text-slate-800">{Math.round(result.costs.giaSanXuat).toLocaleString('vi-VN')} đ</span>
                  </div>

                  <div className="flex justify-between items-center bg-blue-50 p-4 rounded-xl mt-4 border border-blue-100">
                    <div>
                      <span className="font-bold text-blue-900 block text-lg">GIÁ BÁN TỔNG</span>
                      <span className="text-xs text-blue-600 font-medium">Đã nhân hệ số x{result.costs.markup}</span>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-2xl text-blue-700 block">{Math.round(result.costs.giaBan).toLocaleString('vi-VN')} đ</span>
                      <span className="text-sm font-semibold text-blue-600">~ {Math.round(result.costs.donGiaSP).toLocaleString('vi-VN')} đ/cuốn</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="bg-white border border-slate-200 p-10 rounded-2xl flex flex-col items-center justify-center text-slate-400 h-full min-h-[400px] shrink-0">
            <BookOpen size={48} className="mb-4 opacity-50 text-indigo-400"/>
            <p className="font-medium text-slate-600 text-lg">Hệ thống tính giá Catalogue</p>
            <p className="text-sm mt-1">Nhập đầy đủ thông số bên trái và bấm tính toán để bắt đầu phân trang.</p>
          </div>
        )}
      </div>
    </div>
  );
}

function VoCalculator() {
  return <div className="bg-white border border-slate-200 p-10 rounded-2xl flex flex-col items-center justify-center text-slate-400 h-full min-h-[400px]">
    <Book size={48} className="mb-4 text-blue-300"/><p className="text-lg font-medium text-slate-600">Module Vở (Đóng ghim)</p><p className="text-sm">Đang phát triển quy tắc nhân bản ruột vở, bìa mềm...</p>
  </div>;
}

function HopMemCalculator() {
  return <div className="bg-white border border-slate-200 p-10 rounded-2xl flex flex-col items-center justify-center text-slate-400 h-full min-h-[400px]">
    <Box size={48} className="mb-4 text-orange-300"/><p className="text-lg font-medium text-slate-600">Module Hộp Mềm</p><p className="text-sm">Đang phát triển bộ công thức tự động nội suy kích thước trải, khuôn bế, công bế/dán...</p>
  </div>;
}

function TuiGiayCalculator() {
  return <div className="bg-white border border-slate-200 p-10 rounded-2xl flex flex-col items-center justify-center text-slate-400 h-full min-h-[400px]">
    <ShoppingBag size={48} className="mb-4 text-rose-300"/><p className="text-lg font-medium text-slate-600">Module Túi Giấy</p><p className="text-sm">Đang phát triển công thức trải túi giấy (hông, đáy, tai xỏ dây)...</p>
  </div>;
}

function PhongBiCalculator() {
  return <div className="bg-white border border-slate-200 p-10 rounded-2xl flex flex-col items-center justify-center text-slate-400 h-full min-h-[400px]">
    <Mail size={48} className="mb-4 text-sky-300"/><p className="text-lg font-medium text-slate-600">Module Phong Bì</p><p className="text-sm">Đang phát triển form tiêu chuẩn phong bì A6, A5, A4, tính công bế, dán keo chờ...</p>
  </div>;
}

function DecalCalculator() {
  return <div className="bg-white border border-slate-200 p-10 rounded-2xl flex flex-col items-center justify-center text-slate-400 h-full min-h-[400px]">
    <StickyNote size={48} className="mb-4 text-emerald-300"/><p className="text-lg font-medium text-slate-600">Module Decal</p><p className="text-sm">Đang phát triển quy tắc bình bản bế đờ-mi, bế lô xé...</p>
  </div>;
}

export default function App() {
  const [activeTab, setActiveTab] = useState('catalogue'); 
  
  const [paperDatabase, setPaperDatabase] = useState(null);
  const [printerDatabase, setPrinterDatabase] = useState([]);
  const [finishingDatabase, setFinishingDatabase] = useState([]);
  const [dinhMucDatabase, setDinhMucDatabase] = useState([]);
  const [isLoadingPrices, setIsLoadingPrices] = useState(true);
  const [priceLoadError, setPriceLoadError] = useState('');

  const TABS = [
    { id: 'toroi', label: 'Tờ rời', icon: FileText },
    { id: 'catalogue', label: 'Catalogue', icon: BookOpen },
    { id: 'vo', label: 'Vở', icon: Book },
    { id: 'hopmem', label: 'Hộp mềm', icon: Box },
    { id: 'tuigiay', label: 'Túi giấy', icon: ShoppingBag },
    { id: 'phongbi', label: 'Phong bì', icon: Mail },
    { id: 'decal', label: 'Decal', icon: StickyNote },
  ];

  const fetchPaperPrices = async () => {
    setIsLoadingPrices(true);
    setPriceLoadError('');
    try {
      let rawPapers;
      let rawPrinters;
      let rawFinishing;
      let rawDinhMuc;

      try {
        const response = await fetch(GOOGLE_SHEETS_API_URL, { redirect: 'follow' });
        const text = await response.text();
        if (text.trim().startsWith('<')) {
          throw new Error('Không lấy được dữ liệu. Đang dùng giá dự phòng.');
        }
        
        const json = JSON.parse(text);
        
        if (json.papers && json.printers) {
           rawPapers = json.papers;
           rawPrinters = json.printers;
           rawFinishing = json.finishing || DEFAULT_FINISHING_DATA;
           rawDinhMuc = json.dinhMuc || DEFAULT_DINHMUC_DATA;
        } else {
           rawPapers = json.record ? json.record : json; 
           rawPrinters = [];
           rawFinishing = DEFAULT_FINISHING_DATA;
           rawDinhMuc = DEFAULT_DINHMUC_DATA;
        }

      } catch (fetchError) {
        rawPapers = DEFAULT_PAPER_DATA;
        rawPrinters = DEFAULT_PRINTER_DATA;
        rawFinishing = DEFAULT_FINISHING_DATA;
        rawDinhMuc = DEFAULT_DINHMUC_DATA;
        setPriceLoadError(fetchError.message || 'Mất kết nối. Đang dùng bảng giá dự phòng.');
      }
      
      const formattedData = {};
      rawPapers.forEach(row => {
        if (row && row.paperType && String(row.paperType).trim() !== '') {
          if (!formattedData[row.paperType]) formattedData[row.paperType] = {};
          
          let rollArray = [];
          if (row.rolls) {
            rollArray = String(row.rolls).split(';').map(s => s.trim()).filter(Boolean);
          }

          formattedData[row.paperType][row.gsm] = {
            price: parseFloat(row.price) || 0,
            rolls: rollArray
          };
        }
      });

      if (Object.keys(formattedData).length === 0) throw new Error('Dữ liệu trống.');
      setPaperDatabase(formattedData);

      if (rawPrinters && rawPrinters.length > 0) {
        setPrinterDatabase(rawPrinters);
      } else {
        setPrinterDatabase(DEFAULT_PRINTER_DATA);
      }

      if (rawFinishing && rawFinishing.length > 0) {
        setFinishingDatabase(rawFinishing);
      } else {
        setFinishingDatabase(DEFAULT_FINISHING_DATA);
      }

      if (rawDinhMuc && rawDinhMuc.length > 0) {
        setDinhMucDatabase(rawDinhMuc);
      } else {
        setDinhMucDatabase(DEFAULT_DINHMUC_DATA);
      }

    } catch (err) {
      setPriceLoadError('Lỗi tải dữ liệu. Đang dùng bảng giá dự phòng.');
    } finally {
      setIsLoadingPrices(false);
    }
  };

  useEffect(() => {
    fetchPaperPrices();
  }, []);

  const renderContent = () => {
    switch (activeTab) {
      case 'toroi': return <ToRoiCalculator paperDatabase={paperDatabase} printerDatabase={printerDatabase} finishingDatabase={finishingDatabase} dinhMucDatabase={dinhMucDatabase} isLoadingPrices={isLoadingPrices} priceLoadError={priceLoadError} fetchPaperPrices={fetchPaperPrices} />;
      case 'catalogue': return <CatalogueCalculator paperDatabase={paperDatabase} printerDatabase={printerDatabase} finishingDatabase={finishingDatabase} dinhMucDatabase={dinhMucDatabase} isLoadingPrices={isLoadingPrices} fetchPaperPrices={fetchPaperPrices} />;
      case 'vo': return <VoCalculator />;
      case 'hopmem': return <HopMemCalculator />;
      case 'tuigiay': return <TuiGiayCalculator />;
      case 'phongbi': return <PhongBiCalculator />;
      case 'decal': return <DecalCalculator />;
      default: return <ToRoiCalculator paperDatabase={paperDatabase} printerDatabase={printerDatabase} finishingDatabase={finishingDatabase} dinhMucDatabase={dinhMucDatabase} isLoadingPrices={isLoadingPrices} priceLoadError={priceLoadError} fetchPaperPrices={fetchPaperPrices} />;
    }
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
            <h1 className="text-xl font-bold tracking-tight text-slate-900">MIS Print</h1>
          </div>
          <p className="text-xs text-slate-500 mt-2 font-medium">Đức Thành Printing</p>
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

      {/* GỠ BỎ max-w-[1800px] ĐỂ BUNG TRÀN 100% MÀN HÌNH TẤT CẢ CÁC ĐỘ PHÂN GIẢI */}
      <div className="flex-1 flex flex-col xl:h-screen xl:overflow-hidden overflow-y-auto">
        <div className="p-4 md:p-8 w-full flex flex-col flex-1 min-h-0">
          <div className="mb-6 md:mb-8 hidden md:block shrink-0">
            <h2 className="text-2xl font-bold text-slate-900">
              Báo giá: {TABS.find(t => t.id === activeTab)?.label}
            </h2>
            <p className="text-slate-500 mt-1">Cấu hình thông số và tính toán chi phí sản xuất.</p>
          </div>
          
          <div className="flex-1 min-h-0">
            {renderContent()}
          </div>
        </div>

        <footer className="w-full py-4 border-t border-slate-200 bg-white text-center text-sm text-slate-500 shrink-0 hidden xl:block">
          <p className="font-medium text-slate-600">&copy; {new Date().getFullYear()} Bản quyền thuộc về Công ty TNHH Sản xuất & Dịch vụ Đức Thành.</p>
        </footer>
      </div>

    </div>
  );
}