import { useEffect, useState } from "react";
import axios from "axios";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { DASHBOARD } from "../../services/api";

const COLORS = ["#818cf8", "#c084fc", "#22d3ee", "#f472b6", "#34d399", "#facc15"];

// Sales metrics shown in this widget are all dollar amounts. If we ever add
// non-currency metrics, swap on `metric` here.
const formatMoney = (n) =>
  typeof n === "number" ? `$${n.toLocaleString()}` : n;

const capitalize = (s) => s.charAt(0).toUpperCase() + s.slice(1);

const tooltipStyle = {
  background: "#0f172a",
  border: "1px solid rgba(255,255,255,0.1)",
  borderRadius: 8,
  fontSize: 12,
  padding: "6px 10px",
};
const itemStyle = { color: "#e2e8f0" };
const labelStyle = { color: "#94a3b8", marginBottom: 4 };

const ChartWidget = ({ widget }) => {
  const { dataset = "sales" } = widget;
  const { groupBy = "region", metric = "revenue", chartType = "bar" } = widget.config || {};
  const [rows, setRows] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await axios.get(DASHBOARD.DATASET(dataset));
        setRows(res.data.rows);
        if (res.data.rows.length && !(metric in res.data.rows[0])) {
          setError(`"${metric}" hidden by your role`);
        }
      } catch (e) {
        setError(e.response?.data?.message || "Failed to load");
      }
    })();
  }, [dataset, metric]);

  if (error) {
    return (
      <div className="h-full flex items-center justify-center text-sm text-amber-300/90 px-2 text-center">
        {error}
      </div>
    );
  }

  const map = new Map();
  for (const r of rows) {
    const key = r[groupBy];
    map.set(key, (map.get(key) || 0) + (r[metric] || 0));
  }
  const data = Array.from(map.entries()).map(([name, value]) => ({ name, value }));

  const metricLabel = capitalize(metric);
  // Bar chart: tooltip shows "<region>" as title and "Revenue: $75,700" as the row.
  // Pie chart: tooltip shows the slice name on top and "<metric>: $value" below.
  const tooltipFormatter = (value) => [formatMoney(value), metricLabel];

  return (
    <div className="h-full flex flex-col min-h-0">
      <div className="text-xs text-slate-400 mb-1">{widget.title}</div>
      <div className="flex-1 min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          {chartType === "pie" ? (
            <PieChart>
              <Tooltip
                contentStyle={tooltipStyle}
                itemStyle={itemStyle}
                labelStyle={labelStyle}
                formatter={tooltipFormatter}
              />
              <Legend wrapperStyle={{ fontSize: 11, color: "#cbd5e1" }} />
              <Pie data={data} dataKey="value" nameKey="name" outerRadius="75%" label={false}>
                {data.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
            </PieChart>
          ) : (
            <BarChart data={data} margin={{ top: 8, right: 12, left: 8, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
              <XAxis dataKey="name" tick={{ fill: "#94a3b8", fontSize: 11 }} />
              <YAxis
                tick={{ fill: "#94a3b8", fontSize: 11 }}
                tickFormatter={(v) => (v >= 1000 ? `${v / 1000}k` : v)}
              />
              <Tooltip
                contentStyle={tooltipStyle}
                itemStyle={itemStyle}
                labelStyle={labelStyle}
                cursor={{ fill: "rgba(99,102,241,0.08)" }}
                formatter={tooltipFormatter}
              />
              <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                {data.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default ChartWidget;
