import { useEffect, useRef } from "react";
import { createChart, ColorType, CandlestickSeries, LineSeries } from "lightweight-charts";
import chartData from "@/data/chart-data.json";

export default function ChartPage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<ReturnType<typeof createChart> | null>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    if (chartRef.current) {
      chartRef.current.remove();
      chartRef.current = null;
    }

    const chart = createChart(el, {
      width: el.clientWidth,
      height: el.clientHeight,
      layout: { background: { type: ColorType.Solid, color: "#0F1419" }, textColor: "#9CA3AF", fontSize: 11 },
      grid: { vertLines: { color: "#1C253030" }, horzLines: { color: "#1C253030" } },
      crosshair: {
        vertLine: { color: "#C49B3050", width: 1, labelBackgroundColor: "#1C2D3A" },
        horzLine: { color: "#C49B3050", width: 1, labelBackgroundColor: "#1C2D3A" },
      },
      rightPriceScale: { borderColor: "#1C2530", scaleMargins: { top: 0.02, bottom: 0.02 } },
      timeScale: { borderColor: "#1C2530", rightOffset: 5, timeVisible: true, secondsVisible: false },
    });
    chartRef.current = chart;

    // Candlesticks — 1H XAUUSD
    const candles = chart.addSeries(CandlestickSeries, {
      upColor: "#4ade80", downColor: "#ef4444",
      borderUpColor: "#4ade80", borderDownColor: "#ef4444",
      wickUpColor: "#4ade8080", wickDownColor: "#ef444480",
    });
    candles.setData(chartData.candles as any);

    // Fit to content
    chart.timeScale().fitContent();

    // Resize observer
    const ro = new ResizeObserver(() => {
      if (el && chartRef.current) chartRef.current.resize(el.clientWidth, el.clientHeight);
    });
    ro.observe(el);

    return () => { ro.disconnect(); chartRef.current?.remove(); chartRef.current = null; };
  }, []);

  const latestCandle = chartData.candles[chartData.candles.length - 1];
  const price = latestCandle?.close ?? 0;
  const prevClose = chartData.candles.length > 1 ? chartData.candles[chartData.candles.length - 2].close : price;
  const change = Math.round((price - prevClose) * 100) / 100;
  const changePct = prevClose > 0 ? Math.round(((price - prevClose) / prevClose) * 10000) / 100 : 0;
  const isUp = change >= 0;

  return (
    <div style={{ background: "#0F1419", height: "100vh", width: "100%", display: "flex", flexDirection: "column", overflow: "hidden" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 16px", borderBottom: "1px solid #1C2530", background: "#0A0F14", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <span style={{ fontSize: 13, fontWeight: 700, letterSpacing: "0.1em" }}>
            <span style={{ color: "#C49B30" }}>KILL</span><span style={{ color: "#9CA3AF" }}>ZONE</span>
          </span>
          <span style={{ color: "#4B5563", fontSize: 12 }}>|</span>
          <span style={{ color: "#E5E7EB", fontSize: 14, fontWeight: 700, fontFamily: "monospace" }}>XAUUSD</span>
          <span style={{ color: "#6B7280", fontSize: 11 }}>1H</span>
          <span style={{ color: "#E5E7EB", fontSize: 14, fontWeight: 700, fontFamily: "monospace" }}>${price.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
          <span style={{ color: isUp ? "#4ade80" : "#ef4444", fontSize: 12, fontWeight: 600, fontFamily: "monospace" }}>
            {isUp ? "+" : ""}{change.toFixed(2)} ({isUp ? "+" : ""}{changePct.toFixed(2)}%)
          </span>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <a href="#/" style={{ color: "#9CA3AF", background: "#1C2530", padding: "4px 12px", borderRadius: 4, fontSize: 12, fontWeight: 500, textDecoration: "none" }}>Dashboard</a>
          <a href="#/signal" style={{ color: "#C49B30", background: "rgba(196,155,48,0.12)", border: "1px solid rgba(196,155,48,0.2)", padding: "4px 12px", borderRadius: 4, fontSize: 12, fontWeight: 500, textDecoration: "none" }}>Signal</a>
        </div>
      </div>

      {/* Chart */}
      <div ref={containerRef} style={{ flex: 1, minHeight: 0, width: "100%" }} />
    </div>
  );
}
