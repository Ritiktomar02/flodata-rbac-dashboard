import { useContext, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { motion } from "framer-motion";
import { X, Save, Lock } from "lucide-react";
import UserContext from "../context/UserContext";
import { AUTH } from "../services/api";

// Used for both Create and Edit. In Edit mode, we pass `user` and the
// `email` field becomes disabled if the current role's `users.email` is
// flagged read-only — same flag the backend will reject changes against.
const UserFormModal = ({ mode, user, roles, onClose, onSaved }) => {
  const { fieldReadOnly } = useContext(UserContext);
  const isEdit = mode === "edit";

  const [username, setUsername] = useState(user?.username || "");
  const [email, setEmail] = useState(user?.email || "");
  const [password, setPassword] = useState("");
  const [roleIds, setRoleIds] = useState(
    user?.roles?.map((r) => r._id) || []
  );
  const [saving, setSaving] = useState(false);

  const usernameLocked = isEdit && fieldReadOnly("users", "username");
  const emailLocked    = isEdit && fieldReadOnly("users", "email");

  const toggleRole = (id) =>
    setRoleIds((prev) =>
      prev.includes(id) ? prev.filter((r) => r !== id) : [...prev, id]
    );

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username.trim()) return toast.error("Username is required");
    if (!isEdit) {
      if (!email.trim()) return toast.error("Email is required");
      if (!password || password.length < 8) return toast.error("Password must be at least 8 characters");
    }

    setSaving(true);
    try {
      if (isEdit) {
        const body = {};
        if (!usernameLocked) body.username = username;
        if (!emailLocked && email !== user.email) body.email = email;
        await axios.put(AUTH.UPDATE_USER(user._id), body);
        if (roleIds.join() !== (user.roles || []).map((r) => r._id).join()) {
          await axios.put(AUTH.ASSIGN_ROLES, { userId: user._id, roleIds });
        }
        toast.success("User updated");
      } else {
        await axios.post(AUTH.CREATE_USER, { username, email, password, roleIds });
        toast.success("User created");
      }
      onSaved?.();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || "Save failed");
    } finally {
      setSaving(false);
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
        className="w-full max-w-md rounded-2xl bg-slate-900 border border-white/10 shadow-2xl overflow-hidden"
      >
        <form onSubmit={handleSubmit}>
          <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between">
            <h2 className="font-semibold">{isEdit ? `Edit user: ${user.username}` : "Create new user"}</h2>
            <button type="button" onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/10">
              <X className="size-5" />
            </button>
          </div>

          <div className="p-5 space-y-4">
            <Field
              label="Username"
              value={username}
              onChange={setUsername}
              locked={usernameLocked}
              placeholder="Full name"
            />
            <Field
              label="Email"
              type="email"
              value={email}
              onChange={setEmail}
              locked={emailLocked || isEdit && false}
              placeholder="user@flodata.test"
              disabledHint="Read-only for your role"
            />
            {!isEdit && (
              <Field
                label="Password"
                type="password"
                value={password}
                onChange={setPassword}
                placeholder="Min 8 characters"
              />
            )}

            <div>
              <div className="text-xs text-slate-400 mb-1">Roles</div>
              <div className="flex flex-wrap gap-1.5">
                {roles.map((r) => {
                  const on = roleIds.includes(r._id);
                  return (
                    <button
                      key={r._id}
                      type="button"
                      onClick={() => toggleRole(r._id)}
                      className={`text-xs px-3 py-1.5 rounded-md border transition ${
                        on
                          ? "bg-indigo-500/15 border-indigo-500/40 text-indigo-200"
                          : "bg-white/5 border-white/10 text-slate-300 hover:bg-white/10"
                      }`}
                    >
                      {r.name}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="px-5 py-3 border-t border-white/10 flex justify-end gap-2 bg-slate-950/60">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 px-5 py-2 rounded-lg bg-gradient-to-r from-indigo-500 to-fuchsia-600 hover:from-indigo-400 hover:to-fuchsia-500 font-medium text-sm shadow-lg disabled:opacity-50"
            >
              <Save className="size-4" />
              {saving ? "Saving..." : isEdit ? "Save changes" : "Create user"}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
};

const Field = ({ label, type = "text", value, onChange, locked, placeholder, disabledHint }) => (
  <div>
    <div className="text-xs text-slate-400 mb-1 flex items-center gap-2">
      <span>{label}</span>
      {locked && (
        <span className="inline-flex items-center gap-1 text-[10px] text-amber-300/90">
          <Lock className="size-3" />
          {disabledHint || "Read-only"}
        </span>
      )}
    </div>
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={locked}
      placeholder={placeholder}
      className={`w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-1 transition ${
        locked
          ? "bg-slate-900/60 border-amber-500/30 text-slate-400 cursor-not-allowed"
          : "bg-slate-800/60 border-white/10 focus:border-indigo-500 focus:ring-indigo-500/40"
      }`}
    />
  </div>
);

export default UserFormModal;
