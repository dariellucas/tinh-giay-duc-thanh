import React, { useEffect, useMemo, useState } from 'react';
import { AlertCircle, Box, Maximize, Printer, RefreshCw, X, ZoomIn } from 'lucide-react';
import { DEFAULT_GAP_CM, HAO_CAN, HAO_IN, LAMINATION_TYPES, MARKUP_RATES, PARENT_PAPER_SIZES } from '../constants/pricingConstants';
import { Box3DViewer, BoxImpositionViewer, FlatLayoutViewer, getHopMemGeometry, getHopMemGeometryDao } from '../components/viewers/HopMemViewers';
import { usePricingDataContext } from '../context/PricingDataContext';
import { useDebounce } from '../hooks/useDebounce';
import { calculateEmbossCost, calculateFoilCost, findFinishingByName } from '../utils/finishingUtils';
import { calculatePaperCost, getSpoilageByQuantity, safeParseNumber } from '../utils/numberUtils';

function HopMemCalculator() {
  const {
    paperDatabase,
    printerDatabase,
    finishingDatabase,
    hopMemDatabase,
    dinhMucDatabase,
    isLoadingPrices,
    fetchPaperPrices,
  } = usePricingDataContext();
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
  const [customParentW, setCustomParentW] = useState('');
  const [customParentH, setCustomParentH] = useState('');
  const [rollWidth, setRollWidth] = useState('');
  const [rollSplit, setRollSplit] = useState(1);
  const [rollCutLength, setRollCutLength] = useState('');
  const [cols, setCols] = useState(1); // Số bát X
  const [rows, setRows] = useState(1); // Số bát Y
  const [daoTaiDan, setDaoTaiDan] = useState(false);
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
  const [dieCost, setDieCost] = useState(0);
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

  const debouncedAutoFitInputs = useDebounce(
    [boxType, boxWidth, boxDepth, boxHeight, parentSizeIdx, customParentW, customParentH, rollWidth, rollSplit, rollCutLength, muonSong, daoTaiDan],
    300,
  );

  const cumKhuonSize = useMemo(() => {
    const X = safeParseNumber(boxWidth);
    const Y = safeParseNumber(boxDepth);
    const Z = safeParseNumber(boxHeight);
    const cCols = parseInt(cols) || 1;
    const cRows = parseInt(rows) || 1;

    if (X <= 0 || Y <= 0 || Z <= 0 || cCols <= 0 || cRows <= 0) return { w: 0, h: 0 };

    const geom = getHopMemGeometry(boxType, X, Y, Z, hopMemDatabase);
    if (!geom) return { w: 0, h: 0 };

    const geomDao = getHopMemGeometryDao(boxType, X, Y, Z, hopMemDatabase);
    const { minX, maxX, minY, maxY, overlapX, overlapY, taiDan } = geom;
    
    const singleW = maxX - minX;
    const singleH = maxY - minY;
    const gap = muonSong ? 0 : DEFAULT_GAP_CM;

    const stepW = singleW - overlapX + gap;
    const stepH = singleH - overlapY + gap;

    let extraW = 0;
    if ((boxType === 'nap_cai_day_khoa' || boxType === 'nap_cai_day_moc') && cRows >= 2) {
      if (daoTaiDan && geomDao) {
        extraW = 0;
      } else {
        extraW = Math.max(0, Y - taiDan);
      }
    }

    const totalW = singleW + (cCols - 1) * stepW + extraW;
    
    let currentY = 0;
    for (let r = 0; r < cRows; r++) {
      if (r > 0) {
        if ((boxType === 'nap_cai_day_khoa' || boxType === 'nap_cai_day_moc')) {
          if (r % 2 === 1) currentY += singleH - overlapY + gap;
          else currentY += singleH + gap;
        } else {
          currentY += stepH;
        }
      }
    }
    const totalH = currentY + singleH;

    return { w: totalW, h: totalH };
  }, [boxType, boxWidth, boxDepth, boxHeight, cols, rows, hopMemDatabase, muonSong, daoTaiDan]);

  // --- THÊM MỚI: TỰ ĐỘNG TÍNH TOÁN SỐ BÁT IN KHI THAY ĐỔI KÍCH THƯỚC HOẶC KHỔ GIẤY ---
  useEffect(() => {
    const [dBoxType, dBoxWidth, dBoxDepth, dBoxHeight, dParentSizeIdx, dCustomParentW, dCustomParentH, dRollWidth, dRollSplit, dRollCutLength, dMuonSong, dDaoTaiDan] = debouncedAutoFitInputs;
    const X = safeParseNumber(dBoxWidth);
    const Y = safeParseNumber(dBoxDepth);
    const Z = safeParseNumber(dBoxHeight);
    
    // Nếu chưa nhập đủ kích thước hoặc chưa chọn khổ giấy thì bỏ qua
    if (X <= 0 || Y <= 0 || Z <= 0 || dParentSizeIdx === '') return;

    // Lấy chính xác kích thước khổ giấy in
    let Pw = 0, Ph = 0;
    if (dParentSizeIdx === PARENT_PAPER_SIZES.length) {
      Pw = safeParseNumber(dCustomParentW);
      Ph = safeParseNumber(dCustomParentH);
    } else if (dParentSizeIdx === PARENT_PAPER_SIZES.length + 1) {
      Pw = safeParseNumber(dRollWidth) / dRollSplit;
      Ph = safeParseNumber(dRollCutLength);
    } else {
      Pw = PARENT_PAPER_SIZES[dParentSizeIdx]?.w || 0;
      Ph = PARENT_PAPER_SIZES[dParentSizeIdx]?.h || 0;
    }
    if (Pw <= 0 || Ph <= 0) return;

    const geom = getHopMemGeometry(dBoxType, X, Y, Z, hopMemDatabase);
    if (!geom) return;
    const geomDao = getHopMemGeometryDao(dBoxType, X, Y, Z, hopMemDatabase);

    const { minX, maxX, minY, maxY, overlapX, overlapY, taiDan } = geom;
    const singleW = maxX - minX;
    const singleH = maxY - minY;
    const gap = dMuonSong ? 0 : DEFAULT_GAP_CM;
    const stepW = singleW - overlapX + gap;
    const stepH = singleH - overlapY + gap;

    // Thuật toán tìm số hàng tối đa
    const getMaxRows = (maxH) => {
      if (singleH > maxH) return 0;
      let r = 1;
      let currentY = 0;
      while (true) {
        let nextY = currentY;
        if ((dBoxType === 'nap_cai_day_khoa' || dBoxType === 'nap_cai_day_moc')) {
           if (r % 2 === 1) nextY += singleH - overlapY + gap;
           else nextY += singleH + gap;
        } else {
           nextY += stepH;
        }
        if (nextY + singleH > maxH) break;
        currentY = nextY;
        r++;
      }
      return r;
    };

    // Thuật toán tìm số cột tối đa
    const getMaxCols = (maxW, rCount) => {
      let extraW = 0;
      if ((dBoxType === 'nap_cai_day_khoa' || dBoxType === 'nap_cai_day_moc') && rCount >= 2) {
        if (dDaoTaiDan && geomDao) extraW = 0;
        else extraW = Math.max(0, Y - taiDan);
      }
      if (singleW + extraW > maxW) return 0;
      if (stepW <= 0) return 1;
      return Math.floor((maxW - singleW - extraW) / stepW) + 1;
    };

    const tryFit = (paperW, paperH) => {
      const r = getMaxRows(paperH);
      if (r === 0) return { c: 0, r: 0, total: 0 };
      const c = getMaxCols(paperW, r);
      return { c, r, total: c * r };
    };

    // Thử tính trên cả 2 chiều xoay của khổ giấy
    const opt1 = tryFit(Pw, Ph);
    const opt2 = tryFit(Ph, Pw);

    let bestOpt = opt1.total >= opt2.total ? opt1 : opt2;

    // Tự động cập nhật state nếu tìm được phương án xếp phù hợp
    if (bestOpt.total > 0) {
      setCols(prev => (prev !== bestOpt.c ? bestOpt.c : prev));
      setRows(prev => (prev !== bestOpt.r ? bestOpt.r : prev));
    }
  }, [debouncedAutoFitInputs, hopMemDatabase]);
  // --- KẾT THÚC THÊM MỚI ---

  // Ghi nhận khổ giấy in hiện tại (dùng để truyền xuống preview bản vẽ thời gian thực)
  const currentPaperSize = useMemo(() => {
    let Pw = 0, Ph = 0;
    if (parentSizeIdx === PARENT_PAPER_SIZES.length) {
      Pw = safeParseNumber(customParentW);
      Ph = safeParseNumber(customParentH);
    } else if (parentSizeIdx === PARENT_PAPER_SIZES.length + 1) {
      Pw = safeParseNumber(rollWidth) / rollSplit;
      Ph = safeParseNumber(rollCutLength);
    } else if (parentSizeIdx !== '') {
      Pw = PARENT_PAPER_SIZES[parentSizeIdx]?.w || 0;
      Ph = PARENT_PAPER_SIZES[parentSizeIdx]?.h || 0;
    }
    return { w: Pw, h: Ph };
  }, [parentSizeIdx, customParentW, customParentH, rollWidth, rollSplit, rollCutLength]);

  // Logic kiểm tra đã nhập đủ 3 chiều kích thước chưa
  const hasValidDimensions = safeParseNumber(boxWidth) > 0 && safeParseNumber(boxDepth) > 0 && safeParseNumber(boxHeight) > 0;

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
      Pw = safeParseNumber(customParentW);
      Ph = safeParseNumber(customParentH);
    } else if (parentSizeIdx === PARENT_PAPER_SIZES.length + 1) {
      Pw = safeParseNumber(rollWidth) / rollSplit;
      Ph = safeParseNumber(rollCutLength);
    } else {
      Pw = PARENT_PAPER_SIZES[parentSizeIdx]?.w || 0;
      Ph = PARENT_PAPER_SIZES[parentSizeIdx]?.h || 0;
    }

    const reqMax = Math.max(cumKhuonSize.w, cumKhuonSize.h);
    const reqMin = Math.min(cumKhuonSize.w, cumKhuonSize.h);
    const pMax = Math.max(Pw, Ph);
    const pMin = Math.min(Pw, Ph);

    if (reqMax > pMax || reqMin > pMin) {
      setError(`Kích thước cụm khuôn (${reqMax.toFixed(1)} x ${reqMin.toFixed(1)} cm) lớn hơn khổ giấy in (${pMax} x ${pMin} cm). Vui lòng điều chỉnh.`);
      setResult(null);
      setIsCalculated(false);
      return;
    }

    setError('');

    const itemsPerSheet = cols * rows;
    const soToInLyThuyet = Math.ceil(qty / itemsPerSheet);
    const dynamicSpoilage = getSpoilageByQuantity(dinhMucDatabase, soToInLyThuyet);
    const parentSheetsNeeded = soToInLyThuyet + dynamicSpoilage;

    // 1. Tiền giấy
    const pricePerTon = paperDatabase[paperType] && paperDatabase[paperType][paperGsm] ? paperDatabase[paperType][paperGsm].price : 0; 
    const areaM2 = (Pw * Ph) / 10000;
    const weightPerSheetKg = (areaM2 * paperGsm) / 1000;
    const totalWeightKg = weightPerSheetKg * parentSheetsNeeded;
    const pricePerKg = safeParseNumber(pricePerTon) * 1000; // Bảng giá giấy đang theo đơn vị tấn, cần quy đổi về kg.
    const tienGiay = calculatePaperCost(Pw, Ph, paperGsm, parentSheetsNeeded, pricePerTon);

    // Tiền xả lô
    let tienXaLo = 0;
    if (parentSizeIdx === PARENT_PAPER_SIZES.length + 1) {
      const xaLoObj = findFinishingByName(finishingDatabase, 'xả lô');
      tienXaLo = xaLoObj ? safeParseNumber(xaLoObj.minPrice) : 150000;
    }

    const getGiaCongRule = () => {
      const keyword = boxType === 'nap_cai_day_moc' ? 'hộp mềm móc đáy' : 'hộp mềm số lượng';
      const candidateRows = (finishingDatabase || []).filter((row) => {
        const item = String(row?.item || '').toLowerCase();
        return item.includes(keyword);
      });

      const normalizedOperator = (rawOperator) => {
        const op = String(rawOperator || '').trim();
        if (op === '≤') return '<=';
        if (op === '≥') return '>=';
        return op;
      };

      const parsedRules = [];

      for (let i = 0; i < candidateRows.length; i++) {
        const row = candidateRows[i];
        const itemText = String(row.item || '').toLowerCase();
        const condMatch = itemText.match(/([<>]=?|[≤≥])\s*([\d\.,]+)/);

        if (!condMatch) continue;

        const operator = normalizedOperator(condMatch[1]);
        const threshold = safeParseNumber(condMatch[2]);
        let isMatch = false;

        if (operator === '<' && qty < threshold) isMatch = true;
        if (operator === '<=' && qty <= threshold) isMatch = true;
        if (operator === '>' && qty > threshold) isMatch = true;
        if (operator === '>=' && qty >= threshold) isMatch = true;

        parsedRules.push({
          operator,
          threshold,
          row,
        });

        if (isMatch) {
          return {
            donGia: safeParseNumber(row.price),
            minPrice: safeParseNumber(row.minPrice),
            ruleLabel: String(row.item || ''),
          };
        }
      }

      // Fallback cho dữ liệu bị hở mốc biên (vd: "<30.000" và ">30.000")
      // Ưu tiên lấy rule phía trên mốc (>) để không báo "không tìm thấy đơn giá".
      const boundaryRule = parsedRules.find((rule) => rule.operator === '>' && qty === rule.threshold)
        || parsedRules.find((rule) => rule.operator === '<' && qty === rule.threshold);
      if (boundaryRule) {
        return {
          donGia: safeParseNumber(boundaryRule.row.price),
          minPrice: safeParseNumber(boundaryRule.row.minPrice),
          ruleLabel: String(boundaryRule.row.item || ''),
        };
      }

      return { donGia: 0, minPrice: 0, ruleLabel: '' };
    };

    // 2. Tiền kẽm & In (Mặc định Hộp mềm in 1 mặt)
    const soKem = printColors;
    const selectedPrinterObj = printerDatabase.find(p => p.id === selectedPrinter);
    const giaKem = selectedPrinterObj ? safeParseNumber(selectedPrinterObj.platePrice) : 0;
    const tienKem = soKem * giaKem;

    const soLuotInMoiKem = soToInLyThuyet;
    const quaLuotMoiKem = Math.max(0, soLuotInMoiKem - 1000); 
    const giaLuotCoBan = selectedPrinterObj ? safeParseNumber(selectedPrinterObj.runPrice) : 0;
    const giaLuot = printColors === 1 ? giaLuotCoBan + 10 : giaLuotCoBan;
    const tienIn = quaLuotMoiKem * soKem * giaLuot;

    // 3. Tiền cán màng
    let tienCan = 0;
    let canDetail = '';
    if (lamination !== 'none') {
      const canName = lamination === 'matte' ? 'cán mờ' : 'cán bóng';
      const canObj = findFinishingByName(finishingDatabase, canName);
      if (canObj) {
        const toCan = Math.max(0, parentSheetsNeeded - HAO_IN - HAO_CAN);
        const areaCm2 = Pw * Ph;
        const laminationSides = 1; // Hộp mềm thường cán 1 mặt ngoài
        const cost = areaCm2 * toCan * laminationSides * safeParseNumber(canObj.price);
        tienCan = Math.max(cost, safeParseNumber(canObj.minPrice));
        canDetail = `(${toCan.toLocaleString('vi-VN')} tờ × ${laminationSides} mặt × ${areaCm2.toLocaleString('vi-VN')}cm² × ${canObj.price}đ)`;
      }
    }

    // Ép nhũ / thúc nổi: tính theo số lượng thành phẩm + bù hao in.
    let foilDieCost = 0;
    let foilDieDetail = '';
    let foilCost = 0;
    let foilDetail = '';
    if (hasFoil) {
      const foilResult = calculateFoilCost(finishingDatabase, foilLength, foilWidth, qty, dynamicSpoilage);
      foilDieCost = foilResult.dieCost;
      foilCost = foilResult.impressionCost;
      const { areaCm2: foilArea, dieUnitPrice, dieBaseCost, pricePerCm2, pricePerHit, costPerUnit, totalImpressions, missingRows } = foilResult.details;
      const missingFoilDie = missingRows.includes('Khuôn nhũ');
      const missingFoilWork = missingRows.filter((row) => row !== 'Khuôn nhũ');
      foilDieDetail = missingFoilDie
        ? '(Thiếu dòng GiaCong: Khuôn nhũ)'
        : `(${foilArea.toLocaleString('vi-VN')}cm² × ${dieUnitPrice}đ/cm²${dieBaseCost < foilResult.dieMin ? `, áp tối thiểu ${Math.round(foilResult.dieMin).toLocaleString('vi-VN')}đ` : ''})`;
      foilDetail = missingFoilWork.length > 0
        ? `(Thiếu dòng GiaCong: ${missingFoilWork.join(', ')})`
        : `(${totalImpressions.toLocaleString('vi-VN')} nhát × ${Math.round(costPerUnit).toLocaleString('vi-VN')}đ, diện tích ${foilArea.toLocaleString('vi-VN')}cm² × ${pricePerCm2}đ/cm², tối thiểu theo nhát ${pricePerHit}đ)`;
    }

    let embossDieCost = 0;
    let embossDieDetail = '';
    let embossCost = 0;
    let embossDetail = '';
    if (hasEmboss) {
      const embossResult = calculateEmbossCost(finishingDatabase, embossLength, embossWidth, qty, dynamicSpoilage);
      embossDieCost = embossResult.dieCost;
      embossCost = embossResult.impressionCost;
      const { areaCm2: embossArea, dieUnitPrice, dieBaseCost, pricePerHit, totalImpressions, missingRows } = embossResult.details;
      const missingEmbossDie = missingRows.includes('Khuôn thúc nổi');
      const missingEmbossWork = missingRows.filter((row) => row !== 'Khuôn thúc nổi');
      embossDieDetail = missingEmbossDie
        ? '(Thiếu dòng GiaCong: Khuôn thúc nổi)'
        : `(${embossArea.toLocaleString('vi-VN')}cm² × ${dieUnitPrice}đ/cm²${dieBaseCost < embossResult.dieMin ? `, áp tối thiểu ${Math.round(embossResult.dieMin).toLocaleString('vi-VN')}đ` : ''})`;
      embossDetail = missingEmbossWork.length > 0
        ? `(Thiếu dòng GiaCong: ${missingEmbossWork.join(', ')})`
        : `(${totalImpressions.toLocaleString('vi-VN')} lượt × ${Math.round(pricePerHit).toLocaleString('vi-VN')}đ)`;
    }

    // 4. Tiền gia công
    const giaCongRule = getGiaCongRule();
    const giaCongDonGia = giaCongRule.donGia;
    const soLuongGiaCong = qty + 50;
    const tienGiaCongTinhTheoSL = soLuongGiaCong * giaCongDonGia;
    const tienGiaCong = Math.max(tienGiaCongTinhTheoSL, giaCongRule.minPrice);
    const isMinGiaCongApplied = giaCongRule.minPrice > 0 && tienGiaCong === giaCongRule.minPrice;
    const giaCongDetail = giaCongDonGia > 0
      ? isMinGiaCongApplied
        ? `(${soLuongGiaCong.toLocaleString('vi-VN')} chiếc × ${Math.round(giaCongDonGia).toLocaleString('vi-VN')}đ, áp tối thiểu ${Math.round(giaCongRule.minPrice).toLocaleString('vi-VN')}đ${giaCongRule.ruleLabel ? ` - ${giaCongRule.ruleLabel}` : ''})`
        : `(${soLuongGiaCong.toLocaleString('vi-VN')} chiếc × ${Math.round(giaCongDonGia).toLocaleString('vi-VN')}đ${giaCongRule.ruleLabel ? ` - ${giaCongRule.ruleLabel}` : ''})`
      : '(Không tìm thấy đơn giá gia công)';

    // 5. Tiền khuôn bế
    const tienKhuonBe = safeParseNumber(dieCost);

    // 6. Tiền vận chuyển
    const tienVanChuyen = safeParseNumber(shippingCost); 

    const giaSanXuat = tienGiay + tienXaLo + tienKem + tienIn + tienCan + foilDieCost + foilCost + embossDieCost + embossCost + tienGiaCong + tienKhuonBe + tienVanChuyen;
    const giaBan = giaSanXuat * markup;
    const donGiaSP = giaBan / qty;

    setResult({
      itemsPerSheet, sheetsNeeded: parentSheetsNeeded, dynamicSpoilage,
      totalWeightKg, pricePerKg,
      costs: {
        tienGiay, tienXaLo, tienKem, tienIn, tienCan, foilDieCost, foilCost, embossDieCost, embossCost, tienGiaCong, tienKhuonBe, tienVanChuyen,
        giaSanXuat, giaBan, donGiaSP, markup,
        soKem, giaKem, quaLuotMoiKem, giaLuot, canDetail, foilDieDetail, foilDetail, embossDieDetail, embossDetail, giaCongDetail
      }
    });

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


          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-600">Số bát X</label>
              <input type="number" min="1" className="w-full p-2 bg-slate-50 border border-slate-300 rounded outline-none focus:ring-2 focus:ring-orange-500 text-sm" value={cols} onChange={(e) => setCols(e.target.value)}/>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-600">Số bát Y</label>
              <input type="number" min="1" className="w-full p-2 bg-slate-50 border border-slate-300 rounded outline-none focus:ring-2 focus:ring-orange-500 text-sm" value={rows} onChange={(e) => setRows(e.target.value)}/>
            </div>
          </div>

          {(boxType === 'nap_cai_day_khoa' || boxType === 'nap_cai_day_moc') && (
            <div className="pt-1">
              <label className="flex items-center space-x-1.5 cursor-pointer group w-fit">
                <input type="checkbox" className="w-4 h-4 rounded text-orange-600 focus:ring-orange-500" checked={daoTaiDan} onChange={(e) => setDaoTaiDan(e.target.checked)} />
                <span className="text-sm font-medium text-slate-700">Đảo tai dán</span>
              </label>
            </div>
          )}

          <div className="space-y-1 pt-2">
            <label className="text-xs font-bold text-orange-800">Số đo cụm khuôn (cm)</label>
            <div className="w-full p-2.5 bg-orange-100 border border-orange-200 rounded-lg text-sm font-bold text-orange-900 text-center shadow-inner">
              {cumKhuonSize.w > 0 && cumKhuonSize.h > 0 
                ? `${cumKhuonSize.w.toFixed(2)} x ${cumKhuonSize.h.toFixed(2)}` 
                : 'Chưa có dữ liệu'}
            </div>
          </div>
          


          {/* CHỌN KHỔ GIẤY IN HỘP MỀM */}
          <div className="space-y-2 pt-1 border-t border-slate-100">
            <label className="text-sm font-medium text-slate-700 flex justify-between items-center">
              <span>Khổ giấy in (Nguyên khổ) *</span>
              {parentSizeIdx === PARENT_PAPER_SIZES.length + 1 && (
                <span className="text-xs text-amber-600 font-semibold bg-amber-100 px-2 py-0.5 rounded border border-amber-200">
                  Khổ xả: {safeParseNumber(rollWidth) / rollSplit} x {safeParseNumber(rollCutLength)} cm
                </span>
              )}
            </label>
            <select className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none text-sm" value={parentSizeIdx} onChange={(e) => setParentSizeIdx(e.target.value === '' ? '' : parseInt(e.target.value))}>
              <option value="" disabled hidden>Chọn khổ giấy in...</option>
              {PARENT_PAPER_SIZES.map((size, idx) => (<option key={idx} value={idx}>{size.label}</option>))}
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
              <label className="text-sm font-medium text-slate-700">Tiền khuôn bế (VNĐ)</label>
              <input type="number" className="w-1/2 p-2 bg-slate-50 border border-slate-300 rounded outline-none text-sm text-right font-medium" value={dieCost} onChange={(e) => setDieCost(Number(e.target.value))} />
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
          <Maximize size={18} /><span>Tính toán & Phân trang hộp</span>
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
                <button
                  onClick={() => setIsZoomModalOpen(true)}
                  className="text-slate-500 hover:text-blue-600 bg-slate-100 hover:bg-blue-50 p-1.5 px-3 rounded-lg transition-colors flex items-center gap-1 text-sm font-medium"
                  title="Phóng to sơ đồ"
                >
                  <ZoomIn size={16} /> <span className="hidden md:inline">Phóng to</span>
                </button>
              </h2>
              <BoxImpositionViewer boxType={boxType} width={boxWidth} depth={boxDepth} height={boxHeight} cols={cols} rows={rows} hopMemDatabase={hopMemDatabase} muonSong={muonSong} muonNhip={muonNhip} daoTaiDan={daoTaiDan} parentW={currentPaperSize.w} parentH={currentPaperSize.h} />
            </div>

            {result && (
              <>
              <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 shrink-0">
                <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 flex flex-col justify-center items-center text-center">
                  <span className="text-slate-500 text-sm font-medium mb-1">Số bát (SP/Tờ)</span>
                  <span className="text-3xl font-bold text-blue-600">{result.itemsPerSheet}</span>
                  <span className="text-xs text-slate-400 mt-1">{cols} cột × {rows} hàng</span>
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

                    {result.costs.foilDieDetail && (
                      <div className="flex justify-between items-start text-sm py-1.5">
                        <div className="pr-4 text-slate-600">
                          <span>6. Tiền khuôn nhũ:</span>
                          <span className="text-[11px] text-slate-400 ml-1 leading-relaxed inline-block">{result.costs.foilDieDetail}</span>
                        </div>
                        <span className="font-medium text-slate-800 whitespace-nowrap">{Math.round(result.costs.foilDieCost).toLocaleString('vi-VN')} đ</span>
                      </div>
                    )}

                    {result.costs.foilDetail && (
                      <div className="flex justify-between items-start text-sm py-1.5">
                        <div className="pr-4 text-slate-600">
                          <span>7. Tiền ép nhũ:</span>
                          <span className="text-[11px] text-slate-400 ml-1 leading-relaxed inline-block">{result.costs.foilDetail}</span>
                        </div>
                        <span className="font-medium text-slate-800 whitespace-nowrap">{Math.round(result.costs.foilCost).toLocaleString('vi-VN')} đ</span>
                      </div>
                    )}

                    {result.costs.embossDieDetail && (
                      <div className="flex justify-between items-start text-sm py-1.5">
                        <div className="pr-4 text-slate-600">
                          <span>8. Tiền khuôn thúc nổi:</span>
                          <span className="text-[11px] text-slate-400 ml-1 leading-relaxed inline-block">{result.costs.embossDieDetail}</span>
                        </div>
                        <span className="font-medium text-slate-800 whitespace-nowrap">{Math.round(result.costs.embossDieCost).toLocaleString('vi-VN')} đ</span>
                      </div>
                    )}

                    {result.costs.embossDetail && (
                      <div className="flex justify-between items-start text-sm py-1.5">
                        <div className="pr-4 text-slate-600">
                          <span>9. Tiền thúc nổi:</span>
                          <span className="text-[11px] text-slate-400 ml-1 leading-relaxed inline-block">{result.costs.embossDetail}</span>
                        </div>
                        <span className="font-medium text-slate-800 whitespace-nowrap">{Math.round(result.costs.embossCost).toLocaleString('vi-VN')} đ</span>
                      </div>
                    )}
                    
                    <div className="flex justify-between items-start text-sm py-1.5">
                      <div className="pr-4 text-slate-600">
                        <span>10. Tiền gia công:</span>
                        <span className="text-[11px] text-slate-400 ml-1 leading-relaxed inline-block">{result.costs.giaCongDetail}</span>
                      </div>
                      <span className="font-medium text-slate-800 whitespace-nowrap">{Math.round(result.costs.tienGiaCong).toLocaleString('vi-VN')} đ</span>
                    </div>

                    <div className="flex justify-between items-start text-sm py-1.5">
                      <div className="pr-4 text-slate-600">
                        <span>11. Tiền khuôn bế:</span>
                      </div>
                      <span className="font-medium text-slate-800 whitespace-nowrap">{Math.round(result.costs.tienKhuonBe).toLocaleString('vi-VN')} đ</span>
                    </div>

                    <div className="flex justify-between items-start text-sm py-1.5 border-b border-slate-100 pb-3">
                      <div className="pr-4 text-slate-600">
                        <span>12. Tiền vận chuyển:</span>
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
                        <span className="text-sm font-semibold text-orange-600">~ {Math.round(result.costs.donGiaSP).toLocaleString('vi-VN')} đ/Hộp</span>
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
                      <BoxImpositionViewer 
                        boxType={boxType} width={boxWidth} depth={boxDepth} height={boxHeight} 
                        cols={cols} rows={rows} hopMemDatabase={hopMemDatabase} 
                        muonSong={muonSong} muonNhip={muonNhip} daoTaiDan={daoTaiDan} 
                        parentW={currentPaperSize.w} parentH={currentPaperSize.h}
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


export default HopMemCalculator;
