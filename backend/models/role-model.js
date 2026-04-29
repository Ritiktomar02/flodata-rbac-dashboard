import mongoose from "mongoose";

// Module-level + action-level permissions.
// Modules are open strings (Dashboard, Users, Roles, Reports, Sales, ...).
// Actions are CRUD verbs.
const permissionSchema = new mongoose.Schema(
  {
    module: { type: String, required: true },
    actions: [
      {
        type: String,
        enum: ["create", "read", "update", "delete"],
      },
    ],
  },
  { _id: false }
);

// Field-level access for a given module/dataset:
//   hiddenFields   — server strips these keys from the response (read protection)
//   readOnlyFields — server rejects updates that try to change these keys (write protection)
// Enforced on both API and UI; the UI also disables corresponding form inputs.
const fieldRuleSchema = new mongoose.Schema(
  {
    module: { type: String, required: true },
    hiddenFields: [String],
    readOnlyFields: [String],
  },
  { _id: false }
);

const roleSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    description: { type: String, default: "" },
    isSystem: { type: Boolean, default: false },
    permissions: [permissionSchema],
    fieldRules: [fieldRuleSchema],

    // Dashboard-builder capability flags. Kept separate from CRUD permissions
    // because the builder is more about UX-level control.
    dashboard: {
      canEditLayout: { type: Boolean, default: false },
      allowedWidgets: [String], // e.g. ["chart", "table", "stat"]
    },
  },
  { timestamps: true }
);

export default mongoose.model("Role", roleSchema);
