import { useState } from "react";
import { motion } from "framer-motion";
import { X, BarChart3, Table, Hash } from "lucide-react";

const ICONS = {
  chart: BarChart3,
  table: Table,
  stat: Hash,
};

const STAT_OPTIONS = [
  { metric: "totalRevenue", title: "Total Revenue", prefix: "$" },
  { metric: "totalMargin", title: "Total Margin", prefix: "$" },
  { metric: "totalCost", title: "Total Cost", prefix: "$" },
  { metric: "totalDeals", title: "Deals Closed" },
];

const CHART_OPTIONS = [
  { groupBy: "region", metric: "revenue", chartType: "bar", title: "Revenue by Region" },
  { groupBy: "product", metric: "revenue", chartType: "bar", title: "Revenue by Product" },
  { groupBy: "region", metric: "margin", chartType: "pie", title: "Margin Share by Region" },
];

const AddWidgetModal = ({ allowedWidgets, onAdd, onClose }) => {
  const [tab, setTab] = useState(allowedWidgets[0] || "chart");

  const tabs = allowedWidgets;

  const make = (type, presetIdx) => {
    const id = `w-${type}-${Date.now()}`;
    if (type === "stat") {
      const p = STAT_OPTIONS[presetIdx];
      return { i: id, type, title: p.title, dataset: "sales", config: { metric: p.metric, prefix: p.prefix }, x: 0, y: Infinity, w: 3, h: 2 };
    }
    if (type === "chart") {
      const p = CHART_OPTIONS[presetIdx];
      return { i: id, type, title: p.title, dataset: "sales", config: p, x: 0, y: Infinity, w: 6, h: 4 };
    }
    if (type === "table") {
      return { i: id, type, title: "Sales Records", dataset: "sales", config: {}, x: 0, y: Infinity, w: 6, h: 4 };
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: 24, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 24, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-2xl rounded-2xl bg-slate-900 border border-white/10 shadow-2xl overflow-hidden"
      >
        <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between">
          <h2 className="font-semibold">Add a widget</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/10">
            <X className="size-5" />
          </button>
        </div>

        {tabs.length === 0 ? (
          <div className="p-8 text-sm text-slate-400 text-center">
            Your role is not allowed to add any widget types.
          </div>
        ) : (
          <>
            <div className="px-5 pt-4 flex gap-2">
              {tabs.map((t) => {
                const Icon = ICONS[t];
                return (
                  <button
                    key={t}
                    onClick={() => setTab(t)}
                    className={`text-xs px-3 py-1.5 rounded-lg border inline-flex items-center gap-1.5 capitalize transition ${
                      tab === t
                        ? "bg-indigo-500/15 border-indigo-500/40 text-indigo-200"
                        : "bg-white/5 border-white/10 text-slate-300 hover:bg-white/10"
                    }`}
                  >
                    <Icon className="size-3.5" />
                    {t}
                  </button>
                );
              })}
            </div>

            <div className="p-5 grid sm:grid-cols-2 gap-3">
              {tab === "stat" &&
                STAT_OPTIONS.map((p, i) => (
                  <button
                    key={p.metric}
                    onClick={() => onAdd(make("stat", i))}
                    className="text-left rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 hover:border-indigo-500/40 p-4 transition"
                  >
                    <div className="text-xs text-slate-400 uppercase tracking-wide">{p.title}</div>
                    <div className="text-lg font-semibold mt-1">stat · {p.metric}</div>
                  </button>
                ))}
              {tab === "chart" &&
                CHART_OPTIONS.map((p, i) => (
                  <button
                    key={p.title}
                    onClick={() => onAdd(make("chart", i))}
                    className="text-left rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 hover:border-indigo-500/40 p-4 transition"
                  >
                    <div className="text-xs text-slate-400 uppercase tracking-wide">
                      {p.chartType} · grouped by {p.groupBy}
                    </div>
                    <div className="text-lg font-semibold mt-1">{p.title}</div>
                  </button>
                ))}
              {tab === "table" && (
                <button
                  onClick={() => onAdd(make("table"))}
                  className="text-left rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 hover:border-indigo-500/40 p-4 transition sm:col-span-2"
                >
                  <div className="text-xs text-slate-400 uppercase tracking-wide">table</div>
                  <div className="text-lg font-semibold mt-1">Sales Records</div>
                  <div className="text-xs text-slate-400 mt-1">
                    Hidden columns will be enforced by your role.
                  </div>
                </button>
              )}
            </div>
          </>
        )}
      </motion.div>
    </motion.div>
  );
};

export default AddWidgetModal;
