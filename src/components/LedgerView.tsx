import { useState } from 'react';
import { BookOpen, PieChart, Download, Upload, Trash2, SlidersHorizontal, Eye, PackagePlus } from 'lucide-react';
import { Sale, Reception, AppConfig } from '../types';
import { formatMoney, formatDateShort } from '../lib/utils';
import { cn } from '../lib/utils';

interface LedgerViewProps {
  sales: Sale[];
  receptions: Reception[];
  config: AppConfig;
  onUpdateConfig: (config: AppConfig) => void;
  onDeleteSale: (id: string) => void;
  onDeleteReception: (id: string) => void;
  onImportBatch: (sales: Sale[], receptions: Reception[]) => void;
  onInspectDocument: (id: string, type: 'sale' | 'reception') => void;
  onExportCsv: () => void;
}

export function LedgerView({ sales, receptions, config, onUpdateConfig, onDeleteSale, onDeleteReception, onImportBatch, onInspectDocument, onExportCsv }: LedgerViewProps) {
  const [activeTab, setActiveTab] = useState<'sales' | 'receptions' | 'finance' | 'import'>('sales');

  const handleSliderChange = (field: keyof AppConfig, val: number) => {
    let maxLimit = field === 'criticalStockThreshold' ? 1000 : 100;
    let newVal = Math.min(maxLimit, Math.max(0, val));
    onUpdateConfig({ ...config, [field]: newVal });
  };

  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length) return;

    let loadedSales: Sale[] = [];
    let loadedReceptions: Reception[] = [];
    let promises = Array.from(files).map(file => {
      return new Promise<void>(resolve => {
        const reader = new FileReader();
        reader.onload = (event) => {
          try {
            const parsed = JSON.parse(event.target?.result as string);
            const items = Array.isArray(parsed) ? parsed : (parsed.transaction ? [parsed.transaction] : [parsed]);
            
            items.forEach((item: any) => {
              if (item.id?.startsWith('MIGO')) {
                loadedReceptions.push(item);
              } else if (item.id?.startsWith('NFC') || item.docType) {
                loadedSales.push(item);
              }
            });
          } catch (err) {
            console.error('Import Error:', err);
          }
          resolve();
        };
        reader.readAsText(file);
      });
    });

    Promise.all(promises).then(() => {
      onImportBatch(loadedSales, loadedReceptions);
      alert(`Importados ${loadedSales.length} ventas y ${loadedReceptions.length} ingresos.`);
    });
  };

  return (
    <div className="bg-white/10 dark:bg-slate-900/40 backdrop-blur-md rounded-xl shadow-sm border border-white/20 dark:border-slate-700/50 overflow-hidden transition-colors">
      <div className="flex border-b border-slate-300/20 dark:border-slate-700/50 overflow-x-auto scrollbar-hide">
        <button onClick={() => setActiveTab('sales')} className={cn("px-4 py-3 text-sm font-semibold whitespace-nowrap border-b-2 transition-colors flex items-center gap-2", activeTab === 'sales' ? "border-sky-600 text-sky-600 dark:text-sky-400" : "border-transparent text-slate-500 dark:text-slate-400")}>
          <BookOpen className="w-4 h-4" /> Ventas
        </button>
        <button onClick={() => setActiveTab('receptions')} className={cn("px-4 py-3 text-sm font-semibold whitespace-nowrap border-b-2 transition-colors flex items-center gap-2", activeTab === 'receptions' ? "border-amber-600 text-amber-600 dark:text-amber-500" : "border-transparent text-slate-500 dark:text-slate-400")}>
          <PackagePlus className="w-4 h-4" /> Stock (MIGO)
        </button>
        <button onClick={() => setActiveTab('finance')} className={cn("px-4 py-3 text-sm font-semibold whitespace-nowrap border-b-2 transition-colors flex items-center gap-2", activeTab === 'finance' ? "border-emerald-600 text-emerald-600 dark:text-emerald-500" : "border-transparent text-slate-500 dark:text-slate-400")}>
          <SlidersHorizontal className="w-4 h-4" /> Configuraciones
        </button>
        <button onClick={() => setActiveTab('import')} className={cn("px-4 py-3 text-sm font-semibold whitespace-nowrap border-b-2 transition-colors flex items-center gap-2", activeTab === 'import' ? "border-purple-600 text-purple-600 dark:text-purple-400" : "border-transparent text-slate-500 dark:text-slate-400")}>
          <Upload className="w-4 h-4" /> Consolidar
        </button>
      </div>

      <div className="p-5">
        {activeTab === 'sales' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-bold text-slate-800 dark:text-slate-100">Libro de Ventas</h3>
              <button onClick={onExportCsv} className="bg-slate-800 dark:bg-slate-700 hover:bg-slate-900 dark:hover:bg-slate-600 text-white text-xs px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors">
                <Download className="w-3.5 h-3.5" /> CSV
              </button>
            </div>
            <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-800">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-400 font-bold uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="p-3">Fecha/ID</th>
                    <th className="p-3">Cliente</th>
                    <th className="p-3">Doc</th>
                    <th className="p-3 text-center">Cant.</th>
                    <th className="p-3 text-right">Neto</th>
                    <th className="p-3 text-right">IVA</th>
                    <th className="p-3 text-right">Total</th>
                    <th className="p-3 text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono text-slate-800 dark:text-slate-200">
                  {sales.length === 0 && (
                    <tr><td colSpan={8} className="text-center py-8 text-slate-400 dark:text-slate-500 font-sans">No hay ventas registradas.</td></tr>
                  )}
                  {sales.map(s => (
                    <tr key={s.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors">
                      <td className="p-3"><div className="font-bold">{formatDateShort(s.timestamp)}</div><div className="text-[10px] text-slate-400">{s.id}</div></td>
                      <td className="p-3"><div className="font-sans font-medium">{s.clientName}</div></td>
                      <td className="p-3"><span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 uppercase text-[10px] font-bold font-sans">{s.docType.substring(0,3)}</span></td>
                      <td className="p-3 text-center font-bold">{s.qty}</td>
                      <td className="p-3 text-right text-slate-600 dark:text-slate-400">{formatMoney(s.neto)}</td>
                      <td className="p-3 text-right text-amber-600 dark:text-amber-500">{formatMoney(s.iva)}</td>
                      <td className="p-3 text-right font-bold">{formatMoney(s.totalBruto)}</td>
                      <td className="p-3 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button onClick={() => onInspectDocument(s.id, 'sale')} className="text-sky-600 dark:text-sky-400 hover:bg-sky-50 dark:hover:bg-sky-950 p-1 rounded transition-colors"><Eye className="w-4 h-4" /></button>
                          <button onClick={() => onDeleteSale(s.id)} className="text-slate-400 dark:text-slate-500 hover:text-red-500 dark:hover:text-red-400 p-1 rounded transition-colors"><Trash2 className="w-4 h-4" /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'receptions' && (
          <div className="space-y-4">
            <h3 className="font-bold text-slate-800 dark:text-slate-100 mb-2">Ingresos de Stock (MIGO)</h3>
            <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-800">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-400 font-bold uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="p-3">Fecha/ID</th>
                    <th className="p-3">Proveedor</th>
                    <th className="p-3 text-center">Cant.</th>
                    <th className="p-3 text-right">Costo USD</th>
                    <th className="p-3 text-right">Landed CLP</th>
                    <th className="p-3 text-right">Unitario</th>
                    <th className="p-3 text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono text-slate-800 dark:text-slate-200">
                  {receptions.length === 0 && (
                    <tr><td colSpan={7} className="text-center py-8 text-slate-400 dark:text-slate-500 font-sans">No hay ingresos registrados.</td></tr>
                  )}
                  {receptions.map(r => (
                    <tr key={r.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors">
                      <td className="p-3"><div className="font-bold">{formatDateShort(r.arrivalDate || r.timestamp)}</div><div className="text-[10px] text-slate-400">{r.id}</div></td>
                      <td className="p-3"><div className="font-sans font-medium">{r.supplier}</div></td>
                      <td className="p-3 text-center font-bold text-sky-600 dark:text-sky-400">+{r.qty}</td>
                      <td className="p-3 text-right text-slate-600 dark:text-slate-400">${r.usdFob}</td>
                      <td className="p-3 text-right font-bold">{formatMoney(r.totalLandedClp)}</td>
                      <td className="p-3 text-right font-bold text-emerald-600 dark:text-emerald-500">{formatMoney(r.unitLandedClp)}</td>
                      <td className="p-3 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button onClick={() => onInspectDocument(r.id, 'reception')} className="text-amber-600 dark:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-950 p-1 rounded transition-colors"><Eye className="w-4 h-4" /></button>
                          <button onClick={() => onDeleteReception(r.id)} className="text-slate-400 dark:text-slate-500 hover:text-red-500 dark:hover:text-red-400 p-1 rounded transition-colors"><Trash2 className="w-4 h-4" /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'finance' && (
          <div className="space-y-6 max-w-2xl">
            <div>
              <h3 className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2"><SlidersHorizontal className="w-5 h-5 text-emerald-600 dark:text-emerald-500" /> Configuración de Repartija</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Ajusta los porcentajes aplicados al valor Neto de cada venta para distribuir el dinero.</p>
            </div>
            
            <div className="space-y-4">
              <div className="bg-white/5 dark:bg-slate-900/30 p-4 rounded-lg border border-white/10 dark:border-slate-700/50 transition-colors">
                <div className="flex justify-between items-center text-sm font-bold text-slate-800 dark:text-slate-200 mb-2">
                  <span>Reimportación Stock:</span><span className="text-sky-600 dark:text-sky-400">{config.reinvestPct}%</span>
                </div>
                <input type="range" min="0" max="100" value={config.reinvestPct} onChange={(e) => handleSliderChange('reinvestPct', parseInt(e.target.value))} className="w-full accent-sky-600" />
              </div>
              
              <div className="bg-white/5 dark:bg-slate-900/30 p-4 rounded-lg border border-white/10 dark:border-slate-700/50 transition-colors">
                <div className="flex justify-between items-center text-sm font-bold text-slate-800 dark:text-slate-200 mb-2">
                  <span>Fondo Ahorro / Metas:</span><span className="text-purple-600 dark:text-purple-400">{config.savingsPct}%</span>
                </div>
                <input type="range" min="0" max="100" value={config.savingsPct} onChange={(e) => handleSliderChange('savingsPct', parseInt(e.target.value))} className="w-full accent-purple-600" />
              </div>

              <div className="bg-white/5 dark:bg-slate-900/30 p-4 rounded-lg border border-white/10 dark:border-slate-700/50 transition-colors">
                <div className="flex justify-between items-center text-sm font-bold text-slate-800 dark:text-slate-200 mb-2">
                  <span>Ganancia Neta Libre:</span><span className="text-emerald-600 dark:text-emerald-400">{config.profitPct}%</span>
                </div>
                <input type="range" min="0" max="100" value={config.profitPct} onChange={(e) => handleSliderChange('profitPct', parseInt(e.target.value))} className="w-full accent-emerald-600" />
              </div>
            </div>
            
            {(config.reinvestPct + config.savingsPct + config.profitPct) !== 100 && (
              <div className="p-3 bg-red-950/40 text-red-200 text-xs font-bold rounded-lg border border-red-500/30 transition-colors">
                Atención: Los porcentajes suman {config.reinvestPct + config.savingsPct + config.profitPct}%, asegúrate de que sumen 100%.
              </div>
            )}

            <div className="pt-6 border-t border-slate-300/20 dark:border-slate-700/50">
              <h3 className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2 mb-4">Configuración de Umbrales</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">Define el nivel de stock mínimo que disparará la alerta visual roja en la cabecera (KPI Header).</p>
              <div className="bg-white/5 dark:bg-slate-900/30 p-4 rounded-lg border border-white/10 dark:border-slate-700/50 transition-colors">
                <div className="flex justify-between items-center text-sm font-bold text-slate-800 dark:text-slate-200 mb-2">
                  <span>Alerta al bajar de:</span><span className="text-red-500 dark:text-red-400">{config.criticalStockThreshold ?? 50} uds</span>
                </div>
                <input type="range" min="0" max="500" step="5" value={config.criticalStockThreshold ?? 50} onChange={(e) => handleSliderChange('criticalStockThreshold', parseInt(e.target.value))} className="w-full accent-red-600" />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'import' && (
          <div className="space-y-4 max-w-xl mx-auto py-8">
            <div className="text-center space-y-2">
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/50 text-purple-600 dark:text-purple-400 rounded-xl flex items-center justify-center mx-auto transition-colors">
                <Upload className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-slate-800 dark:text-slate-100 text-lg">Consolidar Registros</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">Sube archivos JSON exportados de otros dispositivos para unificar tu contabilidad local.</p>
            </div>
            
            <label className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-purple-500 dark:hover:border-purple-500 rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer transition-colors bg-slate-50 dark:bg-slate-950">
              <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">Seleccionar archivos JSON</span>
              <span className="text-xs text-slate-400 mt-1">Puedes seleccionar múltiples archivos a la vez.</span>
              <input type="file" accept=".json" multiple onChange={handleFileImport} className="hidden" />
            </label>
          </div>
        )}
      </div>
    </div>
  );
}
