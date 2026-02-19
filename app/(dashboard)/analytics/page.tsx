"use client";

import { useState, useEffect } from "react";
import { Loader2, TrendingUp, MousePointerClick, Eye } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

type TimeRange = "7d" | "30d" | "90d";

interface AnalyticsSummary {
  totalViews: number;
  totalClicks: number;
  ctr: number;
  range: TimeRange;
  topReferrers: { referrer: string; count: number }[];
  topBlocks: { blockId: string; title: string; clicks: number }[];
}

interface PageData {
  id: string;
  slug: string;
}

function StatCard({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string | number;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#5f4dc5]/10">
          <Icon className="h-5 w-5 text-[#5f4dc5]" />
        </div>
        <div>
          <p className="text-xs font-medium text-slate-400">{label}</p>
          <p className="text-2xl font-bold text-[#292d4c]">{value}</p>
        </div>
      </div>
    </div>
  );
}

export default function AnalyticsPage() {
  const [page, setPage] = useState<PageData | null>(null);
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [range, setRange] = useState<TimeRange>("7d");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/pages")
      .then((r) => r.json())
      .then((pages: PageData[]) => {
        if (pages[0]) setPage(pages[0]);
      });
  }, []);

  useEffect(() => {
    if (!page) return;
    setLoading(true);
    fetch(`/api/analytics/${page.id}/summary?range=${range}`)
      .then((r) => r.json())
      .then((data: AnalyticsSummary) => {
        setSummary(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [page, range]);

  return (
    <div className="mx-auto max-w-4xl p-6 lg:p-8">
      <div className="mb-6 flex items-center justify-between">
        <h1
          className="font-display text-2xl font-semibold"
          style={{ color: "#292d4c" }}
        >
          Analytics
        </h1>

        {/* Time range selector */}
        <div className="flex gap-1 rounded-lg border border-slate-200 bg-white p-1">
          {(["7d", "30d", "90d"] as TimeRange[]).map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                range === r
                  ? "bg-[#5f4dc5] text-white"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              {r === "7d" ? "7 days" : r === "30d" ? "30 days" : "90 days"}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
        </div>
      ) : !summary ? (
        <p className="text-center text-sm text-slate-500">No data available.</p>
      ) : (
        <div className="space-y-6">
          {/* Summary cards */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <StatCard icon={Eye} label="Page views" value={summary.totalViews.toLocaleString()} />
            <StatCard icon={MousePointerClick} label="Link clicks" value={summary.totalClicks.toLocaleString()} />
            <StatCard icon={TrendingUp} label="Click-through rate" value={`${summary.ctr}%`} />
          </div>

          {/* Top blocks */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="mb-4 text-sm font-semibold text-[#292d4c]">
              Top links by clicks
            </h2>
            {summary.topBlocks.length === 0 ? (
              <p className="text-sm text-slate-400">No clicks yet in this period.</p>
            ) : (
              <>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={summary.topBlocks} layout="vertical">
                    <XAxis type="number" hide />
                    <YAxis
                      type="category"
                      dataKey="title"
                      width={120}
                      tick={{ fontSize: 12 }}
                    />
                    <Tooltip />
                    <Bar dataKey="clicks" fill="#5f4dc5" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
                <table className="mt-4 w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100">
                      <th className="pb-2 text-left font-medium text-slate-400">
                        Link
                      </th>
                      <th className="pb-2 text-right font-medium text-slate-400">
                        Clicks
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {summary.topBlocks.map((b) => (
                      <tr key={b.blockId} className="border-b border-slate-50">
                        <td className="py-2 text-[#292d4c]">{b.title}</td>
                        <td className="py-2 text-right font-medium text-[#292d4c]">
                          {b.clicks.toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </>
            )}
          </div>

          {/* Top referrers */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="mb-4 text-sm font-semibold text-[#292d4c]">
              Top referrers
            </h2>
            {summary.topReferrers.length === 0 ? (
              <p className="text-sm text-slate-400">No referrer data yet.</p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className="pb-2 text-left font-medium text-slate-400">
                      Source
                    </th>
                    <th className="pb-2 text-right font-medium text-slate-400">
                      Clicks
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {summary.topReferrers.map((r, i) => (
                    <tr key={i} className="border-b border-slate-50">
                      <td className="py-2 text-[#292d4c]">
                        {r.referrer || "Direct"}
                      </td>
                      <td className="py-2 text-right font-medium text-[#292d4c]">
                        {r.count.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
