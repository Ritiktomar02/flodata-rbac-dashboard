import { useContext, useEffect, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import { Responsive, WidthProvider } from "react-grid-layout";
import {
  LayoutDashboard,
  Plus,
  Save,
  RotateCcw,
  Edit3,
  Eye,
  X,
  Lock,
} from "lucide-react";
import UserContext from "../context/UserContext";
import { DASHBOARD } from "../services/api";

import StatWidget from "../components/widgets/StatWidget";
import TableWidget from "../components/widgets/TableWidget";
import ChartWidget from "../components/widgets/ChartWidget";
import AddWidgetModal from "../components/dashboard/AddWidgetModal";

const ResponsiveGridLayout = WidthProvider(Responsive);

const RENDERERS = {
  stat: StatWidget,
  table: TableWidget,
  chart: ChartWidget,
};

const Dashboard = () => {
  const { user, auth, can } = useContext(UserContext);
  const [widgets, setWidgets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [adding, setAdding] = useState(false);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

  const canEdit = auth.dashboard?.canEditLayout && can("dashboard", "update");
  const allowedWidgets = auth.dashboard?.allowedWidgets || [];

  const load = async () => {
    setLoading(true);
    try {
      const res = await axios.get(DASHBOARD.ME);
      setWidgets(res.data.dashboard.widgets || []);
      setDirty(false);
    } catch (e) {
      toast.error(e.response?.data?.message || "Failed to load dashboard");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  // Filter out widgets whose type isn't allowed for this user. We don't
  // delete them server-side though — switching to a more permissive role
  // restores them.
  const visibleWidgets = widgets.filter((w) => allowedWidgets.includes(w.type) || allowedWidgets.length === 0);

  // Widget x/w are stored as 12-col coordinates. For each breakpoint, scale
  // them to that breakpoint's column count so the dashboard is responsive.
  const COLS = { lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 };
  const scaleLayout = (cols) =>
    visibleWidgets.map((w) => {
      const scale = cols / 12;
      const newW = Math.max(1, Math.min(cols, Math.round(w.w * scale)));
      const newX = Math.max(0, Math.min(cols - newW, Math.floor(w.x * scale)));
      return { i: w.i, x: newX, y: w.y, w: newW, h: w.h, minW: 1, minH: 2 };
    });
  const layouts = Object.fromEntries(
    Object.entries(COLS).map(([bp, cols]) => [bp, scaleLayout(cols)])
  );

  const onLayoutChange = (next) => {
    if (!editing) return;
    setWidgets((prev) =>
      prev.map((w) => {
        const m = next.find((l) => l.i === w.i);
        return m ? { ...w, x: m.x, y: m.y, w: m.w, h: m.h } : w;
      })
    );
    setDirty(true);
  };

  const handleAdd = (widget) => {
    setWidgets((prev) => [...prev, widget]);
    setAdding(false);
    setDirty(true);
  };

  const handleRemove = (id) => {
    setWidgets((prev) => prev.filter((w) => w.i !== id));
    setDirty(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await axios.put(DASHBOARD.ME, { widgets });
      toast.success("Dashboard saved");
      setDirty(false);
      setEditing(false);
    } catch (e) {
      toast.error(e.response?.data?.message || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    if (!confirm("Reset to the default dashboard layout?")) return;
    try {
      const res = await axios.post(DASHBOARD.RESET);
      setWidgets(res.data.dashboard.widgets || []);
      setDirty(false);
      toast.success("Dashboard reset");
    } catch (e) {
      toast.error(e.response?.data?.message || "Reset failed");
    }
  };

  return (
    <div className="max-w-[1600px] mx-auto px-4 sm:px-6 py-6 sm:py-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2">
            <LayoutDashboard className="size-7 text-indigo-400" />
            My Dashboard
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Hi {user?.username?.split(" ")[0]} — your role determines what widgets and fields you
            can see.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {!canEdit && (
            <span className="inline-flex items-center gap-1.5 text-xs text-slate-300 bg-white/5 border border-white/10 px-3 py-1.5 rounded-lg">
              <Lock className="size-3.5" />
              View-only mode
            </span>
          )}

          {canEdit && !editing && (
            <button
              onClick={() => setEditing(true)}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-white/5 border border-white/10 hover:border-indigo-500/40 hover:bg-white/10 text-sm transition"
            >
              <Edit3 className="size-4" />
              Edit layout
            </button>
          )}

          {canEdit && editing && (
            <>
              <button
                onClick={() => setAdding(true)}
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-white/5 border border-white/10 hover:border-indigo-500/40 hover:bg-white/10 text-sm transition"
              >
                <Plus className="size-4" />
                Add widget
              </button>
              <button
                onClick={handleReset}
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-white/5 border border-white/10 hover:border-amber-500/40 hover:text-amber-200 text-sm transition"
              >
                <RotateCcw className="size-4" />
                Reset
              </button>
              <button
                onClick={() => {
                  setEditing(false);
                  load();
                }}
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 text-sm transition"
                title="Discard unsaved changes"
              >
                <Eye className="size-4" />
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={!dirty || saving}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition ${
                  dirty
                    ? "bg-gradient-to-r from-indigo-500 to-fuchsia-600 hover:from-indigo-400 hover:to-fuchsia-500 shadow-lg"
                    : "bg-slate-800 text-slate-500 cursor-not-allowed"
                }`}
              >
                <Save className="size-4" />
                {saving ? "Saving..." : "Save"}
              </button>
            </>
          )}
        </div>
      </div>

      {loading ? (
        <div className="text-center py-20">
          <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto" />
        </div>
      ) : visibleWidgets.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/10 p-12 text-center">
          <p className="text-slate-300">No widgets yet.</p>
          {canEdit && (
            <button
              onClick={() => {
                setEditing(true);
                setAdding(true);
              }}
              className="mt-3 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-indigo-500 to-fuchsia-600 text-white text-sm font-medium shadow-lg hover:from-indigo-400 hover:to-fuchsia-500 transition"
            >
              <Plus className="size-4" />
              Add your first widget
            </button>
          )}
        </div>
      ) : (
        <ResponsiveGridLayout
          className="layout"
          layouts={layouts}
          breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
          cols={{ lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 }}
          rowHeight={70}
          isDraggable={editing}
          isResizable={editing}
          onLayoutChange={(_, all) => onLayoutChange(all.lg || [])}
          margin={[16, 16]}
          draggableCancel=".no-drag"
        >
          {visibleWidgets.map((w) => {
            const Renderer = RENDERERS[w.type];
            return (
              <div
                key={w.i}
                className={`group rounded-2xl border ${
                  editing ? "border-indigo-500/30" : "border-white/10"
                } bg-slate-900/60 backdrop-blur-sm shadow-lg overflow-hidden`}
              >
                <div className="h-full flex flex-col p-4 min-h-0 relative">
                  {editing && (
                    <button
                      onClick={() => handleRemove(w.i)}
                      className="no-drag absolute top-2 right-2 z-10 p-1 rounded-lg bg-rose-500/20 hover:bg-rose-500/40 text-rose-200 opacity-0 group-hover:opacity-100 transition"
                      title="Remove widget"
                    >
                      <X className="size-3.5" />
                    </button>
                  )}
                  {Renderer ? <Renderer widget={w} /> : <div>Unknown widget</div>}
                </div>
              </div>
            );
          })}
        </ResponsiveGridLayout>
      )}

      <AnimatePresence>
        {adding && (
          <AddWidgetModal
            allowedWidgets={allowedWidgets}
            onAdd={handleAdd}
            onClose={() => setAdding(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default Dashboard;
