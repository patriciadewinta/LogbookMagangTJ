"use client";

import {
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const spendingData = [
  { bulan: "Jan", nominal: 30 },
  { bulan: "Feb", nominal: 42 },
  { bulan: "Mar", nominal: 38 },
  { bulan: "Apr", nominal: 55 },
  { bulan: "Mei", nominal: 48 },
  { bulan: "Jun", nominal: 62 },
  { bulan: "Jul", nominal: 50 },
];

export type RegionDatum = { name: string; value: number };

const REGION_COLORS = ["#6650FF", "#00D4D8"];

export default function OdCharts({ regionData }: { regionData: RegionDatum[] }) {
  const regionTotal = regionData.reduce((s, x) => s + x.value, 0);

  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
      <div className="rounded-[10px] border border-[#d9d9d9] bg-white p-4 dark:border-white/10 dark:bg-black sm:p-5">
        <p className="text-[16px] font-semibold text-black dark:text-white">
          Tren Pengeluaran Uang Saku
        </p>
        <p className="mt-0.5 text-[13px] text-black/40 dark:text-white/40">
          Januari–Juli 2026
        </p>
        <div className="mt-4 h-[220px] text-[#6f6f6f] dark:text-white/60">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={spendingData} margin={{ top: 8, right: 12, left: -18, bottom: 0 }}>
              <CartesianGrid stroke="currentColor" strokeOpacity={0.15} vertical={false} />
              <XAxis
                dataKey="bulan"
                axisLine={false}
                tickLine={false}
                tick={{ fill: "currentColor", fontSize: 12 }}
              />
              <YAxis
                domain={[0, 80]}
                ticks={[0, 20, 40, 60, 80]}
                axisLine={false}
                tickLine={false}
                tick={{ fill: "currentColor", fontSize: 12 }}
              />
              <Tooltip
                cursor={{ stroke: "currentColor", strokeOpacity: 0.2 }}
                contentStyle={{
                  background: "#fff",
                  border: "1px solid #e0e0e0",
                  borderRadius: 10,
                  fontSize: 13,
                  color: "#202020",
                }}
              />
              <Line
                type="monotone"
                dataKey="nominal"
                stroke="#001192"
                strokeWidth={2.5}
                dot={{ r: 4, fill: "#001192", strokeWidth: 0 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="rounded-[10px] border border-[#d9d9d9] bg-white p-4 dark:border-white/10 dark:bg-black sm:p-5">
        <p className="text-[16px] font-semibold text-black dark:text-white">
          Komposisi Asal Daerah Anak Magang
        </p>
        <p className="mt-0.5 text-[13px] text-black/40 dark:text-white/40">per hari ini</p>
        {regionTotal > 0 ? (
        <div className="mt-4 flex flex-col items-center gap-3 sm:flex-row">
          <div className="h-[200px] w-full sm:w-[55%]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={regionData}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={2}
                  strokeWidth={0}
                >
                  {regionData.map((_, i) => (
                    <Cell key={i} fill={REGION_COLORS[i]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    background: "#fff",
                    border: "1px solid #e0e0e0",
                    borderRadius: 10,
                    fontSize: 13,
                    color: "#202020",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-col gap-2.5 text-[14px] text-black dark:text-white">
            {regionData.map((r, i) => {
              const pct = Math.round((r.value / regionTotal) * 100);
              return (
                <div key={r.name} className="flex items-center gap-2">
                  <span
                    className="size-3 shrink-0 rounded-full"
                    style={{ background: REGION_COLORS[i] }}
                  />
                  <span className="font-medium">{r.name}</span>
                  <span className="text-black/50 dark:text-white/50">{pct}%</span>
                </div>
              );
            })}
          </div>
        </div>
        ) : (
          <p className="mt-4 rounded-[10px] border border-dashed border-black/20 px-4 py-6 text-center text-[15px] text-black/40 dark:border-white/20 dark:text-white/40">
            Belum ada data domisili anak magang.
          </p>
        )}
      </div>
    </div>
  );
}
