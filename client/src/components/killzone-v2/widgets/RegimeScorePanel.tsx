import { PressureBar } from "../primitives/PressureBar";
import type { DominanceResult } from "../score-utils";
import { scoreLabel } from "../score-utils";

function regimeTagFromLabel(regimeLabel: string): string {
  const r = regimeLabel.toLowerCase();
  if (r.includes("trend")) return "TREND";
  if (r.includes("vol")) return "VOL EXP";
  return "RANGE";
}

export function RegimeScorePanel({
  score,
  regimeLabel,
  intradayModel,
}: {
  score: number;
  regimeLabel: string;
  intradayModel: DominanceResult;
}) {
  const bull = intradayModel.bullPct;
  const bear = intradayModel.bearPct;

  return (
    <div className="card card-gold b-score-card">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <span className="card-eyebrow">REGIME SCORE</span>
        <span className="b-regime-tag">{regimeTagFromLabel(regimeLabel)}</span>
      </div>
      <div className="b-score-row">
        <div className="b-score mono">
          {Math.round(score)}
          <em> /100</em>
        </div>
      </div>
      <div style={{ fontSize: 16, color: "var(--text-1)", lineHeight: 1.35 }}>{regimeLabel}</div>
      <div className="b-mini-pbar">
        <div className="row">
          <span className="lab">SUPPORTING GOLD</span>
          <span className="val" style={{ color: "var(--green-bright)" }}>
            {bull.toFixed(1)}%
          </span>
        </div>
        <PressureBar bullPct={bull} bearPct={bear} />
        <div className="row" style={{ marginTop: 2 }}>
          <span className="lab">OPPOSING GOLD</span>
          <span className="val" style={{ color: "var(--red-bright)" }}>
            {bear.toFixed(1)}%
          </span>
        </div>
      </div>
      <div style={{ fontSize: 11, color: "var(--text-3)", letterSpacing: "0.12em" }}>
        {scoreLabel(score)}
      </div>
    </div>
  );
}
