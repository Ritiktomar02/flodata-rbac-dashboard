import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";

import User from "../models/user-model.js";
import AuditLog from "../models/audit-model.js";
import { generateTokenAndSetCookies } from "../utils/generateTokenAndSetCookies.js";

const sanitizeUser = (user) => ({
  _id: user._id,
  username: user.username,
  email: user.email,
  roles: user.roles,
});

const sanitizeUserWithRoles = (u) => ({
  ...sanitizeUser(u),
  roles: u.roles?.map((r) => ({ _id: r._id, name: r.name })),
});

// Flatten permission/fieldRule data for the frontend so it can gate UI.
// The backend remains the source of truth — UI checks are convenience.
const buildAuthSnapshot = (roles = []) => {
  const permissions = {};
  const fieldRules = {};
  let canEditLayout = false;
  const allowedWidgets = new Set();

  for (const role of roles) {
    for (const p of role.permissions || []) {
      if (!permissions[p.module]) permissions[p.module] = [];
      for (const a of p.actions) {
        if (!permissions[p.module].includes(a)) permissions[p.module].push(a);
      }
    }
    for (const fr of role.fieldRules || []) {
      if (!fieldRules[fr.module]) fieldRules[fr.module] = { hiddenFields: [], readOnlyFields: [] };
      for (const f of fr.hiddenFields || []) {
        if (!fieldRules[fr.module].hiddenFields.includes(f)) fieldRules[fr.module].hiddenFields.push(f);
      }
      for (const f of fr.readOnlyFields || []) {
        if (!fieldRules[fr.module].readOnlyFields.includes(f)) fieldRules[fr.module].readOnlyFields.push(f);
      }
    }
    if (role.dashboard?.canEditLayout) canEditLayout = true;
    for (const w of role.dashboard?.allowedWidgets || []) allowedWidgets.add(w);
  }

  return {
    permissions,
    fieldRules,
    dashboard: { canEditLayout, allowedWidgets: Array.from(allowedWidgets) },
  };
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const user = await User.findOne({ email }).select("+password").populate("roles");
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    generateTokenAndSetCookies(res, user._id);
    res.status(200).json({
      success: true,
      message: "Login successful",
      user: sanitizeUser(user),
      auth: buildAuthSnapshot(user.roles),
    });
  } catch (error) {
    if (process.env.NODE_ENV === "development") console.error("Login error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const logout = (_req, res) => {
  res.clearCookie("token", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
  });
  res.status(200).json({ message: "Logout successful" });
};

export const profile = async (req, res) => {
  try {
    const user = await User.findById(req.userId).populate("roles");
    if (!user) return res.status(404).json({ message: "User not found" });
    res.status(200).json({
      success: true,
      user: sanitizeUser(user),
      auth: buildAuthSnapshot(user.roles),
    });
  } catch (error) {
    if (process.env.NODE_ENV === "development") console.error("Profile error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const getAllUsers = async (_req, res) => {
  try {
    const users = await User.find().populate("roles");
    res.status(200).json({
      success: true,
      users: users.map(sanitizeUserWithRoles),
    });
  } catch (error) {
    if (process.env.NODE_ENV === "development") console.error("Get users error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const createUser = async (req, res) => {
  try {
    const { username, email, password, roleIds = [] } = req.body;
    if (!username || !email || !password) {
      return res.status(400).json({ message: "username, email, and password are required" });
    }
    if (password.length < 8) {
      return res.status(400).json({ message: "Password must be at least 8 characters" });
    }
    if (!Array.isArray(roleIds) || roleIds.some((id) => !mongoose.Types.ObjectId.isValid(id))) {
      return res.status(400).json({ message: "roleIds must be an array of valid ids" });
    }

    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ message: "User with this email already exists" });

    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({ username, email, password: hashed, roles: roleIds });

    await AuditLog.create({
      actor: req.userId,
      actorName: req.user?.username,
      action: "user.create",
      target: user.email,
    });

    const populated = await User.findById(user._id).populate("roles");
    res.status(201).json({ success: true, user: sanitizeUserWithRoles(populated) });
  } catch (error) {
    if (process.env.NODE_ENV === "development") console.error("Create user error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// Update a user's profile fields. The crucial bit: any field in the role's
// users.readOnlyFields list cannot be changed — even if the request includes
// a new value. This is the WRITE side of attribute-level access control.
export const updateUser = async (req, res) => {
  try {
    const { userId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }

    const { username, email } = req.body;
    const updates = {};
    if (username !== undefined) updates.username = username;
    if (email !== undefined) updates.email = email;

    const readOnly = req.fieldRules?.users?.readOnly || new Set();
    const blocked = Object.keys(updates).filter((k) => readOnly.has(k));
    if (blocked.length > 0) {
      return res.status(403).json({
        message: `These fields are read-only for your role: ${blocked.join(", ")}`,
      });
    }

    if (email) {
      const dup = await User.findOne({ email, _id: { $ne: userId } });
      if (dup) return res.status(400).json({ message: "Email is already taken" });
    }

    const user = await User.findByIdAndUpdate(userId, updates, { new: true }).populate("roles");
    if (!user) return res.status(404).json({ message: "User not found" });

    await AuditLog.create({
      actor: req.userId,
      actorName: req.user?.username,
      action: "user.update",
      target: user.email,
      details: updates,
    });

    res.status(200).json({ success: true, user: sanitizeUserWithRoles(user) });
  } catch (error) {
    if (process.env.NODE_ENV === "development") console.error("Update user error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const deleteUser = async (req, res) => {
  try {
    const { userId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }
    if (userId === req.userId.toString()) {
      return res.status(400).json({ message: "You cannot delete yourself" });
    }

    const user = await User.findByIdAndDelete(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    await AuditLog.create({
      actor: req.userId,
      actorName: req.user?.username,
      action: "user.delete",
      target: user.email,
    });

    res.status(200).json({ success: true, message: "User deleted" });
  } catch (error) {
    if (process.env.NODE_ENV === "development") console.error("Delete user error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const assignRoles = async (req, res) => {
  try {
    const { userId, roleIds } = req.body;
    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }
    if (!Array.isArray(roleIds) || roleIds.some((id) => !mongoose.Types.ObjectId.isValid(id))) {
      return res.status(400).json({ message: "roleIds must be an array of valid ids" });
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { roles: roleIds },
      { new: true }
    ).populate("roles");

    if (!user) return res.status(404).json({ message: "User not found" });

    await AuditLog.create({
      actor: req.userId,
      actorName: req.user?.username,
      action: "user.assign-roles",
      target: user.email,
      details: { roleIds },
    });

    res.status(200).json({ success: true, user: sanitizeUserWithRoles(user) });
  } catch (error) {
    if (process.env.NODE_ENV === "development") console.error("Assign roles error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};
