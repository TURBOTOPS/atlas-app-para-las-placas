import { useState, useMemo } from 'react';
import { ShoppingCart, Image as ImageIcon, Mic, CheckCircle2, FileText } from 'lucide-react';
import { formatMoney, generateId, compressImage } from '../lib/utils';
import { useDictation } from '../hooks/useDictation';
import { Sale, AppConfig } from '../types';
import { cn } from '../lib/utils';

interface SalesViewProps {
  config: AppConfig;
  availableStock: number;
  averageLandedUnitCost: number;
  onRegisterSale: (sale: Sale, showDoc: boolean) => void;
}

export function SalesView({ config, availableStock, averageLandedUnitCost, onRegisterSale }: SalesViewProps) {
  const [qty, setQty] = useState(1);
  const [unitPrice, setUnitPrice] = useState(50000);
  const [priceType, setPriceType] = useState<'neto' | 'bruto'>('neto');
  const [docType, setDocType] = useState('factura');
  const [paymentMethod, setPaymentMethod] = useState('Transferencia');
  const [clientName, setClientName] = useState('');
  const [clientRut, setClientRut] = useState('');
  const [notes, setNotes] = useState('');
  const [receiptImage, setReceiptImage] = useState<string | null>(null);

  const { isListening, startListening } = useDictation((text) => {
    setNotes(prev => prev ? prev + ' ' + text : text);
  });

  const handleQtyChange = (newQty: number) => {
    const validQty = Math.max(1, newQty);
    setQty(validQty);
    if (validQty === 1) setUnitPrice(50000);
    else if (validQty === 2) setUnitPrice(45000);
    else if (validQty >= 3) setUnitPrice(40000);
    setPriceType('neto');
  };

  const { totalBruto, neto, iva, totalEstimatedCost, reinvestment, savings, profit } = useMemo(() => {
    let n = 0;
    let tBruto = 0;
    let i = 0;
    
    if (priceType === 'neto') {
      n = Math.round(qty * unitPrice);
      i = Math.round(n * 0.19);
      tBruto = n + i;
    } else {
      tBruto = Math.round(qty * unitPrice);
      n = Math.round(tBruto / 1.19);
      i = tBruto - n;
    }

    const tEst = averageLandedUnitCost * qty;
    const r = Math.round(n * (config.reinvestPct / 100));
    const s = Math.round(n * (config.savingsPct / 100));
    const p = Math.round(n * (config.profitPct / 100));
    
    return { totalBruto: tBruto, neto: n, iva: i, totalEstimatedCost: tEst, reinvestment: r, savings: s, profit: p };
  }, [qty, unitPrice, priceType, averageLandedUnitCost, config]);

  const handleReceiptSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const base64 = await compressImage(file);
    setReceiptImage(base64);
  };

  const handleRegister = (showDoc: boolean) => {
    if (totalBruto <= 0) return alert('Ingresa un monto válido para la venta');
    if (availableStock < qty) return;

    const sale: Sale = {
      id: generateId('NFC'),
      timestamp: new Date().toISOString(),
      clientName: clientName.trim() || 'Cliente General',
      clientRut: clientRut.trim() || 'S/RUT',
      qty,
      unitPrice,
      docType,
      paymentMethod,
      totalBruto,
      neto,
      iva,
      estimatedUnitCost: averageLandedUnitCost,
      reinvestment,
      savings,
      profit,
      notes: notes.trim(),
      receiptImage
    };

    onRegisterSale(sale, showDoc);
    
    // reset form
    setQty(1);
    setUnitPrice(50000);
    setPriceType('neto');
    setClientName('');
    setClientRut('');
    setNotes('');
    setReceiptImage(null);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      <div className="lg:col-span-7 bg-white/10 dark:bg-slate-900/40 backdrop-blur-md rounded-xl p-5 shadow-sm border border-white/20 dark:border-slate-700/50 space-y-5 transition-colors">
        <div className="flex items-center justify-between border-b border-slate-300/20 dark:border-slate-700/50 pb-3">
          <h2 className="font-bold text-slate-800 dark:text-slate-100 text-sm sm:text-base flex items-center gap-2 m-0">
            <ShoppingCart className="w-5 h-5 text-sky-600 dark:text-sky-400" /> Registrar Venta POS
          </h2>
          <span className={cn("text-xs font-bold px-2.5 py-1 rounded-full border", 
            availableStock <= 5 ? "text-red-700 bg-red-50 border-red-200 dark:bg-red-950 dark:text-red-400 dark:border-red-900" : "text-emerald-700 bg-emerald-50 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-400 dark:border-emerald-900"
          )}>
            Disponibles: {availableStock}
          </span>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-2">1. Cantidad y Precio (Regla Auto)</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden h-11">
                <button type="button" onClick={() => handleQtyChange(qty - 1)} className="w-12 hover:bg-slate-200 dark:hover:bg-slate-800 font-bold text-slate-600 dark:text-slate-300 border-r border-slate-200 dark:border-slate-700 transition-colors">-</button>
                <input type="number" value={qty} onChange={e => handleQtyChange(parseInt(e.target.value) || 1)} className="w-full text-center font-mono font-bold text-slate-800 dark:text-slate-100 outline-none bg-transparent" />
                <button type="button" onClick={() => handleQtyChange(qty + 1)} className="w-12 hover:bg-slate-200 dark:hover:bg-slate-800 font-bold text-slate-600 dark:text-slate-300 border-l border-slate-200 dark:border-slate-700 transition-colors">+</button>
              </div>
              <div className="flex bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden h-11 relative">
                <span className="absolute left-3 top-3 text-slate-400 font-bold">$</span>
                <input type="number" value={unitPrice} onChange={e => setUnitPrice(Math.max(0, parseInt(e.target.value) || 0))} className="w-full text-right pr-20 pl-8 font-mono font-bold text-slate-800 dark:text-slate-100 outline-none bg-transparent" />
                <button 
                  type="button" 
                  onClick={() => setPriceType(p => p === 'neto' ? 'bruto' : 'neto')} 
                  className="absolute right-0 top-0 h-full px-2 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-[10px] font-bold text-slate-700 dark:text-slate-300 uppercase border-l border-slate-300 dark:border-slate-700 transition-colors"
                >
                  {priceType === 'neto' ? '+ IVA' : 'INC. IVA'}
                </button>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              <button onClick={() => handleQtyChange(1)} className={cn("text-xs px-2 py-1 rounded font-medium border transition-colors", qty === 1 ? "bg-sky-100 border-sky-200 text-sky-800 dark:bg-sky-900/40 dark:border-sky-800 dark:text-sky-300" : "bg-slate-100 border-slate-200 text-slate-600 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700")}>1 Unid ($50k + IVA)</button>
              <button onClick={() => handleQtyChange(2)} className={cn("text-xs px-2 py-1 rounded font-medium border transition-colors", qty === 2 ? "bg-sky-100 border-sky-200 text-sky-800 dark:bg-sky-900/40 dark:border-sky-800 dark:text-sky-300" : "bg-slate-100 border-slate-200 text-slate-600 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700")}>2 Unid ($45k + IVA)</button>
              <button onClick={() => handleQtyChange(3)} className={cn("text-xs px-2 py-1 rounded font-medium border transition-colors", qty >= 3 ? "bg-sky-100 border-sky-200 text-sky-800 dark:bg-sky-900/40 dark:border-sky-800 dark:text-sky-300" : "bg-slate-100 border-slate-200 text-slate-600 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700")}>3+ Unid ($40k + IVA)</button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-2">Doc SII</label>
              <select value={docType} onChange={e => setDocType(e.target.value)} className="w-full h-11 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg px-3 text-sm font-medium text-slate-700 dark:text-slate-200 outline-none focus:ring-2 focus:ring-sky-500">
                <option value="factura">Factura (19% IVA)</option>
                <option value="boleta">Boleta / Ticket</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-2">Pago</label>
              <select value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)} className="w-full h-11 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg px-3 text-sm font-medium text-slate-700 dark:text-slate-200 outline-none focus:ring-2 focus:ring-sky-500">
                <option value="Transferencia">Transferencia</option>
                <option value="Efectivo">Efectivo</option>
                <option value="Debito/Credito">Tarjeta</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100 dark:border-slate-800">
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Cliente / Razón Social</label>
              <input type="text" value={clientName} onChange={e => setClientName(e.target.value)} placeholder="Ej: Juan Pérez" className="w-full h-10 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg px-3 text-sm text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-sky-500 placeholder:text-slate-400 dark:placeholder:text-slate-600" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">RUT Cliente</label>
              <input type="text" value={clientRut} onChange={e => setClientRut(e.target.value)} placeholder="Ej: 19.123.456-7" className="w-full h-10 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg px-3 text-sm text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-sky-500 placeholder:text-slate-400 dark:placeholder:text-slate-600" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Comprobante y Notas</label>
            <div className="flex gap-2 mb-2">
              <label className="cursor-pointer h-10 px-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 flex items-center gap-2 transition-colors">
                <ImageIcon className="w-4 h-4 text-slate-500 dark:text-slate-400" /> Adjuntar Foto
                <input type="file" accept="image/*" onChange={handleReceiptSelect} className="hidden" />
              </label>
              {receiptImage && <img src={receiptImage} className="h-10 w-10 object-cover rounded border border-slate-300 dark:border-slate-700" alt="thumb" />}
            </div>
            <div className="flex gap-2">
              <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Notas de venta..." className="w-full p-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-sky-500 resize-y min-h-[60px] placeholder:text-slate-400 dark:placeholder:text-slate-600" />
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
            <span className="text-xs uppercase font-bold tracking-wider text-slate-400">Resumen</span>
            <span className="text-xs font-mono bg-sky-500/20 text-sky-300 px-2 py-0.5 rounded border border-sky-500/30">{qty} @ {formatMoney(unitPrice)}</span>
          </div>

          <div className="text-center py-3 bg-slate-800/60 dark:bg-slate-900/60 rounded-lg border border-slate-800">
            <p className="text-xs text-slate-400 uppercase tracking-widest font-medium">Total Bruto A Cobrar</p>
            <p className="text-3xl font-extrabold text-white mt-1">{formatMoney(totalBruto)}</p>
          </div>

          <div className="space-y-2 text-sm border-t border-b border-slate-800 py-3 font-mono">
            <div className="flex justify-between text-slate-300"><span>Neto:</span><span>{formatMoney(neto)}</span></div>
            <div className="flex justify-between text-amber-400 font-semibold"><span>IVA 19%:</span><span>{formatMoney(iva)}</span></div>
            <div className="flex justify-between text-slate-500 text-xs pt-1"><span>Costo Base Estimado:</span><span>{formatMoney(totalEstimatedCost)}</span></div>
          </div>

          <div className="space-y-2 pt-1">
            <h3 className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Desglose Automático (Neto)</h3>
            <div className="grid grid-cols-3 gap-2 text-center text-xs font-mono">
              <div className="bg-sky-950/40 p-2 rounded border border-sky-800/40">
                <span className="text-[9px] text-sky-400 block uppercase">Stock</span>
                <span className="font-bold text-sky-200">{formatMoney(reinvestment)}</span>
              </div>
              <div className="bg-purple-950/40 p-2 rounded border border-purple-800/40">
                <span className="text-[9px] text-purple-400 block uppercase">Ahorro</span>
                <span className="font-bold text-purple-200">{formatMoney(savings)}</span>
              </div>
              <div className="bg-emerald-950/40 p-2 rounded border border-emerald-800/40">
                <span className="text-[9px] text-emerald-400 block uppercase">Ganancia</span>
                <span className="font-bold text-emerald-200">{formatMoney(profit)}</span>
              </div>
            </div>
          </div>

          <div className="space-y-2 pt-3">
            {qty > availableStock && (
              <div className="p-3 mb-2 bg-red-950/60 border border-red-500/50 text-red-200 text-xs text-center rounded-lg font-bold">
                ⚠️ Stock insuficiente. No puedes vender más de {availableStock} unidades.
              </div>
            )}
            <button disabled={qty > availableStock} onClick={() => handleRegister(false)} className={cn("w-full font-bold py-3 px-4 rounded-lg shadow-md text-sm flex items-center justify-center gap-2 transition-colors", qty > availableStock ? "bg-slate-800/50 text-slate-500 cursor-not-allowed" : "bg-emerald-600 hover:bg-emerald-700 text-white")}>
              <CheckCircle2 className="w-5 h-5" /> Consolidar Venta
            </button>
            <button disabled={qty > availableStock} onClick={() => handleRegister(true)} className={cn("w-full font-medium py-2 px-4 rounded-lg text-xs flex items-center justify-center gap-2 border transition-colors", qty > availableStock ? "bg-slate-800/50 text-slate-600 border-slate-700/50 cursor-not-allowed" : "bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700")}>
              <FileText className={cn("w-4 h-4", qty > availableStock ? "text-slate-600" : "text-sky-400")} /> Exportar Comprobante PDF/JSON
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
