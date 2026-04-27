import React, { useEffect, useMemo, useState } from 'react';
import { AlertCircle, Box, Maximize, Printer, RefreshCw, ShoppingBag, X, ZoomIn } from 'lucide-react';
import { LAMINATION_TYPES, MARKUP_RATES, PARENT_PAPER_SIZES } from '../constants/pricingConstants';
import { Box3DViewer } from '../components/viewers/HopMemViewers';
import { computeTuiGiayKhuonUnit, TuiGiayFlatLayoutViewer, TuiGiayImpositionViewer } from '../components/viewers/TuiGiayViewers';
import { usePricingDataContext } from '../context/PricingDataContext';
import { findFinishingByName } from '../utils/finishingUtils';
import { safeParseNumber } from '../utils/numberUtils';

/** Fallback nếu dòng Sheet GiaCong không có minPrice */
const GIA_CONG_TUI_MIN_ORDER_FALLBACK_VND = 300_000;

/**
 * Tra `finishingDatabase` (Sheet GiaCong → API `finishing`): hạng mục dạng
 * "Túi 1 mảnh có cạnh <=10" … (Hông Y trong app = "cạnh" trên sheet).
 */
function findTuiGiayGiaCongFinishingRow(finishingDatabase, soManh, hongYcm) {
  const y = safeParseNumber(String(hongYcm));
  const rows = finishingDatabase || [];
  const pieceRe = soManh === '1_manh' ? /\b1\s*mảnh\b/i : /\b2\s*mảnh\b/i;
  const bagRows = rows.filter((r) => {
    const it = String(r.item || '');
    return pieceRe.test(it) && (/túi/i.test(it) || /cạnh/i.test(it));
  });

  const itLower = (r) => String(r.item || '').toLowerCase();
  let bandTest;
  let bandHint;
  if (y <= 10) {
    bandTest = (it) => /<=\s*10\b|≤\s*10\b/.test(it);
    bandHint = 'Hông (Y) ≤ 10';
  } else if (y <= 14) {
    bandTest = (it) => /<=\s*14\b|≤\s*14\b/.test(it);
    bandHint = 'Hông (Y) ≤ 14';
  } else if (y <= 17) {
    bandTest = (it) => /<=\s*17\b|≤\s*17\b/.test(it);
    bandHint = 'Hông (Y) ≤ 17';
  } else {
    bandTest = (it) => />\s*17\b|≥\s*17\b|>=\s*17\b/.test(it);
    bandHint = 'Hông (Y) > 17';
  }

  const row = bagRows.find((r) => bandTest(itLower(r)));
  return row ? { row, bandHint } : null;
}

/**
 * Đơn giá gia công túi (VNĐ/chiếc): đơn giá + tối thiểu đơn hàng lấy từ Sheet GiaCong (`finishing`);
/**
 * Phân loại thể tích túi theo công thức AppSheet:
 * ≤3900 → "nhỏ"; ≤6820 → "trung bình"; >6820 → "to"
 */
function classifyTuiVolume(x, y, z) {
  const vol = safeParseNumber(String(x)) * safeParseNumber(String(y)) * safeParseNumber(String(z));
  if (vol <= 3900) return { size: 'nhỏ', vol };
  if (vol <= 6820) return { size: 'trung bình', vol };
  return { size: 'to', vol };
}

/**
 * Tra `finishingDatabase` (Sheet GiaCong) để lấy giá khuôn bế túi.
 * Hạng mục dạng: "Khuôn bế túi 1/2 mảnh nhỏ/trung bình/to"
 */
function findTuiGiayKhuonBeRow(finishingDatabase, soManh, sizeLabel) {
  const pieceText = soManh === '1_manh' ? '1 mảnh' : '2 mảnh';
  const rows = finishingDatabase || [];
  return rows.find((r) => {
    const it = String(r.item || '').toLowerCase();
    return (
      it.includes('khuôn bế') &&
      it.includes('túi') &&
      it.includes(pieceText.toLowerCase()) &&
      it.includes(sizeLabel.toLowerCase())
    );
  }) || null;
}

/**
 * +500 nếu loại giấy Kraft (bất kỳ định lượng); +500 nếu quai Dây dù đẹp / Dây lụa.
 */
function computeTuiGiayGiaCongUnit({ soManh, hongYcm, paperType, quai, finishingDatabase }) {
  const y = safeParseNumber(String(hongYcm));
  const matched = findTuiGiayGiaCongFinishingRow(finishingDatabase, soManh, hongYcm);
  const base = matched ? safeParseNumber(matched.row.price) : 0;
  const minOrder = matched
    ? (safeParseNumber(matched.row.minPrice) || GIA_CONG_TUI_MIN_ORDER_FALLBACK_VND)
    : GIA_CONG_TUI_MIN_ORDER_FALLBACK_VND;
  const tierLabel = matched
    ? `GiaCong: «${String(matched.row.item || '').trim()}» (${matched.bandHint})`
    : 'Không tìm thấy dòng GiaCong túi (cần hạng mục dạng «Túi 1/2 mảnh có cạnh ≤…/ >…» trên Sheet GiaCong)';

  const isKraftPaper = typeof paperType === 'string' && paperType.trim().toLowerCase().startsWith('kraft');
  const quaiPremium = quai === 'day_du_dep' || quai === 'day_lua';
  let surcharges = 0;
  if (isKraftPaper) surcharges += 500;
  if (quaiPremium) surcharges += 500;
  const donGia = base + surcharges;

  return {
    baseDonGia: base,
    surcharges,
    donGia,
    minOrder,
    tierLabel,
    isKraftPaper,
    quaiPremium,
    sheetRowMatched: Boolean(matched),
  };
}

function TuiGiayCalculator() {
  const {
    paperDatabase,
    printerDatabase,
    finishingDatabase,
    dinhMucDatabase,
    isLoadingPrices,
    fetchPaperPrices,
  } = usePricingDataContext();
  // --- STATES THÔNG TIN CHUNG ---
  const [productName, setProductName] = useState('Túi giấy');
  const [quantity, setQuantity] = useState('1000');
  const [boxWidth, setBoxWidth] = useState('20'); // Ngang
  const [boxDepth, setBoxDepth] = useState('10'); // Hông
  const [boxHeight, setBoxHeight] = useState('30'); // Cao
  const [gapMiec, setGapMiec] = useState('4');
  const [taiDanStr, setTaiDanStr] = useState('2');
  const [matTui, setMatTui] = useState('giong_nhau');
  const [soManh, setSoManh] = useState('1_manh');
  const [quai, setQuai] = useState('day_du_thuong');

  // --- STATES GIẤY & BÌNH BẢN ---
  const [paperType, setPaperType] = useState('Ivory');
  const [paperGsm, setPaperGsm] = useState('');
  const [parentSizeIdx, setParentSizeIdx] = useState('');
  const [customParentW, setCustomParentW] = useState('');
  const [customParentH, setCustomParentH] = useState('');
  const [rollWidth, setRollWidth] = useState('');
  const [rollSplit, setRollSplit] = useState(1);
  const [rollCutLength, setRollCutLength] = useState('');
  const cols = 1; // Cố định 1 bát/tờ (túi giấy kích thước lớn, không xếp nhiều bát)
  const rows = 1;
  const [muonNhip, setMuonNhip] = useState(false);

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
  const [isZoomModalOpen, setIsZoomModalOpen] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  // --- DERIVED DATA ---
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

  useEffect(() => {
    if (paperType.startsWith('Kraft')) setGapMiec('0');
    else setGapMiec('4');
  }, [paperType]);

  // Nhíp (gripper) offset = 1 cm; vùng in an toàn margin = 0.3 cm mỗi cạnh
  const GRIPPER_CM = 1.0;
  const SAFE_MARGIN_CM = 0.3;

  // Kích thước cụm khuôn = kích thước 1 bát (khuôn bế 1 mảnh)
  // 1_manh: fullW × pieceH  |  2_manh: pieceW × pieceH (dùng chung khuôn cho 2 mảnh)
  const cumKhuonSize = useMemo(() => {
    const X = safeParseNumber(boxWidth);
    const Y = safeParseNumber(boxDepth);
    const Z = safeParseNumber(boxHeight);
    if (X <= 0 || Y <= 0 || Z <= 0) return { w: 0, h: 0 };
    const spec = computeTuiGiayKhuonUnit(X, Y, Z, safeParseNumber(taiDanStr), safeParseNumber(gapMiec), soManh);
    const w = spec.mode === '2_manh' ? spec.pieceW : spec.singleW;
    const h = spec.pieceH;
    return { w, h };
  }, [boxWidth, boxDepth, boxHeight, gapMiec, taiDanStr, soManh]);


  // Ghi nhận khổ giấy in hiện tại (dùng để truyền xuống preview bản vẽ thời gian thực)
  const currentPaperSize = useMemo(() => {
    let Pw = 0, Ph = 0;
    if (parentSizeIdx === PARENT_PAPER_SIZES.length) {
      Pw = parseFloat(customParentW) || 0;
      Ph = parseFloat(customParentH) || 0;
    } else if (parentSizeIdx === PARENT_PAPER_SIZES.length + 1) {
      Pw = (parseFloat(rollWidth) || 0) / rollSplit;
      Ph = parseFloat(rollCutLength) || 0;
    } else if (parentSizeIdx !== '') {
      Pw = PARENT_PAPER_SIZES[parentSizeIdx]?.w || 0;
      Ph = PARENT_PAPER_SIZES[parentSizeIdx]?.h || 0;
    }
    return { w: Pw, h: Ph };
  }, [parentSizeIdx, customParentW, customParentH, rollWidth, rollSplit, rollCutLength]);

  // Helper: parse kích thước máy in từ tên (vd. "65x86" → { maxW:86, maxH:65 })
  const parsePrinterMaxSize = (name = '') => {
    const m = String(name).match(/(\d+(?:\.\d+)?)\s*[xX×]\s*(\d+(?:\.\d+)?)/);
    if (!m) return null;
    const a = parseFloat(m[1]), b = parseFloat(m[2]);
    return { maxW: Math.max(a, b), maxH: Math.min(a, b) };
  };

  // Khổ giấy hợp lệ = vùng in an toàn chứa được cụm khuôn (sau nhíp + margin)
  const validPaperSizeSet = useMemo(() => {
    const valid = new Set();
    if (cumKhuonSize.w <= 0 || cumKhuonSize.h <= 0) {
      PARENT_PAPER_SIZES.forEach((_, idx) => valid.add(idx));
      return valid;
    }
    const reqMax = Math.max(cumKhuonSize.w, cumKhuonSize.h);
    const reqMin = Math.min(cumKhuonSize.w, cumKhuonSize.h);
    PARENT_PAPER_SIZES.forEach((size, idx) => {
      const pMax = Math.max(size.w, size.h);
      const pMin = Math.min(size.w, size.h);
      const safeMax = pMax - SAFE_MARGIN_CM * 2;
      const safeMin = pMin - SAFE_MARGIN_CM * 2 - (muonNhip ? 0 : GRIPPER_CM);
      if (reqMax <= safeMax && reqMin <= safeMin) valid.add(idx);
    });
    return valid;
  }, [cumKhuonSize, muonNhip]);

  // Reset khổ giấy nếu loại đang chọn không còn hợp lệ (chỉ với khổ chuẩn)
  useEffect(() => {
    if (typeof parentSizeIdx === 'number' && parentSizeIdx < PARENT_PAPER_SIZES.length) {
      if (!validPaperSizeSet.has(parentSizeIdx)) setParentSizeIdx('');
    }
  }, [validPaperSizeSet, parentSizeIdx]);

  // Máy in hợp lệ = max paper ≥ khổ giấy đang chọn
  const validPrinters = useMemo(() => {
    if (!printerDatabase || printerDatabase.length === 0) return [];
    const { w: pW, h: pH } = currentPaperSize;
    if (pW <= 0 || pH <= 0) return printerDatabase;
    const pMax = Math.max(pW, pH), pMin = Math.min(pW, pH);
    return printerDatabase.filter(p => {
      const sz = parsePrinterMaxSize(p.name);
      if (!sz) return true; // không parse được → giữ lại
      return sz.maxW >= pMax && sz.maxH >= pMin;
    });
  }, [printerDatabase, currentPaperSize]);

  // Reset máy in nếu không còn hợp lệ với khổ giấy mới
  useEffect(() => {
    if (selectedPrinter && validPrinters.length > 0) {
      if (!validPrinters.find(p => p.id === selectedPrinter)) setSelectedPrinter('');
    }
  }, [validPrinters, selectedPrinter]);

  // Logic kiểm tra đã nhập đủ 3 chiều kích thước chưa
  const hasValidDimensions = parseFloat(boxWidth) > 0 && parseFloat(boxDepth) > 0 && parseFloat(boxHeight) > 0;

  const handleCalculate = () => {
    if (!boxWidth || !boxDepth || !boxHeight || !quantity || !paperType || !paperGsm || parentSizeIdx === '' || !selectedPrinter) {
      setError('Vui lòng điền đầy đủ thông tin kích thước, số lượng, giấy và máy in.');
      setResult(null);
      setIsCalculated(false);
      return;
    }

    const qty = parseInt(quantity);
    if (isNaN(qty) || qty <= 0) {
      setError('Số lượng không hợp lệ.');
      setResult(null);
      setIsCalculated(false);
      return;
    }

    let Pw = 0, Ph = 0;
    if (parentSizeIdx === PARENT_PAPER_SIZES.length) {
      Pw = parseFloat(customParentW) || 0;
      Ph = parseFloat(customParentH) || 0;
    } else if (parentSizeIdx === PARENT_PAPER_SIZES.length + 1) {
      Pw = (parseFloat(rollWidth) || 0) / rollSplit;
      Ph = parseFloat(rollCutLength) || 0;
    } else {
      Pw = PARENT_PAPER_SIZES[parentSizeIdx]?.w || 0;
      Ph = PARENT_PAPER_SIZES[parentSizeIdx]?.h || 0;
    }

    const reqMax = Math.max(cumKhuonSize.w, cumKhuonSize.h);
    const reqMin = Math.min(cumKhuonSize.w, cumKhuonSize.h);
    const pMax = Math.max(Pw, Ph);
    const pMin = Math.min(Pw, Ph);
    // Vùng in an toàn: trừ margin 2 cạnh + nhíp (trừ khi mượn nhíp)
    const safeMax = pMax - SAFE_MARGIN_CM * 2;
    const safeMin = pMin - SAFE_MARGIN_CM * 2 - (muonNhip ? 0 : GRIPPER_CM);

    if (reqMax > safeMax || reqMin > safeMin) {
      const why = reqMax > safeMax
        ? `chiều dài khuôn (${reqMax.toFixed(1)} cm) vượt chiều dài an toàn tờ (${safeMax.toFixed(1)} cm)`
        : `chiều rộng khuôn (${reqMin.toFixed(1)} cm) vượt chiều rộng an toàn tờ (${safeMin.toFixed(1)} cm${!muonNhip ? ', đã trừ nhíp 1 cm' : ''})`;
      setError(`Khuôn không vừa vùng in an toàn: ${why}. Chọn khổ giấy lớn hơn hoặc bật Mượn nhíp.`);
      setResult(null);
      setIsCalculated(false);
      return;
    }

    setError('');

    const itemsPerSheet = 1; // 1 bát/tờ cố định
    // 2_manh: mỗi túi cần 2 tờ in (mỗi tờ 1 mảnh); 1_manh: 1 tờ/túi
    const piecesPerBag = soManh === '2_manh' ? 2 : 1;
    // Số tờ lý thuyết cho 1 bài in (1 mảnh hoặc toàn túi 1 mảnh)
    const soToInMotBai = Math.ceil(qty / itemsPerSheet);
    // Số tờ lý thuyết tổng cộng (nhân piecesPerBag vì mỗi bài in = 1 mảnh)
    const soToInLyThuyet = soToInMotBai * piecesPerBag;

    // Bù hao tra theo số tờ MỘT bài in (soToInMotBai), rồi nhân số bài in
    // 2_manh + khac_nhau: 2 bài in độc lập → bù hao × 2 (mỗi bài có bù hao riêng)
    // 2_manh + giong_nhau: cùng bản in → bù hao × 1 (bù hao đã được nhân qua soToInLyThuyet)
    const sooBaiIn = (soManh === '2_manh' && matTui === 'khac_nhau') ? 2 : 1;
    let buHaoMotBai = 100; // Giá trị mặc định
    if (dinhMucDatabase && dinhMucDatabase.length > 0) {
      const printSpoilageRules = dinhMucDatabase.filter(d => d.category === 'In');
      for (let i = 0; i < printSpoilageRules.length; i++) {
        const rule = printSpoilageRules[i];
        const fromQ = parseInt(rule.fromQty) || 0;
        const toQ = parseInt(rule.toQty) || 0;
        const spoilVal = parseInt(rule.spoilage) || 0;
        if (soToInMotBai >= fromQ && soToInMotBai <= toQ) {
          buHaoMotBai = spoilVal;
          break;
        }
      }
    }
    const dynamicSpoilage = buHaoMotBai * sooBaiIn;
    const parentSheetsNeeded = soToInLyThuyet + dynamicSpoilage;

    // 1. Tiền giấy
    const pricePerTon = paperDatabase[paperType] && paperDatabase[paperType][paperGsm] ? paperDatabase[paperType][paperGsm].price : 0; 
    const areaM2 = (Pw * Ph) / 10000;
    const weightPerSheetKg = (areaM2 * paperGsm) / 1000;
    const totalWeightKg = weightPerSheetKg * parentSheetsNeeded;
    const pricePerKg = pricePerTon * 1000; // Bảng giá giấy đang theo đơn vị tấn, cần quy đổi về kg.
    const tienGiay = totalWeightKg * pricePerKg;

    // Tiền xả lô
    let tienXaLo = 0;
    if (parentSizeIdx === PARENT_PAPER_SIZES.length + 1) {
      const xaLoObj = findFinishingByName(finishingDatabase, 'xả lô');
      tienXaLo = xaLoObj ? parseFloat(xaLoObj.minPrice) : 150000;
    }

    // 2. Tiền kẽm & In
    // khac_nhau: 2 bài in riêng → kẽm × 2, công in tính từng bài rồi × 2
    const soKem = printColors;
    const selectedPrinterObj = printerDatabase.find(p => p.id === selectedPrinter);
    const giaKem = selectedPrinterObj ? parseFloat(selectedPrinterObj.platePrice) || 0 : 0;
    const tienKem = sooBaiIn * soKem * giaKem;

    // soLuotInMoiKem: số tờ của 1 bài in (khac_nhau = qty; các TH khác = soToInLyThuyet)
    const soLuotInMoiKem = sooBaiIn === 2 ? soToInMotBai : soToInLyThuyet;
    const quaLuotMoiKem = Math.max(0, soLuotInMoiKem - 1000);
    const giaLuotCoBan = selectedPrinterObj ? parseFloat(selectedPrinterObj.runPrice) || 0 : 0;
    const giaLuot = printColors === 1 ? giaLuotCoBan + 10 : giaLuotCoBan;
    const tienIn = sooBaiIn * quaLuotMoiKem * soKem * giaLuot;

    // 3. Tiền cán màng
    const haoIn = 30;
    const haoCan = 20;
    let tienCan = 0;
    let canDetail = '';
    if (lamination !== 'none') {
      const canName = lamination === 'matte' ? 'cán mờ' : 'cán bóng';
      const canObj = findFinishingByName(finishingDatabase, canName);
      if (canObj) {
        const toCan = Math.max(0, parentSheetsNeeded - haoIn - haoCan);
        const areaCm2 = Pw * Ph;
        const laminationSides = 1; // Túi giấy: tạm cán 1 mặt (Mặt túi sẽ nối sau)
        const cost = areaCm2 * toCan * laminationSides * parseFloat(canObj.price);
        tienCan = Math.max(cost, parseFloat(canObj.minPrice));
        canDetail = `(${toCan.toLocaleString('vi-VN')} tờ × ${laminationSides} mặt × ${areaCm2.toLocaleString('vi-VN')}cm² × ${canObj.price}đ)`;
      }
    }

    // 4. Tiền gia công (bảng Sheet Gia công túi theo Hông Y + số mảnh; tối thiểu / đơn hàng)
    const giaCongUnit = computeTuiGiayGiaCongUnit({
      soManh,
      hongYcm: boxDepth,
      paperType,
      quai,
      finishingDatabase,
    });
    const giaCongDonGia = giaCongUnit.donGia;
    const tienGiaCongTinhTheoSL = qty * giaCongDonGia;
    const tienGiaCong = Math.max(tienGiaCongTinhTheoSL, giaCongUnit.minOrder);
    const isMinGiaCongApplied = tienGiaCongTinhTheoSL < giaCongUnit.minOrder;
    const phuPhiBits = [];
    if (giaCongUnit.isKraftPaper) phuPhiBits.push('+500đ giấy Kraft');
    if (giaCongUnit.quaiPremium) phuPhiBits.push('+500đ quai (Dây đẹp/Lụa)');
    const phuPhiText = phuPhiBits.length ? `; ${phuPhiBits.join('; ')}` : '';
    const giaCongDetail = isMinGiaCongApplied
      ? `(${qty.toLocaleString('vi-VN')} chiếc × ${Math.round(giaCongDonGia).toLocaleString('vi-VN')}đ; ${giaCongUnit.tierLabel}${phuPhiText}; áp tối thiểu đơn hàng ${giaCongUnit.minOrder.toLocaleString('vi-VN')}đ)`
      : `(${qty.toLocaleString('vi-VN')} chiếc × ${Math.round(giaCongDonGia).toLocaleString('vi-VN')}đ; ${giaCongUnit.tierLabel}${phuPhiText})`;

    // 5. Tiền khuôn bế (tra Sheet GiaCong theo thể tích X×Y×Z + số mảnh)
    const { size: khuonSizeLabel, vol: khuonVol } = classifyTuiVolume(boxWidth, boxDepth, boxHeight);
    const khuonBeRow = findTuiGiayKhuonBeRow(finishingDatabase, soManh, khuonSizeLabel);
    const tienKhuonBe = khuonBeRow ? safeParseNumber(khuonBeRow.price) : 0;
    const khuonBeDetail = khuonBeRow
      ? `(${khuonBeRow.item}; V=${Math.round(khuonVol).toLocaleString('vi-VN')} cm³ → ${khuonSizeLabel})`
      : `(Không tìm thấy dòng khuôn bế túi trên Sheet GiaCong; V=${Math.round(khuonVol).toLocaleString('vi-VN')} cm³ → ${khuonSizeLabel})`;

    // 6. Tiền vận chuyển
    const tienVanChuyen = parseFloat(shippingCost) || 0; 

    const giaSanXuat = tienGiay + tienXaLo + tienKem + tienIn + tienCan + tienGiaCong + tienKhuonBe + tienVanChuyen;
    const giaBan = giaSanXuat * markup;
    const donGiaSP = giaBan / qty;

    setResult({
      itemsPerSheet, piecesPerBag, sheetsNeeded: parentSheetsNeeded, dynamicSpoilage,
      totalWeightKg, pricePerKg,
      matTui, soManh, quai,
      costs: {
        tienGiay, tienXaLo, tienKem, tienIn, tienCan, tienGiaCong, tienKhuonBe, tienVanChuyen,
        giaSanXuat, giaBan, donGiaSP, markup,
        soKem, giaKem, quaLuotMoiKem, giaLuot, sooBaiIn, canDetail, giaCongDetail, khuonBeDetail
      }
    });

    setIsCalculated(true);
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 xl:h-full min-h-0">
      {/* KHU VỰC TRÁI: FORM NHẬP LIỆU */}
      <div className="xl:col-span-3 bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-6 xl:overflow-y-auto custom-scrollbar xl:h-full">
        <h2 className="text-lg font-semibold flex items-center space-x-2 border-b pb-3 shrink-0">
          <ShoppingBag size={20} className="text-orange-500"/>
          <span>Thông số Túi giấy</span>
        </h2>

        {/* 1. THÔNG TIN CHUNG */}
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-slate-800 bg-slate-100 p-2 rounded">1. Thông tin chung</h3>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Tên sản phẩm</label>
            <input type="text" className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none" value={productName} onChange={(e) => setProductName(e.target.value)} />
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

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Số lượng túi *</label>
            <input type="number" className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none font-semibold text-orange-700" value={quantity} onChange={(e) => setQuantity(e.target.value)} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-600">Gấp miệng (cm)</label>
              <input type="number" step="0.1" className="w-full p-2 bg-slate-50 border border-slate-300 rounded outline-none text-sm" value={gapMiec} onChange={(e) => setGapMiec(e.target.value)} />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-600">Tai dán (cm)</label>
              <input type="number" step="0.1" className="w-full p-2 bg-slate-50 border border-slate-300 rounded outline-none text-sm" value={taiDanStr} onChange={(e) => setTaiDanStr(e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-600">Mặt túi *</label>
              <select className="w-full p-2 bg-slate-50 border border-slate-300 rounded outline-none text-sm" value={matTui} onChange={(e) => setMatTui(e.target.value)}>
                <option value="giong_nhau">Giống nhau</option>
                <option value="khac_nhau">Khác nhau</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-600">Số mảnh</label>
              <select className="w-full p-2 bg-slate-50 border border-slate-300 rounded outline-none text-sm" value={soManh} onChange={(e) => setSoManh(e.target.value)}>
                <option value="1_manh">1 mảnh</option>
                <option value="2_manh">2 mảnh</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-600">Quai</label>
              <select className="w-full p-2 bg-slate-50 border border-slate-300 rounded outline-none text-sm" value={quai} onChange={(e) => setQuai(e.target.value)}>
                <option value="day_du_thuong">Dây dù thường</option>
                <option value="day_du_dep">Dây dù đẹp</option>
                <option value="day_lua">Dây lụa</option>
                <option value="quai_giay">Quai giấy</option>
              </select>
            </div>
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


          <div className="space-y-1 pt-2">
            <label className="text-xs font-bold text-orange-800">Số đo cụm khuôn (cm)</label>
            <div className="w-full p-2.5 bg-orange-100 border border-orange-200 rounded-lg text-sm font-bold text-orange-900 text-center shadow-inner">
              {cumKhuonSize.w > 0 && cumKhuonSize.h > 0 
                ? `${cumKhuonSize.w.toFixed(2)} x ${cumKhuonSize.h.toFixed(2)}` 
                : 'Chưa có dữ liệu'}
            </div>
          </div>
          


          {/* CHỌN KHỔ GIẤY IN */}
          <div className="space-y-2 pt-1 border-t border-slate-100">
            <label className="text-sm font-medium text-slate-700 flex justify-between items-center">
              <span>Khổ giấy in (Nguyên khổ) *</span>
              {parentSizeIdx === PARENT_PAPER_SIZES.length + 1 && (
                <span className="text-xs text-amber-600 font-semibold bg-amber-100 px-2 py-0.5 rounded border border-amber-200">
                  Khổ xả: {(parseFloat(rollWidth) || 0) / rollSplit} x {parseFloat(rollCutLength) || 0} cm
                </span>
              )}
            </label>
            <select className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none text-sm" value={parentSizeIdx} onChange={(e) => setParentSizeIdx(e.target.value === '' ? '' : parseInt(e.target.value))}>
              <option value="" disabled hidden>Chọn khổ giấy in...</option>
              {PARENT_PAPER_SIZES.map((size, idx) => (
                validPaperSizeSet.has(idx)
                  ? <option key={idx} value={idx}>{size.label}</option>
                  : null
              ))}
              <option value={PARENT_PAPER_SIZES.length}>Tùy chọn...</option>
              <option value={PARENT_PAPER_SIZES.length + 1}>Xả lô (Từ cuộn)...</option>
            </select>
          </div>
          
          {parentSizeIdx === PARENT_PAPER_SIZES.length && (
            <div className="grid grid-cols-2 gap-4 bg-emerald-50 p-2.5 rounded-lg border border-emerald-100 mt-2">
              <div className="space-y-1"><label className="text-xs font-medium text-slate-600">Ngang (cm)</label><input type="number" step="0.1" className="w-full p-2 border border-slate-300 rounded outline-none" value={customParentW} onChange={(e) => setCustomParentW(e.target.value)}/></div>
              <div className="space-y-1"><label className="text-xs font-medium text-slate-600">Cao (cm)</label><input type="number" step="0.1" className="w-full p-2 border border-slate-300 rounded outline-none" value={customParentH} onChange={(e) => setCustomParentH(e.target.value)}/></div>
            </div>
          )}
          {parentSizeIdx === PARENT_PAPER_SIZES.length + 1 && (
            <div className="grid grid-cols-3 gap-3 bg-amber-50 p-2.5 rounded-lg border border-amber-200 shadow-inner mt-2">
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

          <div className="flex flex-wrap gap-x-5 gap-y-2 pt-2 border-t border-slate-100">
            <label className="flex items-center space-x-1.5 cursor-pointer group">
              <input type="checkbox" className="w-4 h-4 rounded text-orange-600 focus:ring-orange-500" checked={muonNhip} onChange={(e) => setMuonNhip(e.target.checked)} />
              <span className="text-sm font-medium text-slate-700">Mượn nhíp</span>
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
                {validPrinters.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
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
              <label className="text-sm font-medium text-slate-700">Tiền khuôn bế (VNĐ)</label>
              <span className="text-sm text-slate-500 italic">Tự động tra bảng GiaCong</span>
            </div>
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
          <Maximize size={18} /><span>Tính toán & Phân trang túi</span>
        </button>
      </div>

      {/* KHU VỰC PHẢI: KẾT QUẢ & BẢN VẼ */}
      <div className="xl:col-span-9 flex flex-col space-y-6 xl:overflow-y-auto custom-scrollbar xl:h-full xl:pr-2 xl:pb-6">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-6 rounded-2xl flex items-center space-x-3 shrink-0">
            <AlertCircle size={24} />
            <span className="font-medium">{error}</span>
          </div>
        )}
        {!(isCalculated || hasValidDimensions) ? (
          <div className="bg-white border border-slate-200 p-10 rounded-2xl flex flex-col items-center justify-center text-slate-400 h-full min-h-[400px] shrink-0">
            <Box size={48} className="mb-4 opacity-50 text-orange-400"/>
            <p className="font-medium text-slate-600 text-lg">Hệ thống tính giá Túi giấy</p>
            <p className="text-sm mt-1">Nhập đầy đủ kích thước túi để tự động xem bản vẽ kỹ thuật.</p>
          </div>
        ) : (
          <>
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col shrink-0">
              <h2 className="text-lg font-semibold mb-2 text-slate-800 border-b pb-2 flex justify-between items-center">
                <span>Bản vẽ kỹ thuật (Flat Layout)</span>
              </h2>
              <TuiGiayFlatLayoutViewer
                width={boxWidth}
                depth={boxDepth}
                height={boxHeight}
                gapMiec={gapMiec}
                taiDan={taiDanStr}
                soManh={soManh}
                matTui={matTui}
              />
              
              <h2 className="text-lg font-semibold mb-2 mt-8 text-slate-800 border-b pb-2 flex justify-between items-center">
                <span>Sơ đồ bình bản khuôn bế (1 bát / tờ)</span>
                <button
                  onClick={() => setIsZoomModalOpen(true)}
                  className="text-slate-500 hover:text-blue-600 bg-slate-100 hover:bg-blue-50 p-1.5 px-3 rounded-lg transition-colors flex items-center gap-1 text-sm font-medium"
                  title="Phóng to sơ đồ"
                >
                  <ZoomIn size={16} /> <span className="hidden md:inline">Phóng to</span>
                </button>
              </h2>
              <TuiGiayImpositionViewer
                width={boxWidth}
                depth={boxDepth}
                height={boxHeight}
                gapMiec={gapMiec}
                taiDan={taiDanStr}
                soManh={soManh}
                cols={cols}
                rows={rows}
                muonSong={false}
                muonNhip={muonNhip}
                parentW={currentPaperSize.w}
                parentH={currentPaperSize.h}
              />
            </div>

            {result && (
              <>
              <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 shrink-0">
                <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 flex flex-col justify-center items-center text-center">
                  <span className="text-slate-500 text-sm font-medium mb-1">Số tờ / túi</span>
                  <span className="text-3xl font-bold text-blue-600">{result.piecesPerBag}</span>
                  <span className="text-xs text-slate-400 mt-1">{result.piecesPerBag === 2 ? '2 mảnh — 2 tờ in' : '1 mảnh — 1 tờ in'}</span>
                </div>
                
                <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 flex flex-col justify-center items-center text-center">
                  <span className="text-slate-500 text-sm font-medium mb-1 flex items-center justify-center space-x-1"><Printer size={14}/> <span>Số tờ in</span></span>
                  <span className="text-3xl font-bold text-slate-700">{result.sheetsNeeded.toLocaleString('vi-VN')}</span>
                  <span className="text-xs text-slate-400 mt-1">+{result.dynamicSpoilage} tờ bù hao</span>
                </div>

                <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 flex flex-col justify-center items-center text-center">
                  <span className="text-slate-500 text-sm font-medium mb-1">Diện tích sử dụng</span>
                  <span className="text-3xl font-bold text-slate-700">
                    {currentPaperSize.w > 0 && currentPaperSize.h > 0
                      ? ((cumKhuonSize.w * cumKhuonSize.h) / (currentPaperSize.w * currentPaperSize.h) * 100).toFixed(1)
                      : '0.0'}
                    %
                  </span>
                  <span className="text-xs text-slate-400 mt-1">SP xếp xuôi</span>
                </div>

                <div className="bg-emerald-50 p-4 rounded-2xl shadow-sm border border-emerald-200 flex flex-col justify-center items-center text-center">
                  <span className="text-emerald-700 text-sm font-medium mb-1">Dự toán tiền giấy</span>
                  <span className="text-2xl font-bold text-emerald-700">{Math.round(result.costs.tienGiay).toLocaleString('vi-VN')} đ</span>
                  <span className="text-[11px] text-emerald-600 mt-1">{result.totalWeightKg.toFixed(1)}kg × {result.pricePerKg.toLocaleString('vi-VN')}đ</span>
                </div>
              </div>

              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden mt-2 shrink-0">
                <div className="bg-slate-50 px-6 py-3 border-b border-slate-200">
                  <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Chi tiết báo giá (Dự kiến)</h3>
                </div>
                <div className="p-6">
                  <div className="space-y-1">
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
                        <span className="text-[11px] text-slate-400 ml-1 leading-relaxed inline-block">
                          {result.costs.sooBaiIn === 2
                            ? `(${result.costs.soKem} kẽm × ${result.costs.giaKem.toLocaleString('vi-VN')}đ) × 2 bài in`
                            : `(${result.costs.soKem} kẽm × ${result.costs.giaKem.toLocaleString('vi-VN')}đ)`}
                        </span>
                      </div>
                      <span className="font-medium text-slate-800 whitespace-nowrap">{Math.round(result.costs.tienKem).toLocaleString('vi-VN')} đ</span>
                    </div>

                    <div className="flex justify-between items-start text-sm py-1.5">
                      <div className="pr-4 text-slate-600">
                        <span>4. Tiền công in</span>
                        <span className="text-[11px] text-slate-400 ml-1 leading-relaxed inline-block">
                          {result.costs.sooBaiIn === 2
                            ? result.costs.quaLuotMoiKem > 0
                              ? `(${result.costs.quaLuotMoiKem.toLocaleString('vi-VN')} lượt quá × ${result.costs.soKem} kẽm × ${result.costs.giaLuot.toLocaleString('vi-VN')}đ) × 2 bài in`
                              : '(Miễn phí ≤ 1.000 lượt/kẽm) × 2 bài in'
                            : result.costs.quaLuotMoiKem > 0
                              ? `(${result.costs.quaLuotMoiKem.toLocaleString('vi-VN')} lượt quá × ${result.costs.soKem} kẽm × ${result.costs.giaLuot.toLocaleString('vi-VN')}đ)`
                              : '(Miễn phí ≤ 1.000 lượt/kẽm)'}
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
                        <span>6. Tiền gia công:</span>
                        <span className="text-[11px] text-slate-400 ml-1 leading-relaxed inline-block">{result.costs.giaCongDetail}</span>
                      </div>
                      <span className="font-medium text-slate-800 whitespace-nowrap">{Math.round(result.costs.tienGiaCong).toLocaleString('vi-VN')} đ</span>
                    </div>

                    <div className="flex justify-between items-start text-sm py-1.5">
                      <div className="pr-4 text-slate-600">
                        <span>7. Tiền khuôn bế:</span>
                        <span className="text-[11px] text-slate-400 ml-1 leading-relaxed inline-block">{result.costs.khuonBeDetail}</span>
                      </div>
                      <span className="font-medium text-slate-800 whitespace-nowrap">{Math.round(result.costs.tienKhuonBe).toLocaleString('vi-VN')} đ</span>
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

                    <div className="flex justify-between items-center bg-orange-50 p-4 rounded-xl mt-4 border border-orange-100">
                      <div>
                        <span className="font-bold text-orange-900 block text-lg">GIÁ BÁN TỔNG</span>
                        <span className="text-xs text-orange-600 font-medium">Đã nhân hệ số {result.costs.markup}</span>
                      </div>
                      <div className="text-right">
                        <span className="font-bold text-2xl text-orange-700 block">{Math.round(result.costs.giaBan).toLocaleString('vi-VN')} đ</span>
                        <span className="text-sm font-semibold text-orange-600">~ {Math.round(result.costs.donGiaSP).toLocaleString('vi-VN')} đ/Túi</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              </>
            )}

            {/* MODAL PHÓNG TO SƠ ĐỒ KÊU GỌI */}
            {isZoomModalOpen && (
              <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 md:p-8">
                <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">
                  <div className="flex justify-between items-center p-4 border-b border-slate-200 bg-slate-50 shrink-0">
                    <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                      <ZoomIn size={20} className="text-blue-600" />
                      Sơ đồ bình bản khuôn bế - Phóng to
                    </h3>
                    <button onClick={() => setIsZoomModalOpen(false)} className="text-slate-500 hover:text-red-500 hover:bg-red-50 p-1.5 rounded-lg transition-colors">
                      <X size={24} />
                    </button>
                  </div>
                  <div className="flex-1 overflow-auto p-4 md:p-8 bg-[#f8f9fa] flex items-center justify-center custom-scrollbar">
                    <div className="w-full max-w-full">
                      <TuiGiayImpositionViewer
                        width={boxWidth}
                        depth={boxDepth}
                        height={boxHeight}
                        gapMiec={gapMiec}
                        taiDan={taiDanStr}
                        soManh={soManh}
                        cols={cols}
                        rows={rows}
                        muonSong={false}
                        muonNhip={muonNhip}
                        parentW={currentPaperSize.w}
                        parentH={currentPaperSize.h}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}


export default TuiGiayCalculator;
