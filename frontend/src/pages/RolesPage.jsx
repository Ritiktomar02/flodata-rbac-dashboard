import { useContext, useEffect, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Trash2,
  Pencil,
  ShieldCheck,
  Lock,
  X,
  Save,
} from "lucide-react";
import UserContext from "../context/UserContext";
import { ROLES } from "../services/api";
import RoleEditor from "../components/RoleEditor";

const RolesPage = () => {
  const { can } = useContext(UserContext);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null); // role being edited (or "new")

  const fetchRoles = async () => {
    setLoading(true);
    try {
      const res = await axios.get(ROLES.GET_ALL);
      setRoles(res.data.roles);
    } catch (e) {
      toast.error(e.response?.data?.message || "Failed to load roles");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoles();
  }, []);

  const handleDelete = async (role) => {
    if (role.isSystem) return toast.error("System roles can't be deleted");
    if (!confirm(`Delete role "${role.name}"? Users still assigned to it will lose this access.`)) return;
    try {
      await axios.delete(ROLES.DELETE(role._id));
      toast.success("Role deleted");
      fetchRoles();
    } catch (e) {
      toast.error(e.response?.data?.message || "Delete failed");
    }
  };

  const handleSave = async (payload, roleId) => {
    try {
      if (roleId) {
        await axios.put(ROLES.UPDATE(roleId), payload);
        toast.success("Role updated");
      } else {
        await axios.post(ROLES.CREATE, payload);
        toast.success("Role created");
      }
      setEditing(null);
      fetchRoles();
    } catch (e) {
      toast.error(e.response?.data?.message || "Save failed");
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2">
            <ShieldCheck className="size-7 text-indigo-400" />
            Roles & Permissions
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Define what each role can see and do — module level, action level, and field level.
          </p>
        </div>
        {can("roles", "create") && (
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() =>
              setEditing({
                _id: null,
                name: "",
                description: "",
                permissions: [],
                fieldRules: [],
                dashboard: { canEditLayout: false, allowedWidgets: [] },
              })
            }
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-indigo-500 to-fuchsia-600 text-white rounded-lg font-medium shadow-lg hover:from-indigo-400 hover:to-fuchsia-500 transition"
          >
            <Plus className="size-4" />
            New Role
          </motion.button>
        )}
      </div>

      {loading ? (
        <div className="text-center py-20">
          <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto" />
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {roles.map((r) => (
            <motion.div
              key={r._id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-xl border border-white/10 bg-white/5 p-5 hover:border-indigo-500/40 transition"
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-white text-lg">{r.name}</h3>
                    {r.isSystem && (
                      <span className="text-[10px] uppercase tracking-wide px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 inline-flex items-center gap-1">
                        <Lock className="size-2.5" />
                        system
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 mt-1">{r.description || "No description"}</p>
                </div>
                <div className="flex items-center gap-1">
                  {can("roles", "update") && (
                    <button
                      onClick={() => setEditing(r)}
                      className="p-1.5 rounded-lg hover:bg-white/10 text-slate-300 hover:text-white"
                      title="Edit"
                    >
                      <Pencil className="size-4" />
                    </button>
                  )}
                  {can("roles", "delete") && !r.isSystem && (
                    <button
                      onClick={() => handleDelete(r)}
                      className="p-1.5 rounded-lg hover:bg-rose-500/15 text-slate-300 hover:text-rose-300"
                      title="Delete"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex flex-wrap gap-1.5">
                  {r.permissions?.length === 0 && (
                    <span className="text-xs text-slate-500">No module permissions</span>
                  )}
                  {r.permissions?.map((p) => (
                    <span
                      key={p.module}
                      className="text-[11px] px-2 py-0.5 rounded-md bg-slate-800/80 border border-white/10 text-slate-200"
                    >
                      {p.module}: {p.actions.join(",")}
                    </span>
                  ))}
                </div>

                {r.fieldRules?.length > 0 && (
                  <div className="text-[11px] text-slate-400">
                    Field rules:{" "}
                    {r.fieldRules
                      .map(
                        (fr) =>
                          `${fr.module}(${fr.hiddenFields?.length || 0} hidden, ${fr.readOnlyFields?.length || 0} read-only)`
                      )
                      .join(" · ")}
                  </div>
                )}

                <div className="text-[11px] text-slate-400">
                  Dashboard: {r.dashboard?.canEditLayout ? "can edit layout" : "view only"}
                  {r.dashboard?.allowedWidgets?.length
                    ? ` · widgets: ${r.dashboard.allowedWidgets.join(", ")}`
                    : ""}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      <AnimatePresence>
        {editing && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-4"
            onClick={() => setEditing(null)}
          >
            <motion.div
              initial={{ y: 24, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 24, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-3xl max-h-[90vh] overflow-hidden rounded-2xl bg-slate-900 border border-white/10 shadow-2xl flex flex-col"
            >
              <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Save className="size-4 text-indigo-400" />
                  <h2 className="font-semibold">
                    {editing._id ? `Edit role: ${editing.name}` : "Create new role"}
                  </h2>
                </div>
                <button
                  onClick={() => setEditing(null)}
                  className="p-1.5 rounded-lg hover:bg-white/10"
                >
                  <X className="size-5" />
                </button>
              </div>

              <RoleEditor
                role={editing}
                onCancel={() => setEditing(null)}
                onSave={(payload) => handleSave(payload, editing._id)}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default RolesPage;
