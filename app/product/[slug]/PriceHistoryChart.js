"use client";

import { useEffect, useState } from "react";

const PLATFORM_COLORS = {
  amazon: "#f59e0b",
  flipkart: "#2563eb",
};

export default function PriceHistoryChart({ productId }) {
  const [rows, setRows] = useState(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/price-history/${productId}`)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data) => {
        if (!cancelled) setRows(data);
      })
      .catch(() => {
        if (!cancelled) setError(true);
      });
    return () => {
      cancelled = true;
    };
  }, [productId]);

  if (error) {
    return <p className="text-sm text-gray-400">Price history unavailable right now.</p>;
  }

  if (!rows) {
    return <div className="h-40 rounded-xl bg-gray-50 animate-pulse" />;
  }

  if (rows.length < 2) {
    return (
      <p className="text-sm text-gray-400">
        Not enough history yet — check back after a few price updates.
      </p>
    );
  }

  const byPlatform = rows.reduce((acc, r) => {
    (acc[r.platform] ||= []).push(r);
    return acc;
  }, {});

  const allPrices = rows.map((r) => r.price);
  const minP = Math.min(...allPrices);
  const maxP = Math.max(...allPrices);
  const range = maxP - minP || 1;

  const W = 600;
  const H = 180;
  const PAD = 24;

  const minTime = Math.min(...rows.map((r) => new Date(r.checked_at).getTime()));
  const maxTime = Math.max(...rows.map((r) => new Date(r.checked_at).getTime()));
  const timeRange = maxTime - minTime || 1;

  const toPoint = (r) => {
    const x = PAD + ((new Date(r.checked_at).getTime() - minTime) / timeRange) * (W - PAD * 2);
    const y = H - PAD - ((r.price - minP) / range) * (H - PAD * 2);
    return { x, y };
  };

  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-40" preserveAspectRatio="none">
        {Object.entries(byPlatform).map(([platform, points]) => {
          const sorted = [...points].sort(
            (a, b) => new Date(a.checked_at) - new Date(b.checked_at)
          );
          const d = sorted
            .map((r, i) => {
              const { x, y } = toPoint(r);
              return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
            })
            .join(" ");
          return (
            <path
              key={platform}
              d={d}
              fill="none"
              stroke={PLATFORM_COLORS[platform] || "#999"}
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          );
        })}
      </svg>
      <div className="flex gap-4 mt-2">
        {Object.keys(byPlatform).map((platform) => (
          <div key={platform} className="flex items-center gap-1.5 text-xs text-gray-500 capitalize">
            <span
              className="w-2.5 h-2.5 rounded-full"
              style={{ background: PLATFORM_COLORS[platform] || "#999" }}
            />
            {platform}
          </div>
        ))}
      </div>
    </div>
  );
}
