import React, { useState, useEffect, useRef, useMemo } from 'react';

// ============================================
// CERCA: THE PROXIMITY LENS
// Mapa Visual de Estrategia Creativa
// Autor: Juan de Dios Llamas García
// Asignatura: Pensamiento Creativo - UTAMED
//
// NOTA PARA EL CURIOSO (O PROFESOR) QUE MIRA EL CÓDIGO:
// Sí, esto ha salido de mis dedos y mis neuronas.
// Si encuentras un bug, llamémoslo "feature de creatividad caótica no documentada".
// Y si estás aquí buscando talento que mezcle estrategia y código:
// https://www.linkedin.com/in/juandyllamas/
// ¡Un saludo!
// ============================================

// ============================================
// INTRO MODAL COMPONENT
// Presentación del autor y contexto
// ============================================
const IntroModal = ({ onEnter }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/90 backdrop-blur-sm animate-fadeIn">
    <div className="max-w-md w-full p-8 text-center relative overflow-hidden rounded-2xl bg-[#0a0a0a] border border-amber-500/30 shadow-2xl shadow-amber-900/20">
      <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-transparent pointer-events-none" />
      
      <h2 className="text-4xl font-light text-white mb-2 relative z-10" style={{ fontFamily: 'Georgia, serif' }}>Cerca<span className="text-amber-500">.</span></h2>
      <p className="text-amber-500 text-[10px] tracking-[0.3em] uppercase mb-8 relative z-10">Infografía Interactiva Web-App</p>
      
      <div className="text-gray-300 space-y-4 text-sm leading-relaxed mb-8 relative z-10 font-light">
        <p>Bienvenido a esta experiencia digital diseñada y programada por <br/><strong className="text-white font-normal">Juan de Dios Llamas</strong>.</p>
        <div className="py-2 px-4 bg-white/5 rounded-lg border border-white/10 mx-auto inline-block">
          <p className="text-amber-100 font-medium">Opción B</p>
          <p className="text-[10px] uppercase tracking-wider text-gray-400">RUTA de Aprendizaje Autónomo</p>
        </div>
        <p className="mt-2"><span className="text-amber-200">Pensamiento Creativo</span></p>
        <p className="text-xs text-gray-500 mt-4">Explora el mapa estratégico navegando por los nodos interactivos.</p>
      </div>
      
      <button 
        onClick={onEnter} 
        className="relative z-10 px-8 py-3 bg-amber-900/20 hover:bg-amber-800/30 border border-amber-700/50 text-amber-100 rounded-full transition-all tracking-widest text-[10px] uppercase hover:scale-105 active:scale-95 cursor-pointer"
      >
        Entrar a la experiencia
      </button>
    </div>
  </div>
);

// ============================================
// PROXIMITY MAP BACKGROUND
// Círculos concéntricos que representan el territorio de cercanía
// Transición de urbano (gris/caótico) a orgánico (verde/calma)
// ============================================
const ProximityMapBackground = ({ activeSection, intensity = 0 }) => {
  const canvasRef = useRef(null);
  const animationRef = useRef(null);
  const timeRef = useRef(0);
  const cityParticlesRef = useRef({ pedestrians: [], streets: { horizontal: [], vertical: [] } });
  const journeyParticlesRef = useRef([]);
  // Generar puntos exteriores una sola vez (optimization trick by Juandy)
  const exteriorPointsRef = useRef([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let width = canvas.width = window.innerWidth;
    let height = canvas.height = window.innerHeight;

    // Inicializar puntos exteriores (Originales + 15 extra para más ambiente)
    if (exteriorPointsRef.current.length === 0) {
      const points = [
        { angle: 0.2, distance: 0.95, baseSize: 5 },
        { angle: 1.1, distance: 1.00, baseSize: 3.5 },
        { angle: 2.2, distance: 0.92, baseSize: 6 },
        { angle: 3.5, distance: 0.98, baseSize: 4 },
        { angle: 4.8, distance: 0.94, baseSize: 5.5 },
        { angle: 5.9, distance: 1.02, baseSize: 3.2 },
      ];
      // Generar 15 puntos extra aleatorios (más caos controlado)
      for(let i = 0; i < 15; i++) {
        points.push({
          angle: Math.random() * Math.PI * 2,
          distance: 0.88 + Math.random() * 0.15, // Entre 0.88 y 1.03 del radio exterior
          baseSize: 1.5 + Math.random() * 3, // Tamaños variados
          speedOffset: 0.5 + Math.random() // Velocidad ligeramente diferente
        });
      }
      exteriorPointsRef.current = points;
    }

    // =============================================
    // SISTEMA DE CIUDAD: Calles, coches y peatones
    // Intentando replicar la eficiencia de Cerdà en unas pocas líneas de código.
    // =============================================
    const createCityStreets = (radius) => {
      const streets = { horizontal: [], vertical: [] };
      const spacing = 15; // Espacio entre calles (reducido de 20 para más densidad)
      const numStreets = Math.floor(radius / spacing);

      // Calles horizontales y verticales
      for (let i = -numStreets; i <= numStreets; i++) {
        const pos = i * spacing;
        // Solo añadir si está dentro del círculo
        if (Math.abs(pos) < radius * 0.9) {
          streets.horizontal.push(pos);
          streets.vertical.push(pos);
        }
      }
      return streets;
    };

    // Crear peatones (digitales, no se cansan, no se quejan)
    const createPedestrian = (streets, radius, centerX, centerY) => {
      // Seleccionar UNA calle aleatoria
      const isHorizontal = Math.random() > 0.5;
      const streetArray = isHorizontal ? streets.horizontal : streets.vertical;
      const baseStreetPos = streetArray[Math.floor(Math.random() * streetArray.length)];

      // Offset pequeño para acera (a un lado de la calle)
      const sidewalkOffset = (Math.random() > 0.5 ? 1 : -1) * 5;
      const streetPos = baseStreetPos + sidewalkOffset;

      // Calcular el máximo alcance en esta calle
      const maxExtent = Math.sqrt(Math.max(0, radius * radius - streetPos * streetPos)) * 0.75;

      // Aparece en un extremo (elegir aleatoriamente izquierda o derecha/arriba o abajo)
      const startAtPositive = Math.random() > 0.5;
      const startPos = startAtPositive ? maxExtent * 0.95 : -maxExtent * 0.95;
      const direction = startAtPositive ? -1 : 1; // Se mueve hacia el otro extremo

      return {
        type: 'pedestrian', // Movimiento por una única calle
        isHorizontal: isHorizontal,
        streetPos: streetPos,
        pos: startPos,
        direction: direction,
        speed: 0.4 + Math.random() * 0.5, // Velocidad variable (aumentada para más dinamismo)
        size: 1.2,
        maxExtent: maxExtent,
        // Wobble sutil en la acera (quizás han tomado algo)
        wobblePhase: Math.random() * Math.PI * 2,
        wobbleSpeed: 0.06 + Math.random() * 0.04,
        alive: true
      };
    };

    const createPedestrians = (streets, radius, centerX, centerY) => {
      const pedestrians = [];
      const numPedestrians = 5; // Comienzan solo 5, irán aumentando gradualmente
      for (let i = 0; i < numPedestrians; i++) {
        pedestrians.push(createPedestrian(streets, radius, centerX, centerY));
      }
      return pedestrians;
    };

    // Grid visual de la ciudad
    const createCityGrid = (centerX, centerY, radius) => {
      // Ya no necesitamos almacenar líneas, las dibujamos directamente
      return { radius };
    };

    // Partículas de proximidad (permanentes, orbitan lentamente en el exterior)
    const initProximityParticles = (centerX, centerY, innerRadius, outerRadius) => {
      const particles = [];
      const count = 6; // Reducido de 10 a 6 para menos acumulación visual

      for (let i = 0; i < count; i++) {
        // Distribuir uniformemente en una banda media (no en el borde)
        const minDist = innerRadius * 1.5;
        const maxDist = outerRadius * 0.80;
        // Acercado hacia adentro para evitar bordes
        const radius = minDist + (maxDist - minDist) * (i / (count - 1));
        // Ángulo inicial bien distribuido para evitar concentración
        const angle = (Math.PI * 2 * i / count);
        // Velocidad orbital muy lenta (diferentes para cada una)
        const orbitSpeed = 0.0002 + Math.random() * 0.0003;
        const orbitDirection = Math.random() > 0.5 ? 1 : -1;
        // Tamaño basado en la distancia (más lejos = más grande, de 2 a 5px)
        const distanceRatio = (radius - minDist) / (maxDist - minDist);
        const size = 2 + distanceRatio * 3; // Más contenido: 2px a 5px

        particles.push({
          radius: radius,
          angle: angle,
          orbitSpeed: orbitSpeed * orbitDirection,
          size: size,
          baseSize: size,
          // Ligero movimiento de "respiración"
          breathSpeed: 0.5 + Math.random() * 0.5,
          breathPhase: Math.random() * Math.PI * 2,
          opacity: 0.4 + distanceRatio * 0.2 // Opacidad más baja para menos contraste
        });
      }
      return particles;
    };

    let cityGrid = [];
    let cityStreets = { horizontal: [], vertical: [] };
    let pedestrians = [];
    let proximityParticles = [];

    const initializeParticles = () => {
      const centerX = width / 2;
      const centerY = height / 2;
      const refSize = Math.min(width, height);
      const innerRadius = refSize * 0.15; // Círculo central de la ciudad
      const outerRadius = refSize * 0.45; // Radio máximo

      cityGrid = createCityGrid(centerX, centerY, innerRadius);
      cityStreets = createCityStreets(innerRadius);
      pedestrians = createPedestrians(cityStreets, innerRadius, centerX, centerY);
      
      cityParticlesRef.current = { pedestrians, streets: cityStreets };
      proximityParticles = initProximityParticles(centerX, centerY, innerRadius, outerRadius);
      journeyParticlesRef.current = proximityParticles;
    };

    initializeParticles();

    // Aquí ocurre la magia del canvas (o el desastre, según el día)
    const animate = () => {
      timeRef.current += 0.016;
      const t = activeSection >= 0 ? Math.min(1, intensity) : 0;

      // =============================================
      // SISTEMA DE COORDENADAS UNIFICADO
      // NavNode usa: x = 50 + cos(angle) * distance * 50
      // Eso = posición en % del contenedor cuadrado centrado
      // El canvas debe usar el MISMO contenedor cuadrado
      // =============================================
      const centerX = width / 2;
      const centerY = height / 2;
      const refSize = Math.min(width, height);
      // Todos los elementos (anillos, nodos, partículas) orbitan
      // dentro de este cuadrado centrado de refSize × refSize
      const innerRadius = refSize * 0.15; // Círculo central (ciudad)
      const outerRadius = refSize * 0.45; // Radio máximo de viaje

      // =============================================
      // FONDO
      // =============================================
      const bgGradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, Math.max(width, height));
      bgGradient.addColorStop(0, t > 0.5 ? '#0d1210' : '#0a0a0a');
      bgGradient.addColorStop(1, t > 0.5 ? '#050805' : '#050505');
      ctx.fillStyle = bgGradient;
      ctx.fillRect(0, 0, width, height);

      // =============================================
      // CÍRCULO CENTRAL: LA CIUDAD
      // =============================================
      const cityData = cityParticlesRef.current;

      // Clip al círculo central
      ctx.save();
      ctx.beginPath();
      ctx.arc(centerX, centerY, innerRadius, 0, Math.PI * 2);
      ctx.clip();

      // Fondo ligeramente más claro para la ciudad
      ctx.fillStyle = t > 0.3 ? 'rgba(20, 25, 22, 0.5)' : 'rgba(18, 18, 18, 0.5)';
      ctx.fill();

      // Dibujar grid de calles
      ctx.strokeStyle = t > 0.3 ? 'rgba(45, 74, 62, 0.25)' : 'rgba(50, 50, 50, 0.3)';
      ctx.lineWidth = 1;

      // Calles horizontales
      cityData.streets.horizontal.forEach(y => {
        const maxX = Math.sqrt(Math.max(0, innerRadius * innerRadius - y * y));
        ctx.beginPath();
        ctx.moveTo(centerX - maxX, centerY + y);
        ctx.lineTo(centerX + maxX, centerY + y);
        ctx.stroke();
      });

      // Calles verticales
      cityData.streets.vertical.forEach(x => {
        const maxY = Math.sqrt(Math.max(0, innerRadius * innerRadius - x * x));
        ctx.beginPath();
        ctx.moveTo(centerX + x, centerY - maxY);
        ctx.lineTo(centerX + x, centerY + maxY);
        ctx.stroke();
      });

      // Actualizar y dibujar PEATONES
      // Cada peatón camina en línea recta por su calle
      for (let i = 0; i < cityData.pedestrians.length; i++) {
        const p = cityData.pedestrians[i];
        if (!p.alive) continue;

        // Mover en línea recta por la calle
        p.pos += p.direction * p.speed;

        // Wobble sutil en la acera
        p.wobblePhase += p.wobbleSpeed;
        const wobbleOffset = Math.sin(p.wobblePhase) * 2;

        // Calcular posición final
        let x, y;
        if (p.isHorizontal) {
          // Camina horizontalmente
          x = centerX + p.pos;
          y = centerY + p.streetPos + wobbleOffset;
        } else {
          // Camina verticalmente
          x = centerX + p.streetPos + wobbleOffset;
          y = centerY + p.pos;
        }

        // Verificar que está dentro del círculo
        const distFromCenter = Math.sqrt(Math.pow(x - centerX, 2) + Math.pow(y - centerY, 2));
        if (distFromCenter > innerRadius * 0.80) {
          // Salió del círculo - lo elimina
          p.alive = false;
          continue;
        }

        // Dibujar peatón como punto pequeño - muy transparente
        ctx.beginPath();
        ctx.arc(x, y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = t > 0.3 ? 'rgba(180, 200, 180, 0.35)' : 'rgba(180, 180, 180, 0.30)';
        ctx.fill();
      }

      // Limpiar peatones muertos y crear nuevos si es necesario
      cityData.pedestrians = cityData.pedestrians.filter(p => p.alive);

      // Máximo de peatones aumenta gradualmente con el tiempo
      // Comienza con ~0 y va hasta 80 lentamente
      const maxPedestrians = Math.min(80, Math.max(5, Math.floor(timeRef.current * 0.015)));

      while (cityData.pedestrians.length < maxPedestrians) {
        cityData.pedestrians.push(createPedestrian(cityData.streets, innerRadius, centerX, centerY));
      }

      ctx.restore();

      // Borde del círculo central
      ctx.beginPath();
      ctx.arc(centerX, centerY, innerRadius, 0, Math.PI * 2);
      ctx.strokeStyle = t > 0.3 ? 'rgba(212, 163, 115, 0.4)' : 'rgba(255, 255, 255, 0.15)';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // =============================================
      // PARTÍCULAS DE PROXIMIDAD (Permanentes, orbitan lentamente)
      // =============================================
      journeyParticlesRef.current.forEach(p => {
        // Actualizar ángulo orbital (movimiento muy lento)
        p.angle += p.orbitSpeed;
        
        // Calcular posición
        const x = centerX + Math.cos(p.angle) * p.radius;
        const y = centerY + Math.sin(p.angle) * p.radius;

        // Efecto de "respiración" en el tamaño
        const breathe = Math.sin(timeRef.current * p.breathSpeed + p.breathPhase) * 0.5;
        const currentSize = p.baseSize + breathe;

        // Calcular el ratio de distancia para el color
        // const distanceRatio = (p.radius - innerRadius) / (outerRadius - innerRadius);

        // Dibujar partícula - Todas las partículas exteriores son naranja #BC6C25
        ctx.beginPath();
        ctx.arc(x, y, currentSize, 0, Math.PI * 2);
        // Color naranja consistente para todos los puntos fuera del círculo interior
        ctx.fillStyle = `rgba(188, 108, 37, ${p.opacity})`;
        ctx.fill();

        // Glow sutil alrededor - también naranja
        const glowGradient = ctx.createRadialGradient(x, y, 0, x, y, currentSize * 3);
        glowGradient.addColorStop(0, `rgba(188, 108, 37, ${p.opacity * 0.3})`);
        glowGradient.addColorStop(1, 'transparent');
        ctx.beginPath();
        ctx.arc(x, y, currentSize * 3, 0, Math.PI * 2);
        ctx.fillStyle = glowGradient;
        ctx.fill();
      });

      // =============================================
      // ANILLOS DE PROXIMIDAD (15, 30, 60, 90 min)
      // =============================================
      const rings = [0.30, 0.50, 0.70, 0.90];
      // const labels = ['15 min', '30 min', '60 min', '90 min'];

      rings.forEach((r, i) => {
        const radius = r * refSize / 2;
        const pulse = Math.sin(timeRef.current + i * 0.5) * 2;

        // Anillo con glow
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius + pulse, 0, Math.PI * 2);
        ctx.strokeStyle = t > 0.3 ? `rgba(88, 129, 87, ${0.1 + i * 0.05})` : `rgba(255, 255, 255, ${0.03 + i * 0.02})`;
        ctx.lineWidth = 1;
        ctx.setLineDash([5, 15]);
        ctx.stroke();
        ctx.setLineDash([]);
      });

      // =============================================
      // PUNTOS EXTERIORES ORBITALES
      // Círculos flotantes en órbita exterior con tamaño variable
      // Color Naranja CERCA #BC6C25 (188, 108, 37) - cobre oxidado
      // =============================================
      const maxRadiusForExterior = refSize * 0.50; // Orbita exterior

      exteriorPointsRef.current.forEach((point, idx) => {
        // Movimiento orbital lento con variación
        const speed = point.speedOffset || 1;
        const angle = point.angle + timeRef.current * 0.0001 * (idx + 1) * speed;
        const radius = maxRadiusForExterior * point.distance;
        const x = centerX + Math.cos(angle) * radius;
        const y = centerY + Math.sin(angle) * radius;

        // Wobble en tamaño (respiración)
        const wobbleSize = Math.sin(timeRef.current * 0.8 + idx) * 0.5;
        const currentSize = point.baseSize + wobbleSize;

        // Intensidad basada en progreso de transición
        const intensity = Math.max(0, t - 0.2);

        // Dibujar punto - Color naranja #BC6C25
        ctx.beginPath();
        ctx.arc(x, y, currentSize, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(188, 108, 37, ${0.4 + 0.5 * intensity})`;
        ctx.fill();

        // Glow sutil - mismo color naranja
        const glowGrad = ctx.createRadialGradient(x, y, 0, x, y, currentSize * 2.5);
        glowGrad.addColorStop(0, `rgba(188, 108, 37, ${0.2 * intensity})`);
        glowGrad.addColorStop(1, 'transparent');
        ctx.beginPath();
        ctx.arc(x, y, currentSize * 2.5, 0, Math.PI * 2);
        ctx.fillStyle = glowGrad;
        ctx.fill();
      });

      // =============================================
      // ETIQUETA CENTRAL
      // =============================================
      if (t > 0.1) {
        ctx.font = 'italic 11px Georgia, serif';
        ctx.fillStyle = `rgba(212, 163, 115, ${0.5 + t * 0.5})`;
        ctx.textAlign = 'center';
        ctx.fillText('Tu ciudad', centerX, centerY + innerRadius + 20);
      }

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    const handleResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
      initializeParticles();
    };

    window.addEventListener('resize', handleResize);
    return () => {
      cancelAnimationFrame(animationRef.current);
      window.removeEventListener('resize', handleResize);
    };
  }, [activeSection, intensity]);

  return <canvas ref={canvasRef} className="fixed inset-0 z-0" />;
};

// ============================================
// GLASSMORPHISM COMPONENTS
// ============================================
const GlassCard = ({ children, className = '', glow = false }) => (
  <div className={`relative overflow-hidden rounded-2xl bg-white/[0.03] border border-white/[0.08] ${glow ? 'shadow-lg shadow-amber-900/10' : ''} ${className}`} style={{ backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)' }}>
    <div className="absolute inset-0 bg-gradient-to-br from-white/[0.04] to-transparent pointer-events-none" />
    <div className="relative z-10">{children}</div>
  </div>
);

// ============================================
// RADAR CHART - Enhanced
// ============================================
const RadarChart = ({ data, size = 300 }) => {
  const [animated, setAnimated] = useState(false);
  const center = size / 2;
  const radius = size * 0.36;

  useEffect(() => {
    const timer = setTimeout(() => setAnimated(true), 400);
    return () => clearTimeout(timer);
  }, []);

  const points = data.map((d, i) => {
    const angle = (Math.PI * 2 * i) / data.length - Math.PI / 2;
    const value = animated ? d.value : 0;
    return {
      x: center + Math.cos(angle) * radius * value,
      y: center + Math.sin(angle) * radius * value,
      labelX: center + Math.cos(angle) * (radius + 40),
      labelY: center + Math.sin(angle) * (radius + 40),
      ...d
    };
  });

  const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ') + ' Z';

  return (
    <svg width={size} height={size} className="overflow-visible">
      <defs>
        <linearGradient id="radarGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="rgba(212,163,115,0.3)" />
          <stop offset="100%" stopColor="rgba(88,129,87,0.2)" />
        </linearGradient>
      </defs>
      {/* Grid circles */}
      {[0.25, 0.5, 0.75, 1].map((r, i) => (
        <circle key={i} cx={center} cy={center} r={radius * r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
      ))}
      {/* Axis lines */}
      {data.map((_, i) => {
        const angle = (Math.PI * 2 * i) / data.length - Math.PI / 2;
        return (
          <line key={i} x1={center} y1={center} x2={center + Math.cos(angle) * radius} y2={center + Math.sin(angle) * radius} stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
        );
      })}
      {/* Data polygon */}
      <path d={pathD} fill="url(#radarGradient)" stroke="rgba(212,163,115,0.8)" strokeWidth="2" style={{ transition: 'all 1.2s ease-out' }} />
      {/* Data points and labels */}
      {points.map((p, i) => (
        <g key={i}>
          <circle cx={p.x} cy={p.y} r="6" fill="#d4a373" stroke="#0a0a0a" strokeWidth="2" style={{ transition: 'all 1.2s ease-out' }} />
          <text x={p.labelX} y={p.labelY} fill="rgba(255,255,255,0.8)" fontSize="11" fontWeight="500" textAnchor="middle" dominantBaseline="middle">
            {p.label}
          </text>
          <text x={p.labelX} y={p.labelY + 14} fill="rgba(212,163,115,0.7)" fontSize="10" textAnchor="middle">
            {Math.round(p.value * 100)}%
          </text>
        </g>
      ))}
    </svg>
  );
};

// ============================================
// WAVEFORM VISUALIZER - Enhanced
// ============================================
const WaveformVisualizer = ({ isPlaying, type = 'urban' }) => {
  const bars = 50;
  const [heights, setHeights] = useState(Array(bars).fill(0.1));

  useEffect(() => {
    if (!isPlaying) {
      setHeights(Array(bars).fill(0.08));
      return;
    }
    const interval = setInterval(() => {
      setHeights(prev => prev.map((_, i) => {
        if (type === 'urban') {
          // Chaotic, stressed pattern
          return Math.random() * 0.85 + 0.15;
        } else {
          // Calm, breathing pattern
          const base = Math.sin(Date.now() / 800 + i * 0.2) * 0.25 + 0.35;
          return base + Math.random() * 0.08;
        }
      }));
    }, type === 'urban' ? 80 : 120);
    return () => clearInterval(interval);
  }, [isPlaying, type]);

  return (
    <div className="flex items-end justify-center gap-[2px] h-20">
      {heights.map((h, i) => (
        <div key={i} className="w-1 rounded-full transition-all" style={{ height: `${h * 100}%`, backgroundColor: type === 'urban' ? `rgba(180,180,180,${0.3 + h * 0.4})` : `rgba(88,129,87,${0.5 + h * 0.5})`, transitionDuration: type === 'urban' ? '80ms' : '150ms' }} />
      ))}
    </div>
  );
};

// ============================================
// FEASIBILITY MATRIX - Enhanced
// ============================================
const FeasibilityMatrix = () => {
  const criteria = [
    { name: 'Coherencia', score: 92, desc: '¿Mantiene relación con el posicionamiento de la cercanía como ventaja emocional?', color: '#d4a373' },
    { name: 'Pertinencia', score: 88, desc: '¿Conecta con las motivaciones reales del público urbano saturado? ¿Responde al insight?', color: '#588157' },
    { name: 'Claridad', score: 95, desc: '¿Puede explicarse en una frase sin perder fuerza?', color: '#bc6c25' },
    { name: 'Viabilidad', score: 85, desc: '¿Es ejecutable con los recursos, plazos y presupuesto disponibles?', color: '#6b7f5a' },
  ];
  const [animated, setAnimated] = useState(false);

  useEffect(() => {
    setTimeout(() => setAnimated(true), 600);
  }, []);

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

// ============================================
// NAVIGATION NODES - Con iconos minimalistas
// ============================================
// Iconos SVG minimalistas
const NodeIcons = {
  cliente: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="9" cy="7" r="3"/>
      <circle cx="17" cy="9" r="2.5"/>
      <path d="M3 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2"/>
      <path d="M17 14a3 3 0 0 1 3 3v2"/>
    </svg>
  ),
  recursos: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M12 3v5m0 0l-2-2m2 2l2-2"/>
      <path d="M5.5 8.5l3.5 3.5m0 0l-1.5-3m1.5 3l-3-1.5"/>
      <path d="M18.5 8.5l-3.5 3.5m0 0l1.5-3m-1.5 3l3-1.5"/>
      <circle cx="12" cy="16" r="4"/>
    </svg>
  ),
  narrativa: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="3" y="5" width="18" height="14" rx="2"/>
      <path d="M8 10h8"/>
      <path d="M8 14h5"/>
    </svg>
  ),
  viabilidad: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M3 12h4l3-9 4 18 3-9h4"/>
    </svg>
  ),
  simbolos: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="12" cy="12" r="3"/>
      <path d="M12 2v4"/>
      <path d="M12 18v4"/>
      <path d="M4.93 4.93l2.83 2.83"/>
      <path d="M16.24 16.24l2.83 2.83"/>
      <path d="M2 12h4"/>
      <path d="M18 12h4"/>
      <path d="M4.93 19.07l2.83-2.83"/>
      <path d="M16.24 7.76l2.83-2.83"/>
    </svg>
  )
};

const NavNode = ({ label, iconKey, active, onClick, angle, distance }) => {
  const x = 50 + Math.cos(angle) * distance * 50;
  const y = 50 + Math.sin(angle) * distance * 50;

  return (
    <div className={`absolute transform -translate-x-1/2 -translate-y-1/2 z-40 transition-all duration-500 ease-out ${active ? 'scale-110' : 'scale-100 hover:scale-105'}`} style={{ left: `${x}%`, top: `${y}%` }}>
      <button onClick={onClick} className="relative group">
        <div className={`relative w-14 h-14 md:w-16 md:h-16 rounded-full flex items-center justify-center transition-all duration-500 ${active ? 'bg-white/10 border border-white/40 shadow-lg' : 'bg-white/[0.03] border border-white/[0.15] hover:border-white/30 hover:bg-white/[0.06]'}`} style={{ backdropFilter: 'blur(8px)' }}>
          <span className={`transition-colors duration-300 ${active ? 'text-white' : 'text-white/50'}`}>
            {NodeIcons[iconKey]}
          </span>
        </div>
      </button>
      
      {/* Etiqueta y Call to Action debajo del nodo */}
      <div className="absolute top-full left-1/2 -translate-x-1/2 mt-3 text-center pointer-events-none w-32">
        <p className={`text-[10px] md:text-xs font-medium tracking-wider uppercase transition-colors duration-300 ${active ? 'text-white' : 'text-white/40'}`}>
          {label}
        </p>
        {!active && (
          <p className="text-amber-500/60 text-[9px] mt-0.5 animate-pulse whitespace-nowrap">
            Haz clic aquí
          </p>
        )}
      </div>
    </div>
  );
};

// ============================================
// SLIDE-OVER PANEL
// ============================================
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
// SECTION 1: ANÁLISIS DEL CLIENTE
// Contenido profundo basado en RAA
// ============================================
const ClienteContent = () => (
  <div className="space-y-8">
    {/* Introducción */}
    <div className="prose prose-invert max-w-none">
      <p className="text-gray-300 text-lg leading-relaxed">
        El público principal de <span className="text-amber-400 font-medium">Cerca</span> está formado por adultos urbanos de entre 30 y 50 años, residentes en capitales de provincia o áreas metropolitanas españolas. No buscan aventura extrema ni escapismo barato: buscan <span className="text-amber-400">permiso para desconectar</span>.
      </p>
    </div>

    {/* Radar Chart */}
    <GlassCard className="p-6" glow>
      <p className="text-xs text-amber-400 uppercase tracking-wider mb-6">Perfil Psicográfico del Segmento</p>
      <div className="flex justify-center">
        <RadarChart data={[
          { label: 'Tiempo libre', value: 0.25 },
          { label: 'Nivel de estrés', value: 0.88 },
          { label: 'Poder adquisitivo', value: 0.72 },
          { label: 'Uso digital', value: 0.92 },
          { label: 'Eco-consciencia', value: 0.78 },
          { label: 'Exigencia emocional', value: 0.95 }
        ]} size={320} />
      </div>
    </GlassCard>

    {/* Características detalladas */}
    <div>
      <p className="text-xs text-amber-400 uppercase tracking-wider mb-4">Características del Segmento "Urbano Saturado"</p>
      <div className="grid gap-4">
        {[
          { num: '01', title: 'Pobreza de tiempo', desc: 'Vidas aceleradas y agendas saturadas. Dificultad crónica para planificar viajes largos que requieren días de organización.' },
          { num: '02', title: 'Fatiga digital', desc: 'Uso intensivo del entorno digital para informarse e inspirarse, pero creciente necesidad de experiencias táctiles y offline.' },
          { num: '03', title: 'Consumo consciente', desc: 'Interés creciente por el bienestar, la naturaleza, la cultura local y el consumo responsable de producto local.' },
          { num: '04', title: 'Desconfianza hacia lo artificial', desc: 'Alta exigencia emocional y rechazo activo hacia discursos turísticos vacíos o institucionales. Buscan autenticidad.' }
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

    {/* El Dilema */}
    <GlassCard className="p-6 border-amber-800/30" glow>
      <p className="text-xs text-amber-400 uppercase tracking-wider mb-4">El Dilema del Gran Viaje</p>
      <div className="grid md:grid-cols-2 gap-6">
        <div className="p-5 bg-red-900/10 rounded-xl border border-red-900/20">
          <p className="text-red-400 font-medium mb-3 flex items-center gap-2">
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
            Stoppers del Gran Viaje
          </p>
          <ul className="space-y-2 text-sm text-gray-400">
            <li className="flex items-start gap-2"><span className="text-red-400/60">—</span> Falta de tiempo para planificar</li>
            <li className="flex items-start gap-2"><span className="text-red-400/60">—</span> Coste económico elevado</li>
            <li className="flex items-start gap-2"><span className="text-red-400/60">—</span> Energía que consume la logística</li>
            <li className="flex items-start gap-2"><span className="text-red-400/60">—</span> Impacto ambiental del desplazamiento</li>
            <li className="flex items-start gap-2"><span className="text-red-400/60">—</span> Culpa por "no ser un viaje de verdad"</li>
          </ul>
        </div>
        <div className="p-5 bg-green-900/10 rounded-xl border border-green-900/20">
          <p className="text-green-400 font-medium mb-3 flex items-center gap-2">
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="9 12 12 15 16 10"/></svg>
            Solución CERCA
          </p>
          <ul className="space-y-2 text-sm text-gray-400">
            <li className="flex items-start gap-2"><span className="text-green-400/60">—</span> Permiso emocional para desconectar</li>
            <li className="flex items-start gap-2"><span className="text-green-400/60">—</span> Cercanía como ventaja, no limitación</li>
            <li className="flex items-start gap-2"><span className="text-green-400/60">—</span> Logística mínima: 40-90 minutos</li>
            <li className="flex items-start gap-2"><span className="text-green-400/60">—</span> Bajo impacto, alta recompensa</li>
            <li className="flex items-start gap-2"><span className="text-green-400/60">—</span> Autenticidad verificable</li>
          </ul>
        </div>
      </div>
    </GlassCard>

    {/* Insight Estratégico */}
    <div className="p-6 border-l-2 border-amber-600 bg-gradient-to-r from-amber-900/15 to-transparent rounded-r-xl">
      <p className="text-xs text-amber-500 uppercase tracking-wider mb-3">Insight Estratégico Central</p>
      <p className="text-amber-100 italic text-xl leading-relaxed" style={{ fontFamily: 'Georgia, serif' }}>
        "Necesitamos desconectar, pero cada vez cuesta más justificar el tiempo, el dinero, la energía y el impacto que exige un gran viaje."
      </p>
      <p className="text-gray-500 text-sm mt-4">
        Este insight explica por qué muchas personas desean viajar, pero se encuentran ante dilemas que postergan constantemente la decisión. El turismo de proximidad aparece como <strong className="text-white">solución funcional</strong>, pero aún no como <strong className="text-amber-400">solución emocional</strong>. Ahí se sitúa el espacio estratégico de la marca.
      </p>
    </div>

    {/* Oportunidad */}
    <GlassCard className="p-6 bg-gradient-to-br from-green-900/10 to-amber-900/5">
      <p className="text-xs text-green-400 uppercase tracking-wider mb-2">Oportunidad Estratégica</p>
      <p className="text-xl text-white font-light leading-relaxed">
        Convertir la cercanía en un activo de <span className="text-amber-400">calidad de vida</span>. Menos tiempo desplazándote = más tiempo siendo. El turismo cercano no es el "plan B": es la <span className="text-green-400">decisión inteligente</span>.
      </p>
    </GlassCard>
  </div>
);

// ============================================
// SECTION 2: RECURSOS EXPRESIVOS
// ============================================
const RecursosContent = () => {
  const [playingUrban, setPlayingUrban] = useState(false);
  const [playingCerca, setPlayingCerca] = useState(false);

  return (
    <div className="space-y-8">
      <div className="prose prose-invert max-w-none">
        <p className="text-gray-300 text-lg leading-relaxed">
          La paleta sensorial de CERCA huye de la postal saturada y la épica turística. Buscamos la <span className="text-amber-400 font-medium">estética de la intimidad</span>: imperfección honesta, texturas táctiles, ritmo pausado.
        </p>
      </div>

      {/* Comparativa sonora */}
      <GlassCard className="p-6" glow>
        <p className="text-xs text-amber-400 uppercase tracking-wider mb-6">El Silencio como Recurso: Comparativa de Ritmo Sonoro</p>
        <div className="grid md:grid-cols-2 gap-8">
          <div className="text-center">
            <p className="text-gray-400 text-sm mb-4 font-medium">Ruido Urbano</p>
            <p className="text-xs text-gray-600 mb-4">Caótico · Estresante · Impredecible</p>
            <WaveformVisualizer isPlaying={playingUrban} type="urban" />
            <button onClick={() => { setPlayingUrban(!playingUrban); setPlayingCerca(false); }} className={`mt-4 px-5 py-2 rounded-full text-sm transition-all ${playingUrban ? 'bg-white/20 text-white' : 'bg-white/5 text-gray-400 hover:bg-white/10'}`}>
              {playingUrban ? '⏸ Detener simulación' : '▶ Simular ruido urbano'}
            </button>
          </div>
          <div className="text-center">
            <p className="text-green-400 text-sm mb-4 font-medium">Ritmo CERCA</p>
            <p className="text-xs text-gray-600 mb-4">Pausado · Respiratorio · Orgánico</p>
            <WaveformVisualizer isPlaying={playingCerca} type="cerca" />
            <button onClick={() => { setPlayingCerca(!playingCerca); setPlayingUrban(false); }} className={`mt-4 px-5 py-2 rounded-full text-sm transition-all ${playingCerca ? 'bg-green-800/30 text-green-400' : 'bg-white/5 text-gray-400 hover:bg-white/10'}`}>
              {playingCerca ? '⏸ Detener simulación' : '▶ Simular ritmo CERCA'}
            </button>
          </div>
        </div>
        <p className="text-center text-xs text-gray-600 mt-6 italic">El silencio es un lujo. ASMR natural: viento en árboles, agua corriendo, fuego crepitando.</p>
      </GlassCard>

      {/* Gramática Visual */}
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

      {/* Paleta cromática completa */}
      <GlassCard className="p-6">
        <p className="text-xs text-amber-400 uppercase tracking-wider mb-4">Paleta Cromática: Apoyo a Economías Locales</p>
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

      {/* Ritmo y Pausa */}
      <GlassCard className="p-6">
        <p className="text-xs text-amber-400 uppercase tracking-wider mb-4">La Pausa como Recurso de Diseño</p>
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <p className="text-white font-medium mb-3">Ritmo Slow TV</p>
            <p className="text-gray-400 text-sm leading-relaxed mb-4">
              No transmitimos adrenalina. Transmitimos la calma que el usuario anhela. Edición pausada, transiciones suaves, silencios intencionales.
            </p>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500">Velocidad:</span>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map(i => (
                  <div key={i} className={`w-6 h-2 rounded ${i <= 2 ? 'bg-amber-600' : 'bg-white/10'}`} />
                ))}
              </div>
              <span className="text-xs text-amber-400">Lenta</span>
            </div>
          </div>
          <div>
            <p className="text-white font-medium mb-3">Espacio Negativo</p>
            <p className="text-gray-400 text-sm leading-relaxed mb-4">
              El vacío comunica. Composiciones que respiran, márgenes generosos, información dosificada. Menos es permiso.
            </p>
            <p className="text-xs text-gray-600">Referentes: Slow TV noruego, documentales Patagonia, Kinfolk Magazine</p>
          </div>
        </div>
      </GlassCard>

      {/* Tono Narrativo */}
      <div className="p-6 border-l-2 border-green-600 bg-gradient-to-r from-green-900/10 to-transparent rounded-r-xl">
        <p className="text-xs text-green-400 uppercase tracking-wider mb-3">Tono Narrativo</p>
        <p className="text-green-100 text-xl font-light mb-4" style={{ fontFamily: 'Georgia, serif' }}>
          "El lujo no es dorado, es crudo y real."
        </p>
        <p className="text-gray-400 text-sm">
          Honesto, cálido, sin épica ni clichés turísticos. Hablamos como quien comparte un hallazgo, no como quien promociona un producto.
        </p>
      </div>
    </div>
  );
};

// ============================================
// SECTION 3: NARRATIVA DE MARCA
// ============================================
const NarrativaContent = () => (
  <div className="space-y-8">
    {/* Mensaje Core */}
    <div className="text-center p-8 bg-gradient-to-br from-amber-900/20 via-amber-800/10 to-transparent rounded-2xl border border-amber-700/20">
      <p className="text-xs text-amber-400 uppercase tracking-[0.3em] mb-4">Mensaje Core</p>
      <p className="text-3xl md:text-4xl text-white font-light leading-relaxed" style={{ fontFamily: 'Georgia, serif' }}>
        "No hace falta ir lejos para sentir que te has ido"
      </p>
      <p className="text-gray-500 text-sm mt-4 max-w-lg mx-auto">
        Este mensaje activa el insight estratégico y posiciona la proximidad como solución emocional, no como limitación. No vendemos destinos: acercamos sensaciones.
      </p>
    </div>

    {/* Propuesta de Valor */}
    <GlassCard className="p-6" glow>
      <p className="text-xs text-amber-400 uppercase tracking-wider mb-4">Propuesta de Valor</p>
      <p className="text-xl text-white font-light leading-relaxed">
        <span className="text-amber-400">Cerca vende permiso para desconectar sin culpa.</span> Transforma la cercanía en ventaja emocional: escapar no requiere distancia, sino cambio de mirada.
      </p>
    </GlassCard>

    {/* Tono de Voz */}
    <div>
      <p className="text-xs text-amber-400 uppercase tracking-wider mb-4">Arquitectura del Tono de Voz</p>
      <div className="grid md:grid-cols-2 gap-4">
        {[
          { trait: 'Honesto', value: 95, desc: 'Sin artificios ni promesas vacías. Contamos lo que hay.' },
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

    {/* Lo que NO somos */}
    <GlassCard className="p-6 border-red-900/20">
      <p className="text-xs text-red-400 uppercase tracking-wider mb-4">Lo que NO somos (Anti-territorio)</p>
      <div className="grid md:grid-cols-2 gap-3">
        {[
          'Épica turística institucional', 'Listas de pueblos y rutas sin alma', 'Ofertas y descuentos agresivos', 'Lenguaje de folleto de ayuntamiento',
          'Promesas de "experiencias únicas"', 'Stock photos de sonrisas forzadas', 'Discurso de sostenibilidad vacío', 'Tono de campaña gubernamental'
        ].map((item, i) => (
          <div key={i} className="flex items-center gap-3 text-gray-400 p-2 bg-red-900/5 rounded-lg">
            <span className="text-red-400/40 text-xs">—</span>
            <span className="text-sm">{item}</span>
          </div>
        ))}
      </div>
    </GlassCard>

    {/* Estrategia de Canales */}
    <div>
      <p className="text-xs text-amber-400 uppercase tracking-wider mb-4">Articulación Transmedia</p>
      <div className="space-y-4">
        {[
          { platform: 'Instagram / TikTok', format: 'Contraste emocional "Lunes vs. Domingo"', content: 'Contenido testimonial breve. Del gris oficina (lunes 9:00) al verde bosque (domingo 11:00 a 50km). Sin filtros excesivos.', example: '"Esto es a 47 minutos de mi mesa de trabajo"', color: '#E1306C' },
          { platform: 'Podcast', format: 'Narrativas de redescubrimiento', content: 'Historias de personas que redescubrieron su entorno cercano. Ideal para escuchar en el trayecto corto. Tono íntimo, conversacional.', example: '"40 minutos" - El podcast de las escapadas que caben en tu agenda', color: '#1DB954' },
          { platform: 'Email Editorial', format: 'Historias de lugares y personas, no ofertas', content: 'Newsletter con narrativa, no promociones. Cada email cuenta una historia de un lugar cercano y las personas que lo habitan.', example: '"El panadero de Sigüenza que hornea desde las 4am"', color: '#4A90A4' },
          { platform: 'Activaciones Urbanas', format: 'Intervenciones contextuales en zonas de oficinas', content: 'Mensajes en lugares de alto estrés (metro, zonas financieras) que ofrecen una alternativa tangible e inmediata.', example: '"A 47 minutos de este semáforo, existe esto" [imagen de río]', color: '#d4a373' }
        ].map((ch, i) => (
          <GlassCard key={i} className="p-5">
            <div className="flex items-start gap-4">
              <div className="w-1 h-16 rounded-full flex-shrink-0" style={{ backgroundColor: ch.color }} />
              <div className="flex-1">
                <p className="text-white font-medium">{ch.platform}</p>
                <p className="text-sm mt-1" style={{ color: ch.color }}>{ch.format}</p>
                <p className="text-gray-400 text-sm mt-2 leading-relaxed">{ch.content}</p>
                <p className="text-gray-600 text-xs mt-3 italic">Ejemplo: {ch.example}</p>
              </div>
            </div>
          </GlassCard>
        ))}
      </div>
    </div>

    {/* Insight final */}
    <div className="p-6 border-l-2 border-amber-600 bg-gradient-to-r from-amber-900/15 to-transparent rounded-r-xl">
      <p className="text-amber-100 text-xl italic leading-relaxed" style={{ fontFamily: 'Georgia, serif' }}>
        "A 47 minutos de este estrés, existe esto."
      </p>
      <p className="text-gray-500 text-sm mt-3">
        La narrativa no describe destinos: acerca sensaciones. No enumera lugares: sugiere escapes.
      </p>
    </div>
  </div>
);

// ============================================
// SECTION 4: VIABILIDAD Y RIESGOS
// ============================================
const ViabilidadContent = () => (
  <div className="space-y-8">
    <div className="prose prose-invert max-w-none">
      <p className="text-gray-300 text-lg leading-relaxed">
        Modelo <span className="text-amber-400 font-medium">Asset Light</span>: curamos, no construimos. Alta viabilidad basada en la economía local ya activa. No creamos infraestructura: seleccionamos y narramos lo que ya existe.
      </p>
    </div>

    {/* Propuesta operativa */}
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
      <p className="text-gray-400 text-sm mt-4 text-center">
        Vendemos "permiso para desconectar": solución de bajo coste operativo pero alto retorno emocional.
      </p>
    </GlassCard>

    {/* Matriz de Factibilidad */}
    <GlassCard className="p-6">
      <p className="text-xs text-amber-400 uppercase tracking-wider mb-6">Matriz de Factibilidad (4 Filtros de Evaluación)</p>
      <FeasibilityMatrix />
    </GlassCard>

    {/* Fases de implementación */}
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
              <div className={`w-12 h-12 rounded-full flex items-center justify-center font-mono text-lg ${item.status === 'active' ? 'bg-green-800/50 text-green-400' : item.status === 'next' ? 'bg-amber-800/30 text-amber-400' : 'bg-white/10 text-gray-500'}`}>
                {item.phase}
              </div>
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

    {/* Análisis de Riesgos */}
    <div>
      <p className="text-xs text-red-400 uppercase tracking-wider mb-4">Gestión de Riesgos</p>
      <div className="space-y-3">
        {[
          { risk: 'Percepción "Low Cost"', level: 'Alto', desc: 'Que la cercanía se asocie a bajo valor o falta de ambición.', mitigation: 'Elevación estética rigurosa y pricing de experiencia premium. Curación exigente.', levelColor: 'bg-red-900/30 text-red-400' },
          { risk: 'Sobre-generalización Institucional', level: 'Medio', desc: 'Que entes gubernamentales saturen el discurso de proximidad con campañas genéricas.', mitigation: 'Diferenciación por tono cómplice y personal. Nunca institucional. Autenticidad verificable.', levelColor: 'bg-yellow-900/30 text-yellow-400' },
          { risk: 'Saturación del Discurso de Proximidad', level: 'Medio', desc: 'Que múltiples actores copien el mensaje diluyendo su efectividad.', mitigation: 'Enfoque emocional vs. funcional. No vendemos destinos, vendemos permiso. Territorio único.', levelColor: 'bg-yellow-900/30 text-yellow-400' },
          { risk: 'Dependencia de Terceros', level: 'Bajo', desc: 'Riesgo operativo por depender de proveedores locales.', mitigation: 'Red diversificada de colaboradores. Modelo Asset Light reduce exposición.', levelColor: 'bg-green-900/30 text-green-400' }
        ].map((r, i) => (
          <GlassCard key={i} className="p-5">
            <div className="flex justify-between items-start mb-3">
              <p className="text-white font-medium">{r.risk}</p>
              <span className={`text-xs px-3 py-1 rounded-full ${r.levelColor}`}>{r.level}</span>
            </div>
            <p className="text-gray-500 text-sm mb-3">{r.desc}</p>
            <div className="flex items-start gap-2 p-3 bg-green-900/10 rounded-lg">
              <span className="text-green-400">→</span>
              <p className="text-green-400/80 text-sm">{r.mitigation}</p>
            </div>
          </GlassCard>
        ))}
      </div>
    </div>
  </div>
);

// ============================================
// SECTION 5: SÍMBOLOS CULTURALES
// ============================================
const SimbolosContent = () => (
  <div className="space-y-8">
    <div className="prose prose-invert max-w-none">
      <p className="text-gray-300 text-lg leading-relaxed">
        Reemplazo de la semiótica tradicional del viaje <span className="text-gray-500">(avión, maleta, pasaporte)</span> por <span className="text-amber-400 font-medium">símbolos de proximidad</span> que responden a la inflación, la conciencia medioambiental y la revalorización del producto local.
      </p>
    </div>

    {/* Símbolos principales */}
    <div className="space-y-4">
      {[
        { num: '01', title: 'El Círculo de los 90 Minutos', subtitle: 'Territorio de felicidad', desc: 'Representación visual del área de influencia donde cabe todo lo que necesitas. No es una limitación geográfica: es un mapa de posibilidades. Todo lo que buscas está más cerca de lo que crees.', vigencia: 'Conecta con el concepto de "15-minute city" y la revalorización de lo local post-pandemia. La cercanía como lujo de tiempo.', respect: 'Inclusivo: no discrimina por nivel económico ni requiere privilegios de movilidad. Democrático.', usage: 'Icono central en comunicaciones. Base del claim "A X minutos de aquí".' },
        { num: '02', title: 'La Mochila Ligera / Maleta Vacía', subtitle: 'Libertad sin peso', desc: 'Símbolo de viajar sin carga física ni mental. Contraposición directa al estrés de aeropuertos, facturación, planificación excesiva. El no-equipaje como declaración de intenciones.', vigencia: 'Alineado con el minimalismo contemporáneo y la fatiga del hiperconsumo. Menos es más. Menos es permiso.', respect: 'No romantiza la pobreza: celebra la elección consciente de simplificar. Decisión, no limitación.', usage: 'Elemento visual en contraposición a imágenes de caos aeroportuario.' },
        { num: '03', title: 'Hacer Pellas (Versión Adulta)', subtitle: 'Rebeldía contra la agenda', desc: 'El acto de escapar sin pedir permiso. Recuperar la sensación de libertad de la infancia, aplicada a la vida adulta. Salir del guion establecido aunque sea por unas horas.', vigencia: 'Nostalgia generacional de los 30-50 transformada en acción de autocuidado. Rebeldía productiva.', respect: 'Universal: conecta con una experiencia compartida de toda una generación. No exclusivo.', usage: 'Tono en comunicaciones. Guiño cómplice. "Tu jefe no tiene por qué enterarse".' },
        { num: '04', title: 'La Ventana Abierta', subtitle: 'Cambio de perspectiva', desc: 'Metáfora de que el escape no requiere distancia física, sino apertura mental y permiso emocional. Mirar hacia fuera para volver a verte dentro.', vigencia: 'Resuena con la búsqueda de bienestar mental y la importancia del autocuidado post-pandemia.', respect: 'Aplicable independientemente de circunstancias personales, económicas o físicas.', usage: 'Recurso visual recurrente. Encuadres que sugieren el "afuera" accesible.' }
      ].map((s, i) => (
        <GlassCard key={i} className="p-6" glow>
          <div className="flex flex-col md:flex-row gap-6">
            <div className="flex-shrink-0">
              <span className="text-5xl font-extralight text-amber-600/30 font-mono">{s.num}</span>
            </div>
            <div className="flex-1">
              <p className="text-white text-xl font-medium">{s.title}</p>
              <p className="text-amber-400 text-sm mb-3">{s.subtitle}</p>
              <p className="text-gray-400 leading-relaxed mb-4">{s.desc}</p>
              <div className="grid md:grid-cols-3 gap-4 mt-4 pt-4 border-t border-white/5">
                <div>
                  <p className="text-xs text-green-400 uppercase tracking-wider mb-2">Vigencia Cultural</p>
                  <p className="text-gray-500 text-xs leading-relaxed">{s.vigencia}</p>
                </div>
                <div>
                  <p className="text-xs text-blue-400 uppercase tracking-wider mb-2">Respeto Cultural</p>
                  <p className="text-gray-500 text-xs leading-relaxed">{s.respect}</p>
                </div>
                <div>
                  <p className="text-xs text-amber-400 uppercase tracking-wider mb-2">Uso en Comunicación</p>
                  <p className="text-gray-500 text-xs leading-relaxed">{s.usage}</p>
                </div>
              </div>
            </div>
          </div>
        </GlassCard>
      ))}
    </div>

    {/* Justificación de vigencia */}
    <GlassCard className="p-6 bg-gradient-to-br from-green-900/10 to-amber-900/5">
      <p className="text-xs text-green-400 uppercase tracking-wider mb-4">Justificación Global de Vigencia</p>
      <p className="text-gray-300 leading-relaxed mb-4">
        Estos símbolos son vigentes porque responden directamente a tres fuerzas contemporáneas del mercado español:
      </p>
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

    {/* Conexión con tendencias */}
    <div>
      <p className="text-xs text-amber-400 uppercase tracking-wider mb-4">Conexión con Tendencias Culturales</p>
      <div className="flex flex-wrap gap-2">
        {[
          'Slow Life', 'Minimalismo existencial', 'Turismo regenerativo', 'Economía local', 'Bienestar mental', 'Sostenibilidad activa',
          'Autenticidad', 'Desconexión digital', 'Mindfulness', 'Hygge', 'Post-turismo', 'Kilómetro cero'
        ].map((trend, i) => (
          <span key={i} className="px-4 py-2 bg-white/5 rounded-full text-gray-400 text-sm border border-white/10 hover:border-amber-700/50 hover:text-amber-400 transition-all cursor-default">
            {trend}
          </span>
        ))}
      </div>
    </div>

    {/* Cierre */}
    <div className="p-6 border-l-2 border-amber-600 bg-gradient-to-r from-amber-900/15 to-transparent rounded-r-xl">
      <p className="text-amber-100 text-xl italic leading-relaxed" style={{ fontFamily: 'Georgia, serif' }}>
        "Estos símbolos funcionan como anclas visuales y conceptuales que atraviesan toda la comunicación, creando coherencia sin rigidez."
      </p>
      <p className="text-gray-500 text-sm mt-3">
        No vendemos destinos. No vendemos experiencias. Vendemos permiso para ser.
      </p>
    </div>
  </div>
);

// ============================================
// MAIN APPLICATION
// ============================================
export default function CercaProximityLens() {
  const [activeSection, setActiveSection] = useState(-1);
  const [panelOpen, setPanelOpen] = useState(false);
  const [bgIntensity, setBgIntensity] = useState(0);
  const [showIntro, setShowIntro] = useState(true);

  useEffect(() => {
    if (activeSection >= 0) {
      const timer = setTimeout(() => setBgIntensity(1), 100);
      return () => clearTimeout(timer);
    } else {
      setBgIntensity(0);
    }
  }, [activeSection]);

  const sections = [
    { id: 0, label: 'Cliente', iconKey: 'cliente', title: 'El Segmento "Urbano Saturado"', subtitle: 'Análisis del Cliente', content: ClienteContent },
    { id: 1, label: 'Recursos', iconKey: 'recursos', title: 'Estética de la Intimidad', subtitle: 'Recursos Expresivos', content: RecursosContent },
    { id: 2, label: 'Narrativa', iconKey: 'narrativa', title: 'Transmedia Storytelling', subtitle: 'Narrativa de Marca', content: NarrativaContent },
    { id: 3, label: 'Viabilidad', iconKey: 'viabilidad', title: 'Asset Light & Risk Management', subtitle: 'Viabilidad y Riesgos', content: ViabilidadContent },
    { id: 4, label: 'Símbolos', iconKey: 'simbolos', title: 'Semiótica de Proximidad', subtitle: 'Referencias Culturales', content: SimbolosContent }
  ];

  // Posiciones de nodos: ángulo (radianes) y distancia (proporción del radio)
  // Distribuidos en círculo alrededor del centro
  // distance * 50 = porcentaje desde el centro en el contenedor
  const nodeConfigs = [
    { angle: -Math.PI / 2, distance: 0.70 }, // 01 Cliente - arriba
    { angle: -Math.PI / 2 + (2 * Math.PI / 5), distance: 0.70 }, // 02 Recursos - derecha arriba
    { angle: -Math.PI / 2 + (4 * Math.PI / 5), distance: 0.70 }, // 03 Narrativa - derecha abajo
    { angle: -Math.PI / 2 + (6 * Math.PI / 5), distance: 0.70 }, // 04 Viabilidad - izquierda abajo
    { angle: -Math.PI / 2 + (8 * Math.PI / 5), distance: 0.70 }, // 05 Símbolos - izquierda arriba
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
      {/* Intro Modal Overlay */}
      {showIntro && <IntroModal onEnter={() => setShowIntro(false)} />}

      {/* Proximity Map Background */}
      <ProximityMapBackground activeSection={activeSection} intensity={bgIntensity} />

      {/* Header - Z-index adjusted to not block clicks but remain visible */}
      <header className="absolute top-0 left-0 right-0 z-30 p-6 md:p-10 pointer-events-none">
        <div className="flex justify-between items-start">
          <div className="pointer-events-auto">
            <h1 className="text-4xl md:text-5xl font-normal text-white" style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}>
              Cerca<span className="text-amber-500">.</span>
            </h1>
            <p className="text-[10px] text-white/40 tracking-[0.25em] uppercase mt-1">RAA - Juan de Dios Llamas v12.0</p>
          </div>
        </div>
      </header>

      {/* Central Message - Dentro del círculo conceptualmente */}
      <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none px-4">
        <div className={`text-center transition-all duration-700 ${panelOpen ? 'opacity-0 scale-95' : 'opacity-100 scale-100'}`}>
          <p className="text-2xl md:text-3xl font-normal italic text-white/90 max-w-md mx-auto leading-relaxed" style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}>
            "No hace falta ir lejos para <br />sentir que te has ido"
          </p>
          <p className="text-[10px] md:text-[11px] text-white/40 tracking-[0.3em] uppercase mt-6">Estrategia de Resignificación</p>
        </div>
      </div>

      {/* Navigation Nodes - Contenedor cuadrado centrado */}
      {/* SINCRONIZACIÓN CRÍTICA: width y height deben ser exactamente min(100vw, 100vh) */}
      <div className="absolute z-20" style={{
        width: 'min(100vw, 100vh)',
        height: 'min(100vw, 100vh)',
        left: '50%',
        top: '50%',
        transform: 'translate(-50%, -50%)',
      }}>
        {sections.map((section, i) => (
          <NavNode
            key={i}
            label={section.label}
            iconKey={section.iconKey}
            active={activeSection === i}
            onClick={() => handleNodeClick(i)}
            angle={nodeConfigs[i].angle}
            distance={nodeConfigs[i].distance}
          />
        ))}
      </div>

      {/* Slide-over Panel */}
      {activeSection >= 0 && (
        <SlideOverPanel
          isOpen={panelOpen}
          onClose={handleClosePanel}
          title={sections[activeSection].title}
          subtitle={sections[activeSection].subtitle}
        >
          <ActiveContent />
        </SlideOverPanel>
      )}

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255,255,255,0.02);
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(212,163,115,0.3);
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(212,163,115,0.5);
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .animate-fadeIn {
          animation: fadeIn 0.8s ease-out forwards;
        }
      `}</style>
    </div>
  );
}
