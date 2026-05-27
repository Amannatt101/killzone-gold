import { useId, useMemo } from "react";
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
  scoreTag: string;
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

  const timeLabel = macroLastFetched
    ? `${formatGmtPlus1Time(macroLastFetched, { hour: "2-digit", minute: "2-digit" })} ${GMT_PLUS_ONE_LABEL}`
    : GMT_PLUS_ONE_LABEL;

  return (
    <div className="radar-card">
      <div className="radar-head">
        <span className="card-eyebrow">GOLD PRESSURE RADAR · LIVE</span>
        <span className="card-meta">8-FACTOR SYNTHESIS · {timeLabel}</span>
      </div>

      <div className="radar-svg-wrap">
        <svg
          viewBox="-300 -300 600 600"
          style={{ width: "92%", height: "92%", maxWidth: 640, maxHeight: 640 }}
          aria-label="Gold pressure radar"
        >
          <defs>
            <radialGradient id={`${uid}-rGlow`} cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#d4af57" stopOpacity="0.25" />
              <stop offset="60%" stopColor="#d4af57" stopOpacity="0.05" />
              <stop offset="100%" stopColor="#d4af57" stopOpacity="0" />
            </radialGradient>
            <radialGradient id={`${uid}-rBull`} cx="50%" cy="0%" r="100%">
              <stop offset="0%" stopColor="#6ca678" stopOpacity="0.35" />
              <stop offset="80%" stopColor="#6ca678" stopOpacity="0" />
            </radialGradient>
            <radialGradient id={`${uid}-rBear`} cx="50%" cy="100%" r="100%">
              <stop offset="0%" stopColor="#c66a6f" stopOpacity="0.35" />
              <stop offset="80%" stopColor="#c66a6f" stopOpacity="0" />
            </radialGradient>
            <linearGradient id={`${uid}-bullArc`} x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#6ca678" stopOpacity="0.05" />
              <stop offset="50%" stopColor="#8fc89a" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#6ca678" stopOpacity="0.05" />
            </linearGradient>
            <linearGradient id={`${uid}-bearArc`} x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#c66a6f" stopOpacity="0.05" />
              <stop offset="50%" stopColor="#dc8a8e" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#c66a6f" stopOpacity="0.05" />
            </linearGradient>
          </defs>

          <circle cx="0" cy="-30" r="280" fill={`url(#${uid}-rBull)`} />
          <circle cx="0" cy="30" r="280" fill={`url(#${uid}-rBear)`} />

          {[260, 220, 180, 140].map((r, i) => (
            <circle
              key={r}
              cx="0"
              cy="0"
              r={r}
              fill={i === 3 ? `url(#${uid}-rGlow)` : "none"}
              stroke={i === 3 ? "rgba(212,175,87,0.22)" : "rgba(255,255,255,0.05)"}
              strokeWidth="1"
              strokeDasharray={i === 2 ? "2 4" : undefined}
            />
          ))}

          <g stroke="rgba(255,255,255,0.05)" strokeWidth="1">
            <line x1="0" y1="-260" x2="0" y2="260" />
            <line x1="-260" y1="0" x2="260" y2="0" />
            <line x1="-184" y1="-184" x2="184" y2="184" />
            <line x1="-184" y1="184" x2="184" y2="-184" />
          </g>

          <path
            d="M -240 0 A 240 240 0 0 1 240 0"
            fill="none"
            stroke={`url(#${uid}-bullArc)`}
            strokeWidth="3"
            opacity={models.macro.bullPct / 100}
          />
          <path
            d="M 240 0 A 240 240 0 0 1 -240 0"
            fill="none"
            stroke={`url(#${uid}-bearArc)`}
            strokeWidth="3"
            opacity={models.intraday.bearPct / 100}
          />

          <text x="-270" y="-270" fill="#6ca678" fontSize="10" letterSpacing="3" opacity="0.85">
            ↑ BULL HEMISPHERE · MACRO
          </text>
          <text
            x="270"
            y="284"
            textAnchor="end"
            fill="#c66a6f"
            fontSize="10"
            letterSpacing="3"
            opacity="0.85"
          >
            INTRADAY · BEAR HEMISPHERE ↓
          </text>

          <polygon
            points={poly}
            fill="rgba(212,175,87,0.10)"
            stroke="#d4af57"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />

          {vertices.map((v) => {
            const p = vertexToPoint(v.normalized, v.angleDeg);
            const labelOffset = vertexToPoint(v.normalized + 0.12, v.angleDeg, 115, 275);
            const color = VERTEX_COLOR[v.side];
            return (
              <g key={v.id}>
                <circle cx={p.x} cy={p.y} r="4" fill={color} />
                <text
                  x={labelOffset.x}
                  y={labelOffset.y - 8}
                  textAnchor="middle"
                  fill="#b6b1a4"
                  fontSize="10"
                  letterSpacing="1.5"
                >
                  {v.label}
                </text>
                <text
                  x={labelOffset.x}
                  y={labelOffset.y + 6}
                  textAnchor="middle"
                  fill={color}
                  fontSize="9"
                >
                  {v.sublabel}
                </text>
              </g>
            );
          })}

          <circle cx="0" cy="0" r="76" fill="#0a0c10" stroke="rgba(212,175,87,0.45)" strokeWidth="1" />
          <circle cx="0" cy="0" r="84" fill="none" stroke="rgba(212,175,87,0.18)" strokeWidth="1" />
          <text x="0" y="-38" textAnchor="middle" fill="#75787f" fontSize="9" letterSpacing="2.5">
            SCORE
          </text>
          <text
            x="0"
            y="18"
            textAnchor="middle"
            fill="#ece8db"
            fontSize="46"
            fontWeight="600"
            letterSpacing="-2"
          >
            {Math.round(score)}
          </text>
          <text x="0" y="48" textAnchor="middle" fill="#ecc878" fontSize="10" letterSpacing="3">
            {scoreLabel(score).split(" ")[0]}
          </text>

          <text x="0" y="-290" textAnchor="middle" fill="#44464c" fontSize="9" letterSpacing="2.5">
            N · BULL
          </text>
          <text x="0" y="296" textAnchor="middle" fill="#44464c" fontSize="9" letterSpacing="2.5">
            S · BEAR
          </text>
        </svg>
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
          <span className={`v ${edge >= 0 ? "green" : "gold"}`}>
            {edge > 0 ? "+" : ""}
            {edge.toFixed(1)}
          </span>
        </div>
        <div className="cell">
          <span className="k">CONVICTION</span>
          <span className="v">{conviction}</span>
        </div>
      </div>
    </div>
  );
}
