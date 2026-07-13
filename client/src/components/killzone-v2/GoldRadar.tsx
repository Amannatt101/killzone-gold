import { useId, useMemo, type CSSProperties } from "react";
import { formatGmtPlus1Time, GMT_PLUS_ONE_LABEL } from "@/lib/timezone";
import type { DominanceModesInput, DominanceModels } from "./dominance-models";
import { splitRegimeFlag } from "./dominance-models";
import {
  buildRadarVertices,
  polygonPoints,
  radarConviction,
  vertexToPoint,
  type RadarCurrent,
} from "./radar-utils";
import { scoreLabel } from "./score-utils";

const VERTEX_COLOR = {
  bull: "#8fc89a",
  bear: "#dc8a8e",
  neutral: "#b6b1a4",
};

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

  const poly = polygonPoints(vertices);
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
        <span className="card-meta">8-FACTOR · {timeLabel}</span>
      </div>

      <div className="radar-stage">
        <div className="radar-stage-bg" aria-hidden>
          <div className="radar-stage-grid" />
          <div className="radar-stage-glow radar-stage-glow--bull" />
          <div className="radar-stage-glow radar-stage-glow--bear" />
          <div className="radar-stage-vignette" />
        </div>

        <div className="radar-svg-wrap">
          <svg
            className="radar-svg"
            viewBox="-300 -300 600 600"
            preserveAspectRatio="xMidYMid meet"
            aria-label="Gold pressure radar"
          >
            <defs>
              <radialGradient id={`${uid}-rGlow`} cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#d4af57" stopOpacity="0.35" />
                <stop offset="55%" stopColor="#d4af57" stopOpacity="0.08" />
                <stop offset="100%" stopColor="#d4af57" stopOpacity="0" />
              </radialGradient>
              <radialGradient id={`${uid}-rBull`} cx="50%" cy="0%" r="85%">
                <stop offset="0%" stopColor="#6ca678" stopOpacity="0.45" />
                <stop offset="100%" stopColor="#6ca678" stopOpacity="0" />
              </radialGradient>
              <radialGradient id={`${uid}-rBear`} cx="50%" cy="100%" r="85%">
                <stop offset="0%" stopColor="#c66a6f" stopOpacity="0.45" />
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
                <stop offset="0%" stopColor="#8fc89a" stopOpacity="0.12" />
                <stop offset="50%" stopColor="#d4af57" stopOpacity="0.18" />
                <stop offset="100%" stopColor="#dc8a8e" stopOpacity="0.12" />
              </linearGradient>
              <filter id={`${uid}-glow`} x="-40%" y="-40%" width="180%" height="180%">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            <circle cx="0" cy="-40" r="270" fill={`url(#${uid}-rBull)`} />
            <circle cx="0" cy="40" r="270" fill={`url(#${uid}-rBear)`} />

            {[260, 220, 180, 140, 100].map((r, i) => (
              <circle
                key={r}
                cx="0"
                cy="0"
                r={r}
                fill={i === 3 ? `url(#${uid}-rGlow)` : "none"}
                stroke={
                  i === 4
                    ? "rgba(212,175,87,0.35)"
                    : i === 2
                      ? "rgba(255,255,255,0.07)"
                      : "rgba(255,255,255,0.04)"
                }
                strokeWidth={i === 4 ? 1.5 : 1}
                strokeDasharray={i === 2 ? "3 5" : undefined}
                className={i === 4 ? "radar-ring-pulse" : undefined}
              />
            ))}

            <g stroke="rgba(255,255,255,0.06)" strokeWidth="1">
              <line x1="0" y1="-260" x2="0" y2="260" />
              <line x1="-260" y1="0" x2="260" y2="0" />
              <line x1="-184" y1="-184" x2="184" y2="184" />
              <line x1="-184" y1="184" x2="184" y2="-184" />
            </g>

            <path
              className="radar-arc-macro"
              d="M -240 0 A 240 240 0 0 1 240 0"
              fill="none"
              stroke={`url(#${uid}-bullArc)`}
              strokeWidth="2.5"
              strokeLinecap="round"
              opacity={models.macro.bullPct / 100}
            />
            <path
              className="radar-arc-intra"
              d="M 240 0 A 240 240 0 0 1 -240 0"
              fill="none"
              stroke={`url(#${uid}-bearArc)`}
              strokeWidth="2.5"
              strokeLinecap="round"
              opacity={models.intraday.bearPct / 100}
            />

            <circle
              className="radar-sweep"
              cx="0"
              cy="0"
              r="255"
              fill="none"
              stroke="rgba(212,175,87,0.12)"
              strokeWidth="1"
              strokeDasharray="40 1200"
            >
              <animateTransform
                attributeName="transform"
                type="rotate"
                from="0 0 0"
                to="360 0 0"
                dur="14s"
                repeatCount="indefinite"
              />
            </circle>

            <text x="-268" y="-268" fill="#6ca678" fontSize="9" letterSpacing="2.5" opacity="0.9">
              ↑ BULL · MACRO
            </text>
            <text
              x="268"
              y="278"
              textAnchor="end"
              fill="#c66a6f"
              fontSize="9"
              letterSpacing="2.5"
              opacity="0.9"
            >
              INTRADAY · BEAR ↓
            </text>

            <polygon
              className="radar-polygon"
              points={poly}
              fill={`url(#${uid}-polyFill)`}
              stroke="#d4af57"
              strokeWidth="1.5"
              strokeLinejoin="round"
              filter={`url(#${uid}-glow)`}
            />

            {vertices.map((v) => {
              const p = vertexToPoint(v.normalized, v.angleDeg);
              const labelOffset = vertexToPoint(v.normalized + 0.1, v.angleDeg, 118, 268);
              const color = VERTEX_COLOR[v.side];
              return (
                <g key={v.id} className="radar-vertex">
                  <circle cx={p.x} cy={p.y} r="5" fill={color} opacity="0.25" />
                  <circle cx={p.x} cy={p.y} r="3" fill={color} />
                  <text
                    x={labelOffset.x}
                    y={labelOffset.y - 7}
                    textAnchor="middle"
                    fill="#9a9689"
                    fontSize="9"
                    letterSpacing="1.2"
                  >
                    {v.label}
                  </text>
                  <text
                    x={labelOffset.x}
                    y={labelOffset.y + 5}
                    textAnchor="middle"
                    fill={color}
                    fontSize="8.5"
                    fontWeight="500"
                  >
                    {v.sublabel}
                  </text>
                </g>
              );
            })}

            <circle cx="0" cy="0" r="78" fill="#080a0e" stroke="rgba(212,175,87,0.5)" strokeWidth="1.2" />
            <circle className="radar-hub-ring" cx="0" cy="0" r="88" fill="none" stroke="rgba(212,175,87,0.22)" strokeWidth="1">
              <animate
                attributeName="stroke-opacity"
                values="0.22;0.55;0.22"
                dur="3.5s"
                repeatCount="indefinite"
              />
            </circle>
            <text x="0" y="-34" textAnchor="middle" fill="#6b6e75" fontSize="8" letterSpacing="2.5">
              SCORE
            </text>
            <text
              x="0"
              y="16"
              textAnchor="middle"
              fill="#ece8db"
              fontSize="42"
              fontWeight="600"
              letterSpacing="-2"
            >
              {Math.round(score)}
            </text>
            <text x="0" y="44" textAnchor="middle" fill="#ecc878" fontSize="9" letterSpacing="2.5">
              {biasWord}
            </text>
          </svg>
        </div>
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
