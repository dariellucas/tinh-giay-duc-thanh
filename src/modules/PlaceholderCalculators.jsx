import React from 'react';
import { Book, Mail, StickyNote } from 'lucide-react';

function VoCalculator() {
  return <div className="bg-white border border-slate-200 p-10 rounded-2xl flex flex-col items-center justify-center text-slate-400 h-full min-h-[400px]">
    <Book size={48} className="mb-4 text-indigo-300"/><p className="text-lg font-medium text-slate-600">Module V?</p><p className="text-sm">�ang ph�t tri?n d?nh m?c in ru?t + b�a + d�ng g�y...</p>
  </div>;
}

function PhongBiCalculator() {
  return <div className="bg-white border border-slate-200 p-10 rounded-2xl flex flex-col items-center justify-center text-slate-400 h-full min-h-[400px]">
    <Mail size={48} className="mb-4 text-sky-300"/><p className="text-lg font-medium text-slate-600">Module Phong B�</p><p className="text-sm">�ang ph�t tri?n form ti�u chu?n phong b� A6, A5, A4, t�nh c�ng b?, d�n keo ch?...</p>
  </div>;
}

function DecalCalculator() {
  return <div className="bg-white border border-slate-200 p-10 rounded-2xl flex flex-col items-center justify-center text-slate-400 h-full min-h-[400px]">
    <StickyNote size={48} className="mb-4 text-emerald-300"/><p className="text-lg font-medium text-slate-600">Module Decal</p><p className="text-sm">�ang ph�t tri?n quy t?c b�nh b?n b? d?-mi, b? l� x�...</p>
  </div>;
}

export { VoCalculator, PhongBiCalculator, DecalCalculator };
