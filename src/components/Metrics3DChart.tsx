import { useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Text, ContactShadows, Environment } from '@react-three/drei';
import { formatMoney } from '../lib/utils';

interface ChartData {
  date: string;
  ventas: number;
  ganancia: number;
}

interface Metrics3DChartProps {
  data: ChartData[];
  isDarkMode: boolean;
}

function Bar({ position, height, color, label, value, date, isDarkMode, onHover }: any) {
  const [hovered, setHovered] = useState(false);

  return (
    <group position={position}>
      <mesh 
        position={[0, height / 2, 0]} 
        onPointerOver={(e) => { 
          e.stopPropagation(); 
          setHovered(true);
          onHover({ label, value, date, color });
        }}
        onPointerOut={(e) => {
          e.stopPropagation();
          setHovered(false);
          onHover(null);
        }}
        castShadow
        receiveShadow
      >
        <boxGeometry args={[0.5, Math.max(height, 0.05), 0.5]} />
        <meshStandardMaterial 
          color={hovered ? '#fbbf24' : color} 
          roughness={0.2} 
          metalness={0.4} 
        />
      </mesh>
    </group>
  );
}

export function Metrics3DChart({ data, isDarkMode }: Metrics3DChartProps) {
  const maxVal = Math.max(...data.map(d => Math.max(d.ventas, d.ganancia)), 1);
  const maxHeight = 4;
  const spacing = 1.4;
  const startX = -((data.length - 1) * spacing) / 2;
  const [activeTooltip, setActiveTooltip] = useState<any>(null);

  return (
    <div className="w-full h-full relative cursor-move rounded-xl overflow-hidden bg-gradient-to-b from-transparent to-slate-50 dark:to-slate-900/50">
      <div className="absolute top-2 right-2 z-10 bg-black/40 backdrop-blur text-white text-[10px] px-2 py-1 rounded-md font-bold uppercase tracking-wider pointer-events-none">
        Arrastra para rotar
      </div>
      
      {activeTooltip && (
        <div className="absolute top-4 left-4 z-20 bg-slate-900/95 text-white px-3 py-2 rounded-xl text-xs whitespace-nowrap backdrop-blur-md border border-slate-700 shadow-2xl pointer-events-none">
          <p className="font-extrabold text-slate-200 mb-1 border-b border-slate-700 pb-1">{activeTooltip.date}</p>
          <div className="flex gap-3 items-center">
            <span className="w-2.5 h-2.5 rounded-full shadow-sm" style={{backgroundColor: activeTooltip.color}}></span>
            <span className="capitalize font-medium text-slate-300">{activeTooltip.label}:</span>
            <span className="font-bold text-sm text-white">{formatMoney(activeTooltip.value)}</span>
          </div>
        </div>
      )}

      <Canvas camera={{ position: [0, 4, 9], fov: 45 }} shadows>
        <ambientLight intensity={isDarkMode ? 0.5 : 0.8} />
        <directionalLight 
          position={[10, 10, 5]} 
          intensity={1.5} 
          castShadow 
          shadow-mapSize={[1024, 1024]} 
          shadow-camera-far={20}
          shadow-camera-left={-10}
          shadow-camera-right={10}
          shadow-camera-top={10}
          shadow-camera-bottom={-10}
        />
        <Environment preset="city" />
        
        <OrbitControls 
          enablePan={false} 
          minPolarAngle={Math.PI / 8} 
          maxPolarAngle={Math.PI / 2 - 0.05} 
          minDistance={4}
          maxDistance={15}
          autoRotate={false}
        />

        <group position={[0, -1.5, 0]}>
          {data.map((item, i) => {
            const x = startX + i * spacing;
            const hVentas = (item.ventas / maxVal) * maxHeight;
            const hGanancia = (item.ganancia / maxVal) * maxHeight;

            return (
              <group key={item.date} position={[x, 0, 0]}>
                {/* Ventas */}
                <Bar 
                  position={[-0.3, 0, 0]} 
                  height={hVentas} 
                  color="#0ea5e9" 
                  label="Ventas Brutas" 
                  value={item.ventas} 
                  date={item.date}
                  isDarkMode={isDarkMode}
                  onHover={setActiveTooltip}
                />
                {/* Ganancia */}
                <Bar 
                  position={[0.3, 0, 0.4]} 
                  height={hGanancia} 
                  color="#10b981" 
                  label="Ganancia Libre" 
                  value={item.ganancia} 
                  date={item.date}
                  isDarkMode={isDarkMode}
                  onHover={setActiveTooltip}
                />
                
                {/* Date Label on floor */}
                <Text 
                  position={[0, 0.05, 1.2]} 
                  rotation={[-Math.PI / 2, 0, 0]} 
                  fontSize={0.25} 
                  color={isDarkMode ? '#94a3b8' : '#475569'}
                  anchorX="center"
                  anchorY="middle"
                  fontWeight="bold"
                >
                  {item.date}
                </Text>
              </group>
            );
          })}
          
          <ContactShadows position={[0, 0, 0]} opacity={0.6} scale={20} blur={2.5} far={4} color={isDarkMode ? '#000000' : '#1e293b'} />
        </group>
      </Canvas>
    </div>
  );
}
