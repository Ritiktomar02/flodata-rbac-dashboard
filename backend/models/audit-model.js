import mongoose from "mongoose";

const auditSchema = new mongoose.Schema(
  {
    actor: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    actorName: String,
    action: String, // role.create, role.update, role.delete, user.assign-roles
    target: String, // role/user name or id
    details: Object,
  },
  { timestamps: true }
);

export default mongoose.model("AuditLog", auditSchema);
