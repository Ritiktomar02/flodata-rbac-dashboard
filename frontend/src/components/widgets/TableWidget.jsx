import { useEffect, useState } from "react";
import axios from "axios";
import { DASHBOARD } from "../../services/api";

// Renders a dataset table with whatever fields the API decides to send.
// The backend hides restricted columns based on the user's field rules,
// so the UI just renders what it receives — keeping us honest.
const TableWidget = ({ widget }) => {
  const { dataset = "sales" } = widget;
  const [data, setData] = useState({ rows: [], visibleFields: [], hiddenFields: [] });
  const [error, setError] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await axios.get(DASHBOARD.DATASET(dataset));
        setData({
          rows: res.data.rows,
          visibleFields: res.data.visibleFields,
          hiddenFields: res.data.hiddenFields || [],
        });
      } catch (e) {
        setError(e.response?.data?.message || "Failed to load");
      }
    })();
  }, [dataset]);

  if (error) {
    return (
      <div className="h-full flex items-center justify-center text-sm text-amber-300/90 px-2 text-center">
        {error}
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col min-h-0">
      <div className="text-xs text-slate-400 mb-2 flex items-center justify-between">
        <span>{widget.title}</span>
        {data.hiddenFields?.length > 0 && (
          <span className="text-[10px] text-rose-300/80">
            {data.hiddenFields.length} field{data.hiddenFields.length === 1 ? "" : "s"} hidden by role
          </span>
        )}
      </div>
      <div className="flex-1 overflow-auto thin-scroll rounded-lg border border-white/10">
        <table className="min-w-full text-xs">
          <thead className="bg-slate-900/70 sticky top-0">
            <tr>
              {data.visibleFields.map((f) => (
                <th key={f} className="text-left px-3 py-2 font-medium capitalize">
                  {f}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.rows.map((row, i) => (
              <tr key={i} className="border-t border-white/5 hover:bg-white/5">
                {data.visibleFields.map((f) => (
                  <td key={f} className="px-3 py-1.5 text-slate-200 whitespace-nowrap">
                    {typeof row[f] === "number" ? row[f].toLocaleString() : row[f]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TableWidget;
