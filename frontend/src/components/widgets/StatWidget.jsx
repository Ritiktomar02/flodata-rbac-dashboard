import { useEffect, useState } from "react";
import axios from "axios";
import { TrendingUp } from "lucide-react";
import { DASHBOARD } from "../../services/api";

const formatNumber = (n) => {
  if (typeof n !== "number") return "—";
  if (Math.abs(n) >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (Math.abs(n) >= 1_000) return (n / 1_000).toFixed(1) + "K";
  return n.toLocaleString();
};

const StatWidget = ({ widget }) => {
  const { metric, prefix = "" } = widget.config || {};
  const [value, setValue] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await axios.get(DASHBOARD.STATS);
        // The backend may not return certain metrics for restricted roles —
        // e.g. a Viewer won't get totalMargin. Show a clear "restricted" message.
        if (!(metric in res.data.stats)) {
          setError("Restricted by your role");
          return;
        }
        setValue(res.data.stats[metric]);
      } catch (e) {
        setError(e.response?.data?.message || "Failed to load");
      }
    })();
  }, [metric]);

  return (
    <div className="h-full flex flex-col justify-between">
      <div className="flex items-start justify-between">
        <div className="text-xs text-slate-400 uppercase tracking-wide">{widget.title}</div>
        <TrendingUp className="size-4 text-indigo-300" />
      </div>
      <div>
        {error ? (
          <div className="text-sm text-amber-300/90">{error}</div>
        ) : (
          <div className="text-3xl font-bold tracking-tight bg-gradient-to-r from-white to-slate-300 text-transparent bg-clip-text">
            {prefix}
            {value === null ? "..." : formatNumber(value)}
          </div>
        )}
      </div>
    </div>
  );
};

export default StatWidget;
