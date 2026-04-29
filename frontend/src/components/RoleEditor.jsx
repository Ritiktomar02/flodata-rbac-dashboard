import { useState } from "react";
import { Trash2, Plus } from "lucide-react";

// Modules + actions in the permission matrix.
// Modules cover both feature pages (dashboard, users, roles, audit) and
// data sources (sales). Adding a new entry here exposes it in the UI.
const MODULES = ["dashboard", "users", "roles", "sales", "audit"];
const ACTIONS = ["create", "read", "update", "delete"];
const WIDGETS = ["chart", "table", "stat"];

// Per-module: which actions are actually wired to a route or a UI control.
// Cells outside this map render as "—" to avoid pretending they do something.
const SUPPORTED_ACTIONS = {
  dashboard: ["read", "update"],
  users:     ["create", "read", "update", "delete"],
  roles:     ["create", "read", "update", "delete"],
  sales:     ["read"],
  audit:     ["read"],
};

// Field catalog per module — shown in the field-rules editor so admins pick
// from a known set rather than typing field names by hand. Each module also
// declares which kinds of rules are actually enforced for it:
//   hidden   — applies to data fetched into widgets (sales rows)
//   readOnly — applies to fields editable in a form (user profile)
const MODULE_FIELDS = {
  sales: {
    fields: ["id", "region", "product", "revenue", "cost", "margin", "customer", "rep", "date"],
    supports: ["hidden"],
  },
  users: {
    fields: ["username", "email"],
    supports: ["readOnly"],
  },
};

const findPerm = (perms, module) => perms.find((p) => p.module === module);

const RoleEditor = ({ role, onSave, onCancel }) => {
  const [name, setName] = useState(role.name || "");
  const [description, setDescription] = useState(role.description || "");
  const [permissions, setPermissions] = useState(role.permissions || []);
  const [fieldRules, setFieldRules] = useState(role.fieldRules || []);
  const [dashboard, setDashboard] = useState(
    role.dashboard || { canEditLayout: false, allowedWidgets: [] }
  );

  const togglePerm = (module, action) => {
    setPermissions((prev) => {
      const existing = findPerm(prev, module);
      if (!existing) {
        return [...prev, { module, actions: [action] }];
      }
      const has = existing.actions.includes(action);
      const newActions = has
        ? existing.actions.filter((a) => a !== action)
        : [...existing.actions, action];
      const next = prev.map((p) => (p.module === module ? { ...p, actions: newActions } : p));
      return next.filter((p) => p.actions.length > 0);
    });
  };

  const addFieldRule = (module) => {
    if (fieldRules.find((f) => f.module === module)) return;
    setFieldRules((prev) => [
      ...prev,
      { module, hiddenFields: [], readOnlyFields: [] },
    ]);
  };

  const removeFieldRule = (module) => {
    setFieldRules((prev) => prev.filter((f) => f.module !== module));
  };

  const toggleField = (module, field, kind) => {
    setFieldRules((prev) =>
      prev.map((f) => {
        if (f.module !== module) return f;
        const list = f[kind] || [];
        const has = list.includes(field);
        return {
          ...f,
          [kind]: has ? list.filter((x) => x !== field) : [...list, field],
        };
      })
    );
  };

  const toggleAllowedWidget = (w) => {
    setDashboard((d) => ({
      ...d,
      allowedWidgets: d.allowedWidgets.includes(w)
        ? d.allowedWidgets.filter((x) => x !== w)
        : [...d.allowedWidgets, w],
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSave({
      name: name.trim(),
      description,
      permissions,
      fieldRules,
      dashboard,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto thin-scroll">
      <div className="p-5 space-y-6">
        {/* Identity */}
        <section className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-slate-400 mb-1 block">Role name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full px-3 py-2 rounded-lg bg-slate-800/60 border border-white/10 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500/40"
              placeholder="e.g. Sales Lead"
            />
          </div>
          <div>
            <label className="text-xs text-slate-400 mb-1 block">Description</label>
            <input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-slate-800/60 border border-white/10 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500/40"
              placeholder="What this role is for"
            />
          </div>
        </section>

        {/* Permission matrix */}
        <section>
          <h3 className="font-semibold mb-2">Permissions matrix</h3>
          <p className="text-xs text-slate-400 mb-3">
            Pick which actions this role can perform on each module. The backend re-checks every
            request, not just the UI.
          </p>
          <div className="overflow-x-auto rounded-xl border border-white/10">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-800/60">
                <tr>
                  <th className="text-left px-3 py-2 font-medium">Module</th>
                  {ACTIONS.map((a) => (
                    <th key={a} className="px-3 py-2 font-medium text-center capitalize">
                      {a}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {MODULES.map((m) => {
                  const perm = findPerm(permissions, m);
                  const supported = SUPPORTED_ACTIONS[m] || [];
                  return (
                    <tr key={m} className="border-t border-white/5">
                      <td className="px-3 py-2 capitalize text-slate-200">{m}</td>
                      {ACTIONS.map((a) => {
                        const isSupported = supported.includes(a);
                        const checked = perm?.actions.includes(a) || false;
                        return (
                          <td key={a} className="px-3 py-2 text-center">
                            {isSupported ? (
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={() => togglePerm(m, a)}
                                className="size-4 accent-indigo-500"
                              />
                            ) : (
                              <span
                                className="text-slate-600 text-xs"
                                title="Not wired in this build"
                              >
                                —
                              </span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        {/* Field-level rules — only on data-bearing modules */}
        <section>
          <h3 className="font-semibold mb-2">Field-level rules</h3>
          <p className="text-xs text-slate-400 mb-3">
            Hide specific columns for this role. The backend strips these keys from the API
            response, so users can't bypass the rule by inspecting network traffic.
          </p>

          <div className="flex flex-wrap gap-2 mb-3">
            {Object.keys(MODULE_FIELDS).map((m) => {
              const exists = fieldRules.find((f) => f.module === m);
              return (
                <button
                  key={m}
                  type="button"
                  onClick={() => addFieldRule(m)}
                  disabled={Boolean(exists)}
                  className="text-xs px-3 py-1.5 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 disabled:opacity-40 disabled:cursor-not-allowed inline-flex items-center gap-1"
                >
                  <Plus className="size-3" />
                  {m}
                </button>
              );
            })}
          </div>

          <div className="space-y-3">
            {fieldRules.map((fr) => {
              const meta = MODULE_FIELDS[fr.module] || { fields: [], supports: [] };
              return (
                <div key={fr.module} className="rounded-xl border border-white/10 bg-slate-800/40 p-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="font-medium capitalize">{fr.module}</div>
                    <button
                      type="button"
                      onClick={() => removeFieldRule(fr.module)}
                      className="p-1 rounded hover:bg-rose-500/15 text-slate-300 hover:text-rose-300"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>

                  {meta.supports.includes("hidden") && (
                    <div className="mb-2">
                      <div className="text-xs text-slate-400 mb-1">
                        Hidden — server strips these from the response
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {meta.fields.map((f) => {
                          const on = fr.hiddenFields?.includes(f);
                          return (
                            <button
                              key={f}
                              type="button"
                              onClick={() => toggleField(fr.module, f, "hiddenFields")}
                              className={`text-[11px] px-2 py-1 rounded-md border transition ${
                                on
                                  ? "bg-rose-500/15 border-rose-500/40 text-rose-200"
                                  : "bg-white/5 border-white/10 text-slate-300 hover:bg-white/10"
                              }`}
                            >
                              {f}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {meta.supports.includes("readOnly") && (
                    <div>
                      <div className="text-xs text-slate-400 mb-1">
                        Read-only — server rejects edits to these fields
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {meta.fields.map((f) => {
                          const on = fr.readOnlyFields?.includes(f);
                          return (
                            <button
                              key={f}
                              type="button"
                              onClick={() => toggleField(fr.module, f, "readOnlyFields")}
                              className={`text-[11px] px-2 py-1 rounded-md border transition ${
                                on
                                  ? "bg-amber-500/15 border-amber-500/40 text-amber-200"
                                  : "bg-white/5 border-white/10 text-slate-300 hover:bg-white/10"
                              }`}
                            >
                              {f}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* Dashboard capabilities */}
        <section>
          <h3 className="font-semibold mb-2">Dashboard builder</h3>
          <label className="inline-flex items-center gap-2 mb-3">
            <input
              type="checkbox"
              checked={dashboard.canEditLayout}
              onChange={(e) =>
                setDashboard((d) => ({ ...d, canEditLayout: e.target.checked }))
              }
              className="size-4 accent-indigo-500"
            />
            <span className="text-sm">Can edit layout (drag, resize, add/remove widgets)</span>
          </label>
          <div className="text-xs text-slate-400 mb-1">Allowed widget types</div>
          <div className="flex flex-wrap gap-2">
            {WIDGETS.map((w) => {
              const on = dashboard.allowedWidgets?.includes(w);
              return (
                <button
                  key={w}
                  type="button"
                  onClick={() => toggleAllowedWidget(w)}
                  className={`text-xs px-3 py-1.5 rounded-md border transition capitalize ${
                    on
                      ? "bg-indigo-500/15 border-indigo-500/40 text-indigo-200"
                      : "bg-white/5 border-white/10 text-slate-300 hover:bg-white/10"
                  }`}
                >
                  {w}
                </button>
              );
            })}
          </div>
        </section>
      </div>

      <div className="px-5 py-3 border-t border-white/10 flex justify-end gap-2 bg-slate-950/60">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-sm"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-5 py-2 rounded-lg bg-gradient-to-r from-indigo-500 to-fuchsia-600 hover:from-indigo-400 hover:to-fuchsia-500 font-medium text-sm shadow-lg"
        >
          Save role
        </button>
      </div>
    </form>
  );
};

export default RoleEditor;
