/* App.jsx — shell: topbar, mode toggle, resizable panels, tweaks */

const { useState, useRef, useEffect, useCallback } = React;

const MODES = {
  split: { label: 'Split View', key: 'split' },
  analysis: { label: 'Analysis Mode', key: 'analysis' },
  chart: { label: 'Chart Mode', key: 'chart' },
};

const ModeIcon = ({ mode }) => {
  if (mode === 'split') return (
    <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
      <rect x="1.5" y="2.5" width="5.5" height="11" rx="1" stroke="currentColor" strokeWidth="1.2" />
      <rect x="9" y="2.5" width="5.5" height="11" rx="1" stroke="currentColor" strokeWidth="1.2" />
    </svg>
  );
  if (mode === 'analysis') return (
    <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
      <rect x="1.5" y="2.5" width="2.5" height="11" rx="1" stroke="currentColor" strokeWidth="1.2" />
      <rect x="6" y="2.5" width="8.5" height="11" rx="1" stroke="currentColor" strokeWidth="1.2" fill="currentColor" fillOpacity="0.15" />
    </svg>
  );
  if (mode === 'chart') return (
    <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
      <rect x="1.5" y="2.5" width="9" height="11" rx="1" stroke="currentColor" strokeWidth="1.2" fill="currentColor" fillOpacity="0.15" />
      <rect x="12" y="2.5" width="2.5" height="11" rx="1" stroke="currentColor" strokeWidth="1.2" />
    </svg>
  );
  return null;
};

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "accent": "gold",
  "density": "comfortable",
  "showTweaks": false
}/*EDITMODE-END*/;

const ACCENTS = {
  gold:  { '--gold': '#d4a24c', '--gold-bright': '#e8b85a', '--gold-deep': '#a07a2f', '--gold-dim': 'rgba(212,162,76,0.14)', '--gold-glow': 'rgba(212,162,76,0.35)' },
  amber: { '--gold': '#e89a3a', '--gold-bright': '#ffb347', '--gold-deep': '#b06a1a', '--gold-dim': 'rgba(232,154,58,0.14)', '--gold-glow': 'rgba(232,154,58,0.35)' },
  copper:{ '--gold': '#c67a4e', '--gold-bright': '#e69366', '--gold-deep': '#8a4a25', '--gold-dim': 'rgba(198,122,78,0.14)', '--gold-glow': 'rgba(198,122,78,0.35)' },
  ivory: { '--gold': '#d7c9a8', '--gold-bright': '#f2e3c0', '--gold-deep': '#8a7c5a', '--gold-dim': 'rgba(215,201,168,0.12)', '--gold-glow': 'rgba(215,201,168,0.3)' },
};

function App() {
  const [mode, setMode] = useState('split');
  const [chartFlex, setChartFlex] = useState(1); // ratio vs intel
  const [intelFlex, setIntelFlex] = useState(1);
  const [dragging, setDragging] = useState(false);
  const [tweaks, setTweaks] = useState(TWEAK_DEFAULTS);
  const [tweaksOpen, setTweaksOpen] = useState(false);

  const workspaceRef = useRef(null);
  const modeBtnsRef = useRef({});
  const [modeIndicator, setModeIndicator] = useState({ left: 0, width: 0 });

  // apply accent css vars
  useEffect(() => {
    const root = document.documentElement;
    const vars = ACCENTS[tweaks.accent] || ACCENTS.gold;
    Object.entries(vars).forEach(([k, v]) => root.style.setProperty(k, v));
  }, [tweaks.accent]);

  // ratios for each mode
  useEffect(() => {
    if (mode === 'split') { setChartFlex(1); setIntelFlex(1); }
    else if (mode === 'chart') { setChartFlex(2.2); setIntelFlex(1); }
    // analysis mode uses rail class instead of flex
  }, [mode]);

  // mode indicator sliding bg
  useEffect(() => {
    const el = modeBtnsRef.current[mode];
    if (el) {
      const parent = el.parentElement;
      const pr = parent.getBoundingClientRect();
      const r = el.getBoundingClientRect();
      setModeIndicator({ left: r.left - pr.left, width: r.width });
    }
  }, [mode]);

  // divider drag
  const onDividerMouseDown = useCallback((e) => {
    e.preventDefault();
    if (mode !== 'split' && mode !== 'chart') return;
    setDragging(true);
    document.body.classList.add('is-dragging');
    const ws = workspaceRef.current;
    const wsRect = ws.getBoundingClientRect();

    const onMove = (ev) => {
      const x = ev.clientX - wsRect.left;
      const total = wsRect.width;
      const chartPx = Math.max(280, Math.min(total - 340, x));
      const intelPx = total - chartPx;
      // convert to flex ratios (relative)
      const ratio = chartPx / intelPx;
      setChartFlex(ratio);
      setIntelFlex(1);
    };
    const onUp = () => {
      setDragging(false);
      document.body.classList.remove('is-dragging');
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  }, [mode]);

  // tweak mode wiring
  useEffect(() => {
    const onMsg = (e) => {
      if (e?.data?.type === '__activate_edit_mode') setTweaksOpen(true);
      if (e?.data?.type === '__deactivate_edit_mode') setTweaksOpen(false);
    };
    window.addEventListener('message', onMsg);
    try { window.parent.postMessage({ type: '__edit_mode_available' }, '*'); } catch (_) {}
    return () => window.removeEventListener('message', onMsg);
  }, []);

  const updateTweak = (key, val) => {
    setTweaks(t => {
      const next = { ...t, [key]: val };
      try { window.parent.postMessage({ type: '__edit_mode_set_keys', edits: { [key]: val } }, '*'); } catch (_) {}
      return next;
    });
  };

  const isAnalysis = mode === 'analysis';
  const isChartFocus = mode === 'chart';

  return (
    <div className="app" data-density={tweaks.density}>
      {/* ===== TOPBAR ===== */}
      <div className="topbar">
        <div className="brand">
          <div className="brand-mark">K</div>
          <div>
            <div className="brand-name">KILLZONE</div>
            <div className="brand-sub">Gold Intelligence</div>
          </div>
        </div>

        <div className="tkr">
          <span className="tkr-sym">XAU / USD</span>
          <span className="tkr-tf mono">1D</span>
          <span className="tkr-price mono">$4,831.40</span>
          <span className="tkr-chg bear mono">−0.26%</span>
        </div>

        <div className="tkr-score">
          <span className="lbl">SCORE</span>
          <span className="val mono">48</span>
          <span className="tag">LOW</span>
        </div>

        <div className="topbar-spacer" />

        <div className="topbar-meta">
          <span className="status-dot" />
          <span className="mono">LIVE · 10:34:12 UTC</span>
        </div>

        <div className="mode-toggle">
          <div className="mode-indicator" style={{ left: modeIndicator.left, width: modeIndicator.width }} />
          {Object.keys(MODES).map(k => (
            <button key={k}
                    ref={el => (modeBtnsRef.current[k] = el)}
                    className={`mode-btn ${mode === k ? 'active' : ''}`}
                    onClick={() => setMode(k)}>
              <ModeIcon mode={k} />
              {MODES[k].label}
            </button>
          ))}
        </div>
      </div>

      {/* ===== WORKSPACE ===== */}
      <div className="workspace" ref={workspaceRef}>
        <div className={`panel chart-panel ${isAnalysis ? 'rail' : ''}`}
             style={!isAnalysis ? { flex: `${chartFlex} 1 0`, minWidth: 280 } : undefined}>
          {isAnalysis ? <ChartRail onExpand={() => setMode('split')} /> : <Chart />}
        </div>

        <div className={`divider ${dragging ? 'dragging' : ''} ${isAnalysis ? 'disabled' : ''}`}
             onMouseDown={onDividerMouseDown}
             onDoubleClick={() => { setChartFlex(1); setIntelFlex(1); }}>
          <div className="divider-handle" />
        </div>

        <div className="panel intel-panel"
             style={{ flex: `${intelFlex} 1 0`, minWidth: 360 }}>
          <IntelPanel />
        </div>
      </div>

      {/* ===== TWEAKS ===== */}
      <div className={`tweaks ${tweaksOpen ? 'open' : ''}`}>
        <h4>
          <span>Tweaks</span>
          <span className="close" onClick={() => setTweaksOpen(false)}>✕</span>
        </h4>
        <div className="row">
          <div className="row-lbl">Accent</div>
          <div className="swatches">
            {Object.keys(ACCENTS).map(k => (
              <div key={k}
                   className={`sw ${tweaks.accent === k ? 'active' : ''}`}
                   style={{ background: ACCENTS[k]['--gold-bright'] }}
                   onClick={() => updateTweak('accent', k)} />
            ))}
          </div>
        </div>
        <div className="row">
          <div className="row-lbl">Density</div>
          <div className="seg">
            {['compact', 'comfortable', 'spacious'].map(d => (
              <button key={d}
                      className={tweaks.density === d ? 'active' : ''}
                      onClick={() => updateTweak('density', d)}>
                {d}
              </button>
            ))}
          </div>
        </div>
        <div className="row">
          <div className="row-lbl">Layout</div>
          <div className="seg">
            {Object.keys(MODES).map(k => (
              <button key={k}
                      className={mode === k ? 'active' : ''}
                      onClick={() => setMode(k)}>
                {k}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ======= CHART RAIL (collapsed state) =======
function ChartRail({ onExpand }) {
  return (
    <div className="rail" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div className="rail-header">
        <button className="rail-expand-btn" onClick={onExpand} title="Expand chart">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>
      <div className="rail-label">XAU / USD · CHART</div>
      <div className="rail-mini-chart">
        <RailMiniChart />
        <div className="rail-mini-price mono">$4,831.40</div>
      </div>
      <div className="rail-footer">
        <button className="rail-tool" title="1D"><span className="mono" style={{ fontSize: 10 }}>1D</span></button>
        <button className="rail-tool active" title="Candles">
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
            <rect x="3" y="4" width="3" height="8" fill="currentColor" />
            <line x1="4.5" y1="2" x2="4.5" y2="14" stroke="currentColor" strokeWidth="1" />
            <rect x="10" y="6" width="3" height="5" fill="currentColor" opacity="0.6" />
            <line x1="11.5" y1="3" x2="11.5" y2="13" stroke="currentColor" strokeWidth="1" />
          </svg>
        </button>
        <button className="rail-tool" title="Indicators">
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
            <path d="M2 12l4-4 3 3 5-7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>
    </div>
  );
}

window.App = App;

// mount
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
