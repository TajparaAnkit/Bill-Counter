import React from 'react';
import { InvoiceTemplateId } from '../../types';

// Tiny schematic preview of an invoice design, for the template pickers.
const Bar: React.FC<{ w: string; h?: number; c?: string; className?: string }> = ({ w, h = 3, c = '#cbd5e1', className = '' }) => (
  <span className={`block rounded-sm ${className}`} style={{ width: w, height: h, background: c }} />
);

export const TemplateThumb: React.FC<{ id: InvoiceTemplateId; color: string }> = ({ id, color }) => {
  if (id === 'thermal80' || id === 'thermal58') {
    return (
      <div className="h-full flex justify-center bg-slate-100 py-2">
        <div className={`bg-white shadow-sm h-full flex flex-col items-center gap-1 px-1.5 pt-2 ${id === 'thermal58' ? 'w-9' : 'w-12'}`}>
          <Bar w="70%" c="#334155" />
          <Bar w="50%" />
          <span className="block w-full border-t border-dashed border-slate-300 my-0.5" />
          {[0, 1, 2].map((i) => (
            <span key={i} className="flex w-full justify-between">
              <Bar w="45%" />
              <Bar w="25%" />
            </span>
          ))}
          <span className="block w-full border-t border-dashed border-slate-300 my-0.5" />
          <span className="flex w-full justify-between">
            <Bar w="35%" c="#334155" />
            <Bar w="30%" c="#334155" />
          </span>
          <span className="mt-1 block w-4 h-4 bg-slate-300" />
        </div>
      </div>
    );
  }
  return (
    <div className="h-full bg-slate-100 p-2 flex justify-center">
      <div className="bg-white shadow-sm w-full max-w-[92px] h-full flex flex-col overflow-hidden">
        {id === 'modern' ? (
          <div className="px-1.5 py-1.5 flex justify-between items-start" style={{ background: color }}>
            <Bar w="40%" c="rgba(255,255,255,.9)" />
            <Bar w="25%" c="rgba(255,255,255,.9)" />
          </div>
        ) : id === 'minimal' ? (
          <div className="px-1.5 pt-1.5 pb-1 flex justify-between items-start border-b" style={{ borderColor: color }}>
            <Bar w="38%" c="#0f172a" />
            <Bar w="28%" />
          </div>
        ) : (
          <div className="px-1.5 pt-1.5 flex justify-between items-start">
            <span className="flex items-center gap-1 w-1/2">
              <span className="block w-2.5 h-2.5 rounded-sm bg-brand-500" />
              <Bar w="60%" c="#5b32d6" />
            </span>
            <Bar w="28%" c="#334155" />
          </div>
        )}
        <div className="px-1.5 pt-1.5 space-y-1">
          <Bar w="45%" />
          <Bar w="30%" />
        </div>
        <div className="mx-1.5 mt-1.5 space-y-0.5">
          <Bar w="100%" h={4} c={id === 'modern' ? color : id === 'minimal' ? '#0f172a' : '#e8e8ff'} />
          {[0, 1, 2].map((i) => (
            <Bar key={i} w="100%" h={3} c={id === 'modern' && i % 2 ? '#f1f5f9' : '#eef2f7'} />
          ))}
        </div>
        <div className="mt-auto px-1.5 pb-1.5 flex justify-end">
          <Bar w="40%" h={5} c={id === 'modern' ? color : '#334155'} className="rounded" />
        </div>
      </div>
    </div>
  );
};
