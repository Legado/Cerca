import React, { useState, useEffect, useRef } from 'react';

// ============================================
// PROXIMITY MAP BACKGROUND
// ============================================
const ProximityMapBackground = ({ activeSection, intensity = 0 }) => {
  const canvasRef = useRef(null);
  const animationRef = useRef(null);
  const timeRef = useRef(0);
  const cityParticlesRef = useRef({ pedestrians: [], streets: { horizontal: [], vertical: [] } });
  const journeyParticlesRef = useRef([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let width = canvas.width = window.innerWidth;
    let height = canvas.height = window.innerHeight;

    const createCityStreets = (radius) => {
      const streets = { horizontal: [], vertical: [] };
      const spacing = 15;
      const numStreets = Math.floor(radius / spacing);
      for (let i = -numStreets; i <= numStreets; i++) {
        const pos = i * spacing;
        if (Math.abs(pos) < radius * 0.9) {
          streets.horizontal.push(pos);
          streets.vertical.push(pos);
        }
      }
      return streets;
    };

    const createPedestrian = (streets, radius) => {
      const isHorizontal = Math.random() > 0.5;
      const streetArray = isHorizontal ? streets.horizontal : streets.vertical;
      const baseStreetPos = streetArray[Math.floor(Math.random() * streetArray.length)];
      const sidewalkOffset = (Math.random() > 0.5 ? 1 : -1) * 5;
      const streetPos = baseStreetPos + sidewalkOffset;
      const maxExtent = Math.sqrt(Math.max(0, radius * radius - streetPos * streetPos)) * 0.75;
      const startAtPositive = Math.random() > 0.5;
      const startPos = startAtPositive ? maxExtent * 0.95 : -maxExtent * 0.95;
      
      return {
        type: 'pedestrian',
        isHorizontal,
        streetPos,
        pos: startPos,
        direction: startAtPositive ? -1 : 1,
        speed: 0.4 + Math.random() * 0.5,
        size: 1.2,
        alive: true,
        wobblePhase: Math.random() * Math.PI * 2,
        wobbleSpeed: 0.06 + Math.random() * 0.04
      };
    };

    const initProximityParticles = (innerRadius, outerRadius) => {
      const particles = [];
      const count = 6;
      for (let i = 0; i < count; i++) {
        const minDist = innerRadius * 1.5;
        const maxDist = outerRadius * 0.80;
        const radius = minDist + (maxDist - minDist) * (i / (count - 1));
        const angle = (Math.PI * 2 * i / count);
        const orbitSpeed = 0.0002 + Math.random() * 0.0003;
        const size = 2 + ((radius - minDist) / (maxDist - minDist)) * 3;
        particles.push({
          radius, angle, orbitSpeed: orbitSpeed * (Math.random() > 0.5 ? 1 : -1),
          size, baseSize: size, breathSpeed: 0.5 + Math.random() * 0.5,
          breathPhase: Math.random() * Math.PI * 2,
          opacity: 0.4 + ((radius - minDist) / (maxDist - minDist)) * 0.2
        });
      }
      return particles;
    };

    const initialize = () => {
      const refSize = Math.min(width, height);
      const innerRadius = refSize * 0.15;
      const outerRadius = refSize * 0.45;
      const streets = createCityStreets(innerRadius);
      cityParticlesRef.current = { 
        streets, 
        pedestrians: Array.from({ length: 5 }, () => createPedestrian(streets, innerRadius)) 
      };
      journeyParticlesRef.current = initProximityParticles(innerRadius, outerRadius);
    };

    initialize();

    const animate = () => {
      timeRef.current += 0.016;
      const t = activeSection >= 0 ? Math.min(1, intensity) : 0;
      const centerX = width / 2;
      const centerY = height / 2;
      const refSize = Math.min(width, height);
      const innerRadius = refSize * 0.15;
      const outerRadius = refSize * 0.45;

      ctx.clearRect(0, 0, width, height);
      const bgGradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, Math.max(width, height));
      bgGradient.addColorStop(0, t > 0.5 ? '#0d1210' : '#0a0a0a');
      bgGradient.addColorStop(1, t > 0.5 ? '#050805' : '#050505');
      ctx.fillStyle = bgGradient;
      ctx.fillRect(0, 0, width, height);

      // CIUDAD
      ctx.save();
      ctx.beginPath();
      ctx.arc(centerX, centerY, innerRadius, 0, Math.PI * 2);
      ctx.clip();
      ctx.fillStyle = t > 0.3 ? 'rgba(20, 25, 22, 0.5)' : 'rgba(18, 18, 18, 0.5)';
      ctx.fill();

      ctx.strokeStyle = t > 0.3 ? 'rgba(45, 74, 62, 0.25)' : 'rgba(50, 50, 50, 0.3)';
      cityParticlesRef.current.streets.horizontal.forEach(y => {
        const maxX = Math.sqrt(Math.max(0, innerRadius * innerRadius - y * y));
        ctx.beginPath(); ctx.moveTo(centerX - maxX, centerY + y); ctx.lineTo(centerX + maxX, centerY + y); ctx.stroke();
      });
      cityParticlesRef.current.streets.vertical.forEach(x => {
        const maxY = Math.sqrt(Math.max(0, innerRadius * innerRadius - x * x));
        ctx.beginPath(); ctx.moveTo(centerX + x, centerY - maxY); ctx.lineTo(centerX + x, centerY + maxY); ctx.stroke();
      });

      cityParticlesRef.current.pedestrians.forEach(p => {
        if (!p.alive) return;
        p.pos += p.direction * p.speed;
        p.wobblePhase += p.wobbleSpeed;
        const wobble = Math.sin(p.wobblePhase) * 2;
        const x = p.isHorizontal ? centerX + p.pos : centerX + p.streetPos + wobble;
        const y = p.isHorizontal ? centerY + p.streetPos + wobble : centerY + p.pos;
        
        if (Math.sqrt((x - centerX)**2 + (y - centerY)**2) > innerRadius * 0.8) { p.alive = false; }
        else {
          ctx.beginPath(); ctx.arc(x, y, p.size, 0, Math.PI * 2);
          ctx.fillStyle = t > 0.3 ? 'rgba(180, 200, 180, 0.35)' : 'rgba(180, 180, 180, 0.30)';
          ctx.fill();
        }
      });
      cityParticlesRef.current.pedestrians = cityParticlesRef.current.pedestrians.filter(p => p.alive);
      if (cityParticlesRef.current.pedestrians.length < Math.min(80, 5 + timeRef.current * 0.5)) {
        cityParticlesRef.current.pedestrians.push(createPedestrian(cityParticlesRef.current.streets, innerRadius));
      }
      ctx.restore();

      // Borde ciudad
      ctx.beginPath(); ctx.arc(centerX, centerY, innerRadius, 0, Math.PI * 2);
      ctx.strokeStyle = t > 0.3 ? 'rgba(212, 163, 115, 0.4)' : 'rgba(255, 255, 255, 0.15)';
      ctx.lineWidth = 1.5; ctx.stroke();

      // PARTÍCULAS PROXIMIDAD
      journeyParticlesRef.current.forEach(p => {
        p.angle += p.orbitSpeed;
        const x = centerX + Math.cos(p.angle) * p.radius;
        const y = centerY + Math.sin(p.angle) * p.radius;
        const currentSize = p.baseSize + Math.sin(timeRef.current * p.breathSpeed + p.breathPhase) * 0.5;
        ctx.beginPath(); ctx.arc(x, y, currentSize, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(188, 108, 37, ${p.opacity})`;
        ctx.fill();
      });

      // ANILLOS
      [0.3, 0.5, 0.7, 0.9].forEach((r, i) => {
        const radius = r * refSize / 2;
        ctx.beginPath(); ctx.arc(centerX, centerY, radius + Math.sin(timeRef.current + i * 0.5) * 2, 0, Math.PI * 2);
        ctx.strokeStyle = t > 0.3 ? `rgba(88, 129, 87, ${0.1 + i * 0.05})` : `rgba(255, 255, 255, ${0.03 + i * 0.02})`;
        ctx.setLineDash([5, 15]); ctx.stroke(); ctx.setLineDash([]);
      });

      // ETIQUETA
      if (t > 0.1) {
        ctx.font = 'italic 11px Georgia, serif';
        ctx.fillStyle = `rgba(212, 163, 115, ${0.5 + t * 0.5})`;
        ctx.textAlign = 'center'; ctx.fillText('Tu ciudad', centerX, centerY + innerRadius + 20);
      }

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();
    const handleResize = () => { width = canvas.width = window.innerWidth; height = canvas.height = window.innerHeight; initialize(); };
    window.addEventListener('resize', handleResize);
    return () => { cancelAnimationFrame(animationRef.current); window.removeEventListener('resize', handleResize); };
  }, [activeSection, intensity]);

  return <canvas ref={canvasRef} className="fixed inset-0 z-0" />;
};

// ============================================
// UI COMPONENTS
// ============================================
const GlassCard = ({ children, className = '', glow = false }) => (
  <div className={`relative overflow-hidden rounded-2xl bg-white/[0.03] border border-white/[0.08] ${glow ? 'shadow-lg shadow-amber-900/10' : ''} ${className}`} style={{ backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)' }}>
    <div className="absolute inset-0 bg-gradient-to-br from-white/[0.04] to-transparent pointer-events-none" />
    <div className="relative z-10">{children}</div>
  </div>
);

const RadarChart = ({ data, size = 300 }) => {
  const [animated, setAnimated] = useState(false);
  const center = size / 2;
  const radius = size * 0.36;
  useEffect(() => { setAnimated(true); }, []);
  const points = data.map((d, i) => {
    const angle = (Math.PI * 2 * i) / data.length - Math.PI / 2;
    const val = animated ? d.value : 0;
    return { x: center + Math.cos(angle) * radius * val, y: center + Math.sin(angle) * radius * val, lx: center + Math.cos(angle) * (radius + 40), ly: center + Math.sin(angle) * (radius + 40), ...d };
  });
  const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ') + ' Z';
  return (
    <svg width={size} height={size} className="overflow-visible">
      <defs><linearGradient id="radGrad"><stop offset="0%" stopColor="rgba(212,163,115,0.3)"/><stop offset="100%" stopColor="rgba(88,129,87,0.2)"/></linearGradient></defs>
      {[0.25, 0.5, 0.75, 1].map((r, i) => <circle key={i} cx={center} cy={center} r={radius * r} fill="none" stroke="rgba(255,255,255,0.06)" />)}
      <path d={pathD} fill="url(#radGrad)" stroke="rgba(212,163,115,0.8)" strokeWidth="2" className="transition-all duration-1000" />
      {points.map((p, i) => (
        <g key={i}>
          <circle cx={p.x} cy={p.y} r="4" fill="#d4a373" />
          <text x={p.lx} y={p.ly} fill="rgba(255,255,255,0.7)" fontSize="10" textAnchor="middle">{p.label}</text>
        </g>
      ))}
    </svg>
  );
};

const WaveformVisualizer = ({ isPlaying, type = 'urban' }) => {
  const [heights, setHeights] = useState(Array(40).fill(0.1));
  useEffect(() => {
    if (!isPlaying) return;
    const int = setInterval(() => {
      setHeights(h => h.map(() => type === 'urban' ? Math.random() * 0.8 : Math.sin(Date.now()/500 + Math.random())*0.3 + 0.4));
    }, 100);
    return () => clearInterval(int);
  }, [isPlaying, type]);
  return (
    <div className="flex items-end justify-center gap-1 h-16">
      {heights.map((h, i) => (
        <div key={i} className="w-1 rounded-full transition-all duration-150" style={{ height: `${h * 100}%`, backgroundColor: type === 'urban' ? `rgba(180,180,180,${0.3+h})` : `rgba(88,129,87,${0.4+h})` }} />
      ))}
    </div>
  );
};

const FeasibilityMatrix = () => {
  const criteria = [
    { name: 'Coherencia', score: 92, color: '#d4a373' },
    { name: 'Pertinencia', score: 88, color: '#588157' },
    { name: 'Claridad', score: 95, color: '#bc6c25' },
    { name: 'Viabilidad', score: 85, color: '#6b7f5a' }
  ];
  return (
    <div className="space-y-4">
      {criteria.map((c, i) => (
        <div key={i}>
          <div className="flex justify-between text-xs mb-1 text-white"><span>{c.name}</span><span>{c.score}%</span></div>
          <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
            <div className="h-full transition-all duration-1000" style={{ width: `${c.score}%`, backgroundColor: c.color }} />
          </div>
        </div>
      ))}
    </div>
  );
};

const NavNode = ({ label, iconKey, active, onClick, angle, distance }) => {
  const x = 50 + Math.cos(angle) * distance * 50;
  const y = 50 + Math.sin(angle) * distance * 50;
  return (
    <button onClick={onClick} className={`absolute transform -translate-x-1/2 -translate-y-1/2 transition-all duration-500 ${active ? 'scale-110 z-20' : 'z-10 hover:scale-105'}`} style={{ left: `${x}%`, top: `${y}%` }}>
      <div className={`w-14 h-14 md:w-16 md:h-16 rounded-full flex items-center justify-center border backdrop-blur-md transition-all ${active ? 'bg-white/10 border-white/40 shadow-xl' : 'bg-white/5 border-white/10'}`}>
        <span className={active ? 'text-white' : 'text-white/40'}>{label.substring(0,2)}</span>
      </div>
    </button>
  );
};

const SlideOverPanel = ({ isOpen, onClose, title, subtitle, children }) => (
  <>
    <div className={`fixed inset-0 bg-black/70 backdrop-blur-sm z-40 transition-opacity ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} onClick={onClose} />
    <div className={`fixed right-0 top-0 bottom-0 w-full max-w-2xl z-50 bg-[#0a0a0a] border-l border-white/10 transform transition-transform duration-500 ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
      <div className="p-8 h-full overflow-y-auto custom-scrollbar">
        <button onClick={onClose} className="float-right text-white/40 text-2xl">&times;</button>
        <p className="text-amber-500 text-xs tracking-widest uppercase mb-2">{subtitle}</p>
        <h2 className="text-3xl font-light text-white mb-8" style={{ fontFamily: 'Georgia, serif' }}>{title}</h2>
        {children}
      </div>
    </div>
  </>
);

// ============================================
// SECTIONS CONTENT
// ============================================
const ClienteContent = () => (
  <div className="space-y-8 text-gray-300">
    <p className="text-lg">El público de <span className="text-amber-400">Cerca</span> no busca escapismo, busca permiso para desconectar.</p>
    <GlassCard className="p-6 flex justify-center"><RadarChart data={[{label:'Estrés',value:0.9},{label:'Uso Digital',value:0.8},{label:'Tiempo',value:0.3},{label:'Conciencia',value:0.7},{label:'Exigencia',value:0.9}]} /></GlassCard>
    <div className="grid gap-4">
      {['Pobreza de tiempo','Fatiga digital','Consumo consciente'].map((t,i) => (
        <GlassCard key={i} className="p-4"><p className="text-white font-medium">{t}</p><p className="text-sm text-gray-500">Análisis psicográfico del segmento urbano saturado.</p></GlassCard>
      ))}
    </div>
  </div>
);

const RecursosContent = () => {
  const [p1, setP1] = useState(false);
  return (
    <div className="space-y-6">
      <GlassCard className="p-6 text-center">
        <p className="text-xs text-amber-400 mb-4 uppercase">El ritmo del silencio</p>
        <WaveformVisualizer isPlaying={p1} type="cerca" />
        <button onClick={()=>setP1(!p1)} className="mt-4 px-4 py-2 bg-white/5 rounded-full text-xs text-white">Simular atmósfera CERCA</button>
      </GlassCard>
      <div className="grid grid-cols-2 gap-4">
        {['#d4a373', '#588157', '#bc6c25', '#283618'].map(c => <div key={c} className="h-12 rounded-lg" style={{ backgroundColor: c }} />)}
      </div>
    </div>
  );
};

// ============================================
// MAIN APP
// ============================================
export default function CercaProximityLens() {
  const [activeSection, setActiveSection] = useState(-1);
  const [panelOpen, setPanelOpen] = useState(false);
  const [bgIntensity, setBgIntensity] = useState(0);

  const sections = [
    { id: 0, label: 'Cliente', title: 'Urbano Saturado', subtitle: 'Análisis', content: ClienteContent },
    { id: 1, label: 'Recursos', title: 'Estética Intimidad', subtitle: 'Recursos', content: RecursosContent },
    { id: 2, label: 'Narrativa', title: 'Storytelling', subtitle: 'Marca', content: () => <div className="text-white">"No hace falta ir lejos para sentir que te has ido"</div> },
    { id: 3, label: 'Viabilidad', title: 'Asset Light', subtitle: 'Riesgos', content: FeasibilityMatrix },
    { id: 4, label: 'Símbolos', title: 'Semiótica', subtitle: 'Cultura', content: () => <div className="text-gray-400">Símbolos de la maleta vacía y el círculo de 90min.</div> }
  ];

  const handleNodeClick = (i) => { setActiveSection(i); setBgIntensity(1); setPanelOpen(true); };
  const handleClose = () => { setPanelOpen(false); setTimeout(() => { setActiveSection(-1); setBgIntensity(0); }, 500); };

  return (
    <div className="relative w-full h-screen overflow-hidden bg-[#050505] font-sans">
      <ProximityMapBackground activeSection={activeSection} intensity={bgIntensity} />
      
      <header className="absolute top-0 w-full p-10 z-30">
        <h1 className="text-4xl text-white font-light" style={{ fontFamily: 'Georgia, serif' }}>Cerca<span className="text-amber-500">.</span></h1>
        <p className="text-[10px] text-white/30 tracking-[0.3em] uppercase">Protocolo RAA v12.0</p>
      </header>

      <div className={`absolute inset-0 flex items-center justify-center pointer-events-none transition-opacity duration-700 ${panelOpen ? 'opacity-0' : 'opacity-100'}`}>
        <div className="text-center">
          <p className="text-2xl italic text-white/80" style={{ fontFamily: 'Georgia, serif' }}>"No hace falta ir lejos para<br/>sentir que te has ido"</p>
        </div>
      </div>

      <div className="absolute" style={{ width: 'min(90vw, 90vh)', height: 'min(90vw, 90vh)', left: '50%', top: '50%', transform: 'translate(-50%, -50%)' }}>
        {sections.map((s, i) => (
          <NavNode key={i} label={s.label} active={activeSection === i} onClick={() => handleNodeClick(i)} angle={-Math.PI/2 + (i * 2 * Math.PI / 5)} distance={0.7} />
        ))}
      </div>

      <SlideOverPanel isOpen={panelOpen} onClose={handleClose} title={activeSection >= 0 ? sections[activeSection].title : ''} subtitle={activeSection >= 0 ? sections[activeSection].subtitle : ''}>
        {activeSection >= 0 && React.createElement(sections[activeSection].content)}
      </SlideOverPanel>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(212,163,115,0.2); border-radius: 10px; }
      `}</style>
    </div>
  );
}
