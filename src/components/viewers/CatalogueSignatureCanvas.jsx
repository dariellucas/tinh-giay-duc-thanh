import React from 'react';
import { AlertCircle, FileText, Printer } from 'lucide-react';

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

export default CatalogueSignatureCanvas;
