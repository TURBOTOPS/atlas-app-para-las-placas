import { useState, useMemo } from 'react';
import { PackagePlus, ImageIcon, Mic, CheckCircle2 } from 'lucide-react';
import { formatMoney, generateId, compressImage } from '../lib/utils';
import { useDictation } from '../hooks/useDictation';
import { Reception } from '../types';
import { cn } from '../lib/utils';

interface ReceptionViewProps {
  onRegisterReception: (rec: Reception, showDoc: boolean) => void;
}

export function ReceptionView({ onRegisterReception }: ReceptionViewProps) {
  const [supplier, setSupplier] = useState('');
  const [tracking, setTracking] = useState('');
  const [qty, setQty] = useState(100);
  
  const today = new Date().toISOString().split('T')[0];
  const prev15Days = new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  
  const [orderDate, setOrderDate] = useState(prev15Days);
  const [arrivalDate, setArrivalDate] = useState(today);
  
  const [usdFob, setUsdFob] = useState(300);
  const [exchangeRate, setExchangeRate] = useState(950);
  const [courierTaxesClp, setCourierTaxesClp] = useState(25000);
  const [notes, setNotes] = useState('');
  const [receiptImage, setReceiptImage] = useState<string | null>(null);

  const { isListening, startListening } = useDictation((text) => {
    setNotes(prev => prev ? prev + ' ' + text : text);
  });

  const { totalLandedClp, unitLandedClp, transitDays, marginPublic, marginWholesale } = useMemo(() => {
    const productClp = usdFob * exchangeRate;
    const total = Math.round(productClp + courierTaxesClp);
    const unit = Math.round(total / (qty || 1));
    
    const od = new Date(orderDate);
    const ad = new Date(arrivalDate);
    const transit = Math.max(0, Math.round((ad.getTime() - od.getTime()) / (1000 * 60 * 60 * 24)));
    
    const mPub = Math.round(((50000 - unit) / 50000) * 100); // Updated to 50k for 1 unit reference
    const mWhole = Math.round(((40000 - unit) / 40000) * 100); // Updated to 40k for wholesale reference
    
    return { totalLandedClp: total, unitLandedClp: unit, transitDays: transit, marginPublic: mPub, marginWholesale: mWhole };
  }, [qty, usdFob, exchangeRate, courierTaxesClp, orderDate, arrivalDate]);

  const handleReceiptSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const base64 = await compressImage(file);
    setReceiptImage(base64);
  };

  const handleRegister = (showDoc: boolean) => {
    const rec: Reception = {
      id: generateId('MIGO'),
      timestamp: new Date().toISOString(),
      supplier: supplier.trim() || 'Proveedor Internacional',
      tracking: tracking.trim() || 'N/A',
      qty,
      orderDate,
      arrivalDate,
      transitDays,
      usdFob,
      exchangeRate,
      courierTaxesClp,
      totalLandedClp,
      unitLandedClp,
      notes: notes.trim(),
      receiptImage
    };
    
    onRegisterReception(rec, showDoc);
    
    setSupplier('');
    setTracking('');
    setNotes('');
    setReceiptImage(null);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      <div className="lg:col-span-7 bg-white/10 dark:bg-slate-900/40 backdrop-blur-md rounded-xl p-5 shadow-sm border border-white/20 dark:border-slate-700/50 space-y-5 transition-colors">
        <div className="flex items-center justify-between border-b border-slate-300/20 dark:border-slate-700/50 pb-3">
          <div>
            <h2 className="font-bold text-slate-800 dark:text-slate-100 text-sm sm:text-base flex items-center gap-2 m-0">
              <PackagePlus className="w-5 h-5 text-amber-600 dark:text-amber-500" /> Recepción de Mercadería (MIGO)
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 m-0 mt-1">Cálculo de costo real puesto en Chile (Landed Cost)</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">Proveedor</label>
              <input type="text" value={supplier} onChange={e => setSupplier(e.target.value)} placeholder="Ej: NFC Tech Ltd" className="w-full h-10 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg px-3 text-sm text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-amber-500 placeholder:text-slate-400 dark:placeholder:text-slate-600" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">Tracking / Guía</label>
              <input type="text" value={tracking} onChange={e => setTracking(e.target.value)} placeholder="Ej: DHL-123" className="w-full h-10 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg px-3 text-sm text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-amber-500 placeholder:text-slate-400 dark:placeholder:text-slate-600" />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">Cantidad</label>
              <input type="number" value={qty} onChange={e => setQty(Math.max(1, parseInt(e.target.value) || 1))} className="w-full h-10 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg px-3 text-sm font-mono font-bold text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-amber-500" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">Fecha Pedido</label>
              <input type="date" value={orderDate} onChange={e => setOrderDate(e.target.value)} className="w-full h-10 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg px-3 text-sm text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-amber-500" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">Fecha Llegada</label>
              <input type="date" value={arrivalDate} onChange={e => setArrivalDate(e.target.value)} className="w-full h-10 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg px-3 text-sm text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-amber-500" />
            </div>
          </div>

          <div className="p-4 bg-slate-50 dark:bg-slate-950/50 rounded-lg border border-slate-200 dark:border-slate-700/50 space-y-3">
            <h3 className="text-xs font-bold uppercase text-slate-700 dark:text-slate-300 tracking-wider m-0">Costos de Importación</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">Costo (USD FOB)</label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-slate-400 font-bold">$</span>
                  <input type="number" value={usdFob} onChange={e => setUsdFob(parseFloat(e.target.value) || 0)} className="w-full h-10 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-md pl-6 pr-2 text-sm font-mono font-bold text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-amber-500" />
                </div>
              </div>
              <div>
                <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">T. Cambio (CLP)</label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-slate-400 font-bold">$</span>
                  <input type="number" value={exchangeRate} onChange={e => setExchangeRate(parseFloat(e.target.value) || 0)} className="w-full h-10 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-md pl-6 pr-2 text-sm font-mono font-bold text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-amber-500" />
                </div>
              </div>
              <div>
                <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">Courier / Aduana</label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-slate-400 font-bold">$</span>
                  <input type="number" value={courierTaxesClp} onChange={e => setCourierTaxesClp(parseFloat(e.target.value) || 0)} className="w-full h-10 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-md pl-6 pr-2 text-sm font-mono font-bold text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-amber-500" />
                </div>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Factura / INVOICE</label>
            <div className="flex gap-2 mb-2">
              <label className="cursor-pointer h-10 px-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 flex items-center gap-2 transition-colors">
                <ImageIcon className="w-4 h-4 text-slate-500 dark:text-slate-400" /> Adjuntar Foto
                <input type="file" accept="image/*" onChange={handleReceiptSelect} className="hidden" />
              </label>
              {receiptImage && <img src={receiptImage} className="h-10 w-10 object-cover rounded border border-slate-300 dark:border-slate-700" alt="thumb" />}
            </div>
            <div className="flex gap-2">
              <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Notas..." className="w-full p-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-amber-500 resize-y min-h-[60px] placeholder:text-slate-400 dark:placeholder:text-slate-600" />
              <button onClick={startListening} className={cn("h-11 w-11 flex-shrink-0 flex items-center justify-center rounded-lg border transition-colors", isListening ? "bg-red-500 text-white border-red-600 animate-pulse" : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700")}>
                <Mic className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="lg:col-span-5 space-y-4">
        <div className="bg-slate-900/60 dark:bg-black/60 backdrop-blur-md text-white rounded-xl p-5 shadow-md space-y-4 border border-white/10 dark:border-slate-800 transition-colors">
          <div className="flex items-center justify-between border-b border-white/10 dark:border-slate-800 pb-3">
            <span className="text-xs uppercase font-bold tracking-wider text-amber-400">Landed Cost (Chile)</span>
            <span className="text-xs font-mono bg-amber-950 text-amber-300 px-2 py-0.5 rounded border border-amber-800">{qty} Unidades</span>
          </div>

          <div className="text-center py-3 bg-slate-800/60 dark:bg-slate-900/60 rounded-lg border border-slate-800">
            <p className="text-xs text-slate-400 uppercase tracking-widest font-medium">Costo Total Puesto en Chile</p>
            <p className="text-3xl font-extrabold text-white mt-1">{formatMoney(totalLandedClp)}</p>
            <div className="mt-2 text-xs font-mono text-emerald-400 bg-emerald-950/60 inline-block px-3 py-1 rounded-full border border-emerald-800">
              Unitario: <span className="font-extrabold">{formatMoney(unitLandedClp)}</span>
            </div>
          </div>

          <div className="space-y-2 text-xs border-t border-b border-slate-800 py-3 font-mono">
            <div className="flex justify-between text-slate-300">
              <span>Tránsito:</span>
              <span className="font-bold text-sky-400">{transitDays} días</span>
            </div>
            <div className="flex justify-between text-slate-300">
              <span>Margen 1 Unid ($50k):</span>
              <span className="font-bold text-emerald-400">{marginPublic}%</span>
            </div>
            <div className="flex justify-between text-slate-300">
              <span>Margen 3+ Unid ($40k):</span>
              <span className="font-bold text-emerald-400">{marginWholesale}%</span>
            </div>
          </div>

          <div className="space-y-2 pt-3">
            <button onClick={() => handleRegister(false)} className="w-full bg-amber-600 hover:bg-amber-700 text-white font-bold py-3 px-4 rounded-lg shadow-md text-sm flex items-center justify-center gap-2 transition-colors">
              <CheckCircle2 className="w-5 h-5" /> Ingresar a Bodega
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
