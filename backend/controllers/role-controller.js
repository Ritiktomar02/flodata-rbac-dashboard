import mongoose from "mongoose";
import Role from "../models/role-model.js";
import AuditLog from "../models/audit-model.js";

export const getAllRoles = async (_req, res) => {
  try {
    const roles = await Role.find().sort({ createdAt: 1 });
    res.status(200).json({ success: true, roles });
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("Get roles error:", error);
    }
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const createRole = async (req, res) => {
  try {
    const { name, description, permissions, fieldRules, dashboard } = req.body;
    if (!name) return res.status(400).json({ message: "Role name required" });

    const exists = await Role.findOne({ name });
    if (exists) return res.status(400).json({ message: "Role name already exists" });

    const role = await Role.create({
      name,
      description: description || "",
      permissions: permissions || [],
      fieldRules: fieldRules || [],
      dashboard: dashboard || { canEditLayout: false, allowedWidgets: [] },
    });

    await AuditLog.create({
      actor: req.userId,
      actorName: req.user?.username,
      action: "role.create",
      target: role.name,
      details: { permissions, fieldRules, dashboard },
    });

    res.status(201).json({ success: true, role });
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("Create role error:", error);
    }
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const updateRole = async (req, res) => {
  try {
    const { roleId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(roleId)) {
      return res.status(400).json({ message: "Invalid role ID" });
    }

    const existing = await Role.findById(roleId);
    if (!existing) return res.status(404).json({ message: "Role not found" });

    if (existing.isSystem && existing.name === "Admin") {
      // Don't let anyone strip Admin's powers — that would be a permanent lockout.
      return res.status(400).json({ message: "Cannot modify the Admin system role" });
    }

    const { name, description, permissions, fieldRules, dashboard } = req.body;
    if (name) existing.name = name;
    if (description !== undefined) existing.description = description;
    if (permissions) existing.permissions = permissions;
    if (fieldRules) existing.fieldRules = fieldRules;
    if (dashboard) existing.dashboard = dashboard;

    await existing.save();

    await AuditLog.create({
      actor: req.userId,
      actorName: req.user?.username,
      action: "role.update",
      target: existing.name,
      details: { permissions, fieldRules, dashboard },
    });

    res.status(200).json({ success: true, role: existing });
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("Update role error:", error);
    }
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const deleteRole = async (req, res) => {
  try {
    const { roleId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(roleId)) {
      return res.status(400).json({ message: "Invalid role ID" });
    }

    const role = await Role.findById(roleId);
    if (!role) return res.status(404).json({ message: "Role not found" });
    if (role.isSystem) {
      return res.status(400).json({ message: "Cannot delete a system role" });
    }

    await Role.findByIdAndDelete(roleId);

    await AuditLog.create({
      actor: req.userId,
      actorName: req.user?.username,
      action: "role.delete",
      target: role.name,
    });

    res.status(200).json({ success: true, message: "Role deleted" });
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("Delete role error:", error);
    }
    res.status(500).json({ message: "Internal Server Error" });
  }
};
