import type { GoldDecisionBrief as Brief } from "./decision-brief";

export function GoldDecisionBrief({ brief }: { brief: Brief }) {
  return (
    <div className="gold-decision-brief">
      <div className="gold-decision-brief-headline">{brief.headline}</div>
      <div className="gold-decision-brief-body">{brief.body}</div>
      {brief.whatChanged && (
        <div className="gold-what-changed">
          <strong>What changed?</strong>
          <span>{brief.whatChanged}</span>
        </div>
      )}
    </div>
  );
}
