import { useEffect, useMemo, useState } from "react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi,
} from "@/components/ui/carousel";

export type MarketNarrativeSlide = {
  id: "gold" | "yields" | "dollar" | "risk";
  title: string;
  metrics: { label: string; value: string }[];
  text: string;
  updatedLabel: string;
  bias: "Bullish" | "Bearish" | "Neutral";
  impact?: "High impact" | "Medium impact" | "Low impact";
  tags?: string[];
  imageUrl?: string;
  imageAlt?: string;
  freshness?: {
    market: string;
    news: string;
  };
  headlines?: {
    title: string;
    source: string;
    age: string;
    url?: string;
    imageUrl?: string;
  }[];
};

export type LiveMarketNarrativeCarouselProps = {
  slides: MarketNarrativeSlide[];
  rotateMs?: number;
};

const FALLBACK_SLIDES: MarketNarrativeSlide[] = [
  {
    id: "gold",
    title: "BREAKING: Gold flow initializing",
    metrics: [
      { label: "Gold", value: "Awaiting feed" },
      { label: "DXY Proxy", value: "Awaiting feed" },
    ],
    text: "Live macro narrative is initializing. Gold flow will update once the first market snapshot is available.",
    updatedLabel: "Syncing feed",
    bias: "Neutral",
    imageUrl:
      "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&w=1200&q=80",
    imageAlt: "Macro market chart screen",
    freshness: { market: "n/a", news: "n/a" },
    headlines: [],
  },
  {
    id: "yields",
    title: "YIELDS WATCH: Feed initializing",
    metrics: [
      { label: "Headlines", value: "—" },
      { label: "Top Source", value: "—" },
    ],
    text: "Headline narrative will appear when fresh market news is detected and processed by the feed.",
    updatedLabel: "Syncing headlines",
    bias: "Neutral",
    imageUrl:
      "https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&w=1200&q=80",
    imageAlt: "Financial news desk and headlines",
    freshness: { market: "n/a", news: "n/a" },
    headlines: [],
  },
  {
    id: "dollar",
    title: "DOLLAR TRACKER: Feed initializing",
    metrics: [
      { label: "Score", value: "—" },
      { label: "Momentum", value: "—" },
    ],
    text: "Positioning summary will populate from the live score model as soon as the current cycle completes.",
    updatedLabel: "Syncing score model",
    bias: "Neutral",
    imageUrl:
      "https://images.unsplash.com/photo-1642790551116-18e150f248e3?auto=format&fit=crop&w=1200&q=80",
    imageAlt: "Technical trading chart analysis",
    freshness: { market: "n/a", news: "n/a" },
    headlines: [],
  },
  {
    id: "risk",
    title: "MACRO ALERT: Feed initializing",
    metrics: [
      { label: "Bias", value: "Neutral" },
      { label: "Risk-Off", value: "—" },
    ],
    text: "Short-term outlook is on standby until macro and headline inputs are synchronized.",
    updatedLabel: "Syncing outlook",
    bias: "Neutral",
    imageUrl:
      "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=1200&q=80",
    imageAlt: "Strategic planning and market outlook",
    freshness: { market: "n/a", news: "n/a" },
    headlines: [],
  },
];

function biasClass(bias: MarketNarrativeSlide["bias"]): string {
  if (bias === "Bullish") return "bull";
  if (bias === "Bearish") return "bear";
  return "neutral";
}

export function LiveMarketNarrativeCarousel({
  slides,
  rotateMs = 12000,
}: LiveMarketNarrativeCarouselProps) {
  const [api, setApi] = useState<CarouselApi>();
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const displaySlides = useMemo(
    () => (slides.length > 0 ? slides.slice(0, 4) : FALLBACK_SLIDES),
    [slides],
  );

  useEffect(() => {
    if (!api) return;
    const onSelect = () => setIndex(api.selectedScrollSnap());
    onSelect();
    api.on("select", onSelect);
    return () => api.off("select", onSelect);
  }, [api]);

  useEffect(() => {
    if (!api || paused || displaySlides.length <= 1) return;
    const timer = window.setInterval(() => {
      const current = api.selectedScrollSnap();
      const next = (current + 1) % displaySlides.length;
      api.scrollTo(next);
    }, rotateMs);
    return () => window.clearInterval(timer);
  }, [api, paused, rotateMs, displaySlides.length]);

  return (
    <>
      <div className="bf-disclaimer bf-disclaimer-standalone">
        <svg className="bf-disclaimer-ic" width="12" height="12" viewBox="0 0 16 16" fill="none">
          <circle cx="8" cy="8" r="6.2" stroke="currentColor" strokeWidth="1.3" />
          <path d="M8 5v3.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
          <circle cx="8" cy="11" r="0.7" fill="currentColor" />
        </svg>
        <div>
          <span className="bf-disclaimer-lbl">Narrative, not a signal.</span> Context updates from live macro
          flow and headlines. Use this for framing, then validate with your own levels and risk plan.
        </div>
      </div>

      <div
        className="lmn-wrap"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
      >
        <div className="lmn-build-badge mono">LIVE FEED v2</div>
        <Carousel
          setApi={setApi}
          opts={{ loop: true, align: "start" }}
          className="lmn-carousel"
          aria-label="Live market narratives carousel"
        >
          <CarouselContent className="ml-0">
            {displaySlides.map((slide) => {
              const isFeedHeavySlide = slide.id === "risk";
              const headlineLimit = isFeedHeavySlide ? 5 : 4;
              const narrativeText = isFeedHeavySlide
                ? (slide.text.split(". ").slice(0, 1).join(". ").trim() || slide.text)
                : slide.text;
              return (
                <CarouselItem key={slide.id} className="pl-0">
                  <article className="lmn-card">
                    <div className="lmn-main">
                      <div className="lmn-copy">
                        <div className="lmn-top">
                          <div className="lmn-head">
                            <div className="lmn-title">{slide.title}</div>
                            <span className={`lmn-bias ${biasClass(slide.bias)}`}>{slide.bias}</span>
                          </div>
                          <div className="lmn-ts">{slide.updatedLabel}</div>
                        </div>
                        <div className="lmn-tags">
                          <span className="tag-chip live">LIVE</span>
                          {slide.impact && <span className="tag-chip">{slide.impact}</span>}
                          {(slide.tags ?? []).slice(0, 1).map((t, idx) => (
                            <span key={`${slide.id}-tag-${idx}`} className="tag-chip">{t}</span>
                          ))}
                        </div>
                        <div className="lmn-freshness mono">
                          Market {slide.freshness?.market ?? "n/a"} · News {slide.freshness?.news ?? "n/a"}
                        </div>

                        <div className="lmn-metrics">
                          {slide.metrics.slice(0, 2).map((m) => (
                            <div key={`${slide.id}-${m.label}`} className="lmn-metric">
                              <span className="lbl">{m.label}</span>
                              <span className="val mono">{m.value}</span>
                            </div>
                          ))}
                        </div>

                        <div className={`lmn-text ${isFeedHeavySlide ? "news-compact" : ""}`}>{narrativeText}</div>
                        {slide.headlines && slide.headlines.length > 0 && (
                          <div className={`lmn-stories ${isFeedHeavySlide ? "news-heavy" : ""}`}>
                            {slide.headlines.slice(0, headlineLimit).map((h, idx) => (
                              <a
                                key={`${slide.id}-story-${idx}`}
                                className="lmn-story"
                                href={h.url || "#"}
                                target={h.url ? "_blank" : undefined}
                                rel={h.url ? "noreferrer noopener" : undefined}
                                onClick={(e) => !h.url && e.preventDefault()}
                              >
                                <div className="lmn-story-copy">
                                  <div className="lmn-story-meta">
                                    <span>{h.source}</span>
                                    <span className="sep">·</span>
                                    <span>{h.age} ago</span>
                                  </div>
                                  <div className="lmn-story-title">{h.title}</div>
                                </div>
                                <div className="lmn-story-thumb">
                                  <img
                                    src={h.imageUrl || "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&w=400&q=80"}
                                    alt={`${h.source} story`}
                                    loading="lazy"
                                    decoding="async"
                                  />
                                </div>
                              </a>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </article>
                </CarouselItem>
              );
            })}
          </CarouselContent>
        </Carousel>

        <div className="lmn-dots">
          {displaySlides.map((slide, i) => (
            <button
              key={`dot-${slide.id}`}
              type="button"
              className={`lmn-dot ${i === index ? "active" : ""}`}
              aria-label={`Go to ${slide.title}`}
              onClick={() => api?.scrollTo(i)}
            />
          ))}
        </div>
      </div>
    </>
  );
}
