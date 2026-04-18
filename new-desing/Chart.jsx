/* Chart.jsx — XAUUSD candlestick chart with synthetic but realistic data */

const { useMemo, useRef, useState, useEffect } = React;

// --- deterministic seeded random for stable candle data
function seedRand(seed) {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

function generateCandles(n, seed = 42) {
  const rnd = seedRand(seed);
  const candles = [];
  let price = 5120;
  let trendBias = -0.3; // overall downtrend then recovery
  for (let i = 0; i < n; i++) {
    // shift bias over time to create a visible structure
    const phase = i / n;
    if (phase < 0.15) trendBias = 0.1;         // ramp up
    else if (phase < 0.65) trendBias = -0.55;  // sell off
    else if (phase < 0.8) trendBias = -0.15;   // chop bottom
    else trendBias = 0.35;                      // recovery
    const drift = trendBias * 4;
    const vol = 14 + rnd() * 20;
    const open = price;
    const change = drift + (rnd() - 0.5) * vol * 2;
    const close = Math.max(3900, open + change);
    const wickUp = rnd() * vol * 0.8;
    const wickDn = rnd() * vol * 0.8;
    const high = Math.max(open, close) + wickUp;
    const low = Math.min(open, close) - wickDn;
    candles.push({ o: open, h: high, l: low, c: close, i });
    price = close;
  }
  return candles;
}

function Chart({ compact = false }) {
  const candles = useMemo(() => generateCandles(120, 77), []);
  const [crosshair, setCrosshair] = useState(null);
  const containerRef = useRef(null);

  const prices = useMemo(() => {
    const allHigh = candles.map(c => c.h);
    const allLow = candles.map(c => c.l);
    const hi = Math.max(...allHigh) + 20;
    const lo = Math.min(...allLow) - 20;
    return { hi, lo };
  }, [candles]);

  const VB_W = 1200;
  const VB_H = compact ? 300 : 560;
  const PAD_R = 62;
  const PAD_B = 34;
  const PAD_T = 8;
  const plotW = VB_W - PAD_R;
  const plotH = VB_H - PAD_B - PAD_T;

  const xFor = (i) => (i + 0.5) * (plotW / candles.length);
  const yFor = (p) => PAD_T + (1 - (p - prices.lo) / (prices.hi - prices.lo)) * plotH;
  const cw = Math.max(2, (plotW / candles.length) * 0.65);

  const last = candles[candles.length - 1];
  const lastY = yFor(last.c);

  // horizontal gridlines values
  const gridTicks = useMemo(() => {
    const count = 8;
    const step = (prices.hi - prices.lo) / count;
    return Array.from({ length: count + 1 }, (_, k) => prices.lo + k * step);
  }, [prices]);

  // key levels (support/resistance from spec text)
  const keyLevels = [
    { label: 'Resistance', value: 4885, color: 'var(--bear)' },
    { label: 'Pivot', value: 4750, color: 'var(--gold)' },
    { label: 'Support', value: 4580, color: 'var(--bull)' },
  ];

  // MA line (simple 20-period)
  const maPts = useMemo(() => {
    const out = [];
    const len = 20;
    for (let i = 0; i < candles.length; i++) {
      if (i < len - 1) continue;
      let sum = 0;
      for (let j = 0; j < len; j++) sum += candles[i - j].c;
      out.push([xFor(i), yFor(sum / len)]);
    }
    return out;
  }, [candles]);

  const onMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const relX = (e.clientX - rect.left) / rect.width * VB_W;
    const relY = (e.clientY - rect.top) / rect.height * VB_H;
    if (relX > plotW) { setCrosshair(null); return; }
    const i = Math.min(candles.length - 1, Math.max(0, Math.floor(relX / (plotW / candles.length))));
    const price = prices.hi - ((relY - PAD_T) / plotH) * (prices.hi - prices.lo);
    setCrosshair({ i, x: relX, y: relY, price });
  };

  // === Chart Header ===
  const timeframes = ['1m', '5m', '15m', '1H', '4H', '1D', '1W'];
  const [activeTf, setActiveTf] = useState('1D');

  return (
    <>
      <div className="chart-header">
        <div className="chart-header-left">
          <div className="tf-group">
            {timeframes.map(tf => (
              <button key={tf}
                      className={`tf-btn ${activeTf === tf ? 'active' : ''}`}
                      onClick={() => setActiveTf(tf)}>{tf}</button>
            ))}
          </div>
          <button className="chart-tool">
            <svg width="11" height="11" viewBox="0 0 16 16" fill="none"><path d="M3 8h10M8 3v10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
            Indicators
          </button>
          <button className="chart-tool">
            <svg width="11" height="11" viewBox="0 0 16 16" fill="none"><path d="M2 13l4-4 3 3 5-7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
            Compare
          </button>
        </div>
        <div className="chart-header-left">
          <div style={{ display: 'flex', gap: 10, fontSize: 11, color: 'var(--text-3)', fontFamily: 'Geist Mono, monospace' }}>
            <span>O <span style={{ color: 'var(--text-1)' }}>{last.o.toFixed(2)}</span></span>
            <span>H <span style={{ color: 'var(--bull)' }}>{last.h.toFixed(2)}</span></span>
            <span>L <span style={{ color: 'var(--bear)' }}>{last.l.toFixed(2)}</span></span>
            <span>C <span style={{ color: 'var(--text-0)' }}>{last.c.toFixed(2)}</span></span>
          </div>
        </div>
      </div>

      <div className="chart-body" onMouseMove={onMove} onMouseLeave={() => setCrosshair(null)} ref={containerRef}>
        <div className="gridlines" />
        <svg className="chart-svg" viewBox={`0 0 ${VB_W} ${VB_H}`} preserveAspectRatio="none">
          {/* horizontal gridlines */}
          {gridTicks.map((v, k) => (
            <line key={k} x1={0} x2={plotW} y1={yFor(v)} y2={yFor(v)}
                  stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
          ))}

          {/* key levels */}
          {keyLevels.map((lvl, k) => (
            <g key={k}>
              <line x1={0} x2={plotW} y1={yFor(lvl.value)} y2={yFor(lvl.value)}
                    stroke={lvl.color} strokeWidth="0.75" strokeDasharray="4 4" opacity="0.5" />
              <rect x={plotW - 54} y={yFor(lvl.value) - 9} width="52" height="16" rx="2"
                    fill="var(--bg-3)" stroke={lvl.color} strokeOpacity="0.5" strokeWidth="0.75" />
              <text x={plotW - 28} y={yFor(lvl.value) + 3} textAnchor="middle"
                    fontSize="10" fill={lvl.color} fontFamily="Geist Mono, monospace" fontWeight="600">
                {lvl.value.toFixed(0)}
              </text>
            </g>
          ))}

          {/* MA line */}
          <polyline
            points={maPts.map(p => p.join(',')).join(' ')}
            fill="none"
            stroke="var(--gold)"
            strokeWidth="1.2"
            strokeOpacity="0.85"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* candles */}
          {candles.map((c, i) => {
            const x = xFor(i);
            const isUp = c.c >= c.o;
            const color = isUp ? 'var(--bull)' : 'var(--bear)';
            const bodyY = yFor(Math.max(c.o, c.c));
            const bodyH = Math.max(1, Math.abs(yFor(c.o) - yFor(c.c)));
            return (
              <g key={i}>
                <line x1={x} x2={x} y1={yFor(c.h)} y2={yFor(c.l)} stroke={color} strokeWidth="1" opacity="0.85" />
                <rect x={x - cw / 2} y={bodyY} width={cw} height={bodyH} fill={color} opacity={isUp ? 0.9 : 1} />
              </g>
            );
          })}

          {/* last price dashed line */}
          <line x1={0} x2={plotW} y1={lastY} y2={lastY} stroke="var(--gold)" strokeWidth="0.75" strokeDasharray="2 3" opacity="0.7" />

          {/* crosshair */}
          {crosshair && (
            <g pointerEvents="none">
              <line x1={crosshair.x} x2={crosshair.x} y1={PAD_T} y2={PAD_T + plotH}
                    stroke="var(--text-3)" strokeWidth="0.5" strokeDasharray="2 3" />
              <line x1={0} x2={plotW} y1={crosshair.y} y2={crosshair.y}
                    stroke="var(--text-3)" strokeWidth="0.5" strokeDasharray="2 3" />
            </g>
          )}
        </svg>

        {/* price axis */}
        <div className="price-axis">
          {gridTicks.map((v, k) => (
            <div key={k} className="pax mono" style={{ top: `calc(${(yFor(v) / VB_H) * 100}% )` }}>
              {v.toFixed(0)}
            </div>
          ))}
          <div className="last-price mono" style={{ top: `${(lastY / VB_H) * 100}%` }}>
            {last.c.toFixed(2)}
          </div>
          {keyLevels.map((lvl, k) => (
            <div key={k} className="pax mono"
                 style={{
                   top: `${(yFor(lvl.value) / VB_H) * 100}%`,
                   color: lvl.color,
                   fontWeight: 600,
                 }}>
              {lvl.value}
            </div>
          ))}
        </div>

        {/* time axis */}
        <div className="time-axis">
          <span>Mar 18</span><span>Mar 22</span><span>Mar 26</span><span>Mar 30</span>
          <span>Apr 03</span><span>Apr 08</span><span>Apr 12</span><span>Apr 18</span>
        </div>

        <div className="corner-fill" />

        {/* crosshair labels */}
        {crosshair && (
          <div className="chart-crosshair-label mono"
               style={{ top: `${(crosshair.y / VB_H) * 100}%` }}>
            {crosshair.price.toFixed(2)}
          </div>
        )}
      </div>

      {/* RSI mini */}
      <RsiFooter candles={candles} />
    </>
  );
}

function RsiFooter({ candles }) {
  const pts = useMemo(() => {
    // simple rsi-ish oscillator
    const out = [];
    const len = 14;
    for (let i = 0; i < candles.length; i++) {
      if (i < len) { out.push(50); continue; }
      let gains = 0, losses = 0;
      for (let j = i - len + 1; j <= i; j++) {
        const d = candles[j].c - candles[j - 1].c;
        if (d > 0) gains += d; else losses -= d;
      }
      const rs = gains / Math.max(0.001, losses);
      out.push(100 - 100 / (1 + rs));
    }
    return out;
  }, [candles]);
  const VB_W = 1200, VB_H = 80;
  const plotW = VB_W - 62;
  const plotH = VB_H - 18;
  const x = (i) => (i + 0.5) * (plotW / pts.length);
  const y = (v) => 8 + (1 - v / 100) * plotH;
  const last = pts[pts.length - 1];
  return (
    <div className="chart-footer">
      <div className="chart-footer-label">
        RSI <span className="v">14</span> <span className="mono" style={{ color: last > 70 ? 'var(--bear)' : last < 30 ? 'var(--bull)' : 'var(--warn)' }}>{last.toFixed(1)}</span>
      </div>
      <svg viewBox={`0 0 ${VB_W} ${VB_H}`} style={{ position: 'absolute', inset: 0, width: 'calc(100% - 62px)', height: '100%' }} preserveAspectRatio="none">
        <line x1={0} x2={plotW} y1={y(70)} y2={y(70)} stroke="var(--bear)" strokeWidth="0.5" strokeDasharray="3 3" opacity="0.5" />
        <line x1={0} x2={plotW} y1={y(30)} y2={y(30)} stroke="var(--bull)" strokeWidth="0.5" strokeDasharray="3 3" opacity="0.5" />
        <polyline points={pts.map((v, i) => `${x(i)},${y(v)}`).join(' ')}
                  fill="none" stroke="var(--gold)" strokeWidth="1.2" strokeOpacity="0.9" />
      </svg>
    </div>
  );
}

// Rail mini-chart
function RailMiniChart() {
  const candles = useMemo(() => generateCandles(60, 77), []);
  const prices = useMemo(() => {
    const hi = Math.max(...candles.map(c => c.h));
    const lo = Math.min(...candles.map(c => c.l));
    return { hi, lo };
  }, [candles]);
  const VB_W = 50, VB_H = 200;
  const xFor = (i) => (i + 0.5) * (VB_W / candles.length);
  const yFor = (p) => (1 - (p - prices.lo) / (prices.hi - prices.lo)) * VB_H;
  const pathClose = candles.map((c, i) => `${i === 0 ? 'M' : 'L'}${xFor(i)},${yFor(c.c)}`).join(' ');
  const area = `${pathClose} L ${VB_W},${VB_H} L 0,${VB_H} Z`;
  return (
    <svg className="rail-mini-sparkline" viewBox={`0 0 ${VB_W} ${VB_H}`} preserveAspectRatio="none">
      <defs>
        <linearGradient id="railGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--gold)" stopOpacity="0.3" />
          <stop offset="100%" stopColor="var(--gold)" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill="url(#railGrad)" />
      <path d={pathClose} fill="none" stroke="var(--gold-bright)" strokeWidth="1.3" strokeLinejoin="round" />
    </svg>
  );
}

window.Chart = Chart;
window.RailMiniChart = RailMiniChart;
