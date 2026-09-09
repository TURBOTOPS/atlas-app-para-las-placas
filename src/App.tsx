import { useState, useCallback, useEffect } from 'react';
import { KPIHeader } from './components/KPIHeader';
import { SalesView } from './components/SalesView';
import { ReceptionView } from './components/ReceptionView';
import { LedgerView } from './components/LedgerView';
import { MetricsView } from './components/MetricsView';
import { useAppData } from './hooks/useAppData';
import { Sale, Reception } from './types';
import { formatMoney, formatDateShort } from './lib/utils';
import { ShoppingCart, PackagePlus, BookOpen, LineChart, X, Copy, Download, FileText } from 'lucide-react';
import { cn } from './lib/utils';
import * as htmlToImage from 'html-to-image';
import { jsPDF } from 'jspdf';

export default function App() {
  const {
    isLoaded, sales, receptions, config,
    addSale, addReception, deleteSale, deleteReception,
    updateConfig, importBatch, resetAll,
    getAvailableStock, getAverageLandedUnitCost
  } = useAppData();

  const [activeTab, setActiveTab] = useState<'pos' | 'migo' | 'ledger' | 'metrics'>('pos');
  const [toastMsg, setToastMsg] = useState<{msg: string, isErr?: boolean} | null>(null);
  const [docModal, setDocModal] = useState<{data: Sale | Reception, type: 'sale' | 'reception'} | null>(null);
  const [docView, setDocView] = useState<'visual' | 'json'>('visual');
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Sync dark mode class
  useEffect(() => {
    const root = window.document.documentElement;
    if (isDarkMode) root.classList.add('dark');
    else root.classList.remove('dark');
  }, [isDarkMode]);

  const showToast = useCallback((msg: string, isErr = false) => {
    setToastMsg({msg, isErr});
    setTimeout(() => setToastMsg(null), 3000);
  }, []);

  const handleRegisterSale = (sale: Sale, showDoc: boolean) => {
    addSale(sale);
    showToast(`Venta #${sale.id} registrada con éxito`);
    if (showDoc) setDocModal({data: sale, type: 'sale'});
  };

  const handleRegisterReception = (rec: Reception, showDoc: boolean) => {
    addReception(rec);
    showToast(`Ingreso #${rec.id} registrado con éxito`);
    if (showDoc) setDocModal({data: rec, type: 'reception'});
  };

  const handleExportCsv = () => {
    if (sales.length === 0) return showToast('No hay ventas para exportar', true);
    
    let csvContent = "\uFEFFID;Fecha;Cliente;RUT;Doc;Pago;Cant;Neto;IVA;Total;Stock;Ahorro;Ganancia;Notas\n";
    sales.forEach(s => {
      const date = new Date(s.timestamp).toLocaleString('es-CL');
      csvContent += `"${s.id}";"${date}";"${s.clientName}";"${s.clientRut}";"${s.docType}";"${s.paymentMethod}";${s.qty};${s.neto};${s.iva};${s.totalBruto};${s.reinvestment};${s.savings};${s.profit};"${s.notes}"\n`;
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Libro_Ventas_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const downloadJsonDoc = () => {
    if (!docModal) return;
    const jsonStr = JSON.stringify({
      _metadata: {
        generatedBy: "Atlas Automatizaciones ERP",
        exportTimestamp: new Date().toISOString(),
      },
      transaction: docModal.data
    }, null, 2);
    
    const blob = new Blob([jsonStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Comprobante_${docModal.data.id}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const downloadPdfDoc = async () => {
    if (!docModal) return;
    const element = document.getElementById('receipt-print-area');
    if (!element) return;
    
    try {
      showToast('Generando PDF...');
      
      // Force a fixed width temporarily so it doesn't get squished/cut off on mobile screens
      const originalWidth = element.style.width;
      const originalMaxWidth = element.style.maxWidth;
      element.style.width = '600px';
      element.style.maxWidth = 'none';

      const imgData = await htmlToImage.toPng(element, { 
        backgroundColor: '#ffffff',
        pixelRatio: 2,
        fontEmbedCSS: ''
      });

      // Restore original styles
      element.style.width = originalWidth;
      element.style.maxWidth = originalMaxWidth;

      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      
      // Calculate scaled dimensions for PDF (A4 is 210mm wide)
      const margin = 15;
      const pdfWidth = pdf.internal.pageSize.getWidth() - (margin * 2);
      const pdfHeight = (element.offsetHeight * pdfWidth) / 600; // using the forced 600px width
      
      pdf.addImage(imgData, 'PNG', margin, margin, pdfWidth, pdfHeight);
      pdf.save(`Comprobante_Atlas_${docModal.data.id}.pdf`);
      showToast('PDF Descargado');
    } catch (e) {
      console.error(e);
      showToast('Error al generar PDF', true);
    }
  };

  const copyJsonCode = () => {
    if (!docModal) return;
    const jsonStr = JSON.stringify({ transaction: docModal.data }, null, 2);
    navigator.clipboard.writeText(jsonStr);
    showToast('JSON copiado al portapapeles');
  };

  if (!isLoaded) return null;

  return (
    <div className="min-h-screen flex flex-col font-sans pb-16 transition-colors relative z-0">
      
      {/* Background Video (Looping infinitely) */}
      <div className="fixed inset-0 z-[-1] overflow-hidden pointer-events-none">
        <video 
          autoPlay 
          loop 
          muted 
          playsInline 
          className="w-full h-full object-cover opacity-80"
        >
          <source src="/space-bg.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-slate-950/20 mix-blend-overlay"></div>
      </div>

      <KPIHeader 
        availableStock={getAvailableStock()} 
        sales={sales} 
        isDarkMode={isDarkMode} 
        onToggleDarkMode={() => setIsDarkMode(!isDarkMode)} 
        criticalStockThreshold={config.criticalStockThreshold ?? 50}
      />

      <nav className="bg-white/10 dark:bg-slate-900/30 backdrop-blur-md border-b border-white/20 dark:border-slate-700/50 sticky top-[68px] z-20 shadow-sm overflow-x-auto transition-colors scrollbar-hide">
        <div className="max-w-5xl mx-auto px-4 flex gap-2">
          <button onClick={() => setActiveTab('pos')} className={cn("px-4 py-3 text-sm font-bold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap", activeTab === 'pos' ? "border-sky-600 text-sky-600 dark:text-sky-400" : "border-transparent text-slate-500 dark:text-slate-400")}>
            <ShoppingCart className="w-4 h-4" /> 1. POS
          </button>
          <button onClick={() => setActiveTab('migo')} className={cn("px-4 py-3 text-sm font-bold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap", activeTab === 'migo' ? "border-amber-600 text-amber-600 dark:text-amber-500" : "border-transparent text-slate-500 dark:text-slate-400")}>
            <PackagePlus className="w-4 h-4" /> 2. MIGO
          </button>
          <button onClick={() => setActiveTab('ledger')} className={cn("px-4 py-3 text-sm font-bold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap", activeTab === 'ledger' ? "border-emerald-600 text-emerald-600 dark:text-emerald-500" : "border-transparent text-slate-500 dark:text-slate-400")}>
            <BookOpen className="w-4 h-4" /> 3. Libro
          </button>
          <button onClick={() => setActiveTab('metrics')} className={cn("px-4 py-3 text-sm font-bold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap", activeTab === 'metrics' ? "border-purple-600 text-purple-600 dark:text-purple-400" : "border-transparent text-slate-500 dark:text-slate-400")}>
            <LineChart className="w-4 h-4" /> 4. Métricas
          </button>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto w-full px-4 mt-6 flex-1">
        {activeTab === 'pos' && (
          <SalesView 
            config={config} 
            availableStock={getAvailableStock()} 
            averageLandedUnitCost={getAverageLandedUnitCost()} 
            onRegisterSale={handleRegisterSale} 
          />
        )}
        {activeTab === 'migo' && (
          <ReceptionView onRegisterReception={handleRegisterReception} />
        )}
        {activeTab === 'ledger' && (
          <LedgerView 
            sales={sales} 
            receptions={receptions} 
            config={config} 
            onUpdateConfig={updateConfig} 
            onDeleteSale={deleteSale} 
            onDeleteReception={deleteReception} 
            onImportBatch={importBatch}
            onInspectDocument={(id, type) => {
              const doc = type === 'sale' ? sales.find(s => s.id === id) : receptions.find(r => r.id === id);
              if (doc) setDocModal({data: doc, type});
            }}
            onExportCsv={handleExportCsv}
          />
        )}
        {activeTab === 'metrics' && (
          <MetricsView sales={sales} isDarkMode={isDarkMode} />
        )}
      </main>

      {/* Toast Notification */}
      <div className={cn("fixed bottom-5 left-1/2 -translate-x-1/2 z-50 px-4 py-3 rounded-xl shadow-xl border text-sm font-bold flex items-center gap-2 transition-all duration-300", 
        toastMsg ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10 pointer-events-none",
        toastMsg?.isErr ? "bg-red-900 text-red-100 border-red-700" : "bg-slate-900 text-white border-slate-700 dark:bg-white dark:text-slate-900 dark:border-slate-200"
      )}>
        {toastMsg?.msg}
      </div>

      {/* Document Modal */}
      {docModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white/90 dark:bg-slate-900/80 backdrop-blur-xl rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl transition-colors border border-white/20 dark:border-slate-700/50">
            <div className="p-4 border-b border-slate-200/50 dark:border-slate-700/50 flex justify-between items-center">
              <h3 className="font-bold text-slate-800 dark:text-slate-100 text-base">Comprobante N° {docModal.data.id}</h3>
              <button onClick={() => setDocModal(null)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"><X className="w-5 h-5"/></button>
            </div>
            
            <div className="flex border-b border-slate-200/50 dark:border-slate-700/50 px-4">
              <button onClick={() => setDocView('visual')} className={cn("px-4 py-2 text-xs font-bold border-b-2", docView === 'visual' ? "border-sky-600 text-sky-600 dark:text-sky-400" : "border-transparent text-slate-500 dark:text-slate-400")}>Vista Ticket</button>
              <button onClick={() => setDocView('json')} className={cn("px-4 py-2 text-xs font-bold border-b-2", docView === 'json' ? "border-sky-600 text-sky-600 dark:text-sky-400" : "border-transparent text-slate-500 dark:text-slate-400")}>Código JSON</button>
            </div>

            <div className="p-5 overflow-y-auto flex-1 bg-transparent">
              {docView === 'visual' && docModal.type === 'sale' && (() => {
                const s = docModal.data as Sale;
                return (
                  <div id="receipt-print-area" className="relative p-6 rounded-xl border border-slate-200 shadow-sm font-sans text-sm max-w-lg mx-auto overflow-hidden">
                    <div className="absolute inset-0 z-0">
                      <img src="https://images.unsplash.com/photo-1462331940025-496dfbfc7564?q=80&w=800&auto=format&fit=crop" alt="Galaxy" crossOrigin="anonymous" className="w-full h-full object-cover" />
                    </div>
                    
                    <div className="relative z-10 bg-white/90 backdrop-blur-sm p-6 rounded-xl shadow-lg border border-white/50 space-y-6 text-slate-900">
                      <div className="text-center pb-6 border-b border-slate-300">
                      <div className="w-12 h-12 bg-sky-900 text-white rounded-full flex items-center justify-center mx-auto mb-3">
                        <FileText className="w-6 h-6" />
                      </div>
                      <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">ATLAS AUTOMATIZACIONES</h2>
                      <p className="text-xs text-slate-500 uppercase tracking-widest mt-1">Comprobante Oficial de Venta</p>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider">Cliente</span>
                        <strong className="text-sm text-slate-900">{s.clientName}</strong>
                      </div>
                      <div className="text-right">
                        <span className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider">N° Documento</span>
                        <strong className="text-sm text-slate-900">{s.id}</strong>
                      </div>
                      <div>
                        <span className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider">RUT / ID</span>
                        <span className="text-sm font-mono text-slate-700">{s.clientRut}</span>
                      </div>
                      <div className="text-right">
                        <span className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider">Fecha de Emisión</span>
                        <span className="text-sm text-slate-700">{new Date(s.timestamp).toLocaleString('es-CL', {dateStyle:'long', timeStyle:'short'})}</span>
                      </div>
                    </div>

                    <div className="border border-slate-200 rounded-lg overflow-hidden">
                      <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 border-b border-slate-200">
                          <tr>
                            <th className="py-2 px-3 font-semibold text-slate-600">Descripción</th>
                            <th className="py-2 px-3 font-semibold text-slate-600 text-center">Cant.</th>
                            <th className="py-2 px-3 font-semibold text-slate-600 text-right">Monto</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          <tr>
                            <td className="py-3 px-3 font-medium text-slate-900">Placas NFC Express</td>
                            <td className="py-3 px-3 text-center">{s.qty}</td>
                            <td className="py-3 px-3 text-right">{formatMoney(s.neto)}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>

                    <div className="flex justify-end pt-2">
                      <div className="w-1/2 space-y-2">
                        <div className="flex justify-between text-slate-600 text-xs">
                          <span>Subtotal Neto:</span>
                          <span className="font-mono">{formatMoney(s.neto)}</span>
                        </div>
                        <div className="flex justify-between text-slate-600 text-xs">
                          <span>IVA (19%):</span>
                          <span className="font-mono">{formatMoney(s.iva)}</span>
                        </div>
                        <div className="flex justify-between items-center text-slate-900 font-extrabold text-base pt-2 border-t border-slate-200">
                          <span>TOTAL:</span>
                          <span className="font-mono">{formatMoney(s.totalBruto)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="pt-6 border-t border-slate-100">
                      <span className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-2">Información de Pago</span>
                      <div className="flex gap-2">
                        <span className="px-2.5 py-1 bg-slate-100 rounded text-[10px] font-bold text-slate-600">{s.docType.toUpperCase()}</span>
                        <span className="px-2.5 py-1 bg-slate-100 rounded text-[10px] font-bold text-slate-600">{s.paymentMethod.toUpperCase()}</span>
                      </div>
                    </div>

                    {s.notes && (
                      <div className="mt-4 p-3 bg-slate-50 rounded-lg border border-slate-100">
                        <span className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Notas Adicionales</span>
                        <p className="text-xs text-slate-600 italic">{s.notes}</p>
                      </div>
                    )}
                    
                    <div className="mt-8 text-center text-[10px] text-slate-400 uppercase tracking-widest border-t border-slate-200/50 pt-4">
                      Gracias por confiar en Atlas Automatizaciones
                    </div>
                    </div>
                  </div>
                );
              })()}

              {docView === 'visual' && docModal.type === 'reception' && (() => {
                const r = docModal.data as Reception;
                return (
                  <div className="bg-amber-950 text-white p-4 rounded-xl border border-amber-800 space-y-4 text-sm font-sans max-w-lg mx-auto">
                    <div className="flex justify-between items-start pb-4 border-b border-amber-800/80">
                      <div>
                        <span className="bg-amber-500 text-slate-900 text-[10px] font-bold px-2 py-0.5 rounded uppercase">MIGO - Recepción</span>
                        <h4 className="text-lg font-extrabold mt-2">{r.supplier}</h4>
                        <p className="text-xs text-amber-200/70">Fecha: {formatDateShort(r.arrivalDate)}</p>
                      </div>
                      <div className="text-right font-mono">
                        <span className="text-xs text-amber-300 block">Placas NFC</span>
                        <span className="text-2xl font-bold text-white">+{r.qty} UN.</span>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-xs font-mono">
                      <div><span className="text-amber-400 block text-[10px]">TRACKING</span><span className="font-semibold">{r.tracking}</span></div>
                      <div><span className="text-amber-400 block text-[10px]">TRÁNSITO</span><span className="font-semibold">{r.transitDays} Días</span></div>
                    </div>
                    <div className="space-y-1 text-xs border-t border-amber-800/80 pt-3">
                      <div className="flex justify-between text-amber-200"><span>FOB USD:</span><span>${r.usdFob}</span></div>
                      <div className="flex justify-between text-amber-200"><span>Flete/Aduana CLP:</span><span>{formatMoney(r.courierTaxesClp)}</span></div>
                      <div className="flex justify-between font-bold text-amber-100 text-sm pt-1 border-t border-amber-800">
                        <span>Landed Total CLP:</span><span>{formatMoney(r.totalLandedClp)}</span>
                      </div>
                      <div className="flex justify-between text-emerald-400 font-bold">
                        <span>Unitario Efectivo:</span><span>{formatMoney(r.unitLandedClp)} / placa</span>
                      </div>
                    </div>
                    {r.notes && <p className="text-xs text-amber-200/80 bg-amber-900/50 p-2 rounded">Notas: {r.notes}</p>}
                    {r.receiptImage && <img src={r.receiptImage} className="max-h-48 rounded border border-amber-700 mx-auto" alt="Receipt"/>}
                  </div>
                );
              })()}

              {docView === 'json' && (
                <pre className="bg-slate-900 text-emerald-400 font-mono text-xs p-4 rounded-xl overflow-x-auto whitespace-pre-wrap max-w-2xl mx-auto">
                  {JSON.stringify(docModal.data, null, 2)}
                </pre>
              )}
            </div>

            <div className="p-4 border-t border-slate-200/50 dark:border-slate-700/50 flex justify-between bg-transparent">
              <button onClick={copyJsonCode} className="px-4 py-2 bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 flex items-center gap-2 transition-colors">
                <Copy className="w-4 h-4"/> Copiar JSON
              </button>
              <div className="flex gap-2">
                <button onClick={downloadJsonDoc} className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-lg flex items-center gap-2 shadow-sm transition-colors">
                  <Download className="w-4 h-4"/> JSON
                </button>
                {docView === 'visual' && docModal.type === 'sale' && (
                  <button onClick={downloadPdfDoc} className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold rounded-lg flex items-center gap-2 shadow-sm transition-colors">
                    <FileText className="w-4 h-4"/> Descargar PDF
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
