import { useEffect, useId, useMemo, useState, type CSSProperties } from "react";
import { formatGmtPlus1Time, GMT_PLUS_ONE_LABEL } from "@/lib/timezone";
import type { DominanceModesInput, DominanceModels } from "./dominance-models";
import { splitRegimeFlag } from "./dominance-models";
import {
  buildRadarVertices,
  labelAnchor,
  polygonPoints,
  radarConviction,
  vertexToPoint,
  type RadarCurrent,
  type RadarVertex,
} from "./radar-utils";
import { scoreLabel } from "./score-utils";

const VERTEX_COLOR = {
  bull: "#8fc89a",
  bear: "#dc8a8e",
  neutral: "#b6b1a4",
};

function sideTone(side: RadarVertex["side"]): string {
  if (side === "bull") return "Supporting gold";
  if (side === "bear") return "Opposing gold";
  return "Balanced / neutral";
}

/** Label offset tuned per compass so text sits outside the ring and never stacks on the polygon. */
function labelTextOffsets(angleDeg: number): { nameDy: number; valueDy: number; anchor: "start" | "middle" | "end" } {
  const a = ((angleDeg % 360) + 360) % 360;
  if (a < 20 || a > 340) return { nameDy: -10, valueDy: 2, anchor: "middle" }; // N
  if (a < 70) return { nameDy: -8, valueDy: 4, anchor: "start" }; // NE
  if (a < 110) return { nameDy: -6, valueDy: 6, anchor: "start" }; // E
  if (a < 160) return { nameDy: 4, valueDy: 16, anchor: "start" }; // SE
  if (a < 200) return { nameDy: 8, valueDy: 20, anchor: "middle" }; // S
  if (a < 250) return { nameDy: 4, valueDy: 16, anchor: "end" }; // SW
  if (a < 290) return { nameDy: -6, valueDy: 6, anchor: "end" }; // W
  return { nameDy: -8, valueDy: 4, anchor: "end" }; // NW
}

export function GoldRadar({
  score,
  models,
  dominanceModes,
  current,
  macroLastFetched,
}: {
  score: number;
  models: DominanceModels;
  dominanceModes?: DominanceModesInput;
  current?: RadarCurrent;
  macroLastFetched?: string;
}) {
  const uid = useId().replace(/:/g, "");
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [pinnedId, setPinnedId] = useState<string | null>(null);

  const vertices = useMemo(
    () =>
      buildRadarVertices(
        models.macro,
        models.intraday,
        models.intraday4h,
        dominanceModes?.macro?.components,
        dominanceModes?.intraday?.components,
        dominanceModes?.intraday4h?.components,
        current,
      ),
    [models, dominanceModes, current],
  );

  const poly = useMemo(() => polygonPoints(vertices), [vertices]);
  const activeId = pinnedId ?? hoveredId;
  const active = vertices.find((v) => v.id === activeId) ?? null;

  const split = splitRegimeFlag(models.macro, models.intraday);
  const intra = models.intraday;
  const bullPct = intra.bullPct;
  const bearPct = intra.bearPct;
  const edge = intra.edge;
  const conviction = radarConviction(models.macro, intra, split);
  const biasWord = scoreLabel(score).split(" ")[0];

  const timeLabel = macroLastFetched
    ? `${formatGmtPlus1Time(macroLastFetched, { hour: "2-digit", minute: "2-digit" })} ${GMT_PLUS_ONE_LABEL}`
    : GMT_PLUS_ONE_LABEL;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setPinnedId(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const togglePin = (id: string) => {
    setPinnedId((prev) => (prev === id ? null : id));
  };

  return (
    <div
      className="radar-card"
      style={
        {
          "--radar-macro": models.macro.bullPct / 100,
          "--radar-intra": models.intraday.bearPct / 100,
        } as CSSProperties
      }
    >
      <div className="radar-head">
        <span className="card-eyebrow">
          <span className="radar-live-pip" aria-hidden />
          GOLD PRESSURE RADAR · LIVE
        </span>
        <span className="card-meta">8-FACTOR SYNTHESIS · {timeLabel}</span>
      </div>

      <div className="radar-stage">
        <div className="radar-stage-bg" aria-hidden>
          <div className="radar-stage-grid" />
          <div className="radar-stage-glow radar-stage-glow--bull" />
          <div className="radar-stage-glow radar-stage-glow--bear" />
          <div className="radar-stage-vignette" />
        </div>

        <div className="radar-svg-wrap">
          <div className={`radar-visual${active ? " is-focus" : ""}`}>
            <svg
              className="radar-svg"
              viewBox="-300 -300 600 600"
              preserveAspectRatio="xMidYMid meet"
              aria-label="Gold pressure radar"
            >
              <defs>
                <radialGradient id={`${uid}-rGlow`} cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#d4af57" stopOpacity="0.28" />
                  <stop offset="60%" stopColor="#d4af57" stopOpacity="0.06" />
                  <stop offset="100%" stopColor="#d4af57" stopOpacity="0" />
                </radialGradient>
                <radialGradient id={`${uid}-rBull`} cx="50%" cy="0%" r="85%">
                  <stop offset="0%" stopColor="#6ca678" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#6ca678" stopOpacity="0" />
                </radialGradient>
                <radialGradient id={`${uid}-rBear`} cx="50%" cy="100%" r="85%">
                  <stop offset="0%" stopColor="#c66a6f" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#c66a6f" stopOpacity="0" />
                </radialGradient>
                <linearGradient id={`${uid}-bullArc`} x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#6ca678" stopOpacity="0.05" />
                  <stop offset="50%" stopColor="#8fc89a" stopOpacity="1" />
                  <stop offset="100%" stopColor="#6ca678" stopOpacity="0.05" />
                </linearGradient>
                <linearGradient id={`${uid}-bearArc`} x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#c66a6f" stopOpacity="0.05" />
                  <stop offset="50%" stopColor="#dc8a8e" stopOpacity="1" />
                  <stop offset="100%" stopColor="#c66a6f" stopOpacity="0.05" />
                </linearGradient>
                <linearGradient id={`${uid}-polyFill`} x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#8fc89a" stopOpacity="0.1" />
                  <stop offset="50%" stopColor="#d4af57" stopOpacity="0.16" />
                  <stop offset="100%" stopColor="#dc8a8e" stopOpacity="0.1" />
                </linearGradient>
                <filter id={`${uid}-glow`} x="-40%" y="-40%" width="180%" height="180%">
                  <feGaussianBlur stdDeviation="2" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>

              <circle cx="0" cy="-30" r="270" fill={`url(#${uid}-rBull)`} />
              <circle cx="0" cy="30" r="270" fill={`url(#${uid}-rBear)`} />

              {[255, 210, 165, 120, 90].map((r, i) => (
                <circle
                  key={r}
                  cx="0"
                  cy="0"
                  r={r}
                  fill={i === 3 ? `url(#${uid}-rGlow)` : "none"}
                  stroke={
                    i === 4
                      ? "rgba(212,175,87,0.32)"
                      : i === 2
                        ? "rgba(255,255,255,0.07)"
                        : "rgba(255,255,255,0.045)"
                  }
                  strokeWidth={i === 4 ? 1.4 : 1}
                  strokeDasharray={i === 2 ? "3 5" : undefined}
                  className={i === 4 ? "radar-ring-pulse" : undefined}
                />
              ))}

              <g stroke="rgba(255,255,255,0.06)" strokeWidth="1">
                <line x1="0" y1="-255" x2="0" y2="255" />
                <line x1="-255" y1="0" x2="255" y2="0" />
                <line x1="-180" y1="-180" x2="180" y2="180" />
                <line x1="-180" y1="180" x2="180" y2="-180" />
              </g>

              <path
                d="M -235 0 A 235 235 0 0 1 235 0"
                fill="none"
                stroke={`url(#${uid}-bullArc)`}
                strokeWidth="2.4"
                strokeLinecap="square"
                opacity={models.macro.bullPct / 100}
              />
              <path
                d="M 235 0 A 235 235 0 0 1 -235 0"
                fill="none"
                stroke={`url(#${uid}-bearArc)`}
                strokeWidth="2.4"
                strokeLinecap="square"
                opacity={models.intraday.bearPct / 100}
              />

              <circle
                className="radar-sweep"
                cx="0"
                cy="0"
                r="248"
                fill="none"
                stroke="rgba(212,175,87,0.16)"
                strokeWidth="1.2"
                strokeDasharray="34 1500"
              >
                <animateTransform
                  attributeName="transform"
                  type="rotate"
                  from="0 0 0"
                  to="360 0 0"
                  dur="12s"
                  repeatCount="indefinite"
                />
              </circle>

              {/* Hemisphere labels in corners — away from factor labels */}
              <text x="-275" y="-275" fill="#6ca678" fontSize="9" letterSpacing="2.2" opacity="0.8">
                ↑ BULL HEMISPHERE · MACRO
              </text>
              <text
                x="275"
                y="285"
                textAnchor="end"
                fill="#c66a6f"
                fontSize="9"
                letterSpacing="2.2"
                opacity="0.8"
              >
                INTRADAY · BEAR HEMISPHERE ↓
              </text>

              <polygon
                className="radar-polygon radar-polygon--fill"
                points={poly}
                fill={`url(#${uid}-polyFill)`}
                stroke="none"
                filter={`url(#${uid}-glow)`}
              />
              <polygon
                className="radar-polygon radar-polygon--stroke"
                points={poly}
                fill="none"
                stroke="#e8c878"
                strokeWidth="1.8"
                strokeLinejoin="miter"
                strokeMiterlimit="8"
              />

              {vertices.map((v, idx) => {
                const p = vertexToPoint(v.normalized, v.angleDeg);
                const lbl = labelAnchor(v.angleDeg, 262);
                const color = VERTEX_COLOR[v.side];
                const isHot = activeId === v.id;
                const isPinned = pinnedId === v.id;
                const { nameDy, valueDy, anchor } = labelTextOffsets(v.angleDeg);

                return (
                  <g
                    key={v.id}
                    className={`radar-spoke${isHot ? " is-hot" : ""}${isPinned ? " is-pinned" : ""}`}
                    onMouseEnter={() => setHoveredId(v.id)}
                    onMouseLeave={() => setHoveredId(null)}
                    onFocus={() => setHoveredId(v.id)}
                    onBlur={() => setHoveredId(null)}
                    onClick={() => togglePin(v.id)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        togglePin(v.id);
                      }
                    }}
                    tabIndex={0}
                    role="button"
                    aria-pressed={isPinned}
                    aria-label={`${v.label} ${v.sublabel}. ${v.detail}`}
                  >
                    {/* Hit only the node — keeps the graph free */}
                    <circle cx={p.x} cy={p.y} r="16" fill="transparent" className="radar-spoke-hit" />

                    <circle cx={p.x} cy={p.y} r={isHot ? 7 : 5} fill={color} opacity={isHot ? 0.3 : 0.16}>
                      <animate
                        attributeName="r"
                        values={isHot ? "6;8;6" : "4.5;6;4.5"}
                        dur={`${2.3 + (idx % 4) * 0.28}s`}
                        repeatCount="indefinite"
                      />
                    </circle>
                    <circle cx={p.x} cy={p.y} r={isHot ? 3.8 : 3} fill={color} />
                    {isPinned ? (
                      <circle cx={p.x} cy={p.y} r="9" fill="none" stroke={color} strokeWidth="1" opacity="0.7" />
                    ) : null}

                    <text
                      className="radar-spoke-name"
                      x={lbl.x}
                      y={lbl.y + nameDy}
                      textAnchor={anchor}
                      fill={isHot ? "#ece8db" : "#b6b1a4"}
                      fontSize="9.5"
                      letterSpacing="1.2"
                      fontWeight="500"
                    >
                      {v.label}
                    </text>
                    <text
                      className="radar-spoke-val"
                      x={lbl.x}
                      y={lbl.y + valueDy}
                      textAnchor={anchor}
                      fill={color}
                      fontSize="9"
                      fontWeight="600"
                    >
                      {v.sublabel}
                    </text>
                  </g>
                );
              })}

              <circle cx="0" cy="0" r="72" fill="#080a0e" stroke="rgba(212,175,87,0.48)" strokeWidth="1.2" />
              <circle
                className="radar-hub-ring"
                cx="0"
                cy="0"
                r="82"
                fill="none"
                stroke="rgba(212,175,87,0.2)"
                strokeWidth="1"
              />
              <text x="0" y="-30" textAnchor="middle" fill="#6b6e75" fontSize="8" letterSpacing="2.5">
                SCORE
              </text>
              <text
                x="0"
                y="14"
                textAnchor="middle"
                fill="#ece8db"
                fontSize="42"
                fontWeight="600"
                letterSpacing="-2"
              >
                {Math.round(score)}
              </text>
              <text x="0" y="40" textAnchor="middle" fill="#ecc878" fontSize="9" letterSpacing="2.5">
                {biasWord}
              </text>
              {split ? (
                <text x="0" y="56" textAnchor="middle" fill="#c9a24b" fontSize="7" letterSpacing="1.5">
                  SPLIT
                </text>
              ) : null}
            </svg>
          </div>
        </div>
      </div>

      {/* Detail lives OUTSIDE the chart — never overlays the spider */}
      <div
        className={`radar-inspect${active ? ` is-active radar-inspect--${active.side}` : ""}${pinnedId ? " is-pinned" : ""}`}
        aria-live="polite"
      >
        {active ? (
          <>
            <div className="radar-inspect-main">
              <span className="radar-inspect-k">{active.label}</span>
              <span className="radar-inspect-v mono">{active.sublabel}</span>
              <span className="radar-inspect-tone">{sideTone(active.side)}</span>
            </div>
            <p className="radar-inspect-detail">{active.detail}</p>
            {pinnedId ? (
              <button
                type="button"
                className="radar-inspect-clear"
                onClick={() => setPinnedId(null)}
                aria-label="Unpin factor"
              >
                Unpin
              </button>
            ) : (
              <span className="radar-inspect-hint">Click node to pin</span>
            )}
          </>
        ) : (
          <span className="radar-inspect-idle">Hover a factor node · click to pin detail here</span>
        )}
      </div>

      <div className="radar-foot">
        <div className="cell">
          <span className="k">SUPPORT</span>
          <span className="v green">{bullPct.toFixed(1)}%</span>
        </div>
        <div className="cell">
          <span className="k">OPPOSE</span>
          <span className="v red">{bearPct.toFixed(1)}%</span>
        </div>
        <div className="cell">
          <span className="k">NET EDGE</span>
          <span className={`v ${edge >= 0 ? "green" : "red"}`}>
            {edge > 0 ? "+" : ""}
            {edge.toFixed(1)}
          </span>
        </div>
        <div className="cell">
          <span className="k">CONVICTION</span>
          <span className="v gold">{conviction}</span>
        </div>
      </div>
    </div>
  );
}
