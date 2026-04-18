import type { ReactNode } from "react";

type InvRow = {
  trigger: ReactNode;
  exp: string;
  status: "near" | "armed" | "remote";
  statusLbl: string;
};

const INVALIDATIONS: InvRow[] = [
  {
    trigger: (
      <>
        Real yields break <span className="num">above 2.00%</span> and hold for two daily closes
      </>
    ),
    exp: "Would confirm rate regime has overtaken safe-haven demand as the dominant driver. Current narrative collapses.",
    status: "near",
    statusLbl: "NEAR",
  },
  {
    trigger: (
      <>
        GPR index falls <span className="num">below 220</span> on a sustained basis
      </>
    ),
    exp: "Removes the primary bullish pillar. Without geopolitical bid, positioning is structurally offside.",
    status: "armed",
    statusLbl: "ARMED",
  },
  {
    trigger: (
      <>
        DXY closes <span className="num">above 108.50</span> with confirming rate differential move
      </>
    ),
    exp: "Dollar strength would compound the yield pressure. Safe-haven score would likely drop below 35.",
    status: "armed",
    statusLbl: "ARMED",
  },
  {
    trigger: <>Weekly central-bank gold flow turns net negative</>,
    exp: "Removes the structural floor that has cushioned previous drawdowns. Long-horizon bulls lose their anchor.",
    status: "remote",
    statusLbl: "REMOTE",
  },
  {
    trigger: (
      <>
        VIX spikes <span className="num">above 28</span> while gold fails to rally
      </>
    ),
    exp: "Breakdown of the safe-haven correlation — signals gold has lost its defensive premium entirely.",
    status: "remote",
    statusLbl: "REMOTE",
  },
];

export function Invalidation({
  rows,
}: {
  rows?: InvRow[];
}) {
  return (
    <div className="w-card">
      <div className="w-head">
        <div className="title">Invalidation Conditions</div>
        <div className="meta">WHAT WOULD BREAK THIS NARRATIVE</div>
      </div>
      <div className="inv-list">
        {(rows?.length ? rows : INVALIDATIONS).map((iv, i) => (
          <div key={i} className="inv-row">
            <div className="inv-idx">0{i + 1}</div>
            <div className="inv-body">
              <div className="inv-trigger">{iv.trigger}</div>
              <div className="inv-exp">{iv.exp}</div>
            </div>
            <div className={`inv-status ${iv.status}`}>{iv.statusLbl}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
