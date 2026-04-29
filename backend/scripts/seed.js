import dotenv from "dotenv";
dotenv.config();

import bcrypt from "bcrypt";
import mongoose from "mongoose";

import connectDB from "../config/db-connection.js";
import User from "../models/user-model.js";
import Role from "../models/role-model.js";
import Dashboard from "../models/dashboard-model.js";

const ROLES = [
  {
    name: "Admin",
    description: "Full access — manage users, roles, audit, and dashboards",
    isSystem: true,
    permissions: [
      { module: "users", actions: ["create", "read", "update", "delete"] },
      { module: "roles", actions: ["create", "read", "update", "delete"] },
      { module: "dashboard", actions: ["read", "update"] },
      { module: "sales", actions: ["read"] },
      { module: "audit", actions: ["read"] },
    ],
    fieldRules: [],
    dashboard: { canEditLayout: true, allowedWidgets: ["chart", "table", "stat"] },
  },
  {
    name: "Manager",
    description: "Manage users (read/update), full sales, edit own dashboard. Cannot change user emails.",
    isSystem: true,
    permissions: [
      { module: "users", actions: ["read", "update"] },
      { module: "dashboard", actions: ["read", "update"] },
      { module: "sales", actions: ["read"] },
    ],
    fieldRules: [
      // Manager can edit users, BUT email is read-only — they can't reassign
      // someone's login identity. Demonstrates write-side field protection.
      { module: "users", hiddenFields: [], readOnlyFields: ["email"] },
    ],
    dashboard: { canEditLayout: true, allowedWidgets: ["chart", "table", "stat"] },
  },
  {
    name: "Analyst",
    description: "Sales metrics without customer/rep PII, edit own dashboard",
    isSystem: true,
    permissions: [
      { module: "dashboard", actions: ["read", "update"] },
      { module: "sales", actions: ["read"] },
    ],
    fieldRules: [
      { module: "sales", hiddenFields: ["customer", "rep"] },
    ],
    dashboard: { canEditLayout: true, allowedWidgets: ["chart", "stat"] },
  },
  {
    name: "Viewer",
    description: "Top-line revenue only, dashboard view-only",
    isSystem: true,
    permissions: [
      { module: "dashboard", actions: ["read"] },
      { module: "sales", actions: ["read"] },
    ],
    fieldRules: [
      { module: "sales", hiddenFields: ["cost", "margin", "customer", "rep"] },
    ],
    dashboard: { canEditLayout: false, allowedWidgets: ["chart", "stat"] },
  },
];

const USERS = [
  { username: "Ada Admin",    email: "admin@flodata.test",   password: "Admin@123",   roleName: "Admin" },
  { username: "Mira Manager", email: "manager@flodata.test", password: "Manager@123", roleName: "Manager" },
  { username: "Anil Analyst", email: "analyst@flodata.test", password: "Analyst@123", roleName: "Analyst" },
  { username: "Vivek Viewer", email: "viewer@flodata.test",  password: "Viewer@123",  roleName: "Viewer" },
];

const seed = async () => {
  await connectDB();

  console.log("Wiping existing roles, users, dashboards...");
  await Promise.all([
    Role.deleteMany({}),
    User.deleteMany({}),
    Dashboard.deleteMany({}),
  ]);

  console.log("Inserting roles...");
  const roleDocs = await Role.insertMany(ROLES);
  const byName = Object.fromEntries(roleDocs.map((r) => [r.name, r]));

  console.log("Inserting users...");
  for (const u of USERS) {
    const hashed = await bcrypt.hash(u.password, 10);
    await User.create({
      username: u.username,
      email: u.email,
      password: hashed,
      roles: byName[u.roleName] ? [byName[u.roleName]._id] : [],
    });
  }

  console.log("\nDone. Seeded users:");
  for (const u of USERS) {
    console.log(`  ${u.email}  /  ${u.password}   (${u.roleName})`);
  }

  await mongoose.disconnect();
  process.exit(0);
};

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
