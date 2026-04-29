import { useEffect, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { motion } from "framer-motion";
import { ClipboardList } from "lucide-react";
import { AUDIT } from "../services/api";

const formatDate = (d) =>
  new Date(d).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });

const actionColor = (a) => {
  if (a?.endsWith(".create")) return "text-emerald-300 bg-emerald-500/10 border-emerald-500/30";
  if (a?.endsWith(".update") || a?.endsWith(".assign-roles"))
    return "text-amber-300 bg-amber-500/10 border-amber-500/30";
  if (a?.endsWith(".delete")) return "text-rose-300 bg-rose-500/10 border-rose-500/30";
  return "text-slate-300 bg-slate-500/10 border-slate-500/30";
};

const AuditPage = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await axios.get(AUDIT.GET_ALL);
        setLogs(res.data.logs);
      } catch (e) {
        toast.error(e.response?.data?.message || "Failed to load audit logs");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2">
          <ClipboardList className="size-7 text-indigo-400" />
          Audit Log
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Every role change and role assignment is recorded here.
        </p>
      </div>

      {loading ? (
        <div className="text-center py-20">
          <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto" />
        </div>
      ) : logs.length === 0 ? (
        <div className="text-center py-16 text-slate-400 text-sm">No activity yet.</div>
      ) : (
        <ul className="space-y-2">
          {logs.map((l, idx) => (
            <motion.li
              key={l._id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.02 }}
              className="rounded-lg border border-white/10 bg-white/5 px-4 py-3 flex items-start sm:items-center gap-3 flex-col sm:flex-row"
            >
              <div className="text-xs text-slate-400 sm:w-44 shrink-0">{formatDate(l.createdAt)}</div>
              <span className={`text-[11px] uppercase tracking-wide px-2 py-0.5 rounded border ${actionColor(l.action)}`}>
                {l.action}
              </span>
              <div className="flex-1">
                <span className="text-slate-200">{l.actorName || "Unknown"}</span>
                <span className="text-slate-500"> · target </span>
                <span className="text-slate-200 font-medium">{l.target}</span>
              </div>
            </motion.li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default AuditPage;
