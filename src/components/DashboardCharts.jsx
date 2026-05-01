"use client"

import { useMemo } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { fmtRR } from "@/lib/utils";

const FONT_NUM = "'JetBrains Mono','Fira Code',monospace";

function ChartShell({ T, title, meta, children }) {
  return (
    <Card
      size="sm"
      className="min-h-[206px] gap-2 rounded-[14px] py-3"
      style={{ background:T.surface, border:`1px solid ${T.border}`, color:T.text }}
    >
      <CardHeader className="px-3">
        <CardTitle style={{
          color: T.muted,
          fontSize: 11,
          fontWeight: 800,
          letterSpacing: "0.12em",
          textTransform: "uppercase",
        }}>{title}</CardTitle>
        {meta && (
          <CardAction style={{
            color: T.textDim,
            fontSize: 10,
            fontFamily: FONT_NUM,
            whiteSpace: "nowrap",
          }}>{meta}</CardAction>
        )}
      </CardHeader>
      <CardContent className="px-3">
        {children}
      </CardContent>
    </Card>
  );
}

function EmptyChart({ T, copy = "Log more trades to activate this chart." }) {
  return (
    <div style={{
      minHeight: 150,
      display: "grid",
      placeItems: "center",
      color: T.textDim,
      fontSize: 12,
      border: `1px dashed ${T.border}`,
      borderRadius: 12,
      background: T.surface2,
      textAlign: "center",
      padding: 16,
    }}>{copy}</div>
  );
}

function ChartTooltip({ active, payload, label, T }) {
  if (!active || !payload?.length) return null;
  const point = payload[0]?.payload || {};
  const r = Number(point.totalR ?? point.r ?? point.value ?? 0);
  return (
    <div style={{
      background: T.surface,
      border: `1px solid ${T.border}`,
      borderRadius: 10,
      boxShadow: `0 16px 40px ${T.bg}cc`,
      padding: "9px 11px",
      minWidth: 140,
    }}>
      <div style={{ color: T.text, fontSize: 12, fontWeight: 850, marginBottom: 6 }}>{label || point.name}</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
        <Metric T={T} label="R" value={fmtRR(r)} color={r >= 0 ? T.green : T.red} />
        <Metric T={T} label="Trades" value={point.count || "-"} color={T.text} />
      </div>
      {point.wr !== undefined && (
        <div style={{ marginTop: 7, color: T.textDim, fontSize: 10, fontFamily: FONT_NUM }}>{point.wr}% win rate</div>
      )}
    </div>
  );
}

function Metric({ T, label, value, color }) {
  return (
    <div>
      <div style={{ color: T.muted, fontSize: 8, fontWeight: 800, letterSpacing: "0.12em", textTransform: "uppercase" }}>{label}</div>
      <div style={{ color, fontFamily: FONT_NUM, fontSize: 13, fontWeight: 900, letterSpacing: "-0.04em" }}>{value}</div>
    </div>
  );
}

function buildGrouped(trades, keyName, labelName) {
  const map = new Map();
  trades.forEach(trade => {
    const label = trade[keyName] || "Not set";
    const current = map.get(label) || { name: label, count: 0, wins: 0, totalR: 0 };
    current.count += 1;
    current.totalR += Number(trade.rr) || 0;
    if (trade.result === "WIN") current.wins += 1;
    map.set(label, current);
  });
  return [...map.values()]
    .map(item => ({ ...item, [labelName]: item.name, wr: item.count ? Math.round(item.wins / item.count * 100) : 0 }))
    .sort((a, b) => Math.abs(b.totalR) - Math.abs(a.totalR))
    .slice(0, 7);
}

function buildDistribution(trades) {
  const buckets = [
    { name: "< -2", min: -Infinity, max: -2 },
    { name: "-2/-1", min: -2, max: -1 },
    { name: "-1/0", min: -1, max: 0 },
    { name: "BE", min: 0, max: 0 },
    { name: "0/1", min: 0, max: 1 },
    { name: "1/2", min: 1, max: 2 },
    { name: "2+", min: 2, max: Infinity },
  ].map(bucket => ({ ...bucket, count: 0, totalR: 0 }));

  trades.forEach(trade => {
    const rr = Number(trade.rr) || 0;
    const bucket = buckets.find(item => {
      if (item.name === "BE") return rr === 0;
      return rr > item.min && rr <= item.max;
    });
    if (!bucket) return;
    bucket.count += 1;
    bucket.totalR += rr;
  });
  return buckets;
}

function PerformanceBars({ T, data, labelKey }) {
  if (!data.length) return <EmptyChart T={T} />;
  return (
    <div style={{ height: 154 }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ top: 2, right: 8, bottom: 0, left: 0 }}>
          <CartesianGrid stroke={T.border} strokeDasharray="2 8" horizontal={false} opacity={0.35} />
          <XAxis type="number" hide />
          <YAxis
            type="category"
            dataKey={labelKey}
            width={82}
            axisLine={false}
            tickLine={false}
            tick={{ fill: T.text, fontSize: 10, fontWeight: 800, fontFamily: FONT_NUM }}
          />
          <ReferenceLine x={0} stroke={T.border} strokeOpacity={0.8} />
          <Tooltip content={<ChartTooltip T={T} />} cursor={{ fill: `${T.accent}08` }} />
          <Bar dataKey="totalR" radius={[4, 4, 4, 4]} barSize={12}>
            {data.map(item => (
              <Cell key={item.name} fill={item.totalR >= 0 ? T.green : T.red} fillOpacity={0.72} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function DistributionChart({ T, data }) {
  const active = data.some(item => item.count > 0);
  if (!active) return <EmptyChart T={T} copy="No R distribution yet." />;
  return (
    <div style={{ height: 154 }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 4, bottom: 0, left: -24 }}>
          <CartesianGrid stroke={T.border} strokeDasharray="2 8" vertical={false} opacity={0.35} />
          <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: T.textDim, fontSize: 9, fontFamily: FONT_NUM }} />
          <YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{ fill: T.muted, fontSize: 9, fontFamily: FONT_NUM }} />
          <Tooltip content={<ChartTooltip T={T} />} cursor={{ fill: `${T.accent}08` }} />
          <Bar dataKey="count" radius={[5, 5, 0, 0]} barSize={18}>
            {data.map(item => (
              <Cell key={item.name} fill={item.totalR >= 0 ? T.green : T.red} fillOpacity={item.count ? 0.72 : 0.18} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export default function DashboardCharts({ T, trades = [], isMobile = false }) {
  const sessionData = useMemo(() => buildGrouped(trades, "session", "session"), [trades]);
  const setupData = useMemo(() => buildGrouped(trades, "setup", "setup"), [trades]);
  const distribution = useMemo(() => buildDistribution(trades), [trades]);

  return (
    <>
      <div style={{ gridColumn: isMobile ? "auto" : "span 4" }}>
        <ChartShell T={T} title="Session Edge" meta={`${sessionData.length} active`}>
          <PerformanceBars T={T} data={sessionData} labelKey="session" />
        </ChartShell>
      </div>
      <div style={{ gridColumn: isMobile ? "auto" : "span 4" }}>
        <ChartShell T={T} title="Setup Edge" meta={`${setupData.length} tracked`}>
          <PerformanceBars T={T} data={setupData} labelKey="setup" />
        </ChartShell>
      </div>
      <div style={{ gridColumn: isMobile ? "auto" : "span 4" }}>
        <ChartShell T={T} title="R Distribution" meta={`${trades.length} trades`}>
          <DistributionChart T={T} data={distribution} />
        </ChartShell>
      </div>
    </>
  );
}
