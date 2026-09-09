import { useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell } from 'recharts';
import { Sale } from '../types';
import { formatMoney } from '../lib/utils';
import { TrendingUp, Percent, Coins, BarChart3, Layers, PieChart as PieChartIcon } from 'lucide-react';
import { Metrics3DChart } from './Metrics3DChart';

interface MetricsViewProps {
  sales: Sale[];
  isDarkMode: boolean;
}

export function MetricsView({ sales, isDarkMode }: MetricsViewProps) {
  // Process data for charts
  const { chartData, totals } = useMemo(() => {
    // 1. Group by Date
    const grouped = sales.reduce((acc, sale) => {
      const date = sale.timestamp.split('T')[0];
      if (!acc[date]) {
        acc[date] = { date, ventas: 0, iva: 0, ganancia: 0, neto: 0, stock: 0 };
      }
      acc[date].ventas += sale.totalBruto;
      acc[date].iva += sale.iva;
      acc[date].ganancia += sale.profit;
      acc[date].neto += sale.neto;
      acc[date].stock += sale.reinvestment;
      return acc;
    }, {} as Record<string, any>);
    
    let sortedData = Object.values(grouped).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    // Fill recent 7 days if empty for better display
    if (sortedData.length === 0) {
      sortedData = [{ date: new Date().toISOString().split('T')[0], ventas: 0, iva: 0, ganancia: 0, neto: 0, stock: 0 }];
    }
    
    // 2. Aggregate Totals
    const t = sales.reduce((acc, s) => {
      acc.total += s.totalBruto;
      acc.neto += s.neto;
      acc.ganancia += s.profit;
      acc.reinvestment += s.reinvestment;
      acc.savings += s.savings;
      acc.iva += s.iva;
      return acc;
    }, { total: 0, neto: 0, ganancia: 0, reinvestment: 0, savings: 0, iva: 0 });

    return { chartData: sortedData, totals: t };
  }, [sales]);

  const pieData = totals.total > 0 ? [
    { name: 'Stock (Reinvert.)', value: totals.reinvestment, fill: 'url(#sphereSky)' },
    { name: 'Ahorro', value: totals.savings, fill: 'url(#spherePurple)' },
    { name: 'Ganancia', value: totals.ganancia, fill: 'url(#sphereEmerald)' },
    { name: 'IVA (Reserva)', value: totals.iva, fill: 'url(#sphereAmber)' }
  ] : [
    { name: 'Sin Ventas', value: 1, fill: isDarkMode ? '#334155' : '#e2e8f0' }
  ];

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-md p-4 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700 text-xs z-50 relative">
          <p className="font-extrabold mb-3 dark:text-slate-100 text-sm border-b border-slate-200 dark:border-slate-700 pb-2">{label}</p>
          {payload.map((p: any) => (
            <div key={p.name} className="flex gap-4 items-center justify-between mb-1.5">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full shadow-inner" style={{background: p.payload?.fill || p.color}}></span>
                <span className="text-slate-600 dark:text-slate-300 font-medium capitalize">{p.name}:</span>
              </div>
              <span className="font-bold dark:text-white text-sm">{p.name === 'Sin Ventas' ? '0' : formatMoney(p.value)}</span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  const chartAxisColor = isDarkMode ? '#94a3b8' : '#64748b'; 

  // 3D Block CSS classes
  const block3DClass = "bg-white/10 dark:bg-slate-800/40 backdrop-blur-md rounded-2xl p-6 border-2 border-b-[8px] border-r-[6px] border-white/20 dark:border-slate-700/50 shadow-xl transform transition-transform hover:-translate-y-1 hover:translate-x-1 hover:border-b-[6px] hover:border-r-[4px] relative z-10";

  return (
    <div className="space-y-8 pb-10">
      {/* SVG Definitions for 3D Effects - MUST NOT BE display: none */}
      <svg style={{ position: 'absolute', width: 0, height: 0, overflow: 'hidden', zIndex: -1 }} aria-hidden="true" focusable="false">
        <defs>
          <filter id="shadow3d" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="4" dy="6" stdDeviation="4" floodOpacity={isDarkMode ? "0.6" : "0.25"} floodColor={isDarkMode ? "#000" : "#0f172a"} />
          </filter>
          <filter id="shadowLight" x="-10%" y="-10%" width="120%" height="120%">
            <feDropShadow dx="0" dy="8" stdDeviation="6" floodOpacity={isDarkMode ? "0.4" : "0.15"} floodColor="#0ea5e9" />
          </filter>

          {/* Spherical Pie Gradients */}
          <radialGradient id="sphereSky" cx="30%" cy="30%" r="70%">
            <stop offset="0%" stopColor="#bae6fd" />
            <stop offset="40%" stopColor="#0ea5e9" />
            <stop offset="100%" stopColor="#075985" />
          </radialGradient>
          <radialGradient id="spherePurple" cx="30%" cy="30%" r="70%">
            <stop offset="0%" stopColor="#f3e8ff" />
            <stop offset="40%" stopColor="#a855f7" />
            <stop offset="100%" stopColor="#581c87" />
          </radialGradient>
          <radialGradient id="sphereEmerald" cx="30%" cy="30%" r="70%">
            <stop offset="0%" stopColor="#d1fae5" />
            <stop offset="40%" stopColor="#10b981" />
            <stop offset="100%" stopColor="#065f46" />
          </radialGradient>
          <radialGradient id="sphereAmber" cx="30%" cy="30%" r="70%">
            <stop offset="0%" stopColor="#fef3c7" />
            <stop offset="40%" stopColor="#f59e0b" />
            <stop offset="100%" stopColor="#92400e" />
          </radialGradient>
        </defs>
      </svg>

      {/* KPI 3D Blocks */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className={block3DClass}>
          <div className="flex items-center gap-3 text-sky-600 dark:text-sky-400 mb-3">
            <div className="p-2 bg-sky-100 dark:bg-sky-900/40 rounded-lg shadow-inner"><TrendingUp className="w-6 h-6" /></div>
            <h3 className="text-xs font-extrabold uppercase tracking-widest">Ingresos Brutos</h3>
          </div>
          <p className="text-4xl font-black text-slate-800 dark:text-white tracking-tight" style={{textShadow: isDarkMode ? '0 2px 10px rgba(0,0,0,0.5)' : 'none'}}>{formatMoney(totals.total)}</p>
        </div>
        
        <div className={block3DClass}>
          <div className="flex items-center gap-3 text-emerald-600 dark:text-emerald-500 mb-3">
            <div className="p-2 bg-emerald-100 dark:bg-emerald-900/40 rounded-lg shadow-inner"><Coins className="w-6 h-6" /></div>
            <h3 className="text-xs font-extrabold uppercase tracking-widest">Utilidad Libre</h3>
          </div>
          <p className="text-4xl font-black text-slate-800 dark:text-white tracking-tight" style={{textShadow: isDarkMode ? '0 2px 10px rgba(0,0,0,0.5)' : 'none'}}>{formatMoney(totals.ganancia)}</p>
        </div>

        <div className={block3DClass}>
          <div className="flex items-center gap-3 text-purple-600 dark:text-purple-400 mb-3">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/40 rounded-lg shadow-inner"><Percent className="w-6 h-6" /></div>
            <h3 className="text-xs font-extrabold uppercase tracking-widest">Margen Promedio</h3>
          </div>
          <p className="text-4xl font-black text-slate-800 dark:text-white tracking-tight" style={{textShadow: isDarkMode ? '0 2px 10px rgba(0,0,0,0.5)' : 'none'}}>
            {totals.neto > 0 ? Math.round((totals.ganancia / totals.neto) * 100) : 0}%
          </p>
          <p className="text-[10px] text-slate-400 mt-1 font-bold">SOBRE VALOR NETO</p>
        </div>
      </div>

      {/* Area Chart */}
      <div className={block3DClass}>
        <div className="flex items-center gap-2 mb-6 relative z-10">
          <Layers className="w-5 h-5 text-slate-400" />
          <h3 className="font-extrabold text-slate-800 dark:text-slate-100 text-sm uppercase tracking-wider">Evolución de Flujo (Área)</h3>
        </div>
        <div className="h-72 relative z-10">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="areaVentas" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.5}/>
                  <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="areaGanancia" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.5}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDarkMode ? '#334155' : '#e2e8f0'} />
              <XAxis dataKey="date" tick={{fontSize: 10, fill: chartAxisColor, fontWeight: 'bold'}} tickLine={false} axisLine={false} />
              <YAxis tickFormatter={(val) => `$${val/1000}k`} tick={{fontSize: 10, fill: chartAxisColor, fontWeight: 'bold'}} tickLine={false} axisLine={false} />
              <Tooltip content={<CustomTooltip />} cursor={{stroke: isDarkMode ? '#475569' : '#cbd5e1', strokeWidth: 2, strokeDasharray: '4 4'}} />
              <Area type="monotone" dataKey="ventas" name="Ventas Brutas" stroke="#0284c7" strokeWidth={4} fillOpacity={1} fill="url(#areaVentas)" filter="url(#shadowLight)" />
              <Area type="monotone" dataKey="ganancia" name="Ganancia Libre" stroke="#047857" strokeWidth={4} fillOpacity={1} fill="url(#areaGanancia)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* React Three Fiber 3D Scene */}
        <div className={block3DClass}>
          <div className="flex items-center gap-2 mb-2 relative z-10 pointer-events-none">
            <BarChart3 className="w-5 h-5 text-slate-400" />
            <h3 className="font-extrabold text-slate-800 dark:text-slate-100 text-sm uppercase tracking-wider">Comparativa (3D Real)</h3>
          </div>
          <div className="h-[280px] -mx-6 -mb-6 relative z-0">
            {totals.total === 0 && (
              <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
                <p className="text-slate-400 dark:text-slate-500 font-bold text-sm bg-white/80 dark:bg-slate-800/80 px-4 py-2 rounded-full backdrop-blur-sm">Aún no hay ventas para analizar</p>
              </div>
            )}
            <Metrics3DChart data={chartData} isDarkMode={isDarkMode} />
          </div>
        </div>

        {/* Pie Chart */}
        <div className={block3DClass}>
          <div className="flex items-center gap-2 mb-2 relative z-10">
            <PieChartIcon className="w-5 h-5 text-slate-400" />
            <h3 className="font-extrabold text-slate-800 dark:text-slate-100 text-sm uppercase tracking-wider">Distribución (Esferas)</h3>
          </div>
          <div className="h-72 flex items-center justify-center relative z-10">
            {totals.total === 0 && (
              <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
                <p className="text-slate-400 dark:text-slate-500 font-bold text-sm bg-white/80 dark:bg-slate-800/80 px-4 py-2 rounded-full backdrop-blur-sm">Aún no hay ventas para analizar</p>
              </div>
            )}
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={95}
                  paddingAngle={6}
                  dataKey="value"
                  stroke="none"
                  isAnimationActive={true}
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} filter={totals.total > 0 ? "url(#shadow3d)" : undefined} opacity={totals.total === 0 ? 0.3 : 1} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend iconType="circle" wrapperStyle={{fontSize: '12px', fontWeight: 'bold', color: chartAxisColor}} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}

