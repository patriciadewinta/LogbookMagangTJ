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

export type RegionDatum = { name: string; value: number };
export type UniversityDatum = { name: string; value: number };
export type SpendingDatum = { bulan: string; tahun: number; nominal: number };

const REGION_COLORS = ["#6650FF", "#00D4D8"];
const UNIVERSITY_COLORS = [
  "#6650FF",
  "#00D4D8",
  "#FFB74D",
  "#FF6B6B",
  "#4ECDC4",
  "#B8B8B8",
];

const cardClass =
  "rounded-[10px] border border-[#d9d9d9] bg-white p-4 dark:border-white/10 dark:bg-black sm:p-5";
const titleClass = "text-[16px] font-semibold text-black dark:text-white";
const subtitleClass = "mt-0.5 text-[13px] text-black/40 dark:text-white/65";

const tooltipStyle = {
  background: "#fff",
  border: "1px solid #e0e0e0",
  borderRadius: 10,
  fontSize: 13,
  color: "#202020",
};

const rupiah = new Intl.NumberFormat("id-ID");

function formatRupiahShort(v: number) {
  if (v >= 1_000_000) {
    return `Rp ${(v / 1_000_000).toLocaleString("id-ID", { maximumFractionDigits: 1 })} jt`;
  }
  if (v >= 1_000) return `Rp ${Math.round(v / 1_000)} rb`;
  return `Rp ${v}`;
}

function rangeLabel(data: SpendingDatum[]) {
  if (data.length === 0) return "Belum ada data";
  const first = data[0];
  const last = data[data.length - 1];
  if (data.length === 1) return `${first.bulan} ${first.tahun}`;
  return `${first.bulan} ${first.tahun} – ${last.bulan} ${last.tahun}`;
}

function PieCard({
  title,
  subtitle,
  data,
  colors,
}: {
  title: string;
  subtitle: string;
  data: { name: string; value: number }[];
  colors: string[];
}) {
  const total = data.reduce((s, x) => s + x.value, 0);

  return (
    <div className={cardClass}>
      <p className={titleClass}>{title}</p>
      <p className={subtitleClass}>{subtitle}</p>
      {total > 0 ? (
        <div className="mt-4 flex flex-col items-center gap-3 sm:flex-row">
          <div className="h-[200px] w-full sm:w-[55%]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={2}
                  strokeWidth={0}
                >
                  {data.map((_, i) => (
                    <Cell key={i} fill={colors[i % colors.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-col gap-2.5 text-[14px] text-black dark:text-white">
            {data.map((r, i) => {
              const pct = Math.round((r.value / total) * 100);
              return (
                <div key={r.name} className="flex items-center gap-2">
                  <span
                    className="size-3 shrink-0 rounded-full"
                    style={{ background: colors[i % colors.length] }}
                  />
                  <span className="font-medium">{r.name}</span>
                  <span className="text-black/50 dark:text-white/70">{pct}%</span>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <p className="mt-4 rounded-[10px] border border-dashed border-black/20 px-4 py-6 text-center text-[15px] text-black/40 dark:border-white/20 dark:text-white/65">
          Belum ada data.
        </p>
      )}
    </div>
  );
}

export default function OdCharts({
  regionData,
  universityData,
  spendingData,
}: {
  regionData: RegionDatum[];
  universityData: UniversityDatum[];
  spendingData: SpendingDatum[];
}) {
  return (
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
      {/* Line chart — Tren Pengeluaran Uang Saku */}
      <div className={cardClass}>
        <p className={titleClass}>Tren Pengeluaran Uang Saku</p>
        <p className={subtitleClass}>{rangeLabel(spendingData)}</p>
        {spendingData.length > 0 ? (
          <div className="mt-4 h-[220px] text-[#6f6f6f] dark:text-white/75">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={spendingData} margin={{ top: 8, right: 12, left: -18, bottom: 0 }}>
                <CartesianGrid stroke="currentColor" strokeOpacity={0.15} vertical={false} />
                <XAxis
                  dataKey="bulan"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "currentColor", fontSize: 11 }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "currentColor", fontSize: 12 }}
                  tickFormatter={formatRupiahShort}
                />
                <Tooltip
                  cursor={{ stroke: "currentColor", strokeOpacity: 0.2 }}
                  contentStyle={tooltipStyle}
                  formatter={(value) => [`Rp ${rupiah.format(Number(value))}`, "Pengeluaran"]}
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
        ) : (
          <p className="mt-4 rounded-[10px] border border-dashed border-black/20 px-4 py-6 text-center text-[15px] text-black/40 dark:border-white/20 dark:text-white/65">
            Belum ada data.
          </p>
        )}
      </div>

      {/* Pie — Komposisi Universitas/Instansi */}
      <PieCard
        title="Komposisi Universitas/Instansi"
        subtitle="per hari ini"
        data={universityData}
        colors={UNIVERSITY_COLORS}
      />

      {/* Pie — Komposisi Asal Daerah Anak Magang */}
      <PieCard
        title="Komposisi Asal Daerah Anak Magang"
        subtitle="per hari ini"
        data={regionData}
        colors={REGION_COLORS}
      />
    </div>
  );
}
