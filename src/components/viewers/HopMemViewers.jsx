import React from 'react';
import { Box, ChevronDown, ChevronRight, Layers, Sparkles } from 'lucide-react';

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
function getHopMemGeometry(boxType, X, Y, Z, hopMemDatabase, dimensionOverrides) {
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
          // Ưu tiên field đúng nghĩa (taiGai), fallback napHop để tương thích dữ liệu cũ
          taiGai: parseFloat(row.taiGai ?? row.napHop) || fallback.taiGai, 
          khoaDayGai: parseFloat(row.khoaDayGai) || fallback.khoaDayGai,
          khoaDayCheo: parseFloat(row.khoaDayCheo) || fallback.khoaDayCheo
        };
      }
    }
    return fallback;
  };

  const boxConfig = getBoxConfig(X, hopMemDatabase);
  let taiGai = boxConfig.taiGai;
  let taiDan = boxConfig.taiDan;
  if (dimensionOverrides) {
    if (typeof dimensionOverrides.taiGai === 'number' && !Number.isNaN(dimensionOverrides.taiGai) && dimensionOverrides.taiGai >= 0) {
      taiGai = dimensionOverrides.taiGai;
    }
    if (typeof dimensionOverrides.taiDan === 'number' && !Number.isNaN(dimensionOverrides.taiDan) && dimensionOverrides.taiDan >= 0) {
      taiDan = dimensionOverrides.taiDan;
    }
  }

  const thuGoc = 0.2;
  const taiPhuH = Math.min((Y + taiGai) / 2, X / 2);
  const c = thuGoc; // Độ vát góc (chamfer) cho các tai gài, tai dán

  let outlinePath = "";
  let creaseLines = [];
  let panels = [];
  let vPoints = [];
  let minY = 0, maxY = 0;
  let overlapX = 0; // Thêm biến lưu khoảng cách lồng ghép ngang
  let overlapY = 0; // Thêm biến lưu khoảng cách lồng ghép dọc

  const minX = -taiDan;
  const maxX = 2*X + 2*Y;

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
    overlapY = 0; // Khôi phục khoảng cách lồng ghép theo trục Y về 0 theo yêu cầu

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
    overlapY = Y + taiGai; // Nắp cài có thể lồng vào phần trống dưới mặt trước

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
  } else if (boxType === 'nap_cai_day_moc') {
    const dayKhoaH = Y / 2 + taiGai;
    const taiDayH = dayKhoaH * 0.75; // 75% height của đáy theo yêu cầu
    minY = -Y - taiGai;
    maxY = Z + dayKhoaH;
    overlapY = Y + taiGai; // Nắp cài có thể lồng vào phần trống dưới mặt trước

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

  return { outlinePath, creaseLines, panels, vPoints, hPoints, minX, maxX, minY, maxY, overlapX, overlapY, taiDan };
}

function getHopMemGeometryDao(boxType, X, Y, Z, hopMemDatabase, dimensionOverrides) {
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
          // Ưu tiên field đúng nghĩa (taiGai), fallback napHop để tương thích dữ liệu cũ
          taiGai: parseFloat(row.taiGai ?? row.napHop) || fallback.taiGai,
          khoaDayGai: parseFloat(row.khoaDayGai) || fallback.khoaDayGai,
          khoaDayCheo: parseFloat(row.khoaDayCheo) || fallback.khoaDayCheo
        };
      }
    }
    return fallback;
  };

  const boxConfig = getBoxConfig(X, hopMemDatabase);
  let taiGai = boxConfig.taiGai;
  let taiDan = boxConfig.taiDan;
  if (dimensionOverrides) {
    if (typeof dimensionOverrides.taiGai === 'number' && !Number.isNaN(dimensionOverrides.taiGai) && dimensionOverrides.taiGai >= 0) {
      taiGai = dimensionOverrides.taiGai;
    }
    if (typeof dimensionOverrides.taiDan === 'number' && !Number.isNaN(dimensionOverrides.taiDan) && dimensionOverrides.taiDan >= 0) {
      taiDan = dimensionOverrides.taiDan;
    }
  }
  const thuGoc = 0.2;
  const taiPhuH = Math.min((Y + taiGai) / 2, X / 2);
  const c = thuGoc;

  if (boxType === 'nap_cai_day_khoa' || boxType === 'nap_cai_day_moc') {
    const dayKhoaH = Y / 2 + taiGai;
    const taiDayH = boxType === 'nap_cai_day_moc' ? dayKhoaH * 0.75 : dayKhoaH;
    
    const outlinePath = `
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
      L ${2*Y + X - c} ${Z + taiDayH}
      L ${Y + X + c} ${Z + taiDayH}
      L ${Y + X} ${Z}
      L ${Y + X} ${Z + dayKhoaH}
      L ${Y} ${Z + dayKhoaH}
      L ${Y} ${Z}
      L ${Y - c} ${Z + taiDayH}
      L ${c} ${Z + taiDayH}
      L 0 ${Z}
      Z
    `;

    const creaseLines = [
      { x1: Y, y1: 0, x2: Y, y2: Z },
      { x1: Y + X, y1: 0, x2: Y + X, y2: Z },
      { x1: 2*Y + X, y1: 0, x2: 2*Y + X, y2: Z },
      { x1: 2*Y + 2*X, y1: 0, x2: 2*Y + 2*X, y2: Z },
      { x1: 0, y1: 0, x2: Y, y2: 0 },
      { x1: Y, y1: 0, x2: Y + X, y2: 0 },
      { x1: Y + X, y1: 0, x2: 2*Y + X, y2: 0 },
      { x1: Y, y1: -Y, x2: Y + X, y2: -Y },
      { x1: 0, y1: Z, x2: Y, y2: Z },
      { x1: Y, y1: Z, x2: Y + X, y2: Z },
      { x1: Y + X, y1: Z, x2: 2*Y + X, y2: Z },
      { x1: 2*Y + X, y1: Z, x2: 2*Y + 2*X, y2: Z }
    ];

    return { 
      outlinePath, 
      creaseLines, 
      minX: 0, 
      maxX: 2*X + 2*Y + taiDan, 
      minY: -Y - taiGai, 
      maxY: Z + dayKhoaH, 
      taiDan 
    };
  }
  return null;
}

// ==========================================
// COMPONENT VẼ TRẢI PHẲNG (FLAT LAYOUT SVG)
// ==========================================
function FlatLayoutViewer({ boxType, width, depth, height, hopMemDatabase, dimensionOverrides }) {
  const safeParse = (val) => parseFloat(String(val).replace(',', '.')) || 0;
  const X = safeParse(width);
  const Y = safeParse(depth);
  const Z = safeParse(height);

  if (X <= 0 || Y <= 0 || Z <= 0) {
    return null; // Không vẽ nếu chưa nhập đủ kích thước
  }

  const geom = getHopMemGeometry(boxType, X, Y, Z, hopMemDatabase, dimensionOverrides);

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
function BoxImpositionViewer({ boxType, width, depth, height, cols, rows, hopMemDatabase, muonSong, muonNhip, daoTaiDan, parentW, parentH, dimensionOverrides }) {
  const safeParse = (val) => parseFloat(String(val).replace(',', '.')) || 0;
  const X = safeParse(width);
  const Y = safeParse(depth);
  const Z = safeParse(height);
  const cCols = parseInt(cols) || 1;
  const cRows = parseInt(rows) || 1;

  if (X <= 0 || Y <= 0 || Z <= 0 || cCols <= 0 || cRows <= 0) return null;

  const geom = getHopMemGeometry(boxType, X, Y, Z, hopMemDatabase, dimensionOverrides);
  if (!geom) return null;

  const geomDao = getHopMemGeometryDao(boxType, X, Y, Z, hopMemDatabase, dimensionOverrides);

  const { outlinePath, creaseLines, minX, maxX, minY, maxY, overlapX, overlapY, taiDan } = geom;
  
  const singleW = maxX - minX;
  const singleH = maxY - minY;
  const gap = muonSong ? 0 : 0.4; // Khoảng cách khe hở giữa các hộp (cm) - Nếu mượn sông thì gap = 0

  // Tính toán bước nhảy (stride) có tính đến lồng ghép âm
  const stepW = singleW - overlapX + gap;
  const stepH = singleH - overlapY + gap;

  let extraW = 0;
  // CẬP NHẬT 1: Thay đổi điều kiện từ cRows === 2 thành cRows >= 2 và loại bỏ cCols === 1 để áp dụng cho nhiều cột
  if ((boxType === 'nap_cai_day_khoa' || boxType === 'nap_cai_day_moc') && cRows >= 2) {
    if (daoTaiDan && geomDao) {
      extraW = 0;
    } else {
      extraW = Math.max(0, Y - taiDan);
    }
  }

  const totalW = singleW + (cCols - 1) * stepW + extraW;
  
  // Xử lý tính toán toạ độ Y động cho từng dòng
  const rowYPositions = [];
  let currentY = 0;
  for (let r = 0; r < cRows; r++) {
    if (r === 0) {
      rowYPositions.push(currentY);
    } else {
      // Loại bỏ giới hạn cCols === 1 để tính Y động cho ma trận nhiều cột
      if ((boxType === 'nap_cai_day_khoa' || boxType === 'nap_cai_day_moc')) {
        if (r % 2 === 1) {
          // Bát lẻ (vd r=1): Giao diện Nắp gặp Nắp -> lồng ghép sâu được
          currentY += singleH - overlapY + gap;
        } else {
          // Bát chẵn (vd r=2): Giao diện Đáy gặp Đáy -> đối đầu nhau (chạm mũi), không lồng ghép
          currentY += singleH + gap;
        }
      } else {
        currentY += stepH;
      }
      rowYPositions.push(currentY);
    }
  }
  const totalH = cRows > 0 ? rowYPositions[cRows - 1] + singleH : singleH;

  let pW = parentW || 0;
  let pH = parentH || 0;

  // Tự động xoay giấy cho khớp với cụm khuôn (mô phỏng thợ xếp giấy)
  if (pW > 0 && pH > 0) {
      const paperLong = Math.max(pW, pH);
      const paperShort = Math.min(pW, pH);
      if (totalW >= totalH) { pW = paperLong; pH = paperShort; }
      else { pW = paperShort; pH = paperLong; }
  }

  // Căn giữa giấy in so với cụm khuôn
  const paperX = pW > 0 ? (totalW - pW) / 2 : 0;
  const paperY = pH > 0 ? (totalH - pH) / 2 : 0;

  const finalW = Math.max(totalW, pW);
  const finalH = Math.max(totalH, pH);
  const pad = Math.max(finalW, finalH) * 0.1;

  // Tính toán giới hạn ViewBox ôm trọn cả cụm khuôn và giấy in
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
    stroke: "#333333",
    fill: "#ffffff",
    crease: "#94a3b8",
    dimText: "#475569",
    dimLine: "#64748b"
  };

  const fmt = (num) => Number(Math.abs(num).toFixed(2));

  return (
    <div className="w-full bg-[#f8f9fa] border border-dashed border-[#cbd5e1] rounded-xl overflow-hidden relative shadow-inner p-4 flex flex-col justify-center items-center mt-2">
      <svg viewBox={`${vbX} ${vbY} ${vbW} ${vbH}`} className="w-full h-auto max-h-[600px] drop-shadow-sm">
        
        {/* Vẽ Khung Giấy In (Nằm dưới cùng) */}
        {pW > 0 && pH > 0 && (
          <g>
            {/* Nền giấy trắng, viền liền */}
            <rect x={paperX} y={paperY} width={pW} height={pH} fill="#ffffff" stroke="#94a3b8" strokeWidth={strokeW * 2} />
            
            {/* Xác định cạnh dài và vẽ Nhíp, Vùng an toàn */}
            {(() => {
              const isHorizontalLong = pW >= pH;
              return (
                <g>
                  {/* Vẽ Nhíp */}
                  {gripperSize > 0 && (
                    <g>
                      {isHorizontalLong ? (
                        <rect x={paperX} y={paperY + pH - gripperSize} width={pW} height={gripperSize} fill="#1e293b" opacity="0.8"/>
                      ) : (
                        <rect x={paperX + pW - gripperSize} y={paperY} width={gripperSize} height={pH} fill="#1e293b" opacity="0.8"/>
                      )}
                      
                      <text 
                        x={isHorizontalLong ? paperX + pW / 2 : paperX + pW - (gripperSize/2)} 
                        y={isHorizontalLong ? paperY + pH - (gripperSize/2) : paperY + pH / 2} 
                        fill="white" 
                        fontSize={Math.max(vbW * 0.015, 0.5) * 0.8} 
                        textAnchor="middle" 
                        dominantBaseline="middle"
                        transform={isHorizontalLong ? "" : `rotate(-90 ${paperX + pW - (gripperSize/2)} ${paperY + pH / 2})`}
                      >
                        NHÍP ({gripperSize * 10}mm)
                      </text>
                    </g>
                  )}

                  {/* Vùng in an toàn (Lề) */}
                  <rect 
                    x={paperX + MARGIN} 
                    y={paperY + MARGIN} 
                    width={isHorizontalLong ? pW - (MARGIN * 2) : pW - MARGIN - (gripperSize > 0 ? gripperSize : MARGIN)} 
                    height={isHorizontalLong ? pH - MARGIN - (gripperSize > 0 ? gripperSize : MARGIN) : pH - (MARGIN * 2)} 
                    fill="none" 
                    stroke="#fca5a5" 
                    strokeWidth={strokeW} 
                    strokeDasharray={`${strokeW*4},${strokeW*4}`} 
                  />
                </g>
              );
            })()}
            
            <text x={paperX + pW/2} y={paperY - strokeW * 6} fill="#64748b" fontSize={Math.max(vbW * 0.015, 0.5)} fontWeight="bold" textAnchor="middle" dominantBaseline="auto" opacity="0.8">GIẤY IN: {pW} x {pH} cm</text>
          </g>
        )}

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
            
            const isRotatedRow = (boxType === 'nap_cai_day_khoa' || boxType === 'nap_cai_day_moc') && cRows >= 2 && r % 2 === 0;
            const useDao = daoTaiDan && isRotatedRow && geomDao;
            
            const currentGeom = useDao ? geomDao : geom;
            const cMinX = currentGeom.minX;
            const cMaxX = currentGeom.maxX;
            const cMinY = currentGeom.minY;
            const cMaxY = currentGeom.maxY;

            let tx = col * stepW - cMinX;
            const ty = rowYPositions[r] - cMinY;
            const batId = r * cCols + col + 1;
            
            if ((boxType === 'nap_cai_day_khoa' || boxType === 'nap_cai_day_moc') && cRows >= 2) {
              if (daoTaiDan && geomDao) {
                 if (r % 2 === 1) {
                    tx = col * stepW + taiDan;
                 } else {
                    tx = col * stepW;
                 }
              } else {
                 if (r % 2 === 1) {
                    tx += (Y - taiDan);
                 }
              }
            }

            let transformStr = `translate(${tx}, ${ty})`;
            
            if (isRotatedRow) {
              const cx = (cMinX + cMaxX) / 2;
              const cy = (cMinY + cMaxY) / 2;
              transformStr += ` translate(${cx}, ${cy}) scale(-1, -1) translate(${-cx}, ${-cy})`;
            }

            return (
              <g transform={transformStr} key={`box-${r}-${col}`}>
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
                <text x={(cMinX+cMaxX)/2} y={(cMinY+cMaxY)/2} fill="#3b82f6" opacity="0.15" fontSize={Math.min(singleW, singleH)*0.4} fontWeight="bold" textAnchor="middle" dominantBaseline="middle">
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


export { Box3DViewer, FlatLayoutViewer, BoxImpositionViewer, getHopMemGeometry, getHopMemGeometryDao };
