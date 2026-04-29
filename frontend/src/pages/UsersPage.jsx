import { useContext, useEffect, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import { Users, Save, Plus, Pencil, Trash2 } from "lucide-react";
import UserContext from "../context/UserContext";
import { AUTH, ROLES } from "../services/api";
import UserFormModal from "../components/UserFormModal";

const UsersPage = () => {
  const { can, refreshProfile, user: me } = useContext(UserContext);
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState(null);
  const [draft, setDraft] = useState({}); // { userId: [roleId, ...] }
  const [editing, setEditing] = useState(null); // { mode: 'create' | 'edit', user? }

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [u, r] = await Promise.all([
        axios.get(AUTH.GET_ALL_USERS),
        can("roles", "read") ? axios.get(ROLES.GET_ALL) : Promise.resolve({ data: { roles: [] } }),
      ]);
      setUsers(u.data.users);
      setRoles(r.data.roles);

      const next = {};
      for (const usr of u.data.users) {
        next[usr._id] = (usr.roles || []).map((rl) => rl._id);
      }
      setDraft(next);
    } catch (e) {
      toast.error(e.response?.data?.message || "Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const toggleRole = (userId, roleId) => {
    setDraft((prev) => {
      const cur = prev[userId] || [];
      return {
        ...prev,
        [userId]: cur.includes(roleId) ? cur.filter((r) => r !== roleId) : [...cur, roleId],
      };
    });
  };

  const saveRoleAssignment = async (userId) => {
    setSavingId(userId);
    try {
      await axios.put(AUTH.ASSIGN_ROLES, { userId, roleIds: draft[userId] || [] });
      toast.success("Roles updated");
      if (userId === me?._id) await refreshProfile();
      fetchAll();
    } catch (e) {
      toast.error(e.response?.data?.message || "Save failed");
    } finally {
      setSavingId(null);
    }
  };

  const deleteUser = async (u) => {
    if (u._id === me?._id) return toast.error("You can't delete yourself");
    if (!confirm(`Delete user ${u.email}? This cannot be undone.`)) return;
    try {
      await axios.delete(AUTH.DELETE_USER(u._id));
      toast.success("User deleted");
      fetchAll();
    } catch (e) {
      toast.error(e.response?.data?.message || "Delete failed");
    }
  };

  const isDirty = (u) => {
    const original = (u.roles || []).map((r) => r._id).sort().join(",");
    const current = (draft[u._id] || []).slice().sort().join(",");
    return original !== current;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2">
            <Users className="size-7 text-indigo-400" />
            Users
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Create users, edit profile fields (read-only fields enforced server-side), and assign one or more roles.
          </p>
        </div>
        {can("users", "create") && (
          <button
            onClick={() => setEditing({ mode: "create" })}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-indigo-500 to-fuchsia-600 hover:from-indigo-400 hover:to-fuchsia-500 text-white rounded-lg font-medium shadow-lg transition"
          >
            <Plus className="size-4" />
            New User
          </button>
        )}
      </div>

      {loading ? (
        <div className="text-center py-20">
          <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto" />
        </div>
      ) : (
        <div className="rounded-xl border border-white/10 bg-white/5 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-900/60">
                <tr>
                  <th className="text-left px-4 py-3 font-medium">User</th>
                  <th className="text-left px-4 py-3 font-medium">Email</th>
                  {roles.map((r) => (
                    <th key={r._id} className="px-3 py-3 text-center font-medium">{r.name}</th>
                  ))}
                  <th className="px-4 py-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u, idx) => (
                  <motion.tr
                    key={u._id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.02 }}
                    className="border-t border-white/5 hover:bg-white/5"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="size-8 rounded-full bg-gradient-to-br from-indigo-500 to-fuchsia-500 grid place-items-center font-bold text-xs">
                          {u.username?.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-medium">{u.username}</div>
                          {u._id === me?._id && (
                            <div className="text-[10px] text-indigo-300">you</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-300">{u.email}</td>
                    {roles.map((r) => {
                      const assigned = (draft[u._id] || []).includes(r._id);
                      return (
                        <td key={r._id} className="px-3 py-3 text-center">
                          <input
                            type="checkbox"
                            checked={assigned}
                            disabled={!can("users", "update")}
                            onChange={() => toggleRole(u._id, r._id)}
                            className="size-4 accent-indigo-500"
                          />
                        </td>
                      );
                    })}
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        {can("users", "update") && isDirty(u) && (
                          <button
                            onClick={() => saveRoleAssignment(u._id)}
                            disabled={savingId === u._id}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs bg-gradient-to-r from-indigo-500 to-fuchsia-600 hover:from-indigo-400 hover:to-fuchsia-500 text-white shadow-md"
                            title="Save role assignment"
                          >
                            <Save className="size-3.5" />
                            {savingId === u._id ? "..." : "Save"}
                          </button>
                        )}
                        {can("users", "update") && (
                          <button
                            onClick={() => setEditing({ mode: "edit", user: u })}
                            className="p-1.5 rounded-lg hover:bg-white/10 text-slate-300 hover:text-white"
                            title="Edit profile"
                          >
                            <Pencil className="size-4" />
                          </button>
                        )}
                        {can("users", "delete") && u._id !== me?._id && (
                          <button
                            onClick={() => deleteUser(u)}
                            className="p-1.5 rounded-lg hover:bg-rose-500/15 text-slate-300 hover:text-rose-300"
                            title="Delete user"
                          >
                            <Trash2 className="size-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <AnimatePresence>
        {editing && (
          <UserFormModal
            mode={editing.mode}
            user={editing.user}
            roles={roles}
            onClose={() => setEditing(null)}
            onSaved={fetchAll}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default UsersPage;
