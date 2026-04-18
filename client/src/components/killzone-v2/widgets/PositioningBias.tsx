import type { ReactNode } from "react";

export function PositioningBias({
  bias,
  score,
  title,
  body,
}: {
  bias: string;
  score: number;
  title: string;
  body: ReactNode;
}) {
  const markerPct = Math.min(100, Math.max(0, score));
  const biasClass = bias === "BULLISH" ? "bull" : bias === "BEARISH" ? "bear" : "neutral";

  return (
    <div className="w-card">
      <div className="w-head">
        <div className="title">Positioning Bias</div>
        <div className="meta">APPROACH · NOT A SIGNAL</div>
      </div>
      <div className="bias-head">
        <div className="bias-badge">
          <div style={{ textAlign: "center" }}>
            <div className="lbl">Bias</div>
            <div className={`val ${biasClass}`}>{bias}</div>
          </div>
        </div>
        <div className="bias-copy">
          <div className="bias-title">{title}</div>
          <div className="bias-body">{body}</div>
        </div>
      </div>

      <div className="bias-scale">
        <div className="bias-scale-track">
          <div className="bias-scale-marker" style={{ left: `${markerPct}%` }} />
        </div>
        <div className="bias-scale-labels">
          <span className="bear">STRUCTURAL SHORT</span>
          <span className="neu">NEUTRAL</span>
          <span className="bull">STRUCTURAL LONG</span>
        </div>
      </div>

      <div className="bias-principles">
        <div className="bias-principle">
          <div className="ic">
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
              <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.3" />
              <path d="M8 5v3.5l2 1.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
            </svg>
          </div>
          <div>
            <div className="t">Patience</div>
            <div className="c">Wait for score &gt; 65 or &lt; 35 before committing capital.</div>
          </div>
        </div>
        <div className="bias-principle">
          <div className="ic">
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
              <path
                d="M3 13l4-4 3 3 5-7"
                stroke="currentColor"
                strokeWidth="1.3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M10 5h3v3"
                stroke="currentColor"
                strokeWidth="1.3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <div>
            <div className="t">Asymmetry</div>
            <div className="c">Only deploy when invalidation is clearly defined &amp; tight.</div>
          </div>
        </div>
        <div className="bias-principle">
          <div className="ic">
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
              <rect x="3" y="3" width="10" height="10" rx="1" stroke="currentColor" strokeWidth="1.3" />
              <path d="M3 8h10M8 3v10" stroke="currentColor" strokeWidth="1.3" />
            </svg>
          </div>
          <div>
            <div className="t">Confluence</div>
            <div className="c">Require ≥3 aligned factors before overriding neutrality.</div>
          </div>
        </div>
        <div className="bias-principle">
          <div className="ic">
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
              <path
                d="M2 8a6 6 0 0 1 12 0v2l-2-1-2 1-2-1-2 1-2-1-2 1V8z"
                stroke="currentColor"
                strokeWidth="1.3"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <div>
            <div className="t">Humility</div>
            <div className="c">Size down when narrative is unresolved, not the opposite.</div>
          </div>
        </div>
      </div>
    </div>
  );
}
