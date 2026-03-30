// src/components/charts/ChartCanvas.jsx
import { useRef, useEffect } from "react";
import { Chart } from "chart.js/auto";

/**
 * ChartCanvas — thin wrapper around Chart.js (loaded via CDN).
 * Destroys and recreates the chart whenever data changes.
 *
 * Props:
 *   id        {string}  — unique canvas ID
 *   type      {string}  — "bar" | "line" | "doughnut"
 *   labels    {Array}   — x-axis labels
 *   datasets  {Array}   — Chart.js dataset objects
 *   indexAxis {string}  — optional "y" for horizontal bars
 *   height    {number}  — canvas container height in px (default 200)
 *   showLegend {boolean}— whether to show the legend (default: auto)
 */
export default function ChartCanvas({
  id,
  type,
  labels,
  datasets,
  indexAxis,
  height = 200,
  showLegend,
}) {
  const canvasRef = useRef(null);
  const chartRef  = useRef(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    if (chartRef.current) chartRef.current.destroy();

    const legendDisplay = showLegend !== undefined ? showLegend : datasets.length > 1;

    chartRef.current = new Chart(canvasRef.current, {
      type,
      data: { labels, datasets },
      options: {
        responsive:          true,
        maintainAspectRatio: false,
        ...(indexAxis ? { indexAxis } : {}),
        plugins: {
          legend: {
            display: legendDisplay,
            labels:  { color: "#64748b", font: { size: 10 }, boxWidth: 10 },
          },
        },
        scales: {
          x: {
            ticks: { color: "#475569", font: { size: 9 }, maxTicksLimit: 8 },
            grid:  { color: "#1e293b" },
          },
          y: {
            ticks: { color: "#475569", font: { size: 9 } },
            grid:  { color: "#1e293b" },
          },
        },
      },
    });

    return () => {
      if (chartRef.current) {
        chartRef.current.destroy();
        chartRef.current = null;
      }
    };
  }, [JSON.stringify(labels), JSON.stringify(datasets), type, indexAxis]);

  return (
    <div style={{ position: "relative", height }}>
      <canvas ref={canvasRef} id={id} />
    </div>
  );
}
