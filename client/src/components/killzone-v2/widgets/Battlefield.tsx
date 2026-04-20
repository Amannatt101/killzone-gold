import { useEffect, useMemo, useState } from "react";
import {
  buildDominanceFromComponents,
  type DominanceForce,
  type DominanceResult,
} from "../score-utils";

export function Battlefield({
  score,
  dominance,
}: {
  score?: number;
  dominance?: DominanceResult;
}) {
  function normalizeForceName(name: string): string {
    return name.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
  }

  function forceExplanation(name: string, side: "bull" | "bear"): string {
    const n = normalizeForceName(name);

    if (n.includes("geopolitical") || n.includes("gpr")) {
      return "GPR tracks geopolitical stress. Rising readings usually strengthen safe-haven demand for gold, while easing risk can fade that support.";
    }
    if (n.includes("central bank")) {
      return "Central bank buying removes physical supply from the market. Stronger accumulation tends to support price floors over time.";
    }
    if (n.includes("etf")) {
      return "ETF flows reflect investment appetite for gold exposure. Net inflows suggest fresh demand, while outflows often signal weaker conviction.";
    }
    if (n.includes("dollar")) {
      return "Gold often trades inversely to the U.S. dollar. A softer dollar can make gold relatively cheaper globally, while dollar strength can pressure it.";
    }
    if (n.includes("real yield")) {
      return "Real yields are a key opportunity-cost signal for gold. Rising real yields typically pressure non-yielding assets, while falling yields are supportive.";
    }
    if (n.includes("risk on") || n.includes("risk sentiment")) {
      return "Risk-on conditions shift capital toward growth and cyclical assets. That rotation can reduce defensive allocation into gold.";
    }
    if (n.includes("inflation")) {
      return "Inflation direction shapes rate expectations and hedging demand. Cooling inflation can ease urgency for defensive gold positioning.";
    }
    if (n.includes("momentum")) {
      return "Momentum captures trend persistence in price behavior. Weakening momentum often reduces follow-through buying and can limit upside extension.";
    }

    return side === "bull"
      ? "This factor is currently adding to supportive flow for gold, helping reinforce the broader bullish side of the balance."
      : "This factor is currently contributing to pressure on gold, adding weight to the opposing side of the balance.";
  }

  function clamp(n: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, n));
  }

  const model = dominance ?? buildDominanceFromComponents({ score });
  const totalFlow = Math.max(1, model.bullSum + model.bearSum);
  const bullPctExact = (model.bullSum / totalFlow) * 100;
  const bearPctExact = 100 - bullPctExact;
  const realBullPct = Number(bullPctExact.toFixed(1));
  const realBearPct = Number(bearPctExact.toFixed(1));
  const bullSum = model.bullSum;
  const bearSum = model.bearSum;
  const realEdge = Number((bullPctExact - bearPctExact).toFixed(1));
  const [displayBullPct, setDisplayBullPct] = useState(realBullPct);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    setDisplayBullPct(realBullPct);
  }, [realBullPct]);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReducedMotion(media.matches);
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    if (reducedMotion) return;
    let active = true;
    let timer: ReturnType<typeof setTimeout> | null = null;

    const tick = () => {
      if (!active) return;
      setDisplayBullPct((prev) => {
        const baseline = realBullPct;
        const envelope = 0.8;
        const pull = (baseline - prev) * 0.25;
        const randomStep = (Math.random() * 0.3 + 0.1) * (Math.random() < 0.5 ? -1 : 1);
        const next = clamp(prev + pull + randomStep, baseline - envelope, baseline + envelope);
        return Number(clamp(next, 0, 100).toFixed(1));
      });

      const nextMs = 3000 + Math.floor(Math.random() * 2000); // 3-5 sec cadence
      timer = setTimeout(tick, nextMs);
    };

    timer = setTimeout(tick, 3200);
    return () => {
      active = false;
      if (timer) clearTimeout(timer);
    };
  }, [realBullPct, reducedMotion]);

  const bullPct = useMemo(
    () => (reducedMotion ? realBullPct : Number(displayBullPct.toFixed(1))),
    [displayBullPct, realBullPct, reducedMotion],
  );
  const bearPct = Number((100 - bullPct).toFixed(1));
  const edge = Number((bullPct - bearPct).toFixed(1));
  const leaning = edge > 0 ? "bull" : edge < 0 ? "bear" : "neutral";
  const magnitude = model.magnitude;
  const BULL_FORCES: DominanceForce[] = model.bullForces;
  const BEAR_FORCES: DominanceForce[] = model.bearForces;
  const leaningLabel =
    leaning === "bull" ? "LEANING BULLISH" : leaning === "bear" ? "LEANING BEARISH" : "BALANCED";
  const motionStrength = Math.max(0.28, Math.min(1, 1 - Math.min(Math.abs(edge), 30) / 30));

  return (
    <div className="w-card accent">
      <div className="w-head">
        <div className="title">Bull vs Bear · Dominance</div>
        <div className="meta">WEIGHTED BY INSTITUTIONAL FLOW</div>
      </div>

      <div className="bf-hero" style={{ ["--bf-motion" as string]: motionStrength }}>
        <div className="bf-hero-top">
          <div className="bf-hero-side bull">
            <div className="bf-hero-lbl">Supporting Gold</div>
            <div className="bf-hero-pct mono">{bullPct.toFixed(1)}%</div>
          </div>
          <div className={`bf-hero-verdict ${leaning} bf-live-verdict`}>
            <div className="bf-hero-verdict-arrow">
              {leaning === "bull" && (
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M5 12h14M13 6l6 6-6 6"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              )}
              {leaning === "bear" && (
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M19 12H5M11 6l-6 6 6 6"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              )}
              {leaning === "neutral" && (
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                  <path d="M4 9h16M4 15h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              )}
            </div>
            <div className="bf-hero-verdict-text">
              <div className="bf-hero-verdict-lbl">{leaningLabel}</div>
              <div className="bf-hero-verdict-edge mono">
                {edge > 0 ? "+" : ""}
                {edge.toFixed(1)} pt edge · {magnitude}
              </div>
            </div>
          </div>
          <div className="bf-hero-side bear">
            <div className="bf-hero-lbl">Opposing Gold</div>
            <div className="bf-hero-pct mono">{bearPct.toFixed(1)}%</div>
          </div>
        </div>

        <div className="bf-hero-bar">
          <div className="bull bf-live-fill" style={{ width: `${bullPct}%` }}>
            <span className="bf-hero-bar-lbl">{bullPct.toFixed(1)}%</span>
          </div>
          <div className="bear bf-live-fill" style={{ width: `${bearPct}%` }}>
            <span className="bf-hero-bar-lbl">{bearPct.toFixed(1)}%</span>
          </div>
          <div className="bf-hero-bar-center" />
          <div className="bf-hero-bar-marker bf-live-marker" style={{ left: `${bullPct}%` }}>
            <div className="bf-hero-bar-marker-dot bf-live-dot" />
          </div>
        </div>

        <div className="bf-hero-verdict-copy bf-live-copy">
          Bulls hold a <span className="em">{edge.toFixed(1)}-point edge</span> — a{" "}
          <span className="em">{magnitude.toLowerCase()} lean</span>{" "}
          {leaning === "bull"
            ? "toward support"
            : leaning === "bear"
              ? "toward pressure"
              : "with no clear winner"}
          . Spread is thin enough that a single yield print could flip dominance.
        </div>
      </div>

      <div className="battlefield-grid">
        <div className="bf-side bull">
          <div className="bf-head">
            <div className="bf-label bull">Supporting Forces</div>
            <div className="bf-dom bull mono">+{bullSum.toFixed(2)}</div>
          </div>
          <div className="bf-forces">
            {BULL_FORCES.map((f, i) => (
              <div key={i} className={`bf-force ${f.strong ? "strong" : ""}`}>
                <div className="bf-force-main">
                  <div className="bf-force-name">{f.name}</div>
                  <div className="bf-force-desc">{forceExplanation(f.name, "bull")}</div>
                </div>
                <div className="bf-force-wt bull">+{f.weight.toFixed(3)}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="bf-side bear">
          <div className="bf-head">
            <div className="bf-label bear">Opposing Forces</div>
            <div className="bf-dom bear mono">−{bearSum.toFixed(2)}</div>
          </div>
          <div className="bf-forces">
            {BEAR_FORCES.map((f, i) => (
              <div key={i} className={`bf-force ${f.strong ? "strong" : ""}`}>
                <div className="bf-force-main">
                  <div className="bf-force-name">{f.name}</div>
                  <div className="bf-force-desc">{forceExplanation(f.name, "bear")}</div>
                </div>
                <div className="bf-force-wt bear">−{f.weight.toFixed(3)}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
