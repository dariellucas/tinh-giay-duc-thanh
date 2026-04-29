import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AlertCircle, Check, Copy, FileText, Layout, Maximize, Printer, RefreshCw, Settings, X } from 'lucide-react';
import { DEFAULT_GAP_CM, DEFAULT_GRIPPER_CM, HAO_CAN, HAO_GAP, HAO_IN, KHO_THIEU_SIZES, LAMINATION_TYPES, MARKUP_RATES, PARENT_PAPER_SIZES, PRINT_MARGIN_CM, PRODUCT_SIZES, DEFAULT_MARKUP } from '../constants/pricingConstants';
import ImpositionCanvas from '../components/viewers/ImpositionCanvas';
import QuoteSaveForm from '../components/QuoteSaveForm';
import { usePricingDataContext } from '../context/PricingDataContext';
import { filterPrintersBySize, findFinishingByName } from '../utils/finishingUtils';
import { calculatePaperCost, getSpoilageByQuantity, safeParseNumber } from '../utils/numberUtils';

function ToRoiCalculator({ editingQuote }) {
  const {
    paperDatabase,
    printerDatabase,
    finishingDatabase,
    dinhMucDatabase,
    isLoadingPrices,
    fetchPaperPrices,
  } = usePricingDataContext();
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
  const [markup, setMarkup] = useState(DEFAULT_MARKUP);
  const [paperType, setPaperType] = useState('');
  const [paperGsm, setPaperGsm] = useState('');
  const [muonSong, setMuonSong] = useState(false);
  const [muonNhip, setMuonNhip] = useState(false);
  const [allowMixed, setAllowMixed] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [orderForm, setOrderForm] = useState({
    orderCode: '', supplier: '', paperType: '', deliveryDate: '', deliveryAddress: '', notes: ''
  });
  const [generatedOrder, setGeneratedOrder] = useState('');
  const [orderCopied, setOrderCopied] = useState(false);

  const appliedEditingQuoteIdRef = useRef(null);
  const quantityRef = useRef(null);
  const productSizeRef = useRef(null);
  const customProductSizeRef = useRef(null);
  const paperTypeRef = useRef(null);
  const paperGsmRef = useRef(null);
  const parentSizeRef = useRef(null);
  const customParentSizeRef = useRef(null);
  const rollCutLengthRef = useRef(null);
  const selectedPrinterRef = useRef(null);

  const MARGIN = PRINT_MARGIN_CM;

  useEffect(() => {
    if (!editingQuote?.id || appliedEditingQuoteIdRef.current === editingQuote.id) return;
    const category = String(editingQuote.productCategory || '').toLowerCase();
    if (!category.includes('tờ') && !category.includes('rời') && !category.includes('to roi')) return;

    const specs = editingQuote.specifications || {};
    appliedEditingQuoteIdRef.current = editingQuote.id;
    setProductName(editingQuote.productName || productName);
    if (specs.quantity) setQuantity(String(specs.quantity));
    if (specs.paperType) setPaperType(specs.paperType);
    if (specs.paperGsm) setPaperGsm(Number(specs.paperGsm));
    if (specs.printColors) setPrintColors(Number(specs.printColors));
    if (specs.printSides) setPrintSides(Number(specs.printSides));
    if (specs.impositionStyle) setImpositionStyle(specs.impositionStyle);
    if (specs.lamination) setLamination(specs.lamination);
    if (specs.laminationSides) setLaminationSides(Number(specs.laminationSides));
    if (specs.foldingLines !== undefined) setFoldingLines(Number(specs.foldingLines));
    if (specs.markup) setMarkup(Number(specs.markup));

    const productSizeIndex = PRODUCT_SIZES.findIndex((item) => item.label === specs.productSize);
    if (productSizeIndex >= 0) setProductTypeIdx(productSizeIndex);
    else if (specs.result?.productW && specs.result?.productH) {
      setProductTypeIdx(PRODUCT_SIZES.length - 1);
      setCustomW(String(specs.result.productW));
      setCustomH(String(specs.result.productH));
    }

    if (specs.result?.parentW && specs.result?.parentH) {
      const parentSizeIndex = PARENT_PAPER_SIZES.findIndex((item) => (
        Number(item.w) === Number(specs.result.parentW) && Number(item.h) === Number(specs.result.parentH)
      ));
      if (parentSizeIndex >= 0) setParentSizeIdx(parentSizeIndex);
      else {
        setParentSizeIdx(PARENT_PAPER_SIZES.length);
        setCustomParentW(String(specs.result.parentW));
        setCustomParentH(String(specs.result.parentH));
      }
    }

    if (specs.result) setResult(specs.result);
    setError('');
    setFieldErrors({});
  }, [editingQuote, productName]);

  const { reqMax, reqMin } = useMemo(() => {
    let pw = 0, ph = 0;
    if (parentSizeIdx === '') {
      pw = 0; ph = 0;
    } else if (parentSizeIdx === PARENT_PAPER_SIZES.length) {
      pw = safeParseNumber(customParentW);
      ph = safeParseNumber(customParentH);
    } else if (parentSizeIdx === PARENT_PAPER_SIZES.length + 1) {
      pw = safeParseNumber(rollWidth) / rollSplit;
      ph = safeParseNumber(rollCutLength);
    } else {
      pw = PARENT_PAPER_SIZES[parentSizeIdx].w;
      ph = PARENT_PAPER_SIZES[parentSizeIdx].h;
    }
    return { reqMax: Math.max(pw, ph), reqMin: Math.min(pw, ph) };
  }, [parentSizeIdx, customParentW, customParentH, rollWidth, rollSplit, rollCutLength]);

  const validPrinters = useMemo(() => {
    if (!printerDatabase) return [];
    return filterPrintersBySize(printerDatabase, reqMax, reqMin);
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

  const fieldRefs = {
    quantity: quantityRef,
    productSize: productSizeRef,
    customProductSize: customProductSizeRef,
    paperType: paperTypeRef,
    paperGsm: paperGsmRef,
    parentSize: parentSizeRef,
    customParentSize: customParentSizeRef,
    rollCutLength: rollCutLengthRef,
    selectedPrinter: selectedPrinterRef,
  };

  const fieldErrorOrder = ['quantity', 'productSize', 'customProductSize', 'paperType', 'paperGsm', 'parentSize', 'customParentSize', 'rollCutLength', 'selectedPrinter'];

  const scrollToFirstFieldError = (errors) => {
    const firstErrorKey = fieldErrorOrder.find((key) => errors[key]);
    const target = firstErrorKey ? fieldRefs[firstErrorKey]?.current : null;
    if (target) target.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  const applyValidationErrors = (errors, summaryMessage) => {
    setFieldErrors(errors);
    setError(summaryMessage);
    setResult(null);
    requestAnimationFrame(() => scrollToFirstFieldError(errors));
  };

  const clearFieldError = (...keys) => {
    setFieldErrors((prev) => {
      if (!keys.some((key) => prev[key])) return prev;
      const next = { ...prev };
      keys.forEach((key) => delete next[key]);
      return next;
    });
  };

  const hasFieldError = (...keys) => keys.some((key) => fieldErrors[key]);
  const fieldClass = (baseClass, ...keys) => (
    hasFieldError(...keys)
      ? `${baseClass} border-red-500 ring-1 ring-red-500 focus:ring-red-500 bg-red-50`
      : baseClass
  );
  const renderFieldError = (key) => fieldErrors[key] ? (
    <p className="mt-1 flex items-start gap-1.5 text-xs font-medium text-red-600">
      <AlertCircle size={14} className="mt-0.5 shrink-0" />
      <span>{fieldErrors[key]}</span>
    </p>
  ) : null;

  const calculateImposition = (e) => {
    const isManualClick = e && e.type === 'click';

    if (!paperDatabase || !printerDatabase) {
      setError('Đang tải dữ liệu, vui lòng chờ...');
      return;
    }

    const qty = parseInt(quantity);
    const nextFieldErrors = {};

    if (quantity === '' || isNaN(qty) || qty <= 0) nextFieldErrors.quantity = 'Số lượng in phải lớn hơn 0.';
    if (productTypeIdx === '') nextFieldErrors.productSize = 'Chọn khổ sản phẩm.';
    if (productTypeIdx === PRODUCT_SIZES.length - 1 && (safeParseNumber(customW) <= 0 || safeParseNumber(customH) <= 0)) {
      nextFieldErrors.customProductSize = 'Nhập đủ ngang và cao cho khổ sản phẩm tùy chọn.';
    }
    if (paperType === '') nextFieldErrors.paperType = 'Chọn loại giấy.';
    if (paperGsm === '') nextFieldErrors.paperGsm = 'Chọn định lượng giấy.';
    if (parentSizeIdx === '') nextFieldErrors.parentSize = 'Chọn khổ giấy in.';
    if (parentSizeIdx === PARENT_PAPER_SIZES.length && (safeParseNumber(customParentW) <= 0 || safeParseNumber(customParentH) <= 0)) {
      nextFieldErrors.customParentSize = 'Nhập đủ ngang và cao cho khổ giấy tùy chọn.';
    }
    if (parentSizeIdx === PARENT_PAPER_SIZES.length + 1) {
      if (!rollWidth || safeParseNumber(rollWidth) <= 0) nextFieldErrors.parentSize = 'Loại giấy/định lượng này chưa có khổ lô hợp lệ.';
      if (safeParseNumber(rollCutLength) <= 0) nextFieldErrors.rollCutLength = 'Nhập chiều dài xả lớn hơn 0.';
    }

    if (Object.keys(nextFieldErrors).length > 0) {
      if (isManualClick) applyValidationErrors(nextFieldErrors, 'Vui lòng kiểm tra các trường đang được đánh dấu đỏ.');
      else setError('');
      setResult(null);
      return;
    }

    if (validPrinters.length === 0 || !selectedPrinter) {
      const message = `Kích thước giấy in (${reqMin}x${reqMax}) quá lớn. Không có máy in nào phù hợp!`;
      if (isManualClick) applyValidationErrors({ selectedPrinter: message }, message);
      else {
        setError(message);
        setResult(null);
      }
      return;
    }

    setFieldErrors({});
    setError('');
    setGeneratedOrder('');
    
    const GAP = muonSong ? 0 : DEFAULT_GAP_CM;
    const GRIPPER = muonNhip ? 0 : DEFAULT_GRIPPER_CM;
    
    // ÉP BUỘC TỜ GIẤY IN LUÔN NẰM NGANG (LANDSCAPE)
    const Pw = reqMax; 
    const Ph = reqMin;

    let prodW, prodH;
    if (productTypeIdx === PRODUCT_SIZES.length - 1) {
      const cw = safeParseNumber(customW);
      const ch = safeParseNumber(customH);
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
      const message = 'Sản phẩm quá lớn, không thể xếp vừa khổ giấy này (tính cả lề, sông và nhíp).';
      if (isManualClick) applyValidationErrors({ productSize: message, parentSize: 'Chọn khổ giấy lớn hơn hoặc bật Mượn nhíp/Mượn sông.' }, message);
      else {
        setError(message);
        setResult(null);
      }
      return;
    }

    const soToInLyThuyet = Math.ceil(qty / bestOpt.total); 

    let dynamicSpoilage = getSpoilageByQuantity(dinhMucDatabase, soToInLyThuyet);

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
    const pricePerKg = safeParseNumber(pricePerTon) * 1000; // Bảng giá giấy đang theo đơn vị tấn, cần quy đổi về kg.
    const totalCostVnd = calculatePaperCost(Pw, Ph, paperGsm, parentSheetsNeeded, pricePerTon);

    const tienGiay = totalCostVnd;

    let tienXaLo = 0;
    if (parentSizeIdx === PARENT_PAPER_SIZES.length + 1) {
      const xaLoObj = findFinishingByName(finishingDatabase, 'xả lô');
      tienXaLo = xaLoObj ? safeParseNumber(xaLoObj.minPrice) : 150000;
    }
    
    let soKem = printColors;
    if (printSides === 2 && impositionStyle === 'Trở khác') {
      soKem = printColors * 2;
    }
    const selectedPrinterObj = printerDatabase.find(p => p.id === selectedPrinter);
    const giaKem = selectedPrinterObj ? safeParseNumber(selectedPrinterObj.platePrice) : 0;
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
    const giaLuotCoBan = selectedPrinterObj ? safeParseNumber(selectedPrinterObj.runPrice) : 0;
    const giaLuot = printColors === 1 ? giaLuotCoBan + 10 : giaLuotCoBan;
    const tienIn = quaLuotMoiKem * soKem * giaLuot;

    let tienCan = 0;
    let canDetail = '';
    if (lamination !== 'none') {
      const canName = lamination === 'matte' ? 'cán mờ' : 'cán bóng';
      const canObj = findFinishingByName(finishingDatabase, canName);
      if (canObj) {
        const toCan = Math.max(0, parentSheetsNeeded - HAO_IN - HAO_CAN);
        const areaCm2 = Pw * Ph;
        const totalArea = areaCm2 * toCan * laminationSides;
        const cost = totalArea * safeParseNumber(canObj.price);
        tienCan = Math.max(cost, safeParseNumber(canObj.minPrice));
        canDetail = `(${toCan.toLocaleString('vi-VN')} tờ × ${laminationSides} mặt × ${areaCm2.toLocaleString('vi-VN')}cm² × ${canObj.price}đ)`;
      }
    }

    let tienXen = 0;
    let xenDetail = '';
    const xenObj = findFinishingByName(finishingDatabase, 'xén');
    if (xenObj) {
      const reams = parentSheetsNeeded / 500;
      const cost = reams * safeParseNumber(xenObj.price);
      tienXen = Math.max(cost, safeParseNumber(xenObj.minPrice));
      xenDetail = `(${reams.toFixed(1)} ram × ${xenObj.price.toLocaleString('vi-VN')}đ)`;
    }

    let tienGapVach = 0;
    let gapDetail = '';
    if (foldingLines > 0) {
      const gapObj = findFinishingByName(finishingDatabase, 'gấp vạch');
      if (gapObj) {
        const haoCanThucTe = lamination !== 'none' ? HAO_CAN : 0;
        const toGap = Math.max(0, parentSheetsNeeded - HAO_IN - haoCanThucTe - HAO_GAP);
        const soSanPhamGap = toGap * bestOpt.total; // Tính ra tổng số SP

        const cost = soSanPhamGap * foldingLines * safeParseNumber(gapObj.price);
        tienGapVach = Math.max(cost, safeParseNumber(gapObj.minPrice));
        gapDetail = `(${soSanPhamGap.toLocaleString('vi-VN')} SP × ${foldingLines} vạch × ${gapObj.price}đ)`;
      }
    }

    const tienVanChuyen = safeParseNumber(shippingCost); 

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
            <div ref={quantityRef} className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Số lượng in *</label>
              <input type="number" className={fieldClass('w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-semibold text-blue-700', 'quantity')} value={quantity} onChange={(e) => { setQuantity(e.target.value); clearFieldError('quantity'); }} />
              {renderFieldError('quantity')}
            </div>
            <div ref={productSizeRef} className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Khổ SP *</label>
              <select className={fieldClass('w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none', 'productSize')} value={productTypeIdx} onChange={(e) => { setProductTypeIdx(e.target.value === '' ? '' : parseInt(e.target.value)); clearFieldError('productSize', 'customProductSize'); }}>
                <option value="" disabled hidden>Chọn khổ SP...</option>
                {PRODUCT_SIZES.map((size, idx) => {
                  let label = size.label; if (isKhoThieu && KHO_THIEU_SIZES[idx]) label = KHO_THIEU_SIZES[idx].label;
                  return <option key={idx} value={idx}>{label}</option>
                })}
              </select>
              {renderFieldError('productSize')}
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
            <div ref={customProductSizeRef} className={fieldClass('grid grid-cols-2 gap-4 bg-blue-50 p-3 rounded-lg border border-blue-100', 'customProductSize')}>
              <div className="space-y-1"><label className="text-xs font-medium text-slate-600">Ngang (cm)</label><input type="number" step="0.1" className={fieldClass('w-full p-2 border border-slate-300 rounded outline-none', 'customProductSize')} value={customW} onChange={(e) => { setCustomW(e.target.value); clearFieldError('customProductSize', 'productSize'); }}/></div>
              <div className="space-y-1"><label className="text-xs font-medium text-slate-600">Cao (cm)</label><input type="number" step="0.1" className={fieldClass('w-full p-2 border border-slate-300 rounded outline-none', 'customProductSize')} value={customH} onChange={(e) => { setCustomH(e.target.value); clearFieldError('customProductSize', 'productSize'); }}/></div>
              {fieldErrors.customProductSize && <div className="col-span-2">{renderFieldError('customProductSize')}</div>}
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
              <div ref={paperTypeRef} className="space-y-1">
                <label className="text-xs font-medium text-slate-600">Loại giấy *</label>
                <select className={fieldClass('w-full p-2 bg-slate-50 border border-slate-300 rounded outline-none text-sm', 'paperType')} value={paperType} onChange={(e) => { const newType = e.target.value; setPaperType(newType); setPaperGsm(''); clearFieldError('paperType', 'paperGsm', 'parentSize'); }}>
                  <option value="" disabled hidden>Chọn loại giấy...</option>
                  {availablePaperTypes.map(type => <option key={type} value={type}>{type}</option>)}
                </select>
                {renderFieldError('paperType')}
              </div>
              <div ref={paperGsmRef} className="space-y-1">
                <label className="text-xs font-medium text-slate-600">Định lượng *</label>
                <select className={fieldClass('w-full p-2 bg-slate-50 border border-slate-300 rounded outline-none text-sm', 'paperGsm')} value={paperGsm} onChange={(e) => { setPaperGsm(e.target.value === '' ? '' : Number(e.target.value)); clearFieldError('paperGsm', 'parentSize'); }} disabled={!paperType}>
                  <option value="" disabled hidden>Chọn định lượng...</option>
                  {availableGsms.map(gsm => <option key={gsm} value={gsm}>{gsm}</option>)}
                </select>
                {renderFieldError('paperGsm')}
              </div>
            </div>
          )}


          {/* CHỌN KHỔ GIẤY IN TỜ RƠI */}
          <div ref={parentSizeRef} className="space-y-2 pt-2 border-t border-slate-100">
            <label className="text-sm font-medium text-slate-700 flex justify-between">
              <span>Khổ giấy in (Nguyên khổ) *</span>
              {parentSizeIdx === PARENT_PAPER_SIZES.length + 1 && reqMax > 0 && (
                <span className="text-xs text-amber-600 font-semibold bg-amber-100 px-2 py-0.5 rounded">
                  Khổ xả: {reqMin} x {reqMax} cm
                </span>
              )}
            </label>
            <select className={fieldClass('w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm', 'parentSize')} value={parentSizeIdx} onChange={(e) => { setParentSizeIdx(e.target.value === '' ? '' : parseInt(e.target.value)); clearFieldError('parentSize', 'customParentSize', 'rollCutLength', 'selectedPrinter'); }}>
              <option value="" disabled hidden>Chọn khổ giấy in...</option>
              {PARENT_PAPER_SIZES.map((size, idx) => (<option key={idx} value={idx}>{size.label}</option>))}
              <option value={PARENT_PAPER_SIZES.length}>Tùy chọn...</option>
              <option value={PARENT_PAPER_SIZES.length + 1}>Xả lô (Từ cuộn)...</option>
            </select>
            {renderFieldError('parentSize')}
          </div>
          {parentSizeIdx === PARENT_PAPER_SIZES.length && (
            <div ref={customParentSizeRef} className={fieldClass('grid grid-cols-2 gap-4 bg-emerald-50 p-2.5 rounded-lg border border-emerald-100', 'customParentSize')}>
              <div className="space-y-1"><label className="text-xs font-medium text-slate-600">Ngang (cm)</label><input type="number" step="0.1" className={fieldClass('w-full p-2 border border-slate-300 rounded outline-none', 'customParentSize')} value={customParentW} onChange={(e) => { setCustomParentW(e.target.value); clearFieldError('customParentSize', 'parentSize', 'selectedPrinter'); }}/></div>
              <div className="space-y-1"><label className="text-xs font-medium text-slate-600">Cao (cm)</label><input type="number" step="0.1" className={fieldClass('w-full p-2 border border-slate-300 rounded outline-none', 'customParentSize')} value={customParentH} onChange={(e) => { setCustomParentH(e.target.value); clearFieldError('customParentSize', 'parentSize', 'selectedPrinter'); }}/></div>
              {fieldErrors.customParentSize && <div className="col-span-2">{renderFieldError('customParentSize')}</div>}
            </div>
          )}
          {parentSizeIdx === PARENT_PAPER_SIZES.length + 1 && (
            <div className="grid grid-cols-3 gap-3 bg-amber-50 p-2.5 rounded-lg border border-amber-200 shadow-inner mt-1">
              <div className="space-y-1">
                <label className="text-xs font-bold text-amber-800">Khổ lô (cm)</label>
                {availableRolls.length > 0 ? (
                  <select className="w-full p-2 bg-white border border-amber-300 rounded outline-none text-sm font-semibold text-amber-900" value={rollWidth} onChange={(e) => { setRollWidth(e.target.value); clearFieldError('parentSize', 'selectedPrinter'); }}>
                    {availableRolls.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                ) : (
                  <input type="text" className="w-full p-2 border border-amber-200 rounded outline-none text-sm text-slate-400 bg-amber-100" value="Không có lô" disabled />
                )}
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-amber-800">Chia lô</label>
                <select className="w-full p-2 bg-white border border-amber-300 rounded outline-none text-sm" value={rollSplit} onChange={(e) => { setRollSplit(Number(e.target.value)); clearFieldError('parentSize', 'selectedPrinter'); }}>
                  {[1, 2, 3].map(v => <option key={v} value={v}>Chia {v}</option>)}
                </select>
              </div>
              <div ref={rollCutLengthRef} className="space-y-1">
                <label className="text-xs font-bold text-amber-800">Chiều dài xả</label>
                <input type="number" step="0.1" className={fieldClass('w-full p-2 border border-amber-300 rounded outline-none text-sm', 'rollCutLength')} placeholder="VD: 30" value={rollCutLength} onChange={(e) => { setRollCutLength(e.target.value); clearFieldError('rollCutLength', 'parentSize', 'selectedPrinter'); }}/>
                {renderFieldError('rollCutLength')}
              </div>
            </div>
          )}
          <div className="flex flex-wrap gap-x-5 gap-y-2 pt-3 mt-1 border-t border-slate-100">
            <label className="flex items-center space-x-1.5 cursor-pointer group">
              <input type="checkbox" className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500" checked={muonSong} onChange={(e) => { setMuonSong(e.target.checked); clearFieldError('productSize', 'parentSize'); }} />
              <span className="text-sm font-medium text-slate-700">Mượn sông</span>
            </label>
            <label className="flex items-center space-x-1.5 cursor-pointer group">
              <input type="checkbox" className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500" checked={muonNhip} onChange={(e) => { setMuonNhip(e.target.checked); clearFieldError('productSize', 'parentSize'); }} />
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
          <div ref={selectedPrinterRef} className="space-y-1 pt-1">
            <label className="text-xs font-medium text-slate-600">Chọn máy in</label>
            <select 
              className={fieldClass(`w-full p-2 bg-slate-50 border rounded outline-none text-sm font-medium ${validPrinters.length === 0 ? 'border-red-300 text-red-600' : 'border-slate-300 text-blue-700'}`, 'selectedPrinter')} 
              value={selectedPrinter} 
              onChange={(e) => { setSelectedPrinter(e.target.value); clearFieldError('selectedPrinter'); }}
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
            {renderFieldError('selectedPrinter')}
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
          <div className="sticky top-0 z-20 bg-red-50 border border-red-200 text-red-700 p-6 rounded-2xl flex items-center space-x-3 shadow-sm"><AlertCircle size={24} /><span className="font-medium">{error}</span></div>
        ) : result ? (
          <>
            <QuoteSaveForm
              editingQuote={editingQuote}
              quote={{
                productCategory: 'Tờ rời',
                productName,
                totalAmount: Math.round(result.costs.giaBan),
                specifications: {
                  quantity,
                  productSize: productTypeIdx === PRODUCT_SIZES.length - 1 ? `${customW} x ${customH} cm` : PRODUCT_SIZES[productTypeIdx]?.label,
                  paperType,
                  paperGsm,
                  printColors,
                  printSides,
                  impositionStyle,
                  lamination,
                  laminationSides,
                  foldingLines,
                  markup,
                  result,
                },
              }}
            />

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


export default ToRoiCalculator;
