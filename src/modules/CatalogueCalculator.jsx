import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AlertCircle, BookOpen, Layers, Maximize, Printer, RefreshCw } from 'lucide-react';
import { BINDING_TYPES, DEFAULT_GAP_CM, DEFAULT_GRIPPER_CM, KHO_THIEU_SIZES, LAMINATION_TYPES, MARKUP_RATES, PARENT_PAPER_SIZES, PRINT_MARGIN_CM, PRODUCT_SIZES, DEFAULT_MARKUP } from '../constants/pricingConstants';
import CatalogueSignatureCanvas from '../components/viewers/CatalogueSignatureCanvas';
import QuoteSaveForm from '../components/QuoteSaveForm';
import { usePricingDataContext } from '../context/PricingDataContext';
import { filterPrintersBySize, findFinishingByName } from '../utils/finishingUtils';
import { calculatePaperCost, getSpoilageByQuantity, safeParseNumber } from '../utils/numberUtils';

function CatalogueCalculator({ editingQuote, onFinishEditing }) {
  const {
    paperDatabase,
    printerDatabase,
    finishingDatabase,
    dinhMucDatabase,
    isLoadingPrices,
    fetchPaperPrices,
  } = usePricingDataContext();
  // --- STATES CHUNG ---
  const [productName, setProductName] = useState('Catalogue nội thất 2024');
  const [quantity, setQuantity] = useState('500');
  const [productTypeIdx, setProductTypeIdx] = useState(1); 
  const [customW, setCustomW] = useState('');
  const [customH, setCustomH] = useState('');
  const [totalPages, setTotalPages] = useState('28');
  const [bindingType, setBindingType] = useState('ghim');
  const [isCombinedPrint, setIsCombinedPrint] = useState(true); 
  const [markup, setMarkup] = useState(DEFAULT_MARKUP);
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
  const [fieldErrors, setFieldErrors] = useState({});

  const appliedEditingQuoteIdRef = useRef(null);
  const quantityRef = useRef(null);
  const productSizeRef = useRef(null);
  const customProductSizeRef = useRef(null);
  const totalPagesRef = useRef(null);
  const coverPaperTypeRef = useRef(null);
  const coverPaperGsmRef = useRef(null);
  const coverParentSizeRef = useRef(null);
  const coverCustomParentSizeRef = useRef(null);
  const coverRollCutLengthRef = useRef(null);
  const coverPrinterRef = useRef(null);
  const innerPaperTypeRef = useRef(null);
  const innerPaperGsmRef = useRef(null);
  const innerParentSizeRef = useRef(null);
  const innerCustomParentSizeRef = useRef(null);
  const innerRollCutLengthRef = useRef(null);
  const innerPrinterRef = useRef(null);
  const activeEditingQuote = (() => {
    const category = String(editingQuote?.productCategory || '').toLowerCase();
    return editingQuote?.id && category.includes('catalogue') ? editingQuote : null;
  })();

  const getCurrentProductSizeLabel = () => {
    if (productTypeIdx === PRODUCT_SIZES.length - 1) return `${customW} x ${customH} cm`;
    const size = isKhoThieu && KHO_THIEU_SIZES[productTypeIdx] ? KHO_THIEU_SIZES[productTypeIdx] : PRODUCT_SIZES[productTypeIdx];
    return size?.label;
  };

  const khoThieuSizeList = Object.values(KHO_THIEU_SIZES);

  useEffect(() => {
    if (!editingQuote?.id || appliedEditingQuoteIdRef.current === editingQuote.id) return;
    if (editingQuote.productCategory && !String(editingQuote.productCategory).toLowerCase().includes('catalogue')) return;

    const specs = editingQuote.specifications || {};
    appliedEditingQuoteIdRef.current = editingQuote.id;
    setProductName(editingQuote.productName || productName);
    if (specs.quantity) setQuantity(String(specs.quantity));
    if (specs.totalPages) setTotalPages(String(specs.totalPages));
    if (specs.bindingType) setBindingType(specs.bindingType);
    if (typeof specs.isCombinedPrint === 'boolean') setIsCombinedPrint(specs.isCombinedPrint);
    if (specs.orientation) setOrientation(specs.orientation);
    if (specs.shippingCost !== undefined) setShippingCost(Number(specs.shippingCost) || 0);
    else if (specs.result?.costs?.tienVanChuyen !== undefined) setShippingCost(Number(specs.result.costs.tienVanChuyen) || 0);
    if (specs.markup) setMarkup(Number(specs.markup));

    const khoThieuSizeIndex = khoThieuSizeList.findIndex((item) => item.label === specs.productSize);
    const resultSizeIndex = khoThieuSizeList.findIndex((item) => (
      Number(item.w) === Number(specs.result?.productW) && Number(item.h) === Number(specs.result?.productH)
    ));
    const shouldUseKhoThieu = typeof specs.isKhoThieu === 'boolean'
      ? specs.isKhoThieu
      : khoThieuSizeIndex >= 0 || resultSizeIndex >= 0;
    setIsKhoThieu(shouldUseKhoThieu);

    const productSizeIndex = PRODUCT_SIZES.findIndex((item) => item.label === specs.productSize);
    if (productSizeIndex >= 0) setProductTypeIdx(productSizeIndex);
    else if (khoThieuSizeIndex >= 0) setProductTypeIdx(khoThieuSizeIndex);

    if (specs.cover) {
      if (specs.cover.paperType) setCoverPaperType(specs.cover.paperType);
      if (specs.cover.paperGsm) setCoverPaperGsm(Number(specs.cover.paperGsm));
      if (specs.cover.printColors) setCoverPrintColors(Number(specs.cover.printColors));
      if (specs.cover.printSides) setCoverPrintSides(Number(specs.cover.printSides));
      if (specs.cover.lamination) setCoverLamination(specs.cover.lamination);
      if (specs.cover.laminationSides) setCoverLaminationSides(Number(specs.cover.laminationSides));
      if (specs.cover.foil) setCoverFoil(specs.cover.foil);
    }

    if (specs.inner) {
      if (specs.inner.paperType) setInnerPaperType(specs.inner.paperType);
      if (specs.inner.paperGsm) setInnerPaperGsm(Number(specs.inner.paperGsm));
      if (specs.inner.printColors) setInnerPrintColors(Number(specs.inner.printColors));
      if (specs.inner.printSides) setInnerPrintSides(Number(specs.inner.printSides));
      if (specs.inner.lamination) setInnerLamination(specs.inner.lamination);
      if (specs.inner.laminationSides) setInnerLaminationSides(Number(specs.inner.laminationSides));
    }

    if (specs.result) setResult(specs.result);
    setError('');
    setFieldErrors({});
  }, [editingQuote, productName]);

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
      pw = safeParseNumber(coverCustomParentW);
      ph = safeParseNumber(coverCustomParentH);
    } else if (coverParentSizeIdx === PARENT_PAPER_SIZES.length + 1) {
      pw = safeParseNumber(coverRollWidth) / coverRollSplit;
      ph = safeParseNumber(coverRollCutLength);
    } else {
      pw = PARENT_PAPER_SIZES[coverParentSizeIdx]?.w || 0;
      ph = PARENT_PAPER_SIZES[coverParentSizeIdx]?.h || 0;
    }
    return { coverReqMax: Math.max(pw, ph), coverReqMin: Math.min(pw, ph) };
  }, [coverParentSizeIdx, coverCustomParentW, coverCustomParentH, coverRollWidth, coverRollSplit, coverRollCutLength]);

  const validCoverPrinters = useMemo(() => {
    if (!printerDatabase) return [];
    return filterPrintersBySize(printerDatabase, coverReqMax, coverReqMin);
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
      pw = safeParseNumber(innerCustomParentW);
      ph = safeParseNumber(innerCustomParentH);
    } else if (innerParentSizeIdx === PARENT_PAPER_SIZES.length + 1) {
      pw = safeParseNumber(innerRollWidth) / innerRollSplit;
      ph = safeParseNumber(innerRollCutLength);
    } else {
      pw = PARENT_PAPER_SIZES[innerParentSizeIdx]?.w || 0;
      ph = PARENT_PAPER_SIZES[innerParentSizeIdx]?.h || 0;
    }
    return { innerReqMax: Math.max(pw, ph), innerReqMin: Math.min(pw, ph) };
  }, [innerParentSizeIdx, innerCustomParentW, innerCustomParentH, innerRollWidth, innerRollSplit, innerRollCutLength]);

  const validInnerPrinters = useMemo(() => {
    if (!printerDatabase) return [];
    return filterPrintersBySize(printerDatabase, innerReqMax, innerReqMin);
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

  const fieldRefs = {
    quantity: quantityRef,
    productSize: productSizeRef,
    customProductSize: customProductSizeRef,
    totalPages: totalPagesRef,
    coverPaperType: coverPaperTypeRef,
    coverPaperGsm: coverPaperGsmRef,
    coverParentSize: coverParentSizeRef,
    coverCustomParentSize: coverCustomParentSizeRef,
    coverRollCutLength: coverRollCutLengthRef,
    coverPrinter: coverPrinterRef,
    innerPaperType: innerPaperTypeRef,
    innerPaperGsm: innerPaperGsmRef,
    innerParentSize: innerParentSizeRef,
    innerCustomParentSize: innerCustomParentSizeRef,
    innerRollCutLength: innerRollCutLengthRef,
    innerPrinter: innerPrinterRef,
  };

  const fieldErrorOrder = [
    'quantity',
    'productSize',
    'customProductSize',
    'totalPages',
    'coverPaperType',
    'coverPaperGsm',
    'coverParentSize',
    'coverCustomParentSize',
    'coverRollCutLength',
    'coverPrinter',
    'innerPaperType',
    'innerPaperGsm',
    'innerParentSize',
    'innerCustomParentSize',
    'innerRollCutLength',
    'innerPrinter',
  ];

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

  const handleCalculate = () => {
    const nextFieldErrors = {};
    const qty = parseInt(quantity);

    if (!quantity || isNaN(qty) || qty <= 0) nextFieldErrors.quantity = 'Số lượng cuốn phải lớn hơn 0.';
    if (productTypeIdx === '') nextFieldErrors.productSize = 'Chọn khổ thành phẩm.';
    if (productTypeIdx === PRODUCT_SIZES.length - 1 && (safeParseNumber(customW) <= 0 || safeParseNumber(customH) <= 0)) {
      nextFieldErrors.customProductSize = 'Nhập đủ ngang và cao cho khổ thành phẩm tùy chọn.';
    }
    if (!totalPages || !isPagesValid) nextFieldErrors.totalPages = 'Tổng số trang phải lớn hơn 0 và chia hết cho 4.';

    const validatePaperSection = (prefix, pType, pGsm, pSizeIdx, customWVal, customHVal, rollW, rollCutL, validPrintersList, printer) => {
      if (!pType) nextFieldErrors[`${prefix}PaperType`] = 'Chọn loại giấy.';
      if (!pGsm) nextFieldErrors[`${prefix}PaperGsm`] = 'Chọn định lượng giấy.';
      if (pSizeIdx === '') nextFieldErrors[`${prefix}ParentSize`] = 'Chọn khổ giấy in.';
      if (pSizeIdx === PARENT_PAPER_SIZES.length && (safeParseNumber(customWVal) <= 0 || safeParseNumber(customHVal) <= 0)) {
        nextFieldErrors[`${prefix}CustomParentSize`] = 'Nhập đủ ngang và cao cho khổ giấy tùy chọn.';
      }
      if (pSizeIdx === PARENT_PAPER_SIZES.length + 1) {
        if (!rollW || safeParseNumber(rollW) <= 0) nextFieldErrors[`${prefix}ParentSize`] = 'Loại giấy/định lượng này chưa có khổ lô hợp lệ.';
        if (safeParseNumber(rollCutL) <= 0) nextFieldErrors[`${prefix}RollCutLength`] = 'Nhập chiều dài xả lớn hơn 0.';
      }
      if (validPrintersList.length === 0 || !printer) {
        nextFieldErrors[`${prefix}Printer`] = 'Không có máy in phù hợp với khổ giấy hiện tại.';
      }
    };

    validatePaperSection('cover', coverPaperType, coverPaperGsm, coverParentSizeIdx, coverCustomParentW, coverCustomParentH, coverRollWidth, coverRollCutLength, validCoverPrinters, coverPrinter);
    if (!isCombinedPrint) {
      validatePaperSection('inner', innerPaperType, innerPaperGsm, innerParentSizeIdx, innerCustomParentW, innerCustomParentH, innerRollWidth, innerRollCutLength, validInnerPrinters, innerPrinter);
    }

    if (Object.keys(nextFieldErrors).length > 0) {
      applyValidationErrors(nextFieldErrors, 'Vui lòng kiểm tra các trường đang được đánh dấu đỏ.');
      return;
    }

    let pW, pH;
    if (productTypeIdx === PRODUCT_SIZES.length - 1) {
      pW = safeParseNumber(customW);
      pH = safeParseNumber(customH);
    } else {
      const sizeObj = isKhoThieu && KHO_THIEU_SIZES[productTypeIdx] ? KHO_THIEU_SIZES[productTypeIdx] : PRODUCT_SIZES[productTypeIdx];
      pW = sizeObj?.w || 21;
      pH = sizeObj?.h || 29.7;
    }
    
    let prodW = orientation === 'doc' ? Math.min(pW, pH) : Math.max(pW, pH);
    let prodH = orientation === 'doc' ? Math.max(pW, pH) : Math.min(pW, pH);

    const getPaperSize = (idx, customPw, customPh, rollW, rollSplit, rollCutL) => {
      if (idx === '') return null;
      if (idx === PARENT_PAPER_SIZES.length) return { w: safeParseNumber(customPw), h: safeParseNumber(customPh) };
      if (idx === PARENT_PAPER_SIZES.length + 1) return { w: safeParseNumber(rollW) / rollSplit, h: safeParseNumber(rollCutL) };
      return PARENT_PAPER_SIZES[idx];
    };

    let coverSize = getPaperSize(coverParentSizeIdx, coverCustomParentW, coverCustomParentH, coverRollWidth, coverRollSplit, coverRollCutLength);
    let innerSize = getPaperSize(innerParentSizeIdx, innerCustomParentW, innerCustomParentH, innerRollWidth, innerRollSplit, innerRollCutLength);

    if (isCombinedPrint && !coverSize) {
      applyValidationErrors({ coverParentSize: 'Chọn khổ giấy in.' }, 'Vui lòng chọn khổ giấy in.');
      return;
    }
    if (!isCombinedPrint && (!coverSize || !innerSize)) {
      applyValidationErrors(
        {
          ...(!coverSize ? { coverParentSize: 'Chọn khổ giấy in cho Bìa.' } : {}),
          ...(!innerSize ? { innerParentSize: 'Chọn khổ giấy in cho Ruột.' } : {}),
        },
        'Vui lòng chọn khổ giấy in cho cả Bìa và Ruột.',
      );
      return;
    }

    const formatParent = (size) => {
      return { w: Math.max(size.w, size.h), h: Math.min(size.w, size.h) };
    };

    if (coverSize) coverSize = formatParent(coverSize);
    if (innerSize) innerSize = formatParent(innerSize);

    let signatures = [];
    const GAP = DEFAULT_GAP_CM;
    const GRIPPER = DEFAULT_GRIPPER_CM;
    const qtyInt = parseInt(quantity) || 0;
    
    const spreadW = prodW * 2;
    const spreadH = prodH;
    
    const processSignatures = (totalP, pSize, prefixName, isCoverOnly, pType, pGsm) => {
       const usableW = pSize.w - DEFAULT_GAP_CM; 
       const usableH = pSize.h - GRIPPER - PRINT_MARGIN_CM; 

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
           let spoil = getSpoilageByQuantity(dinhMucDatabase, sheets); 

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

    setFieldErrors({});
    setError('');

    if (isCombinedPrint) {
       const success = processSignatures(parseInt(totalPages), coverSize, 'chung', false, coverPaperType, coverPaperGsm);
       if (!success) {
          applyValidationErrors(
            { productSize: `Kích thước trang (${prodW}x${prodH}) quá lớn.`, coverParentSize: `Khổ giấy in (${coverSize.w}x${coverSize.h}) không đủ.` },
            `Kích thước trang (${prodW}x${prodH}) quá lớn so với khổ giấy in (${coverSize.w}x${coverSize.h}).`,
          );
          return;
       }
    } else {
       const covSuccess = processSignatures(4, coverSize, 'bia', true, coverPaperType, coverPaperGsm);
       const inSuccess = processSignatures(innerPagesCount, innerSize, 'ruot', false, innerPaperType, innerPaperGsm);
       if (!covSuccess || !inSuccess) {
          applyValidationErrors(
            {
              productSize: 'Kích thước trang quá lớn so với khổ giấy in đã chọn.',
              ...(!covSuccess ? { coverParentSize: 'Khổ giấy Bìa không đủ.' } : {}),
              ...(!inSuccess ? { innerParentSize: 'Khổ giấy Ruột không đủ.' } : {}),
            },
            'Kích thước trang quá lớn so với khổ giấy in đã chọn.',
          );
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
      const pricePerKg = safeParseNumber(pricePerTon) * 1000; // Bảng giá giấy đang theo đơn vị tấn, cần quy đổi về kg.
      const sigCostVnd = calculatePaperCost(Pw, Ph, sig.paperGsm, sig.totalSheets, pricePerTon);

      tongTrongLuongKg += totalWeightKg;
      tongSoToIn += sig.totalSheets;

      const isCov = sig.isCover || isCombinedPrint;
      
      const colors = isCov ? coverPrintColors : innerPrintColors;
      const sides = isCov ? coverPrintSides : innerPrintSides;
      const printerId = isCov ? coverPrinter : innerPrinter;
      const printerObj = printerDatabase.find(p => p.id === printerId);
      
      const giaKem = printerObj ? safeParseNumber(printerObj.platePrice) : 0;
      const giaLuotCoBan = printerObj ? safeParseNumber(printerObj.runPrice) : 0;
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

    const xaLoObj = findFinishingByName(finishingDatabase, 'xả lô');
    const minXaLoPrice = xaLoObj ? safeParseNumber(xaLoObj.minPrice) : 150000;

    let tienXaLoBia = 0, tienXaLoRuot = 0;
    if (coverParentSizeIdx === PARENT_PAPER_SIZES.length + 1) tienXaLoBia = minXaLoPrice;
    if (!isCombinedPrint && innerParentSizeIdx === PARENT_PAPER_SIZES.length + 1) tienXaLoRuot = minXaLoPrice;
    const tongTienXaLo = tienXaLoBia + tienXaLoRuot;

    let tienCanBia = 0, tienCanRuot = 0;
    let coverCanDetail = '', innerCanDetail = '';

    if (coverLamination !== 'none' && toCanBia > 0) {
        const canName = coverLamination === 'matte' ? 'cán mờ' : 'cán bóng';
        const canObj = findFinishingByName(finishingDatabase, canName);
        if (canObj) {
            const totalArea = areaBia * toCanBia * coverLaminationSides;
            const cost = totalArea * safeParseNumber(canObj.price);
            tienCanBia = Math.max(cost, safeParseNumber(canObj.minPrice));
            coverCanDetail = `(Bìa: ${toCanBia.toLocaleString('vi-VN')} tờ × ${coverLaminationSides} mặt × ${areaBia.toLocaleString('vi-VN')}cm² × ${canObj.price}đ)`;
        }
    }

    if (!isCombinedPrint && innerLamination !== 'none' && toCanRuot > 0) {
        const canName = innerLamination === 'matte' ? 'cán mờ' : 'cán bóng';
        const canObj = findFinishingByName(finishingDatabase, canName);
        if (canObj) {
            const totalArea = areaRuot * toCanRuot * innerLaminationSides;
            const cost = totalArea * safeParseNumber(canObj.price);
            tienCanRuot = Math.max(cost, safeParseNumber(canObj.minPrice));
            innerCanDetail = `(Ruột: ${toCanRuot.toLocaleString('vi-VN')} tờ × ${innerLaminationSides} mặt × ${areaRuot.toLocaleString('vi-VN')}cm² × ${canObj.price}đ)`;
        }
    }
    
    const tongTienCan = tienCanBia + tienCanRuot;

    // THUẬT TOÁN TIỀN XÉN THÀNH PHẨM (CATALOGUE)
    // Tính tổng số ream giấy sử dụng (chỉ tính giấy ruột hoặc tổng giấy nếu gộp)
    let xenDetail = '';
    let tienXen = 0;
    const xenObj = findFinishingByName(finishingDatabase, 'xén');
    if (xenObj) {
        const reams = tongSoToIn / 500;
        const cost = reams * safeParseNumber(xenObj.price);
        tienXen = Math.max(cost, safeParseNumber(xenObj.minPrice));
        xenDetail = `(${reams.toFixed(1)} ram × ${safeParseNumber(xenObj.price).toLocaleString('vi-VN')}đ)`;
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

    let finishingObj = findFinishingByName(finishingDatabase, bindingNameDb);
    if (!finishingObj && bindingType === 'loxo') {
        finishingObj = findFinishingByName(finishingDatabase, 'Gáy lò xo'); 
    }

    const actualPrice = finishingObj ? safeParseNumber(finishingObj.price) : defaultPrice;
    const actualMin = finishingObj ? safeParseNumber(finishingObj.minPrice) : defaultMin;

    if (calcType === 'page') {
        const cost = actualPrice * totalP * qtyInt;
        tienDongCuon = Math.max(cost, actualMin);
        dongCuonDetail = `(${qtyInt.toLocaleString('vi-VN')} cuốn × ${totalP} trang × ${actualPrice}đ)`;
    } else {
        const cost = actualPrice * qtyInt;
        tienDongCuon = Math.max(cost, actualMin);
        dongCuonDetail = `(${qtyInt.toLocaleString('vi-VN')} cuốn × ${actualPrice.toLocaleString('vi-VN')}đ)`;
    }

    const tienVanChuyen = safeParseNumber(shippingCost);

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
    const paperTypeKey = `${prefix}PaperType`;
    const paperGsmKey = `${prefix}PaperGsm`;
    const parentSizeKey = `${prefix}ParentSize`;
    const customParentSizeKey = `${prefix}CustomParentSize`;
    const rollCutLengthKey = `${prefix}RollCutLength`;
    const printerKey = `${prefix}Printer`;

    return (
      <div className="space-y-4">
        <h3 className="text-sm font-bold text-slate-800 bg-slate-100 p-2 rounded flex justify-between items-center">
          <span>{title}</span>
          {subtitle && <span className="text-xs font-medium text-indigo-600 bg-indigo-100 px-2 py-0.5 rounded">{subtitle}</span>}
        </h3>

        <div className="grid grid-cols-2 gap-3">
          <div ref={fieldRefs[paperTypeKey]} className="space-y-1">
            <label className="text-xs font-medium text-slate-600">Loại giấy *</label>
            <select className={fieldClass('w-full p-2 bg-slate-50 border border-slate-300 rounded outline-none text-sm', paperTypeKey)} value={pType} onChange={(e) => { setPType(e.target.value); setPGsm(''); clearFieldError(paperTypeKey, paperGsmKey, parentSizeKey); }}>
              <option value="" disabled hidden>Chọn loại giấy...</option>
              {availablePaperTypes.map(type => <option key={type} value={type}>{type}</option>)}
            </select>
            {renderFieldError(paperTypeKey)}
          </div>
          <div ref={fieldRefs[paperGsmKey]} className="space-y-1">
            <label className="text-xs font-medium text-slate-600">Định lượng *</label>
            <select className={fieldClass('w-full p-2 bg-slate-50 border border-slate-300 rounded outline-none text-sm', paperGsmKey)} value={pGsm} onChange={(e) => { setPGsm(e.target.value === '' ? '' : Number(e.target.value)); clearFieldError(paperGsmKey, parentSizeKey); }} disabled={!pType}>
              <option value="" disabled hidden>Chọn định lượng...</option>
              {gsmList.map(gsm => <option key={gsm} value={gsm}>{gsm}</option>)}
            </select>
            {renderFieldError(paperGsmKey)}
          </div>
        </div>

        <div ref={fieldRefs[parentSizeKey]} className="space-y-2 pt-2 border-t border-slate-100">
          <label className="text-sm font-medium text-slate-700 flex justify-between">
            <span>Khổ giấy in (Nguyên khổ) *</span>
            {pSizeIdx === PARENT_PAPER_SIZES.length + 1 && reqMax > 0 && (
              <span className="text-xs text-amber-600 font-semibold bg-amber-100 px-2 py-0.5 rounded">
                Khổ xả: {reqMin} x {reqMax} cm
              </span>
            )}
          </label>
          <select className={fieldClass('w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg outline-none text-sm', parentSizeKey)} value={pSizeIdx} onChange={(e) => { setPSizeIdx(e.target.value === '' ? '' : parseInt(e.target.value)); clearFieldError(parentSizeKey, customParentSizeKey, rollCutLengthKey, printerKey); }}>
            <option value="" disabled hidden>Chọn khổ giấy in...</option>
            {PARENT_PAPER_SIZES.map((size, idx) => (<option key={idx} value={idx}>{size.label}</option>))}
            <option value={PARENT_PAPER_SIZES.length}>Tùy chọn...</option>
            <option value={PARENT_PAPER_SIZES.length + 1}>Xả lô (Từ cuộn)...</option>
          </select>
          {renderFieldError(parentSizeKey)}
        </div>

        {pSizeIdx === PARENT_PAPER_SIZES.length && (
          <div ref={fieldRefs[customParentSizeKey]} className={fieldClass('grid grid-cols-2 gap-4 bg-emerald-50 p-2.5 rounded-lg border border-emerald-100', customParentSizeKey)}>
            <div className="space-y-1"><label className="text-xs font-medium text-slate-600">Ngang (cm)</label><input type="number" step="0.1" className={fieldClass('w-full p-2 border border-slate-300 rounded outline-none', customParentSizeKey)} value={customPw} onChange={(e) => { setCustomPw(e.target.value); clearFieldError(customParentSizeKey, parentSizeKey, printerKey); }}/></div>
            <div className="space-y-1"><label className="text-xs font-medium text-slate-600">Cao (cm)</label><input type="number" step="0.1" className={fieldClass('w-full p-2 border border-slate-300 rounded outline-none', customParentSizeKey)} value={customPh} onChange={(e) => { setCustomPh(e.target.value); clearFieldError(customParentSizeKey, parentSizeKey, printerKey); }}/></div>
            {fieldErrors[customParentSizeKey] && <div className="col-span-2">{renderFieldError(customParentSizeKey)}</div>}
          </div>
        )}

        {pSizeIdx === PARENT_PAPER_SIZES.length + 1 && (
          <div className="grid grid-cols-3 gap-3 bg-amber-50 p-2.5 rounded-lg border border-amber-200 shadow-inner mt-1">
            <div className="space-y-1">
              <label className="text-xs font-bold text-amber-800">Khổ lô (cm)</label>
              {availRolls.length > 0 ? (
                <select className="w-full p-2 bg-white border border-amber-300 rounded outline-none text-sm font-semibold text-amber-900" value={rWidth} onChange={(e) => { setRWidth(e.target.value); clearFieldError(parentSizeKey, printerKey); }}>
                  {availRolls.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              ) : (
                <input type="text" className="w-full p-2 border border-amber-200 rounded outline-none text-sm text-slate-400 bg-amber-100" value="Không có lô" disabled />
              )}
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-amber-800">Chia lô</label>
              <select className="w-full p-2 bg-white border border-amber-300 rounded outline-none text-sm" value={rSplit} onChange={(e) => { setRSplit(Number(e.target.value)); clearFieldError(parentSizeKey, printerKey); }}>
                {[1, 2, 3].map(v => <option key={v} value={v}>Chia {v}</option>)}
              </select>
            </div>
            <div ref={fieldRefs[rollCutLengthKey]} className="space-y-1">
              <label className="text-xs font-bold text-amber-800">Chiều dài xả</label>
              <input type="number" step="0.1" className={fieldClass('w-full p-2 border border-amber-300 rounded outline-none text-sm', rollCutLengthKey)} placeholder="VD: 30" value={rCutL} onChange={(e) => { setRCutL(e.target.value); clearFieldError(rollCutLengthKey, parentSizeKey, printerKey); }}/>
              {renderFieldError(rollCutLengthKey)}
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
          <div ref={fieldRefs[printerKey]} className="space-y-1">
            <label className="text-xs font-medium text-slate-600">Chọn máy in</label>
            <select 
              className={fieldClass(`w-full p-2 bg-slate-50 border rounded outline-none text-sm font-medium ${validPrintersList.length === 0 ? 'border-red-300 text-red-600' : 'border-slate-300 text-blue-700'}`, printerKey)} 
              value={printer} 
              onChange={(e) => { setPrinter(e.target.value); clearFieldError(printerKey); }}
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
            {renderFieldError(printerKey)}
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
            <div ref={quantityRef} className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Số lượng cuốn *</label>
              <input type="number" className={fieldClass('w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-semibold text-blue-700', 'quantity')} placeholder="VD: 500" value={quantity} onChange={(e) => { setQuantity(e.target.value); clearFieldError('quantity'); }} />
              {renderFieldError('quantity')}
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Quy cách đóng cuốn</label>
              <select className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg outline-none font-medium text-slate-700" value={bindingType} onChange={(e) => setBindingType(e.target.value)}>
                {BINDING_TYPES.map(b => <option key={b.id} value={b.id}>{b.label}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div ref={productSizeRef} className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Khổ thành phẩm (Khi gập) *</label>
              <select className={fieldClass('w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg outline-none', 'productSize')} value={productTypeIdx} onChange={(e) => { setProductTypeIdx(e.target.value === '' ? '' : parseInt(e.target.value)); clearFieldError('productSize', 'customProductSize'); }}>
                <option value="" disabled hidden>Chọn khổ...</option>
                {PRODUCT_SIZES.map((size, idx) => {
                  let label = size.label; if (isKhoThieu && KHO_THIEU_SIZES[idx]) label = KHO_THIEU_SIZES[idx].label;
                  return <option key={idx} value={idx}>{label}</option>
                })}
              </select>
              {renderFieldError('productSize')}
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
            <div ref={totalPagesRef} className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Tổng số trang (Bìa + Ruột) *</label>
              <input type="number" className={fieldClass(`w-full p-2.5 bg-slate-50 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-semibold ${totalPages && !isPagesValid ? 'border-red-400 text-red-600' : 'border-slate-300 text-slate-800'}`, 'totalPages')} placeholder="Bội số của 4 (VD: 16, 24...)" value={totalPages} onChange={(e) => { setTotalPages(e.target.value); clearFieldError('totalPages'); }} />
              {totalPages && !isPagesValid && <p className="text-xs text-red-500 mt-1">Số trang phải chia hết cho 4.</p>}
              {renderFieldError('totalPages')}
            </div>
          </div>

          {productTypeIdx === PRODUCT_SIZES.length - 1 && (
            <div ref={customProductSizeRef} className={fieldClass('grid grid-cols-2 gap-4 bg-blue-50 p-3 rounded-lg border border-blue-100', 'customProductSize')}>
              <div className="space-y-1"><label className="text-xs font-medium text-slate-600">Ngang (cm)</label><input type="number" step="0.1" className={fieldClass('w-full p-2 border border-slate-300 rounded outline-none', 'customProductSize')} value={customW} onChange={(e) => { setCustomW(e.target.value); clearFieldError('customProductSize', 'productSize'); }}/></div>
              <div className="space-y-1"><label className="text-xs font-medium text-slate-600">Cao (cm)</label><input type="number" step="0.1" className={fieldClass('w-full p-2 border border-slate-300 rounded outline-none', 'customProductSize')} value={customH} onChange={(e) => { setCustomH(e.target.value); clearFieldError('customProductSize', 'productSize'); }}/></div>
              {fieldErrors.customProductSize && <div className="col-span-2">{renderFieldError('customProductSize')}</div>}
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
          <div className="sticky top-0 z-20 bg-red-50 border border-red-200 text-red-700 p-6 rounded-2xl flex items-center space-x-3 shrink-0 shadow-sm"><AlertCircle size={24} /><span className="font-medium">{error}</span></div>
        ) : result ? (
          <>
            <QuoteSaveForm
              editingQuote={activeEditingQuote}
              onFinishEditing={onFinishEditing}
              quote={{
                productCategory: 'Catalogue',
                productName,
                totalAmount: Math.round(result.costs.giaBan),
                specifications: {
                  quantity,
                  productSize: getCurrentProductSizeLabel(),
                  isKhoThieu,
                  orientation,
                  totalPages,
                  bindingType,
                  isCombinedPrint,
                  shippingCost,
                  cover: {
                    paperType: coverPaperType,
                    paperGsm: coverPaperGsm,
                    printColors: coverPrintColors,
                    printSides: coverPrintSides,
                    lamination: coverLamination,
                    laminationSides: coverLaminationSides,
                    foil: coverFoil,
                  },
                  inner: isCombinedPrint ? null : {
                    paperType: innerPaperType,
                    paperGsm: innerPaperGsm,
                    printColors: innerPrintColors,
                    printSides: innerPrintSides,
                    lamination: innerLamination,
                    laminationSides: innerLaminationSides,
                  },
                  markup,
                  result,
                },
              }}
            />

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


export default CatalogueCalculator;
