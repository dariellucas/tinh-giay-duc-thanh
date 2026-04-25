import React from 'react';

const PIECE_GAP = 0.4; // khe giữa 2 mảnh trên bình bản / bản vẽ

function safeParse(val) {
  return parseFloat(String(val).replace(',', '.')) || 0;
}

/**
 * Đáy = Hông(Y)/2 + 2 ; chiều cao 1 mảnh = Gấp miệng + Cao(Z) + Đáy
 */
export function computeTuiGiayKhuonUnit(X, Y, Z, taiDan, gapMiec, soManh) {
  const dayH = Y / 2 + 2;
  const pieceH = gapMiec + Z + dayH;
  const pieceW = taiDan + X + Y;
  const fullW = taiDan + 2 * X + 2 * Y;

  if (soManh === '1_manh') {
    return {
      mode: '1_manh',
      singleW: fullW,
      singleH: pieceH,
      dayH,
      pieceW,
      pieceH,
      fullW,
      pieceGap: PIECE_GAP,
    };
  }
  return {
    mode: '2_manh',
    singleW: 2 * pieceW + PIECE_GAP,
    singleH: pieceH,
    dayH,
    pieceW,
    pieceH,
    fullW,
    pieceGap: PIECE_GAP,
  };
}

/** Đường gấp dọc trong 1 mảnh [Tai dán][Ngang X][Hông Y] — không kẻ mép phải */
function creasesVerticalPiece(x0, y0, pieceH, taiDan, X) {
  const xs = [x0 + taiDan, x0 + taiDan + X];
  return xs.map((x) => ({ x1: x, y1: y0, x2: x, y2: y0 + pieceH }));
}

function creasesHorizontal(y0, x0, pieceW, gapMiec, Z) {
  const y1 = y0 + gapMiec;
  const y2 = y0 + gapMiec + Z;
  return [
    { x1: x0, y1: y1, x2: x0 + pieceW, y2: y1 },
    { x1: x0, y1: y2, x2: x0 + pieceW, y2: y2 },
  ];
}

/** Giống FlatLayoutViewer hộp mềm (HopMemViewers) */
const FLAT_THEME = {
  stroke: '#333333',
  fill: '#ffffff',
  text: '#666666',
  dim: '#ef4444',
  dimLine: '#fca5a5',
  dimText: '#000000',
};

function fmtDim(num) {
  return Number(Math.abs(num).toFixed(2));
}

/**
 * Pad / khoảng dimension theo tinh thần HopMem (bám thành phẩm + tham số nhỏ), không bám bbox rộng.
 * dimDetail: mép hình → đường kích thước chi tiết; dimGap: khoảng giữa chi tiết và tổng (hẹp hơn 2× dimDetail).
 */
function computeTuiGiayFlatDimMetrics(X, Y, Z, gapMiec, taiDan) {
  const pad = Math.max(X, Y, Z, gapMiec, taiDan) * 0.15;
  const dimDetail = Math.min(pad * 1.5, 3.5);
  const dimGap = Math.min(pad * 0.55, 2.0);
  const tick = Math.min(Math.max(pad * 0.4, 0.12), dimDetail * 0.42, 1.6);
  return { pad, dimDetail, dimGap, tick };
}

/** Kích thước dọc (trái) + ngang (dưới) — cùng logic bố cục với HopMem FlatLayoutViewer */
function TuiGiayFlatDimensions({ minX, maxX, minY, maxY, vPoints, hPoints, vbW, dimDetail, dimGap, tick }) {
  const theme = FLAT_THEME;

  const vBaseX = minX - dimDetail;
  const vTotalX = vBaseX - dimGap;
  const hBaseY = maxY + dimDetail;
  const hTotalY = hBaseY + dimGap;

  const strokeW = vbW * 0.002;
  const dimFontSize = Math.max(vbW * 0.015, 0.5);

  return (
    <>
      <g stroke={theme.dim} fill={theme.dim} strokeWidth={strokeW * 0.8} textAnchor="end" dominantBaseline="middle">
        {vPoints.map((pt, i) => (
          <line
            key={`vExt-${i}`}
            x1={minX}
            y1={pt.y}
            x2={vBaseX - tick}
            y2={pt.y}
            stroke={theme.dimLine}
            strokeWidth={strokeW * 0.5}
            strokeDasharray="4,4"
          />
        ))}
        <line x1={vBaseX} y1={minY} x2={vBaseX} y2={maxY} stroke={theme.dim} />
        {vPoints.map((pt, i) => (
          <g key={`vTick-${i}`}>
            <line x1={vBaseX - tick} y1={pt.y} x2={vBaseX + tick} y2={pt.y} stroke={theme.dim} strokeWidth={strokeW * 1.5} />
            {i < vPoints.length - 1 && (
              <text
                x={vBaseX - tick * 1.5}
                y={(pt.y + vPoints[i + 1].y) / 2}
                fill={theme.dimText}
                stroke="none"
                fontSize={dimFontSize}
                fontWeight="normal"
              >
                {fmtDim(pt.val)}
              </text>
            )}
          </g>
        ))}
        <line x1={vTotalX} y1={minY} x2={vTotalX} y2={maxY} stroke={theme.dim} />
        <line x1={vTotalX - tick} y1={minY} x2={vTotalX + tick} y2={minY} stroke={theme.dim} strokeWidth={strokeW * 1.5} />
        <line x1={vTotalX - tick} y1={maxY} x2={vTotalX + tick} y2={maxY} stroke={theme.dim} strokeWidth={strokeW * 1.5} />
        <text
          x={vTotalX - tick * 1.5}
          y={(minY + maxY) / 2}
          fill={theme.dimText}
          stroke="none"
          fontSize={dimFontSize}
          fontWeight="normal"
        >
          {fmtDim(maxY - minY)}
        </text>
      </g>

      <g stroke={theme.dim} fill={theme.dim} strokeWidth={strokeW * 0.8} textAnchor="middle">
        {hPoints.map((pt, i) => (
          <line
            key={`hExt-${i}`}
            x1={pt.x}
            y1={maxY}
            x2={pt.x}
            y2={hBaseY + tick}
            stroke={theme.dimLine}
            strokeWidth={strokeW * 0.5}
            strokeDasharray="4,4"
          />
        ))}
        <line x1={minX} y1={hBaseY} x2={maxX} y2={hBaseY} stroke={theme.dim} />
        {hPoints.map((pt, i) => (
          <g key={`hTick-${i}`}>
            <line x1={pt.x} y1={hBaseY - tick} x2={pt.x} y2={hBaseY + tick} stroke={theme.dim} strokeWidth={strokeW * 1.5} />
            {i < hPoints.length - 1 && (
              <text
                x={(pt.x + hPoints[i + 1].x) / 2}
                y={hBaseY - tick * 1.2}
                fill={theme.dimText}
                stroke="none"
                fontSize={dimFontSize}
                fontWeight="normal"
              >
                {fmtDim(pt.val)}
              </text>
            )}
          </g>
        ))}
        <line x1={minX} y1={hTotalY} x2={maxX} y2={hTotalY} stroke={theme.dim} />
        <line x1={minX} y1={hTotalY - tick} x2={minX} y2={hTotalY + tick} stroke={theme.dim} strokeWidth={strokeW * 1.5} />
        <line x1={maxX} y1={hTotalY - tick} x2={maxX} y2={hTotalY + tick} stroke={theme.dim} strokeWidth={strokeW * 1.5} />
        <text
          x={(minX + maxX) / 2}
          y={hTotalY - tick * 1.2}
          fill={theme.dimText}
          stroke="none"
          fontSize={dimFontSize}
          fontWeight="normal"
        >
          {fmtDim(maxX - minX)}
        </text>
      </g>
    </>
  );
}

/** Một mảnh [Tai dán][Ngang][Hông] — nét gấp giống HopMem (stroke #333, nét đứt) */
function TuiGiayFlatPieceGroup({ x0, y0, pieceW, pieceH, taiDan, X, Y, Z, gapMiec, strokeW, faceLabel }) {
  const theme = FLAT_THEME;
  const creaseV = creasesVerticalPiece(x0, y0, pieceH, taiDan, X);
  const creaseH = creasesHorizontal(y0, x0, pieceW, gapMiec, Z);
  const outline = `M ${x0} ${y0} L ${x0 + pieceW} ${y0} L ${x0 + pieceW} ${y0 + pieceH} L ${x0} ${y0 + pieceH} Z`;
  const fontPanel = Math.min(strokeW * 80, Math.min(X, Y, Z) * 0.22);

  const panels = [
    { cx: x0 + taiDan / 2, cy: y0 + gapMiec + Z / 2, w: taiDan, h: Z, label: 'Tai dán' },
    { cx: x0 + taiDan + X / 2, cy: y0 + gapMiec / 2, w: X, h: gapMiec, label: 'Gấp miệng' },
    { cx: x0 + taiDan + X / 2, cy: y0 + gapMiec + Z / 2, w: X, h: Z, label: faceLabel },
    { cx: x0 + taiDan + X + Y / 2, cy: y0 + gapMiec + Z / 2, w: Y, h: Z, label: 'Hông' },
    { cx: x0 + taiDan + X / 2, cy: y0 + gapMiec + Z + (pieceH - gapMiec - Z) / 2, w: X, h: pieceH - gapMiec - Z, label: 'Đáy' },
  ];

  return (
    <g>
      <path d={outline} fill={theme.fill} stroke="none" />
      {[...creaseV, ...creaseH].map((line, i) => (
        <line
          key={`c-${x0}-${i}`}
          x1={line.x1}
          y1={line.y1}
          x2={line.x2}
          y2={line.y2}
          stroke={theme.stroke}
          strokeWidth={strokeW * 0.8}
          strokeDasharray={`${strokeW * 3},${strokeW * 3}`}
          strokeLinecap="round"
        />
      ))}
      <path d={outline} fill="none" stroke={theme.stroke} strokeWidth={strokeW} strokeLinejoin="round" />
      {panels.map((p, i) =>
        p.w > 0.05 && p.h > 0.05 ? (
          <text
            key={`p-${i}`}
            x={p.cx}
            y={p.cy}
            fill={theme.text}
            fontSize={Math.min(fontPanel, p.w * 0.18, p.h * 0.35)}
            fontWeight="700"
            textAnchor="middle"
            dominantBaseline="middle"
            opacity="0.6"
          >
            {p.label}
          </text>
        ) : null,
      )}
    </g>
  );
}

/** Flat layout — 3 trường hợp; viewBox & kích thước theo chuẩn HopMem */
function TuiGiayFlatLayoutViewer({
  width,
  depth,
  height,
  gapMiec: gapStr,
  taiDan: taiStr,
  soManh,
  matTui,
}) {
  const X = safeParse(width);
  const Y = safeParse(depth);
  const Z = safeParse(height);
  const gapMiec = safeParse(gapStr);
  const taiDan = safeParse(taiStr);

  if (X <= 0 || Y <= 0 || Z <= 0) return null;

  const dayH = Y / 2 + 2;
  const pieceH = gapMiec + Z + dayH;
  const pieceW = taiDan + X + Y;
  const fullW = taiDan + 2 * X + 2 * Y;
  const theme = FLAT_THEME;
  const { pad, dimDetail, dimGap, tick } = computeTuiGiayFlatDimMetrics(X, Y, Z, gapMiec, taiDan);
  const dimOuter = dimDetail + dimGap + tick * 2.5;

  let caption = '';
  let minX = 0;
  let maxX = 0;
  let minY = 0;
  let maxY = 0;
  let vPoints = [];
  let hPoints = [];

  if (soManh === '1_manh') {
    caption = 'Túi 1 mảnh — Ngang: Tai dán + Ngang×2 + Hông×2 ; Cao: Gấp miệng + Cao + Đáy (Y/2+2)';
    minX = 0;
    minY = 0;
    maxX = fullW;
    maxY = pieceH;
    vPoints = [
      { y: minY, val: gapMiec },
      { y: minY + gapMiec, val: Z },
      { y: minY + gapMiec + Z, val: dayH },
      { y: maxY, val: 0 },
    ];
    hPoints = [
      { x: minX, val: taiDan },
      { x: minX + taiDan, val: X },
      { x: minX + taiDan + X, val: Y },
      { x: minX + taiDan + X + Y, val: X },
      { x: minX + taiDan + 2 * X + Y, val: Y },
      { x: maxX, val: 0 },
    ];
  } else if (matTui === 'giong_nhau') {
    caption = 'Túi 2 mảnh — Mặt giống nhau (1 mảnh đại diện): Tai dán + Ngang + Hông';
    minX = 0;
    minY = 0;
    maxX = pieceW;
    maxY = pieceH;
    vPoints = [
      { y: minY, val: gapMiec },
      { y: minY + gapMiec, val: Z },
      { y: minY + gapMiec + Z, val: dayH },
      { y: maxY, val: 0 },
    ];
    hPoints = [
      { x: minX, val: taiDan },
      { x: minX + taiDan, val: X },
      { x: minX + taiDan + X, val: Y },
      { x: maxX, val: 0 },
    ];
  } else {
    caption = 'Túi 2 mảnh — Mặt khác nhau (cả 2 mảnh): mỗi mảnh Tai dán + Ngang + Hông';
    minX = 0;
    minY = 0;
    maxX = 2 * pieceW + PIECE_GAP;
    maxY = pieceH;
    const x2 = pieceW + PIECE_GAP;
    vPoints = [
      { y: minY, val: gapMiec },
      { y: minY + gapMiec, val: Z },
      { y: minY + gapMiec + Z, val: dayH },
      { y: maxY, val: 0 },
    ];
    hPoints = [
      { x: 0, val: taiDan },
      { x: taiDan, val: X },
      { x: taiDan + X, val: Y },
      { x: x2, val: taiDan },
      { x: x2 + taiDan, val: X },
      { x: x2 + taiDan + X, val: Y },
      { x: maxX, val: 0 },
    ];
  }

  const vbX = minX - dimOuter * 2.5;
  const vbY = minY - pad;
  const vbW = maxX - vbX + pad;
  const vbH = maxY + dimOuter * 2.5 - vbY + pad;
  const strokeW = vbW * 0.002;

  let body = null;
  if (soManh === '1_manh') {
    const outline = `M ${minX} ${minY} L ${maxX} ${minY} L ${maxX} ${maxY} L ${minX} ${maxY} Z`;
    const vLines = [minX + taiDan, minX + taiDan + X, minX + taiDan + X + Y, minX + taiDan + 2 * X + Y];
    const hY = [minY + gapMiec, minY + gapMiec + Z];
    body = (
      <g>
        <path d={outline} fill={theme.fill} stroke="none" />
        {vLines.map((vx, i) => (
          <line
            key={`v-${i}`}
            x1={vx}
            y1={minY}
            x2={vx}
            y2={maxY}
            stroke={theme.stroke}
            strokeWidth={strokeW * 0.8}
            strokeDasharray={`${strokeW * 3},${strokeW * 3}`}
            strokeLinecap="round"
          />
        ))}
        {hY.map((hy, i) => (
          <line
            key={`h-${i}`}
            x1={minX}
            y1={hy}
            x2={maxX}
            y2={hy}
            stroke={theme.stroke}
            strokeWidth={strokeW * 0.8}
            strokeDasharray={`${strokeW * 3},${strokeW * 3}`}
            strokeLinecap="round"
          />
        ))}
        <path d={outline} fill="none" stroke={theme.stroke} strokeWidth={strokeW} strokeLinejoin="round" />
        {[
          { cx: minX + taiDan + X / 2, cy: minY + gapMiec / 2, w: X, h: gapMiec, label: 'Gấp miệng' },
          { cx: minX + taiDan + X / 2, cy: minY + gapMiec + Z / 2, w: X, h: Z, label: 'Mặt 1' },
          { cx: minX + taiDan + X + Y / 2, cy: minY + gapMiec + Z / 2, w: Y, h: Z, label: 'Hông' },
          { cx: minX + taiDan + X + Y + X / 2, cy: minY + gapMiec + Z / 2, w: X, h: Z, label: 'Mặt 2' },
          { cx: minX + taiDan + 2 * X + Y + Y / 2, cy: minY + gapMiec + Z / 2, w: Y, h: Z, label: 'Hông' },
          { cx: minX + taiDan / 2, cy: minY + gapMiec + Z / 2, w: taiDan, h: Z, label: 'Tai dán' },
          { cx: minX + taiDan + X, cy: minY + gapMiec + Z + dayH / 2, w: 2 * X + 2 * Y, h: dayH, label: 'Đáy' },
        ].map((p, i) => (
          <text
            key={`lb-${i}`}
            x={p.cx}
            y={p.cy}
            fill={theme.text}
            fontSize={Math.min((maxX - minX) * 0.025, p.w * 0.15, p.h * 0.35)}
            fontWeight="700"
            textAnchor="middle"
            dominantBaseline="middle"
            opacity="0.6"
          >
            {p.label}
          </text>
        ))}
      </g>
    );
  } else if (matTui === 'giong_nhau') {
    body = <TuiGiayFlatPieceGroup x0={0} y0={0} pieceW={pieceW} pieceH={pieceH} taiDan={taiDan} X={X} Y={Y} Z={Z} gapMiec={gapMiec} strokeW={strokeW} faceLabel="Mặt" />;
  } else {
    body = (
      <g>
        <TuiGiayFlatPieceGroup x0={0} y0={0} pieceW={pieceW} pieceH={pieceH} taiDan={taiDan} X={X} Y={Y} Z={Z} gapMiec={gapMiec} strokeW={strokeW} faceLabel="Mặt 1" />
        <TuiGiayFlatPieceGroup
          x0={pieceW + PIECE_GAP}
          y0={0}
          pieceW={pieceW}
          pieceH={pieceH}
          taiDan={taiDan}
          X={X}
          Y={Y}
          Z={Z}
          gapMiec={gapMiec}
          strokeW={strokeW}
          faceLabel="Mặt 2"
        />
      </g>
    );
  }

  return (
    <div className="w-full bg-[#f8f9fa] border border-dashed border-[#cbd5e1] rounded-xl overflow-hidden relative shadow-inner p-4 flex flex-col justify-center items-center mt-2">
      <p className="text-xs text-slate-600 text-center mb-2 px-2 leading-relaxed">{caption}</p>
      <svg viewBox={`${vbX} ${vbY} ${vbW} ${vbH}`} className="w-full h-auto max-h-[600px] drop-shadow-sm">
        <TuiGiayFlatDimensions
          minX={minX}
          maxX={maxX}
          minY={minY}
          maxY={maxY}
          vPoints={vPoints}
          hPoints={hPoints}
          vbW={vbW}
          dimDetail={dimDetail}
          dimGap={dimGap}
          tick={tick}
        />
        <g>{body}</g>
      </svg>
    </div>
  );
}

/** Một đơn vị bình bản (1 túi trên khuôn): path + crease trong hệ trục 0..singleW, 0..singleH */
function buildBagUnitGeometry(X, Y, Z, taiDan, gapMiec, spec) {
  const { mode, singleW, singleH, dayH, pieceW, pieceH, pieceGap } = spec;
  const lines = [];
  let outline = '';

  if (mode === '1_manh') {
    outline = `M 0 0 L ${singleW} 0 L ${singleW} ${singleH} L 0 ${singleH} Z`;
    const vx = [taiDan, taiDan + X, taiDan + X + Y, taiDan + 2 * X + Y];
    vx.forEach((x) => lines.push({ x1: x, y1: 0, x2: x, y2: singleH }));
    lines.push({ x1: 0, y1: gapMiec, x2: singleW, y2: gapMiec });
    lines.push({ x1: 0, y1: gapMiec + Z, x2: singleW, y2: gapMiec + Z });
  } else {
    outline = `M 0 0 L ${singleW} 0 L ${singleW} ${singleH} L 0 ${singleH} Z`;
    const addPiece = (xOff) => {
      creasesVerticalPiece(xOff, 0, pieceH, taiDan, X).forEach((l) => lines.push(l));
      creasesHorizontal(0, xOff, pieceW, gapMiec, Z).forEach((l) => lines.push(l));
    };
    addPiece(0);
    addPiece(pieceW + pieceGap);
  }

  return { outlinePath: outline, creaseLines: lines, minX: 0, maxX: singleW, minY: 0, maxY: singleH, dayH };
}

function TuiGiayImpositionViewer({
  width,
  depth,
  height,
  gapMiec: gapStr,
  taiDan: taiStr,
  soManh,
  cols,
  rows,
  muonSong,
  muonNhip,
  parentW,
  parentH,
}) {
  const X = safeParse(width);
  const Y = safeParse(depth);
  const Z = safeParse(height);
  const gapMiec = safeParse(gapStr);
  const taiDan = safeParse(taiStr);
  const cCols = parseInt(cols, 10) || 1;
  const cRows = parseInt(rows, 10) || 1;

  if (X <= 0 || Y <= 0 || Z <= 0 || cCols <= 0 || cRows <= 0) return null;

  const spec = computeTuiGiayKhuonUnit(X, Y, Z, taiDan, gapMiec, soManh);
  const { singleW, singleH } = spec;
  const geom = buildBagUnitGeometry(X, Y, Z, taiDan, gapMiec, spec);
  const { outlinePath, creaseLines } = geom;

  const gap = muonSong ? 0 : 0.4;
  const overlapX = 0;
  const overlapY = 0;
  const stepW = singleW - overlapX + gap;
  const stepH = singleH - overlapY + gap;

  const totalW = singleW + (cCols - 1) * stepW;
  const totalH = singleH + (cRows - 1) * stepH;

  let pW = parentW || 0;
  let pH = parentH || 0;

  if (pW > 0 && pH > 0) {
    const paperLong = Math.max(pW, pH);
    const paperShort = Math.min(pW, pH);
    if (totalW >= totalH) {
      pW = paperLong;
      pH = paperShort;
    } else {
      pW = paperShort;
      pH = paperLong;
    }
  }

  const paperX = pW > 0 ? (totalW - pW) / 2 : 0;
  const paperY = pH > 0 ? (totalH - pH) / 2 : 0;

  const finalW = Math.max(totalW, pW);
  const finalH = Math.max(totalH, pH);
  const pad = Math.max(finalW, finalH) * 0.1;

  const minVB_X = Math.min(0, paperX) - pad;
  const minVB_Y = Math.min(0, paperY) - pad;
  const maxVB_X = Math.max(totalW, paperX + pW) + pad;
  const maxVB_Y = Math.max(totalH, paperY + pH) + pad;

  const vbX = minVB_X;
  const vbY = minVB_Y;
  const vbW = maxVB_X - minVB_X;
  const vbH = maxVB_Y - minVB_Y;

  const strokeW = vbW * 0.0015;
  const gripperSize = muonNhip ? 0 : 1.0;
  const MARGIN = 0.2;
  const theme = {
    stroke: '#333333',
    fill: '#ffffff',
    crease: '#333333',
    dimText: '#000000',
    dimLine: '#fca5a5',
    dim: '#ef4444',
  };

  const fmt = (num) => Number(Math.abs(num).toFixed(2));

  return (
    <div className="w-full bg-[#f8f9fa] border border-dashed border-[#cbd5e1] rounded-xl overflow-hidden relative shadow-inner p-4 flex flex-col justify-center items-center mt-2">
      <p className="text-[11px] text-slate-500 mb-2 text-center">
        {spec.mode === '1_manh'
          ? '1 bát = 1 túi (1 mảnh trên khuôn)'
          : '1 bát = 1 túi (2 mảnh cạnh nhau trên khuôn)'}
      </p>
      <svg viewBox={`${vbX} ${vbY} ${vbW} ${vbH}`} className="w-full h-auto max-h-[600px] drop-shadow-sm">
        {pW > 0 && pH > 0 && (
          <g>
            <rect x={paperX} y={paperY} width={pW} height={pH} fill="#ffffff" stroke="#94a3b8" strokeWidth={strokeW * 2} />
            {(() => {
              const isHorizontalLong = pW >= pH;
              return (
                <g>
                  {gripperSize > 0 && (
                    <g>
                      {isHorizontalLong ? (
                        <rect x={paperX} y={paperY + pH - gripperSize} width={pW} height={gripperSize} fill="#1e293b" opacity="0.8" />
                      ) : (
                        <rect x={paperX + pW - gripperSize} y={paperY} width={gripperSize} height={pH} fill="#1e293b" opacity="0.8" />
                      )}
                      <text
                        x={isHorizontalLong ? paperX + pW / 2 : paperX + pW - gripperSize / 2}
                        y={isHorizontalLong ? paperY + pH - gripperSize / 2 : paperY + pH / 2}
                        fill="white"
                        fontSize={Math.max(vbW * 0.015, 0.5) * 0.8}
                        textAnchor="middle"
                        dominantBaseline="middle"
                        transform={isHorizontalLong ? '' : `rotate(-90 ${paperX + pW - gripperSize / 2} ${paperY + pH / 2})`}
                      >
                        NHÍP ({gripperSize * 10}mm)
                      </text>
                    </g>
                  )}
                  <rect
                    x={paperX + MARGIN}
                    y={paperY + MARGIN}
                    width={isHorizontalLong ? pW - MARGIN * 2 : pW - MARGIN - (gripperSize > 0 ? gripperSize : MARGIN)}
                    height={isHorizontalLong ? pH - MARGIN - (gripperSize > 0 ? gripperSize : MARGIN) : pH - MARGIN * 2}
                    fill="none"
                    stroke="#fca5a5"
                    strokeWidth={strokeW}
                    strokeDasharray={`${strokeW * 4},${strokeW * 4}`}
                  />
                </g>
              );
            })()}
            <text
              x={paperX + pW / 2}
              y={paperY - strokeW * 6}
              fill="#64748b"
              fontSize={Math.max(vbW * 0.015, 0.5)}
              fontWeight="bold"
              textAnchor="middle"
              dominantBaseline="auto"
              opacity="0.8"
            >
              GIẤY IN: {pW} x {pH} cm
            </text>
          </g>
        )}

        <path d={`M 0 -${pad * 0.3} L ${totalW} -${pad * 0.3}`} stroke={theme.dimLine} strokeWidth={strokeW} />
        <line x1={0} y1={-pad * 0.4} x2={0} y2={-pad * 0.2} stroke={theme.dim} strokeWidth={strokeW} />
        <line x1={totalW} y1={-pad * 0.4} x2={totalW} y2={-pad * 0.2} stroke={theme.dim} strokeWidth={strokeW} />
        <text x={totalW / 2} y={-pad * 0.45} fill={theme.dimText} fontSize={Math.max(vbW * 0.015, 0.5)} textAnchor="middle">
          Ngang cụm khuôn: {fmt(totalW)} cm
        </text>

        <path d={`M -${pad * 0.3} 0 L -${pad * 0.3} ${totalH}`} stroke={theme.dimLine} strokeWidth={strokeW} />
        <line x1={-pad * 0.4} y1={0} x2={-pad * 0.2} y2={0} stroke={theme.dim} strokeWidth={strokeW} />
        <line x1={-pad * 0.4} y1={totalH} x2={-pad * 0.2} y2={totalH} stroke={theme.dim} strokeWidth={strokeW} />
        <text
          x={-pad * 0.45}
          y={totalH / 2}
          fill={theme.dimText}
          fontSize={Math.max(vbW * 0.015, 0.5)}
          textAnchor="middle"
          transform={`rotate(-90, -${pad * 0.45}, ${totalH / 2})`}
        >
          Cao cụm khuôn: {fmt(totalH)} cm
        </text>

        {Array.from({ length: cRows }).map((_, r) =>
          Array.from({ length: cCols }).map((_, col) => {
            const tx = col * stepW;
            const ty = r * stepH;
            const batId = r * cCols + col + 1;
            return (
              <g transform={`translate(${tx}, ${ty})`} key={`tui-${r}-${col}`}>
                <path d={outlinePath} fill={theme.fill} stroke="none" />
                {creaseLines.map((line, i) => (
                  <line
                    key={`cr-${i}`}
                    x1={line.x1}
                    y1={line.y1}
                    x2={line.x2}
                    y2={line.y2}
                    stroke={theme.crease}
                    strokeWidth={strokeW * 0.8}
                    strokeDasharray={`${strokeW * 3},${strokeW * 3}`}
                    strokeLinecap="round"
                  />
                ))}
                <path d={outlinePath} fill="none" stroke={theme.stroke} strokeWidth={strokeW} strokeLinejoin="round" />
                <text
                  x={singleW / 2}
                  y={singleH / 2}
                  fill="#3b82f6"
                  opacity="0.14"
                  fontSize={Math.min(singleW, singleH) * 0.35}
                  fontWeight="bold"
                  textAnchor="middle"
                  dominantBaseline="middle"
                >
                  {batId}
                </text>
              </g>
            );
          }),
        )}
      </svg>
    </div>
  );
}

export { TuiGiayFlatLayoutViewer, TuiGiayImpositionViewer };
