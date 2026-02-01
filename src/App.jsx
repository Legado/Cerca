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

      ctx.beginPath(); ctx.arc(centerX, centerY, innerRadius, 0, Math.PI * 2);
      ctx.strokeStyle = t > 0.3 ? 'rgba(212, 163, 115, 0.4)' : 'rgba(255, 255, 255, 0.15)';
      ctx.lineWidth = 1.5; ctx.stroke();

      journeyParticlesRef.current.forEach(p => {
        p.angle += p.orbitSpeed;
        const x = centerX + Math.cos(p.angle) * p.radius;
        const y = centerY + Math.sin(p.angle) * p.radius;
        const currentSize = p.baseSize + Math.sin(timeRef.current * p.breathSpeed + p.breathPhase) * 0.5;
        ctx.beginPath(); ctx.arc(x, y, currentSize, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(188, 108, 37, ${p.opacity})`;
        ctx.fill();
      });

      [0.3, 0.5, 0.7, 0.9].forEach((r, i) => {
        const radius = r * refSize / 2;
        ctx.beginPath(); ctx.arc(centerX, centerY, radius + Math.sin(timeRef.current + i * 0.5) * 2, 0, Math.PI * 2);
        ctx.strokeStyle = t > 0.3 ? `rgba(88, 129, 87, ${0.1 + i * 0.05})` : `rgba(255, 255, 255, ${0.03 + i * 0.02})`;
        ctx.setLineDash([5, 15]); ctx.stroke(); ctx.setLineDash([]);
      });

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
  useEffect(() => { setTimeout(() => setAnimated(true), 400); }, []);
  const points = data.map((d, i) => {
    const angle = (Math.PI * 2 * i) / data.length - Math.PI / 2;
    const val = animated ? d.value : 0;
    return { x: center + Math.cos(angle) * radius * val, y: center + Math.sin(angle) * radius * val, lx: center + Math.cos(angle) * (radius + 40), ly: center + Math.sin(angle) * (radius + 40), ...d };
  });
  const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ') + ' Z';
  return (
    <svg width={size} height={size} className="overflow-visible">
      <defs><linearGradient id="radGrad"><stop offset="0%" stopColor="rgba(212,163,115,0.3)"/><stop offset="100%" stopColor="rgba(88,129,87,0.2)"/></linearGradient></defs>
      {[0.25, 0.5, 0.75, 1].map((r, i) => <circle key={i} cx={center} cy={center} r={radius * r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="1"/>)}
      {data.map((_, i) => { const angle = (Math.PI * 2 * i) / data.length - Math.PI / 2; return <line key={i} x1={center} y1={center} x2={center + Math.cos(angle) * radius} y2={center + Math.sin(angle) * radius} stroke="rgba(255,255,255,0.08)" strokeWidth="1" />; })}
      <path d={pathD} fill="url(#radGrad)" stroke="rgba(212,163,115,0.8)" strokeWidth="2" style={{ transition: 'all 1.2s ease-out' }} />
      {points.map((p, i) => (
        <g key={i}>
          <circle cx={p.x} cy={p.y} r="6" fill="#d4a373" stroke="#0a0a0a" strokeWidth="2" style={{ transition: 'all 1.2s ease-out' }} />
          <text x={p.lx} y={p.ly} fill="rgba(255,255,255,0.8)" fontSize="11" fontWeight="500" textAnchor="middle" dominantBaseline="middle">{p.label}</text>
          <text x={p.lx} y={p.ly + 14} fill="rgba(212,163,115,0.7)" fontSize="10" textAnchor="middle">{Math.round(p.value * 100)}%</text>
        </g>
      ))}
    </svg>
  );
};

const WaveformVisualizer = ({ isPlaying, type = 'urban' }) => {
  const [heights, setHeights] = useState(Array(50).fill(0.1));
  useEffect(() => {
    if (!isPlaying) { setHeights(Array(50).fill(0.08)); return; }
    const int = setInterval(() => {
      setHeights(h => h.map((_, i) => type === 'urban' ? Math.random() * 0.85 + 0.15 : Math.sin(Date.now() / 800 + i * 0.2) * 0.25 + 0.35 + Math.random() * 0.08));
    }, type === 'urban' ? 80 : 120);
    return () => clearInterval(int);
  }, [isPlaying, type]);
  return (
    <div className="flex items-end justify-center gap-[2px] h-20">
      {heights.map((h, i) => (
        <div key={i} className="w-1 rounded-full transition-all" style={{ height: `${h * 100}%`, backgroundColor: type === 'urban' ? `rgba(180,180,180,${0.3 + h * 0.4})` : `rgba(88,129,87,${0.5 + h * 0.5})`, transitionDuration: type === 'urban' ? '80ms' : '150ms' }} />
      ))}
    </div>
  );
};

const FeasibilityMatrix = () => {
  const criteria = [
    { name: 'Coherencia', score: 92, desc: '¿Mantiene relación con el posicionamiento de la cercanía como ventaja emocional?', color: '#d4a373' },
    { name: 'Pertinencia', score: 88, desc: '¿Conecta con las motivaciones reales del público urbano saturado? ¿Responde al insight?', color: '#588157' },
    { name: 'Claridad', score: 95, desc: '¿Puede explicarse en una frase sin perder fuerza?', color: '#bc6c25' },
    { name: 'Viabilidad', score: 85, desc: '¿Es ejecutable con los recursos, plazos y presupuesto disponibles?', color: '#6b7f5a' },
  ];
  const [animated, setAnimated] = useState(false);
  useEffect(() => { setTimeout(() => setAnimated(true), 600); }, []);
  return (
    <div className="space-y-5">
      {criteria.map((c, i) => (
        <div key={i} className="group">
          <div className="flex justify-between items-center mb-2">
            <span className="text-white font-medium">{c.name}</span>
            <span className="font-mono text-sm" style={{ color: c.color }}>{animated ? c.score : 0}%</span>
          </div>
          <div className="h-3 bg-white/5 rounded-full overflow-hidden">
            <div className="h-full rounded-full transition-all duration-1000 ease-out" style={{ width: animated ? `${c.score}%` : '0%', background: `linear-gradient(90deg, ${c.color}, ${c.color}aa)` }} />
          </div>
          <p className="text-xs text-gray-500 mt-2 leading-relaxed">{c.desc}</p>
        </div>
      ))}
    </div>
  );
};

const NavNode = ({ label, active, onClick, angle, distance }) => {
  const x = 50 + Math.cos(angle) * distance * 50;
  const y = 50 + Math.sin(angle) * distance * 50;
  return (
    <button onClick={onClick} className={`absolute transform -translate-x-1/2 -translate-y-1/2 transition-all duration-500 ease-out ${active ? 'scale-110 z-20' : 'scale-100 z-10 hover:scale-105'}`} style={{ left: `${x}%`, top: `${y}%` }}>
      <div className={`relative px-4 py-3 rounded-full flex items-center justify-center transition-all duration-500 ${active ? 'bg-white/10 border border-white/40 shadow-lg' : 'bg-white/[0.03] border border-white/[0.15] hover:border-white/30 hover:bg-white/[0.06]'}`} style={{ backdropFilter: 'blur(8px)' }}>
        <span className={`transition-colors duration-300 font-medium text-xs md:text-sm whitespace-nowrap ${active ? 'text-white' : 'text-white/70'}`}>{label}</span>
      </div>
    </button>
  );
};

const SlideOverPanel = ({ isOpen, onClose, title, subtitle, children }) => (
  <>
    <div className={`fixed inset-0 bg-black/70 backdrop-blur-sm z-40 transition-opacity duration-500 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} onClick={onClose} />
    <div className={`fixed right-0 top-0 bottom-0 w-full max-w-3xl z-50 transform transition-all duration-700 ease-out ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
      <div className="flex flex-col h-full bg-gradient-to-br from-[#0d0f0d] via-[#0a0a0a] to-[#0d0d0d] border-l border-white/10">
        <div className="flex-shrink-0 relative p-6 md:p-8 border-b border-white/5">
          <button onClick={onClose} className="absolute top-4 md:top-6 right-4 md:right-6 w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors z-10">
            <span className="text-white/60 text-xl">×</span>
          </button>
          <p className="text-amber-500 text-xs tracking-[0.3em] uppercase mb-2">{subtitle}</p>
          <h2 className="text-2xl md:text-3xl font-light text-white pr-12" style={{ fontFamily: 'Georgia, serif' }}>{title}</h2>
        </div>
        <div className="flex-1 overflow-y-auto p-6 md:p-8 custom-scrollbar" style={{ minHeight: 0 }}>
          <div className="pb-12">{children}</div>
        </div>
      </div>
    </div>
  </>
);

// ============================================
// CONTENIDO PROFUNDO DE SECCIONES
// ============================================
const ClienteContent = () => (
  <div className="space-y-8">
    <p className="text-gray-300 text-lg leading-relaxed">El público principal de <span className="text-amber-400 font-medium">Cerca</span> está formado por adultos urbanos de entre 30 y 50 años, residentes en capitales de provincia o áreas metropolitanas españolas. No buscan aventura extrema ni escapismo barato: buscan <span className="text-amber-400">permiso para desconectar</span>.</p>
    
    <GlassCard className="p-6" glow>
      <p className="text-xs text-amber-400 uppercase tracking-wider mb-6">Perfil Psicográfico del Segmento</p>
      <div className="flex justify-center">
        <RadarChart data={[{ label: 'Tiempo libre', value: 0.25 }, { label: 'Nivel de estrés', value: 0.88 }, { label: 'Poder adquisitivo', value: 0.72 }, { label: 'Uso digital', value: 0.92 }, { label: 'Eco-consciencia', value: 0.78 }, { label: 'Exigencia emocional', value: 0.95 }]} size={280} />
      </div>
    </GlassCard>

    <div>
      <p className="text-xs text-amber-400 uppercase tracking-wider mb-4">Características del Segmento "Urbano Saturado"</p>
      <div className="grid gap-4">
        {[
          { num: '01', title: 'Pobreza de tiempo', desc: 'Vidas aceleradas y agendas saturadas. Dificultad crónica para planificar viajes largos que requieren días de organización.' },
          { num: '02', title: 'Fatiga digital', desc: 'Uso intensivo del entorno digital para informarse e inspirarse, pero creciente necesidad de experiencias táctiles y offline.' },
          { num: '03', title: 'Consumo consciente', desc: 'Interés creciente por el bienestar, la naturaleza, la cultura local y el consumo responsable de producto local.' },
          { num: '04', title: 'Desconfianza hacia lo artificial', desc: 'Alta exigencia emocional y rechazo activo hacia discursos turísticos vacíos o institucionales. Buscan autenticidad verificable.' }
        ].map((item, i) => (
          <GlassCard key={i} className="p-5 hover:bg-white/[0.05] transition-colors">
            <div className="flex gap-5">
              <span className="text-3xl font-light text-amber-600/40 font-mono">{item.num}</span>
              <div>
                <p className="text-white font-medium mb-1">{item.title}</p>
                <p className="text-gray-400 text-sm leading-relaxed">{item.desc}</p>
              </div>
            </div>
          </GlassCard>
        ))}
      </div>
    </div>

    <GlassCard className="p-6 border-amber-800/30" glow>
      <p className="text-xs text-amber-400 uppercase tracking-wider mb-4">El Dilema del Gran Viaje</p>
      <div className="grid md:grid-cols-2 gap-6">
        <div className="p-5 bg-red-900/10 rounded-xl border border-red-900/20">
          <p className="text-red-400 font-medium mb-3">Stoppers del Gran Viaje</p>
          <ul className="space-y-2 text-sm text-gray-400">
            <li className="flex items-start gap-2"><span className="text-red-400/60">—</span> Falta de tiempo para planificar</li>
            <li className="flex items-start gap-2"><span className="text-red-400/60">—</span> Coste económico elevado</li>
            <li className="flex items-start gap-2"><span className="text-red-400/60">—</span> Energía que consume la logística</li>
            <li className="flex items-start gap-2"><span className="text-red-400/60">—</span> Impacto ambiental del desplazamiento</li>
            <li className="flex items-start gap-2"><span className="text-red-400/60">—</span> Culpa por "no ser un viaje de verdad"</li>
          </ul>
        </div>
        <div className="p-5 bg-green-900/10 rounded-xl border border-green-900/20">
          <p className="text-green-400 font-medium mb-3">Solución CERCA</p>
          <ul className="space-y-2 text-sm text-gray-400">
            <li className="flex items-start gap-2"><span className="text-green-400/60">—</span> Permiso emocional para desconectar</li>
            <li className="flex items-start gap-2"><span className="text-green-400/60">—</span> Cercanía como ventaja, no limitación</li>
            <li className="flex items-start gap-2"><span className="text-green-400/60">—</span> Logística mínima: 40-90 minutos</li>
            <li className="flex items-start gap-2"><span className="text-green-400/60">—</span> Bajo impacto, alta recompensa emocional</li>
            <li className="flex items-start gap-2"><span className="text-green-400/60">—</span> Autenticidad verificable y cercana</li>
          </ul>
        </div>
      </div>
    </GlassCard>

    <div className="p-6 border-l-2 border-amber-600 bg-gradient-to-r from-amber-900/15 to-transparent rounded-r-xl">
      <p className="text-xs text-amber-500 uppercase tracking-wider mb-3">Insight Estratégico Central</p>
      <p className="text-amber-100 italic text-lg leading-relaxed" style={{ fontFamily: 'Georgia, serif' }}>"Necesitamos desconectar, pero cada vez cuesta más justificar el tiempo, el dinero, la energía y el impacto que exige un gran viaje."</p>
      <p className="text-gray-500 text-sm mt-4">Este insight explica por qué muchas personas desean viajar pero se encuentran ante dilemas que postergan constantemente la decisión. El turismo de proximidad aparece como <strong className="text-white">solución funcional</strong>, pero aún no como <strong className="text-amber-400">solución emocional</strong>.</p>
    </div>

    <GlassCard className="p-6 bg-gradient-to-br from-green-900/10 to-amber-900/5">
      <p className="text-xs text-green-400 uppercase tracking-wider mb-2">Oportunidad Estratégica</p>
      <p className="text-xl text-white font-light leading-relaxed">Convertir la cercanía en un activo de <span className="text-amber-400">calidad de vida</span>. Menos tiempo desplazándote = más tiempo siendo. El turismo cercano no es el "plan B": es la <span className="text-green-400">decisión inteligente</span>.</p>
    </GlassCard>
  </div>
);

const RecursosContent = () => {
  const [playingUrban, setPlayingUrban] = useState(false);
  const [playingCerca, setPlayingCerca] = useState(false);

  return (
    <div className="space-y-8">
      <p className="text-gray-300 text-lg leading-relaxed">La paleta sensorial de CERCA huye de la postal saturada y la épica turística. Buscamos la <span className="text-amber-400 font-medium">estética de la intimidad</span>: imperfección honesta, texturas táctiles, ritmo pausado.</p>

      <GlassCard className="p-6" glow>
        <p className="text-xs text-amber-400 uppercase tracking-wider mb-6">El Silencio como Recurso: Comparativa de Ritmo Sonoro</p>
        <div className="grid md:grid-cols-2 gap-8">
          <div className="text-center">
            <p className="text-gray-400 text-sm mb-4 font-medium">Ruido Urbano</p>
            <p className="text-xs text-gray-600 mb-4">Caótico · Estresante · Impredecible</p>
            <WaveformVisualizer isPlaying={playingUrban} type="urban" />
            <button onClick={() => { setPlayingUrban(!playingUrban); setPlayingCerca(false); }} className={`mt-4 px-5 py-2 rounded-full text-sm transition-all ${playingUrban ? 'bg-white/20 text-white' : 'bg-white/5 text-gray-400 hover:bg-white/10'}`}>
              {playingUrban ? '⏸ Detener' : '▶ Simular ruido'}
            </button>
          </div>
          <div className="text-center">
            <p className="text-green-400 text-sm mb-4 font-medium">Ritmo CERCA</p>
            <p className="text-xs text-gray-600 mb-4">Pausado · Respiratorio · Orgánico</p>
            <WaveformVisualizer isPlaying={playingCerca} type="cerca" />
            <button onClick={() => { setPlayingCerca(!playingCerca); setPlayingUrban(false); }} className={`mt-4 px-5 py-2 rounded-full text-sm transition-all ${playingCerca ? 'bg-green-800/30 text-green-400' : 'bg-white/5 text-gray-400 hover:bg-white/10'}`}>
              {playingCerca ? '⏸ Detener' : '▶ Simular ritmo'}
            </button>
          </div>
        </div>
        <p className="text-center text-xs text-gray-600 mt-6 italic">El silencio es un lujo. ASMR natural: viento en árboles, agua corriendo, fuego crepitando.</p>
      </GlassCard>

      <div>
        <p className="text-xs text-amber-400 uppercase tracking-wider mb-4">Gramática Visual</p>
        <div className="grid md:grid-cols-3 gap-4">
          {[
            { num: 'I', title: 'Golden Hour', desc: 'Luz natural cálida. Primeros planos que sugieren tacto. Encuadres íntimos, no panorámicas épicas.', colors: ['#d4a373', '#f5deb3'] },
            { num: 'II', title: 'Texturas Táctiles', desc: 'Piedra, madera, lino, barro. Materiales que invitan al contacto. Imperfección como valor.', colors: ['#8b7355', '#a0937d'] },
            { num: 'III', title: 'Verde Cercano', desc: 'Bosques, ríos, viñedos a menos de 90 minutos. Naturaleza accesible, no exótica.', colors: ['#588157', '#3d5a4a'] }
          ].map((item, i) => (
            <GlassCard key={i} className="p-5">
              <span className="text-2xl font-light text-white/20 font-serif">{item.num}</span>
              <p className="text-white font-medium mb-2 mt-2">{item.title}</p>
              <p className="text-gray-400 text-sm leading-relaxed mb-4">{item.desc}</p>
              <div className="flex gap-2">
                {item.colors.map((c, j) => (
                  <div key={j} className="w-8 h-8 rounded-lg border border-white/10" style={{ backgroundColor: c }} />
                ))}
              </div>
            </GlassCard>
          ))}
        </div>
      </div>

      <GlassCard className="p-6">
        <p className="text-xs text-amber-400 uppercase tracking-wider mb-4">Paleta Cromática Completa</p>
        <div className="flex flex-wrap gap-3">
          {[
            { color: '#2d4a3e', name: 'Bosque Profundo', use: 'Fondos, calma' },
            { color: '#588157', name: 'Verde Musgo', use: 'Acentos naturales' },
            { color: '#d4a373', name: 'Arcilla Cálida', use: 'CTAs, destacados' },
            { color: '#bc6c25', name: 'Cobre Oxidado', use: 'Énfasis secundario' },
            { color: '#606c38', name: 'Olivo Maduro', use: 'Textos sobre claro' },
            { color: '#fefae0', name: 'Lino Natural', use: 'Fondos claros' },
            { color: '#283618', name: 'Noche Verde', use: 'Textos, contraste' }
          ].map((c, i) => (
            <div key={i} className="group relative">
              <div className="w-14 h-14 rounded-xl border border-white/10 transition-transform group-hover:scale-110 cursor-pointer" style={{ backgroundColor: c.color }} />
              <div className="absolute -bottom-16 left-1/2 -translate-x-1/2 bg-black/90 rounded-lg px-3 py-2 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 pointer-events-none">
                <p className="text-white text-xs font-medium">{c.name}</p>
                <p className="text-gray-500 text-[10px]">{c.use}</p>
              </div>
            </div>
          ))}
        </div>
      </GlassCard>
    </div>
  );
};

const NarrativaContent = () => (
  <div className="space-y-8">
    <div className="text-center p-8 bg-gradient-to-br from-amber-900/20 via-amber-800/10 to-transparent rounded-2xl border border-amber-700/20">
      <p className="text-3xl md:text-4xl text-white font-light leading-relaxed" style={{ fontFamily: 'Georgia, serif' }}>
        "No hace falta ir lejos para sentir que te has ido"
      </p>
      <p className="text-gray-500 text-sm mt-4 max-w-lg mx-auto">Este mensaje activa el insight estratégico y posiciona la proximidad como solución emocional, no como limitación. No vendemos destinos: acercamos sensaciones.</p>
    </div>

    <GlassCard className="p-6" glow>
      <p className="text-xs text-amber-400 uppercase tracking-wider mb-4">Propuesta de Valor Diferencial</p>
      <p className="text-xl text-white font-light leading-relaxed"><span className="text-amber-400">Cerca vende permiso para desconectar sin culpa.</span> Transforma la cercanía en ventaja emocional: escapar no requiere distancia, sino cambio de mirada y permiso emocional genuino.</p>
    </GlassCard>

    <div>
      <p className="text-xs text-amber-400 uppercase tracking-wider mb-4">Arquitectura del Tono de Voz</p>
      <div className="grid md:grid-cols-2 gap-4">
        {[
          { trait: 'Honesto', value: 95, desc: 'Sin artificios ni promesas vacías. Contamos lo que hay de verdad.' },
          { trait: 'Cálido', value: 90, desc: 'Como quien comparte un secreto con un amigo cercano.' },
          { trait: 'Cómplice', value: 85, desc: 'Entendemos tu situación. Estamos de tu lado.' },
          { trait: 'Curador', value: 80, desc: 'Seleccionamos, no enumeramos. Calidad sobre cantidad.' }
        ].map((item, i) => (
          <GlassCard key={i} className="p-5">
            <div className="flex justify-between items-center mb-2">
              <span className="text-white font-medium">{item.trait}</span>
              <span className="text-amber-400 font-mono text-sm">{item.value}%</span>
            </div>
            <div className="h-2 bg-white/5 rounded-full overflow-hidden mb-3">
              <div className="h-full bg-gradient-to-r from-amber-600 to-amber-400 rounded-full" style={{ width: `${item.value}%` }} />
            </div>
            <p className="text-gray-500 text-xs">{item.desc}</p>
          </GlassCard>
        ))}
      </div>
    </div>

    <GlassCard className="p-6 border-red-900/20">
      <p className="text-xs text-red-400 uppercase tracking-wider mb-4">Lo que NO somos (Anti-territorio)</p>
      <div className="grid md:grid-cols-2 gap-3">
        {[
          'Épica turística institucional',
          'Listas de pueblos y rutas sin alma',
          'Ofertas y descuentos agresivos',
          'Lenguaje de folleto de ayuntamiento',
          'Promesas de "experiencias únicas"',
          'Stock photos de sonrisas forzadas',
          'Discurso de sostenibilidad vacío',
          'Tono de campaña gubernamental'
        ].map((item, i) => (
          <div key={i} className="flex items-center gap-3 text-gray-400 p-2 bg-red-900/5 rounded-lg">
            <span className="text-red-400/40 text-xs">—</span>
            <span className="text-sm">{item}</span>
          </div>
        ))}
      </div>
    </GlassCard>
  </div>
);

const ViabilidadContent = () => (
  <div className="space-y-8">
    <p className="text-gray-300 text-lg leading-relaxed">Modelo <span className="text-amber-400 font-medium">Asset Light</span>: curamos, no construimos. Alta viabilidad basada en la economía local ya activa. No creamos infraestructura: seleccionamos y narramos lo que ya existe.</p>

    <GlassCard className="p-6" glow>
      <p className="text-xs text-amber-400 uppercase tracking-wider mb-4">Realismo Operativo</p>
      <div className="grid md:grid-cols-3 gap-4 text-center">
        <div className="p-4 bg-white/5 rounded-xl">
          <p className="text-3xl font-light text-amber-400">Bajo</p>
          <p className="text-xs text-gray-500 mt-1">Coste de entrada</p>
        </div>
        <div className="p-4 bg-white/5 rounded-xl">
          <p className="text-3xl font-light text-green-400">Alto</p>
          <p className="text-xs text-gray-500 mt-1">Impacto emocional</p>
        </div>
        <div className="p-4 bg-white/5 rounded-xl">
          <p className="text-3xl font-light text-white">6 meses</p>
          <p className="text-xs text-gray-500 mt-1">Horizonte validación</p>
        </div>
      </div>
      <p className="text-gray-400 text-sm mt-4 text-center">Vendemos "permiso para desconectar": solución de bajo coste operativo pero alto retorno emocional.</p>
    </GlassCard>

    <GlassCard className="p-6">
      <p className="text-xs text-amber-400 uppercase tracking-wider mb-6">Matriz de Factibilidad (4 Filtros de Evaluación)</p>
      <FeasibilityMatrix />
    </GlassCard>

    <div>
      <p className="text-xs text-green-400 uppercase tracking-wider mb-4">Fases de Implementación</p>
      <div className="space-y-3">
        {[
          { phase: '01', name: 'Soft Launch', desc: 'Despliegue en una provincia para validar métricas base y ajustar mensaje.', status: 'active', detail: 'Test con muestra de usuarios antes de producción.' },
          { phase: '02', name: 'Iteración', desc: 'Ajuste basado en feedback real. Refinamiento del tono y canales.', status: 'next', detail: 'Validación cruzada entre equipo creativo, planificación y stakeholders.' },
          { phase: '03', name: 'Pruebas A/B', desc: 'Optimización de mensajes y canales en fase de lanzamiento.', status: 'pending', detail: 'Iteración basada en comportamiento real de usuarios.' },
          { phase: '04', name: 'Escalado', desc: 'Expansión nacional tras validación de modelo en mercado piloto.', status: 'pending', detail: 'Replicación del modelo probado a otras provincias.' }
        ].map((item, i) => (
          <GlassCard key={i} className={`p-4 ${item.status === 'active' ? 'border-green-700/40 bg-green-900/10' : ''}`}>
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center font-mono text-lg ${item.status === 'active' ? 'bg-green-800/50 text-green-400' : item.status === 'next' ? 'bg-amber-800/30 text-amber-400' : 'bg-white/10 text-gray-500'}`}>{item.phase}</div>
              <div className="flex-1">
                <p className={`font-medium ${item.status === 'active' ? 'text-green-400' : 'text-white'}`}>{item.name}</p>
                <p className="text-gray-400 text-sm">{item.desc}</p>
                <p className="text-gray-600 text-xs mt-1">{item.detail}</p>
              </div>
            </div>
          </GlassCard>
        ))}
      </div>
    </div>
  </div>
);

const SimbolosContent = () => (
  <div className="space-y-8">
    <p className="text-gray-300 text-lg leading-relaxed">Reemplazo de la semiótica tradicional del viaje <span className="text-gray-500">(avión, maleta, pasaporte)</span> por <span className="text-amber-400 font-medium">símbolos de proximidad</span> que responden a la inflación, la conciencia medioambiental y la revalorización del producto local.</p>

    <div className="space-y-4">
      {[
        { num: '01', title: 'El Círculo de los 90 Minutos', subtitle: 'Territorio de felicidad', desc: 'Representación visual del área de influencia donde cabe todo lo que necesitas. No es una limitación geográfica: es un mapa de posibilidades.' },
        { num: '02', title: 'La Mochila Ligera / Maleta Vacía', subtitle: 'Libertad sin peso', desc: 'Símbolo de viajar sin carga física ni mental. Contraposición directa al estrés de aeropuertos, facturación, planificación excesiva.' },
        { num: '03', title: 'Hacer Pellas (Versión Adulta)', subtitle: 'Rebeldía contra la agenda', desc: 'El acto de escapar sin pedir permiso. Recuperar la sensación de libertad de la infancia, aplicada a la vida adulta.' },
        { num: '04', title: 'La Ventana Abierta', subtitle: 'Cambio de perspectiva', desc: 'Metáfora de que el escape no requiere distancia física, sino apertura mental y permiso emocional.' }
      ].map((s, i) => (
        <GlassCard key={i} className="p-6" glow>
          <div className="flex flex-col md:flex-row gap-6">
            <div className="flex-shrink-0">
              <span className="text-5xl font-extralight text-amber-600/30 font-mono">{s.num}</span>
            </div>
            <div className="flex-1">
              <p className="text-white text-xl font-medium">{s.title}</p>
              <p className="text-amber-400 text-sm mb-3">{s.subtitle}</p>
              <p className="text-gray-400 leading-relaxed">{s.desc}</p>
            </div>
          </div>
        </GlassCard>
      ))}
    </div>

    <GlassCard className="p-6 bg-gradient-to-br from-green-900/10 to-amber-900/5">
      <p className="text-xs text-green-400 uppercase tracking-wider mb-4">Justificación Global de Vigencia</p>
      <p className="text-gray-300 leading-relaxed mb-4">Estos símbolos son vigentes porque responden directamente a tres fuerzas contemporáneas del mercado español:</p>
      <div className="grid md:grid-cols-3 gap-4">
        {[
          { num: 'I', title: 'Inflación', desc: 'Búsqueda de alternativas de ocio más accesibles económicamente.' },
          { num: 'II', title: 'Conciencia ambiental', desc: 'Reducción de huella de carbono sin renunciar al disfrute.' },
          { num: 'III', title: 'Producto local', desc: 'Revalorización de economías cercanas y autenticidad.' }
        ].map((f, i) => (
          <div key={i} className="text-center p-4 bg-white/5 rounded-xl">
            <span className="text-xl font-light text-amber-500/50 font-serif">{f.num}</span>
            <p className="text-white font-medium mt-2">{f.title}</p>
            <p className="text-gray-500 text-xs mt-1">{f.desc}</p>
          </div>
        ))}
      </div>
    </GlassCard>

    <div className="p-6 border-l-2 border-amber-600 bg-gradient-to-r from-amber-900/15 to-transparent rounded-r-xl">
      <p className="text-amber-100 text-lg italic leading-relaxed" style={{ fontFamily: 'Georgia, serif' }}>
        "Estos símbolos funcionan como anclas visuales y conceptuales que atraviesan toda la comunicación, creando coherencia sin rigidez."
      </p>
      <p className="text-gray-500 text-sm mt-3">No vendemos destinos. No vendemos experiencias. Vendemos permiso para ser.</p>
    </div>
  </div>
);

// ============================================
// MAIN APP
// ============================================
export default function CercaProximityLens() {
  const [activeSection, setActiveSection] = useState(-1);
  const [panelOpen, setPanelOpen] = useState(false);
  const [bgIntensity, setBgIntensity] = useState(0);

  useEffect(() => {
    if (activeSection >= 0) {
      const timer = setTimeout(() => setBgIntensity(1), 100);
      return () => clearTimeout(timer);
    } else {
      setBgIntensity(0);
    }
  }, [activeSection]);

  const sections = [
    { id: 0, label: 'Cliente', title: 'El Segmento "Urbano Saturado"', subtitle: 'Análisis del Cliente', content: ClienteContent },
    { id: 1, label: 'Recursos', title: 'Estética de la Intimidad', subtitle: 'Recursos Expresivos', content: RecursosContent },
    { id: 2, label: 'Narrativa', title: 'Transmedia Storytelling', subtitle: 'Narrativa de Marca', content: NarrativaContent },
    { id: 3, label: 'Viabilidad', title: 'Asset Light & Risk Management', subtitle: 'Viabilidad y Riesgos', content: ViabilidadContent },
    { id: 4, label: 'Símbolos', title: 'Semiótica de Proximidad', subtitle: 'Referencias Culturales', content: SimbolosContent }
  ];

  const nodeConfigs = [
    { angle: -Math.PI / 2, distance: 0.70 },
    { angle: -Math.PI / 2 + (2 * Math.PI / 5), distance: 0.70 },
    { angle: -Math.PI / 2 + (4 * Math.PI / 5), distance: 0.70 },
    { angle: -Math.PI / 2 + (6 * Math.PI / 5), distance: 0.70 },
    { angle: -Math.PI / 2 + (8 * Math.PI / 5), distance: 0.70 },
  ];

  const handleNodeClick = (index) => {
    setActiveSection(index);
    setTimeout(() => setPanelOpen(true), 200);
  };

  const handleClosePanel = () => {
    setPanelOpen(false);
    setTimeout(() => setActiveSection(-1), 400);
  };

  const ActiveContent = activeSection >= 0 ? sections[activeSection].content : null;

  return (
    <div className="relative w-full h-screen overflow-hidden bg-[#050505]">
      <ProximityMapBackground activeSection={activeSection} intensity={bgIntensity} />

      <header className="absolute top-0 left-0 right-0 z-20 p-6 md:p-10 pointer-events-none">
        <h1 className="text-4xl md:text-5xl font-normal text-white" style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}>
          Cerca<span className="text-amber-500">.</span>
        </h1>
        <p className="text-[10px] text-white/40 tracking-[0.25em] uppercase mt-1">Protocolo RAA / CDO Final v12.0</p>
      </header>

      <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none px-4">
        <div className={`text-center transition-all duration-700 ${panelOpen ? 'opacity-0 scale-95' : 'opacity-100 scale-100'}`}>
          <p className="text-2xl md:text-3xl font-normal italic text-white/90 max-w-md mx-auto leading-relaxed" style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}>
            "No hace falta ir lejos para<br />sentir que te has ido"
          </p>
          <p className="text-[10px] md:text-[11px] text-white/40 tracking-[0.3em] uppercase mt-6">Estrategia de Resignificación</p>
        </div>
      </div>

      <div className="absolute z-20" style={{ width: 'min(100vw, 100vh)', height: 'min(100vw, 100vh)', left: '50%', top: '50%', transform: 'translate(-50%, -50%)' }}>
        {sections.map((section, i) => (
          <NavNode key={i} label={section.label} active={activeSection === i} onClick={() => handleNodeClick(i)} angle={nodeConfigs[i].angle} distance={nodeConfigs[i].distance} />
        ))}
      </div>

      {activeSection >= 0 && (
        <SlideOverPanel isOpen={panelOpen} onClose={handleClosePanel} title={sections[activeSection].title} subtitle={sections[activeSection].subtitle}>
          <ActiveContent />
        </SlideOverPanel>
      )}

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: rgba(255,255,255,0.02); }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(212,163,115,0.3); border-radius: 3px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(212,163,115,0.5); }
      `}</style>
    </div>
  );
}
