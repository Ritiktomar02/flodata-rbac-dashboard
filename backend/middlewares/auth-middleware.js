import jwt from "jsonwebtoken";
import User from "../models/user-model.js";

// Verifies the JWT, loads the user with their roles populated, and computes
// a flat permission set for downstream handlers. Doing this once per request
// means controllers only need to read req.permissions / req.fieldRules.
export const isUser = async (req, res, next) => {
  try {
    const token = req.cookies.token;
    if (!token) {
      return res.status(401).json({ success: false, message: "Unauthorized - no token" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.userId;

    const user = await User.findById(decoded.userId).populate("roles");
    if (!user) {
      return res.status(401).json({ success: false, message: "User not found" });
    }

    req.user = user;

    // Permissions = union of every assigned role's permissions.
    // fieldRules[module].hidden / readOnly = union across all assigned roles.
    const permissions = {};
    const fieldRules = {};
    for (const role of user.roles || []) {
      for (const p of role.permissions || []) {
        if (!permissions[p.module]) permissions[p.module] = new Set();
        for (const a of p.actions) permissions[p.module].add(a);
      }
      for (const fr of role.fieldRules || []) {
        if (!fieldRules[fr.module]) {
          fieldRules[fr.module] = { hidden: new Set(), readOnly: new Set() };
        }
        for (const f of fr.hiddenFields || []) fieldRules[fr.module].hidden.add(f);
        for (const f of fr.readOnlyFields || []) fieldRules[fr.module].readOnly.add(f);
      }
    }
    req.permissions = permissions;
    req.fieldRules = fieldRules;

    next();
  } catch (error) {
    if (error.name === "TokenExpiredError" || error.name === "JsonWebTokenError") {
      return res.status(401).json({ success: false, message: "Unauthorized - invalid token" });
    }
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// Guard a route by module + action. Backend's source of truth for authorization.
export const requirePermission = (module, action) => (req, res, next) => {
  if (!req.permissions?.[module]?.has(action)) {
    return res.status(403).json({
      success: false,
      message: `Forbidden - missing ${module}:${action}`,
    });
  }
  next();
};
