import React, { useState, useEffect, useMemo } from 'react';
import { Settings, RefreshCw, AlertCircle, Maximize, Layout, FileText, Printer, BookOpen, Layers, Book, Box, ShoppingBag, Mail, StickyNote, Sparkles } from 'lucide-react';

const GOOGLE_SHEETS_API_URL = '';
const PRODUCT_SIZES = [
  { label: 'A4 (21x29.7)', w: 21, h: 29.7 },
  { label: 'A5 (14.8x21)', w: 14.8, h: 21 },
  { label: 'Tùy chỉnh...', w: 0, h: 0 }
];
const KHO_THIEU_SIZES = [
  { label: 'A4 thiếu (20x29)', w: 20, h: 29 },
  { label: 'A5 thiếu (14.5x20)', w: 14.5, h: 20 },
  null
];
const PARENT_PAPER_SIZES = [
  { label: '65 x 86 cm', w: 65, h: 86 },
  { label: '60 x 84 cm', w: 60, h: 84 },
  { label: '79 x 109 cm', w: 79, h: 109 }
];
const LAMINATION_TYPES = [
  { id: 'none', label: 'Không cán' },
  { id: 'matte', label: 'Cán mờ' },
  { id: 'gloss', label: 'Cán bóng' }
];
const MARKUP_RATES = [1.0, 1.1, 1.15, 1.2, 1.25, 1.3, 1.4, 1.5];
const BINDING_TYPES = [
  { id: 'ghim', label: 'Ghim gáy' },
  { id: 'keo', label: 'Keo gáy' },
  { id: 'khau', label: 'Khâu keo' },
  { id: 'loxo', label: 'Gáy lò xo' }
];
const DEFAULT_PAPER_DATA = {};
const DEFAULT_PRINTER_DATA = [];
const DEFAULT_FINISHING_DATA = [];
const DEFAULT_DINHMUC_DATA = [];

// ==========================================
// COMPONENT VẼ BẢN IN (CANVAS TỜ RỜI)
// ==========================================
function ImpositionCanvas({ result }) {
  if (!result) return null;
  const { parentW, parentH, blocks, gripper, topMargin } = result;
  const MARGIN = 0.2;
  const padding = Math.max(parentW, parentH) * 0.05;
  const strokeW = Math.max(parentW, parentH) * 0.002;
  const fontSize = Math.max(parentW, parentH) * 0.025;
  const hasTopGripper = gripper > 0;
  const items = [];
  
  blocks.forEach(block => {
    for (let c = 0; c < block.cols; c++) {
      for (let r = 0; r < block.rows; r++) {
         items.push({
           id: `${block.x}-${block.y}-${c}-${r}`,
           x: block.x + c * (block.w + result.gap) + MARGIN,
           y: block.y + r * (block.h + result.gap) + topMargin,
           w: block.w,
           h: block.h,
           sideLabel: 'Mặt In',
           isFirstInBlock: c === 0 && r === 0
         });
      }
    }
  });

  return (
    <svg viewBox={`-${padding} -${padding} ${parentW + padding*2} ${parentH + padding*2}`} className="w-full h-auto drop-shadow-md bg-white">
      <rect x={0} y={0} width={parentW} height={parentH} fill="#ffffff" stroke="#94a3b8" strokeWidth={strokeW * 2} />
      {hasTopGripper && (
        <g>
          <rect x={0} y={0} width={parentW} height={gripper} fill="#1e293b" opacity="0.8"/>
          <text x={parentW / 2} y={gripper/2} fill="white" fontSize={fontSize * 0.8} textAnchor="middle" dominantBaseline="middle" transform={`rotate(180, ${parentW/2}, ${gripper/2})`}>NHÍP ({gripper * 10}mm)</text>
        </g>
      )}

      <rect x={MARGIN} y={topMargin} width={parentW - (MARGIN*2)} height={parentH - topMargin - (gripper > 0 ? gripper : MARGIN)} fill="none" stroke="#fca5a5" strokeWidth={strokeW} strokeDasharray={`${strokeW*4},${strokeW*4}`} />
      
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
      <div className="xl:col-span-3 bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-6 xl:overflow-y-auto custom-scrollbar xl:h-full">
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
      <div className="xl:col-span-9 flex flex-col space-y-6 xl:overflow-y-auto custom-scrollbar xl:h-full xl:pr-2 xl:pb-6"> 
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
      setError('Vui lòng điền đầy đủ và chính xác thông vị chung (Số trang phải chia hết cho 4).');
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
      <div className="xl:col-span-3 bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-6 xl:overflow-y-auto custom-scrollbar xl:h-full">
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
      <div className="xl:col-span-9 flex flex-col space-y-6 xl:overflow-y-auto custom-scrollbar xl:h-full xl:pr-2 xl:pb-6">
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

// ==========================================
// COMPONENT VẼ HỘP 3D (ISOMETRIC SVG)
// ==========================================
function Box3DViewer({ width, depth, height }) {
  // Thay dấu phẩy thành dấu chấm để parse số thập phân (VD: 7,5 -> 7.5)
  const safeParse = (val) => parseFloat(String(val).replace(',', '.')) || 0;
  const w = safeParse(width);
  const d = safeParse(depth);
  const h = safeParse(height);

  if (w <= 0 || d <= 0 || h <= 0) {
    return (
      <div className="w-full h-[220px] bg-white border border-orange-200 border-dashed rounded-xl flex flex-col items-center justify-center text-slate-400 text-xs mt-4">
        <Box size={24} className="mb-2 opacity-50 text-orange-400" />
        Nhập kích thước (Ngang, Hông, Cao) để xem mô hình 3D
      </div>
    );
  }

  // Góc chiếu Isometric 30 độ
  const cos30 = 0.866;
  const sin30 = 0.5;

  const project = (x, y, z) => ({
    cx: (x - y) * cos30,
    cy: (x + y) * sin30 - z
  });

  // Tự động scale để hình luôn nằm cân đối trong khung
  const maxDim = Math.max(w, d, h);
  const scale = 120 / maxDim; 
  const sw = w * scale;
  const sd = d * scale;
  const sh = h * scale;

  // Tính toán 8 đỉnh của khối hộp (Góc nhìn từ mặt trước)
  const pO = project(0, 0, 0);       
  const pX = project(sw, 0, 0);      
  const pY = project(0, sd, 0);      
  const pXY = project(sw, sd, 0);    
  
  const pZ = project(0, 0, sh);      
  const pXZ = project(sw, 0, sh);    
  const pYZ = project(0, sd, sh);    
  const pXYZ = project(sw, sd, sh);  

  // Bounding Box để set ViewBox tự động căn giữa
  const minX = Math.min(pO.cx, pX.cx, pY.cx, pXY.cx, pZ.cx, pXZ.cx, pYZ.cx, pXYZ.cx);
  const maxX = Math.max(pO.cx, pX.cx, pY.cx, pXY.cx, pZ.cx, pXZ.cx, pYZ.cx, pXYZ.cx);
  const minY = Math.min(pO.cy, pX.cy, pY.cy, pXY.cy, pZ.cy, pXZ.cy, pYZ.cy, pXYZ.cy);
  const maxY = Math.max(pO.cy, pX.cy, pY.cy, pXY.cy, pZ.cy, pXZ.cy, pYZ.cy, pXYZ.cy);

  // Lề (padding) cho text và đường dóng
  const vbX = minX - 40;
  const vbY = minY - 20;
  const vbW = maxX - minX + 110; 
  const vbH = maxY - minY + 70;  

  // Màu sắc chuẩn theo mẫu
  const theme = {
    stroke: "#d97743",    // Cam đất (Viền)
    topFace: "#f9ecd8",   // Sáng nhất (Mặt trên)
    leftFace: "#f2d1b3",  // Sáng vừa (Mặt ngang)
    rightFace: "#e8ba95", // Tối nhất (Mặt hông)
    dimLine: "#d97743",   // Màu nét dóng
    text: "#d97743"       // Màu chữ
  };

  return (
    <div className="w-full h-[220px] bg-[#faf8f5] border border-[#ebd7c9] rounded-xl flex items-center justify-center overflow-hidden mt-4 relative shadow-sm">
      <div className="absolute top-3 left-4 text-[10px] font-bold text-[#d97743] uppercase tracking-widest opacity-70">PREVIEW 3D</div>
      
      <svg viewBox={`${vbX} ${vbY} ${vbW} ${vbH}`} className="w-full h-full drop-shadow-sm">
        
        {/* MẶT TRÁI (Ngang / Width) */}
        <polygon points={`${pY.cx},${pY.cy} ${pXY.cx},${pXY.cy} ${pXYZ.cx},${pXYZ.cy} ${pYZ.cx},${pYZ.cy}`} fill={theme.leftFace} stroke={theme.stroke} strokeWidth="1" strokeLinejoin="round" />
        
        {/* MẶT PHẢI (Hông / Depth) */}
        <polygon points={`${pX.cx},${pX.cy} ${pXY.cx},${pXY.cy} ${pXYZ.cx},${pXYZ.cy} ${pXZ.cx},${pXZ.cy}`} fill={theme.rightFace} stroke={theme.stroke} strokeWidth="1" strokeLinejoin="round" />
        
        {/* MẶT TRÊN (Top) */}
        <polygon points={`${pZ.cx},${pZ.cy} ${pXZ.cx},${pXZ.cy} ${pXYZ.cx},${pXYZ.cy} ${pYZ.cx},${pYZ.cy}`} fill={theme.topFace} stroke={theme.stroke} strokeWidth="1" strokeLinejoin="round" />

        {/* KÍCH THƯỚC: NGANG (X) */}
        <g opacity="0.85">
          {/* Đường dóng nét đứt thả xuống */}
          <line x1={pY.cx} y1={pY.cy} x2={pY.cx} y2={pY.cy + 25} stroke={theme.dimLine} strokeWidth="0.8" strokeDasharray="2,2"/>
          <line x1={pXY.cx} y1={pXY.cy} x2={pXY.cx} y2={pXY.cy + 25} stroke={theme.dimLine} strokeWidth="0.8" strokeDasharray="2,2"/>
          {/* Đoạn thẳng song song với cạnh đáy */}
          <line x1={pY.cx} y1={pY.cy + 20} x2={pXY.cx} y2={pXY.cy + 20} stroke={theme.dimLine} strokeWidth="1" />
          {/* Tick marks (Chặn 2 đầu) */}
          <line x1={pY.cx} y1={pY.cy + 17} x2={pY.cx} y2={pY.cy + 23} stroke={theme.dimLine} strokeWidth="1.2" />
          <line x1={pXY.cx} y1={pXY.cy + 17} x2={pXY.cx} y2={pXY.cy + 23} stroke={theme.dimLine} strokeWidth="1.2" />
          {/* Text */}
          <text x={(pY.cx + pXY.cx)/2} y={(pY.cy + pXY.cy)/2 + 30} fill={theme.text} fontSize="9" fontWeight="800" textAnchor="middle">Ngang: {width}</text>
        </g>

        {/* KÍCH THƯỚC: HÔNG (Y) */}
        <g opacity="0.85">
          {/* Đường dóng nét đứt thả xuống */}
          <line x1={pX.cx} y1={pX.cy} x2={pX.cx} y2={pX.cy + 25} stroke={theme.dimLine} strokeWidth="0.8" strokeDasharray="2,2"/>
          <line x1={pXY.cx} y1={pXY.cy} x2={pXY.cx} y2={pXY.cy + 25} stroke={theme.dimLine} strokeWidth="0.8" strokeDasharray="2,2"/>
          {/* Đoạn thẳng song song với cạnh đáy */}
          <line x1={pX.cx} y1={pX.cy + 20} x2={pXY.cx} y2={pXY.cy + 20} stroke={theme.dimLine} strokeWidth="1" />
          {/* Tick marks (Chặn 2 đầu) */}
          <line x1={pX.cx} y1={pX.cy + 17} x2={pX.cx} y2={pX.cy + 23} stroke={theme.dimLine} strokeWidth="1.2" />
          <line x1={pXY.cx} y1={pXY.cy + 17} x2={pXY.cx} y2={pXY.cy + 23} stroke={theme.dimLine} strokeWidth="1.2" />
          {/* Text */}
          <text x={(pX.cx + pXY.cx)/2} y={(pX.cy + pXY.cy)/2 + 30} fill={theme.text} fontSize="9" fontWeight="800" textAnchor="middle">Hông: {depth}</text>
        </g>

        {/* KÍCH THƯỚC: CAO (Z) */}
        <g opacity="0.85">
          {/* Đường dóng nét đứt kéo ngang sang phải */}
          <line x1={pX.cx} y1={pX.cy} x2={pX.cx + 25} y2={pX.cy} stroke={theme.dimLine} strokeWidth="0.8" strokeDasharray="2,2"/>
          <line x1={pXZ.cx} y1={pXZ.cy} x2={pXZ.cx + 25} y2={pXZ.cy} stroke={theme.dimLine} strokeWidth="0.8" strokeDasharray="2,2"/>
          {/* Đoạn thẳng dọc song song cạnh bên */}
          <line x1={pX.cx + 20} y1={pX.cy} x2={pXZ.cx + 20} y2={pXZ.cy} stroke={theme.dimLine} strokeWidth="1" />
          {/* Tick marks (Chặn 2 đầu) */}
          <line x1={pX.cx + 17} y1={pX.cy} x2={pX.cx + 23} y2={pX.cy} stroke={theme.dimLine} strokeWidth="1.2" />
          <line x1={pXZ.cx + 17} y1={pXZ.cy} x2={pXZ.cx + 23} y2={pXZ.cy} stroke={theme.dimLine} strokeWidth="1.2" />
          {/* Text */}
          <text x={pX.cx + 28} y={(pX.cy + pXZ.cy)/2 + 3} fill={theme.text} fontSize="9" fontWeight="800" textAnchor="start">Cao: {height}</text>
        </g>
      </svg>
    </div>
  );
}

// ==========================================
// TÍNH TOÁN HÌNH HỌC HỘP MỀM
// ==========================================
function getHopMemGeometry(boxType, X, Y, Z, hopMemDatabase, isDaoTaiDan = false) {
  const getBoxConfig = (w, db) => {
    const fallback = { taiDan: 1.5, taiGai: 1.5, khoaDayGai: 0, khoaDayCheo: 0 };
    if (!db || !Array.isArray(db) || db.length === 0) return fallback;
    
    for (let i = 0; i < db.length; i++) {
      const row = db[i];
      const fromX = parseFloat(row.fromX) || 0;
      const toX = parseFloat(row.toX) || 999999;
      
      if (w >= fromX && w <= toX) {
        return {
          taiDan: parseFloat(row.taiDan) || fallback.taiDan,
          taiGai: parseFloat(row.napHop) || fallback.taiGai, 
          khoaDayGai: parseFloat(row.khoaDayGai) || fallback.khoaDayGai,
          khoaDayCheo: parseFloat(row.khoaDayCheo) || fallback.khoaDayCheo
        };
      }
    }
    return fallback;
  };

  const boxConfig = getBoxConfig(X, hopMemDatabase);
  const taiGai = boxConfig.taiGai;
  const taiDan = boxConfig.taiDan;
  
  const thuGoc = 0.2;
  const taiPhuH = Math.min((Y + taiGai) / 2, X / 2);
  const c = thuGoc; // Độ vát góc (chamfer) cho các tai gài, tai dán

  let outlinePath = "";
  let creaseLines = [];
  let panels = [];
  let vPoints = [];
  let minX = -taiDan;
  let maxX = 2*X + 2*Y;
  let minY = 0, maxY = 0;
  let overlapX = 0; // Thêm biến lưu khoảng cách lồng ghép ngang
  let overlapY = 0; // Thêm biến lưu khoảng cách lồng ghép dọc

  // LỰA CHỌN CẤU TRÚC HỘP
  if (boxType === 'cai_2_dau') {
    minY = -Y - taiGai;
    maxY = Z + Y + taiGai;
    overlapY = Y + taiGai; // Lồng nắp trên vào khoảng trống mặt trước của đáy trên

    outlinePath = `
      M 0 0
      L 0 ${-Y}
      L ${c} ${-Y - taiGai}
      L ${X - c} ${-Y - taiGai}
      L ${X} ${-Y}
      L ${X} 0
      L ${X + c} ${-taiPhuH}
      L ${X + Y - c} ${-taiPhuH}
      L ${X + Y} 0
      L ${2*X + Y} 0
      L ${2*X + Y + c} ${-taiPhuH}
      L ${2*X + 2*Y - c} ${-taiPhuH}
      L ${2*X + 2*Y} 0
      L ${2*X + 2*Y} ${Z}
      L ${2*X + 2*Y - c} ${Z + taiPhuH}
      L ${2*X + Y + c} ${Z + taiPhuH}
      L ${2*X + Y} ${Z}
      L ${2*X + Y} ${Z + Y}
      L ${2*X + Y - c} ${Z + Y + taiGai}
      L ${X + Y + c} ${Z + Y + taiGai}
      L ${X + Y} ${Z + Y}
      L ${X + Y} ${Z}
      L ${X + Y - c} ${Z + taiPhuH}
      L ${X + c} ${Z + taiPhuH}
      L ${X} ${Z}
      L 0 ${Z}
      L ${-taiDan} ${Z - c}
      L ${-taiDan} ${c}
      Z
    `;

    creaseLines = [
      { x1: 0, y1: 0, x2: 0, y2: Z }, 
      { x1: X, y1: 0, x2: X, y2: Z }, 
      { x1: X + Y, y1: 0, x2: X + Y, y2: Z }, 
      { x1: 2*X + Y, y1: 0, x2: 2*X + Y, y2: Z }, 
      { x1: 0, y1: 0, x2: X, y2: 0 }, 
      { x1: 0, y1: -Y, x2: X, y2: -Y }, 
      { x1: X + Y, y1: Z, x2: 2*X + Y, y2: Z }, 
      { x1: X + Y, y1: Z + Y, x2: 2*X + Y, y2: Z + Y }, 
      { x1: X, y1: 0, x2: X + Y, y2: 0 }, 
      { x1: X, y1: Z, x2: X + Y, y2: Z }, 
      { x1: 2*X + Y, y1: 0, x2: 2*X + 2*Y, y2: 0 }, 
      { x1: 2*X + Y, y1: Z, x2: 2*X + 2*Y, y2: Z }  
    ];

    panels = [
      { cx: X/2, cy: Z/2, w: X, h: Z, label: 'Mặt trước' },
      { cx: X/2, cy: -Y/2, w: X, h: Y, label: 'Nắp' },
      { cx: X/2, cy: -Y - taiGai/2, w: X, h: taiGai, label: 'Tai gài' },
      { cx: -taiDan/2, cy: Z/2, w: taiDan, h: Z, label: 'Dán' },
      { cx: X + Y/2, cy: Z/2, w: Y, h: Z, label: 'Mặt hông' },
      { cx: X + Y/2, cy: -taiPhuH/2, w: Y, h: taiPhuH, label: 'Tai phụ' },
      { cx: X + Y/2, cy: Z + taiPhuH/2, w: Y, h: taiPhuH, label: 'Tai phụ' },
      { cx: X + Y + X/2, cy: Z/2, w: X, h: Z, label: 'Mặt sau' },
      { cx: X + Y + X/2, cy: Z + Y/2, w: X, h: Y, label: 'Đáy' },
      { cx: X + Y + X/2, cy: Z + Y + taiGai/2, w: X, h: taiGai, label: 'Tai gài' },
      { cx: 2*X + Y + Y/2, cy: Z/2, w: Y, h: Z, label: 'Mặt hông' },
      { cx: 2*X + Y + Y/2, cy: -taiPhuH/2, w: Y, h: taiPhuH, label: 'Tai phụ' },
      { cx: 2*X + Y + Y/2, cy: Z + taiPhuH/2, w: Y, h: taiPhuH, label: 'Tai phụ' }
    ];

    vPoints = [
      { y: minY, val: taiGai },
      { y: -Y, val: Y },
      { y: 0, val: Z },
      { y: Z, val: Y },
      { y: Z + Y, val: taiGai },
      { y: maxY, val: 0 }
    ];

  } else if (boxType === 'dan_2_dau') {
    minY = -Y;
    maxY = Z + Y;
    overlapY = 0; // Hộp dán 2 đầu xếp mép chạm mép theo chiều dọc
    overlapX = 0; 

    outlinePath = `
      M 0 0
      L 0 ${-Y}
      L ${X} ${-Y}
      L ${X} 0
      L ${X + c} ${-taiPhuH}
      L ${X + Y - c} ${-taiPhuH}
      L ${X + Y} 0
      L ${X + Y} ${-Y}
      L ${2*X + Y} ${-Y}
      L ${2*X + Y} 0
      L ${2*X + Y + c} ${-taiPhuH}
      L ${2*X + 2*Y - c} ${-taiPhuH}
      L ${2*X + 2*Y} 0
      L ${2*X + 2*Y} ${Z}
      L ${2*X + 2*Y - c} ${Z + taiPhuH}
      L ${2*X + Y + c} ${Z + taiPhuH}
      L ${2*X + Y} ${Z}
      L ${2*X + Y} ${Z + Y}
      L ${X + Y} ${Z + Y}
      L ${X + Y} ${Z}
      L ${X + Y - c} ${Z + taiPhuH}
      L ${X + c} ${Z + taiPhuH}
      L ${X} ${Z}
      L ${X} ${Z + Y}
      L 0 ${Z + Y}
      L 0 ${Z}
      L ${-taiDan} ${Z - c}
      L ${-taiDan} ${c}
      Z
    `;

    creaseLines = [
      { x1: 0, y1: 0, x2: 0, y2: Z }, 
      { x1: X, y1: 0, x2: X, y2: Z }, 
      { x1: X + Y, y1: 0, x2: X + Y, y2: Z }, 
      { x1: 2*X + Y, y1: 0, x2: 2*X + Y, y2: Z }, 
      { x1: 0, y1: 0, x2: X, y2: 0 }, 
      { x1: 0, y1: Z, x2: X, y2: Z }, 
      { x1: X, y1: 0, x2: X + Y, y2: 0 }, 
      { x1: X, y1: Z, x2: X + Y, y2: Z }, 
      { x1: X + Y, y1: 0, x2: 2*X + Y, y2: 0 }, 
      { x1: X + Y, y1: Z, x2: 2*X + Y, y2: Z }, 
      { x1: 2*X + Y, y1: 0, x2: 2*X + 2*Y, y2: 0 }, 
      { x1: 2*X + Y, y1: Z, x2: 2*X + 2*Y, y2: Z }  
    ];

    panels = [
      { cx: X/2, cy: Z/2, w: X, h: Z, label: 'Mặt trước' },
      { cx: X/2, cy: -Y/2, w: X, h: Y, label: 'Nắp dán' },
      { cx: X/2, cy: Z + Y/2, w: X, h: Y, label: 'Đáy dán' },
      { cx: -taiDan/2, cy: Z/2, w: taiDan, h: Z, label: 'Dán' },
      { cx: X + Y/2, cy: Z/2, w: Y, h: Z, label: 'Mặt hông' },
      { cx: X + Y/2, cy: -taiPhuH/2, w: Y, h: taiPhuH, label: 'Tai phụ' },
      { cx: X + Y/2, cy: Z + taiPhuH/2, w: Y, h: taiPhuH, label: 'Tai phụ' },
      { cx: X + Y + X/2, cy: Z/2, w: X, h: Z, label: 'Mặt sau' },
      { cx: X + Y + X/2, cy: -Y/2, w: X, h: Y, label: 'Nắp dán' },
      { cx: X + Y + X/2, cy: Z + Y/2, w: X, h: Y, label: 'Đáy dán' },
      { cx: 2*X + Y + Y/2, cy: Z/2, w: Y, h: Z, label: 'Mặt hông' },
      { cx: 2*X + Y + Y/2, cy: -taiPhuH/2, w: Y, h: taiPhuH, label: 'Tai phụ' },
      { cx: 2*X + Y + Y/2, cy: Z + taiPhuH/2, w: Y, h: taiPhuH, label: 'Tai phụ' }
    ];

    vPoints = [
      { y: minY, val: Y },
      { y: 0, val: Z },
      { y: Z, val: Y },
      { y: maxY, val: 0 }
    ];
  } else if (boxType === 'nap_cai_day_khoa') {
    const dayKhoaH = Y / 2 + taiGai;
    minY = -Y - taiGai;
    maxY = Z + dayKhoaH;
    overlapY = 0; // Đáy khóa chiếm toàn bộ biên dưới, xếp mép chạm mép tương tự hộp dán 2 đầu
    overlapX = 0;

    if (isDaoTaiDan) {
      // BẢN VẼ BIẾN THỂ: ĐẢO TAI DÁN & DỊCH CHUYỂN HÔNG
      // Trật tự mới: [Hông 2] - [Mặt Trước] - [Hông 1] - [Mặt Sau] - [Tai Dán]
      minX = 0;
      maxX = 2*X + 2*Y + taiDan;
      
      outlinePath = `
        M 0 0
        L ${c} ${-taiPhuH}
        L ${Y - c} ${-taiPhuH}
        L ${Y} 0
        L ${Y} ${-Y}
        L ${Y + c} ${-Y - taiGai}
        L ${Y + X - c} ${-Y - taiGai}
        L ${Y + X} ${-Y}
        L ${Y + X} 0
        L ${Y + X + c} ${-taiPhuH}
        L ${2*Y + X - c} ${-taiPhuH}
        L ${2*Y + X} 0
        L ${2*Y + 2*X} 0
        L ${2*Y + 2*X + taiDan} ${c}
        L ${2*Y + 2*X + taiDan} ${Z - c}
        L ${2*Y + 2*X} ${Z}
        L ${2*Y + 2*X} ${Z + dayKhoaH}
        L ${2*Y + X} ${Z + dayKhoaH}
        L ${2*Y + X} ${Z}
        L ${2*Y + X - c} ${Z + dayKhoaH}
        L ${Y + X + c} ${Z + dayKhoaH}
        L ${Y + X} ${Z}
        L ${Y + X} ${Z + dayKhoaH}
        L ${Y} ${Z + dayKhoaH}
        L ${Y} ${Z}
        L ${Y - c} ${Z + dayKhoaH}
        L ${c} ${Z + dayKhoaH}
        L 0 ${Z}
        Z
      `;

      creaseLines = [
        { x1: Y, y1: 0, x2: Y, y2: Z }, 
        { x1: Y + X, y1: 0, x2: Y + X, y2: Z }, 
        { x1: 2*Y + X, y1: 0, x2: 2*Y + X, y2: Z }, 
        { x1: 2*Y + 2*X, y1: 0, x2: 2*Y + 2*X, y2: Z }, 
        { x1: 0, y1: 0, x2: Y, y2: 0 }, 
        { x1: Y, y1: 0, x2: Y + X, y2: 0 }, 
        { x1: Y + X, y1: 0, x2: 2*Y + X, y2: 0 }, 
        { x1: 2*Y + X, y1: 0, x2: 2*Y + 2*X, y2: 0 }, 
        { x1: Y, y1: -Y, x2: Y + X, y2: -Y }, 
        { x1: 0, y1: Z, x2: Y, y2: Z }, 
        { x1: Y, y1: Z, x2: Y + X, y2: Z }, 
        { x1: Y + X, y1: Z, x2: 2*Y + X, y2: Z }, 
        { x1: 2*Y + X, y1: Z, x2: 2*Y + 2*X, y2: Z }  
      ];
      
      panels = [];
      vPoints = [];

    } else {
      // BẢN VẼ TIÊU CHUẨN
      outlinePath = `
        M 0 0
        L 0 ${-Y}
        L ${c} ${-Y - taiGai}
        L ${X - c} ${-Y - taiGai}
        L ${X} ${-Y}
        L ${X} 0
        L ${X + c} ${-taiPhuH}
        L ${X + Y - c} ${-taiPhuH}
        L ${X + Y} 0
        L ${2*X + Y} 0
        L ${2*X + Y + c} ${-taiPhuH}
        L ${2*X + 2*Y - c} ${-taiPhuH}
        L ${2*X + 2*Y} 0
        L ${2*X + 2*Y} ${Z}
        L ${2*X + 2*Y - c} ${Z + dayKhoaH}
        L ${2*X + Y + c} ${Z + dayKhoaH}
        L ${2*X + Y} ${Z}
        L ${2*X + Y} ${Z + dayKhoaH}
        L ${X + Y} ${Z + dayKhoaH}
        L ${X + Y} ${Z}
        L ${X + Y - c} ${Z + dayKhoaH}
        L ${X + c} ${Z + dayKhoaH}
        L ${X} ${Z}
        L ${X} ${Z + dayKhoaH}
        L 0 ${Z + dayKhoaH}
        L 0 ${Z}
        L ${-taiDan} ${Z - c}
        L ${-taiDan} ${c}
        Z
      `;

      creaseLines = [
        { x1: 0, y1: 0, x2: 0, y2: Z }, 
        { x1: X, y1: 0, x2: X, y2: Z }, 
        { x1: X + Y, y1: 0, x2: X + Y, y2: Z }, 
        { x1: 2*X + Y, y1: 0, x2: 2*X + Y, y2: Z }, 
        { x1: 0, y1: 0, x2: X, y2: 0 }, 
        { x1: 0, y1: -Y, x2: X, y2: -Y }, 
        { x1: X, y1: 0, x2: X + Y, y2: 0 }, 
        { x1: 2*X + Y, y1: 0, x2: 2*X + 2*Y, y2: 0 }, 
        { x1: 0, y1: Z, x2: X, y2: Z }, 
        { x1: X, y1: Z, x2: X + Y, y2: Z }, 
        { x1: X + Y, y1: Z, x2: 2*X + Y, y2: Z }, 
        { x1: 2*X + Y, y1: Z, x2: 2*X + 2*Y, y2: Z }  
      ];

      panels = [
        { cx: X/2, cy: Z/2, w: X, h: Z, label: 'Mặt trước' },
        { cx: X/2, cy: -Y/2, w: X, h: Y, label: 'Nắp' },
        { cx: X/2, cy: -Y - taiGai/2, w: X, h: taiGai, label: 'Tai gài' },
        { cx: X/2, cy: Z + dayKhoaH/2, w: X, h: dayKhoaH, label: 'Đáy khoá' },
        { cx: -taiDan/2, cy: Z/2, w: taiDan, h: Z, label: 'Dán' },
        { cx: X + Y/2, cy: Z/2, w: Y, h: Z, label: 'Mặt hông' },
        { cx: X + Y/2, cy: -taiPhuH/2, w: Y, h: taiPhuH, label: 'Tai phụ' },
        { cx: X + Y/2, cy: Z + dayKhoaH/2, w: Y, h: dayKhoaH, label: 'Tai đáy' },
        { cx: X + Y + X/2, cy: Z/2, w: X, h: Z, label: 'Mặt sau' },
        { cx: X + Y + X/2, cy: Z + dayKhoaH/2, w: X, h: dayKhoaH, label: 'Đáy khoá' },
        { cx: 2*X + Y + Y/2, cy: Z/2, w: Y, h: Z, label: 'Mặt hông' },
        { cx: 2*X + Y + Y/2, cy: -taiPhuH/2, w: Y, h: taiPhuH, label: 'Tai phụ' },
        { cx: 2*X + Y + Y/2, cy: Z + dayKhoaH/2, w: Y, h: dayKhoaH, label: 'Tai đáy' }
      ];

      vPoints = [
        { y: minY, val: taiGai },
        { y: -Y, val: Y },
        { y: 0, val: Z },
        { y: Z, val: dayKhoaH },
        { y: maxY, val: 0 }
      ];
    }
  } else if (boxType === 'nap_cai_day_moc') {
    const dayKhoaH = Y / 2 + taiGai;
    const taiDayH = dayKhoaH * 0.75; // 75% height của đáy theo yêu cầu
    minY = -Y - taiGai;
    maxY = Z + dayKhoaH;
    overlapY = 0; // Đáy móc chiếm toàn bộ biên dưới, xếp mép chạm mép tương tự hộp dán 2 đầu
    overlapX = 0;

    outlinePath = `
      M 0 0
      L 0 ${-Y}
      L ${c} ${-Y - taiGai}
      L ${X - c} ${-Y - taiGai}
      L ${X} ${-Y}
      L ${X} 0
      L ${X + c} ${-taiPhuH}
      L ${X + Y - c} ${-taiPhuH}
      L ${X + Y} 0
      L ${2*X + Y} 0
      L ${2*X + Y + c} ${-taiPhuH}
      L ${2*X + 2*Y - c} ${-taiPhuH}
      L ${2*X + 2*Y} 0
      L ${2*X + 2*Y} ${Z}
      L ${2*X + 2*Y - c} ${Z + taiDayH}
      L ${2*X + Y + c} ${Z + taiDayH}
      L ${2*X + Y} ${Z}
      L ${2*X + Y} ${Z + dayKhoaH}
      L ${X + Y} ${Z + dayKhoaH}
      L ${X + Y} ${Z}
      L ${X + Y - c} ${Z + taiDayH}
      L ${X + c} ${Z + taiDayH}
      L ${X} ${Z}
      L ${X} ${Z + dayKhoaH}
      L 0 ${Z + dayKhoaH}
      L 0 ${Z}
      L ${-taiDan} ${Z - c}
      L ${-taiDan} ${c}
      Z
    `;

    creaseLines = [
      { x1: 0, y1: 0, x2: 0, y2: Z }, 
      { x1: X, y1: 0, x2: X, y2: Z }, 
      { x1: X + Y, y1: 0, x2: X + Y, y2: Z }, 
      { x1: 2*X + Y, y1: 0, x2: 2*X + Y, y2: Z }, 
      { x1: 0, y1: 0, x2: X, y2: 0 }, 
      { x1: 0, y1: -Y, x2: X, y2: -Y }, 
      { x1: X, y1: 0, x2: X + Y, y2: 0 }, 
      { x1: 2*X + Y, y1: 0, x2: 2*X + 2*Y, y2: 0 }, 
      { x1: 0, y1: Z, x2: X, y2: Z }, 
      { x1: X, y1: Z, x2: X + Y, y2: Z }, 
      { x1: X + Y, y1: Z, x2: 2*X + Y, y2: Z }, 
      { x1: 2*X + Y, y1: Z, x2: 2*X + 2*Y, y2: Z }  
    ];

    panels = [
      { cx: X/2, cy: Z/2, w: X, h: Z, label: 'Mặt trước' },
      { cx: X/2, cy: -Y/2, w: X, h: Y, label: 'Nắp' },
      { cx: X/2, cy: -Y - taiGai/2, w: X, h: taiGai, label: 'Tai gài' },
      { cx: X/2, cy: Z + dayKhoaH/2, w: X, h: dayKhoaH, label: 'Đáy móc' },
      { cx: -taiDan/2, cy: Z/2, w: taiDan, h: Z, label: 'Dán' },
      { cx: X + Y/2, cy: Z/2, w: Y, h: Z, label: 'Mặt hông' },
      { cx: X + Y/2, cy: -taiPhuH/2, w: Y, h: taiPhuH, label: 'Tai phụ' },
      { cx: X + Y/2, cy: Z + taiDayH/2, w: Y, h: taiDayH, label: 'Tai đáy' },
      { cx: X + Y + X/2, cy: Z/2, w: X, h: Z, label: 'Mặt sau' },
      { cx: X + Y + X/2, cy: Z + dayKhoaH/2, w: X, h: dayKhoaH, label: 'Đáy móc' },
      { cx: 2*X + Y + Y/2, cy: Z/2, w: Y, h: Z, label: 'Mặt hông' },
      { cx: 2*X + Y + Y/2, cy: -taiPhuH/2, w: Y, h: taiPhuH, label: 'Tai phụ' },
      { cx: 2*X + Y + Y/2, cy: Z + taiDayH/2, w: Y, h: taiDayH, label: 'Tai đáy' }
    ];

    vPoints = [
      { y: minY, val: taiGai },
      { y: -Y, val: Y },
      { y: 0, val: Z },
      { y: Z, val: dayKhoaH },
      { y: maxY, val: 0 }
    ];
  } else {
    return null;
  }

  const hPoints = [
    { x: minX, val: taiDan },
    { x: 0, val: X },
    { x: X, val: Y },
    { x: X + Y, val: X },
    { x: 2*X + Y, val: Y },
    { x: maxX, val: 0 }
  ];

  return { outlinePath, creaseLines, panels, vPoints, hPoints, minX, maxX, minY, maxY, overlapX, overlapY };
}

// ==========================================
// COMPONENT VẼ TRẢI PHẲNG (FLAT LAYOUT SVG)
// ==========================================
function FlatLayoutViewer({ boxType, width, depth, height, hopMemDatabase }) {
  const safeParse = (val) => parseFloat(String(val).replace(',', '.')) || 0;
  const X = safeParse(width);
  const Y = safeParse(depth);
  const Z = safeParse(height);

  if (X <= 0 || Y <= 0 || Z <= 0) {
    return null; // Không vẽ nếu chưa nhập đủ kích thước
  }

  const geom = getHopMemGeometry(boxType, X, Y, Z, hopMemDatabase);

  if (!geom) {
    return (
      <div className="w-full h-auto p-10 bg-orange-50 border border-orange-200 border-dashed rounded-xl flex flex-col items-center justify-center text-orange-600 mt-2 text-center min-h-[300px]">
        <Box size={40} className="mb-3 opacity-50 text-orange-400" />
        <span className="text-lg font-semibold mb-1">Chưa có dữ liệu vẽ trải phẳng</span>
        <span className="text-sm">Vui lòng chọn <strong>"Hộp cài 2 đầu"</strong>, <strong>"Hộp dán 2 đầu"</strong>, <strong>"Hộp nắp cài đáy khoá"</strong> hoặc <strong>"Hộp nắp cài đáy móc"</strong> để xem cấu trúc</span>
      </div>
    );
  }

  const { outlinePath, creaseLines, panels, vPoints, hPoints, minX, maxX, minY, maxY } = geom;
  const fmt = (num) => Number(Math.abs(num).toFixed(2));

  const pad = Math.max(X, Y, Z) * 0.15; 
  const dimOffset = pad * 1.5; 
  const tick = pad * 0.4;      

  const vbX = minX - dimOffset * 2.5; 
  const vbY = minY - pad;
  const vbW = (maxX - vbX) + pad;
  const vbH = (maxY + dimOffset * 2.5) - vbY + pad;

  const theme = {
    stroke: "#333333",    
    fill: "#ffffff",      
    text: "#666666",      
    dim: "#ef4444",       
    dimLine: "#fca5a5",   
    dimText: "#000000"    
  };

  const strokeW = vbW * 0.002;
  const dimFontSize = Math.max(vbW * 0.015, 0.5); 

  const vBaseX = minX - dimOffset;
  const vTotalX = vBaseX - dimOffset;
  const hBaseY = maxY + dimOffset;
  const hTotalY = hBaseY + dimOffset;

  return (
    <div className="w-full bg-[#f8f9fa] border border-dashed border-[#cbd5e1] rounded-xl overflow-hidden relative shadow-inner p-4 flex justify-center items-center mt-2">
      <svg viewBox={`${vbX} ${vbY} ${vbW} ${vbH}`} className="w-full h-auto max-h-[600px] drop-shadow-sm">
        
        {/* VẼ ĐƯỜNG GIÓNG VÀ KÍCH THƯỚC DỌC (TRÁI) */}
        <g stroke={theme.dim} fill={theme.dim} strokeWidth={strokeW * 0.8} textAnchor="end" dominantBaseline="middle">
          {vPoints.map((pt, i) => (
            <line key={`vExt${i}`} x1={pt.y >= 0 && pt.y <= Z ? 0 : minX} y1={pt.y} x2={vTotalX - tick} y2={pt.y} stroke={theme.dimLine} strokeWidth={strokeW * 0.5} strokeDasharray="4,4" />
          ))}
          
          <line x1={vBaseX} y1={minY} x2={vBaseX} y2={maxY} />
          {vPoints.map((pt, i) => (
            <g key={`vTick${i}`}>
              <line x1={vBaseX - tick} y1={pt.y} x2={vBaseX + tick} y2={pt.y} strokeWidth={strokeW * 1.5} />
              {i < vPoints.length - 1 && (
                <text x={vBaseX - tick * 1.5} y={(pt.y + vPoints[i+1].y) / 2} fill={theme.dimText} stroke="none" fontSize={dimFontSize} fontWeight="normal">{fmt(pt.val)}</text>
              )}
            </g>
          ))}

          <line x1={vTotalX} y1={minY} x2={vTotalX} y2={maxY} />
          <line x1={vTotalX - tick} y1={minY} x2={vTotalX + tick} y2={minY} strokeWidth={strokeW * 1.5} />
          <line x1={vTotalX - tick} y1={maxY} x2={vTotalX + tick} y2={maxY} strokeWidth={strokeW * 1.5} />
          <text x={vTotalX - tick * 1.5} y={(minY + maxY) / 2} fill={theme.dimText} stroke="none" fontSize={dimFontSize} fontWeight="normal">{fmt(maxY - minY)}</text>
        </g>

        {/* VẼ ĐƯỜNG GIÓNG VÀ KÍCH THƯỚC NGANG (DƯỚI) */}
        <g stroke={theme.dim} fill={theme.dim} strokeWidth={strokeW * 0.8} textAnchor="middle">
          {hPoints.map((pt, i) => (
            <line key={`hExt${i}`} x1={pt.x} y1={pt.x >= X+Y && pt.x <= 2*X+Y ? maxY : Z} x2={pt.x} y2={hTotalY + tick} stroke={theme.dimLine} strokeWidth={strokeW * 0.5} strokeDasharray="4,4" />
          ))}

          <line x1={minX} y1={hBaseY} x2={maxX} y2={hBaseY} />
          {hPoints.map((pt, i) => (
            <g key={`hTick${i}`}>
              <line x1={pt.x} y1={hBaseY - tick} x2={pt.x} y2={hBaseY + tick} strokeWidth={strokeW * 1.5} />
              {i < hPoints.length - 1 && (
                <text x={(pt.x + hPoints[i+1].x) / 2} y={hBaseY - tick * 1.2} fill={theme.dimText} stroke="none" fontSize={dimFontSize} fontWeight="normal">{fmt(pt.val)}</text>
              )}
            </g>
          ))}

          <line x1={minX} y1={hTotalY} x2={maxX} y2={hTotalY} />
          <line x1={minX} y1={hTotalY - tick} x2={minX} y2={hTotalY + tick} strokeWidth={strokeW * 1.5} />
          <line x1={maxX} y1={hTotalY - tick} x2={maxX} y2={hTotalY + tick} strokeWidth={strokeW * 1.5} />
          <text x={(minX + maxX) / 2} y={hTotalY - tick * 1.2} fill={theme.dimText} stroke="none" fontSize={dimFontSize} fontWeight="normal">{fmt(maxX - minX)}</text>
        </g>

        {/* VẼ HÌNH TRẢI PHẲNG */}
        <g>
          <path d={outlinePath} fill={theme.fill} stroke="none" />
          
          {creaseLines.map((line, i) => (
            <line 
              key={`crease-${i}`} 
              x1={line.x1} y1={line.y1} x2={line.x2} y2={line.y2} 
              stroke={theme.stroke} 
              strokeWidth={strokeW * 0.8} 
              strokeDasharray={`${strokeW * 3},${strokeW * 3}`} 
              strokeLinecap="round" 
            />
          ))}
          
          <path d={outlinePath} fill="none" stroke={theme.stroke} strokeWidth={strokeW} strokeLinejoin="round" />
          
          {panels.map((p, i) => (
            p.w > vbW * 0.05 && p.h > vbH * 0.05 ? (
              <text 
                key={`label-${i}`}
                x={p.cx} 
                y={p.cy} 
                fill={theme.text} 
                fontSize={Math.min(vbW * 0.025, p.w * 0.2)} 
                fontWeight="700" 
                textAnchor="middle" 
                dominantBaseline="middle"
                opacity="0.6"
              >
                {p.label}
              </text>
            ) : null
          ))}
        </g>
      </svg>
    </div>
  );
}

// ==========================================
// COMPONENT VẼ BÌNH BẢN (IMPOSITION LAYOUT)
// ==========================================
function BoxImpositionViewer({ boxType, width, depth, height, cols, rows, hopMemDatabase, muonSong, daoTaiDan }) {
  const safeParse = (val) => parseFloat(String(val).replace(',', '.')) || 0;
  const X = safeParse(width);
  const Y = safeParse(depth);
  const Z = safeParse(height);
  const cCols = parseInt(cols) || 1;
  const cRows = parseInt(rows) || 1;

  if (X <= 0 || Y <= 0 || Z <= 0 || cCols <= 0 || cRows <= 0) return null;

  // Lấy cả 2 biến thể hình học (Tiêu chuẩn và Đảo tai dán)
  const geomNormal = getHopMemGeometry(boxType, X, Y, Z, hopMemDatabase, false);
  const geomDao = getHopMemGeometry(boxType, X, Y, Z, hopMemDatabase, true);
  if (!geomNormal) return null;

  const { minX, maxX, minY, maxY, overlapX, overlapY } = geomNormal;
  
  const singleW = maxX - minX;
  const singleH = maxY - minY;
  const gap = muonSong ? 0 : 0.4; // Khoảng cách khe hở giữa các hộp (cm) - Nếu mượn sông thì gap = 0

  // Tính toán bước nhảy (stride) có tính đến lồng ghép âm
  const stepW = singleW - overlapX + gap;
  const stepH = singleH - overlapY + gap;

  const totalW = singleW + (cCols - 1) * stepW;
  const totalH = singleH + (cRows - 1) * stepH;

  const pad = Math.max(totalW, totalH) * 0.1;
  const vbX = -pad;
  const vbY = -pad;
  const vbW = totalW + pad * 2;
  const vbH = totalH + pad * 2;

  const strokeW = vbW * 0.0015;
  const theme = {
    stroke: "#333333",
    fill: "#f8fafc",
    crease: "#94a3b8",
    dimText: "#475569",
    dimLine: "#64748b"
  };

  const fmt = (num) => Number(Math.abs(num).toFixed(2));

  return (
    <div className="w-full bg-[#f8f9fa] border border-dashed border-[#cbd5e1] rounded-xl overflow-hidden relative shadow-inner p-4 flex flex-col justify-center items-center mt-2">
      <svg viewBox={`${vbX} ${vbY} ${vbW} ${vbH}`} className="w-full h-auto max-h-[600px] drop-shadow-sm">
        {/* Vẽ Kích thước tổng */}
        <path d={`M 0 -${pad*0.3} L ${totalW} -${pad*0.3}`} stroke={theme.dimLine} strokeWidth={strokeW} />
        <line x1={0} y1={-pad*0.4} x2={0} y2={-pad*0.2} stroke={theme.dimLine} strokeWidth={strokeW} />
        <line x1={totalW} y1={-pad*0.4} x2={totalW} y2={-pad*0.2} stroke={theme.dimLine} strokeWidth={strokeW} />
        <text x={totalW/2} y={-(pad*0.45)} fill={theme.dimText} fontSize={Math.max(vbW * 0.015, 0.5)} textAnchor="middle">Ngang cụm khuôn: {fmt(totalW)} cm</text>

        <path d={`M -${pad*0.3} 0 L -${pad*0.3} ${totalH}`} stroke={theme.dimLine} strokeWidth={strokeW} />
        <line x1={-pad*0.4} y1={0} x2={-pad*0.2} y2={0} stroke={theme.dimLine} strokeWidth={strokeW} />
        <line x1={-pad*0.4} y1={totalH} x2={-pad*0.2} y2={totalH} stroke={theme.dimLine} strokeWidth={strokeW} />
        <text x={-(pad*0.45)} y={totalH/2} fill={theme.dimText} fontSize={Math.max(vbW * 0.015, 0.5)} textAnchor="middle" transform={`rotate(-90, -${pad*0.45}, ${totalH/2})`}>Cao cụm khuôn: {fmt(totalH)} cm</text>

        {/* Lặp Lưới Vẽ Các Bát */}
        {Array.from({length: cRows}).map((_, r) => (
          Array.from({length: cCols}).map((_, col) => {
            const batId = r * cCols + col + 1;
            
            // Logic lật bát: Mirror Horizontal + Mirror Vertical = Xoay 180 độ
            // Áp dụng xếp quay đầu cho hộp Nắp cài đáy khóa ở hàng chẵn
            const isFlipped = boxType === 'nap_cai_day_khoa' && cRows > 1 && r % 2 === 0;
            
            // Nếu là bát bị lật xoay và có tick "Đảo tai dán" -> Dùng bản vẽ geomDao
            const useDaoTaiDan = daoTaiDan && isFlipped && boxType === 'nap_cai_day_khoa';
            const currentGeom = useDaoTaiDan && geomDao ? geomDao : geomNormal;

            const tx = col * stepW - currentGeom.minX;
            const ty = r * stepH - currentGeom.minY;

            const cx = (currentGeom.minX + currentGeom.maxX) / 2;
            const cy = (currentGeom.minY + currentGeom.maxY) / 2;
            
            // Xoay group chứa bát 180 độ quanh tâm của nó
            const transformGroup = isFlipped 
              ? `translate(${tx}, ${ty}) rotate(180, ${cx}, ${cy})` 
              : `translate(${tx}, ${ty})`;
            
            // Xoay ngược lại con số bên trong để không bị đọc lộn ngược
            const transformText = isFlipped 
              ? `rotate(180, ${cx}, ${cy})` 
              : "";

            return (
              <g transform={transformGroup} key={`box-${r}-${col}`}>
                <path d={currentGeom.outlinePath} fill={theme.fill} stroke="none" />
                {currentGeom.creaseLines.map((line, i) => (
                  <line 
                    key={`crease-${i}`} 
                    x1={line.x1} y1={line.y1} x2={line.x2} y2={line.y2} 
                    stroke={theme.crease} 
                    strokeWidth={strokeW * 0.8} 
                    strokeDasharray={`${strokeW * 3},${strokeW * 3}`} 
                  />
                ))}
                <path d={currentGeom.outlinePath} fill="none" stroke={theme.stroke} strokeWidth={strokeW} strokeLinejoin="round" />
                <text x={cx} y={cy} transform={transformText} fill="#3b82f6" opacity="0.15" fontSize={Math.min(singleW, singleH)*0.4} fontWeight="bold" textAnchor="middle" dominantBaseline="middle">
                  {batId}
                </text>
              </g>
            )
          })
        ))}
      </svg>
    </div>
  );
}

function HopMemCalculator({ paperDatabase, printerDatabase, finishingDatabase, hopMemDatabase, isLoadingPrices, fetchPaperPrices }) {
  // --- STATES THÔNG TIN CHUNG ---
  const [productName, setProductName] = useState('Hộp mỹ phẩm');
  const [quantity, setQuantity] = useState('1000');
  const [boxType, setBoxType] = useState('cai_2_dau');
  const [boxWidth, setBoxWidth] = useState('13'); // Ngang
  const [boxDepth, setBoxDepth] = useState('8'); // Hông
  const [boxHeight, setBoxHeight] = useState('8'); // Cao

  // --- STATES GIẤY & BÌNH BẢN ---
  const [paperType, setPaperType] = useState('Ivory');
  const [paperGsm, setPaperGsm] = useState('');
  const [parentSizeIdx, setParentSizeIdx] = useState('');
  const [cols, setCols] = useState(1); // Số bát ngang
  const [rows, setRows] = useState(1); // Số bát dọc
  const [daoTaiDan, setDaoTaiDan] = useState(false); // Đảo tai dán
  const [muonSong, setMuonSong] = useState(false);
  const [muonNhip, setMuonNhip] = useState(false);
  const [allowMixed, setAllowMixed] = useState(false);

  // --- STATES IN ẤN ---
  const [printColors, setPrintColors] = useState(4);
  const [selectedPrinter, setSelectedPrinter] = useState('');

  // --- STATES GIA CÔNG ---
  const [lamination, setLamination] = useState('none');
  
  const [hasFoil, setHasFoil] = useState(false);
  const [foilLength, setFoilLength] = useState('');
  const [foilWidth, setFoilWidth] = useState('');
  
  const [hasEmboss, setHasEmboss] = useState(false);
  const [embossLength, setEmbossLength] = useState('');
  const [embossWidth, setEmbossWidth] = useState('');

  // --- STATES TÀI CHÍNH ---
  const [shippingCost, setShippingCost] = useState(0);
  const [markup, setMarkup] = useState(1.1);

  // --- STATES KẾT QUẢ HIỂN THỊ (Tạm thời) ---
  const [isCalculated, setIsCalculated] = useState(false);

  // --- DERIVED DATA ---
  const availablePaperTypes = paperDatabase ? Object.keys(paperDatabase) : [];
  const availableGsms = paperDatabase && paperDatabase[paperType] 
    ? Object.keys(paperDatabase[paperType]).map(Number).sort((a,b)=>a-b) 
    : [];

  // Logic kiểm tra đã nhập đủ 3 chiều kích thước chưa
  const hasValidDimensions = parseFloat(boxWidth) > 0 && parseFloat(boxDepth) > 0 && parseFloat(boxHeight) > 0;

  const handleCalculate = () => {
    setIsCalculated(true);
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 xl:h-full min-h-0">
      {/* KHU VỰC TRÁI: FORM NHẬP LIỆU */}
      <div className="xl:col-span-3 bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-6 xl:overflow-y-auto custom-scrollbar xl:h-full">
        <h2 className="text-lg font-semibold flex items-center space-x-2 border-b pb-3 shrink-0">
          <Box size={20} className="text-orange-500"/>
          <span>Thông Số Hộp Mềm</span>
        </h2>

        {/* 1. THÔNG TIN CHUNG */}
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-slate-800 bg-slate-100 p-2 rounded">1. Thông tin chung</h3>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Tên sản phẩm</label>
            <input type="text" className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none" value={productName} onChange={(e) => setProductName(e.target.value)} />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Số lượng hộp *</label>
              <input type="number" className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none font-semibold text-orange-700" value={quantity} onChange={(e) => setQuantity(e.target.value)} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Loại hộp</label>
              <select className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none" value={boxType} onChange={(e) => setBoxType(e.target.value)}>
                <option value="cai_2_dau">Hộp cài 2 đầu</option>
                <option value="dan_2_dau">Hộp dán 2 đầu</option>
                <option value="nap_cai_day_khoa">Hộp nắp cài đáy khoá</option>
                <option value="nap_cai_day_moc">Nắp cài đáy móc</option>
              </select>
            </div>
          </div>

          <div className="bg-orange-50 p-3 rounded-lg border border-orange-100 space-y-3 mt-2">
            <label className="text-xs font-bold text-orange-800 uppercase tracking-wider block">Kích thước thành phẩm (cm)</label>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-600">Ngang (X)</label>
                <input type="number" step="0.1" className="w-full p-2 border border-slate-300 rounded outline-none" placeholder="VD: 10" value={boxWidth} onChange={(e) => setBoxWidth(e.target.value)}/>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-600">Hông (Y)</label>
                <input type="number" step="0.1" className="w-full p-2 border border-slate-300 rounded outline-none" placeholder="VD: 5" value={boxDepth} onChange={(e) => setBoxDepth(e.target.value)}/>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-600">Cao (Z)</label>
                <input type="number" step="0.1" className="w-full p-2 border border-slate-300 rounded outline-none" placeholder="VD: 15" value={boxHeight} onChange={(e) => setBoxHeight(e.target.value)}/>
              </div>
            </div>
            
            {/* COMPONENT 3D VIEWER */}
            <Box3DViewer width={boxWidth} depth={boxDepth} height={boxHeight} />
          </div>
        </div>

        {/* 2. VẬT TƯ GIẤY & BÌNH BẢN */}
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-slate-800 bg-slate-100 p-2 rounded flex justify-between items-center">
            <span>2. Vật tư & Bình bản</span>
            <button onClick={fetchPaperPrices} disabled={isLoadingPrices} className="text-xs flex items-center space-x-1 text-orange-600 hover:text-orange-800 disabled:opacity-50 font-normal">
              <RefreshCw size={12} className={isLoadingPrices ? "animate-spin" : ""} /><span>Cập nhật</span>
            </button>
          </h3>
          
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-600">Số bát ngang</label>
              <input type="number" min="1" className="w-full p-2 bg-slate-50 border border-slate-300 rounded outline-none focus:ring-2 focus:ring-orange-500 text-sm" value={cols} onChange={(e) => setCols(e.target.value)}/>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-600">Số bát dọc</label>
              <input type="number" min="1" className="w-full p-2 bg-slate-50 border border-slate-300 rounded outline-none focus:ring-2 focus:ring-orange-500 text-sm" value={rows} onChange={(e) => setRows(e.target.value)}/>
            </div>
            <div className="flex items-end pb-2">
              <label className="flex items-center space-x-1.5 cursor-pointer group">
                <input type="checkbox" className="w-4 h-4 rounded text-orange-600 focus:ring-orange-500 cursor-pointer" checked={daoTaiDan} onChange={(e) => setDaoTaiDan(e.target.checked)} />
                <span className="text-sm font-medium text-slate-700 group-hover:text-orange-600 transition-colors">Đảo tai dán</span>
              </label>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-100">
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-600">Loại giấy *</label>
              <select className="w-full p-2 bg-slate-50 border border-slate-300 rounded outline-none text-sm" value={paperType} onChange={(e) => { setPaperType(e.target.value); setPaperGsm(''); }}>
                {availablePaperTypes.map(type => <option key={type} value={type}>{type}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-600">Định lượng *</label>
              <select className="w-full p-2 bg-slate-50 border border-slate-300 rounded outline-none text-sm" value={paperGsm} onChange={(e) => setPaperGsm(e.target.value === '' ? '' : Number(e.target.value))} disabled={!paperType}>
                <option value="" disabled hidden>Chọn Đ.Lượng</option>
                {availableGsms.map(gsm => <option key={gsm} value={gsm}>{gsm}</option>)}
              </select>
            </div>
          </div>

          <div className="space-y-2 pt-1 border-t border-slate-100">
            <label className="text-sm font-medium text-slate-700">Khổ giấy in (Nguyên khổ) *</label>
            <select className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none text-sm" value={parentSizeIdx} onChange={(e) => setParentSizeIdx(e.target.value)}>
              <option value="" disabled hidden>Chọn khổ giấy in...</option>
              {PARENT_PAPER_SIZES.map((size, idx) => (<option key={idx} value={idx}>{size.label}</option>))}
            </select>
          </div>

          <div className="flex flex-wrap gap-x-5 gap-y-2 pt-2 border-t border-slate-100">
            <label className="flex items-center space-x-1.5 cursor-pointer group">
              <input type="checkbox" className="w-4 h-4 rounded text-orange-600 focus:ring-orange-500" checked={muonSong} onChange={(e) => setMuonSong(e.target.checked)} />
              <span className="text-sm font-medium text-slate-700">Mượn sông</span>
            </label>
            <label className="flex items-center space-x-1.5 cursor-pointer group">
              <input type="checkbox" className="w-4 h-4 rounded text-orange-600 focus:ring-orange-500" checked={muonNhip} onChange={(e) => setMuonNhip(e.target.checked)} />
              <span className="text-sm font-medium text-slate-700">Mượn nhíp</span>
            </label>
            <label className="flex items-center space-x-1.5 cursor-pointer group">
              <input type="checkbox" className="w-4 h-4 rounded text-orange-600 focus:ring-orange-500" checked={allowMixed} onChange={(e) => setAllowMixed(e.target.checked)} />
              <span className="text-sm font-medium text-slate-700">Xếp phối hợp (L)</span>
            </label>
          </div>
        </div>

        {/* 3. THÔNG SỐ IN ẤN */}
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-slate-800 bg-slate-100 p-2 rounded">3. Thông số in ấn</h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-600">Số màu in</label>
              <select className="w-full p-2 bg-slate-50 border border-slate-300 rounded outline-none text-sm" value={printColors} onChange={(e) => setPrintColors(Number(e.target.value))}>
                {[1, 2, 3, 4, 5].map(c => <option key={c} value={c}>{c} màu</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-600">Chọn máy in</label>
              <select className="w-full p-2 bg-slate-50 border border-slate-300 rounded outline-none text-sm" value={selectedPrinter} onChange={(e) => setSelectedPrinter(e.target.value)}>
                <option value="">Chọn máy...</option>
                {printerDatabase.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* 4. GIA CÔNG */}
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-slate-800 bg-slate-100 p-2 rounded">4. Gia công bao bì</h3>
          
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-600">Cán màng</label>
            <select className="w-full p-2 bg-slate-50 border border-slate-300 rounded outline-none text-sm" value={lamination} onChange={(e) => setLamination(e.target.value)}>
              {LAMINATION_TYPES.map(l => <option key={l.id} value={l.id}>{l.label}</option>)}
            </select>
          </div>

          <div className="pt-2 border-t border-slate-100 space-y-3">
            {/* Ép nhũ */}
            <div>
              <label className="flex items-center space-x-2 cursor-pointer mb-2">
                <input type="checkbox" className="w-4 h-4 rounded text-orange-600 focus:ring-orange-500" checked={hasFoil} onChange={(e) => setHasFoil(e.target.checked)} />
                <span className="text-sm font-bold text-slate-700">Ép nhũ (Foil)</span>
              </label>
              {hasFoil && (
                <div className="grid grid-cols-2 gap-3 pl-6">
                  <div className="space-y-1">
                    <label className="text-[11px] font-medium text-slate-500">Dài nhũ (cm)</label>
                    <input type="number" step="0.1" className="w-full p-1.5 border border-slate-300 rounded outline-none text-sm" value={foilLength} onChange={(e) => setFoilLength(e.target.value)}/>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-medium text-slate-500">Rộng nhũ (cm)</label>
                    <input type="number" step="0.1" className="w-full p-1.5 border border-slate-300 rounded outline-none text-sm" value={foilWidth} onChange={(e) => setFoilWidth(e.target.value)}/>
                  </div>
                </div>
              )}
            </div>

            {/* Thúc nổi */}
            <div>
              <label className="flex items-center space-x-2 cursor-pointer mb-2">
                <input type="checkbox" className="w-4 h-4 rounded text-orange-600 focus:ring-orange-500" checked={hasEmboss} onChange={(e) => setHasEmboss(e.target.checked)} />
                <span className="text-sm font-bold text-slate-700">Thúc nổi (Emboss)</span>
              </label>
              {hasEmboss && (
                <div className="grid grid-cols-2 gap-3 pl-6">
                  <div className="space-y-1">
                    <label className="text-[11px] font-medium text-slate-500">Dài thúc (cm)</label>
                    <input type="number" step="0.1" className="w-full p-1.5 border border-slate-300 rounded outline-none text-sm" value={embossLength} onChange={(e) => setEmbossLength(e.target.value)}/>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-medium text-slate-500">Rộng thúc (cm)</label>
                    <input type="number" step="0.1" className="w-full p-1.5 border border-slate-300 rounded outline-none text-sm" value={embossWidth} onChange={(e) => setEmbossWidth(e.target.value)}/>
                  </div>
                </div>
              )}
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
          onClick={handleCalculate} 
          className="w-full py-3 bg-orange-600 hover:bg-orange-700 text-white font-medium rounded-xl transition-colors flex justify-center items-center space-x-2 shadow-sm mt-4 shrink-0"
        >
          <Maximize size={18} /><span>Tính toán & Phân trang hộp</span>
        </button>
      </div>

      {/* KHU VỰC PHẢI: KẾT QUẢ & BẢN VẼ */}
      <div className="xl:col-span-9 flex flex-col space-y-6 xl:overflow-y-auto custom-scrollbar xl:h-full xl:pr-2 xl:pb-6">
        {!(isCalculated || hasValidDimensions) ? (
          <div className="bg-white border border-slate-200 p-10 rounded-2xl flex flex-col items-center justify-center text-slate-400 h-full min-h-[400px] shrink-0">
            <Box size={48} className="mb-4 opacity-50 text-orange-400"/>
            <p className="font-medium text-slate-600 text-lg">Hệ thống tính giá Hộp mềm</p>
            <p className="text-sm mt-1">Nhập đầy đủ kích thước hộp để tự động xem bản vẽ kỹ thuật.</p>
          </div>
        ) : (
          <>
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col shrink-0">
              <h2 className="text-lg font-semibold mb-2 text-slate-800 border-b pb-2 flex justify-between items-center">
                <span>Bản vẽ kỹ thuật (Flat Layout)</span>
              </h2>
              <FlatLayoutViewer boxType={boxType} width={boxWidth} depth={boxDepth} height={boxHeight} hopMemDatabase={hopMemDatabase} />
              
              <h2 className="text-lg font-semibold mb-2 mt-8 text-slate-800 border-b pb-2 flex justify-between items-center">
                <span>Sơ đồ bình bản khuôn bế ({cols} ngang x {rows} dọc)</span>
              </h2>
              <BoxImpositionViewer boxType={boxType} width={boxWidth} depth={boxDepth} height={boxHeight} cols={cols} rows={rows} hopMemDatabase={hopMemDatabase} muonSong={muonSong} daoTaiDan={daoTaiDan} />
            </div>

            <div className="bg-orange-50 border border-orange-200 p-10 rounded-2xl flex flex-col items-center justify-center text-orange-600 min-h-[250px] shrink-0">
              <Sparkles size={48} className="mb-4 opacity-80"/>
              <p className="font-bold text-lg mb-2 text-orange-800">Giao diện đã sẵn sàng!</p>
              <p className="text-sm text-center max-w-md text-orange-700">
                Bạn hãy cung cấp các công thức và quy tắc ở bước tiếp theo để AI tích hợp logic tính <strong>Kích thước trải, Khuôn bế, Công dán hộp</strong> và báo giá nhé.
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
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
  const [hopMemDatabase, setHopMemDatabase] = useState([]);
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
      let rawHopMem;
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
           rawHopMem = json.hopMem || [];
           rawDinhMuc = json.dinhMuc || DEFAULT_DINHMUC_DATA;
        } else {
           rawPapers = json.record ? json.record : json; 
           rawPrinters = [];
           rawFinishing = DEFAULT_FINISHING_DATA;
           rawHopMem = [];
           rawDinhMuc = DEFAULT_DINHMUC_DATA;
        }

      } catch (fetchError) {
        rawPapers = DEFAULT_PAPER_DATA;
        rawPrinters = DEFAULT_PRINTER_DATA;
        rawFinishing = DEFAULT_FINISHING_DATA;
        rawHopMem = [];
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
      
      setHopMemDatabase(rawHopMem);

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
      case 'hopmem': return <HopMemCalculator paperDatabase={paperDatabase} printerDatabase={printerDatabase} finishingDatabase={finishingDatabase} hopMemDatabase={hopMemDatabase} isLoadingPrices={isLoadingPrices} fetchPaperPrices={fetchPaperPrices} />;
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