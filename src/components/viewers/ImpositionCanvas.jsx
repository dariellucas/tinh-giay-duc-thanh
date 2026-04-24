import React from 'react';

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

export default ImpositionCanvas;
