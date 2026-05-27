import type { ReactNode } from "react";

export function GoldStatusBar({
  priceDisplay,
  chgDisplay,
  chgClass,
  score,
  scoreTag,
  regimeChip,
  biasChip,
  liveLine,
  extra,
}: {
  priceDisplay: string;
  chgDisplay: string;
  chgClass: "bull" | "bear";
  score: number;
  scoreTag: string;
  regimeChip: string;
  biasChip: string;
  liveLine: string;
  extra?: ReactNode;
}) {
  return (
    <div className="kz-topbar">
      <div className="kz-logo">
        <div className="kz-logo-mark">K</div>
        <div className="kz-logo-text">
          <b>KILLZONE</b>
          <span>GOLD INTELLIGENCE</span>
        </div>
      </div>

      <div className="kz-topbar-center">
        <div className="kz-asset">
          <span className="kz-asset-pair">
            XAU<em>/</em>USD
          </span>
          <span className="kz-asset-price mono">{priceDisplay}</span>
          <span className={`kz-asset-chg mono ${chgClass}`}>{chgDisplay}</span>
        </div>
        <span className="kz-topbar-divider" />
        <span className="kz-pill kz-pill-gold">
          SCORE <b>{Math.round(score)}</b> · {scoreTag.split("·")[1]?.trim() ?? scoreTag}
        </span>
        <span className="kz-pill">
          REGIME <b>{regimeChip}</b>
        </span>
        <span className="kz-pill">
          BIAS <b>{biasChip}</b>
        </span>
      </div>

      <div className="kz-topbar-right">
        <span className="kz-live">
          <span className="kz-live-dot" />
          {liveLine}
        </span>
        {extra}
      </div>
    </div>
  );
}
