import { Boxes, Store, Landmark, Moon, Sun, AlertTriangle } from 'lucide-react';
import { formatMoney } from '../lib/utils';
import { Sale } from '../types';

interface KPIHeaderProps {
  availableStock: number;
  sales: Sale[];
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
  criticalStockThreshold: number;
}

export function KPIHeader({ availableStock, sales, isDarkMode, onToggleDarkMode, criticalStockThreshold = 50 }: KPIHeaderProps) {
  const todayStr = new Date().toISOString().split('T')[0];
  let totalSalesToday = 0;
  let totalIva = 0;

  sales.forEach(s => {
    totalIva += s.iva;
    if (s.timestamp.startsWith(todayStr)) {
      totalSalesToday += s.totalBruto;
    }
  });

  const isCriticalStock = availableStock < criticalStockThreshold;

  return (
    <header className="bg-slate-950/40 backdrop-blur-md text-white sticky top-0 z-30 shadow-md transition-colors border-b border-white/10">
      <div className="max-w-5xl mx-auto px-4 py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          <div className="bg-sky-600 text-white p-2 rounded-lg font-bold flex items-center justify-center w-10 h-10 shadow-md">
            <Store className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-extrabold tracking-wide text-white m-0 leading-none">NFC Express</h1>
              <span className="bg-sky-500/20 text-sky-300 text-[10px] font-mono font-bold px-2 py-0.5 rounded border border-sky-500/30 uppercase leading-none mt-1">ERP Lite</span>
            </div>
            <p className="text-[11px] text-slate-400 m-0 mt-1">Control de Inventario, POS & Contabilidad</p>
          </div>
        </div>

        <div className="flex items-center space-x-2 sm:space-x-4 text-xs">
          <div className={`px-3 py-1.5 rounded-lg border flex flex-col justify-center transition-colors ${isCriticalStock ? 'bg-red-950/60 border-red-500/50 shadow-[0_0_10px_rgba(239,68,68,0.2)]' : 'bg-slate-900/40 border-white/10'}`}>
            <span className={`text-[10px] uppercase font-bold flex items-center gap-1 ${isCriticalStock ? 'text-red-400' : 'text-slate-300'}`}>
              <Boxes className="w-3 h-3" /> Stock
              {isCriticalStock && <AlertTriangle className="w-3 h-3 text-red-500 ml-0.5 animate-pulse" />}
            </span>
            <span className={`font-bold text-sm leading-none mt-1 ${isCriticalStock ? 'text-red-300' : 'text-sky-300'}`}>{availableStock}</span>
          </div>
          <div className="bg-slate-900/40 px-3 py-1.5 rounded-lg border border-white/10 flex flex-col justify-center">
            <span className="text-[10px] text-slate-300 uppercase font-bold flex items-center gap-1"><Store className="w-3 h-3" /> Ventas Hoy</span>
            <span className="font-bold text-emerald-400 text-sm leading-none mt-1">{formatMoney(totalSalesToday)}</span>
          </div>
          <div className="bg-slate-900/40 px-3 py-1.5 rounded-lg border border-white/10 flex flex-col justify-center hidden sm:flex">
            <span className="text-[10px] text-slate-300 uppercase font-bold flex items-center gap-1"><Landmark className="w-3 h-3" /> IVA Res.</span>
            <span className="font-bold text-amber-400 text-sm leading-none mt-1">{formatMoney(totalIva)}</span>
          </div>
          
          <button 
            onClick={onToggleDarkMode} 
            className="ml-2 p-2 rounded-full bg-slate-900/40 hover:bg-slate-800/60 border border-white/10 transition-colors"
            title="Cambiar Modo"
          >
            {isDarkMode ? <Sun className="w-4 h-4 text-amber-300" /> : <Moon className="w-4 h-4 text-sky-300" />}
          </button>
        </div>
      </div>
    </header>
  );
}
