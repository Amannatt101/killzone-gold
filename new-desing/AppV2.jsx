/* AppV2.jsx — Intelligence Dashboard shell (chart-less) */

const { useState, useRef, useEffect } = React;

const TWEAK_DEFAULTS_V2 = /*EDITMODE-BEGIN*/{
  "accent": "gold",
  "density": "comfortable"
}/*EDITMODE-END*/;

const V2_ACCENTS = {
  gold:  { '--gold': '#d4a24c', '--gold-bright': '#e8b85a', '--gold-deep': '#a07a2f', '--gold-dim': 'rgba(212,162,76,0.14)', '--gold-glow': 'rgba(212,162,76,0.35)' },
  amber: { '--gold': '#e89a3a', '--gold-bright': '#ffb347', '--gold-deep': '#b06a1a', '--gold-dim': 'rgba(232,154,58,0.14)', '--gold-glow': 'rgba(232,154,58,0.35)' },
  copper:{ '--gold': '#c67a4e', '--gold-bright': '#e69366', '--gold-deep': '#8a4a25', '--gold-dim': 'rgba(198,122,78,0.14)', '--gold-glow': 'rgba(198,122,78,0.35)' },
  ivory: { '--gold': '#d7c9a8', '--gold-bright': '#f2e3c0', '--gold-deep': '#8a7c5a', '--gold-dim': 'rgba(215,201,168,0.12)', '--gold-glow': 'rgba(215,201,168,0.3)' },
};

function AppV2() {
  const [tweaks, setTweaks] = useState(TWEAK_DEFAULTS_V2);
  const [tweaksOpen, setTweaksOpen] = useState(false);

  useEffect(() => {
    const root = document.documentElement;
    const vars = V2_ACCENTS[tweaks.accent] || V2_ACCENTS.gold;
    Object.entries(vars).forEach(([k, v]) => root.style.setProperty(k, v));
  }, [tweaks.accent]);

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

  return (
    <div className="app">
      {/* TOPBAR */}
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
          <span className="tag">NEUTRAL · LOW</span>
        </div>

        <div className="topbar-spacer" />

        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 10px', border: '1px solid var(--line-1)', borderRadius: 4, background: 'var(--bg-2)' }}>
            <span style={{ fontSize: 9, letterSpacing: '0.18em', color: 'var(--text-3)', textTransform: 'uppercase' }}>Regime</span>
            <span style={{ fontSize: 11, color: 'var(--gold-bright)', fontWeight: 600, letterSpacing: '0.04em' }}>RANGE</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 10px', border: '1px solid var(--line-1)', borderRadius: 4, background: 'var(--bg-2)' }}>
            <span style={{ fontSize: 9, letterSpacing: '0.18em', color: 'var(--text-3)', textTransform: 'uppercase' }}>Bias</span>
            <span style={{ fontSize: 11, color: 'var(--warn)', fontWeight: 600, letterSpacing: '0.04em' }}>NEUTRAL</span>
          </div>
          <div className="topbar-meta">
            <span className="status-dot" />
            <span className="mono" style={{ fontSize: 11, color: 'var(--text-3)' }}>LIVE · 10:34:12 UTC</span>
          </div>
        </div>
      </div>

      {/* WORKSPACE */}
      <div className="v2-workspace">
        <div className="v2-main">
          <div className="v2-scroll">
            <div className="v2-inner">
              <Battlefield />
              <MarketNarrative />
              <ScoreHistory />
              <Invalidation />
            </div>
          </div>
        </div>
        <div className="v2-right">
          <div className="v2-scroll">
            <div className="v2-inner">
              <MarketRegime />
              <PositioningBias />
              <KillzoneTiming />

              {/* footer */}
              <div style={{ marginTop: 8, padding: '14px 4px 0', borderTop: '1px solid var(--line-1)', display: 'flex', justifyContent: 'space-between', fontFamily: 'Geist Mono, monospace', fontSize: 10, color: 'var(--text-3)', letterSpacing: '0.04em' }}>
                <span>DATA · REUTERS · CME · ICE · FRED · GPR</span>
                <span>NEXT UPDATE · 00:48</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* TWEAKS */}
      <div className={`tweaks ${tweaksOpen ? 'open' : ''}`}>
        <h4>
          <span>Tweaks</span>
          <span className="close" onClick={() => setTweaksOpen(false)}>✕</span>
        </h4>
        <div className="row">
          <div className="row-lbl">Accent</div>
          <div className="swatches">
            {Object.keys(V2_ACCENTS).map(k => (
              <div key={k}
                   className={`sw ${tweaks.accent === k ? 'active' : ''}`}
                   style={{ background: V2_ACCENTS[k]['--gold-bright'] }}
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
      </div>
    </div>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<AppV2 />);
